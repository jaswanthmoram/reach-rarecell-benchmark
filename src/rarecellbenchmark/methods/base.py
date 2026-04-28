from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import tracemalloc
import time

from anndata import AnnData


@dataclass(frozen=True)
class MethodRunResult:
    """Result of a single method run on one track unit."""

    method_id: str
    unit_id: str
    predictions_path: Path
    runmeta_path: Path
    status: str


class BaseMethodWrapper(ABC):
    """Abstract base class that every REACH method wrapper must subclass."""

    method_id: str = ""
    supports_gpu: bool = False
    consumes_labels: bool = False
    category: str = ""  # naive, ranked, exploratory, or ensemble

    def _start_memory(self) -> None:
        """Start memory and runtime tracking."""
        tracemalloc.start()
        self._start_time = time.time()
        self._peak_mem = 0

    def _stop_memory(self) -> tuple[float, float]:
        """Stop tracking and return (runtime_seconds, peak_memory_mb)."""
        runtime = time.time() - self._start_time
        current, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()
        peak_mb = peak / (1024 * 1024)
        return runtime, peak_mb

    @abstractmethod
    def run(self, input_h5ad: Path, output_dir: Path, config: dict[str, Any]) -> MethodRunResult:
        """Run method on one blind benchmark unit and write predictions.csv + runmeta.json."""
        ...


def validate_predictions(predictions: pd.DataFrame, adata: AnnData) -> None:
    """Raise ValueError if predictions don't match AnnData obs_names or contain invalid scores."""
    if len(predictions) != adata.n_obs:
        raise ValueError(f"Prediction length {len(predictions)} != adata.n_obs {adata.n_obs}")
    if predictions["cell_id"].tolist() != adata.obs_names.tolist():
        raise ValueError("cell_id ordering mismatch")
    if not predictions["score"].notna().all():
        raise ValueError("NaN scores found")
    if not np.isfinite(predictions["score"]).all():
        raise ValueError("Non-finite scores found")
    # Scores are not required to be in [0, 1]; methods may output arbitrary ranges.
    # Metric computation (AP, AUROC) is scale-invariant, so unbounded scores are valid.
