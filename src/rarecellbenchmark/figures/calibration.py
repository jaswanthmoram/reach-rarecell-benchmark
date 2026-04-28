"""Calibration / reliability diagram figure."""

from __future__ import annotations

import logging
from pathlib import Path

import numpy as np

from rarecellbenchmark.evaluate.calibration import reliability_diagram
from rarecellbenchmark.figures.style import apply_paper_style

logger = logging.getLogger(__name__)


def plot_reliability_diagram(calibration_data: dict, out_path: Path) -> None:
    """Plot a reliability diagram from pre-computed calibration data.

    Parameters
    ----------
    calibration_data : dict
        Dictionary with keys:
        - *y_true*: ground-truth labels
        - *scores*: predicted scores
        - *n_bins*: number of bins (optional, default 10)
        - *method_id*: method label (optional)
    out_path : Path
        Output file path.
    """
    with apply_paper_style():
        import matplotlib.pyplot as plt

        y_true = np.asarray(calibration_data.get("y_true", []))
        scores = np.asarray(calibration_data.get("scores", []))
        n_bins = calibration_data.get("n_bins", 10)
        method_id = calibration_data.get("method_id", "method")

        if len(y_true) == 0 or len(scores) == 0:
            logger.warning("plot_reliability_diagram: empty calibration data.")
            return

        bin_centers, bin_accuracies = reliability_diagram(y_true, scores, n_bins=n_bins)

        fig, ax = plt.subplots(figsize=(8, 8))
        ax.plot([0, 1], [0, 1], "k--", label="Perfectly calibrated", linewidth=1.5)
        ax.bar(bin_centers, bin_accuracies, width=1.0 / n_bins, alpha=0.6,
               edgecolor="black", label=method_id)

        ax.set_xlabel("Mean Predicted Score", fontsize=11)
        ax.set_ylabel("Fraction of Positives", fontsize=11)
        ax.set_title("Reliability Diagram", fontweight="bold", fontsize=13)
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)
        ax.legend(fontsize=9)
        plt.tight_layout()
        plt.savefig(out_path, bbox_inches="tight", dpi=300)
        plt.close()
        logger.info(f"Reliability diagram saved: {out_path}")
