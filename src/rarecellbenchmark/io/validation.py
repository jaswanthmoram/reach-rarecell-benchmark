"""Validation helpers for track units and prediction files."""

from __future__ import annotations

import logging
from pathlib import Path

import pandas as pd

from rarecellbenchmark.schemas import validate_predictions_csv

logger = logging.getLogger(__name__)


def validate_unit_paths(unit_dir: Path, unit_id: str) -> dict:
    """Check that a track unit directory contains the expected artifacts.

    Returns a dict with keys ``exists`` (bool) and ``files`` (list of found
    filenames).
    """
    unit_dir = Path(unit_dir)
    required = {
        "expression.h5ad",
        "labels.parquet",
        "manifest.json",
    }
    found = {p.name for p in unit_dir.iterdir() if p.is_file()}
    missing = required - found

    result = {
        "unit_id": unit_id,
        "unit_dir": str(unit_dir),
        "exists": len(missing) == 0,
        "missing": sorted(missing),
        "files": sorted(found),
    }

    if missing:
        logger.warning("Unit %s missing files: %s", unit_id, sorted(missing))
    else:
        logger.info("Unit %s validated (%d files present)", unit_id, len(required))
    return result


def validate_prediction_file(pred_path: Path, expected_cells: list[str]) -> pd.DataFrame:
    """Validate a prediction CSV against the benchmark schema and cell ordering.

    Parameters
    ----------
    pred_path :
        Path to the predictions CSV.
    expected_cells :
        Ordered list of cell IDs expected in the file.

    Returns
    -------
    pd.DataFrame - the loaded and validated predictions.

    Raises
    ------
    ValueError
        If the schema is invalid or the cell IDs do not match *expected_cells*.
    """
    df = validate_predictions_csv(pred_path)

    cell_id_col = next(
        (c for c in df.columns if str(c).lower().replace("_", "") == "cellid"),
        None,
    )
    if cell_id_col is None:
        raise ValueError(f"Could not locate cell_id column in {pred_path}")

    actual_cells = df[cell_id_col].astype(str).tolist()
    if actual_cells != expected_cells:
        raise ValueError(
            f"Cell ID ordering mismatch in {pred_path}. "
            f"Expected {len(expected_cells)} cells, got {len(actual_cells)}."
        )

    logger.info("Prediction file %s validated (%d rows)", pred_path, len(df))
    return df
