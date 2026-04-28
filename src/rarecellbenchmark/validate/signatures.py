"""Gene-signature scoring helpers."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import yaml
from anndata import AnnData

logger = logging.getLogger(__name__)


def score_signatures(
    adata: AnnData,
    signatures: list[dict] | Path | str | None = None,
) -> pd.DataFrame:
    """Score each cell for each signature and return a DataFrame of scores.

    Parameters
    ----------
    adata :
        Pre-processed AnnData (uses ``layers["log1p_norm"]`` if available).
    signatures :
        One of:
        * a list of dicts ``{"name": str, "genes": list[str]}``,
        * a path to a YAML file containing a ``signatures`` top-level key,
        * ``None`` (returns an empty DataFrame).

    Returns
    -------
    pd.DataFrame - cells × signatures score matrix.
    """
    if signatures is None:
        logger.debug("No signatures provided; returning empty DataFrame.")
        return pd.DataFrame(index=adata.obs.index)

    sig_list: list[dict[str, Any]]
    if isinstance(signatures, (Path, str)):
        sig_path = Path(signatures)
        if not sig_path.exists():
            logger.warning("Signature file not found: %s", sig_path)
            return pd.DataFrame(index=adata.obs.index)
        with open(sig_path, "r", encoding="utf-8") as fh:
            raw = yaml.safe_load(fh)
        sig_list = raw.get("signatures", []) if isinstance(raw, dict) else []
    else:
        sig_list = signatures

    if not sig_list:
        return pd.DataFrame(index=adata.obs.index)

    # Expression matrix
    X = adata.layers["log1p_norm"] if "log1p_norm" in adata.layers else adata.X
    if hasattr(X, "toarray"):
        X = X.toarray()
    X = np.asarray(X, dtype=float)
    var_names = adata.var_names.astype(str)
    gene_to_idx = {g: i for i, g in enumerate(var_names)}

    score_frames: dict[str, pd.Series] = {}
    for sig in sig_list:
        name = sig.get("name", sig.get("source", "unknown"))
        genes = sig.get("genes", sig.get("targets", []))
        idx = [gene_to_idx[g] for g in genes if g in gene_to_idx]
        if not idx:
            continue
        sub = X[:, idx]
        # Mean expression per cell, rank-normalised to [0, 1]
        raw_scores = np.nan_to_num(sub.mean(axis=1), nan=0.0, posinf=0.0, neginf=0.0)
        ranks = pd.Series(raw_scores, index=adata.obs.index).rank(pct=True, method="average")
        score_frames[name] = ranks

    if not score_frames:
        return pd.DataFrame(index=adata.obs.index)

    df = pd.DataFrame(score_frames)
    logger.info("Scored %d signatures for %d cells", len(df.columns), len(df))
    return df
