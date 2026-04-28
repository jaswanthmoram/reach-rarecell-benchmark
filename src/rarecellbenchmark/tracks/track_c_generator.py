"""
Track C: Null Controls Generator.

No true positives; all cells are background. Used as a baseline to flag
degenerate methods (expected AP ≈ 0).
"""

from __future__ import annotations

import datetime
import hashlib
import json
import logging
from pathlib import Path
from typing import Any

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

MIN_P_HC = 50
MIN_B_HC = 200
N_REPLICATES = 5


class TrackCGenerator(BaseTrackGenerator):
    track_id = "C"

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

        adata = ad.read_h5ad(processed_h5ad)
        out_dir = Path(out_dir)
        out_dir.mkdir(parents=True, exist_ok=True)

        positive_mask = config.get("positive_mask")
        background_mask = config.get("background_mask")
        tier_assignments = config.get("tier_assignments")

        if positive_mask is None or background_mask is None:
            if tier_assignments is None:
                raise ValueError(
                    "Track C requires either positive_mask/background_mask or tier_assignments in config"
                )
            positive_mask = pd.Series(
                tier_assignments["tier"].isin(["P_HC"]).values,
                index=tier_assignments.index if hasattr(tier_assignments, "index") else adata.obs.index,
            )
            background_mask = pd.Series(
                tier_assignments["tier"].isin(["B_HC"]).values,
                index=tier_assignments.index if hasattr(tier_assignments, "index") else adata.obs.index,
            )

        tiers = config.get("tiers", list(TIER_WINDOWS.keys()))
        n_replicates = config.get("n_replicates", N_REPLICATES)
        base_seed = config.get("base_seed", 42)
        target_n_total = config.get("target_n_total", 2000)

        manifests = []
        unit_dirs: list[Path] = []

        for tier in tiers:
            tier_dir = out_dir / tier
            tier_dir.mkdir(parents=True, exist_ok=True)
            logger.info(f"[{dataset_id}] Track C tier {tier} ({n_replicates} replicates)...")
            for rep in range(1, n_replicates + 1):
                seed = self._unit_seed(base_seed, dataset_id, tier, rep)
                result = self._generate_unit(
                    adata=adata,
                    positive_mask=positive_mask,
                    background_mask=background_mask,
                    tier=tier,
                    replicate=rep,
                    dataset_id=dataset_id,
                    seed=seed,
                    target_n_total=target_n_total,
                )
                if result["status"] == "success":
                    self._write_unit(result, tier_dir)
                    manifests.append(result["manifest"])
                    unit_dirs.append(tier_dir)
                else:
                    logger.warning(
                        f"[{dataset_id}] Track C tier {tier} rep {rep}: {result['status']}"
                    )
                    manifests.append(result)

        self._write_summary(out_dir, manifests, base_seed)
        n_ok = sum(1 for m in manifests if m.get("status") == "success")
        logger.info(f"[{dataset_id}] Track C: {n_ok}/{len(manifests)} units generated")
        return unit_dirs

    def _generate_unit(
        self,
        adata,
        positive_mask: pd.Series,
        background_mask: pd.Series,
        tier: str,
        replicate: int,
        dataset_id: str,
        seed: int,
        target_n_total: int = 2000,
    ) -> dict:
        rng = np.random.default_rng(seed)
        tier_min, tier_max = TIER_WINDOWS[tier]
        n_phc = int(positive_mask.sum())
        n_bhc = int(background_mask.sum())

        if n_phc < MIN_P_HC:
            return {
                "status": "skipped_insufficient_positives",
                "dataset_id": dataset_id,
                "tier": tier,
                "replicate": replicate,
                "n_phc_available": n_phc,
                "min_required": MIN_P_HC,
            }
        if n_bhc < MIN_B_HC:
            return {
                "status": "skipped_insufficient_background",
                "dataset_id": dataset_id,
                "tier": tier,
                "replicate": replicate,
                "n_bhc_available": n_bhc,
                "min_required": MIN_B_HC,
            }

        max_n_for_bg = int(n_bhc / (1.0 - tier_max)) if tier_max < 1.0 else n_phc + n_bhc
        n_total = min(target_n_total, n_bhc, max(1, max_n_for_bg))
        n_background = n_total
        n_positive = 0

        bg_indices = np.where(background_mask.values)[0]
        sampled_bg = rng.choice(bg_indices, size=n_background, replace=False)

        all_indices = sampled_bg
        rng.shuffle(all_indices)

        unit_adata = adata[all_indices].copy()
        true_labels = pd.Series("background", index=unit_adata.obs.index)
        shuffled_labels = true_labels.copy()

        unit_id = f"{dataset_id}_track_c_{tier}_rep{replicate:02d}"

        manifest = {
            "unit_id": unit_id,
            "dataset_id": dataset_id,
            "track": "C",
            "tier": tier,
            "tier_window": list(TIER_WINDOWS[tier]),
            "replicate": replicate,
            "n_positive": int(n_positive),
            "n_background": int(n_background),
            "n_total": int(n_total),
            "prevalence": 0.0,
            "n_positive_true": 0,
            "n_background_true": int(n_background),
            "true_prevalence": 0.0,
            "labels_shuffled": False,
            "expected_ap_approx": 0.0,
            "seed": int(seed),
            "target_prevalence_min": tier_min,
            "target_prevalence_max": tier_max,
            "n_phc_pool": n_phc,
            "n_bhc_pool": n_bhc,
            "status": "success",
            "note": "NULL CONTROL - all-background cells only; expected AP ≈ 0",
        }

        return {
            "status": "success",
            "unit_adata": unit_adata,
            "true_labels": true_labels,
            "shuffled_labels": shuffled_labels,
            "manifest": manifest,
            "unit_id": unit_id,
        }

    def _write_unit(self, result: dict, out_dir: Path) -> Path:
        out_dir = Path(out_dir)
        unit_id = result["unit_id"]
        unit_adata = result["unit_adata"].copy()
        shuffled_labels = result["shuffled_labels"]
        manifest = result["manifest"]

        for col in ["true_label", "is_positive", "label", "cell_origin", "source_annotation"]:
            if col in unit_adata.obs.columns:
                del unit_adata.obs[col]

        labels_path = out_dir / f"{unit_id}_labels.parquet"
        shuffled_labels.to_frame("true_label").to_parquet(labels_path)

        expr_path = out_dir / f"{unit_id}_expression.h5ad"
        unit_adata.write_h5ad(expr_path, compression="gzip")

        manifest_path = out_dir / f"{unit_id}_manifest.json"
        with open(manifest_path, "w") as f:
            json.dump(manifest, f, indent=2)

        logger.info(
            f"Written Track C unit: {unit_id} "
            f"(n_bg={manifest['n_background_true']}, prev={manifest['true_prevalence']:.4f})"
        )
        return expr_path

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
