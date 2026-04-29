#!/usr/bin/env python3
"""Regenerate Phase 11 summary and statistical tables.

This script supports two publication-safe inputs:

- ``--from-snapshots`` reads tracked public CSV snapshots from
  ``data/results/snapshots/paper_v1``.
- ``--metrics-csv`` reads a local evaluated per-unit metrics CSV.

It does not require raw datasets or prediction archives.
"""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

import numpy as np
import pandas as pd

SNAPSHOT_DIR = Path("data/results/snapshots/paper_v1")
DEFAULT_OUTPUT_DIR = Path("data/results/tables/phase11")
COMPAT_DIR = Path("data/results/phase11")


def _load_from_snapshots(snapshot_dir: Path) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    required = {
        "per_unit": snapshot_dir / "results_per_unit.csv",
        "per_method": snapshot_dir / "results_per_method.csv",
        "per_dataset": snapshot_dir / "results_per_dataset.csv",
        "degenerate": snapshot_dir / "degenerate_predictions_report.csv",
    }
    missing = [str(path) for path in required.values() if not path.exists()]
    if missing:
        raise FileNotFoundError(
            "Missing public snapshot files. Restore the Git snapshots or download "
            f"release assets first: {', '.join(missing)}"
        )
    return (
        pd.read_csv(required["per_unit"]),
        pd.read_csv(required["per_method"]),
        pd.read_csv(required["per_dataset"]),
        pd.read_csv(required["degenerate"]),
    )


def _load_from_metrics(metrics_csv: Path) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    if not metrics_csv.exists():
        raise FileNotFoundError(f"Metrics CSV not found: {metrics_csv}")
    per_unit = pd.read_csv(metrics_csv)
    required_cols = {"method_id", "unit_id", "dataset_id", "ap", "auroc"}
    missing = sorted(required_cols - set(per_unit.columns))
    if missing:
        raise ValueError(f"Metrics CSV is missing required columns: {missing}")

    runtime_col = "runtime_seconds" if "runtime_seconds" in per_unit.columns else "ap"
    per_method = (
        per_unit.groupby("method_id")
        .agg(
            mean_ap=("ap", "mean"),
            median_ap=("ap", "median"),
            std_ap=("ap", "std"),
            mean_auroc=("auroc", "mean"),
            mean_runtime_s=(runtime_col, "mean"),
            n_units=("unit_id", "count"),
            n_datasets=("dataset_id", pd.Series.nunique),
        )
        .reset_index()
    )
    if runtime_col == "ap":
        per_method["mean_runtime_s"] = np.nan

    per_dataset = (
        per_unit.groupby(["method_id", "dataset_id"])
        .agg(
            mean_ap=("ap", "mean"),
            median_ap=("ap", "median"),
            std_ap=("ap", "std"),
            mean_auroc=("auroc", "mean"),
            mean_runtime_s=(runtime_col, "mean"),
            n_units=("unit_id", "count"),
        )
        .reset_index()
    )
    if runtime_col == "ap":
        per_dataset["mean_runtime_s"] = np.nan

    degenerate = pd.DataFrame(
        {
            "method_id": per_unit["method_id"].drop_duplicates().sort_values(),
            "n_degenerate": 0,
            "pct_degenerate": 0.0,
            "total_units": len(per_unit),
        }
    )
    return per_unit, per_method, per_dataset, degenerate


def _write_readme(output_dir: Path) -> None:
    (output_dir / "README.md").write_text(
        """# Phase 11 Public Tables

These CSV files are regenerated from tracked public snapshots or a local
evaluated metrics CSV. Full raw predictions and large unit-level archives are
external release assets, not Git contents.
""",
        encoding="utf-8",
    )


def _rank_ci(per_dataset: pd.DataFrame) -> pd.DataFrame:
    ranked = per_dataset.copy()
    ranked["dataset_rank"] = ranked.groupby("dataset_id")["mean_ap"].rank(
        ascending=False,
        method="average",
    )
    stats = ranked.groupby("method_id")["dataset_rank"].agg(["mean", "sem", "count"]).reset_index()
    stats["sem"] = stats["sem"].fillna(0.0)
    stats["rank"] = stats["mean"]
    stats["ci95_low"] = (stats["mean"] - 1.96 * stats["sem"]).clip(lower=1.0)
    stats["ci95_high"] = stats["mean"] + 1.96 * stats["sem"]
    return stats.sort_values(["rank", "method_id"]).reset_index(drop=True)


def _global_tests(per_unit: pd.DataFrame) -> pd.DataFrame:
    pivot = per_unit.pivot_table(index="unit_id", columns="method_id", values="ap", aggfunc="mean")
    pivot = pivot.dropna(axis=0, how="any")
    if pivot.shape[0] < 2 or pivot.shape[1] < 2:
        return pd.DataFrame(
            [{"test": "friedman_ap", "statistic": np.nan, "p_value": np.nan, "n_units": pivot.shape[0], "n_methods": pivot.shape[1]}]
        )

    try:
        from scipy.stats import friedmanchisquare

        stat, p_value = friedmanchisquare(*[pivot[col].to_numpy() for col in pivot.columns])
    except Exception:
        stat, p_value = np.nan, np.nan
    return pd.DataFrame(
        [{"test": "friedman_ap", "statistic": float(stat), "p_value": float(p_value), "n_units": pivot.shape[0], "n_methods": pivot.shape[1]}]
    )


def _pairwise_tests(per_unit: pd.DataFrame) -> pd.DataFrame:
    pivot = per_unit.pivot_table(index="unit_id", columns="method_id", values="ap", aggfunc="mean")
    methods = list(pivot.columns)
    rows: list[dict[str, float | str | int]] = []
    try:
        from scipy.stats import wilcoxon
    except Exception:
        wilcoxon = None

    for i, method_a in enumerate(methods):
        for method_b in methods[i + 1:]:
            paired = pivot[[method_a, method_b]].dropna()
            if len(paired) < 5 or wilcoxon is None:
                stat, p_value = np.nan, np.nan
            else:
                diff = paired[method_a] - paired[method_b]
                if float(diff.std()) == 0.0:
                    stat, p_value = np.nan, 1.0
                else:
                    stat, p_value = wilcoxon(paired[method_a], paired[method_b])
            rows.append(
                {
                    "method_a": method_a,
                    "method_b": method_b,
                    "statistic": float(stat) if pd.notna(stat) else np.nan,
                    "p_value": float(p_value) if pd.notna(p_value) else np.nan,
                    "n_pairs": int(len(paired)),
                }
            )

    result = pd.DataFrame(rows)
    if result.empty:
        return result
    valid = result["p_value"].notna()
    n_valid = int(valid.sum())
    result["p_value_bonferroni"] = np.nan
    if n_valid:
        result.loc[valid, "p_value_bonferroni"] = (result.loc[valid, "p_value"] * n_valid).clip(upper=1.0)
    return result


def regenerate_phase11(
    per_unit: pd.DataFrame,
    per_method: pd.DataFrame,
    per_dataset: pd.DataFrame,
    degenerate: pd.DataFrame,
    output_dir: Path,
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)

    leaderboard = per_method.sort_values(
        ["median_ap", "mean_ap"],
        ascending=[False, False],
    ).reset_index(drop=True)
    leaderboard.insert(0, "rank", range(1, len(leaderboard) + 1))
    leaderboard.to_csv(output_dir / "leaderboard.csv", index=False)

    per_dataset.sort_values(["dataset_id", "mean_ap"], ascending=[True, False]).to_csv(
        output_dir / "per_dataset_summary.csv",
        index=False,
    )
    per_unit.head(1000).to_csv(output_dir / "unit_metrics_sample.csv", index=False)
    degenerate.to_csv(output_dir / "degenerate_predictions_report.csv", index=False)

    rank_ci = _rank_ci(per_dataset)
    rank_ci.to_csv(output_dir / "rank_ci.csv", index=False)
    rank_ci.rename(columns={"rank": "mean_rank"}).to_csv(
        output_dir / "statistical_ranking.csv",
        index=False,
    )
    _global_tests(per_unit).to_csv(output_dir / "global_tests.csv", index=False)
    _pairwise_tests(per_unit).to_csv(output_dir / "pairwise_tests.csv", index=False)
    _write_readme(output_dir)


def update_compat_dir(output_dir: Path, compat_dir: Path = COMPAT_DIR) -> None:
    """Materialize ``data/results/phase11`` as a copy of canonical tables."""
    if output_dir.resolve() == compat_dir.resolve():
        return
    compat_dir.mkdir(parents=True, exist_ok=True)
    for path in output_dir.glob("*"):
        if path.is_file():
            shutil.copy2(path, compat_dir / path.name)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Regenerate REACH Phase 11 statistical tables")
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--from-snapshots", action="store_true", help="Use tracked public snapshot CSVs")
    source.add_argument("--metrics-csv", type=Path, help="Use a local per-unit metrics CSV")
    parser.add_argument("--snapshot-dir", type=Path, default=SNAPSHOT_DIR)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument(
        "--no-compat-copy",
        action="store_true",
        help="Do not update data/results/phase11 compatibility copy",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        if args.from_snapshots:
            data = _load_from_snapshots(args.snapshot_dir)
        else:
            data = _load_from_metrics(args.metrics_csv)
        regenerate_phase11(*data, output_dir=args.output_dir)
        if not args.no_compat_copy:
            update_compat_dir(args.output_dir)
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    print(f"Phase 11 tables written to {args.output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
