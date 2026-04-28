"""Deterministic seed derivation for track generators."""

from __future__ import annotations

import hashlib

MAX_SEED = 2**31 - 1


def get_track_seed(global_seed: int, track_id: str, dataset_id: str, replicate: int) -> int:
    """Derive a deterministic, reproducible seed for a given track unit."""
    key = f"{track_id}||{dataset_id}||{replicate}".encode("utf-8")
    digest = hashlib.sha256(key).digest()
    derived = int.from_bytes(digest[:8], "big") % MAX_SEED
    return int((global_seed + derived) % MAX_SEED)
