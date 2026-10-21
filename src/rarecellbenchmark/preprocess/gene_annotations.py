"""Gene annotation helpers (chromosome positions, etc.)."""

from __future__ import annotations

import logging
from pathlib import Path

import pandas as pd
from anndata import AnnData

logger = logging.getLogger(__name__)


def annotate_genes(
    adata: AnnData,
    gene_positions_path: Path,
    delimiter: str = "\t",
    drop_unmatched: bool = False,
) -> AnnData:
    """Add chromosome/start/end annotations to ``adata.var`` from a TSV/CSV file.

    The file is expected to be indexed by gene symbol and contain columns
    ``chromosome``, ``start``, and ``end``.

    Parameters
    ----------
    adata :
        AnnData whose ``var`` index contains gene symbols.
    gene_positions_path :
        Path to the gene-position TSV (e.g. ``configs/grch38_gene_positions.tsv``).
    delimiter :
        Delimiter of the file (defaults to tab).
    drop_unmatched :
        If True, drop genes in ``adata`` that are not in the gene position file.

    Returns
    -------
    AnnData - annotated (and potentially subsetted) AnnData object.
    """
    gene_positions_path = Path(gene_positions_path)
    if not gene_positions_path.exists():
        logger.warning("Gene position file not found: %s", gene_positions_path)
        return adata

    gene_pos = pd.read_csv(gene_positions_path, sep=delimiter, index_col=0)
    common = adata.var.index.intersection(gene_pos.index)
    logger.info("Gene position annotation: %d/%d genes matched", len(common), adata.n_vars)

    if drop_unmatched:
        adata = adata[:, common].copy()

    for col in ("chromosome", "start", "end"):
        if col in gene_pos.columns:
            if col == "chromosome":
                adata.var[col] = gene_pos.reindex(adata.var.index)[col].fillna("").astype(str).values
            else:
                adata.var[col] = gene_pos.reindex(adata.var.index)[col].values

    return adata
