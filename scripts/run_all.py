#!/usr/bin/env python3
"""Run supported public REACH reproduction workflows."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


def _run(cmd: list[str]) -> None:
    print("$ " + " ".join(cmd))
    subprocess.run(cmd, check=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run REACH reproduction workflows")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--toy", action="store_true", help="Run a small local toy workflow")
    mode.add_argument("--from-snapshots", action="store_true", help="Regenerate public tables/figures from tracked snapshots")
    mode.add_argument("--full-data", action="store_true", help="Run full-data checks after external archives are restored")
    parser.add_argument("--work-dir", type=Path, default=Path("data/toy"))
    parser.add_argument("--output-dir", type=Path, default=Path("data/results"))
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        if args.toy:
            _run([sys.executable, "scripts/create_toy_data.py", "--out-dir", str(args.work_dir)])
            _run([sys.executable, "-m", "rarecellbenchmark.cli", "smoke-test"])
            return 0

        if args.from_snapshots or not any([args.toy, args.full_data]):
            _run([sys.executable, "scripts/phase11_statistics.py", "--from-snapshots"])
            _run([sys.executable, "scripts/reproduce_from_snapshots.py"])
            return 0

        if args.full_data:
            required = [
                Path("data/processed"),
                Path("data/tracks"),
                Path("data/predictions"),
            ]
            missing = [str(path) for path in required if not path.exists() or not any(path.iterdir())]
            if missing:
                print(
                    "ERROR: full-data reproduction requires external archives. "
                    f"Missing or empty: {', '.join(missing)}",
                    file=sys.stderr,
                )
                print("See docs/benchmark_regeneration.md for Zenodo download links.", file=sys.stderr)
                return 1
            _run([sys.executable, "scripts/run_phase.py", "--phase", "11"])
            _run([sys.executable, "scripts/run_phase.py", "--phase", "12"])
            return 0
    except subprocess.CalledProcessError as exc:
        return int(exc.returncode)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
