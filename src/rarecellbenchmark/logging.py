"""REACH logging setup using loguru."""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Optional

from loguru import logger

_DEFAULT_FORMAT = (
    "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
    "<level>{level: <8}</level> | "
    "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"
)

_SIMPLE_FORMAT = "{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {message}"


def setup_logging(
    level: str = "INFO",
    *,
    log_file: Optional[Path | str] = None,
    rotation: str = "10 MB",
    retention: str = "1 week",
    sink_stdout: bool = True,
    sink_file: bool = True,
    simple: bool = False,
) -> None:
    """Configure loguru with consistent formatting.

    Parameters
    ----------
    level
        Minimum log level (DEBUG, INFO, WARNING, ERROR).
    log_file
        Optional path to a log file. Defaults to ``logs/rarecellbenchmark.log`` under the repo root
        if *sink_file* is True and *log_file* is not provided.
    rotation
        Log rotation policy for the file sink.
    retention
        Log retention policy for the file sink.
    sink_stdout
        Whether to emit logs to stdout.
    sink_file
        Whether to emit logs to a file.
    simple
        Use a simpler format without code location.
    """
    # Remove default handler to avoid duplicate output
    logger.remove()

    fmt = _SIMPLE_FORMAT if simple else _DEFAULT_FORMAT

    if sink_stdout:
        logger.add(sys.stdout, level=level, format=fmt, colorize=True)

    if sink_file:
        if log_file is None:
            from rarecellbenchmark.constants import REPO_ROOT

            log_file = REPO_ROOT / "logs" / "rarecellbenchmark.log"
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        logger.add(
            str(log_path),
            level=level,
            format=fmt,
            rotation=rotation,
            retention=retention,
            enqueue=True,
        )

    logger.debug("Logging initialized at level {}", level)
