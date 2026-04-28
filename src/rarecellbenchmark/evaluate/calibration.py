"""Calibration analysis utilities."""

from __future__ import annotations

import logging

import numpy as np
from sklearn.calibration import calibration_curve

logger = logging.getLogger(__name__)


def reliability_diagram(
    y_true: np.ndarray,
    scores: np.ndarray,
    n_bins: int = 10,
) -> tuple[np.ndarray, np.ndarray]:
    """Compute bin centers and bin accuracies for a reliability diagram.

    Parameters
    ----------
    y_true : np.ndarray
        Binary ground-truth labels.
    scores : np.ndarray
        Predicted scores / probabilities.
    n_bins : int, default 10
        Number of equal-width bins.

    Returns
    -------
    tuple[np.ndarray, np.ndarray]
        (bin_centers, bin_accuracies)
    """
    y_true = np.asarray(y_true)
    scores = np.asarray(scores)
    scores = np.clip(scores, 0.0, 1.0)

    bin_boundaries = np.linspace(0, 1, n_bins + 1)
    bin_centers = (bin_boundaries[:-1] + bin_boundaries[1:]) / 2
    bin_accuracies = np.zeros(n_bins)

    for i, (lower, upper) in enumerate(zip(bin_boundaries[:-1], bin_boundaries[1:])):
        if i == 0:
            in_bin = (scores >= lower) & (scores <= upper)
        else:
            in_bin = (scores > lower) & (scores <= upper)
        if in_bin.sum() > 0:
            bin_accuracies[i] = y_true[in_bin].mean()
        else:
            bin_accuracies[i] = np.nan

    return bin_centers, bin_accuracies


def compute_calibration_curve(
    y_true: np.ndarray,
    scores: np.ndarray,
    n_bins: int = 10,
) -> tuple[np.ndarray, np.ndarray]:
    """Compute a calibration curve using sklearn.

    Parameters
    ----------
    y_true : np.ndarray
        Binary ground-truth labels.
    scores : np.ndarray
        Predicted scores / probabilities.
    n_bins : int, default 10
        Number of bins.

    Returns
    -------
    tuple[np.ndarray, np.ndarray]
        (prob_true, prob_pred) - observed frequency and mean predicted
        probability per bin.
    """
    y_true = np.asarray(y_true)
    scores = np.asarray(scores)
    scores = np.clip(scores, 0.0, 1.0)

    prob_true, prob_pred = calibration_curve(y_true, scores, n_bins=n_bins, strategy="uniform")
    return prob_true, prob_pred
