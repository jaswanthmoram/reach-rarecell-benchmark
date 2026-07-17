# Supplementary Note 2 — Sensitivity Analyses

Seven sensitivity analyses were completed in Phase 11 to validate the robustness of the primary Track A ranking. Each analysis result is stored as a CSV in `data/results/phase11/` and `data/results/manuscript/tables/`.

---

## Sensitivity Analysis 2 — Track A vs Track B Correlation

**File:** `sens2_track_a_vs_b.csv`

Tests whether method ranking on real data (Track A) agrees with ranking on synthetic Splatter data (Track B). A weak or negative correlation indicates that synthetic data does not capture the biological complexity of real tumour microenvironments. Track B is therefore retained as a secondary stress-test only.

---

## Sensitivity Analysis 3 — Null Control False-Positive Rate

**File:** `sens3_null_fp.csv`

Evaluates false-positive calibration on Track C (background-only units). Well-calibrated unsupervised methods should return near-chance AP. Methods with systematically elevated AP on null controls are flagged as "hallucinating" rare cells.

**Key result:** All unsupervised methods returned near-zero AP above chance on Track C. `hvg_logreg` had elevated AP, consistent with its supervised ceiling role.

---

## Sensitivity Analysis 4 — Track D Natural Prevalence

**File:** `sens4_track_d_natural.csv`

Compares method performance on natural-prevalence blood/CTC datasets (`mm_ledergor`, `breast_ctc_szczerba`) against their Track A performance. Confirms that rankings generalise to natural prevalence without artificial spike-ins.

---

## Sensitivity Analysis 5 — Noise Robustness

**File:** `sens5_noise_robustness.csv`

Measures AP degradation under four label-noise conditions. **Restricted to `hvg_logreg`** because unsupervised methods do not consume labels and therefore cannot be evaluated for label-noise robustness.

---

## Sensitivity Analysis 7 — CNV Support Fraction

**File:** `sens7_cnv_support.csv`

Stratifies performance by the fraction of cells with CNV support per dataset. Tests whether methods perform better when CNV evidence is abundant versus sparse.

---

## Sensitivity Analysis 9 — Platform Stratification

**File:** `sens9_platform_stratification.csv`

Splits results by sequencing platform (10x Chromium vs Smart-seq2). Tests whether platform-specific technical artefacts (e.g., dropout, gene-length bias) systematically favour certain methods.

---

## Sensitivity Analysis 10 — Pool Size Sensitivity

**File:** `sens10_pool_size.csv`

Tests whether Track A performance depends on the absolute number of cells in the benchmark unit (pool size). Large datasets like `pdac_peng` have >100k cells, while small datasets like `hnscc_puram` have <6k cells.

---

## Skipped Analyses

**Sensitivity Analysis 1 (Strict vs Relaxed confidence):** Track A units were deliberately generated using only P_HC and B_HC cells. Medium- and low-confidence cells (P_MC, P_LC, B_MC, B_LC) were excluded by design to maximise ground-truth reliability. Therefore, a relaxed-label evaluation would produce identical results to strict-label evaluation and was skipped.

**Sensitivity Analyses 6, 8, 11:** Duplicate fraction, challenge-only performance, and tumour purity covariate analyses were deferred to Version 2 due to implementation priority.

---

*All completed sensitivity CSVs are available in `data/results/phase11/` and copied to `data/results/manuscript/tables/`.*
