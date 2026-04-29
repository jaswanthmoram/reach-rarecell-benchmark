#!/usr/bin/env python3
"""Run supported REACH pipeline phases.

The public Git checkout can run toy-data and snapshot phases locally. Full
data phases require the external Zenodo/GitHub release archives.
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

ZENODO_MESSAGE = """External benchmark archives are required for this phase.

Download the relevant assets before running the full-data pipeline:
- Processed datasets: https://doi.org/10.5281/zenodo.19850652
- Track units A-C:     https://doi.org/10.5281/zenodo.19850972
- Track units D-E:     https://doi.org/10.5281/zenodo.19851287
- Complete results:    https://doi.org/10.5281/zenodo.19851710

Snapshot-only reproduction does not require these archives:
  python scripts/reproduce_from_snapshots.py
  python scripts/phase11_statistics.py --from-snapshots
"""


def _run(cmd: list[str]) -> None:
    print("$ " + " ".join(cmd))
    subprocess.run(cmd, check=True)


def _require(path: Path, label: str) -> None:
    if not path.exists():
        raise FileNotFoundError(f"{label} not found: {path}\n\n{ZENODO_MESSAGE}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run one REACH pipeline phase")
    parser.add_argument("--phase", required=True, help="Phase number/name: toy, snapshots, 1, 2, ..., 12")
    parser.add_argument("--dataset", default="toy")
    parser.add_argument("--data-root", type=Path, default=Path("data"))
    parser.add_argument("--output-dir", type=Path, default=Path("data/results"))
    parser.add_argument("--method", default="random_baseline")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    phase = str(args.phase).lower()

    try:
        if phase in {"toy", "1"} and args.dataset == "toy":
            _run(
                [
                    sys.executable,
                    "scripts/create_toy_data.py",
                    "--out-dir",
                    str(args.data_root / "toy"),
                ]
            )
            return 0

        if phase in {"snapshots", "snapshot", "11-snapshot"}:
            _run([sys.executable, "scripts/phase11_statistics.py", "--from-snapshots"])
            _run([sys.executable, "scripts/reproduce_from_snapshots.py"])
            return 0

        if phase in {"11", "evaluate"}:
            _require(args.data_root / "predictions", "Predictions archive")
            _require(args.data_root / "tracks", "Track-unit labels archive")
            _run(
                [
                    sys.executable,
                    "scripts/evaluate_results.py",
                    "--track",
                    "all",
                    "--predictions-dir",
                    str(args.data_root / "predictions"),
                    "--labels-dir",
                    str(args.data_root / "tracks"),
                    "--output-dir",
                    str(args.output_dir / "tables" / "phase11"),
                ]
            )
            _run(
                [
                    sys.executable,
                    "scripts/phase11_statistics.py",
                    "--metrics-csv",
                    str(args.output_dir / "tables" / "phase11" / "unit_metrics.csv"),
                ]
            )
            return 0

        if phase in {"12", "figures"}:
            _require(args.output_dir / "tables" / "phase11" / "leaderboard.csv", "Phase 11 tables")
            _run([sys.executable, "scripts/reproduce_from_snapshots.py"])
            return 0

        if phase in {"2", "3", "4", "5", "6", "7", "8", "9", "10"}:
            required = args.data_root / "processed" if phase in {"2", "3", "4", "5", "6", "7", "8"} else args.data_root / "tracks"
            _require(required, f"Phase {phase} input archive")
            print(f"Phase {phase} full-data execution is available after archives are restored.")
            return 0

        raise ValueError(f"Unknown phase '{args.phase}'")
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
