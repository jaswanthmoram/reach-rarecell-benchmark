from __future__ import annotations

import hashlib
from pathlib import Path


def compute_checksum(path: Path, algorithm: str = "sha256") -> str:
    """Compute a checksum for a file."""
    hasher = hashlib.new(algorithm)
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            hasher.update(chunk)
    return hasher.hexdigest()
