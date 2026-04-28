"""Full toy-data pipeline smoke test."""

from pathlib import Path

import anndata
import numpy as np
import pandas as pd

from rarecellbenchmark.evaluate.leaderboard import build_leaderboard
from rarecellbenchmark.evaluate.metrics import evaluate_predictions
from rarecellbenchmark.figures.leaderboard import plot_leaderboard
from rarecellbenchmark.methods.registry import METHOD_REGISTRY


def test_full_toy_pipeline(tmp_path: Path) -> None:
    """End-to-end smoke test on small toy data."""
    # 1. Create toy data (100 cells, 50 genes, 10 positives)
    toy_dir = tmp_path / "toy"
    toy_dir.mkdir(parents=True, exist_ok=True)

    n_cells, n_genes, n_positive = 100, 50, 10
    rng = np.random.default_rng(42)
    X = rng.poisson(2.0, size=(n_cells, n_genes)).astype(float)
    X[:n_positive, :10] += rng.poisson(5.0, size=(n_positive, 10))

    obs = pd.DataFrame(
        {
            "dataset_id": ["toy"] * n_cells,
            "patient_id": ["P1"] * n_cells,
            "cell_type": ["T cells"] * (n_cells - n_positive) + ["Malignant cells"] * n_positive,
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
    adata.uns["rarecellbenchmark"] = {"version": "1.0.0"}

    h5ad_path = toy_dir / "toy_expression.h5ad"
    adata.write_h5ad(h5ad_path)

    labels = pd.DataFrame(
        {
            "cell_id": adata.obs_names,
            "true_label": ["background"] * (n_cells - n_positive)
            + ["positive"] * n_positive,
            "tier": "T1",
        }
    )
    labels_path = toy_dir / "toy_labels.parquet"
    labels.to_parquet(labels_path)

    # 2. Run random_baseline and expr_threshold
    predictions_dir = tmp_path / "predictions"
    predictions_dir.mkdir(parents=True, exist_ok=True)

    methods_to_test = ["random_baseline", "expr_threshold"]
    eval_records = []
    for method_id in methods_to_test:
        wrapper_cls = METHOD_REGISTRY[method_id]
        wrapper = wrapper_cls()
        out_dir = predictions_dir / method_id
        config = {"unit_id": "toy_unit_01", "seed": 42}
        result = wrapper.run(h5ad_path, out_dir, config)
        assert result.predictions_path.exists(), f"{method_id} predictions missing"
        assert result.runmeta_path.exists(), f"{method_id} runmeta missing"

        eval_result = evaluate_predictions(
            result.predictions_path,
            labels_path,
            run_meta={
                "method_id": method_id,
                "unit_id": "toy_unit_01",
                "track": "A",
                "tier": "T1",
            },
        )
        eval_records.append(eval_result)

    eval_df = pd.DataFrame(eval_records)
    assert not eval_df.empty

    # 3. Build leaderboard and generate figure
    lb = build_leaderboard(eval_df, track="A")
    fig_path = tmp_path / "leaderboard.png"
    plot_leaderboard(lb, fig_path)
    assert fig_path.exists()
