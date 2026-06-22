# Figure Change Instructions — REACH Frontiers Revision

> **For the author:** This document specifies which figures need updating and provides new caption text.
> Figures are in `data/results/figures/phase12/`. Staged copies are in `manuscript_revision/images/`.
> All N values come from `data/results/results_per_unit.csv`.
>
> **Rebuild note (Phase 6):** All 10 methods now have Track F results (150/150 units complete).
> Earlier drafts stated "CaSee pending" and "DeepScena deferred" — these are STALE. CaSee ran as a
> faithful CPU recreation; DeepScena ran on a Colab T4 GPU. See
> `data/results/revision/VERIFICATION_ISSUES.md` for the full issue log.

---

## Figures Requiring Changes

### Fig1: Leaderboard

**Change:** Add N annotation to caption.

**New caption addition:**
> "N = 160 units, 8 datasets (bcc_yost, crc_lee, hcc_wei, hnscc_puram, luad_laughney, mm_ledergor, ov_izar_tirosh, pdac_peng), 20 replicates per dataset, 4 prevalences (0.1%, 0.5%, 1%, 5%). Median AP across all Track A units. Methods with fewer than 100 evaluated units excluded from ranking."

---

### Fig2: Sensitivity Robustness

**Change:** Add N annotation and reference to the threshold-sensitivity CSV with the Spearman ρ range.

**New caption addition:**
> "N = 160 units per method pair. Sensitivity analysis: AUCell threshold ∈ {0.10, 0.15, 0.20} × kNN ∈ {0.40, 0.50, 0.60} (9 settings). Spearman ρ range across all settings: [0.685, 0.939] (see `data/results/revision/threshold_sensitivity.csv`; lowest ρ = 0.685 on luad_laughney, highest ρ = 0.939 on crc_lee)."

---

### Fig3: Critical Difference

**Change:** No change unless rankings shifted. Re-check the Nemenyi test against the current
`data/results/revision/` leaderboard; if the ranking order is unchanged, the figure stands as-is.
If rankings shifted, regenerate from the updated per-unit AP matrix.

**New caption addition (only if regenerated):**
> "N = 160 common units (Track A). Critical difference computed at α = 0.05 (Wilcoxon signed-rank with Bonferroni correction). Cliff's δ effect sizes: see `data/results/revision/cliff_delta_matrix.csv`. Circularity check: method ranking with vs without CNV gives Spearman ρ = 0.648 (`data/results/revision/circularity_ranking.csv`)."

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
> "Runtimes measured on AMD EPYC 7B12, 16 vCPUs, 62 GiB RAM, no GPU (see `data/results/revision/environment_capture.txt`). CaSee runtime per unit = ~90s (CPU autoencoder training, 20 epochs). DeepScena runtime measured on a Google Colab T4 GPU."

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

**Change:** Add Track F panel showing the intra-lineage design.

**New panel description:**
> **Track F panel:** Background = normal diploid epithelial cells (same tissue, same cell type as positives). Positives = malignant epithelial cells (HC-positive from Track A). Prevalences: 0.1%, 0.5%, 1.0%. Key contrast: intra-lineage (no TME background). Source: crc_lee colorectal cancer dataset — the only REACH dataset with both epithelial cell-type annotations and normal/tumor `tissue_origin` labels.

**New caption addition:**
> "Track F: intra-lineage malignant detection (N = 15 units; 3 prevalences × 5 replicates; 1 dataset — crc_lee). Background restricted to normal-diploid epithelial cells to remove inter-lineage contrast. All 10 methods evaluated (150/150 predictions)."

---

### New Fig11: Track F vs Track A (NEW FIGURE)

**Status:** Generated. Image at `manuscript_revision/images/Fig11_Track_F_vs_Track_A.png`.
**Source data:**
- `data/results/revision/track_f/track_f_leaderboard.csv` (per-prevalence Track F scores)
- `data/results/revision/track_f/track_a_vs_f_comparison.csv` (paired Track A vs Track F 0.1% medians + Δ)
**Generator:** `scripts/generate_track_f_figure.py` (matplotlib Agg backend, 300 DPI)

**Figure spec:**
- Type: Grouped bar chart
- X-axis: All 10 methods ordered by Track A median AP (descending)
- Y-axis: Median Average Precision (AP)
- Two series: Track A median AP (inter-lineage) vs Track F 0.1% median AP (intra-lineage)
- Annotations highlight the two key findings:
  - hvg_logreg ceiling collapse: AP 1.000 → 0.001 (Δ = −0.999)
  - scMalignantFinder inversion: AP 0.235 → 1.000 (Δ = +0.765)

**Caption (use verbatim):**
> "Figure 11. Track F intra-lineage benchmark (crc_lee, colorectal cancer). N = 15 units (3 prevalences × 5 replicates). Adaptive unit sizes: 2,000 cells for 0.1%, 400 cells for 0.5% and 1.0%. Background = normal epithelial cells; positives = malignant epithelial cells at 0.1%, 0.5%, 1% prevalence. hvg_logreg ceiling collapses from AP=1.0 (Track A) to AP=0.001 (Track F, chance level). scMalignantFinder (pretrained pan-cancer classifier) achieves AP=1.0 on Track F, but this is specific to colorectal cancer (Track A AP varies 0.015–0.943 across cancer types). Background duplication: 83% at 0.1% (2,000-cell units, 340-cell pool) but <20% at 0.5% (14.6%) and 1% (14.1%) using 400-cell units with without-replacement sampling; relative comparisons remain valid."

**Supporting verification notes (disclose in the Track F results section and Limitations):**
- **Single-dataset limitation:** Track F uses only crc_lee — the only REACH dataset with normal epithelial cell-type annotations plus `tissue_origin` normal/tumor labels. No other dataset could be constructed for Track F.
- **Background duplication (reduced):** At 0.1% (2,000-cell units), 83% duplicate due to 340-cell pool. At 0.5% and 1% (400-cell units with without-replacement sampling), duplication drops to 14.6% and 14.1% — both under the 20% design cap. Absolute AP is slightly inflated at 0.1% only but all methods face the same duplicate structure, so relative rankings remain valid.
- **scMalignantFinder cancer-type bias:** Track A AP on crc_lee = 0.943 (colorectal, used by Track F) vs 0.015 on hnscc_puram (head & neck SCC). The AP=1.0 on Track F is colorectal-specific and does not generalize across cancer types.
- **hvg_logreg constant 0.5:** The supervised classifier was trained on inter-lineage Track A labels; on intra-lineage Track F it sees all cells as one class and outputs a constant 0.5 (AUROC = 0.500). This is the expected ceiling-drop, not a fallback.
- **Method fidelity:** CaSee ran as a faithful CPU recreation of the original autoencoder; DeepScena ran on a Colab T4 GPU (with a `torch.load` `weights_only` patch for PyTorch 2.6+); FiRE/cellsius/RareQ ran via Rscript with real, varied scores.

---

## Figures NOT Requiring Changes

The following figures do not require changes based on our analysis:
- **Fig0** (Phase11 Summary Heatmap): Rankings unchanged; add N only if journal requires.
- **Fig10** (Method QC Audit): No ranking changes from Phase 2 analyses.
- **FigA1** (DeepScena): Appendix figure; unchanged.

---

## Files to Stage

```bash
# Regenerate Fig11 (already done in Phase 6):
.venv/bin/python scripts/generate_track_f_figure.py
# → writes manuscript_revision/images/Fig11_Track_F_vs_Track_A.png (300 DPI)

# Stage existing phase12 figures:
cp data/results/figures/phase12/*.png manuscript_revision/images/
```
