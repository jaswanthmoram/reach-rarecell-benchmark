"""
Track E: Noisy-Label Robustness Generator.

Systematic label noise injection on top of Track A units.
Noise types: asym_neg, asym_pos, noise10, noise20.
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

NOISE_CONDITIONS = {
    "noise10": {"type": "symmetric", "rate": 0.10},
    "noise20": {"type": "symmetric", "rate": 0.20},
    "asym_pos": {"type": "positive_only", "rate": 0.30},
    "asym_neg": {"type": "negative_only", "rate": 0.30},
}


class TrackEGenerator(BaseTrackGenerator):
    track_id = "E"

    def _unit_seed(self, base_seed: int, unit_id: str, condition_name: str) -> int:
        base = get_track_seed(base_seed, self.track_id, unit_id, 0)
        cond_derived = int(hashlib.sha256(condition_name.encode()).hexdigest()[:8], 16) % MAX_SEED
        return int((base + cond_derived) % MAX_SEED)

    def generate(
        self,
        dataset_id: str,
        processed_h5ad: Path,
        out_dir: Path,
        config: dict[str, Any],
    ) -> list[Path]:
        out_dir = Path(out_dir)
        out_dir.mkdir(parents=True, exist_ok=True)

        track_a_dir = config["track_a_dir"]
        tiers = config.get("tiers", ["T1", "T2", "T3", "T4"])
        base_seed = config.get("base_seed", 777)

        index_path = Path(track_a_dir) / f"{dataset_id}_track_a_index.json"
        if not index_path.exists():
            logger.error(f"Track A index not found: {index_path}")
            self._write_summary(out_dir, [], base_seed)
            return []

        with open(index_path) as f:
            track_a_index = json.load(f)

        all_manifests = []
        unit_dirs: list[Path] = []

        for unit_meta in track_a_index.get("units", []):
            if unit_meta.get("status") != "success":
                continue
            if tiers and unit_meta.get("tier") not in tiers:
                continue

            unit_id = unit_meta["unit_id"]
            tier = unit_meta["tier"]

            expr_path = Path(track_a_dir) / tier / f"{unit_id}_expression.h5ad"
            labels_path = Path(track_a_dir) / tier / f"{unit_id}_labels.parquet"

            if not expr_path.exists() or not labels_path.exists():
                logger.warning(
                    f"Track A files missing for {unit_id}: "
                    f"expr={expr_path.exists()}, labels={labels_path.exists()}"
                )
                continue

            e_manifests = self._generate_from_track_a(
                track_a_unit_id=unit_id,
                track_a_expr_path=expr_path,
                track_a_labels_path=labels_path,
                track_a_manifest=unit_meta,
                out_dir=out_dir,
                base_seed=base_seed,
            )
            all_manifests.extend(e_manifests)
            for m in e_manifests:
                if m.get("status") == "success":
                    cond_dir = out_dir / m["noise_condition"]
                    unit_dirs.append(cond_dir)

        self._write_summary(out_dir, all_manifests, base_seed)
        n_ok = sum(1 for m in all_manifests if m.get("status") == "success")
        logger.info(f"[{dataset_id}] Track E: {n_ok}/{len(all_manifests)} units generated")
        return unit_dirs

    def _generate_from_track_a(
        self,
        track_a_unit_id: str,
        track_a_expr_path: Path,
        track_a_labels_path: Path,
        track_a_manifest: dict,
        out_dir: Path,
        base_seed: int = 777,
    ) -> list[dict]:
        try:
            import anndata as ad
        except ImportError:
            return [{"status": "failed_no_anndata"}]

        out_dir = Path(out_dir)

        ad.read_h5ad(track_a_expr_path)
        true_labels = pd.read_parquet(track_a_labels_path)["true_label"]

        dataset_id = track_a_manifest["dataset_id"]
        tier = track_a_manifest["tier"]
        replicate = track_a_manifest["replicate"]

        manifests = []
        for condition_name, condition_params in NOISE_CONDITIONS.items():
            seed = self._unit_seed(base_seed, track_a_unit_id, condition_name)

            noisy_labels, noise_stats = self._apply_label_noise(
                true_labels=true_labels,
                noise_type=condition_params["type"],
                noise_rate=condition_params["rate"],
                seed=seed,
            )

            unit_id = f"{dataset_id}_track_e_{condition_name}_{tier}_rep{replicate:02d}"

            cond_dir = out_dir / condition_name
            cond_dir.mkdir(parents=True, exist_ok=True)

            noisy_labels_path = cond_dir / f"{unit_id}_labels.parquet"
            noisy_labels.to_frame("true_label").to_parquet(noisy_labels_path)

            try:
                expr_rel = Path(track_a_expr_path).relative_to(Path.cwd())
            except ValueError:
                expr_rel = track_a_expr_path
            try:
                labels_rel = noisy_labels_path.relative_to(Path.cwd())
            except ValueError:
                labels_rel = noisy_labels_path

            expr_link_path = cond_dir / f"{unit_id}_expression_ref.txt"
            with open(expr_link_path, "w") as f:
                f.write(str(expr_rel).replace("\\", "/"))

            manifest = {
                "unit_id": unit_id,
                "dataset_id": dataset_id,
                "track": "E",
                "noise_condition": condition_name,
                "parent_track_a_unit": track_a_unit_id,
                "tier": tier,
                "replicate": replicate,
                "n_positive": noise_stats["n_positive_noisy"],
                "n_background": noise_stats["n_background_noisy"],
                "n_total": noise_stats["n_total"],
                "prevalence": noise_stats["prevalence_noisy"],
                "seed": int(seed),
                "noise_stats": noise_stats,
                "expression_path": str(expr_rel).replace("\\", "/"),
                "labels_path": str(labels_rel).replace("\\", "/"),
                "status": "success",
            }

            manifest_path = cond_dir / f"{unit_id}_manifest.json"
            with open(manifest_path, "w") as f:
                json.dump(manifest, f, indent=2, default=str)

            manifests.append(manifest)
            logger.info(
                f"Track E [{condition_name}] -> {unit_id}: "
                f"flipped {noise_stats['n_flipped_pos_to_neg']} pos, "
                f"{noise_stats['n_flipped_neg_to_pos']} neg"
            )

        return manifests

    def _apply_label_noise(
        self,
        true_labels: pd.Series,
        noise_type: str,
        noise_rate: float,
        seed: int,
    ) -> tuple[pd.Series, dict]:
        rng = np.random.default_rng(seed)
        noisy = true_labels.copy()

        pos_mask = true_labels == "positive"
        neg_mask = true_labels == "background"
        n_pos = int(pos_mask.sum())
        n_neg = int(neg_mask.sum())

        n_flipped_pos = 0
        n_flipped_neg = 0

        if noise_type == "symmetric":
            n_flip_pos = int(round(n_pos * noise_rate))
            n_flip_neg = int(round(n_neg * noise_rate))

            pos_indices = np.where(pos_mask.values)[0]
            neg_indices = np.where(neg_mask.values)[0]

            if n_flip_pos > 0:
                flip_pos = rng.choice(pos_indices, size=n_flip_pos, replace=False)
                noisy.iloc[flip_pos] = "background"
                n_flipped_pos = n_flip_pos

            if n_flip_neg > 0:
                flip_neg = rng.choice(neg_indices, size=n_flip_neg, replace=False)
                noisy.iloc[flip_neg] = "positive"
                n_flipped_neg = n_flip_neg

        elif noise_type == "positive_only":
            n_flip = int(round(n_pos * noise_rate))
            pos_indices = np.where(pos_mask.values)[0]
            if n_flip > 0:
                flip_idx = rng.choice(pos_indices, size=n_flip, replace=False)
                noisy.iloc[flip_idx] = "background"
                n_flipped_pos = n_flip

        elif noise_type == "negative_only":
            n_flip = int(round(n_neg * noise_rate))
            neg_indices = np.where(neg_mask.values)[0]
            if n_flip > 0:
                flip_idx = rng.choice(neg_indices, size=n_flip, replace=False)
                noisy.iloc[flip_idx] = "positive"
                n_flipped_neg = n_flip

        noise_stats = {
            "noise_type": noise_type,
            "noise_rate": noise_rate,
            "n_positive_original": n_pos,
            "n_background_original": n_neg,
            "n_flipped_pos_to_neg": int(n_flipped_pos),
            "n_flipped_neg_to_pos": int(n_flipped_neg),
            "n_positive_noisy": int((noisy == "positive").sum()),
            "n_background_noisy": int((noisy == "background").sum()),
            "n_total": int(len(noisy)),
            "prevalence_original": float(n_pos / (n_pos + n_neg)) if (n_pos + n_neg) > 0 else 0.0,
            "prevalence_noisy": float((noisy == "positive").sum() / len(noisy)) if len(noisy) > 0 else 0.0,
        }

        return noisy, noise_stats

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
