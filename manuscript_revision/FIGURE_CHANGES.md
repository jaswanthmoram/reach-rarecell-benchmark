# Figure Change Instructions — REACH Frontiers Revision

> **For the author:** This document specifies which figures need updating and provides new caption text.
> Figures are in `data/results/figures/phase12/`. Staged copies are in `manuscript_revision/images/`.
> All N values come from `data/results/results_per_unit.csv`.

---

## Figures Requiring Changes

### Fig1: Leaderboard

**Change:** Add N annotation to caption.

**New caption addition:**
> "N = 160 units, 8 datasets (bcc_yost, crc_lee, hcc_wei, hnscc_puram, luad_laughney, mm_ledergor, ov_izar_tirosh, pdac_peng), 20 replicates per dataset, 4 prevalences (0.1%, 0.5%, 1%, 5%). Median AP across all Track A units. Methods with fewer than 100 evaluated units excluded from ranking."

---

### Fig2: Sensitivity Robustness

**Change:** Add N annotation and update to reference sensitivity_analyses directory.

**New caption addition:**
> "N = 160 units per method pair. Sensitivity analysis: AUCell threshold ∈ {0.10, 0.15, 0.20} × kNN ∈ {0.40, 0.50, 0.60} (9 settings). Spearman ρ range across all settings: [0.685, 0.939] (see `data/results/revision/threshold_sensitivity.csv`)."

---

### Fig3: Critical Difference

**Change:** Add N annotation and Cliff's δ reference.

**New caption addition:**
> "N = 160 common units (Track A). Critical difference computed at α = 0.05 (Wilcoxon signed-rank with Bonferroni correction). Cliff's δ effect sizes: see `data/results/revision/cliff_delta_matrix.csv`."

---

### Fig4: AP–Prevalence

**Change:** Add N annotation.

**New caption addition:**
> "N = 20 units per prevalence level (4 prevalences × 5 replicates per dataset × 8 datasets). Track A only."

---

### Fig5: Track C Null Calibration

**Change:** Add N annotation and FPR clarification.

**New caption addition:**
> "N = 80 null units (Track C; 8 datasets × 10 replicates). Expected FPR at 5% threshold ≈ 0.050. Most methods: FPR ≈ 0.030. hvg_logreg outlier FPR = 0.788 reflects cross-validation overfitting on null data (see `data/results/revision/sens2_sens3_extract.txt`)."

---

### Fig6: Runtime Scalability Pareto

**Change:** Add hardware annotation.

**New caption addition:**
> "Runtimes measured on AMD EPYC 7B12, 16 vCPUs, 62 GiB RAM, no GPU (see `data/results/revision/environment_capture.txt`). CaSee runtime per unit = ~90s (CPU autoencoder training, 20 epochs). DeepScena runtime not available (requires GPU)."

---

### Fig7: Rank Bootstrap Forest

**Change:** Add N annotation.

**New caption addition:**
> "N = 160 units per method. 1000 bootstrap resamples. Track A only."

---

### Fig8: REACH Pipeline Overview

**Change:** Update to show real CNV arm (infercnvpy, not stub).

**Change:** Add annotation that CNV uses infercnvpy v0.6.1, reference data GENCODE v44.

**New caption addition:**
> "Phase 3 (CNV Inference) now uses infercnvpy v0.6.1 with GENCODE v44 gene positions. CNV score = mean |ΔCNV| relative to immune/stromal reference (see `data/results/revision/cnv_scores/`)."

---

### Fig9: Track Design

**Change:** Add Track F panel showing intra-lineage design.

**New panel description:**
> **Track F panel:** Background = normal diploid epithelial cells (same tissue, same cell type as positives). Positives = malignant epithelial cells (HC-positive from Track A). Prevalences: 0.1%, 0.5%, 1.0%. Key contrast: intra-lineage (no TME background). Source: crc_lee colorectal cancer dataset.

**New caption addition:**
> "Track F: intra-lineage malignant detection (N = 15 units, 1 dataset — crc_lee). Background restricted to normal-diploid epithelial cells to remove inter-lineage contrast. DeepScena deferred (GPU required)."

---

### New Fig11: Track F Results (NEW FIGURE)

**Status:** To be created.
**Source:** `data/results/revision/track_f/track_f_leaderboard.csv` + `data/results/revision/track_a_vs_f_comparison.csv`

**Figure spec:**
- Type: Side-by-side bar chart or paired scatter plot
- X-axis: Methods (random_baseline, expr_threshold, hvg_logreg, scCAD, scMalignantFinder, CaSee)
- Y-axis: Median AP
- Two series: Track A (inter-lineage) vs Track F at 0.1% prevalence (intra-lineage)
- Highlight the collapse (hvg_logreg: 1.000 → 0.001) and the inversion (scMalignantFinder: 0.235 → 1.000)

**Caption:**
> "Figure 11. Track F (intra-lineage) vs Track A (inter-lineage) median AP per method. Background for Track F is restricted to normal-diploid epithelial cells (crc_lee, N = 15 units at 0.1% prevalence). Methods relying on inter-lineage contrast (hvg_logreg, scCAD, expr_threshold) collapse to chance; scMalignantFinder, whose pretrained model captures intra-lineage malignancy features, achieves median AP = 1.000. CaSee result pending. DeepScena deferred (GPU required). Source: `data/results/revision/track_f/track_f_leaderboard.csv`."

---

## Figures NOT Requiring Changes

The following figures do not require changes based on our analysis:
- **Fig0** (Phase11 Summary Heatmap): Rankings unchanged; add N only if journal requires.
- **Fig10** (Method QC Audit): No ranking changes from Phase 2 analyses.
- **FigA1** (DeepScena): Appendix figure; unchanged.

---

## Files to Stage

```bash
cp data/results/figures/phase12/*.png manuscript_revision/images/
# (New Fig11 to be generated by: python scripts/generate_figures.py --track-f)
```
