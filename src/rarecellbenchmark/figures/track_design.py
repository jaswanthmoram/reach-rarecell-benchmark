"""REACH track design schematic (Fig 9)."""

from __future__ import annotations

from pathlib import Path

from rarecellbenchmark.figures.style import SCHEMATIC_BG, _check_matplotlib


def plot_track_design(out_path: Path) -> None:
    """Draw the REACH evaluation track design schematic.

    Parameters
    ----------
    out_path : Path
        Output file path (should end with .pdf or .png).
    """
    plt = _check_matplotlib()
    from matplotlib.patches import FancyBboxPatch

    bg = SCHEMATIC_BG
    neutral = bg["neutral"]

    fig, ax = plt.subplots(figsize=(12, 7.5))
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis("off")

    def _box(x, y, w, h, text, fc, fontsize=9.5, fontweight="normal", radius=0.18, lw=1.0):
        box = FancyBboxPatch((x, y), w, h,
                             boxstyle=f"round,pad=0.02,rounding_size={radius}",
                             linewidth=lw, edgecolor=neutral, facecolor=fc)
        ax.add_patch(box)
        ax.text(x + w / 2, y + h / 2, text, ha="center", va="center",
                fontsize=fontsize, fontweight=fontweight, color=neutral)
        return (x + w / 2, y + h / 2)

    # Title
    ax.text(50, 96, "REACH evaluation tracks",
            ha="center", va="center", fontsize=15, fontweight="bold", color=neutral)
    ax.text(50, 91.6,
            "Five complementary tracks separate ranking, stress, null, "
            "natural-prevalence, and label-noise behaviour.",
            ha="center", va="center", fontsize=9.7, color="#475569")

    rows = [
        ("Track A", "Controlled real spike-ins  •  P_HC + B_HC at fixed prevalence",
         "8 datasets × T1-T4 × 5 reps  →  160 units (primary)",
         bg["track_a"], True),
        ("Track B", "Splatter synthetic stress  •  realism-audited",
         "8 datasets × T1-T4 × 3-4 reps  →  120 units (secondary)",
         bg["track_b"], True),
        ("Track C", "Null background-only controls  •  no positives",
         "8 datasets × 4 size tiers × 5 reps  →  160 units (false-positive)",
         bg["track_c"], True),
        ("Track D", "Natural blood / CTC prevalence",
         "mm_ledergor + breast_ctc_szczerba  →  30 units (natural)",
         bg["track_d"], False),
        ("Track E", "Label-noise robustness on Track A expression",
         "4 noise conditions × 160 units  →  640 method-units (supervised only)",
         bg["track_e"], False),
    ]

    base = 78
    row_h = 15
    for i, (name, sub, scale, color, show_tiers) in enumerate(rows):
        y = base - i * row_h
        _box(4, y, 62, row_h - 2, "", color, lw=1.2, radius=0.18)
        ax.text(7, y + (row_h - 2) - 2.6, name,
                ha="left", va="top", fontsize=12.5, fontweight="bold", color=neutral)
        ax.text(7, y + (row_h - 2) / 2 - 1.0, sub,
                ha="left", va="center", fontsize=9.2, color=neutral, style="italic")
        ax.text(7, y + 1.5, scale,
                ha="left", va="bottom", fontsize=8.6, color="#334155")

        if show_tiers:
            tiers = [("T1", "5-10%", bg["tier_t1"]),
                     ("T2", "1-5%",  bg["tier_t2"]),
                     ("T3", "0.1-1%", bg["tier_t3"]),
                     ("T4", "0.01-0.1%", bg["tier_t4"])]
            for j, (t_name, t_range, fc) in enumerate(tiers):
                xs = 67 + j * 7.6
                _box(xs, y + 2.2, 8.5, row_h - 7.0,
                     f"{t_name}\n{t_range}", fc, fontsize=8.0, radius=0.14)
        else:
            ax.text(82, y + (row_h - 2) / 2,
                    "natural prevalence\nor noisy labels",
                    ha="center", va="center", fontsize=8.4, color="#334155")

    # Footer totals
    ax.text(50, 5.2,
            "Total: 1,110 units per method  •  ranked Track A subset = 140 (common)",
            ha="center", va="center", fontsize=10, fontweight="bold", color="#0f172a")

    fig.tight_layout()
    fig.savefig(out_path, bbox_inches="tight", pad_inches=0.02, dpi=300)
    plt.close(fig)
