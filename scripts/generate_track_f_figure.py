#!/usr/bin/env python3
"""Generate Track F (intra-lineage) comparison figure — Fig11.

Bar chart comparing Track A median AP vs Track F 0.1% median AP for all
10 methods, using the precomputed comparison CSV.

Usage:
    .venv/bin/python scripts/generate_track_f_figure.py
"""
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd


def generate_track_f_figure(
    comparison_path: Path,
    output_path: Path,
) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(comparison_path)

    required = {"method_id", "track_a_median_ap", "track_f_median_ap_0.1pct", "delta"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"{comparison_path} missing columns: {missing}")

    if len(df) != 10:
        print(f"WARNING: expected 10 methods, found {len(df)}")

    # Order by Track A median AP descending (makes the ceiling collapse visible)
    df = df.sort_values("track_a_median_ap", ascending=False).reset_index(drop=True)

    fig, ax = plt.subplots(figsize=(12, 6.5))

    x = np.arange(len(df))
    width = 0.38

    color_a = "#4C72B0"  # Track A blue
    color_f = "#DD8452"  # Track F orange

    bars_a = ax.bar(
        x - width / 2,
        df["track_a_median_ap"],
        width,
        label="Track A (inter-lineage)",
        color=color_a,
        alpha=0.88,
        edgecolor="white",
        linewidth=0.5,
    )
    bars_f = ax.bar(
        x + width / 2,
        df["track_f_median_ap_0.1pct"],
        width,
        label="Track F 0.1% (intra-lineage)",
        color=color_f,
        alpha=0.88,
        edgecolor="white",
        linewidth=0.5,
    )

    # Value labels on every bar so the near-zero Track F values stay legible
    # (the bars themselves are invisible on a linear scale).
    for bars in (bars_a, bars_f):
        for rect in bars:
            h = rect.get_height()
            ax.text(
                rect.get_x() + rect.get_width() / 2,
                h + 0.012,
                f"{h:.3f}",
                ha="center",
                va="bottom",
                fontsize=6.5,
                rotation=90,
                color="#333333",
            )

    # Annotate the two key findings: ceiling collapse and inversion
    for i, row in df.iterrows():
        method = row["method_id"]
        f = row["track_f_median_ap_0.1pct"]

        if method == "hvg_logreg":
            ax.annotate(
                f"Δ = {row['delta']:.3f}\n(ceiling collapse)",
                xy=(i + width / 2, f),
                xytext=(i + width / 2 + 0.6, f + 0.12),
                fontsize=8,
                color="#C44E52",
                ha="left",
                arrowprops=dict(arrowstyle="->", color="#C44E52", lw=1.0),
            )
        elif method == "scMalignantFinder":
            ax.annotate(
                f"Δ = +{row['delta']:.3f}\n(inversion)",
                xy=(i + width / 2, f),
                xytext=(i + width / 2 - 1.4, f - 0.14),
                fontsize=8,
                color="#55A868",
                ha="left",
                arrowprops=dict(arrowstyle="->", color="#55A868", lw=1.0),
            )

    ax.set_xlabel("Method", fontsize=12)
    ax.set_ylabel("Median Average Precision (AP)", fontsize=12)
    ax.set_title(
        "Figure 11. Track F (Intra-lineage) vs Track A (Inter-lineage) Median AP\n"
        "Malignant epithelial detection — crc_lee, N = 15 units (3 prevalences × 5 replicates)",
        fontsize=11,
        pad=10,
    )
    ax.set_xticks(x)
    ax.set_xticklabels(df["method_id"], rotation=30, ha="right", fontsize=9)
    ax.set_ylim(0, 1.15)
    ax.axhline(
        y=1.0,
        color="gray",
        linestyle="--",
        linewidth=0.8,
        alpha=0.5,
        label="Ceiling (AP = 1.0)",
    )
    ax.legend(fontsize=9, loc="upper right", framealpha=0.9)
    ax.grid(axis="y", linestyle=":", linewidth=0.4, alpha=0.5)
    ax.set_axisbelow(True)

    # Source note placed below the axes (figure coords) so it never overlaps
    # the rotated x-tick labels or the bars.
    fig.text(
        0.5,
        0.005,
        "Source: data/results/revision/track_f/track_a_vs_f_comparison.csv | "
        "All 10 methods evaluated (150/150 Track F units). "
        "Background = normal epithelial cells; 83% duplicate cell IDs (340-cell pool).",
        ha="center",
        fontsize=6,
        color="#888888",
    )

    plt.tight_layout(rect=(0, 0.03, 1, 1))

    plt.savefig(output_path, dpi=300, bbox_inches="tight")
    plt.close()
    print(f"Saved: {output_path}")


if __name__ == "__main__":
    comparison = Path("data/results/revision/track_f/track_a_vs_f_comparison.csv")
    out = Path("manuscript_revision/images/Fig11_Track_F_vs_Track_A.png")

    if not comparison.exists():
        print(f"ERROR: {comparison} not found.")
        raise SystemExit(1)

    generate_track_f_figure(comparison, out)
