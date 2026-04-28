"""Shared helpers for selecting highly variable gene feature sets."""

from __future__ import annotations

from typing import Literal

import numpy as np
import pandas as pd


FallbackMode = Literal["first", "variance"]


def select_hvg_indices(
    adata,
    limit: int,
    *,
    rank_by: str | None = None,
    fallback: FallbackMode = "first",
    matrix=None,
) -> np.ndarray:
    """
    Return gene indices for a capped feature set.

    Behavior mirrors the existing call sites:
    - Prefer ``var['highly_variable']`` when available.
    - Preserve existing HVG order unless ``rank_by`` is provided.
    - Fall back to the first ``limit`` genes, or top-variance genes when
      explicitly requested and a matrix is provided.
    """
    n_vars = int(getattr(adata, "n_vars", len(adata.var.index)))
    if limit <= 0 or n_vars == 0:
        return np.array([], dtype=int)

    limit = min(int(limit), n_vars)

    if "highly_variable" in adata.var.columns:
        hvg_mask = np.asarray(adata.var["highly_variable"].fillna(False), dtype=bool)
        hvg_idx = np.flatnonzero(hvg_mask)
        if hvg_idx.size:
            if rank_by and rank_by in adata.var.columns and hvg_idx.size > limit:
                rank_values = pd.to_numeric(
                    adata.var.iloc[hvg_idx][rank_by], errors="coerce"
                ).to_numpy()
                ranked = np.argsort(np.nan_to_num(rank_values, nan=-np.inf))[::-1]
                hvg_idx = hvg_idx[ranked]
            return hvg_idx[:limit]

    if fallback == "variance" and matrix is not None and n_vars > limit:
        X = matrix.toarray() if hasattr(matrix, "toarray") else np.asarray(matrix)
        variances = np.var(X, axis=0)
        ranked = np.argsort(variances)[::-1]
        return ranked[:limit].astype(int, copy=False)

    return np.arange(limit, dtype=int)
