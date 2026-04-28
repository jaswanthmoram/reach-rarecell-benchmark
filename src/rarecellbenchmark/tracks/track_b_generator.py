"""
Track B: Synthetic Splatter Stress-Test Generator.

Calls R/splatter via subprocess when available; falls back to a simple
Gaussian synthetic generator using numpy/scipy. Full Splatter realism
requires the R package ``splatter`` (Bioconductor).
"""

from __future__ import annotations

import datetime
import hashlib
import json
import logging
import subprocess
import tempfile
from pathlib import Path
from typing import Any, Optional

import numpy as np
import pandas as pd

from rarecellbenchmark.tracks.base import BaseTrackGenerator
from rarecellbenchmark.tracks.seeding import MAX_SEED, get_track_seed

logger = logging.getLogger(__name__)

TIER_WINDOWS = {
    "T1": (0.05, 0.10),
    "T2": (0.01, 0.05),
    "T3": (0.001, 0.01),
    "T4": (0.0001, 0.001),
}

N_REPLICATES = 3

TRACK_B_RELEASE_POLICY = {
    "allow_mixed_backends": False,
    "require_splatter_for_release": True,
    "fallback_label": "gaussian_fallback_NOT_COMPARABLE",
    "policy_note": (
        "Track B units generated with the Gaussian fallback are NOT directly "
        "comparable to Splatter-generated units and must be excluded from "
        "public release unless explicitly allowed."
    ),
}

SPLATTER_R_SCRIPT = """
library(splatter)
library(SingleCellExperiment)

n_genes       <- {n_genes}
n_background  <- {n_background}
n_positive    <- {n_positive}
seed          <- {seed}
out_path      <- "{out_path}"

set.seed(seed)

params <- newSplatParams(
  nGenes = n_genes,
  batchCells = c(n_background, n_positive),
  group.prob = c(n_background / (n_background + n_positive),
                 n_positive / (n_background + n_positive)),
  de.prob = 0.3,
  de.facLoc = 0.5,
  de.facScale = 0.2,
  seed = seed
)

sim <- splatSimulateGroups(params, verbose = FALSE)

counts_mat <- counts(sim)
write.csv(as.data.frame(t(counts_mat)), file = out_path, row.names = TRUE)

meta <- data.frame(
  cell_id = colnames(sim),
  group = sim$Group,
  true_label = ifelse(sim$Group == "Group2", "positive", "background")
)
write.csv(meta, file = paste0(out_path, ".meta.csv"), row.names = FALSE)
cat("done\\n")
"""


class TrackBGenerator(BaseTrackGenerator):
    track_id = "B"

    def _unit_seed(self, base_seed: int, dataset_id: str, tier: str, replicate: int) -> int:
        base = get_track_seed(base_seed, self.track_id, dataset_id, replicate)
        tier_derived = int(hashlib.sha256(tier.encode()).hexdigest()[:8], 16) % MAX_SEED
        return int((base + tier_derived) % MAX_SEED)

    def generate(
        self,
        dataset_id: str,
        processed_h5ad: Path,
        out_dir: Path,
        config: dict[str, Any],
    ) -> list[Path]:
        import anndata as ad

        real_adata = ad.read_h5ad(processed_h5ad)
        out_dir = Path(out_dir)
        out_dir.mkdir(parents=True, exist_ok=True)

        tiers = config.get("tiers", list(TIER_WINDOWS.keys()))
        n_replicates = config.get("n_replicates", N_REPLICATES)
        base_seed = config.get("base_seed", 42)
        n_total = config.get("n_total", 5000)
        n_genes = config.get("n_genes", 2000)

        manifests = []
        unit_dirs: list[Path] = []

        for tier in tiers:
            logger.info(f"[{dataset_id}] Track B tier {tier} ({n_replicates} replicates)...")
            for rep in range(1, n_replicates + 1):
                seed = self._unit_seed(base_seed, dataset_id, tier, rep)
                manifest = self._generate_unit(
                    dataset_id=dataset_id,
                    real_adata=real_adata,
                    tier=tier,
                    replicate=rep,
                    out_dir=out_dir,
                    seed=seed,
                    n_total=n_total,
                    n_genes=n_genes,
                )
                manifests.append(manifest)
                if manifest.get("status") == "success":
                    unit_dirs.append(out_dir)

        self._write_summary(out_dir, manifests, base_seed)
        n_ok = sum(1 for m in manifests if m.get("status") == "success")
        n_fallback = sum(1 for m in manifests if m.get("simulation_method") == "gaussian_fallback")
        logger.info(
            f"[{dataset_id}] Track B: {n_ok}/{len(manifests)} units generated "
            f"({len(manifests) - n_fallback} Splatter, {n_fallback} Gaussian fallback)"
        )
        return unit_dirs

    def _generate_unit(
        self,
        dataset_id: str,
        real_adata,
        tier: str,
        replicate: int,
        out_dir: Path,
        seed: int,
        n_total: int = 5000,
        n_genes: int = 2000,
    ) -> dict:
        try:
            import anndata as ad
            import scanpy as sc
        except ImportError:
            return {"status": "failed_no_scanpy"}
        _ = (ad, sc)

        tier_min, tier_max = TIER_WINDOWS[tier]
        rng = np.random.default_rng(seed)
        prevalence = float(rng.uniform(tier_min, tier_max))

        min_n_for_tier = max(n_total, int(5 / tier_min))
        n_total = min_n_for_tier

        _MEM_BUDGET_BYTES = 150 * 1024 * 1024
        _max_genes_for_mem = max(500, _MEM_BUDGET_BYTES // (n_total * 4))
        n_genes = min(n_genes, _max_genes_for_mem)

        n_positive = max(1, int(round(prevalence * n_total)))
        n_background = n_total - n_positive

        unit_id = f"{dataset_id}_track_b_{tier}_rep{replicate:02d}"
        unit_out_dir = out_dir / unit_id
        unit_out_dir.mkdir(parents=True, exist_ok=True)

        synthetic = self._run_splatter(
            n_background=n_background,
            n_positive=n_positive,
            n_genes=n_genes,
            seed=seed,
            out_dir=unit_out_dir,
        )
        simulation_method = "splatter"

        if synthetic is None:
            logger.warning(f"[{unit_id}] Splatter unavailable. Using fallback Gaussian simulation.")
            synthetic = self._gaussian_fallback(n_background, n_positive, n_genes, seed)
            simulation_method = "gaussian_fallback"
            _release_comparable = False
        else:
            _release_comparable = True

        try:
            audit = self._realism_audit(synthetic, real_adata)
        except Exception as e:
            logger.warning(f"[{unit_id}] Realism audit failed: {e}")
            audit = {"error": str(e), "realism_pass": None}

        if "true_label" in synthetic.obs.columns:
            true_labels = synthetic.obs["true_label"].copy()
        else:
            true_labels = pd.Series(
                ["positive"] * n_positive + ["background"] * n_background,
                index=synthetic.obs.index,
            )

        actual_n_positive = int((true_labels == "positive").sum())
        actual_n_background = int((true_labels == "background").sum())
        actual_n_total = actual_n_positive + actual_n_background
        actual_prevalence = actual_n_positive / actual_n_total if actual_n_total > 0 else 0.0

        if not (tier_min <= actual_prevalence <= tier_max):
            logger.warning(
                f"[{unit_id}] Actual prevalence {actual_prevalence:.6f} outside "
                f"{tier} window [{tier_min}, {tier_max}]. Trimming cells."
            )
            synthetic, true_labels = self._trim_to_prevalence(
                synthetic, true_labels, tier_min, tier_max, seed=seed
            )
            actual_n_positive = int((true_labels == "positive").sum())
            actual_n_background = int((true_labels == "background").sum())
            actual_n_total = synthetic.n_obs
            actual_prevalence = actual_n_positive / actual_n_total if actual_n_total > 0 else 0.0

        for col in ["true_label", "group", "Group", "cell_origin", "source_annotation"]:
            if col in synthetic.obs.columns:
                del synthetic.obs[col]

        expr_path = out_dir / f"{unit_id}_expression.h5ad"
        synthetic.write_h5ad(expr_path, compression="gzip")

        labels_path = out_dir / f"{unit_id}_labels.parquet"
        true_labels.to_frame("true_label").to_parquet(labels_path)

        manifest = {
            "unit_id": unit_id,
            "dataset_id": dataset_id,
            "track": "B",
            "tier": tier,
            "replicate": replicate,
            "n_positive": actual_n_positive,
            "n_background": actual_n_background,
            "n_total": actual_n_total,
            "prevalence": float(actual_prevalence),
            "seed": int(seed),
            "simulation_method": simulation_method,
            "release_comparable": _release_comparable,
            "realism_audit": audit,
            "status": "success",
            "note": "SECONDARY track - not included in primary leaderboard",
        }
        if not _release_comparable:
            manifest["backend_warning"] = TRACK_B_RELEASE_POLICY["policy_note"]

        manifest_path = out_dir / f"{unit_id}_manifest.json"
        with open(manifest_path, "w") as f:
            json.dump(manifest, f, indent=2, default=str)

        return manifest

    def _run_splatter(
        self,
        n_background: int,
        n_positive: int,
        n_genes: int = 2000,
        seed: int = 42,
        out_dir: Optional[Path] = None,
    ):
        try:
            import anndata as ad
        except ImportError:
            logger.error("anndata not available")
            return None

        if out_dir is None:
            out_dir = Path(tempfile.mkdtemp())
        out_dir = Path(out_dir)
        out_dir.mkdir(parents=True, exist_ok=True)

        csv_path = out_dir / "splatter_counts.csv"
        r_script = SPLATTER_R_SCRIPT.format(
            n_genes=n_genes,
            n_background=n_background,
            n_positive=n_positive,
            seed=seed,
            out_path=str(csv_path).replace("\\", "/"),
        )

        script_path = out_dir / "splatter_run.R"
        with open(script_path, "w") as f:
            f.write(r_script)

        result = subprocess.run(
            ["Rscript", str(script_path)], capture_output=True, text=True, timeout=300
        )

        if result.returncode != 0:
            logger.error(f"Splatter R script failed: {result.stderr}")
            return None

        if not csv_path.exists():
            logger.error("Splatter did not produce output CSV")
            return None

        counts_df = pd.read_csv(csv_path, index_col=0)
        meta_df = pd.read_csv(str(csv_path) + ".meta.csv")

        obs = meta_df.set_index("cell_id")
        adata = ad.AnnData(
            X=counts_df.loc[obs.index].values.astype(float),
            obs=obs,
            var=pd.DataFrame(index=counts_df.columns),
        )
        adata.var["gene_name"] = adata.var.index.astype(str)
        return adata

    def _realism_audit(self, synthetic_adata, real_adata, n_genes_check: int = 100) -> dict:
        from scipy import stats

        _MAX_CELLS = 2000

        def _subsample(adata, max_cells):
            if adata.n_obs <= max_cells:
                return adata
            rng = np.random.default_rng(42)
            idx = rng.choice(adata.n_obs, size=max_cells, replace=False)
            return adata[idx]

        def _get_mean_var_zeros(adata, layer="counts"):
            adata_sub = _subsample(adata, _MAX_CELLS)
            if layer in adata_sub.layers:
                X = adata_sub.layers[layer]
            else:
                X = adata_sub.X
            if hasattr(X, "toarray"):
                X = X.toarray()
            elif hasattr(X, "A"):
                X = X.A
            X = np.asarray(X, dtype=np.float64)
            return (
                np.mean(X, axis=0),
                np.var(X, axis=0),
                np.mean(X == 0),
            )

        syn_mean, syn_var, syn_zero = _get_mean_var_zeros(synthetic_adata)
        real_mean, real_var, real_zero = _get_mean_var_zeros(real_adata)

        n_common = min(len(syn_mean), len(real_mean), n_genes_check)
        syn_mean, real_mean = syn_mean[:n_common], real_mean[:n_common]
        syn_var, real_var = syn_var[:n_common], real_var[:n_common]

        mean_corr = float(stats.pearsonr(syn_mean, real_mean)[0]) if n_common > 1 else 0.0
        var_corr = float(stats.pearsonr(syn_var, real_var)[0]) if n_common > 1 else 0.0
        zero_diff = float(abs(syn_zero - real_zero))

        def _lib_size(adata):
            adata_sub = _subsample(adata, _MAX_CELLS)
            X = adata_sub.layers.get("counts", adata_sub.X)
            if hasattr(X, "toarray"):
                X = X.toarray()
            elif hasattr(X, "A"):
                X = X.A
            X = np.asarray(X, dtype=np.float64)
            return np.sum(X, axis=1)

        syn_lib = _lib_size(synthetic_adata)
        real_lib = _lib_size(real_adata)
        ks_stat, ks_pval = stats.ks_2samp(syn_lib, real_lib)

        audit = {
            "mean_expr_correlation": mean_corr,
            "variance_correlation": var_corr,
            "zero_fraction_match": 1.0 - zero_diff,
            "library_size_ks_pvalue": float(ks_pval),
            "n_genes_compared": n_common,
            "realism_pass": (
                mean_corr > 0.5 and var_corr > 0.3 and zero_diff < 0.2 and ks_pval > 0.01
            ),
        }
        return audit

    def _trim_to_prevalence(self, adata, true_labels, tier_min, tier_max, seed=0):
        rng = np.random.default_rng(seed)
        labels = true_labels.values.copy()
        n_total = len(labels)
        n_positive = int((labels == "positive").sum())
        prevalence = n_positive / n_total

        max_removals = min(n_total // 3, 500)

        for _ in range(max_removals):
            if tier_min <= prevalence <= tier_max:
                break

            if prevalence > tier_max and n_positive > 1:
                pos_idx = np.where(labels == "positive")[0]
                rm = rng.choice(pos_idx, size=1, replace=False)[0]
                keep = np.ones(n_total, dtype=bool)
                keep[rm] = False
                adata = adata[keep]
                labels = labels[keep]
                n_positive -= 1
                n_total -= 1
                prevalence = n_positive / n_total
            elif prevalence < tier_min and (n_total - n_positive) > 1:
                bg_idx = np.where(labels == "background")[0]
                rm = rng.choice(bg_idx, size=1, replace=False)[0]
                keep = np.ones(n_total, dtype=bool)
                keep[rm] = False
                adata = adata[keep]
                labels = labels[keep]
                n_total -= 1
                prevalence = n_positive / n_total
            else:
                break

        new_labels = pd.Series(labels, index=adata.obs.index)
        return adata, new_labels

    def _gaussian_fallback(self, n_background: int, n_positive: int, n_genes: int, seed: int):
        import anndata as ad
        from scipy import sparse

        rng = np.random.default_rng(seed)
        n_total = n_background + n_positive

        bg_counts = rng.poisson(lam=2.0, size=(n_background, n_genes)).astype(np.float32)
        n_de_genes = max(10, n_genes // 10)
        pos_counts = rng.poisson(lam=2.0, size=(n_positive, n_genes)).astype(np.float32)
        pos_counts[:, :n_de_genes] += rng.poisson(
            lam=5.0, size=(n_positive, n_de_genes)
        ).astype(np.float32)

        counts = np.vstack([bg_counts, pos_counts])
        del bg_counts, pos_counts

        labels = ["background"] * n_background + ["positive"] * n_positive

        obs = pd.DataFrame(
            {
                "true_label": labels,
                "cell_type": ["background"] * n_background + ["positive"] * n_positive,
            },
            index=[f"cell_{i}" for i in range(n_total)],
        )

        var = pd.DataFrame(index=[f"gene_{i}" for i in range(n_genes)])
        X = sparse.csr_matrix(counts)
        del counts

        adata = ad.AnnData(X=X, obs=obs, var=var)
        adata.var["gene_name"] = adata.var.index
        return adata

    def _write_summary(self, out_dir: Path, manifests: list[dict], base_seed: int) -> None:
        successful = [m for m in manifests if m.get("status") == "success"]
        prevalences = [m["prevalence"] for m in successful]
        tier_dist: dict[str, int] = {}
        for m in successful:
            tier = m.get("tier", "unknown")
            tier_dist[tier] = tier_dist.get(tier, 0) + 1

        summary = {
            "track": self.track_id,
            "n_units": len(successful),
            "n_datasets": 1,
            "prevalence_range": [
                float(min(prevalences)),
                float(max(prevalences)),
            ] if prevalences else [None, None],
            "tier_distribution": tier_dist,
            "generation_seed": base_seed,
            "generation_date": datetime.datetime.now().isoformat(),
        }
        with open(out_dir / "track_summary.json", "w") as f:
            json.dump(summary, f, indent=2)
