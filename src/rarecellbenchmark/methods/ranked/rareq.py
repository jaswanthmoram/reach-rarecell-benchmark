"""
REACH - Ranked Method: RareQ
=========================================
Runs RareQ (Q-value-guided network propagation) on an AnnData object.
RareQ is an R package that identifies rare cell populations.
It outputs cluster assignments; we convert them to rarity scores.

Install:
    # In R:
    install.packages("remotes")
    remotes::install_github("fabotao/RareQ")
"""

from __future__ import annotations

import logging
import os
import subprocess
import tempfile
from pathlib import Path

import numpy as np
import pandas as pd

from rarecellbenchmark.methods.base import BaseMethodWrapper, MethodRunResult, validate_predictions
from rarecellbenchmark.methods.common import load_blind_adata, write_predictions, write_runmeta
from rarecellbenchmark.io.checksums import compute_checksum

logger = logging.getLogger(__name__)

RSCRIPT = Path(os.environ.get("RSCRIPT_PATH", "Rscript"))


class RareQWrapper(BaseMethodWrapper):
    """Wrapper for the RareQ R package."""

    method_id = "RareQ"
    supports_gpu = False
    consumes_labels = False

    def _get_safe_env(self):
        """Return env with R linear algebra limited to 1 thread."""
        env = os.environ.copy()
        env["OMP_NUM_THREADS"] = "1"
        env["OPENBLAS_NUM_THREADS"] = "1"
        env["MKL_NUM_THREADS"] = "1"
        env["GOTO_NUM_THREADS"] = "1"
        env["VECLIB_MAXIMUM_THREADS"] = "1"
        return env

    def _write_rareq_r_script(
        self,
        r_script_path: Path,
        input_csv: Path,
        output_csv: Path,
        seed: int,
    ) -> None:
        input_csv_r = Path(input_csv).as_posix()
        output_csv_r = Path(output_csv).as_posix()
        code = f"""
suppressPackageStartupMessages(library(RareQ))
library(Seurat)
set.seed({seed})

X <- as.matrix(read.csv("{input_csv_r}", row.names=1, check.names=FALSE))
sc_object <- CreateSeuratObject(counts = t(X), project = "rareq_run")
sc_object <- NormalizeData(sc_object)
sc_object <- FindVariableFeatures(sc_object, nfeatures = 2000)
sc_object <- ScaleData(sc_object)
sc_object <- RunPCA(sc_object, npcs = 50)
sc_object <- RunUMAP(sc_object, dims = 1:50)
sc_object <- FindNeighbors(
  object = sc_object,
  k.param = 20,
  compute.SNN = FALSE,
  prune.SNN = 0,
  reduction = "pca",
  dims = 1:50,
  force.recalc = FALSE,
  return.neighbor = TRUE
)

# Identify major and rare clusters
cluster <- FindRare(sc_object)
write.csv(data.frame(cell=rownames(X), cluster=cluster), "{output_csv_r}", row.names=FALSE)
"""
        r_script_path.write_text(code)

    def run(self, input_h5ad: Path, output_dir: Path, config: dict) -> MethodRunResult:
        seed = config.get("seed", 42)
        timeout = config.get("timeout", config.get("timeout_seconds", 3600))
        unit_id = config.get("unit_id", "unknown")

        adata = load_blind_adata(input_h5ad)
        self._start_memory()

        # Verify Rscript is available
        try:
            subprocess.run(
                [str(RSCRIPT), "--version"],
                capture_output=True,
                check=True,
            )
        except (subprocess.CalledProcessError, FileNotFoundError) as exc:
            raise RuntimeError(
                "Rscript is required for RareQ but was not found. "
                "Install R (https://cran.r-project.org/) and then run:\n"
                '  install.packages("remotes")\n'
                '  remotes::install_github("fabotao/RareQ")'
            ) from exc

        X = adata.X
        if hasattr(X, "toarray"):
            X = X.toarray()
        X = np.array(X, dtype=np.float32)

        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir = Path(tmpdir)
            input_csv = tmpdir / "input.csv"
            output_csv = tmpdir / "output.csv"
            r_script = tmpdir / "run_rareq.R"

            pd.DataFrame(X, index=adata.obs.index, columns=adata.var.index).to_csv(input_csv)
            self._write_rareq_r_script(r_script, input_csv, output_csv, seed)

            cmd = [str(RSCRIPT), str(r_script)]
            log_file = tmpdir / "rareq.log"
            kwargs = {}
            if os.name == "nt":
                si = subprocess.STARTUPINFO()
                si.dwFlags |= subprocess.STARTF_USESHOWWINDOW
                si.wShowWindow = subprocess.SW_HIDE
                kwargs["startupinfo"] = si
                kwargs["creationflags"] = subprocess.CREATE_NO_WINDOW

            try:
                with open(log_file, "w") as lf:
                    result = subprocess.run(
                        cmd,
                        stdin=subprocess.DEVNULL,
                        stdout=lf,
                        stderr=subprocess.STDOUT,
                        env=self._get_safe_env(),
                        timeout=timeout,
                        **kwargs,
                    )
            except subprocess.TimeoutExpired as exc:
                raise RuntimeError(
                    f"RareQ timed out after {timeout}s."
                ) from exc

            if result.returncode != 0 or not output_csv.exists():
                err_text = log_file.read_text()[-2000:] if log_file.exists() else ""
                raise RuntimeError(
                    f"RareQ R script failed (exit {result.returncode}):\n{err_text}"
                )

            df = pd.read_csv(output_csv)
            clusters = pd.Series(df["cluster"].values, index=df["cell"]).reindex(adata.obs.index)
            sizes = clusters.value_counts()
            total = len(clusters)
            scores = clusters.map(lambda c: 1.0 - (sizes[c] / total))
            if scores.max() > scores.min():
                scores = (scores - scores.min()) / (scores.max() - scores.min())

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
        )

        return MethodRunResult(
            method_id=self.method_id,
            unit_id=unit_id,
            predictions_path=pred_path,
            runmeta_path=meta_path,
            status="success",
        )
