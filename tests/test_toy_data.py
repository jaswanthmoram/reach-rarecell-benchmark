"""Tests for toy data creation script."""

import subprocess
import sys
from pathlib import Path

import pandas as pd

from rarecellbenchmark.io.anndata_io import read_h5ad, validate_anndata_contract


def test_create_toy_data_script(tmp_path: Path) -> None:
    out_dir = tmp_path / "toy"
    result = subprocess.run(
        [
            sys.executable,
            "scripts/create_toy_data.py",
            "--out-dir",
            str(out_dir),
            "--n-cells",
            "100",
            "--n-genes",
            "50",
            "--n-positive",
            "10",
        ],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, result.stderr

    h5ad_path = out_dir / "toy_expression.h5ad"
    labels_path = out_dir / "toy_labels.parquet"
    manifest_path = out_dir / "toy_manifest.json"

    assert h5ad_path.exists(), f"Expected {h5ad_path} to exist"
    assert labels_path.exists(), f"Expected {labels_path} to exist"
    assert manifest_path.exists(), f"Expected {manifest_path} to exist"

    adata = read_h5ad(h5ad_path)
    validate_anndata_contract(adata)

    labels = pd.read_parquet(labels_path)
    assert {"cell_id", "y_true", "tier"}.issubset(set(labels.columns))

    manifest = pd.read_json(manifest_path, typ="series")
    assert manifest["dataset_id"] == "toy"
    assert "n_cells" in manifest
    assert "n_genes" in manifest
