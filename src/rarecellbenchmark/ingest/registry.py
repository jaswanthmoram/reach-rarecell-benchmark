"""Dataset registry backed by ``configs/datasets.yaml``."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

from rarecellbenchmark.config import DatasetConfig, DatasetRegistry as _DatasetRegistryModel, load_dataset_registry

logger = logging.getLogger(__name__)


class DatasetRegistry:
    """Lightweight wrapper around the Pydantic-validated dataset registry."""

    def __init__(self, path: Optional[Path] = None) -> None:
        if path is None:
            path = Path("configs/datasets.yaml")
        self._path = Path(path)
        self._model: _DatasetRegistryModel = load_dataset_registry(self._path)
        self._by_id: dict[str, DatasetConfig] = {
            ds.dataset_id: ds for ds in self._model.datasets
        }

    def get(self, dataset_id: str) -> DatasetConfig:
        """Retrieve configuration for a single dataset."""
        if dataset_id not in self._by_id:
            raise KeyError(f"Dataset '{dataset_id}' not found in registry.")
        return self._by_id[dataset_id]

    def list_enabled(self) -> list[str]:
        """Return dataset IDs that are not challenge-only (i.e. benchmark-ready)."""
        return [
            ds.dataset_id
            for ds in self._model.datasets
            if not ds.challenge_only
        ]

    def list_all(self) -> list[str]:
        """Return all registered dataset IDs."""
        return list(self._by_id.keys())

    @property
    def datasets(self) -> list[DatasetConfig]:
        """Return the underlying list of dataset configs."""
        return self._model.datasets
