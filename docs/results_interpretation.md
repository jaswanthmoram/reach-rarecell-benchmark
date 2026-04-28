# Results Interpretation

This guide explains how to read and interpret REACH evaluation outputs.

---

## 1. Reading `leaderboard.csv`

The primary leaderboard is a CSV with one row per method:

| Column | Meaning |
|--------|---------|
| `rank` | Overall rank by tie-breaking rule (see below). |
| `method_id` | Short identifier. |
| `category` | `naive`, `ranked`, `exploratory`. |
| `median_ap_track_a` | Median AP across all Track A units (fallback-filtered). |
| `mean_ap_track_a` | Mean AP across all Track A units. |
| `ap_track_d` | Median AP on Track D (natural prevalence). |
| `median_f1` | Median F1@k across Track A. |
| `null_fpr` | False-positive rate on Track C (lower is better). |
| `ap_drop_noise10` | AP on clean Track A minus AP on noise10 (smaller drop is better). |
| `median_runtime_s` | Median wall-clock seconds per unit. |
| `breakdown_tier` | Lowest tier (T1→T4) with median AP > 0.50; `none` if never. |
| `n_fallback` | Number of fallback units (excluded from primary AP). |
| `n_degenerate` | Number of degenerate units (retained but flagged). |

### Tie-breaking rule

1. Median AP Track A (strict, fallback-filtered) - primary
2. Track D AP
3. Median F1
4. Null-control FPR (lower is better)
5. AP drop under noise10 (smaller is better)
6. Median runtime (lower is better)

---

## 2. Prevalence Stratification

Track A units are grouped into four rarity tiers. A method's performance profile across tiers reveals its practical operating range.

### How to read tier curves

Open `data/results/phase11/rarity_analysis.csv`:

| method_id | tier | median_ap | n_units |
|-----------|------|-----------|---------|
| FiRE | T1 | 0.612 | 40 |
| FiRE | T2 | 0.401 | 40 |
| FiRE | T3 | 0.198 | 40 |
| FiRE | T4 | 0.089 | 40 |

**Interpretation:**
- **Strong T1, weak T4:** The method works for moderately rare cells but degrades at ultra-low prevalence. Most methods show this pattern.
- **Flat across T1-T4:** Ideal; prevalence-agnostic detection.
- **T4 > T3:** Usually an artefact of small sample size or dataset-specific signal.

### Breakdown tier

The **breakdown tier** is the lowest tier where median AP > 0.50. It is a single-number summary of practical utility:
- `T1` = works for relatively common rare cells (≥5%).
- `T2` = works down to 1%.
- `T3` = works down to 0.1%.
- `T4` = works down to 0.01% (challenge).
- `none` = never reaches AP > 0.50.

---

## 3. Tier Breakdown Visualisation

The tier breakdown is visualised in `Fig4_AP_nAP_Prevalence.pdf`:
- **X-axis:** `log10(prevalence)`
- **Y-axis:** AP (left panel) or normalised AP (right panel)
- **Lines:** One per method

A positive slope in the nAP panel indicates prevalence sensitivity: the method performs better when rare cells are less rare. This is expected; a flat line would indicate true prevalence invariance.

---

## 4. Statistical Significance Stars

`data/results/phase11/statistical_significance.csv` contains pairwise Wilcoxon tests.

### Reading the table

| comparison | delta_mean_ap | p_raw | p_bh_fdr | significant |
|------------|---------------|-------|----------|-------------|
| FiRE vs DeepScena | 0.295 | 1.2e-25 | 4.85e-23 | true |
| FiRE vs cellsius | 0.098 | 8.0e-05 | 4.00e-03 | true |
| FiRE vs expr_threshold | 0.030 | 2.1e-01 | 8.36e-01 | false |

**Columns:**
- `delta_mean_ap` - mean AP difference (positive = first method better).
- `p_raw` - uncorrected Wilcoxon p-value.
- `p_bh_fdr` - Benjamini-Hochberg adjusted p-value.
- `significant` - `true` if `p_bh_fdr < 0.05`.

### In figures

Significance is denoted by stars above bars or brackets:
- `*` - p < 0.05
- `**` - p < 0.01
- `***` - p < 0.001
- `ns` - not significant (p ≥ 0.05)

---

## 5. Critical Difference Diagrams

`Fig3_Critical_Difference.pdf` shows the global ranking.

**How to read:**
- Methods are ordered by mean rank (lower = better).
- A thick horizontal bar connects methods that are **not** significantly different (Friedman + Nemenyi, α = 0.05).
- Methods not connected by a bar are statistically distinct.

**Example:**
```
hvg_logreg   CaSee   FiRE —— cellsius —— expr_threshold
                              |
                              DeepScena —— RareQ —— scCAD —— scMalignantFinder
```

Here, `hvg_logreg` and `CaSee` are significantly better than all ranked methods. `FiRE`, `cellsius`, and `expr_threshold` form a cluster with no significant differences among them.

---

## 6. Bootstrap Rank CIs

`data/results/phase11/rank_ci.csv` reports:

| method_id | observed_rank | median_bootstrap_rank | rank_ci_lower | rank_ci_upper |
|-----------|---------------|-----------------------|---------------|---------------|
| hvg_logreg | 1 | 1.0 | 1.0 | 1.0 |
| CaSee | 2 | 2.0 | 2.0 | 2.0 |
| FiRE | 3 | 3.0 | 3.0 | 4.0 |

**Interpretation:**
- `observed_rank` - rank on the actual data.
- `median_bootstrap_rank` - median rank across 10,000 bootstrap resamples.
- `rank_ci_lower` / `rank_ci_upper` - 95% confidence interval on the rank.

If the CI for method A does not overlap with the CI for method B, they are likely distinct.

---

## 7. Cross-dataset robustness

`data/results/sensitivity_analyses/sens9_platform_stratification.csv` splits results by sequencing platform:

| method_id | platform | median_ap | n_units |
|-----------|----------|-----------|---------|
| FiRE | 10x_chromium | 0.321 | 160 |
| FiRE | smart_seq2 | 0.298 | 40 |

A large gap between platforms suggests the method is sensitive to technical artefacts (dropout, gene-length bias, etc.).

---

## 8. Common pitfalls

1. **Do not compare AP across tracks directly.** Track B is synthetic; Track C is background-only; Track D has natural prevalence. Only Track A AP determines primary rank.
2. **Do not ignore fallback units.** A method with 50% fallback units may have inflated median AP because only easy units succeeded. Check `n_fallback`.
3. **Do not over-interpret Track E for unsupervised methods.** Unsupervised methods do not consume labels, so their Track E predictions are identical to Track A. The "AP drop" is purely a mathematical artefact.
4. **Breakdown tier is a threshold, not a continuous score.** A method with breakdown tier `T2` and median AP 0.51 is not meaningfully worse than one with breakdown tier `T2` and median AP 0.89.

---

*Next: [Troubleshooting](troubleshooting.md)*
