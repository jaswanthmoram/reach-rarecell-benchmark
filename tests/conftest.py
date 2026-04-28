"""Pytest fixtures for REACH test suite."""

from __future__ import annotations

from pathlib import Path

import anndata
import numpy as np
import pandas as pd
import pytest
import yaml

from rarecellbenchmark.io.anndata_io import validate_anndata_contract


@pytest.fixture
def toy_adata() -> anndata.AnnData:
    """Create a small AnnData (50 cells x 30 genes) following the contract."""
    n_cells, n_genes = 50, 30
    rng = np.random.default_rng(42)
    X = rng.poisson(2.0, size=(n_cells, n_genes)).astype(float)

    obs = pd.DataFrame(
        {
            "dataset_id": ["toy"] * n_cells,
            "patient_id": ["P1"] * (n_cells // 2) + ["P2"] * (n_cells - n_cells // 2),
            "cell_type": ["T cells"] * n_cells,
            "batch": ["B1"] * n_cells,
        }
    )
    for col in obs.columns:
        if obs[col].dtype.name == "str":
            obs[col] = obs[col].astype(object)
    obs.index = pd.Index([f"cell_{i}" for i in range(n_cells)], dtype=object)

    var = pd.DataFrame(
        {
            "gene_symbol": [f"GENE{i}" for i in range(n_genes)],
            "chromosome": ["chr1"] * n_genes,
            "start": np.arange(n_genes) * 1000,
            "end": np.arange(n_genes) * 1000 + 1000,
        },
        index=pd.Index([f"GENE{i}" for i in range(n_genes)], dtype=object),
    )
    for col in var.columns:
        if var[col].dtype.name == "str":
            var[col] = var[col].astype(object)

    adata = anndata.AnnData(X=X, obs=obs, var=var)
    adata.layers["counts"] = X.copy()
    adata.layers["log1p_norm"] = np.log1p(X / X.sum(axis=1, keepdims=True) * 1e4)

    try:
        from sklearn.decomposition import PCA

        pca = PCA(n_components=10, random_state=42)
        adata.obsm["X_pca"] = pca.fit_transform(adata.layers["log1p_norm"])
    except ImportError:
        adata.obsm["X_pca"] = np.zeros((n_cells, 10))

    adata.uns["rarecellbenchmark"] = {"version": "1.0.0", "dataset_id": "toy"}
    validate_anndata_contract(adata)
    return adata


@pytest.fixture
def toy_labels() -> pd.DataFrame:
    """DataFrame with cell_id, y_true, tier."""
    n_cells = 50
    return pd.DataFrame(
        {
            "cell_id": [f"cell_{i}" for i in range(n_cells)],
            "y_true": [1] * 5 + [0] * (n_cells - 5),
            "tier": "T1",
        }
    )


@pytest.fixture
def tmp_output_dir(tmp_path: Path) -> Path:
    """Temporary directory for test outputs."""
    d = tmp_path / "outputs"
    d.mkdir(parents=True, exist_ok=True)
    return d


@pytest.fixture
def benchmark_config() -> dict:
    """Loaded from configs/benchmark.yaml."""
    config_path = Path("configs/benchmark.yaml")
    if not config_path.exists():
        pytest.skip("configs/benchmark.yaml not found")
    with open(config_path, encoding="utf-8") as fh:
        return yaml.safe_load(fh)
