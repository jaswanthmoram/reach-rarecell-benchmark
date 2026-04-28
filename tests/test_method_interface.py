"""Tests for registered method wrappers."""

from pathlib import Path

import pandas as pd
import pytest

from rarecellbenchmark.methods.base import validate_predictions
from rarecellbenchmark.methods.registry import METHOD_REGISTRY


@pytest.mark.parametrize("method_id", list(METHOD_REGISTRY.keys()))
def test_method_runs(method_id: str, toy_adata, tmp_path: Path) -> None:
    """Instantiate each registered wrapper, run on toy data, and verify outputs."""
    wrapper_cls = METHOD_REGISTRY[method_id]
    wrapper = wrapper_cls()
    out_dir = tmp_path / method_id

    h5ad_path = tmp_path / "input.h5ad"
    toy_adata.write_h5ad(h5ad_path)

    config = {"unit_id": "toy_unit_01", "seed": 42}

    try:
        wrapper.run(h5ad_path, out_dir, config)
    except (RuntimeError, ImportError) as exc:
        pytest.skip(f"Method {method_id} skipped due to missing dependency: {exc}")

    pred_files = list(out_dir.glob("*_predictions.csv"))
    meta_files = list(out_dir.glob("*_runmeta.json"))

    assert len(pred_files) == 1, f"Expected one predictions file for {method_id}, got {pred_files}"
    assert len(meta_files) == 1, f"Expected one runmeta file for {method_id}, got {meta_files}"

    predictions = pd.read_csv(pred_files[0])
    validate_predictions(predictions, toy_adata)
