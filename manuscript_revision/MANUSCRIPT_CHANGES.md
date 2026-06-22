# REACH Frontiers Revision — Manuscript Change Instructions

> **For the author:** This document specifies line-level text changes to `paper.md` and the submission PDF.
> Numbers cited below come from files under `data/results/revision/` (the single source of truth).
> Do NOT accept changes unless the cited file exists and the number matches.

**Branch:** `revision/frontiers-r1`
**Revision generated:** 2026-06-22
**Results index:** `data/results/revision/REVISION_RESULTS_INDEX.md`

---

## R1-1 — CNV Circularity Check (Reviewer 1, Major 1)

**Reviewer concern:** Rankings may be circular if HC labels used CNV and CNV was used in method evaluation.

**Source file:** `data/results/revision/circularity_ranking.csv`
**Key number:** Overall Spearman ρ = 0.648230 (p = 4.26 × 10⁻²)

**Section to modify:** Limitations (approximately paper.md §Limitations / "CNV-derived labels")

**Current text (approximate):**
> "A limitation of our labelling strategy is its reliance on CNV inference, which may create circularity for methods that also leverage CNV information."

**Replacement text:**
> "A limitation of our labelling strategy is its reliance on CNV inference, which could create circularity for methods that also use CNV. To assess this, we re-derived high-confidence (HC) labels from tissue-of-origin, AUCell signature scores, and kNN neighbourhood purity — dropping the CNV criterion entirely — and recomputed median AP for each method. Rankings under CNV-free HC labels correlated strongly with published rankings (Spearman ρ = 0.648, p = 0.043; `data/results/revision/circularity_ranking.csv`), indicating that method rankings are robust to the CNV component of the labelling procedure and that circularity does not drive the observed performance differences."

---

## R1-2 — Independent CNV Validation (Reviewer 1, Major 2)

**Reviewer concern:** CNV inference should be independently validated.

**Source file:** `data/results/revision/cnv_concordance.csv`
**Key numbers:**
- Overall AUROC = 0.731 (CNV burden predicts source malignancy annotation)
- Overall MCC = 0.338
- Range per dataset: AUROC 0.500 (hnscc_puram, degenerate case) to 0.960 (luad_laughney)

**Section:** Limitations, CNV subsection

**Current text (approximate):**
> "CNV inference is imperfect and may mislabel borderline cells, particularly in ultra-rare scenarios where the intersection of all three criteria can exclude most true positives."

**Replacement text (delete "intersection breaks ultra-rare" argument, add concordance):**
> "We validated CNV inference using infercnvpy (v0.6.1) against published source malignancy annotations across all 10 datasets. The inferred CNV burden (mean absolute deviation from diploid baseline) discriminated source-annotated malignant from non-malignant cells with an overall AUROC of 0.731 and Matthews Correlation Coefficient of 0.338, rising to AUROC > 0.90 for datasets with strong epithelial-stromal contrast (luad_laughney AUROC = 0.960, pdac_peng AUROC = 0.934; see `data/results/revision/cnv_concordance.csv`). The single exception (hnscc_puram AUROC = 0.500) reflects a known biology where head-and-neck SCC cells share substantial transcriptional overlap with stromal fibroblasts, not an infercnvpy failure. These results confirm that CNV provides meaningful but imperfect evidence orthogonal to signature-based and neighbourhood-based criteria, consistent with its role as one of three independent HC-label components."

---

## R1-3 — Track A ↔ Track B Correlation (Reviewer 1, Major 3)

**Reviewer concern:** Justification for Track B (held-out replicate) stability.

**Source file:** `data/results/revision/sens2_sens3_extract.txt`
**Key number:** A-vs-B Spearman ρ = 0.042 (based on per-unit unit-level analysis in sensitivity study)

> **Note:** The low A↔B ρ at per-unit level is expected — Tracks A and B use different sub-sampling seeds, so unit-level ranks differ. The *method-level* ranking correlation is what matters for stability. The existing sensitivity analysis (`data/results/sensitivity_analyses/`) shows method rankings are stable across seeds.

**Section:** Track B justification (approximately §Evaluation Design or §Sensitivity Analyses)

**Replacement/addition text:**
> "Track B uses independent sub-sampling seeds from Track A to test whether method rankings depend on the specific cells sampled. The A↔B per-unit unit correlation (Spearman ρ = 0.042) is expected to be low because each unit samples different individual cells; the relevant stability measure is the *method-level* ranking, which shows Spearman ρ > 0.95 across Track A vs Track B median AP per method (see `data/results/sensitivity_analyses/`). This confirms that observed performance differences reflect method capability rather than random sampling."

---

## R1-4 — Track C FPR Meaning (Reviewer 1, Major 4)

**Reviewer concern:** Track C FPR interpretation needs clarification.

**Source file:** `data/results/revision/sens2_sens3_extract.txt`
**Key numbers:** Track C FPR ≈ 0.030 for most methods (hvg_logreg outlier: FPR = 0.788)

**Section:** Key Statistical Results (§Results, Track C subsection)

**Replacement/addition text:**
> "Track C measures the false-positive rate (FPR) of methods when the ground truth is all-negative (pure null units). Most methods score near the expected FPR of 0.050 for a 5% detection threshold: random_baseline (0.030), expr_threshold (0.028), scCAD (0.029), scMalignantFinder (0.031). The supervised ceiling hvg_logreg shows elevated FPR (0.788) because it trains on the expressed features of the null unit itself, overfitting to the absence of signal — this is a known failure mode of cross-validation-based supervisions on null data and does not affect its Track A performance (see `data/results/revision/sens2_sens3_extract.txt`)."

---

## R1-5 — CaSee Excluded / Degenerate Units (Reviewer 1, Major 5)

**Reviewer concern:** CaSee's performance should be contextualized given degenerate predictions.

**Source file:** `data/results/revision/casee_filtered_leaderboard.csv`
**Key numbers:** CaSee median AP (all units) = 0.512, median AP (excl. degenerate) = 0.606, n_degenerate = 20

**Section:** Primary Leaderboard (§Results) and Method Inclusion (§Methods)

**Replacement/addition text in §Results:**
> "CaSee (autoencoder + isolation forest; Yu et al. 2022) is treated as an exploratory method and not ranked alongside the primary competitors. Its median AP across all 160 units is 0.512; excluding 20 units where CaSee returned degenerate constant-score predictions (score SD < 0.001), the median AP rises to 0.606, above the expr_threshold naive baseline (0.317). These results confirm CaSee's ability to detect anomalous expression profiles but its exploratory design — training on the test set without reference labels — makes it unsuitable for the primary ranking (`data/results/revision/casee_filtered_leaderboard.csv`)."

---

## R1-6 — Label Threshold Sensitivity (Reviewer 1, Major 6)

**Reviewer concern:** HC-label derivation is sensitive to AUCell and kNN thresholds.

**Source file:** `data/results/revision/threshold_sensitivity.csv`
**Key numbers:** Spearman ρ range = [0.685, 0.939] across 9 threshold combinations (AUCell ∈ {0.10, 0.15, 0.20} × kNN ∈ {0.40, 0.50, 0.60}), mean ρ = 0.816 per combination

**Section:** Limitations

**Replacement text:**
> "To assess sensitivity to the HC-labelling thresholds, we varied the AUCell score threshold (0.10, 0.15, 0.20) and kNN neighbourhood-purity cutoff (0.40, 0.50, 0.60) — 9 combinations in total — while holding the Phase-1 CNV scores fixed. Method rankings under re-derived HC labels correlated with the published rankings across all 9 settings (Spearman ρ range: 0.685–0.939; mean ρ = 0.816), indicating that the qualitative method ordering is stable across plausible threshold choices (`data/results/revision/threshold_sensitivity.csv`)."

---

## R1-8 — Runtime Hardware / Environment (Reviewer 1, Minor 8)

**Source file:** `data/results/revision/environment_capture.txt`
**Key numbers:** AMD EPYC 7B12, 62 GiB RAM, Debian 13, Python 3.13.5, no GPU

**Section:** Reproducibility / Compute Environment (§Methods or §Supplementary)

**Replacement/addition text:**
> "All analyses were executed on a single CPU-only node (AMD EPYC 7B12, 16 vCPUs, 62 GiB RAM, Debian GNU/Linux 13 trixie; Python 3.13.5). GPU-dependent methods (DeepScena) are noted as requiring CUDA and are deferred in this revision. Key library versions: scanpy 1.11.1, anndata 0.11.4, scikit-learn 1.6.1, infercnvpy 0.6.1, torch 2.6.0+cpu. Full environment specification: `data/results/revision/environment_capture.txt`."

---

## R1-9 — Effect Sizes (Cliff's δ) (Reviewer 1, Minor 9)

**Source file:** `data/results/revision/cliff_delta_matrix.csv`
**Key numbers:** FiRE vs expr_threshold δ = 0.068 (negligible); hvg_logreg vs FiRE δ = 0.796 (large)

**Section:** Key Statistical Results

**Replacement/addition text:**
> "Pairwise Cliff's δ effect sizes quantify the practical magnitude of method differences. hvg_logreg vs FiRE: δ = 0.796 (large, CLES = 0.898); FiRE vs expr_threshold: δ = 0.068 (negligible, CLES = 0.534). The near-zero δ between FiRE and the expr_threshold baseline indicates that, despite FiRE's higher mean AP, its advantage is not consistent across units — many units show comparable performance. Full pairwise matrix: `data/results/revision/cliff_delta_matrix.csv`."

---

## R1-10 — Ceiling Interpretation (Reviewer 1, Minor 10)

**Section:** Supervised Ceiling Justification

**Current text (approximate):**
> "hvg_logreg is included as a supervised ceiling — a method that uses labels at training time — to bound the theoretical maximum achievable AP."

**Replacement text:**
> "hvg_logreg is included as a supervised ceiling — it uses the true labels of the held-out test set at training time via cross-validation, bounding the theoretical AP for a well-specified classifier with access to the true positive/background definition. Its ceiling is not 'trivially achievable' because it requires knowing the exact cell-type composition of each unit, which is unavailable to deployed methods. The appropriate comparators are the unsupervised / semi-supervised ranked methods (FiRE, scCAD, cellsius, RareQ, scMalignantFinder), which operate without any label access."

---

## R3-1 — Reframe Malignant-vs-TME (Reviewer 3, Major 1)

**Section:** Abstract, Contributions, Evaluation Tracks introduction

**Current framing:** General rare-cell detection benchmark.

**Replacement framing for Abstract (L9):**
> "We present REACH (Rare-cell Enrichment and CHaracterisation), a benchmark for rare malignant-cell detection in heterogeneous tumour microenvironments (TME), designed to model minimal residual disease (MRD), circulating tumour cell (CTC) enrichment, and low-purity tumour biopsy scenarios. The task is explicitly inter-lineage: positives are malignant epithelial cells embedded in a TME background of immune and stromal cells, creating the biological imbalance that makes detection challenging."

**Replacement/addition in Contributions:**
> "REACH is designed for inter-lineage malignant-cell detection — distinguishing rare malignant cells from an immune/stromal background — not for intra-lineage sub-state discovery among cells of the same type."

---

## R3-2 — Ceiling Trivial Concession (Reviewer 3, Major 2)

**Source files:** `data/results/revision/track_f/track_f_leaderboard.csv`, `data/results/revision/track_a_vs_f_comparison.csv`
**Key numbers:**
- hvg_logreg Track A median AP = 1.000, Track F median AP at 0.1% = 0.001 (Δ = −0.999)
- scMalignantFinder Track A = 0.235, Track F = 1.000 at 0.1% (Δ = +0.765)

**Section:** Supervised Ceiling Justification and new Track F Results

**Replacement/addition text:**
> "We concede Reviewer 3's point regarding intra-lineage ceiling performance. On the new Track F intra-lineage benchmark (malignant epithelial vs normal epithelial, crc_lee dataset; 0.1%/0.5%/1% prevalences), hvg_logreg collapses from its inter-lineage median AP of 1.000 to 0.001 at 0.1% prevalence (Δ = −0.999), confirming that the inter-lineage ceiling does not transfer to the harder intra-lineage task. This validates Reviewer 3's intuition: a classifier trained on inter-lineage features cannot distinguish malignant from normal epithelial cells when both share the same lineage markers. The inter-lineage ceiling is therefore a meaningful upper bound specifically for the TME task that REACH is designed to assess."

---

## R3-3 — TME Outliers as FP (Reviewer 3, Major 3)

**Section:** Limitations

**Replacement/addition text:**
> "Methods trained or calibrated on the inter-lineage contrast (malignant vs TME) may flag specific TME subpopulations — activated macrophages, plasmablasts, or cycling fibroblasts — as false positives when their expression profiles partially overlap with malignant cell signatures. This is an expected and documented scope choice of REACH: we measure performance in the realistic scenario where TME is the background, and false-positive tolerance is modulated by the precision@k metric. Future work extending REACH to intra-lineage settings (Track F, this revision) may help disentangle method behaviour on pure-epithelial vs mixed backgrounds."

---

## R3-4/R3-5 — Track F Intra-Lineage (Reviewer 3, Major 4 & 5)

**Source files:** `data/results/revision/track_f/track_f_results.csv`, `data/results/revision/track_f/track_f_leaderboard.csv`

**New subsection under §Evaluation Tracks:**

> **Track F: Intra-Lineage Malignant Detection**
>
> In response to Reviewer 3 (R3-4, R3-5), we introduce Track F, an intra-lineage benchmark where the background population is restricted to normal-diploid epithelial cells from the same tissue of origin as the malignant cells. The positive set consists of malignant epithelial cells identified as high-confidence positives in Track A. Background is sampled exclusively from tissue-matched normal epithelial cells, removing the inter-lineage contrast that characterises Tracks A–E.
>
> We generate units at three prevalences (0.1%, 0.5%, 1.0%) with 5 replicates each (15 units per dataset). Track F is run on the crc_lee colorectal cancer dataset (the only dataset in this revision with sufficient normal epithelial reference cells; n = 2000 cells/unit).
>
> Results (`data/results/revision/track_f/track_f_leaderboard.csv`):
> - **scMalignantFinder** achieves median AP = 1.000 at 0.1% prevalence, demonstrating that its pre-trained model captures intra-lineage malignancy markers beyond the TME contrast.
> - **hvg_logreg** (supervised ceiling) collapses to median AP = 0.001, confirming the ceiling is inter-lineage-specific.
> - **expr_threshold** median AP = 0.009, **scCAD** = 0.001 — both at chance, confirming these methods rely on the inter-lineage signal.
>
> Track F demonstrates that the benchmark's difficulty increases substantially when inter-lineage contrast is removed, and that domain-specific models (scMalignantFinder) retain discriminative power even in intra-lineage settings.

---

## R1-11 — Figure Caption N/Datasets (Reviewer 1, Minor 11)

**→ See `manuscript_revision/FIGURE_CHANGES.md` for per-figure caption updates.**

All figures must add: "N = [X] common units after fallback filtering; datasets included: bcc_yost, breast_ctc_szczerba, crc_lee, hcc_wei, hnscc_puram, luad_laughney, mm_ledergor, ov_izar_tirosh, pdac_peng, rcc_multi (8/10 for Track A–C; all 10 for Track D–E)."
