"""Method inclusion and QC audit figure (Fig 10)."""

from __future__ import annotations

from pathlib import Path

from rarecellbenchmark.figures.style import _check_matplotlib


def plot_method_audit(out_path: Path) -> None:
    """Draw the method inclusion and QC audit figure.

    Parameters
    ----------
    out_path : Path
        Output file path (should end with .pdf or .png).
    """
    plt = _check_matplotlib()

    neutral = "#1f2937"

    fig, axes = plt.subplots(1, 2, figsize=(11, 5.4),
                             gridspec_kw={"width_ratios": [1.0, 1.4]})
    fig.suptitle("Method inclusion and QC audit", fontsize=13.5,
                 fontweight="bold", y=0.99)

    # Left: inclusion bar
    ax = axes[0]
    bars = ax.barh(["Excluded (7)", "Included (10)"], [7, 10],
                   color=["#fca5a5", "#86efac"],
                   edgecolor=neutral, linewidth=1.0, height=0.55)
    ax.set_xlim(0, 12)
    ax.set_xlabel("Number of methods")
    ax.set_title("Inclusion outcome", fontsize=11)
    for bar, val in zip(bars, [7, 10]):
        ax.text(val + 0.25, bar.get_y() + bar.get_height() / 2, str(val),
                va="center", fontsize=10, fontweight="bold")
    ax.grid(axis="x", linestyle="--", alpha=0.4)

    # Right: exclusion-reason bar
    ax = axes[1]
    reasons = [
        ("Integration requirement",       1, "#a78bfa"),
        ("Wrapper failure",               2, "#60a5fa"),
        ("Degenerate scores",             2, "#fbbf24"),
        ("Score-contract mismatch",       1, "#34d399"),
        ("OOM / timeout",                 2, "#f97316"),
    ]
    labels = [r[0] for r in reasons]
    counts = [r[1] for r in reasons]
    colors = [r[2] for r in reasons]
    bars = ax.barh(labels, counts, color=colors,
                   edgecolor=neutral, linewidth=1.0, height=0.55)
    ax.set_xlim(0, 4)
    ax.set_xlabel("Number of methods")
    ax.set_title("Exclusion reason categories", fontsize=11)
    for bar, val in zip(bars, counts):
        ax.text(val + 0.06, bar.get_y() + bar.get_height() / 2, str(val),
                va="center", fontsize=10, fontweight="bold")
    ax.grid(axis="x", linestyle="--", alpha=0.4)
    ax.invert_yaxis()

    # Footer
    fig.text(0.5, 0.06,
             "Included: random_baseline, expr_threshold, hvg_logreg, FiRE, "
             "DeepScena, RareQ, cellsius, scCAD, scMalignantFinder, CaSee",
             ha="center", va="bottom", fontsize=8.5, color="#334155")
    fig.text(0.5, 0.03,
             "Excluded: CopyKAT, MACE, SCANER, SCEVAN, RaceID3, "
             "scATOMIC, GiniClust3",
             ha="center", va="bottom", fontsize=8.5, color="#334155")
    fig.subplots_adjust(left=0.18, right=0.97, top=0.88, bottom=0.22,
                        wspace=0.35)
    fig.savefig(out_path, bbox_inches="tight", pad_inches=0.02, dpi=300)
    plt.close(fig)
