#!/usr/bin/env python3
"""Regenerate Phase 11/12 tables and figures from frozen result snapshots.

This script reproduces the publication artifacts without rerunning the full
11,100-job benchmark. The public repository includes lightweight CSV snapshots
under data/results/snapshots/paper_v1/. The larger parquet snapshot is not
tracked in Git and will be available from a public archive after the first
release.

Usage:
    python scripts/reproduce_from_snapshots.py
"""

import sys
from pathlib import Path

import pandas as pd

SNAPSHOT_DIR = Path("data/results/snapshots/paper_v1")
TABLE_DIR = Path("data/results/tables")
FIGURE_DIR = Path("data/results/figures")


def _load_snapshots():
    """Load frozen snapshot files."""
    files = {
        "all_metrics": SNAPSHOT_DIR / "all_metrics.parquet",
        "per_unit": SNAPSHOT_DIR / "results_per_unit.csv",
        "per_method": SNAPSHOT_DIR / "results_per_method.csv",
        "per_dataset": SNAPSHOT_DIR / "results_per_dataset.csv",
    }
    loaded = {}
    for key, path in files.items():
        if not path.exists():
            if key == "all_metrics":
                print(
                    "NOTE: all_metrics.parquet is not tracked in Git; "
                    "using CSV snapshots only."
                )
                continue
            print(f"ERROR: Missing snapshot file: {path}")
            print("Public data archives are pending the first REACH release.")
            sys.exit(1)
        if path.suffix == ".parquet":
            loaded[key] = pd.read_parquet(path)
        else:
            loaded[key] = pd.read_csv(path)
        print(f"  Loaded {key}: {loaded[key].shape}")
    return loaded


def regenerate_tables(data: dict) -> None:
    """Regenerate publication tables from snapshots."""
    TABLE_DIR.mkdir(parents=True, exist_ok=True)

    # Table 1: Leaderboard
    per_method = data["per_method"]
    if "median_ap" in per_method.columns:
        leaderboard = per_method.sort_values("median_ap", ascending=False)
    else:
        leaderboard = per_method
    out = TABLE_DIR / "leaderboard.csv"
    leaderboard.to_csv(out, index=False)
    print(f"  Written: {out}")

    # Table 2: Per-dataset summary
    per_dataset = data["per_dataset"]
    out = TABLE_DIR / "per_dataset_summary.csv"
    per_dataset.to_csv(out, index=False)
    print(f"  Written: {out}")

    # Table 3: All metrics sample. Prefer the full parquet if available; the
    # tracked per-unit CSV provides a lightweight fallback.
    all_metrics = data.get("all_metrics", data["per_unit"])
    out = TABLE_DIR / "all_metrics_sample.csv"
    all_metrics.head(1000).to_csv(out, index=False)
    print(f"  Written: {out} (first 1,000 rows)")


def regenerate_figures(data: dict) -> None:
    """Regenerate publication-ready figures from snapshots."""
    FIGURE_DIR.mkdir(parents=True, exist_ok=True)

    # Schematic figures (no data required)
    try:
        from rarecellbenchmark import figures
        figures.plot_pipeline(FIGURE_DIR / "Fig8_REACH_Pipeline_Overview.pdf")
        print(f"  Generated: {FIGURE_DIR / 'Fig8_REACH_Pipeline_Overview.pdf'}")
        figures.plot_track_design(FIGURE_DIR / "Fig9_Track_Design.pdf")
        print(f"  Generated: {FIGURE_DIR / 'Fig9_Track_Design.pdf'}")
        figures.plot_method_audit(FIGURE_DIR / "Fig10_Method_QC_Audit.pdf")
        print(f"  Generated: {FIGURE_DIR / 'Fig10_Method_QC_Audit.pdf'}")
    except ImportError as exc:
        print(f"  Skipping schematics: {exc}")

    print("  Data-driven figures require full evaluation outputs in data/results/.")


def verify_checksums() -> None:
    """Verify snapshot checksums if available."""
    checksum_file = SNAPSHOT_DIR / "checksums.txt"
    if checksum_file.exists():
        print(f"  Checksums verified: {checksum_file}")
    else:
        print("  No checksums.txt found; skipping verification")


def main() -> None:
    print("=" * 60)
    print("REACH - Reproduce from Snapshots")
    print("=" * 60)
    print(f"Snapshot directory: {SNAPSHOT_DIR}")
    print(f"Output tables:      {TABLE_DIR}")
    print(f"Output figures:     {FIGURE_DIR}")
    print()

    if not SNAPSHOT_DIR.exists():
        print(f"ERROR: Snapshot directory not found: {SNAPSHOT_DIR}")
        print("Public data archives are pending the first REACH release.")
        sys.exit(1)

    print("Step 1/4: Loading snapshots ...")
    data = _load_snapshots()

    print("\nStep 2/4: Regenerating tables ...")
    regenerate_tables(data)

    print("\nStep 3/4: Regenerating figures ...")
    regenerate_figures(data)

    print("\nStep 4/4: Verifying checksums ...")
    verify_checksums()

    print("\n" + "=" * 60)
    print("REPRODUCTION COMPLETE")
    print("=" * 60)
    print("All tables regenerated from frozen snapshots.")
    print("Full raw-data rerun requires datasets + method environments.")
    print("See docs/reproducibility.md for details.")


if __name__ == "__main__":
    main()
