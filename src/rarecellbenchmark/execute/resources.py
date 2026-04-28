"""Resource monitoring utilities."""

from __future__ import annotations

import logging
import os
import time
from dataclasses import dataclass
from typing import Any, Optional

logger = logging.getLogger(__name__)


@dataclass
class ResourceSnapshot:
    """Snapshot of system resources."""

    timestamp: float
    memory_mb: float
    cpu_percent: Optional[float] = None


class ResourceMonitor:
    """Context manager that tracks memory and time for a code block."""

    def __init__(self, poll_interval_s: float = 0.5) -> None:
        self.poll_interval_s = poll_interval_s
        self._start_time: float = 0.0
        self._peak_memory_mb: float = -1.0
        self._elapsed_s: float = 0.0
        self._snapshots: list[ResourceSnapshot] = []
        self._proc: Any = None

    def __enter__(self) -> "ResourceMonitor":
        self._start_time = time.time()
        try:
            import psutil

            self._proc = psutil.Process(os.getpid())
            self._snapshots.append(
                ResourceSnapshot(
                    timestamp=self._start_time,
                    memory_mb=self._proc.memory_info().rss / (1024 * 1024),
                )
            )
        except ImportError:
            self._proc = None
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        end_time = time.time()
        self._elapsed_s = end_time - self._start_time
        if self._proc is not None:
            try:
                mem_mb = self._proc.memory_info().rss / (1024 * 1024)
                self._snapshots.append(
                    ResourceSnapshot(timestamp=end_time, memory_mb=mem_mb)
                )
                self._peak_memory_mb = max(s.memory_mb for s in self._snapshots)
            except Exception:
                pass
        else:
            self._peak_memory_mb = -1.0

    @property
    def peak_memory_mb(self) -> float:
        return self._peak_memory_mb

    @property
    def elapsed_s(self) -> float:
        return self._elapsed_s

    @property
    def snapshots(self) -> list[ResourceSnapshot]:
        return list(self._snapshots)


def get_system_info() -> dict[str, Any]:
    """Return system information: CPU count, RAM, and GPU info if available.

    Returns
    -------
    dict
        Dictionary with keys: cpu_count, total_ram_gb, gpu_available,
        gpu_count, gpu_name.
    """
    import platform

    info: dict[str, Any] = {
        "cpu_count": os.cpu_count(),
        "total_ram_gb": None,
        "gpu_available": False,
        "gpu_count": 0,
        "gpu_name": None,
        "platform": platform.platform(),
        "python_version": platform.python_version(),
    }

    try:
        import psutil

        mem = psutil.virtual_memory()
        info["total_ram_gb"] = round(mem.total / (1024**3), 2)
    except ImportError:
        pass

    try:
        import torch

        if torch.cuda.is_available():
            info["gpu_available"] = True
            info["gpu_count"] = torch.cuda.device_count()
            info["gpu_name"] = torch.cuda.get_device_name(0)
    except ImportError:
        pass

    return info
