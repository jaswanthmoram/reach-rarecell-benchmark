"""Leaderboard construction and snapshotting."""

from __future__ import annotations

import json
import logging
from pathlib import Path

import numpy as np
import pandas as pd


logger = logging.getLogger(__name__)


def _bootstrap_median_ci(
    values: pd.Series,
    n_bootstrap: int = 1000,
    ci: float = 95.0,
    seed: int = 42,
) -> tuple[float, float]:
    """Bootstrap confidence interval for the median."""
    vals = values.dropna().values
    if len(vals) == 0:
        return float(np.nan), float(np.nan)
    rng = np.random.default_rng(seed)
    bootstraps = [np.median(rng.choice(vals, size=len(vals), replace=True)) for _ in range(n_bootstrap)]
    alpha = (100.0 - ci) / 2.0
    return float(np.percentile(bootstraps, alpha)), float(np.percentile(bootstraps, 100.0 - alpha))


def build_leaderboard(
    eval_df: pd.DataFrame,
    track: str = "A",
) -> pd.DataFrame:
    """Build a leaderboard from evaluation results.

    Parameters
    ----------
    eval_df : pd.DataFrame
        Full evaluation DataFrame with per-unit results.
    track : str, default "A"
        Track to build the leaderboard for.

    Returns
    -------
    pd.DataFrame
        Leaderboard with columns:
        rank, method_id, mean_ap, mean_auroc, median_ap, median_ap_ci95_lo,
        median_ap_ci95_hi, mean_runtime_s, success_rate, category, note.

    Eligibility filtering
    ---------------------
    - success_rate >= 0.80
    - consumes_labels == False (no supervised methods)
    - no NaN scores
    - runtime outliers <= 5%
    """
    track_df = eval_df[eval_df["track"].str.upper() == track.upper()].copy()
    if track_df.empty:
        logger.warning(f"build_leaderboard: no data for track {track}")
        return pd.DataFrame()

    # Drop rows with errors or NaN AP
    if "error" in track_df.columns:
        track_df = track_df[track_df["error"].isna()]
    track_df = track_df[track_df["ap"].notna()]
    if track_df.empty:
        return pd.DataFrame()

    # Compute per-method aggregates
    methods = track_df["method_id"].unique()
    rows = []
    for method_id in methods:
        method_df = track_df[track_df["method_id"] == method_id]
        n_total = len(eval_df[(eval_df["track"].str.upper() == track.upper()) & (eval_df["method_id"] == method_id)])
        n_success = len(method_df)
        success_rate = n_success / max(1, n_total)

        # Runtime outlier check: flag if >5% of runs are >3 IQR above Q3
        runtime_outlier_fraction = 0.0
        if "runtime_seconds" in method_df.columns:
            runtimes = method_df["runtime_seconds"].dropna()
            if len(runtimes) > 0:
                q1 = runtimes.quantile(0.25)
                q3 = runtimes.quantile(0.75)
                iqr = q3 - q1
                threshold = q3 + 3 * iqr
                outlier_count = (runtimes > threshold).sum()
                runtime_outlier_fraction = outlier_count / len(runtimes)

        # Check for NaN scores
        has_nan_scores = bool(method_df["ap"].isna().any())

        # consumes_labels - infer from method_id heuristic if column absent
        consumes_labels = False
        if "consumes_labels" in method_df.columns:
            consumes_labels = bool(method_df["consumes_labels"].any())
        else:
            consumes_labels = method_id in ("hvg_logreg",)

        median_ap = float(method_df["ap"].median())
        lo, hi = _bootstrap_median_ci(method_df["ap"])

        rows.append({
            "method_id": method_id,
            "mean_ap": float(method_df["ap"].mean()),
            "mean_auroc": float(method_df["auroc"].mean()) if "auroc" in method_df.columns else float("nan"),
            "median_ap": median_ap,
            "median_ap_ci95_lo": lo,
            "median_ap_ci95_hi": hi,
            "mean_runtime_s": float(method_df["runtime_seconds"].mean()) if "runtime_seconds" in method_df.columns else float("nan"),
            "success_rate": success_rate,
            "runtime_outlier_fraction": runtime_outlier_fraction,
            "has_nan_scores": has_nan_scores,
            "consumes_labels": consumes_labels,
            "n_units": n_success,
            "n_datasets": method_df["dataset_id"].nunique() if "dataset_id" in method_df.columns else 0,
        })

    lb = pd.DataFrame(rows)

    # Eligibility filtering
    eligible = lb[
        (lb["success_rate"] >= 0.80)
        & (~lb["consumes_labels"])
        & (~lb["has_nan_scores"])
        & (lb["runtime_outlier_fraction"] <= 0.05)
    ].copy()

    if eligible.empty:
        logger.warning("build_leaderboard: no methods meet eligibility criteria.")
        eligible = lb.copy()

    # Tie-breaking: higher AP -> higher AUROC -> lower runtime
    eligible = eligible.sort_values(
        ["mean_ap", "mean_auroc", "mean_runtime_s"],
        ascending=[False, False, True],
    ).reset_index(drop=True)
    eligible["rank"] = range(1, len(eligible) + 1)

    # Assign categories
    def _category(mid: str) -> str:
        if mid in ("hvg_logreg",):
            return "supervised_ceiling"
        if mid in ("random_baseline", "expr_threshold"):
            return "naive_baseline"
        if mid in ("MACE", "CopyKAT", "SCEVAN", "scATOMIC"):
            return "orthogonal"
        if mid == "CaSee":
            return "exploratory"
        return "primary_competitor"

    eligible["category"] = eligible["method_id"].map(_category)

    # Notes
    def _note(row: pd.Series) -> str:
        if row["category"] == "supervised_ceiling":
            return "CEILING - supervised upper bound"
        if row["category"] == "naive_baseline":
            return "FLOOR - naive baseline"
        if row["category"] == "orthogonal":
            return "ORTHOGONAL - excluded from primary"
        if row["category"] == "exploratory":
            return "EXPLORATORY"
        return "PRIMARY COMPETITOR"

    eligible["note"] = eligible.apply(_note, axis=1)

    # Reorder columns
    col_order = [
        "rank", "method_id", "mean_ap", "mean_auroc", "median_ap",
        "median_ap_ci95_lo", "median_ap_ci95_hi", "category", "note",
        "mean_runtime_s", "success_rate", "n_units", "n_datasets",
    ]
    col_order = [c for c in col_order if c in eligible.columns]
    eligible = eligible[col_order]
    return eligible


def freeze_leaderboard(
    leaderboard_df: pd.DataFrame,
    tag: str,
    out_dir: Path,
) -> Path:
    """Copy leaderboard to a snapshot directory with provenance JSON.

    Parameters
    ----------
    leaderboard_df : pd.DataFrame
        Leaderboard DataFrame.
    tag : str
        Snapshot tag (e.g. "v1.0.0").
    out_dir : Path
        Output directory for the snapshot.

    Returns
    -------
    Path
        Path to the written CSV snapshot.
    """
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    csv_path = out_dir / f"leaderboard_{tag}.csv"
    leaderboard_df.to_csv(csv_path, index=False)

    provenance = {
        "tag": tag,
        "n_methods": len(leaderboard_df),
        "columns": leaderboard_df.columns.tolist(),
        "snapshot_path": str(csv_path),
    }
    prov_path = out_dir / f"leaderboard_{tag}_provenance.json"
    with open(prov_path, "w") as f:
        json.dump(provenance, f, indent=2)

    logger.info(f"Leaderboard frozen: {csv_path}")
    return csv_path
