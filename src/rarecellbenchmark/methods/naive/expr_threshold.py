"""
src/rarecellbenchmark/methods/naive/expr_threshold.py
REACH - Naive Baseline: Expression Threshold

Ranks cells by total UMI count (library size).
Assumption: rare malignant cells may have higher/lower expression than typical cells.
Score = total UMI count (normalized to [0,1]).
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from rarecellbenchmark.methods.base import BaseMethodWrapper, MethodRunResult, validate_predictions
from rarecellbenchmark.methods.common import load_blind_adata, write_predictions, write_runmeta

logger = logging.getLogger(__name__)


class ExprThresholdWrapper(BaseMethodWrapper):
    method_id = "expr_threshold"
    category = "naive"
    supports_gpu = False
    consumes_labels = False

    def run(self, input_h5ad: Path, output_dir: Path, config: dict[str, Any]) -> MethodRunResult:
        adata = load_blind_adata(input_h5ad)
        unit_id = config.get("unit_id", "unknown")
        seed = config.get("seed", 42)
        use_log_norm = config.get("use_log_norm", False)

        self._start_memory()

        if "counts" in adata.layers:
            X = adata.layers["counts"]
        else:
            X = adata.X

        if hasattr(X, "toarray"):
            X = X.toarray()

        if use_log_norm and "log1p_norm" in adata.layers:
            X = adata.layers["log1p_norm"]
            if hasattr(X, "toarray"):
                X = X.toarray()

        total_counts = np.array(X.sum(axis=1)).flatten()

        min_c, max_c = total_counts.min(), total_counts.max()
        if max_c > min_c:
            scores = (total_counts - min_c) / (max_c - min_c)
        else:
            scores = np.zeros(len(total_counts))

        predictions = pd.DataFrame({
            "cell_id": adata.obs_names.tolist(),
            "score": scores,
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
        )

        logger.info(f"[{self.method_id}] {adata.n_obs} cells scored in {runtime_s:.3f}s")

        return MethodRunResult(
            method_id=self.method_id,
            unit_id=unit_id,
            predictions_path=pred_path,
            runmeta_path=meta_path,
            status="success",
        )
