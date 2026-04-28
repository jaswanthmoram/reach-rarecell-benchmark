"""Manifest I/O helpers."""

from __future__ import annotations

import json
import logging
from pathlib import Path

from rarecellbenchmark.schemas import DatasetManifest, TrackUnitManifest

logger = logging.getLogger(__name__)


def load_manifest(path: Path) -> dict:
    """Load a JSON manifest from *path*."""
    path = Path(path)
    with open(path, "r", encoding="utf-8") as fh:
        data = json.load(fh)
    logger.info("Loaded manifest from %s (%d entries)", path, len(data) if isinstance(data, dict) else "?")
    return data


def save_manifest(data: dict, path: Path) -> None:
    """Persist *data* as a JSON manifest at *path*."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2, sort_keys=True)
    logger.info("Saved manifest to %s", path)


__all__ = [
    "load_manifest",
    "save_manifest",
    "DatasetManifest",
    "TrackUnitManifest",
]
