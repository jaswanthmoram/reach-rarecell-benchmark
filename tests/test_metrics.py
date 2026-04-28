"""Tests for core evaluation metrics."""

import numpy as np
import pytest
from sklearn.metrics import (
    average_precision_score,
    balanced_accuracy_score,
    roc_auc_score,
)

from rarecellbenchmark.evaluate.metrics import (
    average_precision,
    auroc,
    balanced_accuracy,
    expected_calibration_error,
    f1_at_k,
    precision_at_k,
    recall_at_k,
)


def test_average_precision_known_arrays() -> None:
    y_true = np.array([0, 0, 1, 1])
    scores = np.array([0.1, 0.4, 0.35, 0.8])
    expected = average_precision_score(y_true, scores)
    assert average_precision(y_true, scores) == pytest.approx(expected)


def test_auroc_known_arrays() -> None:
    y_true = np.array([0, 0, 1, 1])
    scores = np.array([0.1, 0.4, 0.35, 0.8])
    expected = roc_auc_score(y_true, scores)
    assert auroc(y_true, scores) == pytest.approx(expected)


def test_precision_at_k_known_arrays() -> None:
    y_true = np.array([0, 0, 1, 1])
    scores = np.array([0.1, 0.4, 0.35, 0.8])
    # top-1: index 3 (positive) -> 1/1
    assert precision_at_k(y_true, scores, k=1) == pytest.approx(1.0)
    # top-2: indices 3,1 -> 1 positive / 2 -> 0.5
    assert precision_at_k(y_true, scores, k=2) == pytest.approx(0.5)
    # top-3: indices 3,1,2 -> 2 positive / 3
    assert precision_at_k(y_true, scores, k=3) == pytest.approx(2.0 / 3.0)


def test_recall_at_k_known_arrays() -> None:
    y_true = np.array([0, 0, 1, 1])
    scores = np.array([0.1, 0.4, 0.35, 0.8])
    # 2 positives total
    assert recall_at_k(y_true, scores, k=1) == pytest.approx(0.5)
    assert recall_at_k(y_true, scores, k=2) == pytest.approx(0.5)
    assert recall_at_k(y_true, scores, k=3) == pytest.approx(1.0)


def test_f1_at_k_known_arrays() -> None:
    y_true = np.array([0, 0, 1, 1])
    scores = np.array([0.1, 0.4, 0.35, 0.8])
    precision = precision_at_k(y_true, scores, k=2)
    recall = recall_at_k(y_true, scores, k=2)
    expected = 2 * precision * recall / (precision + recall)
    assert f1_at_k(y_true, scores, k=2) == pytest.approx(expected)


def test_balanced_accuracy_known() -> None:
    y_true = np.array([0, 0, 1, 1])
    y_pred = np.array([0, 1, 1, 1])
    expected = balanced_accuracy_score(y_true, y_pred)
    assert balanced_accuracy(y_true, y_pred) == pytest.approx(expected)


def test_expected_calibration_error_basic() -> None:
    y_true = np.array([0, 0, 1, 1])
    scores = np.array([0.1, 0.4, 0.35, 0.8])
    ece = expected_calibration_error(y_true, scores, n_bins=2)
    assert isinstance(ece, float)
    assert 0.0 <= ece <= 1.0
