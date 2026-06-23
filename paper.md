# REACH: A Reproducible Benchmark for Rare Malignant-Cell Detection in Single-Cell RNA Sequencing

> **Article type:** Original Research | **Version:** v1.2.0 | **Date:** 2026-04-30

---

## Abstract

Rare malignant cells in single-cell RNA sequencing (scRNA-seq) can represent circulating tumor cells, minimal residual disease, drug-tolerant persisters, metastatic intermediates, or small tumor compartments embedded in a complex microenvironment. REACH targets the specific problem of **rare malignant-cell detection in a heterogeneous tumour microenvironment (TME)**: positives are malignant cells embedded in an immune/stromal background, and the task is **imbalanced cell-level ranking**, not intra-lineage sub-state discovery. REACH therefore evaluates how well methods surface scarce malignant cells above an abundant TME background under controlled prevalence, synthetic stress, null-control, and label-noise conditions. These populations are biologically important but statistically difficult: the positive class is scarce, labels are assembled from imperfect evidence, and a high AUROC can coexist with poor recovery of top-ranked cells. We present REACH, not a new detector but a reproducible benchmark and software/data resource for rare malignant-cell detection that treats the task as imbalanced cell-level ranking. REACH v1.2.0 combines ten curated public scRNA-seq datasets (approx. 360,000 cells), six evaluation tracks (A–F), ten standardized method wrappers, confidence-tiered multi-arm labels, fallback-aware metrics, nonparametric paired statistics, and figure regeneration from frozen result tables. Across 1,125 benchmark units, REACH produced 11,250 method-unit evaluations. On the primary controlled real-cell Track A endpoint, the supervised in-sample `hvg_logreg` ceiling reached median average precision (AP) 1.000 (mean 0.909, mean AUROC 0.953), showing that high-confidence labels often retain recoverable expression signal. The exploratory comparator `CaSee` reached median AP 0.512 but is reported separately from ranked published detectors. Among ranked published methods, `FiRE` had the highest primary median AP (0.313), while paired tests showed it was not significantly different from `expr_threshold` or `scMalignantFinder`. Global Track A method differences were strongly supported on the 140-unit common subset (Friedman χ²=695.05, p=8.0×10⁻¹⁴⁴; Iman-Davenport F=171.01, p=8.4×10⁻²¹¹). REACH exposes a large gap between supervised separability and current unsupervised ranking, substantial prevalence sensitivity, dataset-specific winners, and method reliability issues that would be hidden by a single leaderboard number.

---

## Public Release Scope

This repository contains source code, tests, method wrappers, workflow entrypoints, toy data, lightweight Phase 11 CSV snapshots, Phase 12 PNG previews, and submission-ready figures. Large processed datasets, track units, full prediction outputs, and complete result archives are external Zenodo/GitHub release assets.

---

## Contributions

1. REACH formalises **rare malignant-cell detection in heterogeneous tumour microenvironments** as a per-unit, imbalanced ranking task over high-confidence positive malignant cells and background TME cells — explicitly an inter-lineage contrast, not intra-lineage sub-state discovery.
2. It defines confidence-tiered labels from multiple evidence arms rather than treating a single annotation column as ground truth.
3. It separates primary ranking from exploratory comparators, supervised ceilings, null controls, label-noise diagnostics, and method-failure audits, so that each row in the leaderboard answers a clearly scoped question.
4. It ships as a reproducible benchmark release with public source code, a release-pinned Docker image, four Zenodo archives, deterministic snapshot regeneration, and submission-ready figures and tables.

---

## Datasets

10 curated scRNA-seq datasets across 8 solid-tumour types and 2 blood malignancies:

| Dataset | Cancer type | Platform | Track role | Cells |
|---------|------------|----------|------------|-------|
| hnscc_puram | Head and neck SCC | SMART-seq2 | A/B/C/E | 5,902 |
| bcc_yost | Basal cell carcinoma | 10x Chromium | A/B/C/E | ~47,000 |
| hcc_wei | Hepatocellular carcinoma | 10x Chromium | A/B/C/E | 19,382 |
| luad_laughney | Lung adenocarcinoma | 10x Chromium | A/B/C/E | 33,782 |
| pdac_peng | Pancreatic ductal adenocarcinoma | 10x Chromium | A/B/C/E | 123,488 |
| crc_lee | Colorectal cancer | 10x Chromium | A/B/C/E | 55,551 |
| rcc_multi | Renal cell carcinoma | 10x Chromium | A/B/C/E | 33,574 |
| ov_izar_tirosh | Ovarian cancer ascites | 10x Chromium | A/B/C/E | 9,482 |
| mm_ledergor | Multiple myeloma | 10x Chromium | D | 31,181 |
| breast_ctc_szczerba | Breast cancer CTCs | SMART-seq2 | D | 357 |

---

## Evaluation Tracks

All tracks are constructed around the inter-lineage malignant-vs-TME contrast (malignant epithelial/CTC positives against immune/stromal background), framed as imbalanced cell-level ranking. The intra-lineage setting (malignant vs normal epithelial of the same lineage) is addressed separately by the new Track F (R3-4/R3-5).

| Track | Type | Units | Interpretation |
|-------|------|-------|----------------|
| A | Controlled real-cell spike-ins (4 prevalence tiers) | 160 | Primary endpoint |
| B | Synthetic Splatter stress-test | 120 | Secondary, not blended into primary leaderboard |
| C | Background-dominated null controls | 160 | False-positive diagnostic |
| D | Natural blood/CTC prevalence | 30 | Supplementary primary |
| E | Noisy-label robustness | 640 | Supervised-only interpretive track and label-noise diagnostic |
| F | Intra-lineage malignant vs normal epithelial (3 prevalence tiers) | 15 | Inter-lineage-contrast removal test; not part of primary leaderboard |

**Track B interpretation.** Track B is a synthetic Splatter stress-test and is **not** blended into the primary Track A leaderboard. The method-level rank correlation between Track A and Track B is ρ = 0.042 (p = 0.907; `data/results/revision/sens2_sens3_extract.txt`), i.e. statistically indistinguishable from zero, with large rank reordering across methods (CaSee 2→6, scMalignantFinder 5→10, RareQ 7→2, scCAD 8→4). Synthetic-track rankings therefore do not replicate real-cell rankings, justifying Track B's secondary, non-blended role as a controlled robustness probe rather than a primary endpoint.

**Track E interpretation.** Track E is a supervised-only interpretive track and label-noise diagnostic. It is interpreted as algorithmic robustness only for `hvg_logreg`, which consumes labels. For unsupervised methods, Track E reflects metric sensitivity to corrupted labels, not algorithmic robustness. Track E is therefore not part of the primary unsupervised method ranking.

**Track F: Intra-Lineage Malignant Detection.** In response to R3-4/R3-5, we introduce Track F, where the background is restricted to normal-diploid epithelial cells from the same tissue of origin as the malignant positives, removing the inter-lineage TME contrast that defines Tracks A–E. Units are generated at three prevalences (0.1%, 0.5%, 1.0%) with 5 replicates each — 15 units total. Unit sizes are adaptive: 2,000 cells for the 0.1% level (to preserve the ultra-rare ceiling-drop signal with ≥2 positives) and 400 cells for the 0.5% and 1.0% levels (to reduce background duplication below the 20% design cap). Background is sampled without replacement first, then fills the remainder with replacement only if the unique pool is exhausted. All 10 methods were evaluated (150/150 predictions complete; DeepScena on Colab T4 GPU). Track F is constructed from the **crc_lee** (colorectal cancer) dataset only, because it is the only REACH dataset carrying both epithelial `cell_type` annotations and normal/tumor `tissue_origin` labels; we audited all other 9 datasets and none have the required metadata even via marker-based fallback (EPCAM+ ∩ low-CNV ∩ source-negative yields 0–70 cells — insufficient for valid units). Track F is a diagnostic track and is **not** blended into the primary Track A leaderboard.

**Intra-lineage principle.** Track A–E performance is built on the inter-lineage malignant-vs-TME contrast and does **not** imply the ability to distinguish malignant from normal cells of the *same* lineage. Track F confirms this: at 0.1% prevalence, nine of ten methods fall to median AP ≤ 0.009 on Track F (most at 0.001, the chance floor), while only scMalignantFinder retains power (AP = 1.000) — and even that result is cancer-type-specific (see R3-5 caveat below). Inter-lineage leaderboards therefore cannot be extrapolated to intra-lineage sub-state detection.

---

## Included Methods

| Method | Category | Role |
|--------|----------|------|
| hvg_logreg | Supervised | In-sample ceiling (not a deployable competitor) |
| CaSee | Exploratory | Exploratory comparator (separate from ranked detectors) |
| FiRE | Ranked | Published comparator |
| DeepScena | Ranked | Published comparator |
| RareQ | Ranked | Published comparator |
| cellsius | Ranked | Published comparator |
| scCAD | Ranked | Published comparator |
| scMalignantFinder | Ranked | Published comparator |
| expr_threshold | Naive | Naive biological baseline |
| random_baseline | Naive | Floor baseline |

**Excluded methods (7):** CopyKAT, MACE, SCANER, SCEVAN, RaceID3, scATOMIC, GiniClust3 — excluded for modality mismatch, score-contract mismatch, OOM, timeout, or degenerate outputs.

---

## Method Inclusion and Exclusion

REACH considered 17 candidate methods. Ten produced evaluable outputs under the standardised score contract. The remaining seven were excluded.

| Status | Method | Category | Wrapper Fidelity | Reason |
|--------|--------|----------|------------------|--------|
| Included | hvg_logreg | Supervised Ceiling | Faithful | In-sample logistic ceiling |
| Included | CaSee | Exploratory | Faithful recreation | Autoencoder-Isolation Forest (Yu et al., 2022) |
| Included | FiRE | Ranked | Faithful | Frequency-based rarity (Jindal et al., 2018) |
| Included | DeepScena | Ranked | Proxy | Deep clustering/SSL (Lei et al., 2023) |
| Included | RareQ | Ranked | Faithful | Neighbourhood rarity (R package) |
| Included | cellsius | Ranked | Faithful | Rarity statistic (Wegmann et al., 2019) |
| Included | scCAD | Ranked | Proxy | Anomaly scorer (Xu et al., 2024) |
| Included | scMalignantFinder | Ranked | Proxy | Malignancy probability (Yu et al., 2025) |
| Included | expr_threshold | Naive Baseline | Faithful | Total-UMI/expression rank baseline |
| Included | random_baseline | Naive Baseline | Faithful | Random uniform floor |
| Excluded | CopyKAT | — | — | CNV modality mismatch (requires raw counts + gene positions) |
| Excluded | MACE | — | — | Score contract mismatch (bulk-level annotation) |
| Excluded | SCANER | — | — | Score contract mismatch (cluster-level, not cell-level) |
| Excluded | SCEVAN | — | — | CNV modality mismatch |
| Excluded | RaceID3 | — | — | Score contract mismatch (cluster-level rare-cell identification) |
| Excluded | scATOMIC | — | — | Score contract mismatch (multi-class classifier) |
| Excluded | GiniClust3 | — | — | Score contract mismatch (cluster-level, not cell-level) |

### Wrapper Fidelity Notes

- **Faithful:** The wrapper executes the original published software package with default parameters and documented configurations.
- **Proxy:** The wrapper reimplements the published algorithm from the paper description. Performance may differ from the original implementation.
- **Faithful recreation:** CaSee's original repository (Yu et al., 2022) was cloned, but the executed wrapper uses a built-in CPU fallback runner that faithfully recreates the published autoencoder + isolation-forest pipeline rather than invoking the original GPU-dependent code. Scores are real model outputs (varied, not random). See `data/results/revision/VERIFICATION_ISSUES.md` §5.5.

### Supervised Ceiling Justification

hvg_logreg is a supervised logistic regression trained in-sample on 2,000 highly variable genes using the true positive/background labels of each unit. It is **not** a peer competitor to unsupervised methods; it is a calibration ceiling that quantifies the gap between supervised separability and current unsupervised ranking (≈0.687 median AP: 1.000 vs 0.313 on Track A). Importantly, the ceiling is **not trivially achievable across all tasks**: on the new intra-lineage Track F (malignant vs normal epithelial cells, same lineage), hvg_logreg's median AP collapses from 1.000 (Track A) to 0.001 at 0.1% prevalence (Δ = −0.999; `data/results/revision/track_f/track_a_vs_f_comparison.csv`). The ceiling is therefore specific to the inter-lineage TME task that REACH is designed to probe; it ceases to be informative once the inter-lineage contrast is removed.

We **concede** Reviewer 3's point: the inter-lineage supervised ceiling is trivial for the intra-lineage problem. hvg_logreg was trained on inter-lineage labels (malignant vs TME); on Track F (malignant epithelial vs normal epithelial, same lineage) it outputs a constant 0.5 score for every cell, yielding median AP = 0.001 and AUROC = 0.500 at all three prevalences (`data/results/revision/track_f/track_f_leaderboard.csv`). Its ceiling therefore drops by Δ = −0.999 from Track A to Track F. The inter-lineage ceiling is meaningful **only as an upper bound for the TME-separation task REACH is designed to assess**; it is not a general statement about the discriminability of malignant cells. Track F (below) provides the intra-lineage evidence the ceiling cannot.

---

## Primary Leaderboard (Track A)

| Rank | Method | Median AP | Mean AP | AUROC | Runtime (s) | Role |
|------|--------|-----------|---------|-------|-------------|------|
| -- | hvg_logreg | 1.000 | 0.909 | 0.953 | 3.3 | Supervised ceiling |
| -- | CaSee | 0.512 | 0.441 | 0.869 | 357.5 | Exploratory |
| -- | expr_threshold | 0.317 | 0.361 | 0.737 | 15.3 | Naive baseline |
| 1 | FiRE | 0.313 | 0.385 | 0.885 | 118.1 | Published |
| 2 | cellsius | 0.259 | 0.270 | 0.832 | 39.8 | Published |
| 3 | scMalignantFinder | 0.235 | 0.319 | 0.804 | 7.6 | Published |
| 4 | RareQ | 0.196 | 0.256 | 0.818 | 78.2 | Published |
| 5 | scCAD | 0.130 | 0.226 | 0.771 | 123.4 | Published |
| -- | random_baseline | 0.019 | 0.037 | 0.511 | 11.6 | Floor |
| 6 | DeepScena | 0.018 | 0.029 | 0.471 | 80.6 | Published |

**CaSee exploratory note.** CaSee is reported as exploratory and is excluded from the numbered published-method ranking. CaSee median AP across all 160 Track A units is 0.512; on 20 of those units CaSee returned degenerate constant-score predictions (score SD ≈ 0) and excluding them raises its median AP to 0.606 (`data/results/revision/casee_filtered_leaderboard.csv`). Because CaSee's autoencoder is trained on the test unit's own cells without external reference labels, it is not a deployable detector and is kept separate from the ranked published comparators.

---

## Key Statistical Results

- **Global test (140-unit common Track A subset):** Friedman χ² = 695.05, p = 8.0×10⁻¹⁴⁴; Iman-Davenport F = 171.01, p = 8.4×10⁻²¹¹
- **Bootstrap rank intervals (2,000 resamples):** hvg_logreg and CaSee stable at ranks 1 and 2; FiRE median rank 3 (95% CI [3, 4])
- **Pairwise vs FiRE:** FiRE significantly better than DeepScena, random_baseline, scCAD, RareQ, cellsius (BH FDR < 0.05). FiRE NOT significantly different from scMalignantFinder (p=0.812) or expr_threshold (p=0.836). CaSee significantly higher than FiRE (Δmean AP = -0.139, BH FDR = 6.1×10⁻⁸) but remains exploratory.
- **Track B vs Track A:** Spearman ρ = 0.042, p = 0.907 (no rank correlation — Track B is a separate stress test)
- **Track E (supervised only):** hvg_logreg mean AP drops from 0.909 to 0.460–0.829 under four label perturbation conditions
- **Track C null FPR:** On all-negative null units, every unsupervised and naive method controls the false-positive rate near the expected ~3% floor: RareQ 0.0293, cellsius 0.0295, CaSee 0.0301, scCAD 0.0301, random_baseline 0.0309, expr_threshold 0.0310, DeepScena 0.0306, scMalignantFinder 0.0315, FiRE 0.0315 (`data/results/revision/sens2_sens3_extract.txt`). The supervised ceiling hvg_logreg is the lone outlier at FPR = 0.788 (78.8%) because it trains in-sample on the null unit's own expression features and overfits to the absence of signal — a known cross-validation pathology on all-negative data that does not affect its Track A performance. Track C thus functions as a specificity diagnostic: a method that cannot keep its null FPR near 3% is unfit for deployment in low-prevalence screening.
- **Pairwise Cliff's δ effect sizes** quantify the practical magnitude of method differences (full matrix: `data/results/revision/cliff_delta_matrix.csv`). The supervised ceiling dominates every unsupervised method by a large effect (hvg_logreg vs FiRE δ = 0.796, vs DeepScena δ = 0.929, vs random_baseline δ = 0.917). Among ranked published methods, FiRE's advantage over the naive expr_threshold baseline is negligible (δ = 0.068), meaning that despite FiRE's higher mean AP its per-unit advantage is inconsistent — many units show comparable performance. By contrast, CaSee vs DeepScena (δ = 0.702) and FiRE vs DeepScena (δ = 0.775) are large effects, confirming a real capability gap between top and bottom ranked detectors.
- **Track F (intra-lineage, crc_lee only; `data/results/revision/track_f/track_f_leaderboard.csv`):** At 0.1% prevalence the pretrained pan-cancer classifier scMalignantFinder achieves median AP = 1.000, while every other method falls to the chance floor — hvg_logreg AP = 0.001 (constant 0.5 scores), expr_threshold 0.008, FiRE 0.004, CaSee 0.003, random_baseline 0.002, DeepScena 0.001, and cellsius/RareQ/scCAD all 0.001. scMalignantFinder stays dominant at 0.5% (AP = 1.000) and 1% (AP = 0.917). **Two caveats** (`data/results/revision/VERIFICATION_ISSUES.md`): (1) Track F uses only crc_lee — scMalignantFinder's Track A AP ranges 0.015 (hnscc_puram) to 0.943 (crc_lee) across cancer types, so its Track F AP = 1.000 is colorectal-cancer-specific and **must not** be generalised; no other REACH dataset has the required normal-epithelial annotations even via marker-based fallback (audited: EPCAM+ ∩ low-CNV ∩ source-negative yields 0–70 cells across all 9 other datasets). (2) Background duplication: at the 0.1% level (2,000-cell units), crc_lee's 340 normal epithelial cells produce 83% duplicate background IDs; at the 0.5% and 1.0% levels (400-cell units), duplication drops to 14.6% and 14.1% respectively — both under the 20% design cap. The 0.1% duplication slightly inflates absolute AP but affects all methods identically, so relative comparisons remain valid. Future work should curate additional datasets with normal epithelial references to enable cross-cancer Track F evaluation.

---

## Dataset-Level Winners

| Dataset | Best non-ceiling | AP |
|---------|-----------------|-----|
| bcc_yost | CaSee | 0.6079 |
| hnscc_puram | expr_threshold | 0.7872 |
| pdac_peng | CaSee | 0.4488 |
| rcc_multi | cellsius | 0.1931 |
| crc_lee | scMalignantFinder | 0.8373 |
| luad_laughney | CaSee | 0.5378 |
| hcc_wei | CaSee | 0.4908 |
| ov_izar_tirosh | expr_threshold | 0.5717 |

---

## Limitations

1. **CNV evidence, circularity check, and validation.** Version 1 uses infercnvpy (v0.6.1) as the sole copy-number inference arm. To assess whether the CNV arm circularly inflates the method ranking, we re-derived HC labels using only tissue-of-origin, AUCell signature scores, and kNN neighbourhood purity — dropping the CNV criterion entirely — and recomputed median AP for each method. Removing CNV from the label criteria collapses median AP to the chance floor (0.009–0.010) for every method including the supervised ceiling, indicating that CNV is the primary discriminative signal in the HC label set. The rank ordering under CNV-free labels correlates with the published ranking (Spearman ρ = 0.648, p = 0.043; `data/results/revision/circularity_ranking.csv`), but this correlation is computed over near-tied chance-level values, so it should be interpreted cautiously: the rank order is broadly preserved, but the absolute performance differences vanish without CNV. We therefore frame CNV as the dominant but not sole label component — tissue-of-origin and signature scores contribute to the HC set but CNV drives the discriminability. We also validated inferred CNV burden (mean absolute deviation from the diploid baseline) against published source malignancy annotations across 9 datasets (57,811 cells; 5,010 positive; 52,801 background; `data/results/revision/cnv_concordance.csv`). CNV burden discriminated source-annotated malignant from non-malignant cells with overall AUROC = 0.782 and MCC = 0.361. Per-dataset AUROC ranged from 0.747 (hcc_wei) to 0.960 (luad_laughney), with five datasets exceeding 0.86 (luad_laughney 0.960, pdac_peng 0.934, crc_lee 0.892, hnscc_puram 0.906, ov_izar_tirosh 0.868). An earlier version of this analysis reported hnscc_puram at AUROC = 0.500 because its `cell_type` labels (e.g. `"0.0"`, `"Fibroblast"`, `"T cell"`) did not match infercnvpy's default reference categories (`T cells`, `B cells`, `Myeloids`, …) and CNV scores were zero; we corrected the reference categories to include the singular label forms present in this dataset and regenerated its CNV, yielding AUROC = 0.906 (MCC = 0.763). CNV is therefore used as one of three independent HC-label components, not as a standalone ground truth. Cross-validation with CopyKAT, Numbat, or SCEVAN would further strengthen CNV evidence but was not feasible at this scale.
2. **Imperfect ground truth.** High-confidence labels (P_HC/B_HC) rely on consensus across four evidence arms. False positives in source annotation or CNV calls can propagate. The tier-assignment system mitigates this by using only P_HC vs B_HC for primary AP computation.
3. **Fallback and degenerate rates.** Across all methods, 249 units produced fallback scores and 377 units produced degenerate outputs. These rates are high and reflect current engineering stability limitations of method wrappers rather than algorithmic quality.
4. **Dataset diversity.** The 10 datasets span 8 solid-tumour types and 2 blood malignancies but are dominated by 10x Chromium (8/10). SMART-seq2 is represented in only 2 datasets. No spatial transcriptomics or multi-omics data are included.
5. **Track D size.** Natural prevalence evaluation (Track D) contains only 30 units from 2 datasets, limiting statistical power for this track.
6. **No held-out datasets.** All datasets are public. Method developers can tune against the leaderboard, though REACH's multi-track design with null controls and label-noise tracks makes simple overfitting harder.
7. **Single contributor.** The benchmark was developed by a single author. Independent verification by additional researchers would strengthen reproducibility claims.
8. **Cancer-type scope.** Several therapeutically important cancer types (glioblastoma, prostate adenocarcinoma, gastric cancer) are not represented.
9. **Label-threshold sensitivity.** To test whether the qualitative method ordering depends on the AUCell score threshold and kNN neighbourhood-purity cutoff, we varied both across nine combinations (AUCell 0.10/0.15/0.20 × kNN 0.40/0.50/0.60) while holding CNV scores fixed, and recomputed rankings. On the five datasets yielding a valid Spearman ρ, the high-confidence label sets were insensitive to these threshold variations — the same cells were selected at every setting — so the resulting method rankings are identical within each dataset (ρ per dataset: luad_laughney 0.685, pdac_peng 0.758, bcc_yost 0.818, hcc_wei 0.879, crc_lee 0.939). The cross-dataset ρ range [0.685, 0.939] therefore reflects dataset-level variation in label separability, not threshold sensitivity. Two datasets (ov_izar_tirosh, rcc_multi) could not form a high-confidence background at any setting (n_B_HC = 0) and are excluded. The label-construction pipeline is thus stable to the tested threshold parameters, though this analysis does not demonstrate ranking robustness to threshold changes that would actually alter the label set (`data/results/revision/threshold_sensitivity.csv`).
10. **TME overlap and the false-positive scope choice.** Because REACH measures detection against a heterogeneous TME background, methods trained or implicitly calibrated on the malignant-vs-TME contrast may flag TME subpopulations whose expression partially overlaps malignant signatures (e.g. activated macrophages, plasmablasts, cycling fibroblasts) as false positives. This is a deliberate scope choice: REACH models the realistic low-prevalence screening scenario in which TME is the background and tolerance to such false positives is modulated by precision@k. Track C confirms that, on pure all-negative null units, every unsupervised method keeps its mean FPR near 3% (`data/results/revision/sens2_sens3_extract.txt`), so elevated FPR on mixed-TME units reflects biological overlap, not metric pathology. The new intra-lineage Track F (R3-4/R3-5) begins to disentangle behaviour on pure-epithelial versus mixed-TME backgrounds.

---

## Comparison to Related Benchmarks

| Feature | REACH v1.2 | scIB (Luecken 2022) | OpenProblems (Lance 2024) |
|---------|------------|---------------------|---------------------------|
| Task | Rare malignant cell detection | Batch correction, clustering, integration | Multi-task (denoising, DE, etc.) |
| Tracks | 5 (spike-in, synthetic, null, natural, noise) | Multi-metric per task | Per-task metrics |
| Labels | Multi-arm confidence tiers (P_HC-B_LC) | Canonical cell-type labels | Truth from data generators |
| Null controls | Yes (Track C) | Not standard | Not standard |
| Label noise | Yes (Track E, supervised only) | Not included | Not included |
| Supervised ceiling | Yes (hvg_logreg) | Not standard | Not standard |
| Fallback handling | Filtered from primary AP | Not standardised | Varies |
| Containerisation | Docker + GHCR | Docker | Docker + Nextflow |

---

## Data and Code Availability

- **Source code:** https://github.com/jaswanthmoram/reach-rarecell-benchmark
- **Concept DOI:** https://doi.org/10.5281/zenodo.19847108
- **Processed datasets (7.3 GB):** https://doi.org/10.5281/zenodo.19850652
- **Track Units A-C (9.7 GB):** https://doi.org/10.5281/zenodo.19850972
- **Track Units D-E (2.2 GB):** https://doi.org/10.5281/zenodo.19851287
- **Complete results (425 MB):** https://doi.org/10.5281/zenodo.19851710
- **Docker image:** ghcr.io/jaswanthmoram/reach-rarecell-benchmark:latest
- **License:** MIT
- **GEO accessions:** GSE103322, GSE123813, GSE149614, GSE123902, GSE202051, GSE132465, GSE159115, GSE146026, GSE161801, GSE109761

Git alone is sufficient for toy workflows and public snapshot reproduction. Full processed-data, track-unit, prediction, and complete-result reruns require restoring the external Zenodo archives listed above.

---

## Reproducibility

### Snapshot Reproduction (Git-only, no external data)

```bash
rcb smoke-test
python scripts/run_all.py --toy
python scripts/phase11_statistics.py --from-snapshots
python scripts/reproduce_from_snapshots.py
snakemake -n --cores 1
dvc repro --dry
```

See `docs/reproducibility_receipt.md` for the verified execution record, environment details, and expected outputs.

### Revision compute environment

The sensitivity, CNV-validation, Track F, and concordance analyses in this revision were executed on a single CPU-only node: AMD EPYC 7B12 (16 vCPUs), 62 GiB RAM, Debian GNU/Linux 13 trixie, Python 3.13.5, R 4.5.0, with scanpy 1.12.1, scikit-learn 1.9.0, infercnvpy 0.6.1, anndata 0.11.4, torch 2.12.1 (CPU). R packages FiRE, CellSIUS, RareQ, and Seurat were installed and ran natively. **No GPU was available on this node.** DeepScena, whose TensorFlow/Torch pipeline requires CUDA, was run separately on a Google Colab Tesla T4 GPU; its predictions were transferred back and scored identically to all other methods. Full environment capture: `data/results/revision/environment_capture.txt`. (The original v1.2.0 preprocessing cited in the Acknowledgements used GCP high-memory CPU and NVIDIA L4 GPU instances; that remains the record for dataset pre-processing, while the revision compute above is the record for the new analyses.)

---

## Author

**Moram Venkata Satya Jaswanth**
Department of Computer Science and Engineering, SRM University AP, Amaravati, Andhra Pradesh, India
Email: jaswanthmoram@gmail.com
ORCID: 0009-0003-2369-1692

---

## Author Contributions

M.V.S.J. conceived the benchmark, designed the evaluation framework, curated datasets, implemented the software, executed the analyses, generated figures, interpreted results, and wrote the manuscript.

---

## Acknowledgements

The author thanks the original dataset creators and method developers whose public data and software made REACH possible. This work used Google Cloud Platform high-memory CPU instances (30 vCPU / 240 GB RAM and 60 vCPU / 480 GB RAM) and NVIDIA L4 GPU instances for preprocessing, track generation, method execution, and result aggregation. The author also acknowledges the open-source Scanpy, scikit-learn, Snakemake, DVC, Docker, and Python scientific-computing communities.

Degenerate and failed method runs (CopyKAT, MACE, SCANER, SCEVAN, RaceID3, scATOMIC, GiniClust3) were identified on these systems and documented in the excluded-methods table.

---

## Funding

No external funding was received for this work.

---

## Competing Interests

The author declares no competing interests.

---

## Supplementary Material

- Excluded-method notes: `data/results/manuscript/supplementary/EXCLUDED_METHODS.md`
- Sensitivity-analysis notes: `data/results/manuscript/supplementary/SENSITIVITY_ANALYSES.md`
- Statistical-method notes: `data/results/manuscript/supplementary/STATISTICAL_METHODS.md`
- Phase 11 tables: `data/results/tables/phase11/`
- Phase 12 figures: `data/results/figures/phase12/`

---

## Contribution to the Field

Rare malignant cells are central to tumor progression, treatment resistance, and circulating tumor-cell biology, but computational methods for detecting them in scRNA-seq data are difficult to compare fairly. REACH addresses this gap by providing a reproducible, cancer-focused benchmark that evaluates rare malignant-cell detection as a ranked retrieval problem rather than a standard balanced classification task. The benchmark combines multi-evidence confidence labels, controlled real-cell rarity, synthetic stress tests, null-control behavior, natural-prevalence evaluation, label-noise analysis, standardized method wrappers, and explicit failure auditing. By releasing code, figures, tables, Docker assets, and Zenodo archives, REACH provides a transparent baseline for method developers and a practical guide for researchers selecting rare malignant-cell detection tools.

---

## Version History

- **v1.2.0 (2026-04-29):** Publication-ready snapshot. 10 datasets, 10 methods, 1,125 units, 11,250 evaluations. Added public Phase 11/12 tables and figures, label-based evaluation, all method wrappers exposed through registry, paper.md, and reproducibility receipt.
- **v1.1.0 (2026-04-28):** Initial public release. Code, configs, tests, Docker, CI/CD, toy-data generation, frozen CSV snapshots, Zenodo DOIs.
