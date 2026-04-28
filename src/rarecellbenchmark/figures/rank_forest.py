"""Rank forest plot (CI-based ranking visualization)."""

from __future__ import annotations

import logging
from pathlib import Path

import numpy as np
import pandas as pd

from rarecellbenchmark.figures.style import METHOD_COLORS, apply_paper_style

logger = logging.getLogger(__name__)


def plot_rank_forest(rank_ci_df: pd.DataFrame, out_path: Path) -> None:
    """Forest plot of method ranks with confidence intervals.

    Parameters
    ----------
    rank_ci_df : pd.DataFrame
        DataFrame expected columns:
        - *method_id*
        - *rank* (mean or median rank)
        - *ci_lo* (lower bound)
        - *ci_hi* (upper bound)
    out_path : Path
        Output file path.
    """
    with apply_paper_style():
        import matplotlib.pyplot as plt

        if rank_ci_df.empty:
            logger.warning("plot_rank_forest: empty DataFrame.")
            return

        required = {"method_id", "rank", "ci_lo", "ci_hi"}
        if not required.issubset(rank_ci_df.columns):
            logger.warning(f"plot_rank_forest: missing columns {required - set(rank_ci_df.columns)}")
            return

        df = rank_ci_df.sort_values("rank", ascending=True).copy()
        y_pos = np.arange(len(df))
        colors = [METHOD_COLORS.get(m, "#333333") for m in df["method_id"]]

        fig, ax = plt.subplots(figsize=(max(8, len(df) * 0.4), 7))
        ax.errorbar(
            df["rank"],
            y_pos,
            xerr=[df["rank"] - df["ci_lo"], df["ci_hi"] - df["rank"]],
            fmt="o",
            color="black",
            ecolor=colors,
            capsize=4,
            markersize=6,
        )

        ax.set_yticks(y_pos)
        ax.set_yticklabels(df["method_id"], fontsize=9)
        ax.invert_yaxis()
        ax.set_xlabel("Rank (lower is better)", fontsize=11)
        ax.set_title("Rank Forest Plot with 95% CI", fontweight="bold", fontsize=13)
        ax.axvline(x=df["rank"].median(), color="grey", linestyle="--", alpha=0.5)
        plt.tight_layout()
        plt.savefig(out_path, bbox_inches="tight", dpi=300)
        plt.close()
        logger.info(f"Rank forest plot saved: {out_path}")
