# REACH Revision Results Index

This document acts as the single source of truth for numbers cited in the manuscript revision response.

| Reviewer Point | Description | Output File | Key Metrics / Values |
|---|---|---|---|
| **R1-1** | Circularity check (Spearman rho of rankings without CNV vs published) | `circularity_ranking.csv` | Spearman rho: 0.648230 |
| **R1-2** | CNV validation concordance vs source malignancy annotations | `cnv_concordance.csv` | Overall AUROC: 0.782246, MCC: 0.360979 |
| **R1-5** | CaSee degenerate-filtered AP (all vs excluded degenerate) | `casee_filtered_leaderboard.csv` | CaSee median AP: 0.512127 (all) / 0.605549 (excl-degenerate) |
| **R1-6** | Label threshold sensitivity correlation range | `threshold_sensitivity.csv` | Spearman rho range: [0.684848, 0.939394] |
| **R1-9** | Pairwise Cliff's delta effect sizes | `cliff_delta_matrix.csv` | Check file for method-by-method effect sizes |
| **R3-2 / R3-5** | Track F (intra-lineage) leaderboard and delta vs Track A | `track_a_vs_f_comparison.csv` | Check file for method drop values |
