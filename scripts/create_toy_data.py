#!/usr/bin/env python
"""Create toy data for REACH."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd

from rarecellbenchmark.io.anndata_io import validate_anndata_contract, write_h5ad


def main(
    n_cells: int = 300,
    n_genes: int = 200,
    n_positive: int = 50,
    out_dir: str = "data/toy",
    seed: int = 42,
) -> None:
    rng = np.random.default_rng(seed)
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    # Positive cells: elevated expression in first 20 genes
    X_pos = rng.poisson(5.0, size=(n_positive, n_genes)).astype(float)
    X_pos[:, :20] += rng.poisson(10.0, size=(n_positive, 20))

    # Background cells: baseline expression
    X_neg = rng.poisson(2.0, size=(n_cells - n_positive, n_genes)).astype(float)
    X = np.vstack([X_pos, X_neg])

    obs = pd.DataFrame(
        {
            "cell_type": ["Malignant cells"] * n_positive + ["T cells"] * (n_cells - n_positive),
            "patient_id": ["P1"] * (n_cells // 2) + ["P2"] * (n_cells - n_cells // 2),
            "malignant_raw": ["1"] * n_positive + ["0"] * (n_cells - n_positive),
            "dataset_id": ["toy"] * n_cells,
            "batch": ["P1"] * n_cells,
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

    import anndata

    adata = anndata.AnnData(X=X, obs=obs, var=var)
    adata.layers["counts"] = X.copy()
    adata.layers["log1p_norm"] = np.log1p(X / X.sum(axis=1, keepdims=True) * 1e4)

    try:
        from sklearn.decomposition import PCA

        pca = PCA(n_components=10, random_state=seed)
        adata.obsm["X_pca"] = pca.fit_transform(adata.layers["log1p_norm"])
    except ImportError:
        adata.obsm["X_pca"] = np.zeros((n_cells, 10))

    adata.uns["rarecellbenchmark"] = {
        "version": "1.0.0",
        "dataset_id": "toy",
    }

    validate_anndata_contract(adata)

    h5ad_path = out_dir / "toy_expression.h5ad"
    write_h5ad(adata, h5ad_path)

    labels = pd.DataFrame(
        {
            "cell_id": adata.obs_names,
            "y_true": [1] * n_positive + [0] * (n_cells - n_positive),
            "tier": "T1",
        }
    )
    labels_path = out_dir / "toy_labels.parquet"
    labels.to_parquet(labels_path)

    manifest = {
        "dataset_id": "toy",
        "n_cells": n_cells,
        "n_genes": n_genes,
        "version": "1.0.0",
    }
    manifest_path = out_dir / "toy_manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2))

    print(f"Created toy data at {out_dir}")
    print(f"  - {h5ad_path}")
    print(f"  - {labels_path}")
    print(f"  - {manifest_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create toy data for REACH")
    parser.add_argument("--n-cells", type=int, default=300)
    parser.add_argument("--n-genes", type=int, default=200)
    parser.add_argument("--n-positive", type=int, default=50)
    parser.add_argument("--out-dir", type=str, default="data/toy")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()
    main(**vars(args))
