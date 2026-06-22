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

class TrackFGenerator(BaseTrackGenerator):
    track_id = "F"

    def _unit_seed(self, base_seed: int, dataset_id: str, prevalence: float, replicate: int) -> int:
        base = get_track_seed(base_seed, self.track_id, dataset_id, replicate)
        prev_derived = int(hashlib.sha256(str(prevalence).encode()).hexdigest()[:8], 16) % MAX_SEED
        return int((base + prev_derived) % MAX_SEED)

    @staticmethod
    def generate_units(
        adata,
        malignant_mask,
        normal_epi_mask,
        prevalences=(0.001, 0.005, 0.01),
        unit_size=2000,
        n_replicates=5,
        seed=42,
    ) -> list[dict]:
        """Generate Track F unit dictionaries.

        Positives are sampled from malignant_mask.
        Background is sampled from normal_epi_mask.
        """
        rng = np.random.default_rng(seed)
        
        pos_indices = np.where(malignant_mask)[0]
        bg_indices = np.where(normal_epi_mask)[0]
        
        n_phc = len(pos_indices)
        n_bhc = len(bg_indices)
        
        results = []
        for prev in prevalences:
            for rep in range(1, n_replicates + 1):
                # Unique seed for each prevalence and replicate
                rep_seed = int(rng.integers(0, MAX_SEED))
                unit_rng = np.random.default_rng(rep_seed)
                
                n_positive = int(round(prev * unit_size))
                # Ensure at least 1 positive is spiked in
                if n_positive == 0 and prev > 0:
                    n_positive = 1
                n_background = unit_size - n_positive
                
                # Check pos pool
                if n_phc < n_positive:
                    logger.warning(f"Insufficient positive cells: pool {n_phc} < requested {n_positive}")
                    # Sample with replacement if necessary
                    sampled_pos = unit_rng.choice(pos_indices, size=n_positive, replace=True)
                else:
                    sampled_pos = unit_rng.choice(pos_indices, size=n_positive, replace=False)
                    
                # Check bg pool and duplication cap (<20%)
                if n_bhc < n_background:
                    # Must sample with replacement
                    sampled_bg = unit_rng.choice(bg_indices, size=n_background, replace=True)
                    unique_bg = len(np.unique(sampled_bg))
                    dup_frac = 1.0 - (unique_bg / n_background)
                    if dup_frac >= 0.20:
                        logger.warning(f"Duplication fraction ({dup_frac:.2f}) exceeds 20% cap due to small bg pool ({n_bhc})")
                else:
                    sampled_bg = unit_rng.choice(bg_indices, size=n_background, replace=False)
                    dup_frac = 0.0
                    
                all_indices = np.concatenate([sampled_pos, sampled_bg])
                unit_rng.shuffle(all_indices)
                
                unit_adata = adata[all_indices].copy()
                
                # Setup labels
                pos_cell_ids = set(adata.obs.index[sampled_pos])
                true_labels = pd.Series("background", index=unit_adata.obs.index)
                
                # Handle potential duplicate indices in sampled_pos by using matching cell names
                # or matching their index positions
                # Find cell IDs that are in sampled_pos
                true_labels.iloc[:n_positive] = "positive"
                
                # Re-verify label mapping
                # Since we shuffled indices, the positions of positives in all_indices are where
                # they were placed. Let's map them exactly:
                is_pos_cell = np.isin(all_indices, sampled_pos)
                true_labels = pd.Series("background", index=unit_adata.obs.index)
                true_labels.iloc[is_pos_cell] = "positive"
                
                manifest = {
                    "track": "F",
                    "prevalence": prev,
                    "replicate": rep,
                    "n_positive": int(n_positive),
                    "n_background": int(n_background),
                    "n_total": int(unit_size),
                    "seed": rep_seed,
                    "duplication_fraction": dup_frac,
                    "status": "success",
                }
                
                results.append({
                    "status": "success",
                    "unit_adata": unit_adata,
                    "true_labels": true_labels,
                    "manifest": manifest,
                })
        return results

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
        
        malignant_mask = config["malignant_mask"]
        normal_epi_mask = config["normal_epi_mask"]
        prevalences = config.get("prevalences", (0.001, 0.005, 0.01))
        unit_size = config.get("unit_size", 2000)
        n_replicates = config.get("n_replicates", 5)
        base_seed = config.get("base_seed", 42)
        
        rng = np.random.default_rng(base_seed)
        
        manifests = []
        unit_dirs = []
        
        for prev in prevalences:
            prev_str = f"prev_{prev}"
            prev_dir = out_dir / prev_str
            prev_dir.mkdir(parents=True, exist_ok=True)
            
            logger.info(f"[{dataset_id}] Track F prevalence {prev} ({n_replicates} replicates)...")
            for rep in range(1, n_replicates + 1):
                seed = self._unit_seed(base_seed, dataset_id, prev, rep)
                
                # Call static method for generating unit dictionary
                results = self.generate_units(
                    adata=adata,
                    malignant_mask=malignant_mask,
                    normal_epi_mask=normal_epi_mask,
                    prevalences=(prev,),
                    unit_size=unit_size,
                    n_replicates=1,
                    seed=seed,
                )
                unit_res = results[0]
                
                if unit_res["status"] == "success":
                    unit_id = f"{dataset_id}_track_f_{prev_str}_rep{rep:02d}"
                    unit_res["unit_id"] = unit_id
                    unit_res["manifest"]["unit_id"] = unit_id
                    unit_res["manifest"]["dataset_id"] = dataset_id
                    
                    self._write_unit(unit_res, prev_dir)
                    manifests.append(unit_res["manifest"])
                    unit_dirs.append(prev_dir)
                else:
                    logger.warning(f"[{dataset_id}] Track F prevalence {prev} rep {rep} failed")
                    
        self._write_summary(out_dir, manifests, base_seed)
        return list(set(unit_dirs))

    def _write_unit(self, result: dict, out_dir: Path) -> Path:
        out_dir = Path(out_dir)
        unit_id = result["unit_id"]
        unit_adata = result["unit_adata"].copy()
        true_labels = result["true_labels"]
        manifest = result["manifest"]

        for col in ["true_label", "is_positive", "label", "cell_origin", "source_annotation"]:
            if col in unit_adata.obs.columns:
                del unit_adata.obs[col]

        unit_adata.obs.index = unit_adata.obs.index.astype(object)
        unit_adata.var.index = unit_adata.var.index.astype(object)

        for col in unit_adata.obs.columns:
            if isinstance(unit_adata.obs[col].dtype, pd.CategoricalDtype):
                unit_adata.obs[col] = unit_adata.obs[col].cat.rename_categories(
                    unit_adata.obs[col].cat.categories.astype(object)
                )
            elif not pd.api.types.is_numeric_dtype(unit_adata.obs[col]):
                unit_adata.obs[col] = unit_adata.obs[col].astype(object)

        for col in unit_adata.var.columns:
            if isinstance(unit_adata.var[col].dtype, pd.CategoricalDtype):
                unit_adata.var[col] = unit_adata.var[col].cat.rename_categories(
                    unit_adata.var[col].cat.categories.astype(object)
                )
            elif not pd.api.types.is_numeric_dtype(unit_adata.var[col]):
                unit_adata.var[col] = unit_adata.var[col].astype(object)

        labels_path = out_dir / f"{unit_id}_labels.parquet"
        true_labels.to_frame("true_label").to_parquet(labels_path)

        expr_path = out_dir / f"{unit_id}_expression.h5ad"
        unit_adata.write_h5ad(expr_path, compression="gzip")

        manifest_path = out_dir / f"{unit_id}_manifest.json"
        with open(manifest_path, "w") as f:
            json.dump(manifest, f, indent=2)

        return expr_path

    def _write_summary(self, out_dir: Path, manifests: list[dict], base_seed: int) -> None:
        successful = [m for m in manifests if m.get("status") == "success"]
        prevalences = [m["prevalence"] for m in successful]
        
        summary = {
            "track": self.track_id,
            "n_units": len(successful),
            "n_datasets": 1,
            "prevalence_range": [
                float(min(prevalences)),
                float(max(prevalences)),
            ] if prevalences else [None, None],
            "generation_seed": base_seed,
            "generation_date": datetime.datetime.now().isoformat(),
        }
        with open(out_dir / "track_summary.json", "w") as f:
            json.dump(summary, f, indent=2)
