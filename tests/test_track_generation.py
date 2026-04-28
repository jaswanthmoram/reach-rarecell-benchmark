"""Tests for track generators."""

from pathlib import Path
from unittest.mock import patch

import anndata
import numpy as np
import pandas as pd
import pytest

from rarecellbenchmark.tracks.track_a_generator import TrackAGenerator
from rarecellbenchmark.tracks.track_c_generator import TrackCGenerator

# ---------------------------------------------------------------------------
# Work-around for pandas 3.0 / anndata 0.11 compatibility:
# anndata.read_h5ad restores string columns as ``str`` (ArrowStringArray) and
# slicing converts them to ``category``.  We patch ``write_h5ad`` so the
# tests can write the files without hitting IORegistryError.
# ---------------------------------------------------------------------------
_original_write_h5ad = anndata.AnnData.write_h5ad


def _patched_write_h5ad(self, path, **kwargs):
    if self.obs.index.dtype.name == "str":
        self.obs.index = self.obs.index.astype(object)
    for col in self.obs.columns:
        if self.obs[col].dtype.name in ("str", "category"):
            self.obs[col] = self.obs[col].astype(object)
    if self.var.index.dtype.name == "str":
        self.var.index = self.var.index.astype(object)
    for col in self.var.columns:
        if self.var[col].dtype.name in ("str", "category"):
            self.var[col] = self.var[col].astype(object)
    return _original_write_h5ad(self, path, **kwargs)


anndata.AnnData.write_h5ad = _patched_write_h5ad


def _make_processed_h5ad(tmp_path: Path, n_cells: int = 100, n_genes: int = 50) -> Path:
    rng = np.random.default_rng(42)
    X = rng.poisson(2.0, size=(n_cells, n_genes)).astype(float)
    obs = pd.DataFrame(
        {
            "dataset_id": ["toy"] * n_cells,
            "patient_id": ["P1"] * n_cells,
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
        },
        index=pd.Index([f"GENE{i}" for i in range(n_genes)], dtype=object),
    )
    for col in var.columns:
        if var[col].dtype.name == "str":
            var[col] = var[col].astype(object)
    adata = anndata.AnnData(X=X, obs=obs, var=var)
    adata.layers["counts"] = X.copy()
    adata.layers["log1p_norm"] = np.log1p(X / X.sum(axis=1, keepdims=True) * 1e4)
    adata.obsm["X_pca"] = np.zeros((n_cells, 10))
    adata.uns["rarecellbenchmark"] = {}
    h5ad_path = tmp_path / "processed.h5ad"
    adata.write_h5ad(h5ad_path)
    return h5ad_path


def _make_tier_assignments(adata: anndata.AnnData, n_positive: int = 20) -> pd.DataFrame:
    tiers = pd.DataFrame({"tier": ["B_HC"] * adata.n_obs}, index=adata.obs.index)
    tiers.iloc[:n_positive, 0] = "P_HC"
    return tiers


@pytest.fixture
def track_config(tmp_path: Path):
    h5ad_path = _make_processed_h5ad(tmp_path)
    adata = anndata.read_h5ad(h5ad_path)
    tiers = _make_tier_assignments(adata, n_positive=20)
    return {
        "processed_h5ad": h5ad_path,
        "tier_assignments": tiers,
        "tiers": ["T1"],
        "n_replicates": 1,
        "base_seed": 42,
        "target_n_total": 50,
    }


def test_track_a_generator(track_config, tmp_path: Path) -> None:
    with patch("rarecellbenchmark.tracks.track_a_generator.MIN_P_HC", 1), patch(
        "rarecellbenchmark.tracks.track_a_generator.MIN_B_HC", 1
    ):
        gen = TrackAGenerator()
        out_dir = tmp_path / "track_a"
        unit_dirs = gen.generate(
            "toy", track_config["processed_h5ad"], out_dir, track_config
        )

    assert len(unit_dirs) > 0
    for tier_dir in unit_dirs:
        files = [p.name for p in tier_dir.iterdir() if p.is_file()]
        assert any(name.endswith("_expression.h5ad") for name in files)
        assert any(name.endswith("_labels.parquet") for name in files)
        assert any(name.endswith("_manifest.json") for name in files)

    summary_path = out_dir / "track_summary.json"
    assert summary_path.exists()


def test_track_c_generator_all_background(track_config, tmp_path: Path) -> None:
    with patch("rarecellbenchmark.tracks.track_c_generator.MIN_P_HC", 1), patch(
        "rarecellbenchmark.tracks.track_c_generator.MIN_B_HC", 1
    ):
        gen = TrackCGenerator()
        out_dir = tmp_path / "track_c"
        unit_dirs = gen.generate(
            "toy", track_config["processed_h5ad"], out_dir, track_config
        )

    assert len(unit_dirs) > 0
    for tier_dir in unit_dirs:
        label_files = list(tier_dir.glob("*_labels.parquet"))
        assert len(label_files) == 1
        labels = pd.read_parquet(label_files[0])
        assert (labels["true_label"] == "background").all()

    summary_path = out_dir / "track_summary.json"
    assert summary_path.exists()
