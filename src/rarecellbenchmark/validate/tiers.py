"""Tier assignment logic.

Maps evidence arms (source annotation, CNV, signatures, neighborhood) onto
T1-T4 confidence tiers.
"""

from __future__ import annotations

import logging
from typing import Optional

import numpy as np
import pandas as pd
from anndata import AnnData

logger = logging.getLogger(__name__)

# Thresholds
_SIG_HIGH_THRESHOLD = 0.15
_NEIGHBOR_SUPPORT_THRESHOLD = 0.5


def assign_tiers(
    adata: AnnData,
    cnv_scores: pd.Series,
    signature_scores: pd.DataFrame,
    config: dict,
) -> pd.DataFrame:
    """Assign T1-T4 tiers to every cell based on multi-arm evidence.

    Parameters
    ----------
    adata :
        Pre-processed AnnData (used for source labels and neighbor graph).
    cnv_scores :
        Per-cell CNV scores (higher = more aneuploid).  Stub may be all zeros.
    signature_scores :
        Cells × signatures DataFrame from ``score_signatures``.
    config :
        Optional overrides for thresholds (``sig_high_threshold``,
        ``neighbor_support_threshold``).

    Returns
    -------
    pd.DataFrame with columns ``cell_id``, ``tier``, ``confidence_score``.
    Index = ``adata.obs_names``.
    """
    sig_high = config.get("sig_high_threshold", _SIG_HIGH_THRESHOLD)
    neighbor_thresh = config.get("neighbor_support_threshold", _NEIGHBOR_SUPPORT_THRESHOLD)

    obs_names = adata.obs.index

    # Arm 1: source annotation
    source = _extract_source(adata)

    # Arm 2: CNV
    cnv = _align_or_default(cnv_scores, obs_names, 0.0)
    cnv_high = cnv > cnv.median()  # simple median split when real CNV unavailable

    # Arm 3: signature (max across signatures)
    if signature_scores is not None and not signature_scores.empty:
        sig_max = signature_scores.max(axis=1)
    else:
        sig_max = pd.Series(0.0, index=obs_names)
    sig_high_flag = sig_max >= sig_high

    # Arm 4: neighbor support
    neighbor_support = _compute_neighbor_support(adata, source, threshold=neighbor_thresh)

    # Build evidence DataFrame
    df = pd.DataFrame(
        {
            "source_ann": source.values,
            "cnv_high": cnv_high.values,
            "sig_high": sig_high_flag.values,
            "neighbor_support": neighbor_support.values,
        },
        index=obs_names,
    )

    # Count confirming arms (positive vs negative)
    is_pos = df["source_ann"] == "positive"
    is_neg = df["source_ann"] == "negative"

    pos_arms = (
        df["cnv_high"].astype(int)
        + df["sig_high"].astype(int)
        + df["neighbor_support"].astype(int)
    )
    neg_arms = (
        (~df["cnv_high"]).astype(int)
        + (~df["sig_high"]).astype(int)
        + df["neighbor_support"].astype(int)
    )

    n_arms = pd.Series(0, index=obs_names)
    n_arms = n_arms.where(~is_pos, pos_arms)
    n_arms = n_arms.where(~is_neg, neg_arms)

    # Tier assignment
    tier = pd.Series("T3", index=obs_names)  # default ambiguous

    # Positive arm
    tier = tier.where(~(is_pos & (n_arms >= 3)), "T1")
    tier = tier.where(~(is_pos & (n_arms == 2) & (tier == "T3")), "T2")
    tier = tier.where(~(is_pos & (n_arms <= 1) & (tier == "T3")), "T3")

    # Negative arm
    tier = tier.where(~(is_neg & (n_arms >= 3)), "T4")
    tier = tier.where(~(is_neg & (n_arms == 2) & (tier == "T3")), "T3")
    tier = tier.where(~(is_neg & (n_arms <= 1) & (tier == "T3")), "T3")

    # Unknown source → T3
    tier[(~is_pos) & (~is_neg)] = "T3"

    # Confidence score: proportion of confirming arms (0-1)
    max_arms = 3
    confidence = (n_arms / max_arms).clip(0, 1)

    result = pd.DataFrame(
        {
            "cell_id": obs_names.astype(str),
            "tier": tier.values,
            "confidence_score": confidence.values,
        },
        index=obs_names,
    )

    logger.info("Tier assignment counts:\n%s", result["tier"].value_counts().to_string())
    return result


def _extract_source(adata: AnnData) -> pd.Series:
    """Extract provisional source annotations from obs."""
    import re

    if "cell_type" not in adata.obs.columns:
        return pd.Series("unknown", index=adata.obs.index)
    ct = adata.obs["cell_type"].astype(str).str.lower()
    result = pd.Series("unknown", index=adata.obs.index)
    pos_pat = re.compile(r"malignant|tumor|cancer|ctc")
    neg_pat = re.compile(r"t cell|b cell|macrophage|fibroblast|endothelial|nk|monocyte|mast|dendritic|stromal")
    result[ct.str.contains(pos_pat, regex=True, na=False)] = "positive"
    result[ct.str.contains(neg_pat, regex=True, na=False)] = "negative"
    return result


def _align_or_default(series: Optional[pd.Series], index: pd.Index, default) -> pd.Series:
    if series is None:
        return pd.Series(default, index=index)
    return series.reindex(index, fill_value=default)


def _compute_neighbor_support(
    adata: AnnData,
    source: pd.Series,
    threshold: float = _NEIGHBOR_SUPPORT_THRESHOLD,
    n_neighbors: int = 15,
) -> pd.Series:
    """Return bool Series indicating whether ≥threshold fraction of k-NN share the source polarity."""
    if "X_pca" not in adata.obsm:
        return pd.Series(False, index=adata.obs.index)

    try:
        from sklearn.neighbors import NearestNeighbors
    except ImportError:
        return pd.Series(False, index=adata.obs.index)

    pca = adata.obsm["X_pca"]
    k = min(n_neighbors + 1, adata.n_obs)
    nn = NearestNeighbors(n_neighbors=k, metric="euclidean")
    nn.fit(pca)
    _, indices = nn.kneighbors(pca)

    src_vals = source.values
    neigh = indices[:, 1:]
    frac_same = np.mean(src_vals[neigh] == src_vals[:, None], axis=1)
    supported = (src_vals != "unknown") & (frac_same >= threshold)
    return pd.Series(supported, index=adata.obs.index)
