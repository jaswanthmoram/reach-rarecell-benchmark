from __future__ import annotations
import logging
import numpy as np
import pandas as pd
from anndata import AnnData

logger = logging.getLogger(__name__)
_DEFAULT_REFERENCE_CATS = (
    "T cells", "B cells", "Myeloids", "Mast cells", "Stromal cells",
    "Endothelial cells", "NK cells", "Plasma cells",
)


def compute_cnv_score(adata: AnnData, reference_key: str = "cell_type",
                      reference_cats: list[str] | None = None) -> pd.Series:
    """Per-cell CNV burden via infercnvpy, with a loud zero-fallback."""
    try:
        import infercnvpy as cnv
    except ImportError:
        logger.error("infercnvpy missing; returning ZERO CNV (NOT production-valid).")
        return pd.Series(0.0, index=adata.obs.index, name="cnv_score")
    if not {"chromosome", "start", "end"}.issubset(adata.var.columns):
        logger.error("var lacks genomic positions; returning ZERO CNV. Annotate first.")
        return pd.Series(0.0, index=adata.obs.index, name="cnv_score")
    cats = set(adata.obs[reference_key].astype(str).unique())
    ref = reference_cats or [c for c in _DEFAULT_REFERENCE_CATS if c in cats]
    kwargs = {"reference_key": reference_key, "reference_cat": ref} if ref else {}
    work = adata.copy()
    work.var.index = work.var.index.astype(object)
    work.obs.index = work.obs.index.astype(object)
    # Filter to keep only genes with valid chromosome, start, and end
    valid_genes = (
        work.var["chromosome"].notna() & (work.var["chromosome"].astype(str) != "") &
        work.var["start"].notna() & work.var["end"].notna()
    )
    work = work[:, valid_genes].copy()
    if work.n_vars == 0:
        logger.error("No genes with valid genomic positions; returning ZERO CNV.")
        return pd.Series(0.0, index=adata.obs.index, name="cnv_score")
    cnv.tl.infercnv(work, **kwargs)
    mat = work.obsm["X_cnv"]
    arr = mat.toarray() if hasattr(mat, "toarray") else np.asarray(mat)
    return pd.Series(np.abs(arr).mean(axis=1).ravel(), index=adata.obs.index, name="cnv_score")
