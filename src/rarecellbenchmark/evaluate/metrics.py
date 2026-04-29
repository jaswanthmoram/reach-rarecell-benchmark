"""Core metric functions for benchmark evaluation."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Optional

import numpy as np
import pandas as pd
from sklearn.metrics import (
    average_precision_score,
    balanced_accuracy_score,
    roc_auc_score,
)

logger = logging.getLogger(__name__)


def load_binary_labels(labels_path: Path) -> pd.Series:
    """Load benchmark labels as a binary Series indexed by cell_id.

    Supported public formats:
    - ``cell_id`` + numeric ``y_true`` (toy/public label files)
    - ``cell_id`` + string ``true_label`` with ``positive``/``background``
    - indexed parquet with either ``y_true`` or ``true_label``
    """
    labels = pd.read_parquet(labels_path)
    if "cell_id" in labels.columns:
        labels = labels.set_index("cell_id", drop=False)
        labels.index = labels.index.astype(str)

    if "y_true" in labels.columns:
        raw = labels["y_true"]
        if pd.api.types.is_numeric_dtype(raw):
            y_true = raw.astype(int)
        else:
            y_true = raw.astype(str).str.lower().isin({"1", "true", "positive", "malignant"}).astype(int)
    elif "true_label" in labels.columns:
        raw = labels["true_label"]
        if pd.api.types.is_numeric_dtype(raw):
            y_true = raw.astype(int)
        else:
            y_true = raw.astype(str).str.lower().isin({"1", "true", "positive", "malignant"}).astype(int)
    else:
        raise ValueError(
            f"Label file {labels_path} must contain either 'y_true' or 'true_label'."
        )

    y_true.index = y_true.index.astype(str)
    return y_true


def load_prediction_scores(predictions_csv: Path) -> pd.Series:
    """Load a prediction CSV as scores indexed by cell_id."""
    predictions = pd.read_csv(predictions_csv)
    if "score" not in predictions.columns:
        raise ValueError(f"Prediction file {predictions_csv} is missing required column 'score'.")

    if "cell_id" in predictions.columns:
        scores = predictions.set_index("cell_id")["score"]
    elif len(predictions.columns) >= 2:
        scores = predictions.set_index(predictions.columns[0])["score"]
    else:
        raise ValueError(
            f"Prediction file {predictions_csv} must contain a 'cell_id' column or an index column."
        )

    scores.index = scores.index.astype(str)
    return scores.astype(float)


def average_precision(y_true: np.ndarray, scores: np.ndarray) -> float:
    """Compute Average Precision (area under precision-recall curve).

    Parameters
    ----------
    y_true : np.ndarray
        Binary ground-truth labels (1 = positive, 0 = background).
    scores : np.ndarray
        Continuous scores (higher = more likely positive).

    Returns
    -------
    float
        Average precision score.
    """
    y_true = np.asarray(y_true)
    scores = np.asarray(scores)
    n_pos = y_true.sum()
    if n_pos == 0:
        return 0.0
    return float(average_precision_score(y_true, scores))


def auroc(y_true: np.ndarray, scores: np.ndarray) -> float:
    """Compute AUROC.

    Returns 0.5 if all labels are the same (no discriminable pairs).
    """
    y_true = np.asarray(y_true)
    scores = np.asarray(scores)
    if y_true.sum() == 0 or y_true.sum() == len(y_true):
        return 0.5
    return float(roc_auc_score(y_true, scores))


def _threshold_at_k(scores: np.ndarray, k: int) -> np.ndarray:
    """Return binary predictions where top-k scores are predicted positive."""
    scores = np.asarray(scores)
    y_pred = np.zeros(len(scores), dtype=int)
    if k > 0:
        top_k_idx = np.argsort(-scores)[:k]
        y_pred[top_k_idx] = 1
    return y_pred


def precision_at_k(y_true: np.ndarray, scores: np.ndarray, k: int) -> float:
    """Precision when threshold is set such that top-k cells are predicted positive.

    If *k* is zero, returns 0.0.
    """
    y_true = np.asarray(y_true)
    y_pred = _threshold_at_k(scores, k)
    tp = int((y_pred * y_true).sum())
    fp = int((y_pred * (1 - y_true)).sum())
    if tp + fp == 0:
        return 0.0
    return float(tp / (tp + fp))


def recall_at_k(y_true: np.ndarray, scores: np.ndarray, k: int) -> float:
    """Recall when threshold is set such that top-k cells are predicted positive.

    If there are no positives, returns 0.0.
    """
    y_true = np.asarray(y_true)
    n_pos = int(y_true.sum())
    if n_pos == 0:
        return 0.0
    y_pred = _threshold_at_k(scores, k)
    tp = int((y_pred * y_true).sum())
    return float(tp / n_pos)


def f1_at_k(y_true: np.ndarray, scores: np.ndarray, k: int) -> float:
    """F1 score when threshold is set such that top-k cells are predicted positive.

    If *k* is zero or there are no positives, returns 0.0.
    """
    precision = precision_at_k(y_true, scores, k)
    recall = recall_at_k(y_true, scores, k)
    if precision + recall == 0:
        return 0.0
    return float(2 * precision * recall / (precision + recall))


def balanced_accuracy(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Balanced accuracy (average of sensitivity and specificity).

    Parameters
    ----------
    y_true : np.ndarray
        Binary ground-truth labels.
    y_pred : np.ndarray
        Binary predicted labels.

    Returns
    -------
    float
        Balanced accuracy score.
    """
    return float(balanced_accuracy_score(y_true, y_pred))


def expected_calibration_error(
    y_true: np.ndarray, scores: np.ndarray, n_bins: int = 10
) -> float:
    """Compute Expected Calibration Error (ECE).

    Parameters
    ----------
    y_true : np.ndarray
        Binary ground-truth labels.
    scores : np.ndarray
        Predicted probabilities / scores in [0, 1].
    n_bins : int, default 10
        Number of equal-width bins.

    Returns
    -------
    float
        Expected calibration error.
    """
    y_true = np.asarray(y_true)
    scores = np.asarray(scores)
    scores = np.clip(scores, 0.0, 1.0)

    bin_boundaries = np.linspace(0, 1, n_bins + 1)
    bin_lowers = bin_boundaries[:-1]
    bin_uppers = bin_boundaries[1:]

    ece = 0.0
    for lower, upper in zip(bin_lowers, bin_uppers):
        in_bin = (scores > lower) & (scores <= upper)
        if lower == 0.0:
            in_bin = (scores >= lower) & (scores <= upper)
        prop_in_bin = in_bin.mean()
        if prop_in_bin > 0:
            accuracy_in_bin = y_true[in_bin].mean()
            avg_confidence_in_bin = scores[in_bin].mean()
            ece += np.abs(avg_confidence_in_bin - accuracy_in_bin) * prop_in_bin
    return float(ece)


def compute_metrics(
    y_true: np.ndarray,
    scores: np.ndarray,
    n_bins: int = 10,
) -> dict[str, float]:
    """Compute all standard metrics for a single unit.

    Parameters
    ----------
    y_true : np.ndarray
        Binary ground-truth labels.
    scores : np.ndarray
        Continuous scores.
    n_bins : int, default 10
        Number of bins for calibration error.

    Returns
    -------
    dict
        Dictionary with keys: ap, auroc, f1_at_k, precision_at_k, recall_at_k,
        balanced_accuracy_top_k, ece.
    """
    y_true = np.asarray(y_true)
    scores = np.asarray(scores)
    k = int(y_true.sum())

    y_pred_top_k = _threshold_at_k(scores, k)

    return {
        "ap": average_precision(y_true, scores),
        "auroc": auroc(y_true, scores),
        "f1_at_k": f1_at_k(y_true, scores, k),
        "precision_at_k": precision_at_k(y_true, scores, k),
        "recall_at_k": recall_at_k(y_true, scores, k),
        "balanced_accuracy_top_k": balanced_accuracy(y_true, y_pred_top_k),
        "ece": expected_calibration_error(y_true, scores, n_bins),
    }


def evaluate_unit(
    unit_manifest: dict,
    scores: pd.Series,
    labels_path: Path,
    tier_filter: str = "all",
    strict: bool = False,
) -> dict[str, Any]:
    """Evaluate a single method on a single benchmark unit.

    Parameters
    ----------
    unit_manifest : dict
        Unit metadata (from manifest.json).
    scores : pd.Series
        Method scores, indexed by cell_id.
    labels_path : Path
        Path to labels.parquet.
    tier_filter : str
        Which positives/negatives to use (unused but kept for API compat).
    strict : bool
        If True, raise on missing scores.

    Returns
    -------
    dict
        Dict with all metrics and metadata.
    """
    true_labels = load_binary_labels(labels_path)

    # Align scores and labels
    aligned_scores = scores.reindex(true_labels.index)
    missing_mask = aligned_scores.isna()
    n_missing = int(missing_mask.sum())
    n_total = len(true_labels)
    frac_missing = n_missing / max(1, n_total)

    if n_missing > 0:
        msg = (
            f"Missing scores for {n_missing}/{n_total} cells "
            f"({frac_missing:.1%}) in unit {unit_manifest.get('unit_id', 'unknown')}"
        )
        if strict:
            raise ValueError(msg)
        if frac_missing >= 0.5:
            logger.error(f"{msg}. Treating as degenerate run.")
        else:
            logger.warning(msg)
        fill_value = 0.0 if scores.empty else float(np.nanmin(scores.values)) - 1.0
        aligned_scores = aligned_scores.fillna(fill_value)

    y_true = true_labels.astype(int).values
    y_score = aligned_scores.values

    if y_true.sum() == 0:
        logger.warning(f"No positive cells in unit {unit_manifest.get('unit_id')}")
        return {
            "unit_id": unit_manifest.get("unit_id"),
            "ap": float("nan"),
            "auroc": float("nan"),
            "f1_at_k": float("nan"),
            "precision_at_k": float("nan"),
            "recall_at_k": float("nan"),
            "balanced_accuracy_top_k": float("nan"),
            "ece": float("nan"),
            "n_cells": len(y_true),
            "n_positive": 0,
            "warning": "no_positives",
        }

    metrics = compute_metrics(y_true, y_score)
    prevalence = float(y_true.sum() / len(y_true))

    return {
        "unit_id": unit_manifest.get("unit_id"),
        "dataset_id": unit_manifest.get("dataset_id"),
        "track": unit_manifest.get("track"),
        "tier": unit_manifest.get("tier"),
        "replicate": unit_manifest.get("replicate"),
        "prevalence": unit_manifest.get("prevalence"),
        "noise_condition": unit_manifest.get("noise_condition"),
        "duplicate_fraction": unit_manifest.get("duplicate_fraction"),
        "n_cells": len(y_true),
        "n_positive": int(y_true.sum()),
        "n_background": int((y_true == 0).sum()),
        "n_missing_scores": n_missing,
        "frac_missing_scores": float(n_missing / max(1, len(y_true))),
        **metrics,
        "ap_chance": prevalence,
        "ap_above_chance": float(metrics["ap"] - prevalence),
    }


def evaluate_predictions(
    predictions_csv: Path,
    labels_path: Path,
    run_meta: Optional[dict] = None,
) -> dict[str, Any]:
    """Evaluate predictions stored in a CSV against ground-truth labels.

    Parameters
    ----------
    predictions_csv : Path
        Path to predictions CSV with columns *cell_id* and *score*.
    labels_path : Path
        Path to labels parquet with column *true_label*.
    run_meta : dict, optional
        Run metadata (method_id, unit_id, etc.) to include in output.

    Returns
    -------
    dict
        Evaluation result dictionary.
    """
    scores = load_prediction_scores(predictions_csv)
    true_labels = load_binary_labels(labels_path)

    aligned_scores = scores.reindex(true_labels.index)
    n_missing = int(aligned_scores.isna().sum())
    n_total = len(true_labels)

    if n_missing > 0:
        fill_value = 0.0 if scores.empty else float(np.nanmin(scores.values)) - 1.0
        aligned_scores = aligned_scores.fillna(fill_value)

    y_true = true_labels.astype(int).values
    y_score = aligned_scores.values

    run_meta = run_meta or {}

    if y_true.sum() == 0:
        return {
            "unit_id": run_meta.get("unit_id"),
            "method_id": run_meta.get("method_id"),
            "dataset_id": run_meta.get("dataset_id"),
            "track": run_meta.get("track"),
            "tier": run_meta.get("tier"),
            "replicate": run_meta.get("replicate"),
            "ap": float("nan"),
            "auroc": float("nan"),
            "f1_at_k": float("nan"),
            "precision_at_k": float("nan"),
            "recall_at_k": float("nan"),
            "balanced_accuracy_top_k": float("nan"),
            "ece": float("nan"),
            "n_cells": n_total,
            "n_positive": 0,
            "n_background": n_total,
            "n_missing_scores": n_missing,
            "runtime_seconds": run_meta.get("runtime_seconds", 0),
            "peak_ram_mb": run_meta.get("peak_ram_mb", -1),
            "warning": "no_positives",
        }

    metrics = compute_metrics(y_true, y_score)
    prevalence = float(y_true.sum() / len(y_true))

    return {
        "unit_id": run_meta.get("unit_id"),
        "method_id": run_meta.get("method_id"),
        "dataset_id": run_meta.get("dataset_id"),
        "track": run_meta.get("track"),
        "tier": run_meta.get("tier"),
        "replicate": run_meta.get("replicate"),
        "prevalence": run_meta.get("prevalence"),
        "noise_condition": run_meta.get("noise_condition"),
        "duplicate_fraction": run_meta.get("duplicate_fraction"),
        "n_cells": n_total,
        "n_positive": int(y_true.sum()),
        "n_background": int((y_true == 0).sum()),
        "n_missing_scores": n_missing,
        **metrics,
        "ap_chance": prevalence,
        "ap_above_chance": float(metrics["ap"] - prevalence),
        "runtime_seconds": run_meta.get("runtime_seconds", 0),
        "peak_ram_mb": run_meta.get("peak_ram_mb", -1),
        "method_fidelity": run_meta.get("method_fidelity", "unknown"),
        "partial": run_meta.get("partial", False),
    }
