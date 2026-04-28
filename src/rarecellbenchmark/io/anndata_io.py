"""AnnData I/O wrappers with contract validation."""

from __future__ import annotations

import logging
from pathlib import Path

import anndata
from anndata import AnnData

logger = logging.getLogger(__name__)


def read_h5ad(path: Path) -> AnnData:
    """Read an .h5ad file, logging the operation."""
    path = Path(path)
    logger.info("Reading AnnData from %s", path)
    adata = anndata.read_h5ad(path)
    logger.info("Loaded %d cells x %d genes", adata.n_obs, adata.n_vars)
    return adata


def write_h5ad(adata: AnnData, path: Path) -> None:
    """Write an AnnData object to .h5ad, logging the operation."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    logger.info("Writing AnnData (%d cells x %d genes) to %s", adata.n_obs, adata.n_vars, path)
    adata.write_h5ad(path, compression="gzip")


def validate_anndata_contract(adata: AnnData) -> None:
    """Validate that *adata* satisfies the REACH AnnData contract.

    Raises *ValueError* with a descriptive message if any required field is
    missing.
    """
    missing: list[str] = []

    if adata.X is None:
        missing.append("X matrix is missing")

    for layer_name in ("counts", "log1p_norm"):
        if layer_name not in adata.layers:
            missing.append(f'layers["{layer_name}"] is missing')

    if "X_pca" not in adata.obsm:
        missing.append('obsm["X_pca"] is missing')

    required_obs = {
        "dataset_id": True,
        "patient_id": False,
        "cell_type": True,
        "batch": False,
    }
    for col, required in required_obs.items():
        if col not in adata.obs.columns:
            if required:
                missing.append(f'obs["{col}"] is missing (required)')
            else:
                logger.debug('obs["%s"] is optional and missing', col)

    required_var = {
        "gene_symbol": True,
        "chromosome": False,
        "start": False,
        "end": False,
    }
    for col, required in required_var.items():
        if col not in adata.var.columns:
            if required:
                missing.append(f'var["{col}"] is missing (required)')
            else:
                logger.debug('var["%s"] is optional and missing', col)

    if "rarecellbenchmark" not in adata.uns or not isinstance(adata.uns["rarecellbenchmark"], dict):
        missing.append('uns["rarecellbenchmark"] is missing or not a dict')

    if missing:
        raise ValueError("AnnData contract validation failed:\n" + "\n".join(f"  - {m}" for m in missing))
