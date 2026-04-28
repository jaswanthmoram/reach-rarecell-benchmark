"""Matplotlib style setup for publication-quality figures."""

from __future__ import annotations

import logging
import warnings
from contextlib import contextmanager
from typing import Any

logger = logging.getLogger(__name__)

# Default paper style parameters
_PAPER_STYLE = {
    "figure.dpi": 300,
    "font.size": 11,
    "axes.titlesize": 13,
    "axes.labelsize": 11,
    "xtick.labelsize": 9,
    "ytick.labelsize": 9,
    "legend.fontsize": 9,
    "axes.spines.top": False,
    "axes.spines.right": False,
    "pdf.fonttype": 42,
    "ps.fonttype": 42,
    "savefig.dpi": 300,
    "figure.figsize": (10, 6),
}

# Color palette matching the original benchmark
METHOD_COLORS = {
    "raceid3": "#2196F3",
    "cellsius": "#9C27B0",
    "scCAD": "#FF9800",
    "deepscena": "#F44336",
    "scAIDE": "#00BCD4",
    "scMalignantFinder": "#795548",
    "SCANER": "#607D8B",
    "random_baseline": "#9E9E9E",
    "expr_threshold": "#BDBDBD",
    "hvg_logreg": "#212121",
    "MACE": "#8D6E63",
    "CopyKAT": "#E91E63",
    "SCEVAN": "#8E24AA",
    "scATOMIC": "#43A047",
    "CaSee": "#FF5722",
}

TIER_COLORS = {
    "T1": "#FFE082",
    "T2": "#FFB300",
    "T3": "#F44336",
    "T4": "#880E4F",
}

TRACK_COLORS = {
    "A": "#1976D2",
    "B": "#9E9E9E",
    "C": "#4CAF50",
    "D": "#FF5722",
    "E": "#9C27B0",
}

# Schematic figure color palette (used by pipeline, track_design, method_audit)
SCHEMATIC_BG = {
    "datasets": "#e0f2fe",
    "preprocessing": "#fef9c3",
    "label_validation": "#ede9fe",
    "track_a": "#bfdbfe",
    "track_b": "#fecaca",
    "track_c": "#fef3c7",
    "track_d": "#bbf7d0",
    "track_e": "#ddd6fe",
    "methods": "#e2e8f0",
    "predictions": "#fee2e2",
    "metrics": "#dcfce7",
    "figures_output": "#fae8ff",
    "neutral": "#1f2937",
    "line": "#94a3b8",
    "chip": "#f0f9ff",
    "tier_t1": "#bfdbfe",
    "tier_t2": "#a5b4fc",
    "tier_t3": "#86efac",
    "tier_t4": "#fde68a",
}

ROLE_COLORS = {
    "Supervised ceiling": "#10b981",
    "Exploratory faithful": "#c026d3",
    "Naive baseline": "#f59e0b",
    "Floor baseline": "#9ca3af",
    "Published method": "#2563eb",
}


def _check_matplotlib() -> Any:
    """Import matplotlib safely and return the pyplot module."""
    try:
        with warnings.catch_warnings():
            warnings.filterwarnings("ignore", category=DeprecationWarning)
            import matplotlib

            matplotlib.use("Agg")
            import matplotlib.pyplot as plt

            return plt
    except ImportError as exc:
        raise ImportError("matplotlib required: pip install matplotlib") from exc


@contextmanager
def apply_paper_style():
    """Context manager that temporarily applies publication style to matplotlib.

    Usage
    -----
    >>> with apply_paper_style():
    ...     fig, ax = plt.subplots()
    ...     ax.plot([0, 1], [0, 1])
    ...     plt.savefig("figure.pdf")
    """
    _check_matplotlib()
    import matplotlib as mpl

    original_rc = {k: mpl.rcParams[k] for k in _PAPER_STYLE}
    mpl.rcParams.update(_PAPER_STYLE)
    try:
        yield
    finally:
        for k, v in original_rc.items():
            mpl.rcParams[k] = v
