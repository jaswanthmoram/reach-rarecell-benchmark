"""
src/rarecellbenchmark/methods/naive/hvg_logreg.py
REACH - Naive Baseline: HVG Logistic Regression

Logistic regression on top highly variable genes.
Uses labeled data (true_labels) to train logistic regression on HVGs.
This is the strongest naive baseline - captures supervised learning floor.

NOTE: This baseline uses true labels for training - it's a supervised
floor that shows what logistic regression CAN achieve with perfect labels.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from rarecellbenchmark.methods.base import BaseMethodWrapper, MethodRunResult, validate_predictions
from rarecellbenchmark.methods.common import write_predictions, write_runmeta
from rarecellbenchmark.shared.hvg import select_hvg_indices

logger = logging.getLogger(__name__)


class HVGLogRegWrapper(BaseMethodWrapper):
    method_id = "hvg_logreg"
    category = "naive"
    supports_gpu = False
    consumes_labels = True

    def run(self, input_h5ad: Path, output_dir: Path, config: dict[str, Any]) -> MethodRunResult:
        import anndata
        adata = anndata.read_h5ad(input_h5ad)
        unit_id = config.get("unit_id", "unknown")
        seed = config.get("seed", 42)
        n_hvgs = config.get("n_hvgs", 500)

        true_labels = adata.obs["y_true"] if "y_true" in adata.obs.columns else None

        self._start_memory()

        scores, extra_meta = self._compute_scores(adata, true_labels, n_hvgs, seed)

        predictions = pd.DataFrame({
            "cell_id": adata.obs_names.tolist(),
            "score": scores.values,
        })

        validate_predictions(predictions, adata)

        pred_path = write_predictions(predictions, output_dir, unit_id)

        runtime_s, peak_memory_mb = self._stop_memory()

        from rarecellbenchmark.io.checksums import compute_checksum
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
            **extra_meta,
        )

        return MethodRunResult(
            method_id=self.method_id,
            unit_id=unit_id,
            predictions_path=pred_path,
            runmeta_path=meta_path,
            status="success",
        )

    def _compute_scores(
        self,
        adata,
        true_labels: pd.Series | None,
        n_hvgs: int,
        seed: int,
    ) -> tuple[pd.Series, dict[str, Any]]:
        """Compute HVG logistic regression scores. Returns (scores, extra_meta)."""
        if true_labels is None:
            logger.warning(
                f"[{self.method_id}] true_labels not provided. "
                "This supervised baseline requires labels - returning 0.5 for all cells."
            )
            return (
                pd.Series(0.5, index=adata.obs.index, name=self.method_id),
                {
                    "error": "no_labels_provided",
                    "note": "Supervised baseline requires true_labels to run",
                },
            )

        try:
            from sklearn.linear_model import LogisticRegressionCV
        except ImportError:
            logger.error("scikit-learn not installed. Run: pip install scikit-learn")
            return (
                pd.Series(0.5, index=adata.obs.index, name=self.method_id),
                {"error": "no_sklearn"},
            )

        gene_idx = select_hvg_indices(adata, n_hvgs, rank_by="dispersions_norm")

        if "log1p_norm" in adata.layers:
            X_full = adata.layers["log1p_norm"]
        else:
            X_full = adata.X
        if hasattr(X_full, "toarray"):
            X_full = X_full.toarray()

        X = X_full[:, gene_idx]

        if true_labels.dtype == object:
            y = (true_labels.reindex(adata.obs.index) == "positive").astype(int).values
        else:
            y = (true_labels.reindex(adata.obs.index) == 1).astype(int).values

        n_pos = int(y.sum())
        n_neg = int((y == 0).sum())

        if n_pos < 5 or n_neg < 5:
            logger.warning(
                f"[{self.method_id}] Too few positive ({n_pos}) or negative ({n_neg}) cells"
            )
            return (
                pd.Series(y.astype(float), index=adata.obs.index, name=self.method_id),
                {
                    "warning": "too_few_labels",
                    "n_positive": n_pos,
                    "n_negative": n_neg,
                },
            )

        _n_jobs_used = -1
        try:
            clf = LogisticRegressionCV(
                cv=min(5, n_pos),
                max_iter=500,
                random_state=seed,
                class_weight="balanced",
                n_jobs=-1,
            )
            clf.fit(X, y)
            proba = clf.predict_proba(X)[:, 1]
        except (PermissionError, OSError) as _perm_err:
            logger.warning(
                f"[{self.method_id}] Parallel fitting blocked ({_perm_err}). "
                "Retrying with n_jobs=1."
            )
            try:
                clf = LogisticRegressionCV(
                    cv=min(5, n_pos),
                    max_iter=500,
                    random_state=seed,
                    class_weight="balanced",
                    n_jobs=1,
                )
                clf.fit(X, y)
                proba = clf.predict_proba(X)[:, 1]
                _n_jobs_used = 1
            except Exception as _e2:
                logger.warning(
                    f"[{self.method_id}] Logistic regression failed: {_e2}. Using random."
                )
                proba = np.random.default_rng(seed).random(len(y))
        except Exception as e:
            logger.warning(f"[{self.method_id}] Logistic regression failed: {e}. Using random.")
            proba = np.random.default_rng(seed).random(len(y))

        scores = pd.Series(proba, index=adata.obs.index, name=self.method_id)
        logger.info(
            f"[{self.method_id}] {adata.n_obs} cells, {len(gene_idx)} HVGs, scored."
        )

        return scores, {
            "n_hvgs_used": len(gene_idx),
            "n_positive": n_pos,
            "n_negative": n_neg,
            "n_jobs_used": _n_jobs_used,
        }
