"""Figure generation module."""

from __future__ import annotations

from rarecellbenchmark.figures.calibration import plot_reliability_diagram
from rarecellbenchmark.figures.critical_difference import plot_critical_difference
from rarecellbenchmark.figures.leaderboard import plot_leaderboard
from rarecellbenchmark.figures.method_audit import plot_method_audit
from rarecellbenchmark.figures.pipeline import plot_pipeline
from rarecellbenchmark.figures.prevalence import plot_prevalence_stratification
from rarecellbenchmark.figures.rank_forest import plot_rank_forest
from rarecellbenchmark.figures.runtime import plot_runtime_comparison
from rarecellbenchmark.figures.sensitivity import plot_sensitivity
from rarecellbenchmark.figures.style import apply_paper_style
from rarecellbenchmark.figures.track_design import plot_track_design

__all__ = [
    "plot_leaderboard",
    "plot_sensitivity",
    "plot_critical_difference",
    "plot_prevalence_stratification",
    "plot_reliability_diagram",
    "plot_runtime_comparison",
    "plot_rank_forest",
    "plot_pipeline",
    "plot_track_design",
    "plot_method_audit",
    "apply_paper_style",
]
