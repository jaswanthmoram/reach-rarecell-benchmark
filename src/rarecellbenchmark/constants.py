"""REACH constants and path helpers."""

from __future__ import annotations

from pathlib import Path

PROJECT_NAME = "REACH"
VERSION = "1.1.0"
GLOBAL_SEED = 42
DEFAULT_CONFIG_PATH = Path("configs/benchmark.yaml")
TRACKS = ["a", "b", "c", "d", "e"]


def _detect_repo_root(start: Path | None = None) -> Path:
    """Walk upward from *start* until a repo marker is found.

    Markers: ``configs/datasets.yaml``, ``run_all.py``, ``.git``.
    Falls back to the package grandparent if nothing is found.
    """
    start = (start or Path(__file__)).resolve()
    markers = ("configs/datasets.yaml", "run_all.py", ".git")
    for candidate in [start, *start.parents]:
        if candidate.is_file():
            continue
        for marker in markers:
            if (candidate / marker).exists():
                return candidate
    # Fallback: src/rarecellbenchmark/constants.py -> repo root is two parents up.
    return Path(__file__).resolve().parents[2]


REPO_ROOT: Path = _detect_repo_root()
