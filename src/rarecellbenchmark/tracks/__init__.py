"""REACH track generators."""

from pathlib import Path
from typing import Any

from rarecellbenchmark.tracks.base import BaseTrackGenerator
from rarecellbenchmark.tracks.track_a_generator import TrackAGenerator
from rarecellbenchmark.tracks.track_b_generator import TrackBGenerator
from rarecellbenchmark.tracks.track_c_generator import TrackCGenerator
from rarecellbenchmark.tracks.track_d_generator import TrackDGenerator
from rarecellbenchmark.tracks.track_e_generator import TrackEGenerator

TRACK_GENERATORS: dict[str, type[BaseTrackGenerator]] = {
    "A": TrackAGenerator,
    "B": TrackBGenerator,
    "C": TrackCGenerator,
    "D": TrackDGenerator,
    "E": TrackEGenerator,
}


def generate_track(
    track_id: str,
    dataset_id: str,
    processed_h5ad: Path,
    out_dir: Path,
    config: dict[str, Any],
) -> list[Path]:
    """Dispatch track generation by track_id."""
    generator_cls = TRACK_GENERATORS[track_id]
    generator = generator_cls()
    return generator.generate(dataset_id, processed_h5ad, out_dir, config)
