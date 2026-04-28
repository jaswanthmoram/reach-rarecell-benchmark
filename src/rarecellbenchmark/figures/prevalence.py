"""Prevalence stratification figure."""

from __future__ import annotations

import logging
from pathlib import Path

import pandas as pd

from rarecellbenchmark.figures.style import METHOD_COLORS, apply_paper_style

logger = logging.getLogger(__name__)


def plot_prevalence_stratification(eval_df: pd.DataFrame, out_path: Path) -> None:
    """Plot AP stratified by prevalence bins.

    Parameters
    ----------
    eval_df : pd.DataFrame
        Evaluation DataFrame with columns *method_id*, *prevalence_bin*, and *ap*.
    out_path : Path
        Output file path.
    """
    with apply_paper_style():
        import matplotlib.pyplot as plt

        if eval_df.empty or "prevalence_bin" not in eval_df.columns:
            logger.warning("plot_prevalence_stratification: missing prevalence_bin column.")
            return

        # Aggregate mean AP per method × bin
        agg = eval_df.groupby(["method_id", "prevalence_bin"])["ap"].mean().reset_index()
        pivot = agg.pivot(index="method_id", columns="prevalence_bin", values="ap")

        # Order bins logically
        bin_order = ["<0.1%", "0.1-0.5%", "0.5-1%", "1-5%", ">5%"]
        pivot = pivot[[c for c in bin_order if c in pivot.columns]]

        fig, ax = plt.subplots(figsize=(max(10, len(pivot.columns) * 1.2), 6))
        colors = [METHOD_COLORS.get(m, "#333333") for m in pivot.index]
        pivot.plot(kind="bar", ax=ax, color=colors, width=0.75, edgecolor="black")

        ax.set_ylabel("Mean Average Precision (AP)", fontsize=11)
        ax.set_xlabel("Method", fontsize=11)
        ax.set_title("Prevalence-Stratified Performance", fontweight="bold", fontsize=13)
        ax.legend(title="Prevalence Bin", fontsize=8, loc="upper right")
        ax.set_ylim(0, 1.05)
        plt.xticks(rotation=45, ha="right", fontsize=9)
        plt.tight_layout()
        plt.savefig(out_path, bbox_inches="tight", dpi=300)
        plt.close()
        logger.info(f"Prevalence stratification plot saved: {out_path}")
