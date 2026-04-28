# manuscript/ — Manuscript Materials

This directory contains the manuscript source materials for REACH Benchmark.

---

## Structure

```text
manuscript/
├── paper.md              # Full benchmark report (Phase 1–12)
├── supplementary/        # Supplementary markdown documents
│   ├── EXCLUDED_METHODS.md
│   ├── SENSITIVITY_ANALYSES.md
│   └── STATISTICAL_METHODS.md
├── figures/              # Publication-quality PDF figures
│   ├── Fig0_Phase11_Summary_Heatmap.pdf
│   ├── Fig1_Leaderboard.pdf
│   ├── Fig2_Sensitivity_Robustness.pdf
│   ├── Fig3_Critical_Difference.pdf
│   ├── Fig4_AP_nAP_Prevalence.pdf
│   ├── Fig5_TrackC_Null_Calibration.pdf
│   ├── Fig6_Runtime_Scalability_Pareto.pdf
│   ├── Fig7_Rank_Bootstrap_Forest.pdf
│   ├── Fig8_REACH_Pipeline_Overview.pdf
│   ├── Fig9_Track_Design.pdf
│   └── Fig10_Method_QC_Audit.pdf
└── tables/               # Statistical tables (CSV)
    ├── leaderboard.csv
    ├── leaderboard_faithful.csv
    ├── statistical_ranking.csv
    ├── pairwise_tests.csv
    ├── statistical_significance.csv
    ├── global_tests.csv
    ├── rank_ci.csv
    ├── rarity_analysis.csv
    ├── track_e_robustness.csv
    ├── calibration_metrics.csv
    ├── metric_applicability.csv
    ├── best_model_per_dataset.csv
    └── ... (sensitivity and enhancement tables)
```

---

## Source of truth

All figures and tables in this folder were generated from the benchmark pipeline (Phases 11–12). This directory (`data/results/manuscript/`) is the curated, submission-ready snapshot of manuscript materials.

---

## Usage

- **Figures** can be referenced directly in LaTeX or Markdown submissions.
- **Tables** are plain CSV and can be imported into any document editor.
- **Supplementary** documents are plain Markdown for ease of version control.

---

*End of README*
