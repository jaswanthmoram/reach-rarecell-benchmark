"""Normalization and dimensionality-reduction helpers."""

from __future__ import annotations

import logging

from anndata import AnnData

logger = logging.getLogger(__name__)


def normalize_log1p(adata: AnnData, target_sum: float = 1e4) -> AnnData:
    """Normalise counts to *target_sum* and apply log1p transform.

    Stores the result in ``layers["log1p_norm"]`` and updates ``.X``.
    """
    import scanpy as sc

    # Operate on a copy of counts so we can store the raw layer safely
    if "counts" not in adata.layers:
        adata.layers["counts"] = adata.X.copy()

    sc.pp.normalize_total(adata, target_sum=target_sum)
    sc.pp.log1p(adata)
    adata.layers["log1p_norm"] = adata.X.copy()
    adata.obs["normalization_method"] = "normalize_total_log1p"
    logger.info("Normalization complete: normalize_total + log1p (target_sum=%.0f)", target_sum)
    return adata


def run_pca(adata: AnnData, n_comps: int = 50) -> AnnData:
    """Run PCA on highly-variable genes and store coordinates in ``obsm["X_pca"]``.

    Parameters
    ----------
    adata :
        AnnData object (expects ``.var["highly_variable"]`` to exist).
    n_comps :
        Number of principal components to compute.

    Returns
    -------
    AnnData - same object with ``obsm["X_pca"]`` populated.
    """
    import scanpy as sc

    if "highly_variable" not in adata.var.columns:
        logger.warning("No 'highly_variable' column found; running PCA on all genes.")
    sc.tl.pca(adata, n_comps=n_comps, use_highly_variable=("highly_variable" in adata.var.columns))
    logger.info("PCA: %d components computed", n_comps)
    return adata
