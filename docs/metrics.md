# Metrics

REACH computes a suite of metrics for every method-unit pair. This page documents their definitions, formulas, and interpretation.

---

## 1. Average Precision (AP) - Primary

**Definition:** Area under the precision-recall curve.

```python
from sklearn.metrics import average_precision_score
ap = average_precision_score(y_true, y_score)
```

**Scoring population:** Only **P_HC** (high-confidence positives) vs **B_HC** (high-confidence backgrounds). Medium- and low-confidence cells are excluded to maximise ground-truth reliability.

**Why AP?**
- Threshold-independent: uses the full ranked score list.
- Naturally down-weights the majority class, making it ideal for rare-cell detection.
- More sensitive to top-ranked performance than AUROC.

**Fallback filtering:** Units where a method returned a random fallback score (due to timeout or OOM) are excluded from AP aggregation. There are 249 fallback units across all methods in v1.0.

---

## 2. Area Under the ROC Curve (AUROC)

**Definition:** Area under the receiver-operating-characteristic curve.

```python
from sklearn.metrics import roc_auc_score
auroc = roc_auc_score(y_true, y_score)
```

**Interpretation:**
- Threshold-independent discrimination.
- Less sensitive to class imbalance than AP; can be misleadingly high when positives are extremely rare.
- Reported as a secondary metric for completeness.

---

## 3. F1@k

**Definition:** F1 score when the threshold is set so that exactly `k` cells are predicted positive, where `k = n_true_positives`.

```python
from sklearn.metrics import f1_score
threshold = np.sort(y_score)[-k]
pred = (y_score >= threshold).astype(int)
f1_at_k = f1_score(y_true, pred)
```

**Interpretation:** Measures practical detection performance when the user knows the true number of positives (e.g. from prior prevalence estimates).

---

## 4. Precision@k

**Definition:** Precision at the top-k ranked cells.

```python
top_k_pred = np.argsort(y_score)[-k:]
precision_at_k = y_true[top_k_pred].mean()
```

**Interpretation:** Of the top-k cells flagged by the method, what fraction are truly malignant? Critical for clinical scenarios with limited follow-up capacity.

---

## 5. Recall@k

**Definition:** Recall at the top-k ranked cells.

```python
recall_at_k = y_true[top_k_pred].sum() / y_true.sum()
```

**Interpretation:** What fraction of all true positives are captured in the top-k? Complements precision@k.

---

## 6. Balanced Accuracy

**Definition:**

```
Balanced Accuracy = (TPR + TNR) / 2
```

Where `TPR = TP / (TP + FN)` and `TNR = TN / (TN + FP)`.

**Interpretation:** Overall classification balance that is not skewed by class imbalance. Less informative than AP for rare-cell tasks but useful as a sanity check.

---

## 7. Expected Calibration Error (ECE)

**Definition:** Bins predictions into 10 equal-width probability bins and computes the weighted average of |accuracy - mean_probability|.

```python
def ece(y_true, y_prob, n_bins=10):
    bin_edges = np.linspace(0, 1, n_bins + 1)
    ece = 0.0
    for i in range(n_bins):
        mask = (y_prob >= bin_edges[i]) & (y_prob < bin_edges[i+1])
        if mask.sum() == 0:
            continue
        acc = y_true[mask].mean()
        conf = y_prob[mask].mean()
        ece += mask.sum() * abs(acc - conf)
    return ece / len(y_true)
```

**Applicability:** Only computed for methods that output probability-like scores (`hvg_logreg`, `random_baseline`). Score-only detectors are marked *not applicable* rather than forced into probability calibration.

---

## 8. Wilcoxon Signed-Rank Test

**Usage:** Pairwise comparison of two methods on Track A AP per unit.

```python
from scipy.stats import wilcoxon
stat, p = wilcoxon(method_a_ap, method_b_ap)
```

**Correction:** Benjamini-Hochberg FDR (α = 0.05) across all pairwise comparisons.

**Interpretation:** A significant p-value means one method consistently outperforms the other across units, not just on average.

---

## 9. Critical Difference Diagrams

**Method:** Friedman test + Nemenyi post-hoc.

```python
from scipy.stats import friedmanchisquare
# Iman-Davenport correction applied for large numbers of methods
```

**Output:** A diagram where methods connected by a thick horizontal bar are **not** significantly different at α = 0.05.

**Interpretation:** Visualises the global ranking and clusters of statistically equivalent methods.

---

## 10. Rarity-Stratified Metrics

Track A units are generated at four prevalence tiers:

| Tier | Prevalence | Description |
|------|------------|-------------|
| T1 | 5% - 10% | Relatively common rare cells |
| T2 | 1% - 5% | Moderately rare |
| T3 | 0.1% - 1% | Rare |
| T4 | 0.01% - 0.1% | Very rare - challenge tier |

The **breakdown tier** metric reports the lowest tier where a method achieves median AP > 0.50.

---

## 11. Normalised AP (nAP)

**Definition:** AP divided by the prevalence of the unit.

```python
nap = ap / prevalence
```

**Usage:** Regressed against `log10(prevalence)` per method. Positive slopes indicate prevalence sensitivity (performance improves as rare cells become less rare). Slopes are descriptive and should not be interpreted causally.

---

## 12. Brier Score

**Definition:** Mean squared error between predicted probabilities and true binary outcomes.

```python
brier = np.mean((y_prob - y_true) ** 2)
```

**Applicability:** Same restrictions as ECE - only for probability-like outputs.

---

## Effect Size Metrics

With 160 units per track, statistical power is high — even trivially small differences can reach significance. Effect sizes quantify the practical *magnitude* of differences.

### Cliff's delta (d)

Non-parametric effect size for two independent groups. No distribution assumptions. Range `[-1, 1]`.

```
        #(x > y) - #(x < y)
d = ─────────────────────────
              n₁ · n₂
```

| |d| | Interpretation |
|------|----------------|
| < 0.147 | Negligible |
| < 0.33  | Small |
| < 0.474 | Medium |
| ≥ 0.474 | Large |

### Rank-biserial correlation (r)

Paired version matching the Wilcoxon signed-rank test. Proportion of favorable pairs minus unfavorable pairs. Range `[-1, 1]`.

```
r = 1 - (4R) / (n(n+1))
```

Where *R* is the smaller of the sum of positive and negative signed ranks.

Same magnitude thresholds as Cliff's delta.

### Cohen's d

Parametric standardized mean difference. Range unbounded. Assumes normality.

```
        μ₁ - μ₂
d = ──────────────
        s_pooled
```

| |d| | Interpretation |
|------|----------------|
| < 0.2  | Negligible |
| < 0.5  | Small |
| < 0.8  | Medium |
| ≥ 0.8  | Large |

> **Note:** With 160 units per track, many pairwise comparisons will be statistically significant even for minuscule differences. Rely on effect sizes to distinguish *practically meaningful* differences from statistically significant but negligible ones.

---

## Summary Table

| Metric | Primary? | Threshold-independent? | Probability required? |
|--------|----------|----------------------|----------------------|
| AP | **Yes** | Yes | No |
| AUROC | No | Yes | No |
| F1@k | No | No | No |
| Precision@k | No | No | No |
| Recall@k | No | No | No |
| Balanced Accuracy | No | No | No |
| ECE | No | - | Yes |
| Brier | No | - | Yes |
| Wilcoxon | No (statistical test) | - | - |
| CD diagram | No (visualisation) | - | - |

---

*Next: [Results Interpretation](results_interpretation.md)*
