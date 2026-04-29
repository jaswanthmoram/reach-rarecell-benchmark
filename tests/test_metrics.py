"""Tests for core evaluation metrics."""

from pathlib import Path

import numpy as np
import pandas as pd
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
    evaluate_predictions,
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


def test_evaluate_predictions_accepts_cell_id_csv_and_y_true_labels(tmp_path: Path) -> None:
    """CLI/wrapper prediction CSVs use explicit cell_id columns and toy labels use y_true."""
    predictions_path = tmp_path / "toy_unit_01_predictions.csv"
    labels_path = tmp_path / "toy_unit_01_labels.parquet"

    pd.DataFrame(
        {
            "cell_id": ["cell_0", "cell_1", "cell_2", "cell_3"],
            "score": [0.9, 0.8, 0.2, 0.1],
        }
    ).to_csv(predictions_path, index=False)
    pd.DataFrame(
        {
            "cell_id": ["cell_0", "cell_1", "cell_2", "cell_3"],
            "y_true": [1, 0, 1, 0],
        }
    ).to_parquet(labels_path)

    result = evaluate_predictions(
        predictions_path,
        labels_path,
        run_meta={"method_id": "expr_threshold", "unit_id": "toy_unit_01", "track": "A"},
    )

    assert result["method_id"] == "expr_threshold"
    assert result["unit_id"] == "toy_unit_01"
    assert result["n_cells"] == 4
    assert result["n_positive"] == 2
    assert result["ap"] == pytest.approx(average_precision_score([1, 0, 1, 0], [0.9, 0.8, 0.2, 0.1]))
    assert result["auroc"] == pytest.approx(roc_auc_score([1, 0, 1, 0], [0.9, 0.8, 0.2, 0.1]))
    assert result["precision_at_k"] == pytest.approx(0.5)
