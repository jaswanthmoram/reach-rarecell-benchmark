"""Neighborhood-based QC stub."""

from __future__ import annotations

import logging

import numpy as np
import pandas as pd
from anndata import AnnData

logger = logging.getLogger(__name__)


def compute_neighborhood_purity(
    adata: AnnData,
    label_col: str = "cell_type",
    n_neighbors: int = 15,
) -> pd.Series:
    """Compute the fraction of k-NN neighbors sharing the same *label_col* value.

    This is a stub that returns a zero Series when the PCA coordinates or
    scikit-learn are unavailable.
    """
    if "X_pca" not in adata.obsm:
        logger.warning("X_pca not found; returning zeros for neighborhood purity.")
        return pd.Series(0.0, index=adata.obs.index, name="neighborhood_purity")

    try:
        from sklearn.neighbors import NearestNeighbors
    except ImportError:
        logger.warning("scikit-learn not installed; returning zeros for neighborhood purity.")
        return pd.Series(0.0, index=adata.obs.index, name="neighborhood_purity")

    pca = adata.obsm["X_pca"]
    nn = NearestNeighbors(n_neighbors=min(n_neighbors + 1, adata.n_obs), metric="euclidean")
    nn.fit(pca)
    _, indices = nn.kneighbors(pca)

    labels = adata.obs[label_col].values if label_col in adata.obs.columns else np.zeros(adata.n_obs)
    same = []
    for i, neigh in enumerate(indices[:, 1:]):
        same.append((labels[neigh] == labels[i]).mean())

    return pd.Series(same, index=adata.obs.index, name="neighborhood_purity")
