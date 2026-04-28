# Supplementary Note 3 — Statistical Methods

This note details the statistical procedures used in Phase 11. All tests were implemented in `scripts/phase11_statistics.py` and outputs are stored in `data/results/phase11/`.

---

## 1. Primary Metric: Average Precision (AP)

AP is computed with `sklearn.metrics.average_precision_score` on P_HC (positive) versus B_HC (background) cells only. Fallback units are excluded from AP aggregation. Degenerate units are retained but flagged.

## 2. Global Rank Tests

- **Friedman test:** Non-parametric test for differences in repeated-measures ranks across methods. Applied to Track A AP per unit.
- **Iman-Davenport correction:** Adjusts Friedman chi-square to an F-statistic, which is less conservative for large numbers of methods.

## 3. Pairwise Comparisons

- **Wilcoxon signed-rank test:** Paired test on AP per unit, comparing each method against the top-ranked published method (`FiRE`).
- **Benjamini-Hochberg FDR:** Controls false discovery rate at α = 0.05 across all pairwise comparisons.
- **Holm post-hoc:** Reported as a secondary correction for sensitivity.
- **Cliff's delta:** Effect size measure (non-parametric) for each pairwise comparison.

## 4. Bootstrap Rank Confidence Intervals

10,000 bootstrap resamples (sampling with replacement from units) were used to estimate 95% confidence intervals on the median-AP rank of each method. Ranks are computed per bootstrap sample and summarised by observed rank, median rank, and percentile intervals.

## 5. Calibration Metrics

- **Brier score:** Mean squared error between predicted probabilities and true binary outcomes.
- **Expected Calibration Error (ECE):** Bins predictions into 10 bins and computes weighted average of |accuracy - mean_probability|.

Calibration is only computed for methods with probability-like outputs (`hvg_logreg`, `random_baseline`). Score-only detectors are marked *not applicable*.

## 6. Rarity Analysis

Normalised AP (nAP) is regressed against log10(prevalence) per method on Track A. Positive slopes indicate prevalence sensitivity (performance improves as rare cells become less rare). Slopes are descriptive and should not be interpreted causally.

## 7. Runtime Analysis

Median runtime per method is computed across all successfully executed units (including degenerate but excluding fallback). Runtime is reported in wall-clock seconds.

---

*Source code:* `scripts/phase11_statistics.py`, `scripts/phase11_enhanced_metrics.py`  
*Output tables:* `data/results/phase11/*.csv`
