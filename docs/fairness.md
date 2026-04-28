# Fairness of Comparison

REACH enforces a **uniform, blind input contract** so no method gains an unfair advantage.

---

## 1. All Methods See the Same Data

Every method wrapper receives:

| Input | Description |
|-------|-------------|
| `expression.h5ad` | Expression matrix (log-normalised counts) with cell-level metadata (`obs`) and gene-level metadata (`var`). Labels (`y_true`) are **stripped before passing to methods**. |
| Configuration dict | Seed, unit ID, and benchmark parameters. No data-derived hints. |

**No method receives:** ground-truth labels, tier assignment, dataset origin, or any other information that could leak the evaluation target.

---

## 2. The Loading Contract Is Enforced by Code

The `load_blind_adata()` function in `src/rarecellbenchmark/methods/common.py` **raises `ValueError`** if a method attempts to read an `.h5ad` file that still contains ground-truth labels. This prevents accidental label leakage during wrapper development.

---

## 3. Supervised Methods Are Excluded from Competition

The `hvg_logreg` supervised ceiling receives ground-truth labels as input. It is **not ranked** against unsupervised methods — it serves only as an **oracle ceiling** to calibrate the upper bound of what is learnable from expression data alone.

---

## 4. Input Modality Is Matched, Not Mixed

All methods operate on **the same transcriptomic input** (gene expression counts from scRNA-seq). No method receives:

- Copy-number profiles (CNV)
- Allele/haplotype information
- Multi-omics data
- Spatial coordinates

This ensures comparisons are within a single modality. Methods designed for CNV-based detection (e.g., CopyKAT, Numbat) are acknowledged but excluded from the primary comparison because they access a fundamentally different data layer.

---

## 5. Evaluation Is Per-Sample (Not Per-Cell)

All metrics are computed **per benchmark unit** (a single spike-in experiment on one dataset), not aggregated across cells. Each of the 1,110 units contributes one independent data point.

**Why this matters:** Pooling predictions across cells within the same dataset (pseudoreplication) inflates sample size and makes even tiny differences "significant." Unit-level evaluation preserves the correct N = 1,110 independent observations.

---

## 6. Fallback and Degenerate Runs Are Handled Transparently

- **Fallback runs** return a pre-specified failure prediction. They are excluded from primary AP computation but counted in `n_fallback` in the leaderboard.
- **Degenerate runs** produce valid predictions but are flagged when predictions are suspicious (e.g., constant output, no spread).
- Both cases are documented in `data/results/snapshots/paper_v1/degenerate_predictions_report.csv`.

---

*See also: [Data Contracts](data_contracts.md), [Adding a New Method](adding_new_method.md)*
