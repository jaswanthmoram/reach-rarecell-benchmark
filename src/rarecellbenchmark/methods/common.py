from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd
from anndata import AnnData


def load_blind_adata(input_h5ad: Path) -> AnnData:
    """Read h5ad, verify it has no ground-truth labels, and return it."""
    import anndata
    adata = anndata.read_h5ad(input_h5ad)
    if "y_true" in adata.obs.columns:
        raise ValueError("Blind adata must not contain ground-truth labels ('y_true')")
    return adata


def write_predictions(predictions: pd.DataFrame, output_dir: Path, unit_id: str) -> Path:
    """Write predictions DataFrame to CSV and return the path."""
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    path = output_dir / f"{unit_id}_predictions.csv"
    predictions.to_csv(path, index=False)
    return path


def write_runmeta(
    method_id: str,
    unit_id: str,
    output_dir: Path,
    runtime_s: float,
    peak_memory_mb: float,
    seed: int,
    input_hash: str,
    output_hash: str,
    status: str = "success",
    **kwargs: Any,
) -> Path:
    """Write run metadata JSON and return the path."""
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    path = output_dir / f"{unit_id}_runmeta.json"
    meta = {
        "method_id": method_id,
        "unit_id": unit_id,
        "runtime_s": runtime_s,
        "peak_memory_mb": peak_memory_mb,
        "seed": seed,
        "input_hash": input_hash,
        "output_hash": output_hash,
        "status": status,
        **kwargs,
    }
    path.write_text(json.dumps(meta, indent=2))
    return path


def write_failure(
    method_id: str,
    unit_id: str,
    output_dir: Path,
    error_type: str,
    error_message: str,
    traceback_str: str,
    runtime_s: float,
    peak_memory_mb: float,
) -> Path:
    """Write failure metadata JSON and return the path."""
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    path = output_dir / f"{unit_id}_runmeta.json"
    meta = {
        "method_id": method_id,
        "unit_id": unit_id,
        "runtime_s": runtime_s,
        "peak_memory_mb": peak_memory_mb,
        "status": "failure",
        "error_type": error_type,
        "error_message": error_message,
        "traceback": traceback_str,
    }
    path.write_text(json.dumps(meta, indent=2))
    return path
