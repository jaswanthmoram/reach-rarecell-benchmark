"""
Track D: Natural Blood/CTC Prevalence Generator.

Uses datasets such as mm_ledergor and breast_ctc_szczerba at their natural
prevalence (U_obs) or diluted into a PBMC bank (U2-U4).
"""

from __future__ import annotations

import datetime
import hashlib
import json
import logging
from pathlib import Path
from typing import Any, Optional

import numpy as np
import pandas as pd

from rarecellbenchmark.tracks.base import BaseTrackGenerator
from rarecellbenchmark.tracks.seeding import MAX_SEED, get_track_seed

logger = logging.getLogger(__name__)

PREVALENCE_TIERS = {
    "U_obs": None,
    "U2": 0.01,
    "U3": 0.001,
    "U4": 0.0001,
}

MIN_CTC_FOR_TIER = {
    "U_obs": 5,
    "U2": 5,
    "U3": 5,
    "U4": 5,
}

N_REPLICATES = 5
PBMC_BANK_PROVENANCE_FILENAME = "pbmc_bank.provenance.json"

PBMC_BANK_REGISTRY: dict[str, Any] = {
    "source": "10x Genomics",
    "dataset_name": "10k Human PBMCs, 3' v3.1, Chromium X",
    "download_url": "https://www.10xgenomics.com/datasets/10k-human-pbmcs-3-v3-1-chromium-x-3-1-standard",
    "expected_files": ["10k_PBMC_3p_nextgem_Chromium_X_filtered_feature_bc_matrix.h5"],
    "expected_cell_count_approx": 11769,
    "genome": "GRCh38",
    "chemistry": "3' v3.1",
    "acquisition_date": "2022-04-26",
    "version": "2022-04-26",
    "source_sha256_h5": "",
    "provenance_manifest": PBMC_BANK_PROVENANCE_FILENAME,
}


def _sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def _pbmc_provenance_path(pbmc_bank_path: Path) -> Path:
    return pbmc_bank_path.with_name(PBMC_BANK_PROVENANCE_FILENAME)


def _write_pbmc_provenance_manifest(
    pbmc_bank_path: Path,
    source_h5_path: Optional[Path],
) -> Path:
    manifest_path = _pbmc_provenance_path(pbmc_bank_path)
    payload = {
        "registry": PBMC_BANK_REGISTRY,
        "built_h5ad": {
            "path": str(pbmc_bank_path),
            "sha256": _sha256_file(pbmc_bank_path),
        },
        "source_h5": None,
    }
    if source_h5_path and source_h5_path.exists():
        payload["source_h5"] = {
            "path": str(source_h5_path),
            "sha256": _sha256_file(source_h5_path),
        }
    with open(manifest_path, "w") as fh:
        json.dump(payload, fh, indent=2)
    return manifest_path


def _validate_pbmc_registry(pbmc_bank_path: Optional[Path] = None) -> list[str]:
    warnings_out: list[str] = []
    manifest_exists = False
    if pbmc_bank_path:
        manifest_exists = _pbmc_provenance_path(Path(pbmc_bank_path)).exists()

    if not PBMC_BANK_REGISTRY.get("source_sha256_h5") and not manifest_exists:
        warnings_out.append(
            "PBMC-bank provenance is not fully pinned yet. "
            "Provide PBMC_BANK_REGISTRY['source_sha256_h5'] for an upstream file pin, "
            "or build the bank once so the local provenance sidecar is written."
        )
    if not PBMC_BANK_REGISTRY.get("acquisition_date"):
        warnings_out.append("PBMC_BANK_REGISTRY['acquisition_date'] is blank.")
    if pbmc_bank_path and Path(pbmc_bank_path).exists() and not manifest_exists:
        warnings_out.append(
            f"PBMC bank exists at {pbmc_bank_path} but the provenance sidecar "
            f"{PBMC_BANK_PROVENANCE_FILENAME} is missing."
        )
    return warnings_out


class TrackDGenerator(BaseTrackGenerator):
    track_id = "D"

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

        ctc_adata = ad.read_h5ad(processed_h5ad)
        out_dir = Path(out_dir)
        out_dir.mkdir(parents=True, exist_ok=True)

        ctc_mask = config["ctc_mask"]
        pbmc_bank_path = config.get("pbmc_bank_path")
        tiers = config.get("tiers", ["U_obs", "U2", "U3"])
        n_replicates = config.get("n_replicates", N_REPLICATES)
        base_seed = config.get("base_seed", 42)

        for w in _validate_pbmc_registry(pbmc_bank_path):
            logger.warning(f"[Track D provenance] {w}")

        pbmc_bank = None
        if pbmc_bank_path and Path(pbmc_bank_path).exists():
            try:
                pbmc_bank = ad.read_h5ad(pbmc_bank_path)
            except Exception as e:
                logger.warning(f"Could not load PBMC bank: {e}")

        manifests = []
        unit_dirs: list[Path] = []

        for tier in tiers:
            for rep in range(1, n_replicates + 1):
                seed = self._unit_seed(base_seed, dataset_id, tier, rep)
                manifest = self._generate_unit(
                    ctc_adata=ctc_adata,
                    ctc_mask=ctc_mask,
                    pbmc_bank=pbmc_bank,
                    tier=tier,
                    dataset_id=dataset_id,
                    replicate=rep,
                    out_dir=out_dir,
                    seed=seed,
                )
                manifests.append(manifest)
                if manifest.get("status") == "success":
                    unit_dirs.append(out_dir)

        self._write_summary(out_dir, manifests, base_seed)
        n_ok = sum(1 for m in manifests if m.get("status") == "success")
        logger.info(f"[{dataset_id}] Track D: {n_ok}/{len(manifests)} units generated")
        return unit_dirs

    def _generate_unit(
        self,
        ctc_adata,
        ctc_mask: pd.Series,
        pbmc_bank,
        tier: str,
        dataset_id: str,
        replicate: int,
        out_dir: Path,
        seed: int,
    ) -> dict:
        try:
            import anndata as ad
        except ImportError:
            return {"status": "failed_no_anndata"}

        out_dir = Path(out_dir)
        out_dir.mkdir(parents=True, exist_ok=True)
        rng = np.random.default_rng(seed)

        n_ctc = int(ctc_mask.sum())

        if n_ctc < MIN_CTC_FOR_TIER.get(tier, 5):
            return {
                "status": "skipped_insufficient_ctc",
                "dataset_id": dataset_id,
                "tier": tier,
                "n_ctc": n_ctc,
            }

        unit_id = f"{dataset_id}_track_d_{tier}_rep{replicate:02d}"
        target_prevalence = PREVALENCE_TIERS[tier]

        if tier == "U_obs":
            unit_adata = ctc_adata.copy()
            true_labels = pd.Series("background", index=unit_adata.obs.index)
            true_labels[ctc_mask[ctc_mask].index] = "positive"
            actual_prevalence = float(n_ctc / len(ctc_adata))
            n_same_study_bg_total = 0
            n_pbmc_avail = 0
            n_total_bg_avail = 0
            n_ctc_use = n_ctc
        else:
            assert target_prevalence is not None
            if pbmc_bank is None:
                logger.warning(
                    f"[{unit_id}] PBMC bank not available for {tier} dilution. Skipping."
                )
                return {
                    "status": "skipped_no_pbmc_bank",
                    "dataset_id": dataset_id,
                    "tier": tier,
                }

            ctc_indices = np.where(ctc_mask.values)[0]
            n_same_study_bg_total = int((~ctc_mask).sum())
            n_pbmc_avail = pbmc_bank.n_obs
            n_total_bg_avail = n_same_study_bg_total + n_pbmc_avail

            n_ctc_for_target = int(target_prevalence * n_total_bg_avail / (1.0 - target_prevalence))
            n_ctc_heuristic = max(MIN_CTC_FOR_TIER.get(tier, 5), int(n_ctc * 0.8))
            n_ctc_use = min(n_ctc, n_ctc_heuristic, max(MIN_CTC_FOR_TIER.get(tier, 5), n_ctc_for_target))
            n_ctc_use = max(n_ctc_use, MIN_CTC_FOR_TIER.get(tier, 5))
            sampled_ctc_indices = rng.choice(ctc_indices, size=n_ctc_use, replace=False)
            ctc_subset = ctc_adata[sampled_ctc_indices]

            n_pbmc_needed = int(n_ctc_use / target_prevalence) - n_ctc_use
            n_pbmc_available = pbmc_bank.n_obs
            n_same_study_bg = (~ctc_mask).sum() - n_ctc
            n_same_study_bg_to_use = min(n_pbmc_needed, max(0, n_same_study_bg - n_ctc_use))
            n_pbmc_still_needed = n_pbmc_needed - n_same_study_bg_to_use
            n_pbmc_still_needed = min(n_pbmc_still_needed, n_pbmc_available)
            n_bg_total = n_same_study_bg_to_use + n_pbmc_still_needed

            if n_bg_total < 10:
                return {
                    "status": "skipped_insufficient_pbmc",
                    "dataset_id": dataset_id,
                    "tier": tier,
                }

            all_bg_indices = np.where(~ctc_mask.values)[0]
            available_bg_indices = np.setdiff1d(all_bg_indices, sampled_ctc_indices)

            if n_same_study_bg_to_use > 0 and len(available_bg_indices) > 0:
                n_same_study_bg_to_use = min(n_same_study_bg_to_use, len(available_bg_indices))
                sampled_bg_indices = rng.choice(
                    available_bg_indices, size=n_same_study_bg_to_use, replace=False
                )
            else:
                sampled_bg_indices = np.array([], dtype=int)
                n_same_study_bg_to_use = 0

            if n_pbmc_still_needed > 0:
                pbmc_indices = rng.choice(n_pbmc_available, size=n_pbmc_still_needed, replace=False)
                pbmc_subset = pbmc_bank[pbmc_indices]
            else:
                pbmc_subset = None

            ctc_aligned = ctc_subset
            common_genes = ctc_subset.var.index
            parts = [ctc_aligned]

            if n_same_study_bg_to_use > 0:
                same_study_bg = ctc_adata[sampled_bg_indices]
                common_genes = common_genes.intersection(same_study_bg.var.index)
                parts.append(same_study_bg)

            if pbmc_subset is not None:
                common_genes = common_genes.intersection(pbmc_subset.var.index)
                parts.append(pbmc_subset)

            if len(common_genes) < 100:
                return {
                    "status": "skipped_insufficient_common_genes",
                    "n_common_genes": int(len(common_genes)),
                }

            aligned_parts = [p[:, common_genes] for p in parts]
            labels_for_concat = (
                ["ctc"]
                + ["same_study_bg"] * (len(aligned_parts) - 1 - (1 if pbmc_subset else 0))
                + (["pbmc"] if pbmc_subset else [])
            )
            unit_adata = ad.concat(
                aligned_parts,
                axis=0,
                label="cell_origin",
                keys=labels_for_concat,
            )

            actual_prevalence = n_ctc_use / (n_ctc_use + n_bg_total)
            true_labels = pd.Series("background", index=unit_adata.obs.index)
            true_labels[unit_adata.obs["cell_origin"] == "ctc"] = "positive"

        shift_diagnostic = (
            self._compute_shift_diagnostic(unit_adata, true_labels) if tier != "U_obs" else {}
        )

        expr_adata = unit_adata.copy()
        for col in ["true_label", "cell_origin"]:
            if col in expr_adata.obs.columns:
                del expr_adata.obs[col]

        expr_path = out_dir / f"{unit_id}_expression.h5ad"
        expr_adata.write_h5ad(expr_path, compression="gzip")

        labels_path = out_dir / f"{unit_id}_labels.parquet"
        true_labels.to_frame("true_label").to_parquet(labels_path)

        manifest = {
            "unit_id": unit_id,
            "dataset_id": dataset_id,
            "track": "D",
            "tier": tier,
            "target_prevalence": target_prevalence,
            "actual_prevalence": float(actual_prevalence),
            "prevalence": float(actual_prevalence),
            "replicate": replicate,
            "n_positive": int((true_labels == "positive").sum()),
            "n_background": int((true_labels == "background").sum()),
            "n_total": int(len(true_labels)),
            "seed": int(seed),
            "shift_diagnostic": shift_diagnostic,
            "status": "success",
        }

        if tier != "U_obs" and target_prevalence is not None:
            if actual_prevalence > target_prevalence * 1.5:
                manifest["pbmc_bank_limitation"] = (
                    f"Target prevalence {target_prevalence} could not be reached. "
                    f"PBMC bank has {pbmc_bank.n_obs} cells but "
                    f"{int(n_ctc_use / target_prevalence) - n_ctc_use} were needed. "
                    f"Actual prevalence is {actual_prevalence:.4f}."
                )
            if n_ctc_use < int(n_ctc * 0.8):
                manifest["adaptive_ctc_selection"] = (
                    f"Used {n_ctc_use} of {n_ctc} available CTCs (reduced from 80% heuristic "
                    f"of {int(n_ctc * 0.8)}) to achieve target prevalence {target_prevalence} "
                    f"with {n_total_bg_avail} available background cells "
                    f"({n_same_study_bg_total} same-study + {n_pbmc_avail} PBMC bank)."
                )

        manifest_path = out_dir / f"{unit_id}_manifest.json"
        with open(manifest_path, "w") as f:
            json.dump(manifest, f, indent=2, default=str)

        logger.info(
            f"[{dataset_id}] Track D {tier} rep {replicate}: "
            f"prev={actual_prevalence:.4f}, n={manifest['n_total']}"
        )
        return manifest

    def _compute_shift_diagnostic(
        self, adata, labels: pd.Series, max_cells: int = 2000
    ) -> dict:
        try:
            pos_mask = labels == "positive"
            neg_mask = labels == "background"

            if pos_mask.sum() < 2 or neg_mask.sum() < 2:
                return {}

            rng = np.random.default_rng(0)
            n_sub = min(max_cells, adata.n_obs)
            if n_sub < adata.n_obs:
                idx = rng.choice(adata.n_obs, size=n_sub, replace=False)
                adata_sub = adata[idx]
                labels_sub = labels.iloc[idx]
                pos_mask = labels_sub == "positive"
                neg_mask = labels_sub == "background"
            else:
                adata_sub = adata

            X = adata_sub.X
            if hasattr(X, "toarray"):
                X = X.toarray()

            pos_mean = np.mean(X[pos_mask.values], axis=0)
            neg_mean = np.mean(X[neg_mask.values], axis=0)
            mean_diff = np.mean(np.abs(pos_mean - neg_mean))
            return {
                "mean_expression_shift": float(mean_diff),
                "n_positive": int(pos_mask.sum()),
                "n_background": int(neg_mask.sum()),
            }
        except Exception as e:
            return {"error": str(e)}

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

    @staticmethod
    def build_pbmc_bank(
        pbmc_data_dir: Path,
        out_path: Path,
        n_cells: int = 10000,
        seed: int = 42,
    ) -> Optional[object]:
        try:
            import anndata as ad
            import scanpy as sc
        except ImportError:
            return None

        pbmc_data_dir = Path(pbmc_data_dir)
        out_path = Path(out_path)
        h5_files = list(pbmc_data_dir.glob("*.h5")) if pbmc_data_dir.exists() else []

        if out_path.exists():
            logger.info(f"PBMC bank already exists: {out_path}")
            manifest_path = _write_pbmc_provenance_manifest(
                out_path,
                h5_files[0] if h5_files else None,
            )
            logger.info(f"PBMC bank provenance sidecar refreshed: {manifest_path}")
            return ad.read_h5ad(out_path)

        if not pbmc_data_dir.exists():
            logger.warning(
                f"PBMC bank data not found: {pbmc_data_dir}\n"
                f"Download 10x PBMC 10k dataset and place in {pbmc_data_dir}\n"
                f"URL: https://www.10xgenomics.com/datasets/10k-human-pbmcs-3-v3-1-chromium-x-3-1-standard"
            )
            return None

        try:
            if h5_files:
                adata = sc.read_10x_h5(h5_files[0])
            else:
                adata = sc.read_10x_mtx(str(pbmc_data_dir), var_names="gene_symbols")

            adata.var_names_make_unique()
            sc.pp.filter_cells(adata, min_genes=200)
            sc.pp.filter_cells(adata, min_counts=500)

            if adata.n_obs > n_cells:
                rng = np.random.default_rng(seed)
                indices = rng.choice(adata.n_obs, size=n_cells, replace=False)
                adata = adata[indices].copy()

            _expected = int(PBMC_BANK_REGISTRY["expected_cell_count_approx"])
            _tolerance = 0.3
            _lo = int(_expected * (1 - _tolerance))
            _hi = int(_expected * (1 + _tolerance))
            if not (_lo <= adata.n_obs <= _hi):
                logger.warning(
                    f"PBMC bank cell count ({adata.n_obs}) outside expected range "
                    f"[{_lo}, {_hi}] from registry (approx {_expected}). "
                    f"Data source may differ from pinned registry entry."
                )

            adata.obs["dataset_id"] = "pbmc_bank"
            adata.obs["cell_type"] = "PBMC"
            adata.obs["source_annotation"] = "negative"

            out_path.parent.mkdir(parents=True, exist_ok=True)
            adata.write_h5ad(out_path, compression="gzip")
            logger.info(f"PBMC bank built: {adata.n_obs} cells → {out_path}")
            manifest_path = _write_pbmc_provenance_manifest(
                out_path,
                h5_files[0] if h5_files else None,
            )
            logger.info(f"PBMC bank provenance sidecar written: {manifest_path}")
            return adata

        except Exception as e:
            logger.error(f"Failed to build PBMC bank: {e}")
            return None
