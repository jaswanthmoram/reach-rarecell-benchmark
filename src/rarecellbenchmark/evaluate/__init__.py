"""Evaluate module - prediction evaluation and leaderboard construction."""

from __future__ import annotations

from rarecellbenchmark.evaluate.aggregation import (
    aggregate_per_dataset,
    aggregate_per_track,
    aggregate_per_unit,
)
from rarecellbenchmark.evaluate.calibration import (
    compute_calibration_curve,
    reliability_diagram,
)
from rarecellbenchmark.evaluate.leaderboard import build_leaderboard, freeze_leaderboard
from rarecellbenchmark.evaluate.metrics import (
    average_precision,
    auroc,
    balanced_accuracy,
    compute_metrics,
    evaluate_predictions,
    expected_calibration_error,
    f1_at_k,
    precision_at_k,
    recall_at_k,
)
from rarecellbenchmark.evaluate.statistics import (
    bonferroni_correction,
    critical_difference_ranks,
    wilcoxon_signed_rank,
)

__all__ = [
    "evaluate_predictions",
    "compute_metrics",
    "build_leaderboard",
    "freeze_leaderboard",
    "average_precision",
    "auroc",
    "f1_at_k",
    "precision_at_k",
    "recall_at_k",
    "balanced_accuracy",
    "expected_calibration_error",
    "reliability_diagram",
    "compute_calibration_curve",
    "aggregate_per_unit",
    "aggregate_per_track",
    "aggregate_per_dataset",
    "wilcoxon_signed_rank",
    "bonferroni_correction",
    "critical_difference_ranks",
]
