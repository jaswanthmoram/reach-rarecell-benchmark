"""Sensitivity analysis figure."""

from __future__ import annotations

import logging
from pathlib import Path

import pandas as pd

from rarecellbenchmark.figures.style import apply_paper_style

logger = logging.getLogger(__name__)


def plot_sensitivity(sens_df: pd.DataFrame, out_path: Path) -> None:
    """Plot sensitivity analysis results.

    Parameters
    ----------
    sens_df : pd.DataFrame
        Sensitivity DataFrame. Expected columns depend on the specific
        sensitivity analysis (e.g. *method_id*, *ap*, *condition*).
    out_path : Path
        Output file path.
    """
    with apply_paper_style():
        import matplotlib.pyplot as plt

        if sens_df.empty:
            logger.warning("plot_sensitivity: empty DataFrame.")
            return

        fig, ax = plt.subplots(figsize=(10, 6))

        # Heuristic: if there's a noise_condition or condition column, group-bar
        condition_col = None
        for candidate in ("noise_condition", "condition", "tier_filter", "prevalence_bin"):
            if candidate in sens_df.columns:
                condition_col = candidate
                break

        if condition_col is not None and "ap" in sens_df.columns:
            pivot = sens_df.pivot_table(index="method_id", columns=condition_col, values="ap", aggfunc="mean")
            pivot = pivot.sort_values(by=pivot.columns[0], ascending=False)
            pivot.plot(kind="bar", ax=ax, colormap="tab10", width=0.75, edgecolor="black")
            ax.legend(title=condition_col.replace("_", " ").title(), fontsize=8, loc="upper right")
        elif "ap" in sens_df.columns and "method_id" in sens_df.columns:
            sens_sorted = sens_df.sort_values("ap", ascending=False)
            ax.bar(sens_sorted["method_id"], sens_sorted["ap"], color="#2196F3", edgecolor="black")
            plt.xticks(rotation=45, ha="right", fontsize=9)
        else:
            logger.warning("plot_sensitivity: unsupported DataFrame shape.")
            return

        ax.set_ylabel("Mean AP", fontsize=11)
        ax.set_title("Sensitivity Analysis", fontweight="bold", fontsize=13)
        ax.set_ylim(0, 1.05)
        plt.tight_layout()
        plt.savefig(out_path, bbox_inches="tight", dpi=300)
        plt.close()
        logger.info(f"Sensitivity plot saved: {out_path}")
