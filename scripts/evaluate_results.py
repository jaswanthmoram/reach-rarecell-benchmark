#!/usr/bin/env python3
"""Evaluate prediction CSV files against label parquet files."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import pandas as pd

from rarecellbenchmark.evaluate.metrics import evaluate_predictions


def _unit_id_from_prediction(path: Path) -> str:
    return path.stem.removesuffix("_predictions")


def _find_labels(labels_dir: Path, unit_id: str) -> Path:
    candidates = [
        labels_dir / f"{unit_id}_labels.parquet",
        labels_dir / f"{unit_id}.parquet",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    matches = sorted(labels_dir.rglob(f"{unit_id}_labels.parquet"))
    if matches:
        return matches[0]
    raise FileNotFoundError(f"No labels found for unit '{unit_id}' in {labels_dir}")


def _load_run_meta(prediction_path: Path, unit_id: str) -> dict:
    for candidate in [
        prediction_path.with_name(f"{unit_id}_runmeta.json"),
        prediction_path.with_name(f"{unit_id}_run_meta.json"),
    ]:
        if candidate.exists():
            return json.loads(candidate.read_text())
    return {}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate REACH predictions")
    parser.add_argument("--track", required=True, help="Track letter or 'all'")
    parser.add_argument("--method", default=None, help="Optional method ID filter")
    parser.add_argument("--predictions-dir", type=Path, required=True)
    parser.add_argument("--labels-dir", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--output-file", type=Path, default=None)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not args.predictions_dir.exists():
        print(f"ERROR: predictions directory not found: {args.predictions_dir}", file=sys.stderr)
        return 1
    if not args.labels_dir.exists():
        print(f"ERROR: labels directory not found: {args.labels_dir}", file=sys.stderr)
        return 1

    pred_files = sorted(args.predictions_dir.rglob("*_predictions.csv"))
    if args.method:
        pred_files = [path for path in pred_files if path.parent.name == args.method]
    if not pred_files:
        print(f"ERROR: no prediction files found in {args.predictions_dir}", file=sys.stderr)
        return 1

    rows = []
    for pred_path in pred_files:
        unit_id = _unit_id_from_prediction(pred_path)
        labels_path = _find_labels(args.labels_dir, unit_id)
        run_meta = {
            "method_id": args.method or pred_path.parent.name,
            "unit_id": unit_id,
            "track": args.track.upper() if args.track != "all" else None,
            **_load_run_meta(pred_path, unit_id),
        }
        rows.append(evaluate_predictions(pred_path, labels_path, run_meta=run_meta))

    output_dir = args.output_dir
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = args.output_file or output_dir / "unit_metrics.csv"
    pd.DataFrame(rows).to_csv(output_file, index=False)
    print(f"Wrote metrics: {output_file}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
