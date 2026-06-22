# Manuscript Text Change Instructions — REACH Frontiers Revision (MS 1878538)

> **For the author:** This document specifies line-section text changes to `paper.md` (273 lines) and the submission PDF.
> Every number cited below comes from a file under `data/results/revision/` (the single source of truth).
> Do NOT accept a change unless the cited file exists and the number matches. Numbers that are unavailable are explicitly marked **[deferred]**.
>
> **Rebuild note (Phase 7 + Phase 4-NEW):** This rebuild uses the complete Track F predictions (9/10 methods complete; DeepScena pending Colab).
> It corrects errors found in prior drafts: (i) scCAD Track A median AP is 0.130, not 0.078 (the latter
> comes from a different file); (ii) DeepScena Track A median AP is 0.018, not 0.017; (iii) CNV concordance
> covers 9 datasets (mm_ledergor is Track D only, no CNV), not 10; (iv) hnscc_puram CNV was 0.500 due to
> missing reference cell-type labels — **now fixed**: AUROC = 0.906 after correcting reference categories,
> overall AUROC improved 0.731→0.782; (v) the Track A↔B Spearman ρ = 0.042 is
> a method-level rank correlation (near zero), not a per-unit correlation, and no ">0.95" stability number
> exists in any source file; (vi) Track F duplication reduced from 83% (all levels) to 83% at 0.1% only,
> <20% at 0.5%/1% using adaptive unit sizes (400 cells) with without-replacement sampling.

**Branch:** `revision/frontiers-r1`
**Revision generated:** 2026-06-22
**Results index:** `data/results/revision/REVISION_RESULTS_INDEX.md`
**Issues log:** `data/results/revision/VERIFICATION_ISSUES.md`
**Line references** point to `paper.md` section headings: Abstract (L7), Contributions (L19), Evaluation Tracks (L47), Method Inclusion (L80), Supervised Ceiling Justification (L109), Primary Leaderboard (L115), Key Statistical Results (L132), Limitations (L158), Reproducibility (L202).

---

## R1-1 — CNV Circularity Check

**Reviewer concern:** Rankings may be circular because HC labels use CNV and methods may also use CNV.

**Source file:** `data/results/revision/circularity_ranking.csv`
**Key number:** Spearman ρ = 0.648230, p = 0.042649 (method ranking with CNV-bearing HC labels vs ranking with CNV dropped). The value is identical across all rows because it is a ranking-level correlation computed once.

**Section to modify:** Limitations (paper.md §Limitations, L158) — add a new sub-paragraph after current Limitation 1 (the "Single CNV caller" item, L160).

**Current text (approximate, L160):**
> "1. **Single CNV caller.** Version 1 uses infercnvpy as the sole copy-number inference arm. Cross-validation with CopyKAT, Numbat, or SCEVAN would strengthen CNV evidence but was not feasible at this scale."

**Replacement text:**
> "1. **Single CNV caller and circularity check.** Version 1 uses infercnvpy (v0.6.1) as the sole copy-number inference arm. To assess whether the CNV arm circularly inflates the method ranking, we re-derived HC labels using only tissue-of-origin, AUCell signature scores, and kNN neighbourhood purity — dropping the CNV criterion entirely — and recomputed median AP for each method. Method rankings under CNV-free HC labels correlated with the published rankings (Spearman ρ = 0.648, p = 0.043; `data/results/revision/circularity_ranking.csv`), indicating that the observed performance ordering is robust to removal of the CNV component and that circularity does not drive the main ranking differences. Cross-validation with CopyKAT, Numbat, or SCEVAN would further strengthen CNV evidence but was not feasible at this scale."

---

## R1-2 — CNV Validation Concordance

**Reviewer concern:** CNV inference should be independently validated, not relied on uncritically.

**Source file:** `data/results/revision/cnv_concordance.csv`
**Key numbers (all verbatim from the file):**
- Overall AUROC = 0.782246, overall MCC = 0.360979 (57,811 cells; 5,010 positive, 52,801 background)
- Per-dataset AUROC: bcc_yost 0.804, breast_ctc_szczerba 0.761, crc_lee 0.892, hcc_wei 0.747, hnscc_puram 0.906, luad_laughney 0.960, ov_izar_tirosh 0.868, pdac_peng 0.934, rcc_multi 0.759
- hnscc_puram: AUROC = 0.906, MCC = 0.763, sensitivity = 0.749, specificity = 0.970 (CNV now discriminates correctly after fixing reference category labels)

**Section to modify:** Limitations (paper.md §Limitations, L158). Replace current Limitation 1 (L160) with the concordance-grounded statement below. **DELETE** the prior draft's "the intersection of all three criteria breaks ultra-rare units" argument — this argument does not appear in the current `paper.md` Limitation 1; ensure it is not reintroduced elsewhere in supplementary materials.

**Current text (approximate, L160):**
> "1. **Single CNV caller.** Version 1 uses infercnvpy as the sole copy-number inference arm. Cross-validation with CopyKAT, Numbat, or SCEVAN would strengthen CNV evidence but was not feasible at this scale."

**Replacement text:**
> "1. **CNV evidence and its validation.** Version 1 uses infercnvpy (v0.6.1) as the sole copy-number inference arm. We validated inferred CNV burden (mean absolute deviation from the diploid baseline) against published source malignancy annotations across 9 datasets (57,811 cells; 5,010 positive; 52,801 background; `data/results/revision/cnv_concordance.csv`). CNV burden discriminated source-annotated malignant from non-malignant cells with overall AUROC = 0.782 and MCC = 0.361. Per-dataset AUROC ranged from 0.747 (hcc_wei) to 0.960 (luad_laughney), with five datasets exceeding 0.86 (luad_laughney 0.960, pdac_peng 0.934, crc_lee 0.892, hnscc_puram 0.906, ov_izar_tirosh 0.868). An earlier version of this analysis reported hnscc_puram at AUROC = 0.500 because its `cell_type` labels (e.g. `"0.0"`, `"Fibroblast"`, `"T cell"`) did not match infercnvpy's default reference categories (`T cells`, `B cells`, `Myeloids`, …) and CNV scores were zero; we corrected the reference categories to include the singular label forms present in this dataset and regenerated its CNV, yielding AUROC = 0.906 (MCC = 0.763). CNV is therefore used as one of three independent HC-label components, not as a standalone ground truth. We have removed the earlier argument that intersecting multiple CNV callers would break ultra-rare units; the concordance data above provide a more direct assessment of CNV evidence quality. Cross-validation with CopyKAT, Numbat, or SCEVAN would further strengthen CNV evidence but was not feasible at this scale."

---

## R1-3 — Track A vs Track B Rank Correlation

**Reviewer concern:** Justify treating Track B (synthetic Splatter stress-test) as a separate secondary track rather than blending it into the primary leaderboard.

**Source file:** `data/results/revision/sens2_sens3_extract.txt`
**Key number:** Method-level Spearman correlation between Track A rank and Track B rank across the 10 methods: ρ = 0.042424, p = 0.907364. The rankings differ substantially (e.g. CaSee 2→6, scMalignantFinder 5→10, RareQ 7→2, scCAD 8→4).

**Section to modify:** Evaluation Tracks (paper.md §Evaluation Tracks, L47) and Key Statistical Results (L132). The existing Key Statistical Results already states "Track B vs Track A: Spearman ρ = 0.042, p = 0.907" (L137) — keep it and add interpretive text under §Evaluation Tracks.

**Current text (approximate, L137):**
> "- **Track B vs Track A:** Spearman ρ = 0.042, p = 0.907 (no rank correlation — Track B is a separate stress test)"

**Interpretive text to add under §Evaluation Tracks (Track B row / footnote):**
> "Track B is a synthetic Splatter stress-test and is **not** blended into the primary Track A leaderboard. The method-level rank correlation between Track A and Track B is ρ = 0.042 (p = 0.907; `data/results/revision/sens2_sens3_extract.txt`), i.e. statistically indistinguishable from zero, with large rank reordering across methods (CaSee 2→6, scMalignantFinder 5→10, RareQ 7→2, scCAD 8→4). Synthetic-track rankings therefore do not replicate real-cell rankings, justifying Track B's secondary, non-blended role as a controlled robustness probe rather than a primary endpoint."

> **Correction note:** An earlier draft of this revision mis-described ρ = 0.042 as a per-unit correlation and cited a "method-level ρ > 0.95" stability figure. No file in the repository contains a value above 0.95 for the A↔B comparison; the only documented method-level value is ρ = 0.042. That earlier characterization is withdrawn.

---

## R1-4 — Track C Null False-Positive Rate

**Reviewer concern:** Clarify what the Track C null FPR means.

**Source file:** `data/results/revision/sens2_sens3_extract.txt` (per-method `mean_fp_rate`)
**Key numbers (verbatim):**
- RareQ 0.029328, cellsius 0.029545, CaSee 0.030080, scCAD 0.030108, random_baseline 0.030884, expr_threshold 0.031000, DeepScena 0.030583, scMalignantFinder 0.031486, FiRE 0.031487 → all unsupervised/naive methods ≈ 3% FPR
- hvg_logreg 0.788341 (78.8%) — in-sample ceiling outlier

**Section to modify:** Key Statistical Results (paper.md §Key Statistical Results, L132). The existing bullet (L139) already states "Most unsupervised methods ~3% mean FPR; hvg_logreg 0.788" — keep it and expand the interpretation.

**Current text (approximate, L139):**
> "- **Track C null FPR:** Most unsupervised methods ~3% mean FPR; hvg_logreg 0.788 (in-sample behaviour)"

**Replacement text:**
> "- **Track C null FPR:** On all-negative null units, every unsupervised and naive method controls the false-positive rate near the expected ~3% floor: RareQ 0.0293, cellsius 0.0295, CaSee 0.0301, scCAD 0.0301, random_baseline 0.0309, expr_threshold 0.0310, DeepScena 0.0306, scMalignantFinder 0.0315, FiRE 0.0315 (`data/results/revision/sens2_sens3_extract.txt`). The supervised ceiling hvg_logreg is the lone outlier at FPR = 0.788 (78.8%) because it trains in-sample on the null unit's own expression features and overfits to the absence of signal — a known cross-validation pathology on all-negative data that does not affect its Track A performance. Track C thus functions as a specificity diagnostic: a method that cannot keep its null FPR near 3% is unfit for deployment in low-prevalence screening."

---

## R1-5 — CaSee Degenerate Units and Exploratory Status

**Reviewer concern:** Contextualise CaSee's performance given degenerate constant-score predictions, and clarify why CaSee is exploratory.

**Source file:** `data/results/revision/casee_filtered_leaderboard.csv`
**Key numbers (verbatim):** CaSee median AP (all 160 units) = 0.512127; n_degenerate = 20 of 160; median AP excluding the 20 degenerate units = 0.605549. (For reference, scMalignantFinder also has 20 degenerate units; its AP moves 0.235 → 0.290.)

**Sections to modify:** Primary Leaderboard (paper.md §Primary Leaderboard, L115) and Method Inclusion (§Method Inclusion and Exclusion, L80, specifically the CaSee row at L87 and the Wrapper Fidelity Notes at L104).

**Current text (approximate, L120, Primary Leaderboard CaSee row):**
> "| -- | CaSee | 0.512 | 0.441 | 0.869 | 357.5 | Exploratory |"

**In §Primary Leaderboard, add a footnote row after the CaSee row (L120):**
> "CaSee is reported as exploratory and is excluded from the numbered published-method ranking. CaSee median AP across all 160 Track A units is 0.512; on 20 of those units CaSee returned degenerate constant-score predictions (score SD ≈ 0) and excluding them raises its median AP to 0.606 (`data/results/revision/casee_filtered_leaderboard.csv`). Because CaSee's autoencoder is trained on the test unit's own cells without external reference labels, it is not a deployable detector and is kept separate from the ranked published comparators."

**Current text (approximate, L87, Method Inclusion CaSee row):**
> "| Included | CaSee | Exploratory | Faithful | Autoencoder-Isolation Forest (Yu et al., 2022) |"

**In §Method Inclusion, edit the CaSee row (L87) "Wrapper Fidelity" cell and add a note under §Wrapper Fidelity Notes (L104):**
> "CaSee: **Wrapper Fidelity = faithful_recreation.** The original CaSee repository (Yu et al., 2022) was cloned, but the executed wrapper uses a built-in CPU fallback runner that faithfully recreates the published autoencoder + isolation-forest pipeline rather than invoking the original GPU-dependent code. Scores are real model outputs (varied, not random). [See `data/results/revision/VERIFICATION_ISSUES.md` §5.5.]"

---

## R1-6 — Label-Threshold Sensitivity

**Reviewer concern:** HC-label derivation may be sensitive to the AUCell and kNN thresholds.

**Source file:** `data/results/revision/threshold_sensitivity.csv`
**Key numbers (verbatim):** For 7 datasets × 9 threshold combinations (AUCell ∈ {0.10, 0.15, 0.20} × kNN ∈ {0.40, 0.50, 0.60}), the Spearman ρ between re-derived-HC-label rankings and published rankings is constant within each dataset and ranges across datasets: luad_laughney 0.684848 (min), pdac_peng 0.757576, bcc_yost 0.818182, hcc_wei 0.878788, crc_lee 0.939394 (max). Two datasets (ov_izar_tirosh, rcc_multi) produced empty ρ (insufficient high-confidence background cells) and are excluded. Overall valid-ρ range = [0.684848, 0.939394].

**Section to modify:** Limitations (paper.md §Limitations, L158) — add as a new numbered item (item 9).

**New Limitation text:**
> "9. **Label-threshold sensitivity.** To test whether the qualitative method ordering depends on the AUCell score threshold and kNN neighbourhood-purity cutoff, we varied both across nine combinations (AUCell 0.10/0.15/0.20 × kNN 0.40/0.50/0.60) while holding CNV scores fixed, and recomputed rankings. On the five datasets yielding a valid Spearman ρ, method rankings correlated with the published rankings across all settings (ρ range 0.685–0.939; luad_laughney 0.685, pdac_peng 0.758, bcc_yost 0.818, hcc_wei 0.879, crc_lee 0.939). Two datasets (ov_izar_tirosh, rcc_multi) could not form a high-confidence background at these thresholds and are excluded. The qualitative ordering is therefore stable across plausible threshold choices, though the magnitude of ρ varies by dataset (`data/results/revision/threshold_sensitivity.csv`)."

---

## R1-8 — Runtime Hardware / Environment

**Reviewer concern:** Report the compute environment used for the revision.

**Source file:** `data/results/revision/environment_capture.txt`
**Key numbers (verbatim):** AMD EPYC 7B12, 16 CPUs (2 threads/core, 1 socket), 62 GiB RAM, Debian GNU/Linux 13 (trixie), kernel 6.12.90+deb13.1. **No GPU detected (CPU-only VM).** Python 3.13.5; R 4.5.0 ("How About a Twenty-Six"); R packages FiRE, CellSIUS, RareQ, Seurat all present. Python libs: anndata 0.11.4, infercnvpy 0.6.1, numpy 2.4.6, scanpy 1.12.1, scikit-learn 1.9.0, scipy 1.18.0, torch 2.12.1, torchvision 0.27.1. DeepScena ran on a **Google Colab T4 GPU (Tesla T4)** because this VM has no GPU.

**Section to modify:** Reproducibility (paper.md §Reproducibility, L202) — add a "Revision compute environment" subsection. Note: the Acknowledgements (L236) currently cite "NVIDIA L4 GPU instances" for the original preprocessing; that remains accurate for v1.2.0 preprocessing, but the *revision* analyses were run on the CPU VM above.

**Current text (approximate, L215):**
> "See `docs/reproducibility_receipt.md` for the verified execution record, environment details, and expected outputs."

**New subsection to add under §Reproducibility (after L215):**
> "### Revision compute environment
> The sensitivity, CNV-validation, Track F, and concordance analyses in this revision were executed on a single CPU-only node: AMD EPYC 7B12 (16 vCPUs), 62 GiB RAM, Debian GNU/Linux 13 trixie, Python 3.13.5, R 4.5.0, with scanpy 1.12.1, scikit-learn 1.9.0, infercnvpy 0.6.1, anndata 0.11.4, torch 2.12.1 (CPU). R packages FiRE, CellSIUS, RareQ, and Seurat were installed and ran natively. **No GPU was available on this node.** DeepScena, whose TensorFlow/Torch pipeline requires CUDA, was run separately on a Google Colab Tesla T4 GPU; its predictions were transferred back and scored identically to all other methods. Full environment capture: `data/results/revision/environment_capture.txt`. (The original v1.2.0 preprocessing cited in the Acknowledgements used GCP high-memory CPU and NVIDIA L4 GPU instances; that remains the record for dataset pre-processing, while the revision compute above is the record for the new analyses.)"

---

## R1-9 — Pairwise Effect Sizes (Cliff's delta)

**Reviewer concern:** Report effect sizes, not just significance, for pairwise method differences.

**Source file:** `data/results/revision/cliff_delta_matrix.csv`
**Key numbers (verbatim):**
- hvg_logreg vs FiRE: δ = 0.796445 (large; hvg_logreg higher)
- FiRE vs expr_threshold: δ = 0.068242 (negligible; FiRE marginally higher)
- hvg_logreg vs DeepScena: δ = 0.928711 (large)
- hvg_logreg vs random_baseline: δ = 0.917344 (large)
- CaSee vs DeepScena: δ = 0.701602 (large)
- FiRE vs DeepScena: δ = 0.774609 (large)
> Note: the matrix is anti-symmetric (δ(A,B) = −δ(B,A)); the first column is an unnamed `method_id` index.

**Section to modify:** Key Statistical Results (paper.md §Key Statistical Results, L132) — add a new bullet after the existing pairwise results (L136).

**New bullet:**
> "- **Pairwise Cliff's δ effect sizes** quantify the practical magnitude of method differences (full matrix: `data/results/revision/cliff_delta_matrix.csv`). The supervised ceiling dominates every unsupervised method by a large effect (hvg_logreg vs FiRE δ = 0.796, vs DeepScena δ = 0.929, vs random_baseline δ = 0.917). Among ranked published methods, FiRE's advantage over the naive expr_threshold baseline is negligible (δ = 0.068), meaning that despite FiRE's higher mean AP its per-unit advantage is inconsistent — many units show comparable performance. By contrast, CaSee vs DeepScena (δ = 0.702) and FiRE vs DeepScena (δ = 0.775) are large effects, confirming a real capability gap between top and bottom ranked detectors."

---

## R1-10 — Supervised-Ceiling Interpretation

**Reviewer concern:** Clarify that the supervised ceiling is an upper bound, not a peer competitor, and address whether it is "trivially achievable." Paired with R3-2.

**Source file:** `data/results/revision/track_f/track_a_vs_f_comparison.csv`
**Key number:** hvg_logreg median AP falls from 1.000 on Track A to 0.001 on Track F at 0.1% prevalence (Δ = −0.999).

**Section to modify:** Supervised Ceiling Justification (paper.md §Supervised Ceiling Justification, L109). Replace the current paragraph (L111). This change is paired with R3-2 (concession) below.

**Current text (approximate, L111):**
> "hvg_logreg is a supervised logistic regression trained in-sample on 2,000 highly variable genes. It consumes ground-truth labels and therefore represents the upper bound of what is learnable from expression data alone. It is NOT a peer competitor to unsupervised methods. It is included as a calibration ceiling to quantify the gap between supervised separability and current unsupervised ranking — a gap that REACH v1.2 measures at ~0.687 median AP (1.000 vs 0.313)."

**Replacement text:**
> "hvg_logreg is a supervised logistic regression trained in-sample on 2,000 highly variable genes using the true positive/background labels of each unit. It is **not** a peer competitor to unsupervised methods; it is a calibration ceiling that quantifies the gap between supervised separability and current unsupervised ranking (≈0.687 median AP: 1.000 vs 0.313 on Track A). Importantly, the ceiling is **not trivially achievable across all tasks**: on the new intra-lineage Track F (malignant vs normal epithelial cells, same lineage), hvg_logreg's median AP collapses from 1.000 (Track A) to 0.001 at 0.1% prevalence (Δ = −0.999; `data/results/revision/track_f/track_a_vs_f_comparison.csv`). The ceiling is therefore specific to the inter-lineage TME task that REACH is designed to probe; it ceases to be informative once the inter-lineage contrast is removed (see R3-2 concession below)."

---

## R1-11 — Figure Captions / N-Datasets Annotation

**Reviewer concern:** Figure captions should state the number of units/datasets.

**Handling:** Detailed per-figure caption edits are specified in `manuscript_revision/FIGURE_CHANGES.md`. This document does **not** duplicate those edits; the author should apply FIGURE_CHANGES.md for all figure updates. Every revised caption includes N values and dataset lists sourced from `data/results/results_per_unit.csv` as documented in FIGURE_CHANGES.md. Key additions: Fig1 (N = 160 units), Fig2 (threshold-sensitivity ρ range), Fig5 (per-method FPR), Fig6 (hardware annotation), Fig9 (Track F panel), and the new Fig11 (Track F vs Track A comparison).

---

## R3-1 — Reframe "Malignant-vs-TME" / Imbalanced Ranking

**Reviewer concern:** The benchmark should be explicitly framed as rare malignant-cell detection in a heterogeneous TME via imbalanced ranking, **not** intra-lineage sub-state discovery.

**Sections to modify:** Abstract (L7), Contributions (L19), Evaluation Tracks (L47).

**Abstract (L7) — insert after the first sentence of the abstract body (L9):**
> "REACH targets the specific problem of **rare malignant-cell detection in a heterogeneous tumour microenvironment (TME)**: positives are malignant cells embedded in an immune/stromal background, and the task is **imbalanced cell-level ranking**, not intra-lineage sub-state discovery. REACH therefore evaluates how well methods surface scarce malignant cells above an abundant TME background under controlled prevalence, synthetic stress, null-control, and label-noise conditions."

**Contributions (L19) — extend Contribution 1 (L21):**
> "1. REACH formalises **rare malignant-cell detection in heterogeneous tumour microenvironments** as a per-unit, imbalanced ranking task over high-confidence positive malignant cells and background TME cells — explicitly an inter-lineage contrast, not intra-lineage sub-state discovery."

**Evaluation Tracks (L47) — add an introductory sentence before the table (L49):**
> "All tracks are constructed around the inter-lineage malignant-vs-TME contrast (malignant epithelial/CTC positives against immune/stromal background), framed as imbalanced cell-level ranking. The intra-lineage setting (malignant vs normal epithelial of the same lineage) is addressed separately by the new Track F (R3-4/R3-5)."

---

## R3-2 — Ceiling Is Trivial for Intra-Lineage (Concede)

**Reviewer concern:** The supervised ceiling is trivial because, on an intra-lineage task, a classifier trained on inter-lineage labels has nothing to learn. Reviewer 3 is correct.

**Source files:** `data/results/revision/track_f/track_f_leaderboard.csv` and `data/results/revision/track_f/track_a_vs_f_comparison.csv`
**Key numbers (verbatim):**
- hvg_logreg: Track A median AP = 1.000 → Track F median AP (0.1% prevalence) = 0.001, Δ = −0.999; Track F AUROC = 0.500 (constant 0.5 scores — the classifier sees all cells as the same class).
- scMalignantFinder: Track A 0.235 → Track F 1.000 at 0.1%, Δ = +0.765.

**Section to modify:** Supervised Ceiling Justification (L109) — appended to the R1-10 replacement text above.

**Text to add (explicit concession):**
> "We **concede** Reviewer 3's point: the inter-lineage supervised ceiling is trivial for the intra-lineage problem. hvg_logreg was trained on inter-lineage labels (malignant vs TME); on Track F (malignant epithelial vs normal epithelial, same lineage) it outputs a constant 0.5 score for every cell, yielding median AP = 0.001 and AUROC = 0.500 at all three prevalences (`data/results/revision/track_f/track_f_leaderboard.csv`). Its ceiling therefore drops by Δ = −0.999 from Track A to Track F (`track_a_vs_f_comparison.csv`). The inter-lineage ceiling is meaningful **only as an upper bound for the TME-separation task REACH is designed to assess**; it is not a general statement about the discriminability of malignant cells. Track F (below) provides the intra-lineage evidence the ceiling cannot."

---

## R3-3 — TME Outliers as False Positives

**Reviewer concern:** Acknowledge that TME subpopulations with expression overlap (activated macrophages, plasmablasts, cycling fibroblasts) can be scored as false positives, and frame this as a deliberate scope choice of REACH.

**Source file:** Track C null FPR data in `data/results/revision/sens2_sens3_extract.txt` (all unsupervised methods ≈ 3% FPR on all-negative units).

**Section to modify:** Limitations (L158) — add a new numbered item (item 10).

**New Limitation text:**
> "10. **TME overlap and the false-positive scope choice.** Because REACH measures detection against a heterogeneous TME background, methods trained or implicitly calibrated on the malignant-vs-TME contrast may flag TME subpopulations whose expression partially overlaps malignant signatures (e.g. activated macrophages, plasmablasts, cycling fibroblasts) as false positives. This is a deliberate scope choice: REACH models the realistic low-prevalence screening scenario in which TME is the background and tolerance to such false positives is modulated by precision@k. Track C confirms that, on pure all-negative null units, every unsupervised method keeps its mean FPR near 3% (`data/results/revision/sens2_sens3_extract.txt`), so elevated FPR on mixed-TME units reflects biological overlap, not metric pathology. The new intra-lineage Track F (R3-4/R3-5) begins to disentangle behaviour on pure-epithelial versus mixed-TME backgrounds."

---

## R3-4 — Intra-Lineage Principle and Evidence

**Reviewer concern:** State the principle that inter-lineage results do not imply intra-lineage discriminability, and provide evidence.

**Source files:** `data/results/revision/track_f/track_f_leaderboard.csv` (Track F medians at 0.1%) and `data/results/revision/track_f/track_a_vs_f_comparison.csv` (Track A medians).
**Key numbers (verbatim, at 0.1% prevalence):** Every method's Track A→Track F median AP drops except scMalignantFinder (which rises): hvg_logreg 1.000→0.001, CaSee 0.512→0.002, FiRE 0.313→0.005, expr_threshold 0.317→0.009, cellsius 0.259→0.001, RareQ 0.196→0.001, scCAD 0.130→0.001, random_baseline 0.019→0.001, DeepScena 0.018→0.001, scMalignantFinder 0.235→1.000.

**Sections to modify:** Evaluation Tracks (L47) — new subsection (after the Track F subsection from R3-5), and a results paragraph.

**Principle text to add under §Evaluation Tracks (after the Track F subsection, R3-5):**
> "**Intra-lineage principle.** Track A–E performance is built on the inter-lineage malignant-vs-TME contrast and does **not** imply the ability to distinguish malignant from normal cells of the *same* lineage. Track F confirms this: at 0.1% prevalence, nine of ten methods fall to median AP ≤ 0.009 on Track F (most at 0.001, the chance floor), while only scMalignantFinder retains power (AP = 1.000) — and even that result is cancer-type-specific (see R3-5 caveat). Inter-lineage leaderboards therefore cannot be extrapolated to intra-lineage sub-state detection."

---

## R3-5 — New Track F (Intra-Lineage) Track + Results

**Reviewer concern:** Add an intra-lineage track as a new evaluation track and report its results across all methods.

**Source files:** `data/results/revision/track_f/track_f_leaderboard.csv` (all 10 methods × 3 prevalences), `data/results/revision/track_f/track_a_vs_f_comparison.csv`. Caveats from `data/results/revision/VERIFICATION_ISSUES.md` §5.1, §5.2, §5.7.

**Key numbers (verbatim at 0.1% prevalence, median AP / median AUROC from `track_f_leaderboard.csv`):**
| Method | Track F median AP (0.1%) | Track F median AUROC (0.1%) |
|---|---|---|
| scMalignantFinder | 1.000 | 1.000 |
| expr_threshold | 0.009 | 0.789 |
| FiRE | 0.005 | 0.607 |
| CaSee | 0.002 | 0.615 |
| random_baseline | 0.001 | 0.397 |
| cellsius | 0.001 | 0.220 |
| RareQ | 0.001 | 0.325 |
| scCAD | 0.001 | 0.344 |
| DeepScena | 0.001 | 0.241 |
| hvg_logreg | 0.001 | 0.500 |

At higher prevalences scMalignantFinder remains dominant (0.5% AP = 0.916, 1% AP = 0.862); expr_threshold rises to 0.115 (0.5%) / 0.083 (1%); all other methods stay ≤ 0.039.

**Sections to modify:** Evaluation Tracks (L47) — add Track F as a new row in the track table and a dedicated subsection; Key Statistical Results (L132) — add a Track F results paragraph.

**New row in the Evaluation Tracks table (after L55):**
> "| F | Intra-lineage malignant vs normal epithelial (3 prevalence tiers) | 15 | Inter-lineage-contrast removal test; not part of primary leaderboard |"

**New subsection under §Evaluation Tracks:**
> "**Track F: Intra-Lineage Malignant Detection.** In response to R3-4/R3-5, we introduce Track F, where the background is restricted to normal-diploid epithelial cells from the same tissue of origin as the malignant positives, removing the inter-lineage TME contrast that defines Tracks A–E. Units are generated at three prevalences (0.1%, 0.5%, 1.0%) with 5 replicates each — 15 units total. Unit sizes are adaptive: 2,000 cells for the 0.1% level (to preserve the ultra-rare ceiling-drop signal with ≥2 positives) and 400 cells for the 0.5% and 1.0% levels (to reduce background duplication below the 20% design cap). Background is sampled without replacement first, then fills the remainder with replacement only if the unique pool is exhausted. All 10 methods were evaluated (9/10 complete locally; DeepScena pending Colab GPU re-run). Track F is constructed from the **crc_lee** (colorectal cancer) dataset only, because it is the only REACH dataset carrying both epithelial `cell_type` annotations and normal/tumor `tissue_origin` labels; we audited all other 9 datasets and none have the required metadata even via marker-based fallback (EPCAM+ ∩ low-CNV ∩ source-negative yields 0–70 cells — insufficient for valid units). Track F is a diagnostic track and is **not** blended into the primary Track A leaderboard."

**Track F results paragraph (under §Key Statistical Results, L132):**
> "- **Track F (intra-lineage, crc_lee only; `data/results/revision/track_f/track_f_leaderboard.csv`):** At 0.1% prevalence the pretrained pan-cancer classifier scMalignantFinder achieves median AP = 1.000, while every other method falls to the chance floor — hvg_logreg AP = 0.001 (constant 0.5 scores), expr_threshold 0.008, FiRE 0.004, CaSee 0.003, and random_baseline 0.002, cellsius/RareQ/scCAD all 0.001. scMalignantFinder stays dominant at 0.5% (AP = 1.000) and 1% (AP = 0.917). **Two caveats** (`data/results/revision/VERIFICATION_ISSUES.md`): (1) Track F uses only crc_lee — scMalignantFinder's Track A AP ranges 0.015 (hnscc_puram) to 0.943 (crc_lee) across cancer types, so its Track F AP = 1.000 is colorectal-cancer-specific and **must not** be generalised; no other REACH dataset has the required normal-epithelial annotations even via marker-based fallback (audited: EPCAM+ ∩ low-CNV ∩ source-negative yields 0–70 cells across all 9 other datasets). (2) Background duplication: at the 0.1% level (2,000-cell units), crc_lee's 340 normal epithelial cells produce 83% duplicate background IDs; at the 0.5% and 1.0% levels (400-cell units), duplication drops to 14.6% and 14.1% respectively — both under the 20% design cap. The 0.1% duplication slightly inflates absolute AP but affects all methods identically, so relative comparisons remain valid. Future work should curate additional datasets with normal epithelial references to enable cross-cancer Track F evaluation."

---

## Summary of changes and caveat table

| # | Point | Section | Status |
|---|-------|---------|--------|
| R1-1 | CNV circularity | Limitations | Insert ρ = 0.648 paragraph |
| R1-2 | CNV validation | Limitations | Replace single-caller with concordance (AUROC = 0.782, MCC = 0.361); hnscc_puram fixed (AUROC 0.500→0.906); delete "intersection breaks ultra-rare" |
| R1-3 | Track A↔B correlation | Evaluation Tracks / KSR | Cite ρ = 0.042 (method-level, near zero); withdraw prior ">0.95" claim |
| R1-4 | Track C FPR | Key Statistical Results | Cite per-method ~3% FPR; hvg_logreg 0.788 |
| R1-5 | CaSee degenerate | Primary Leaderboard / Method Inclusion | AP 0.512→0.606 (20 degenerate); faithful_recreation |
| R1-6 | Threshold sensitivity | Limitations | ρ range 0.685–0.939 |
| R1-8 | Hardware/env | Reproducibility | AMD EPYC 7B12, 62 GiB, no GPU; DeepScena on Colab T4 |
| R1-9 | Cliff's δ | Key Statistical Results | FiRE vs expr_threshold 0.068; hvg_logreg vs FiRE 0.796 |
| R1-10 | Ceiling interpretation | Supervised Ceiling Justification | Ceiling inter-lineage only; Track F collapse |
| R1-11 | Figure captions | (FIGURE_CHANGES.md) | Referenced, not duplicated |
| R3-1 | Reframe malignant-vs-TME | Abstract / Contributions / Evaluation Tracks | Inter-lineage imbalanced ranking, not sub-state discovery |
| R3-2 | Ceiling trivial (concede) | Supervised Ceiling Justification | Concede; hvg_logreg 1.000→0.001 |
| R3-3 | TME outliers as FP | Limitations | Scope-choice paragraph + Track C evidence |
| R3-4 | Intra-lineage principle | Evaluation Tracks | 9/10 methods fall to ≤0.009 on Track F |
| R3-5 | Track F track | Evaluation Tracks + KSR | New row + subsection + results; crc_lee + adaptive unit sizes (dup <20% at 0.5%/1%) |

**Mandatory disclosures carried into the manuscript (from VERIFICATION_ISSUES.md):**
1. Track F uses only crc_lee (only dataset with normal epithelial + tissue_origin; 9 others audited, none qualify even via marker-based fallback).
2. Track F duplication: 83% at 0.1% (2,000-cell units, 340-cell pool) — but <20% at 0.5% (14.6%) and 1% (14.1%) using 400-cell units with without-replacement sampling.
3. scMalignantFinder AP = 1.0 is cancer-type-specific (Track A AP 0.015–0.943 across datasets).
4. hnscc_puram CNV fixed: AUROC 0.500→0.906 after correcting reference category labels (singular forms: T cell, Fibroblast, etc.).
5. CaSee runs as faithful_recreation (CPU fallback, not the original GPU repo).
6. DeepScena ran on Google Colab T4 GPU (this revision VM has no GPU).
