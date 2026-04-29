"""REACH wrapper for scCAD (ranked method)."""

from __future__ import annotations

import logging
import os
import shutil
import sys
import tempfile
import time
from pathlib import Path

import numpy as np
import pandas as pd
from anndata import AnnData

from rarecellbenchmark.io.checksums import compute_checksum
from rarecellbenchmark.methods.base import BaseMethodWrapper, MethodRunResult, validate_predictions
from rarecellbenchmark.methods.common import (
    load_blind_adata,
    write_predictions,
    write_runmeta,
)

logger = logging.getLogger(__name__)


class ScCADWrapper(BaseMethodWrapper):
    """Wrapper for scCAD - rare cell detection via clustering and DEG overlap."""

    method_id = "scCAD"
    category = "ranked"
    supports_gpu = False
    consumes_labels = False
    method_category = "ranked"

    def run(
        self,
        input_h5ad: Path,
        output_dir: Path,
        config: dict,
    ) -> MethodRunResult:
        """Run scCAD on *input_h5ad* and write results to *output_dir*."""
        t0 = time.time()
        self._start_memory()

        adata = load_blind_adata(input_h5ad)
        unit_id = config.get("unit_id", "unknown")
        seed = config.get("seed", 42)
        normalization = config.get("normalization", True)
        merge_h = config.get("merge_h", 50)
        overlap_h = config.get("overlap_h", 0.7)
        rare_h = config.get("rare_h", 0.01)

        scores, meta = self._run_scCAD(
            adata,
            normalization=normalization,
            seed=seed,
            merge_h=merge_h,
            overlap_h=overlap_h,
            rare_h=rare_h,
        )
        predictions = pd.DataFrame({
            "cell_id": adata.obs_names.tolist(),
            "score": scores.reindex(adata.obs.index).values,
        })

        validate_predictions(predictions, adata)

        runtime_s, peak_memory_mb = self._stop_memory()
        runtime = time.time() - t0
        runtime_s = max(runtime_s, runtime)

        pred_path = write_predictions(predictions, output_dir, unit_id)
        input_hash = compute_checksum(input_h5ad)
        output_hash = compute_checksum(pred_path)

        reserved_meta_keys = {
            "method_id",
            "unit_id",
            "runtime_s",
            "peak_memory_mb",
            "seed",
            "input_hash",
            "output_hash",
            "status",
        }
        extra_meta = {
            key: value for key, value in meta.items() if key not in reserved_meta_keys
        }
        meta_path = write_runmeta(
            method_id=self.method_id,
            unit_id=unit_id,
            output_dir=output_dir,
            runtime_s=runtime_s,
            peak_memory_mb=peak_memory_mb,
            seed=seed,
            input_hash=input_hash,
            output_hash=output_hash,
            **extra_meta,
        )

        logger.info(
            "[%s] %d cells scored in %.3fs", self.method_id, adata.n_obs, runtime_s
        )
        return MethodRunResult(
            method_id=self.method_id,
            unit_id=unit_id,
            predictions_path=pred_path,
            runmeta_path=meta_path,
            status="success",
        )

    def _run_scCAD(
        self,
        adata: AnnData,
        normalization: bool = True,
        seed: int = 42,
        merge_h: float = 50,
        overlap_h: float = 0.7,
        rare_h: float = 0.01,
    ) -> tuple[pd.Series, dict]:
        """Core scCAD logic migrated from the original wrapper."""
        temp_dir = tempfile.mkdtemp(prefix=f"sccad_{os.getpid()}_{int(time.time())}_")

        try:
            sccad_path = os.path.join(
                os.path.dirname(__file__), "..", "..", "..", "..",
                "External-Methods", "scCAD", "scCAD-1.0.0"
            )
            sccad_path = os.path.abspath(sccad_path)
            if sccad_path not in sys.path:
                sys.path.insert(0, sccad_path)
            import scCAD_patched as scCAD
        except ImportError as e:
            logger.error("[%s] scCAD_patched not importable: %s", self.method_id, e)
            return self._fallback_scores(adata, seed), {
                "method_fidelity": "fallback",
                "error": f"scCAD_import_failed: {e}",
            }

        try:
            if "counts" in adata.layers:
                X = adata.layers["counts"]
            else:
                X = adata.X
            if hasattr(X, "toarray"):
                X = X.toarray()

            data = X.astype(np.float32)
            cellNames = adata.obs.index.tolist()
            geneNames = adata.var.index.tolist()

            result, overlap, rename_comb_subclusters, remain_degs_list = scCAD.scCAD(
                data=data,
                dataName="benchmark",
                cellNames=cellNames,
                geneNames=geneNames,
                normalization=normalization,
                seed=seed,
                merge_h=merge_h,
                overlap_h=overlap_h,
                rare_h=rare_h,
                save_full=False,
                save_path=temp_dir + "/",
            )

            scores = np.zeros(adata.n_obs)
            rare_cell_set = set()

            if result and len(result) > 0:
                for rare_list in result:
                    for cell_id in rare_list:
                        if isinstance(cell_id, str):
                            rare_cell_set.add(cell_id)
                        else:
                            rare_cell_set.add(cellNames[cell_id])

                for i, cell_id in enumerate(cellNames):
                    if cell_id in rare_cell_set:
                        scores[i] = 1.0

                if overlap is not None and len(overlap) > 0:
                    clusters = np.array(rename_comb_subclusters)
                    unique_clusters = np.unique(clusters)
                    for i, cluster_id in enumerate(unique_clusters):
                        if i < len(overlap):
                            mask = clusters == cluster_id
                            scores[mask] += overlap[i] * 0.5
            else:
                clusters = np.array(rename_comb_subclusters)
                cluster_sizes = pd.Series(clusters).value_counts()
                total = len(clusters)
                for i, cluster_id in enumerate(clusters):
                    scores[i] = 1.0 - (cluster_sizes[cluster_id] / total)

            if scores.max() > scores.min():
                scores = (scores - scores.min()) / (scores.max() - scores.min())

            n_rare = len(rare_cell_set) if result else 0
            logger.info(
                "[%s] %d cells, %d rare cells",
                self.method_id, adata.n_obs, n_rare,
            )

            return pd.Series(scores, index=adata.obs.index, name=self.method_id), {
                "method_fidelity": "faithful",
                "method_fidelity_note": (
                    "Uses scCAD_patched.py (n_jobs=4, unique temp dirs) "
                    "for safe parallel execution on high-core machines"
                ),
                "n_rare_cells": n_rare,
                "n_rare_clusters": len(result) if result else 0,
                "seed": seed,
            }

        except Exception as e:
            logger.error("[%s] Error: %s", self.method_id, e)
            return self._fallback_scores(adata, seed), {
                "method_fidelity": "fallback",
                "error": str(e),
            }
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    def _fallback_scores(self, adata: AnnData, seed: int) -> pd.Series:
        rng = np.random.default_rng(seed)
        return pd.Series(rng.random(adata.n_obs), index=adata.obs.index, name=self.method_id)
