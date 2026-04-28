"""CNV-score computation stub.

Real CNV inference (CopyKAT, inferCNVpy) is optional and computationally
expensive.  This module provides a lightweight stub that returns a zero score
for every cell so the pipeline can proceed without external R / Java
dependencies.
"""

from __future__ import annotations

import logging

import pandas as pd
from anndata import AnnData

logger = logging.getLogger(__name__)


def compute_cnv_score(adata: AnnData) -> pd.Series:
    """Return a zero CNV score for every cell.

    .. note::
       This is a **stub**.  For production runs replace with CopyKAT or
       inferCNVpy calls.
    """
    logger.info("compute_cnv_score: returning stub zeros for %d cells", adata.n_obs)
    return pd.Series(0.0, index=adata.obs.index, name="cnv_score")
