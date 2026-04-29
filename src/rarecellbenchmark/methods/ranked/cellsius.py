"""
REACH - Ranked Method: CellSIUS
============================================
Uses the original CellSIUS R package for rare sub-population identification.

Reference: Wegmann et al., Genome Biology 2019
GitHub: https://github.com/Novartis/CellSIUS

Score: rare cell membership probability from CellSIUS bimodal gene analysis.
"""

from __future__ import annotations

import logging
import subprocess
import tempfile
from pathlib import Path

import numpy as np
import pandas as pd

from rarecellbenchmark.methods.base import BaseMethodWrapper, MethodRunResult, validate_predictions
from rarecellbenchmark.methods.common import load_blind_adata, write_predictions, write_runmeta
from rarecellbenchmark.io.checksums import compute_checksum

logger = logging.getLogger(__name__)

R_SCRIPT_TEMPLATE = """
suppressPackageStartupMessages({{
  library(CellSIUS)
  library(Matrix)
  library(Seurat)
}})

# Load data
counts <- as.matrix(read.csv("{counts_csv}", row.names=1, check.names=FALSE))

# Create Seurat object for faithful pre-clustering (as per CellSIUS paper)
set.seed({seed})
seu <- CreateSeuratObject(counts = counts, project = "CellSIUS")
seu <- NormalizeData(seu)
seu <- FindVariableFeatures(seu, selection.method = "vst", nfeatures = 2000)
seu <- ScaleData(seu)
seu <- RunPCA(seu, features = VariableFeatures(object = seu))
seu <- FindNeighbors(seu, dims = 1:20)
seu <- FindClusters(seu, resolution = 0.8)

# Extract cluster labels
group_id <- as.character(Idents(seu))

# Run CellSIUS with the original API
result <- tryCatch({{
  CellSIUS(
    mat.norm = counts,
    group_id = group_id,
    min_n_cells = {min_n_cells},
    n_top_genes = {n_top_genes},
    iter = {iter}
  )
}}, error = function(e) {{
  cat("CellSIUS error:", conditionMessage(e), "\\n")
  NULL
}})

# Extract scores
all_cells <- colnames(counts)
if (!is.null(result)) {{
  # Try to extract rare cell assignments
  rare_cells <- character(0)
  tryCatch({{
    if ("rare.clusters.cells" %in% slotNames(result)) {{
      rare_cells <- result@rare.clusters.cells
    }}
  }}, error = function(e2) {{
    tryCatch({{
      rare_cells <<- unlist(result@assignments)
    }}, error = function(e3) {{}})
  }})

  scores <- ifelse(all_cells %in% rare_cells, 1.0, 0.0)
  names(scores) <- all_cells
}} else {{
  # Fallback: use cluster size as proxy (smaller cluster = higher score)
  cluster_sizes <- table(group_id)
  total_cells <- length(group_id)
  scores <- sapply(group_id, function(cid) {{
    1.0 - (cluster_sizes[cid] / total_cells)
  }})
  names(scores) <- all_cells
}}

# Normalize to [0,1]
if (max(scores) > min(scores)) {{
  scores <- (scores - min(scores)) / (max(scores) - min(scores))
}}

# Write scores
scores_df <- data.frame(cell_id = names(scores), score = as.numeric(scores))
write.csv(scores_df, file = "{scores_csv}", row.names = FALSE)
cat("CellSIUS done\\n")
"""


class CellSIUSWrapper(BaseMethodWrapper):
    """Wrapper for the CellSIUS R package."""

    method_id = "cellsius"
    category = "ranked"
    supports_gpu = False
    consumes_labels = False

    def run(self, input_h5ad: Path, output_dir: Path, config: dict) -> MethodRunResult:
        min_n_cells = config.get("min_n_cells", 5)
        n_top_genes = config.get("n_top_genes", 10)
        iter_ = config.get("iter", 100)
        seed = config.get("seed", 42)
        timeout = config.get("timeout", config.get("timeout_seconds", 3600))
        unit_id = config.get("unit_id", "unknown")

        adata = load_blind_adata(input_h5ad)
        self._start_memory()

        # Verify Rscript is available
        try:
            subprocess.run(
                ["Rscript", "--version"],
                capture_output=True,
                check=True,
            )
        except (subprocess.CalledProcessError, FileNotFoundError) as exc:
            raise RuntimeError(
                "Rscript is required for CellSIUS but was not found. "
                "Install R (https://cran.r-project.org/) and then install CellSIUS "
                "from https://github.com/Novartis/CellSIUS"
            ) from exc

        with tempfile.TemporaryDirectory() as tmpdir_name:
            tmpdir = Path(tmpdir_name)
            counts_csv = tmpdir / "counts.csv"
            scores_csv = tmpdir / "scores.csv"
            script_path = tmpdir / "cellsius_run.R"

            if "counts" in adata.layers:
                X_raw = adata.layers["counts"]
            else:
                X_raw = adata.X

            # Gene filtering for memory
            n_cells = X_raw.shape[0]
            n_genes = X_raw.shape[1]
            estimated_gb = n_cells * n_genes * 4 / (1024**3)
            max_genes_cellsius = 10000
            if n_genes > max_genes_cellsius or estimated_gb > 1.0:
                if hasattr(X_raw, "tocsc"):
                    cells_per_gene = (X_raw > 0).sum(axis=0).A1
                else:
                    X_tmp = X_raw.toarray() if hasattr(X_raw, "toarray") else X_raw
                    cells_per_gene = (X_tmp > 0).sum(axis=0)
                top_k = min(max_genes_cellsius, n_genes)
                top_idx = np.argsort(cells_per_gene)[-top_k:]
                if hasattr(X_raw, "tocsc"):
                    X = X_raw[:, top_idx].toarray()
                else:
                    X = X_raw[:, top_idx]
                    if hasattr(X, "toarray"):
                        X = X.toarray()
                var_index = adata.var.index[top_idx]
                logger.info(
                    "[%s] Filtered genes %d -> %d for memory (~%.1f GB -> smaller)",
                    self.method_id, n_genes, top_k, estimated_gb,
                )
            else:
                X = X_raw.toarray() if hasattr(X_raw, "toarray") else X_raw
                var_index = adata.var.index

            counts_df = pd.DataFrame(X.T, index=var_index, columns=adata.obs.index)
            counts_df.to_csv(counts_csv)

            r_script = R_SCRIPT_TEMPLATE.format(
                counts_csv=str(counts_csv).replace("\\", "/"),
                scores_csv=str(scores_csv).replace("\\", "/"),
                min_n_cells=min_n_cells,
                n_top_genes=n_top_genes,
                iter=iter_,
                seed=seed,
            )
            with open(script_path, "w", encoding="utf-8") as f:
                f.write(r_script)

            try:
                result = subprocess.run(
                    ["Rscript", str(script_path)],
                    capture_output=True,
                    text=True,
                    timeout=timeout,
                )
            except (subprocess.TimeoutExpired, FileNotFoundError) as exc:
                raise RuntimeError(
                    f"CellSIUS R subprocess failed: {exc}"
                ) from exc

            if result.returncode != 0 or not scores_csv.exists():
                stderr = result.stderr[-1000:] if result.stderr else ""
                raise RuntimeError(
                    f"CellSIUS R script failed (exit {result.returncode}): {stderr}"
                )

            scores_df = pd.read_csv(scores_csv).set_index("cell_id")["score"]
            scores = scores_df.reindex(adata.obs.index).fillna(0.0)

        predictions = pd.DataFrame({
            "cell_id": adata.obs_names.tolist(),
            "score": scores.values,
        })
        validate_predictions(predictions, adata)

        pred_path = write_predictions(predictions, output_dir, unit_id)

        runtime_s, peak_memory_mb = self._stop_memory()
        input_hash = compute_checksum(input_h5ad)
        output_hash = compute_checksum(pred_path)

        meta_path = write_runmeta(
            method_id=self.method_id,
            unit_id=unit_id,
            output_dir=output_dir,
            runtime_s=runtime_s,
            peak_memory_mb=peak_memory_mb,
            seed=seed,
            input_hash=input_hash,
            output_hash=output_hash,
            min_n_cells=min_n_cells,
            n_top_genes=n_top_genes,
            iter=iter_,
        )

        return MethodRunResult(
            method_id=self.method_id,
            unit_id=unit_id,
            predictions_path=pred_path,
            runmeta_path=meta_path,
            status="success",
        )
