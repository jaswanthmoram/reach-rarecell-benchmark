"""Failure handling for benchmark runs."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

import pandas as pd

logger = logging.getLogger(__name__)


class FailureHandler:
    """Handle method execution failures by writing structured failure JSON."""

    def handle_failure(
        self,
        method_id: str,
        unit_id: str,
        exception: Exception,
        output_dir: Path,
        runtime_s: float,
        peak_memory_mb: float,
    ) -> Path:
        """Write a failure.json file and return its path.

        Parameters
        ----------
        method_id : str
            Method identifier.
        unit_id : str
            Unit identifier.
        exception : Exception
            The exception that caused the failure.
        output_dir : Path
            Directory where failure.json is written.
        runtime_s : float
            Runtime in seconds up to the failure.
        peak_memory_mb : float
            Peak memory usage in MB.

        Returns
        -------
        Path
            Path to the written failure.json file.
        """
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        out_path = output_dir / f"{unit_id}_failure.json"

        failure = {
            "success": False,
            "method_id": method_id,
            "unit_id": unit_id,
            "error": str(exception)[:500],
            "traceback": getattr(exception, "__traceback__", None) is not None,
            "runtime_seconds": float(runtime_s),
            "peak_ram_mb": float(peak_memory_mb),
        }

        with open(out_path, "w") as f:
            json.dump(failure, f, indent=2)

        logger.warning(f"Failure written: {out_path}")
        return out_path

    @staticmethod
    def load_failures(results_dir: Path) -> pd.DataFrame:
        """Aggregate all failure.json files under *results_dir*.

        Parameters
        ----------
        results_dir : Path
            Root results directory to search.

        Returns
        -------
        pd.DataFrame
            DataFrame with one row per failure file.
        """
        rows: list[dict[str, Any]] = []
        for path in Path(results_dir).rglob("*_failure.json"):
            try:
                with open(path) as f:
                    data = json.load(f)
                rows.append(data)
            except Exception as e:
                logger.warning(f"Could not load failure file {path}: {e}")
        if not rows:
            return pd.DataFrame()
        return pd.DataFrame(rows)
