"""Runtime comparison figure."""

from __future__ import annotations

import logging
from pathlib import Path

import numpy as np
import pandas as pd

from rarecellbenchmark.figures.style import METHOD_COLORS, apply_paper_style

logger = logging.getLogger(__name__)


def plot_runtime_comparison(runtime_df: pd.DataFrame, out_path: Path) -> None:
    """Scatter plot of runtime vs dataset size (n_cells) per method.

    Parameters
    ----------
    runtime_df : pd.DataFrame
        DataFrame with columns *method_id*, *n_cells*, *runtime_seconds*.
    out_path : Path
        Output file path.
    """
    with apply_paper_style():
        import matplotlib.pyplot as plt

        if runtime_df.empty:
            logger.warning("plot_runtime_comparison: empty DataFrame.")
            return

        required = {"method_id", "n_cells", "runtime_seconds"}
        if not required.issubset(runtime_df.columns):
            logger.warning(f"plot_runtime_comparison: missing columns {required - set(runtime_df.columns)}")
            return

        fig, ax = plt.subplots(figsize=(10, 7))
        methods = runtime_df["method_id"].unique()

        for method in methods:
            mdata = runtime_df[runtime_df["method_id"] == method].dropna(subset=["n_cells", "runtime_seconds"])
            if mdata.empty:
                continue
            color = METHOD_COLORS.get(method, "#333333")
            ax.scatter(
                mdata["n_cells"],
                mdata["runtime_seconds"],
                color=color,
                label=method,
                alpha=0.7,
                s=50,
            )

            # Fit log-linear trend if enough points
            if len(mdata) > 3:
                log_n = np.log(mdata["n_cells"].values + 1)
                log_t = np.log(mdata["runtime_seconds"].values + 1)
                coeffs = np.polyfit(log_n, log_t, 1)
                x_fit = np.linspace(mdata["n_cells"].min(), mdata["n_cells"].max(), 50)
                y_fit = np.exp(coeffs[1]) * x_fit ** coeffs[0]
                ax.plot(x_fit, y_fit, color=color, linestyle="--", alpha=0.5, linewidth=1)

        ax.set_xscale("log")
        ax.set_yscale("log")
        ax.set_xlabel("Dataset size (n cells)", fontsize=11)
        ax.set_ylabel("Runtime (seconds)", fontsize=11)
        ax.set_title("Runtime Comparison vs Dataset Size", fontweight="bold", fontsize=13)
        ax.legend(fontsize=8, loc="upper left", ncol=2)
        ax.axhline(y=3600, color="red", linestyle=":", alpha=0.5, label="1 hour limit")
        plt.tight_layout()
        plt.savefig(out_path, bbox_inches="tight", dpi=300)
        plt.close()
        logger.info(f"Runtime comparison plot saved: {out_path}")
