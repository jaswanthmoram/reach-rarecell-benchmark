"""Abstract base class for track generators."""

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any


class BaseTrackGenerator(ABC):
    track_id: str

    @abstractmethod
    def generate(
        self,
        dataset_id: str,
        processed_h5ad: Path,
        out_dir: Path,
        config: dict[str, Any],
    ) -> list[Path]:
        """Generate all units for this track for one dataset. Return list of unit directories."""
