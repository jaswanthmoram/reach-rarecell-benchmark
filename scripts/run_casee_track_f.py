#!/usr/bin/env python3
"""Run CaSee on existing Track F units (crc_lee) and evaluate.

This script targets existing Track F units directly without regenerating
them, running only CaSee which was missing from previous runs.
"""
import json
import sys
import time
from pathlib import Path

import numpy as np  # noqa: F401
import pandas as pd

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT / "src"))

from rarecellbenchmark.methods.registry import get_method  # noqa: E402
from rarecellbenchmark.evaluate.metrics import evaluate_predictions  # noqa: E402


def main():
    tracks_dir = ROOT / "data/tracks/f"
    predictions_dir = ROOT / "data/predictions"
    results_dir = ROOT / "data/results/revision/track_f"
    results_dir.mkdir(parents=True, exist_ok=True)

    # Discover all Track F manifest files
    manifests = sorted(tracks_dir.rglob("*_manifest.json"))
    print(f"Found {len(manifests)} Track F unit manifests")

    # --- Step 1: Run CaSee on all units ---
    method_id = "CaSee"
    CaSeeClass = get_method(method_id)
    casee = CaSeeClass()

    for manifest_path in manifests:
        data = json.loads(manifest_path.read_text())
        unit_id = manifest_path.stem.removesuffix("_manifest")
        data.setdefault("unit_id", unit_id)

        pred_csv = predictions_dir / method_id / f"{unit_id}_predictions.csv"
        if pred_csv.exists():
            print(f"  Skipping {unit_id} (already completed)")
            continue

        expr_path = manifest_path.with_name(f"{unit_id}_expression.h5ad")
        if not expr_path.exists():
            print(f"  ERROR: expression file missing: {expr_path}", file=sys.stderr)
            continue

        print(f"  Running CaSee on {unit_id} ...")
        t0 = time.time()
        try:
            casee.run(
                expr_path,
                predictions_dir / method_id,
                {**data, "unit_id": unit_id, "seed": 42},
            )
            print(f"    Done in {time.time() - t0:.1f}s")
        except Exception as exc:
            print(f"  ERROR: CaSee failed on {unit_id}: {exc}", file=sys.stderr)
            import traceback
            traceback.print_exc()

    # --- Step 2: Evaluate ALL CPU methods (including CaSee) ---
    print("\n=== Evaluating ALL Track F predictions ===")
    all_methods = ["random_baseline", "expr_threshold", "hvg_logreg", "scCAD", "scMalignantFinder", "CaSee"]

    rows = []
    for method in all_methods:
        pred_files = sorted((predictions_dir / method).glob("*_track_f_*_predictions.csv"))
        for pred_path in pred_files:
            unit_id = pred_path.stem.removesuffix("_predictions")
            manifests_found = sorted(tracks_dir.rglob(f"{unit_id}_manifest.json"))
            if not manifests_found:
                print(f"  Warning: manifest not found for {unit_id}")
                continue
            manifest_data = json.loads(manifests_found[0].read_text())
            manifest_data.setdefault("unit_id", unit_id)
            labels_path = manifests_found[0].with_name(f"{unit_id}_labels.parquet")
            run_meta = {
                "method_id": method,
                "unit_id": unit_id,
                "track": "F",
                "prevalence": manifest_data["prevalence"],
                "replicate": manifest_data["replicate"],
                "dataset_id": manifest_data.get("dataset_id", unit_id.split("_track_f_")[0]),
            }
            try:
                metrics = evaluate_predictions(pred_path, labels_path, run_meta=run_meta)
                rows.append(metrics)
            except Exception as exc:
                print(f"  Warning: evaluation failed for {unit_id}/{method}: {exc}")

    if not rows:
        print("ERROR: No metrics computed!")
        sys.exit(1)

    df = pd.DataFrame(rows)
    results_file = results_dir / "track_f_results.csv"
    df.to_csv(results_file, index=False)
    print(f"Wrote {len(df)} unit results → {results_file}")

    # --- Step 3: Leaderboard ---
    leaderboard = []
    for (method, prev), grp in df.groupby(["method_id", "prevalence"]):
        leaderboard.append({
            "method_id": method,
            "prevalence": prev,
            "median_ap": grp["ap"].median(),
            "mean_ap": grp["ap"].mean(),
            "n_units": len(grp),
        })
    df_lb = pd.DataFrame(leaderboard)
    lb_file = results_dir / "track_f_leaderboard.csv"
    df_lb.to_csv(lb_file, index=False)
    print(f"Wrote leaderboard → {lb_file}")

    print("\nTrack F Leaderboard (sorted by prevalence, median_ap desc):")
    print(df_lb.sort_values(["prevalence", "median_ap"], ascending=[True, False]).to_string(index=False))


if __name__ == "__main__":
    main()
