"""Leaderboard bar-plot figure."""

from __future__ import annotations

import logging
from pathlib import Path

import pandas as pd

from rarecellbenchmark.figures.style import METHOD_COLORS, apply_paper_style

logger = logging.getLogger(__name__)


def plot_leaderboard(leaderboard_df: pd.DataFrame, out_path: Path) -> None:
    """Bar plot of mean AP per method.

    Parameters
    ----------
    leaderboard_df : pd.DataFrame
        Leaderboard DataFrame with columns *method_id* and *mean_ap*.
    out_path : Path
        Output file path.
    """
    with apply_paper_style():
        import matplotlib.pyplot as plt

        if leaderboard_df.empty:
            logger.warning("plot_leaderboard: empty leaderboard.")
            return

        df = leaderboard_df.sort_values("mean_ap", ascending=True).copy()
        colors = [METHOD_COLORS.get(m, "#333333") for m in df["method_id"]]

        fig, ax = plt.subplots(figsize=(max(8, len(df) * 0.5), 7))
        bars = ax.barh(df["method_id"], df["mean_ap"], color=colors, edgecolor="black", height=0.6)

        # Add value labels
        for bar, ap in zip(bars, df["mean_ap"]):
            ax.text(bar.get_width() + 0.01, bar.get_y() + bar.get_height() / 2,
                    f"{ap:.3f}", va="center", fontsize=8)

        ax.set_xlim(0, 1.05)
        ax.set_xlabel("Mean Average Precision (AP)", fontsize=11)
        ax.set_title("Leaderboard - Mean AP by Method", fontweight="bold", fontsize=13)
        ax.axvline(x=0.5, color="grey", linestyle=":", alpha=0.5)
        plt.tight_layout()
        plt.savefig(out_path, bbox_inches="tight", dpi=300)
        plt.close()
        logger.info(f"Leaderboard plot saved: {out_path}")
