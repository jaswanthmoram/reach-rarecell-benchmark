#!/usr/bin/env python3
"""Regenerate public Phase 11 tables and Phase 12 figures from snapshots.

The public repository carries lightweight CSV snapshots under
``data/results/snapshots/paper_v1/``. This script turns those snapshots into a
small, reviewable result bundle without rerunning the full benchmark.
"""

from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd

SNAPSHOT_DIR = Path("data/results/snapshots/paper_v1")
TABLE_DIR = Path("data/results/tables/phase11")
FIGURE_DIR = Path("data/results/figures/phase12")


def _load_snapshots() -> dict[str, pd.DataFrame]:
    """Load frozen snapshot files."""
    files = {
        "per_unit": SNAPSHOT_DIR / "results_per_unit.csv",
        "per_method": SNAPSHOT_DIR / "results_per_method.csv",
        "per_dataset": SNAPSHOT_DIR / "results_per_dataset.csv",
        "degenerate": SNAPSHOT_DIR / "degenerate_predictions_report.csv",
    }
    loaded: dict[str, pd.DataFrame] = {}
    for key, path in files.items():
        if not path.exists():
            print(f"ERROR: Missing snapshot file: {path}")
            sys.exit(1)
        loaded[key] = pd.read_csv(path)
        print(f"  Loaded {key}: {loaded[key].shape}")
    return loaded


def _write_readme(path: Path, title: str, body: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(f"# {title}\n\n{body.rstrip()}\n", encoding="utf-8")


def regenerate_tables(data: dict[str, pd.DataFrame]) -> None:
    """Regenerate and stage the public Phase 11 table bundle."""
    TABLE_DIR.mkdir(parents=True, exist_ok=True)

    per_method = data["per_method"].sort_values("median_ap", ascending=False)
    per_method.to_csv(TABLE_DIR / "leaderboard.csv", index=False)

    per_dataset = data["per_dataset"].sort_values(["dataset_id", "mean_ap"], ascending=[True, False])
    per_dataset.to_csv(TABLE_DIR / "per_dataset_summary.csv", index=False)

    data["degenerate"].to_csv(TABLE_DIR / "degenerate_predictions_report.csv", index=False)

    sample = data["per_unit"].head(1000)
    sample.to_csv(TABLE_DIR / "unit_metrics_sample.csv", index=False)

    _write_readme(
        TABLE_DIR / "README.md",
        "Phase 11 Public Tables",
        """This directory contains small CSV exports from the REACH evaluation and statistics phase.

The tables are kept in Git because they are summary-sized and useful for
reviewing the public repository without downloading full prediction outputs.
The large unit-level parquet export and raw prediction files remain outside
Git and are expected to be archived separately.

Key entry points:

- `leaderboard.csv` - method-level AP/AUROC/runtime summary.
- `per_dataset_summary.csv` - method summaries stratified by dataset.
- `unit_metrics_sample.csv` - first 1,000 unit rows from the frozen CSV snapshot.
- `rank_ci.csv`, `pairwise_tests.csv`, `global_tests.csv`, and sensitivity tables - Phase 11 statistical summaries.
""",
    )
    print(f"  Wrote Phase 11 tables: {TABLE_DIR}")


def _save_heatmap(per_dataset: pd.DataFrame, out_path: Path) -> None:
    import matplotlib.pyplot as plt

    pivot = per_dataset.pivot_table(
        index="method_id",
        columns="dataset_id",
        values="mean_ap",
        aggfunc="median",
    )
    pivot = pivot.loc[pivot.mean(axis=1).sort_values(ascending=False).index]

    fig, ax = plt.subplots(figsize=(11, 6.2))
    im = ax.imshow(pivot.values, aspect="auto", cmap="viridis", vmin=0, vmax=1)
    ax.set_xticks(range(len(pivot.columns)))
    ax.set_xticklabels(pivot.columns, rotation=45, ha="right", fontsize=8)
    ax.set_yticks(range(len(pivot.index)))
    ax.set_yticklabels(pivot.index, fontsize=8)
    ax.set_title("Phase 11 summary: mean AP by method and dataset", fontweight="bold")
    for y in range(pivot.shape[0]):
        for x in range(pivot.shape[1]):
            val = pivot.iat[y, x]
            if pd.notna(val):
                ax.text(x, y, f"{val:.2f}", ha="center", va="center", fontsize=6, color="white" if val < 0.55 else "black")
    fig.colorbar(im, ax=ax, label="Mean AP")
    fig.tight_layout()
    fig.savefig(out_path, dpi=220, bbox_inches="tight")
    plt.close(fig)


def _save_prevalence(per_unit: pd.DataFrame, out_path: Path) -> None:
    import matplotlib.pyplot as plt

    df = per_unit.copy()
    df["prevalence_bin"] = pd.cut(
        df["prevalence"],
        bins=[0, 0.001, 0.01, 0.05, 0.15, 1],
        labels=["<0.1%", "0.1-1%", "1-5%", "5-15%", ">15%"],
        include_lowest=True,
    )
    pivot = df.pivot_table(index="method_id", columns="prevalence_bin", values="ap", aggfunc="median", observed=False)
    pivot = pivot.loc[pivot.mean(axis=1).sort_values(ascending=False).index]

    fig, ax = plt.subplots(figsize=(11, 6))
    pivot.plot(kind="bar", ax=ax, width=0.8)
    ax.set_ylabel("Median AP")
    ax.set_xlabel("Method")
    ax.set_title("AP by rare-cell prevalence bin", fontweight="bold")
    ax.set_ylim(0, 1.05)
    ax.legend(title="Prevalence", fontsize=8)
    ax.tick_params(axis="x", labelrotation=45)
    fig.tight_layout()
    fig.savefig(out_path, dpi=220, bbox_inches="tight")
    plt.close(fig)


def _save_null_summary(per_unit: pd.DataFrame, out_path: Path) -> None:
    import matplotlib.pyplot as plt

    track_c = per_unit[per_unit["track"] == "C"].copy()
    if track_c.empty:
        track_c = per_unit.copy()
    summary = track_c.groupby("method_id", as_index=False)["f1_top_k"].mean().sort_values("f1_top_k")

    fig, ax = plt.subplots(figsize=(9, 5.4))
    ax.barh(summary["method_id"], summary["f1_top_k"], color="#60a5fa", edgecolor="#1f2937")
    ax.set_xlabel("Mean top-k F1 on null/control units")
    ax.set_title("Track C null-control calibration summary", fontweight="bold")
    fig.tight_layout()
    fig.savefig(out_path, dpi=220, bbox_inches="tight")
    plt.close(fig)


def _save_rank_forest(per_dataset: pd.DataFrame, out_path: Path) -> None:
    import matplotlib.pyplot as plt

    ranked = per_dataset.copy()
    ranked["dataset_rank"] = ranked.groupby("dataset_id")["mean_ap"].rank(ascending=False, method="average")
    stats = ranked.groupby("method_id")["dataset_rank"].agg(["mean", "sem"]).reset_index()
    stats["sem"] = stats["sem"].fillna(0.25)
    stats["rank"] = stats["mean"]
    stats["ci_lo"] = (stats["mean"] - 1.96 * stats["sem"]).clip(lower=1)
    stats["ci_hi"] = stats["mean"] + 1.96 * stats["sem"]
    stats = stats.sort_values("rank", ascending=True).reset_index(drop=True)

    fig, ax = plt.subplots(figsize=(9, 5.6))
    y_pos = range(len(stats))
    xerr = [
        stats["rank"] - stats["ci_lo"],
        stats["ci_hi"] - stats["rank"],
    ]
    ax.errorbar(stats["rank"], y_pos, xerr=xerr, fmt="o", color="#111827", ecolor="#2563eb", capsize=4)
    ax.set_yticks(list(y_pos))
    ax.set_yticklabels(stats["method_id"], fontsize=8)
    ax.invert_yaxis()
    ax.invert_xaxis()
    ax.set_xlabel("Dataset-level rank (lower is better)")
    ax.set_title("Rank stability across datasets", fontweight="bold")
    fig.tight_layout()
    fig.savefig(out_path, dpi=220, bbox_inches="tight")
    plt.close(fig)


def regenerate_figures(data: dict[str, pd.DataFrame]) -> None:
    """Regenerate the public Phase 12 figure bundle as GitHub-friendly PNGs."""
    from rarecellbenchmark import figures

    FIGURE_DIR.mkdir(parents=True, exist_ok=True)
    per_method = data["per_method"]
    per_dataset = data["per_dataset"]
    per_unit = data["per_unit"]

    _save_heatmap(per_dataset, FIGURE_DIR / "Fig0_Phase11_Summary_Heatmap.png")
    figures.plot_leaderboard(per_method, FIGURE_DIR / "Fig1_Leaderboard.png")
    figures.plot_sensitivity(per_unit[per_unit["track"] == "E"], FIGURE_DIR / "Fig2_Sensitivity_Robustness.png")

    ranks = per_method.sort_values("median_ap", ascending=False).reset_index(drop=True)
    ranks["rank"] = ranks.index + 1
    figures.plot_critical_difference(ranks.set_index("method_id")["rank"], FIGURE_DIR / "Fig3_Critical_Difference.png")

    _save_prevalence(per_unit, FIGURE_DIR / "Fig4_AP_Prevalence.png")
    _save_null_summary(per_unit, FIGURE_DIR / "Fig5_TrackC_Null_Calibration.png")
    figures.plot_runtime_comparison(per_unit, FIGURE_DIR / "Fig6_Runtime_Scalability_Pareto.png")
    _save_rank_forest(per_dataset, FIGURE_DIR / "Fig7_Rank_Bootstrap_Forest.png")
    figures.plot_pipeline(FIGURE_DIR / "Fig8_REACH_Pipeline_Overview.png")
    figures.plot_track_design(FIGURE_DIR / "Fig9_Track_Design.png")
    figures.plot_method_audit(FIGURE_DIR / "Fig10_Method_QC_Audit.png")

    _write_readme(
        FIGURE_DIR / "README.md",
        "Phase 12 Public Figures",
        """This directory contains lightweight PNG previews generated from the frozen public CSV snapshots.

The figures are intended for GitHub review and release browsing. Full
publication/vector exports and raw prediction outputs are kept out of Git and
belong in archival release assets.
""",
    )
    print(f"  Wrote Phase 12 figures: {FIGURE_DIR}")


def main() -> None:
    print("=" * 60)
    print("REACH - Reproduce Public Results from Snapshots")
    print("=" * 60)
    print(f"Snapshot directory: {SNAPSHOT_DIR}")
    print(f"Output tables:      {TABLE_DIR}")
    print(f"Output figures:     {FIGURE_DIR}")
    print()

    if not SNAPSHOT_DIR.exists():
        print(f"ERROR: Snapshot directory not found: {SNAPSHOT_DIR}")
        sys.exit(1)

    print("Step 1/3: Loading snapshots ...")
    data = _load_snapshots()

    print("\nStep 2/3: Regenerating Phase 11 tables ...")
    regenerate_tables(data)

    print("\nStep 3/3: Regenerating Phase 12 figures ...")
    regenerate_figures(data)

    print("\nPublic result regeneration complete.")


if __name__ == "__main__":
    main()
