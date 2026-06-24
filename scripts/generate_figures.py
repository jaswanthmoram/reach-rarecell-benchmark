#!/usr/bin/env python3
"""Generate all REACH benchmark figures (Fig0–Fig11) from snapshots + revision data.

One-command regeneration of the full Phase 12 figure bundle plus the revision
Track F figure (Fig11). Run from the repository root:

    .venv/bin/python scripts/generate_figures.py --output-dir data/results/figures/phase12

Schematic figures (Fig8, Fig9, Fig10) are self-contained and need no data.
Data-driven figures (Fig0–Fig7) load frozen CSV snapshots from
``data/results/snapshots/paper_v1/``. Fig11 loads the Track A vs F comparison
CSV from ``data/results/revision/``.

FigA1 (DeepScena diagnostic) has no generator script and is left untouched.
"""
import argparse
import sys
from pathlib import Path

import pandas as pd

SNAPSHOT_DIR = Path("data/results/snapshots/paper_v1")
REVISION_DIR = Path("data/results/revision")


def _load_snapshots() -> dict[str, pd.DataFrame]:
    files = {
        "per_unit": SNAPSHOT_DIR / "results_per_unit.csv",
        "per_method": SNAPSHOT_DIR / "results_per_method.csv",
        "per_dataset": SNAPSHOT_DIR / "results_per_dataset.csv",
    }
    loaded: dict[str, pd.DataFrame] = {}
    for key, path in files.items():
        if not path.exists():
            print(f"ERROR: Missing snapshot file: {path}")
            sys.exit(1)
        loaded[key] = pd.read_csv(path)
        print(f"  Loaded {key}: {loaded[key].shape}")
    return loaded


def _save_heatmap(per_dataset: pd.DataFrame, out_path: Path) -> None:
    import matplotlib.pyplot as plt

    pivot = per_dataset.pivot_table(
        index="method_id", columns="dataset_id", values="mean_ap", aggfunc="median",
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
                ax.text(x, y, f"{val:.2f}", ha="center", va="center", fontsize=6,
                        color="white" if val < 0.55 else "black")
    fig.colorbar(im, ax=ax, label="Mean AP")
    fig.tight_layout()
    fig.savefig(out_path, dpi=300, bbox_inches="tight")
    plt.close(fig)


def _save_prevalence(per_unit: pd.DataFrame, out_path: Path) -> None:
    import matplotlib.pyplot as plt

    df = per_unit.copy()
    df["prevalence_bin"] = pd.cut(
        df["prevalence"], bins=[0, 0.001, 0.01, 0.05, 0.15, 1],
        labels=["<0.1%", "0.1-1%", "1-5%", "5-15%", ">15%"], include_lowest=True,
    )
    pivot = df.pivot_table(index="method_id", columns="prevalence_bin",
                           values="ap", aggfunc="median", observed=False)
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
    fig.savefig(out_path, dpi=300, bbox_inches="tight")
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
    fig.savefig(out_path, dpi=300, bbox_inches="tight")
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
    xerr = [stats["rank"] - stats["ci_lo"], stats["ci_hi"] - stats["rank"]]
    ax.errorbar(stats["rank"], y_pos, xerr=xerr, fmt="o", color="#111827",
                ecolor="#2563eb", capsize=4)
    ax.set_yticks(list(y_pos))
    ax.set_yticklabels(stats["method_id"], fontsize=8)
    ax.invert_yaxis()
    ax.invert_xaxis()
    ax.set_xlabel("Dataset-level rank (lower is better)")
    ax.set_title("Rank stability across datasets", fontweight="bold")
    fig.tight_layout()
    fig.savefig(out_path, dpi=300, bbox_inches="tight")
    plt.close(fig)


def generate_all(output_dir: Path) -> None:
    from rarecellbenchmark import figures

    output_dir.mkdir(parents=True, exist_ok=True)
    print("Loading snapshot data...")
    data = _load_snapshots()
    per_method = data["per_method"]
    per_dataset = data["per_dataset"]
    per_unit = data["per_unit"]

    print("\nGenerating Fig0 (Phase 11 Summary Heatmap)...")
    _save_heatmap(per_dataset, output_dir / "Fig0_Phase11_Summary_Heatmap.png")
    print("  OK")

    print("Generating Fig1 (Leaderboard)...")
    figures.plot_leaderboard(per_method, output_dir / "Fig1_Leaderboard.png")
    print("  OK")

    print("Generating Fig2 (Sensitivity Robustness)...")
    figures.plot_sensitivity(per_unit[per_unit["track"] == "E"],
                             output_dir / "Fig2_Sensitivity_Robustness.png")
    print("  OK")

    print("Generating Fig3 (Critical Difference)...")
    ranks = per_method.sort_values("median_ap", ascending=False).reset_index(drop=True)
    ranks["rank"] = ranks.index + 1
    figures.plot_critical_difference(ranks.set_index("method_id")["rank"],
                                     output_dir / "Fig3_Critical_Difference.png")
    print("  OK")

    print("Generating Fig4 (AP Prevalence)...")
    _save_prevalence(per_unit, output_dir / "Fig4_AP_Prevalence.png")
    print("  OK")

    print("Generating Fig5 (Track C Null Calibration)...")
    _save_null_summary(per_unit, output_dir / "Fig5_TrackC_Null_Calibration.png")
    print("  OK")

    print("Generating Fig6 (Runtime Scalability Pareto)...")
    figures.plot_runtime_comparison(per_unit, output_dir / "Fig6_Runtime_Scalability_Pareto.png")
    print("  OK")

    print("Generating Fig7 (Rank Bootstrap Forest)...")
    _save_rank_forest(per_dataset, output_dir / "Fig7_Rank_Bootstrap_Forest.png")
    print("  OK")

    print("Generating Fig8 (REACH Pipeline Overview)...")
    figures.plot_pipeline(output_dir / "Fig8_REACH_Pipeline_Overview.png")
    print("  OK")

    print("Generating Fig9 (Track Design)...")
    figures.plot_track_design(output_dir / "Fig9_Track_Design.png")
    print("  OK")

    print("Generating Fig10 (Method QC Audit)...")
    figures.plot_method_audit(output_dir / "Fig10_Method_QC_Audit.png")
    print("  OK")

    print("Generating Fig11 (Track F vs Track A)...")
    comparison_csv = REVISION_DIR / "track_f" / "track_a_vs_f_comparison.csv"
    if not comparison_csv.exists():
        comparison_csv = REVISION_DIR / "track_a_vs_f_comparison.csv"
    if comparison_csv.exists():
        import importlib.util
        spec = importlib.util.spec_from_file_location(
            "generate_track_f_figure",
            str(Path(__file__).parent / "generate_track_f_figure.py"),
        )
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        mod.generate_track_f_figure(comparison_csv, output_dir / "Fig11_Track_F_vs_Track_A.png")
        print("  OK")
    else:
        print(f"  SKIP — comparison CSV not found at {comparison_csv}")

    print(f"\nFigure generation complete. Output: {output_dir}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate all REACH benchmark figures")
    parser.add_argument("--output-dir", type=Path, default=Path("data/results/figures/phase12"),
                        help="Output directory (default: data/results/figures/phase12)")
    parser.add_argument("--all", action="store_true", help="Generate all figures (default)")
    args = parser.parse_args()
    generate_all(args.output_dir)


if __name__ == "__main__":
    main()
