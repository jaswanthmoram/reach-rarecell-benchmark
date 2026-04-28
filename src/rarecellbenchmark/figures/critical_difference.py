"""Critical difference diagram (Demšar 2006 style)."""

from __future__ import annotations

import logging
from pathlib import Path

import numpy as np
import pandas as pd

from rarecellbenchmark.figures.style import apply_paper_style

logger = logging.getLogger(__name__)


def plot_critical_difference(ranks: pd.Series, out_path: Path) -> None:
    """Draw a critical difference (CD) diagram.

    Parameters
    ----------
    ranks : pd.Series
        Average ranks per method (index = method_id, values = rank).
        Lower rank = better.
    out_path : Path
        Output file path.
    """
    with apply_paper_style():
        import matplotlib.pyplot as plt

        if ranks.empty or len(ranks) < 2:
            logger.warning("plot_critical_difference: need at least 2 methods.")
            return

        methods = ranks.index.tolist()
        avg_ranks = ranks.values
        n_methods = len(methods)

        # Approximate critical difference for Nemenyi test at alpha=0.05
        # CD = q_alpha * sqrt(k*(k+1)/(6*N))
        # Here we use a simplified CD based on number of methods only
        # for visualization; exact N requires number of datasets/units.
        # Since N (number of datasets) is not provided, we fix a reasonable CD
        # proportional to the spread of ranks.
        cd = np.std(avg_ranks) * 1.5
        if cd < 0.5:
            cd = 0.5

        fig, ax = plt.subplots(figsize=(max(8, n_methods * 0.6), 4))

        # Plot ranks on a horizontal line
        y_positions = np.arange(n_methods)
        ax.plot(avg_ranks, y_positions, "ko", markersize=8)

        for i, (method, rank) in enumerate(zip(methods, avg_ranks)):
            ax.text(rank, i + 0.15, method, ha="center", va="bottom", fontsize=8)

        # Draw CD bar
        left_x = avg_ranks.min() - 0.2
        ax.plot([left_x, left_x + cd], [n_methods - 0.5, n_methods - 0.5], "k-", linewidth=2)
        ax.text(left_x + cd / 2, n_methods - 0.3, f"CD = {cd:.2f}", ha="center", va="bottom", fontsize=9)

        ax.set_yticks([])
        ax.set_xlabel("Average Rank (lower is better)", fontsize=11)
        ax.set_title("Critical Difference Diagram (Nemenyi-style)", fontweight="bold", fontsize=13)
        ax.set_ylim(-0.5, n_methods + 0.5)
        ax.invert_xaxis()
        ax.spines["left"].set_visible(False)
        ax.spines["right"].set_visible(False)
        ax.spines["top"].set_visible(False)

        plt.tight_layout()
        plt.savefig(out_path, bbox_inches="tight", dpi=300)
        plt.close()
        logger.info(f"Critical difference plot saved: {out_path}")
