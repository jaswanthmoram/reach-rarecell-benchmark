"""REACH pipeline overview schematic (Fig 8)."""

from __future__ import annotations

from pathlib import Path

from rarecellbenchmark.figures.style import SCHEMATIC_BG, _check_matplotlib


def plot_pipeline(out_path: Path) -> None:
    """Draw the REACH benchmark pipeline schematic.

    Parameters
    ----------
    out_path : Path
        Output file path (should end with .pdf or .png).
    """
    plt = _check_matplotlib()
    from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

    bg = SCHEMATIC_BG
    neutral = bg["neutral"]
    line = bg["line"]

    fig, ax = plt.subplots(figsize=(12, 8.5))
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.set_aspect("auto")
    ax.axis("off")

    def _box(x, y, w, h, text, fc, fontsize=9.5, fontweight="normal", radius=0.18):
        box = FancyBboxPatch((x, y), w, h,
                             boxstyle=f"round,pad=0.02,rounding_size={radius}",
                             linewidth=1.0, edgecolor=neutral, facecolor=fc)
        ax.add_patch(box)
        ax.text(x + w / 2, y + h / 2, text, ha="center", va="center",
                fontsize=fontsize, fontweight=fontweight, color=neutral)
        return (x + w / 2, y + h / 2)

    def _arrow(x1, y1, x2, y2, lw=1.4, head=8):
        arr = FancyArrowPatch((x1, y1), (x2, y2),
                              arrowstyle="-|>", mutation_scale=head,
                              linewidth=lw, color=line, shrinkA=4, shrinkB=4)
        ax.add_patch(arr)

    # Title
    ax.text(50, 96.5, "REACH benchmark pipeline",
            ha="center", va="center", fontsize=15, fontweight="bold", color=neutral)
    ax.text(50, 92.5,
            "10 datasets  •  5 tracks  •  10 methods  •  1,110 units  •  11,100 evaluations",
            ha="center", va="center", fontsize=10, color="#475569")

    # Row 1: Datasets
    _box(6, 81, 88, 6.5,
         "10 curated scRNA-seq datasets  (8 solid tumours + 2 blood/CTC)",
         bg["datasets"], fontsize=10, fontweight="bold")
    ds_list = ["hnscc", "bcc", "luad", "pdac", "hcc",
               "crc", "ovarian", "rcc", "myeloma", "CTC"]
    for i, d in enumerate(ds_list):
        x = 7 + i * 8.7
        _box(x, 75.5, 8, 5, d, bg["chip"], fontsize=8.5, radius=0.12)
    _arrow(50, 75.2, 50, 70.3)

    # Row 2: Preprocessing
    _box(12, 64.5, 76, 5.5,
         "Phase 2 preprocessing  •  QC, log1p, 2,000 HVGs, PCA, GRCh38 annotation",
         bg["preprocessing"], fontsize=9.7, fontweight="bold")
    _arrow(50, 64.4, 50, 59.5)

    # Row 3: Multi-arm validation
    _box(12, 53.5, 76, 5.5,
         "Phase 3 multi-arm tier assignment  •  source + CNV + signature + neighborhood",
         bg["label_validation"], fontsize=9.7, fontweight="bold")
    _box(14, 47.6, 26, 4.5, "P_HC  /  P_MC  /  P_LC", "#f5f3ff", fontsize=8.7)
    _box(60, 47.6, 26, 4.5, "B_HC  /  B_MC  /  B_LC", "#f5f3ff", fontsize=8.7)
    _arrow(50, 47.4, 50, 42.5)

    # Row 4: Five tracks
    track_y = 32
    track_h = 8.5
    tracks = [
        ("Track A\nReal spike-in\n160 units",   3,  bg["track_a"]),
        ("Track B\nSplatter stress\n120 units", 22, bg["track_b"]),
        ("Track C\nNull controls\n160 units",   41, bg["track_c"]),
        ("Track D\nNatural blood/CTC\n30 units", 60, bg["track_d"]),
        ("Track E\nLabel noise\n640 units",     79, bg["track_e"]),
    ]
    track_w = 18
    for label, x, fc in tracks:
        _box(x, track_y, track_w, track_h, label, fc,
             fontsize=8.7, fontweight="bold", radius=0.20)
    _arrow(50, track_y - 0.2, 50, 26.5)

    # Row 5: Methods
    _box(6, 19.5, 88, 5.5,
         "Phase 9 standardised wrappers  •  10 included methods",
         bg["methods"], fontsize=9.7, fontweight="bold")
    methods = ["FiRE", "DeepScena", "RareQ", "cellsius", "scCAD",
               "scMalignant", "CaSee", "hvg_logreg", "expr_thr", "random"]
    for i, m in enumerate(methods):
        x = 6.5 + i * 8.75
        _box(x, 14.5, 9, 4.5, m, "#f8fafc", fontsize=8.5, radius=0.12)
    _arrow(50, 14.4, 50, 9.5)

    # Row 6: outputs
    _box(4, 2.5, 30, 6,
         "Predictions\n(11,100 evaluations)\nFallback / degenerate flags",
         bg["predictions"], fontsize=8.8, radius=0.18)
    _box(36, 2.5, 28, 6,
         "Metrics & statistics\nAP / nAP / AUROC / MCC@k\nFriedman, Wilcoxon, bootstrap",
         bg["metrics"], fontsize=8.8, radius=0.18)
    _box(66, 2.5, 30, 6,
         "Figures & manuscript\nLeaderboards, Pareto, ranks",
         bg["figures_output"], fontsize=8.8, radius=0.18)
    _arrow(34, 5.5, 36, 5.5)
    _arrow(64, 5.5, 66, 5.5)

    fig.tight_layout()
    fig.savefig(out_path, bbox_inches="tight", pad_inches=0.02, dpi=300)
    plt.close(fig)
