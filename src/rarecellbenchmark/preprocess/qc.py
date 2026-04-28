"""Quality-control helpers for single-cell data."""

from __future__ import annotations

import logging

import pandas as pd
from anndata import AnnData

logger = logging.getLogger(__name__)


def compute_qc_metrics(adata: AnnData) -> pd.DataFrame:
    """Compute per-cell QC metrics and return them as a DataFrame.

    The returned DataFrame contains at least ``n_genes_by_counts``,
    ``total_counts``, and ``pct_counts_mt`` when mitochondrial genes are
    annotated.
    """
    import scanpy as sc

    if "mt" not in adata.var.columns:
        adata.var["mt"] = adata.var.index.str.startswith("MT-")
    sc.pp.calculate_qc_metrics(adata, qc_vars=["mt"], percent_top=None, log1p=False, inplace=True)
    return adata.obs[["n_genes_by_counts", "total_counts", "pct_counts_mt"]].copy()


def filter_cells(
    adata: AnnData,
    min_genes: int = 200,
    max_genes: int = 10_000,
    max_mt_pct: float = 20.0,
) -> AnnData:
    """Filter cells based on gene count and mitochondrial percentage.

    Parameters
    ----------
    adata :
        Input AnnData.
    min_genes :
        Minimum number of genes expressed per cell.
    max_genes :
        Maximum number of genes expressed per cell.
    max_mt_pct :
        Maximum percentage of mitochondrial counts allowed.

    Returns
    -------
    AnnData - filtered copy.
    """
    import scanpy as sc

    n_before = adata.n_obs
    sc.pp.filter_cells(adata, min_genes=min_genes)
    sc.pp.filter_cells(adata, max_genes=max_genes)

    if "pct_counts_mt" in adata.obs.columns:
        adata = adata[adata.obs["pct_counts_mt"] < max_mt_pct].copy()
    else:
        logger.debug("pct_counts_mt not available; skipping mito filter")

    n_after = adata.n_obs
    logger.info("Filtered cells: %d -> %d (min_genes=%d, max_genes=%d, max_mt_pct=%.1f)",
                n_before, n_after, min_genes, max_genes, max_mt_pct)
    return adata
