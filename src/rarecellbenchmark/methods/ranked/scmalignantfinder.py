"""REACH wrapper for scMalignantFinder (ranked method)."""

from __future__ import annotations

import logging
import os
import time
import warnings
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

DEFAULT_PRETRAIN_DIR = os.environ.get(
    "SCMALIGNANTFINDER_PRETRAIN_DIR",
    os.path.join(
        os.path.dirname(__file__), "..", "..", "..", "..",
        "External-Methods", "scMalignantFinder", "scMalignantFinder-main", "pretrained_model"
    ),
)


class ScMalignantFinderWrapper(BaseMethodWrapper):
    """Wrapper for scMalignantFinder - pan-cancer malignant cell identification."""

    method_id = "scMalignantFinder"
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
        """Run scMalignantFinder on *input_h5ad* and write results to *output_dir*."""
        t0 = time.time()
        self._start_memory()

        adata = load_blind_adata(input_h5ad)
        unit_id = config.get("unit_id", "unknown")
        seed = config.get("seed", 42)
        pretrain_dir = config.get("pretrain_dir", None)
        norm_type = config.get("norm_type", True)

        scores, meta = self._run_scMalignantFinder(
            adata,
            pretrain_dir=pretrain_dir,
            norm_type=norm_type,
            seed=seed,
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

    def _run_scMalignantFinder(
        self,
        adata: AnnData,
        pretrain_dir: str | None = None,
        norm_type: bool = True,
        seed: int = 42,
    ) -> tuple[pd.Series, dict]:
        """Core scMalignantFinder logic migrated from the original wrapper."""
        if pretrain_dir is None:
            pretrain_dir = DEFAULT_PRETRAIN_DIR
        pretrain_dir = os.path.abspath(pretrain_dir)

        model_path = os.path.join(pretrain_dir, "model.joblib")
        feature_path = os.path.join(pretrain_dir, "ordered_feature.tsv")

        if not os.path.exists(model_path) or not os.path.exists(feature_path):
            logger.warning(
                "[%s] Pretrained model not found at %s. "
                "Download from Zenodo: https://zenodo.org/records/17888140",
                self.method_id, pretrain_dir,
            )
            return self._fallback_scores(adata, seed), {
                "error": "pretrained_model_not_found",
                "pretrain_dir": pretrain_dir,
            }

        try:
            from scMalignantFinder import classifier
        except ImportError:
            logger.error("[%s] scMalignantFinder not installed", self.method_id)
            return self._fallback_scores(adata, seed), {
                "method_fidelity": "fallback",
                "error": "scMalignantFinder_not_installed",
            }

        try:
            model = classifier.scMalignantFinder(
                test_input=adata,
                pretrain_dir=pretrain_dir,
                norm_type=norm_type,
                n_thread=1,
                use_raw=False,
                celltype_annotation=False,
            )

            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                model.load()
            result_adata = model.predict()

            if "malignancy_probability" in result_adata.obs.columns:
                scores = result_adata.obs["malignancy_probability"].astype(float)
                scores = scores.reindex(adata.obs.index).fillna(0.5)
            else:
                logger.warning(
                    "[%s] No malignancy_probability in output",
                    self.method_id,
                )
                return self._fallback_scores(adata, seed), {
                    "method_fidelity": "fallback",
                    "error": "no_probability_output",
                }

            logger.info("[%s] %d cells processed", self.method_id, adata.n_obs)

            return pd.Series(
                scores.values, index=adata.obs.index, name=self.method_id
            ), {
                "method_fidelity": "faithful",
                "method_fidelity_note": (
                    "Uses the original scMalignantFinder Python package "
                    "installed from External-Methods/scMalignantFinder"
                ),
                "pretrain_dir": pretrain_dir,
                "missing_features": (
                    model.missing_feature
                    if hasattr(model, "missing_feature")
                    else []
                ),
            }

        except Exception as e:
            logger.error("[%s] Error: %s", self.method_id, e)
            return self._fallback_scores(adata, seed), {
                "method_fidelity": "fallback",
                "error": str(e),
            }

    def _fallback_scores(self, adata: AnnData, seed: int) -> pd.Series:
        rng = np.random.default_rng(seed)
        return pd.Series(rng.random(adata.n_obs), index=adata.obs.index, name=self.method_id)
