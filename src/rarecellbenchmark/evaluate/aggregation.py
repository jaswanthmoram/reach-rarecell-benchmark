"""Result aggregation utilities."""

from __future__ import annotations

import logging

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# Prevalence bins: [0.1%,0.5%), [0.5%,1%), [1%,5%], >5%
_PREVALENCE_BINS = [0.0, 0.001, 0.005, 0.01, 0.05, np.inf]
_PREVALENCE_LABELS = ["<0.1%", "0.1-0.5%", "0.5-1%", "1-5%", ">5%"]


def _assign_prevalence_bin(prevalence: float) -> str:
    for i, (low, high) in enumerate(zip(_PREVALENCE_BINS[:-1], _PREVALENCE_BINS[1:])):
        if low <= prevalence < high:
            return _PREVALENCE_LABELS[i]
    return _PREVALENCE_LABELS[-1]


def aggregate_per_unit(results_df: pd.DataFrame) -> pd.DataFrame:
    """Group by method_id and unit_id, computing per-unit metrics.

    Parameters
    ----------
    results_df : pd.DataFrame
        DataFrame with at least columns: method_id, unit_id, ap, auroc.

    Returns
    -------
    pd.DataFrame
        Aggregated DataFrame with one row per (method_id, unit_id).
    """
    numeric_cols = [c for c in ["ap", "auroc", "f1_at_k", "precision_at_k", "recall_at_k", "runtime_seconds"] if c in results_df.columns]
    if not numeric_cols:
        logger.warning("aggregate_per_unit: no numeric metric columns found.")
        return results_df.copy()
    grouped = results_df.groupby(["method_id", "unit_id"])[numeric_cols].mean().reset_index()
    return grouped


def aggregate_per_track(results_df: pd.DataFrame, track: str) -> pd.DataFrame:
    """Macro-average across units within a track.

    Parameters
    ----------
    results_df : pd.DataFrame
        Full results DataFrame.
    track : str
        Track letter to filter on.

    Returns
    -------
    pd.DataFrame
        One row per method_id with macro-averaged metrics.
    """
    track_df = results_df[results_df["track"].str.upper() == track.upper()].copy()
    if track_df.empty:
        logger.warning(f"aggregate_per_track: no data for track {track}")
        return pd.DataFrame()

    numeric_cols = [c for c in ["ap", "auroc", "f1_at_k", "precision_at_k", "recall_at_k", "runtime_seconds"] if c in track_df.columns]
    if not numeric_cols:
        return track_df.copy()

    summary = track_df.groupby("method_id")[numeric_cols].mean().reset_index()
    summary["track"] = track.upper()
    return summary


def aggregate_per_dataset(results_df: pd.DataFrame) -> pd.DataFrame:
    """Aggregate results per method and dataset.

    Parameters
    ----------
    results_df : pd.DataFrame
        Full results DataFrame.

    Returns
    -------
    pd.DataFrame
        One row per (method_id, dataset_id) with mean metrics.
    """
    if "dataset_id" not in results_df.columns:
        logger.warning("aggregate_per_dataset: no dataset_id column found.")
        return results_df.copy()

    numeric_cols = [c for c in ["ap", "auroc", "f1_at_k", "precision_at_k", "recall_at_k", "runtime_seconds"] if c in results_df.columns]
    if not numeric_cols:
        return results_df.copy()

    summary = (
        results_df.groupby(["method_id", "dataset_id"])[numeric_cols]
        .mean()
        .reset_index()
    )

    # Add per-dataset unit count
    if "ap" in results_df.columns:
        counts = results_df.groupby(["method_id", "dataset_id"]).size().reset_index(name="n_units")
        summary = summary.merge(counts, on=["method_id", "dataset_id"])

    return summary


def aggregate_by_prevalence_strata(results_df: pd.DataFrame) -> pd.DataFrame:
    """Prevalence-stratified aggregation using bins.

    Bins
    ----
    - <0.1%
    - 0.1-0.5%
    - 0.5-1%
    - 1-5%
    - >5%

    Parameters
    ----------
    results_df : pd.DataFrame
        Full results DataFrame. Must contain a *prevalence* column.

    Returns
    -------
    pd.DataFrame
        Aggregated results with prevalence_bin column.
    """
    if "prevalence" not in results_df.columns:
        logger.warning("aggregate_by_prevalence_strata: no prevalence column found.")
        return results_df.copy()

    df = results_df.copy()
    df["prevalence_bin"] = df["prevalence"].apply(_assign_prevalence_bin)

    numeric_cols = [c for c in ["ap", "auroc", "f1_at_k", "precision_at_k", "recall_at_k", "runtime_seconds"] if c in df.columns]
    if not numeric_cols:
        return df

    summary = (
        df.groupby(["method_id", "prevalence_bin"])[numeric_cols]
        .mean()
        .reset_index()
    )
    return summary
