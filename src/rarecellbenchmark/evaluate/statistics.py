"""Statistical significance tests for benchmark comparison."""

from __future__ import annotations

import logging

import numpy as np
import pandas as pd
from scipy.stats import wilcoxon

logger = logging.getLogger(__name__)


def wilcoxon_signed_rank(
    method_a_scores: np.ndarray | pd.Series,
    method_b_scores: np.ndarray | pd.Series,
) -> tuple[float, float]:
    """Paired Wilcoxon signed-rank test on two sets of scores.

    Parameters
    ----------
    method_a_scores : array-like
        Scores for method A (one per unit).
    method_b_scores : array-like
        Scores for method B (one per unit), aligned with method A.

    Returns
    -------
    tuple[float, float]
        (statistic, p_value)
    """
    a = np.asarray(method_a_scores)
    b = np.asarray(method_b_scores)

    # Remove NaNs pairwise
    mask = np.isfinite(a) & np.isfinite(b)
    a_clean = a[mask]
    b_clean = b[mask]

    if len(a_clean) < 5:
        logger.warning("wilcoxon_signed_rank: fewer than 5 valid pairs.")
        return float(np.nan), float(np.nan)

    if np.std(a_clean - b_clean) == 0:
        return float(np.nan), 1.0

    stat, p = wilcoxon(a_clean, b_clean, alternative="two-sided")
    return float(stat), float(p)


def bonferroni_correction(p_values: list[float]) -> list[float]:
    """Apply Bonferroni correction to a list of p-values.

    Parameters
    ----------
    p_values : list[float]
        Raw p-values.

    Returns
    -------
    list[float]
        Corrected p-values (capped at 1.0).
    """
    n = len(p_values)
    if n == 0:
        return []
    corrected = [min(p * n, 1.0) for p in p_values]
    return corrected


def critical_difference_ranks(method_ap_matrix: pd.DataFrame) -> pd.Series:
    """Compute average ranks per method from an AP matrix.

    Parameters
    ----------
    method_ap_matrix : pd.DataFrame
        DataFrame with rows = units, columns = methods, values = AP.

    Returns
    -------
    pd.Series
        Average rank per method (1 = best).
    """
    if method_ap_matrix.empty:
        return pd.Series(dtype=float)

    # Rank methods per unit (1 = highest AP)
    ranks = method_ap_matrix.rank(axis=1, ascending=False, method="average")
    avg_ranks = ranks.mean(axis=0).sort_values()
    return avg_ranks
