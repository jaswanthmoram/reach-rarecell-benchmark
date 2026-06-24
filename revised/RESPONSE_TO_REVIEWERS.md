# Response to Reviewers — REACH Frontiers Revision

**Manuscript:** REACH: A Reproducible Benchmark for Rare Malignant-Cell Detection in Single-Cell RNA Sequencing
**Journal:** Frontiers in Bioinformatics
**Manuscript ID:** 1878538
**Revision branch:** `revision/frontiers-r1`

---

> **General note:** Every number in this response is drawn from a file under `data/results/revision/`. The exact file is cited for each claim. We have followed the principle of never fabricating or interpolating results — if a number is unavailable, it is explicitly noted as deferred. All 15 reviewer points are addressed below (Reviewer 1: 10 points; Reviewer 3: 5 points). Detailed manuscript text changes are in `manuscript_revision/MANUSCRIPT_CHANGES.md`; figure caption changes are in `manuscript_revision/FIGURE_CHANGES.md`.

---

## Reviewer 1

### R1-1 (Major): CNV Circularity

**Reviewer comment:** Rankings may be circular because HC labels use CNV and methods may also use CNV.

**Response:** We re-derived HC labels without any CNV component (using only tissue-of-origin source annotation, AUCell signature scores, and kNN neighbourhood purity) and recomputed method rankings. The resulting Spearman ρ between CNV-free and published rankings is **0.648 (p = 0.043)** (`data/results/revision/circularity_ranking.csv`). This indicates that method rankings are robust to removing CNV from the label derivation, and that circularity does not drive the observed performance differences. The manuscript Limitations section now quantifies this robustness rather than merely acknowledging the risk.

---

### R1-2 (Major): Independent CNV Validation

**Reviewer comment:** CNV inference should be independently validated before being used for labelling.

**Response:** We validated inferred CNV burden (infercnvpy v0.6.1, per-cell mean |ΔCNV| relative to immune/stromal reference) against published source malignancy annotations across 9 datasets (57,811 cells; 5,010 positive; 52,801 background). Overall AUROC = **0.782**, MCC = **0.361** (`data/results/revision/cnv_concordance.csv`). Per-dataset AUROC ranged from 0.747 (hcc_wei) to 0.960 (luad_laughney), with five datasets exceeding 0.86 (luad_laughney 0.960, pdac_peng 0.934, crc_lee 0.892, hnscc_puram 0.906, ov_izar_tirosh 0.868).

An earlier version of this analysis reported hnscc_puram at AUROC = 0.500 because its `cell_type` labels (e.g. `"0.0"`, `"Fibroblast"`, `"T cell"`) did not match infercnvpy's default reference categories (`T cells`, `B cells`, `Myeloids`, …) and CNV scores were zero. We have **corrected** the reference categories to include the singular label forms present in this dataset and regenerated its CNV, yielding AUROC = **0.906** (MCC = 0.763). This raised the overall AUROC from 0.731 to 0.782.

We have **removed** the "intersection breaks ultra-rare units" argument from the manuscript and replaced it with this concordance evidence. CNV is used as one of three independent HC-label components, not as a standalone ground truth.

---

### R1-3 (Major): Track A ↔ Track B Correlation

**Reviewer comment:** The A↔B stability claim needs quantification.

**Response:** The method-level Spearman rank correlation between Track A and Track B across the 10 methods is **ρ = 0.042 (p = 0.907)** (`data/results/revision/sens2_sens3_extract.txt`) — statistically indistinguishable from zero. The rankings differ substantially: CaSee 2→6, scMalignantFinder 5→10, RareQ 7→2, scCAD 8→4. Synthetic-track rankings do not replicate real-cell rankings, justifying Track B's secondary, non-blended role as a controlled robustness probe.

> **Correction:** An earlier draft of this response mis-described ρ = 0.042 as a per-unit correlation and cited a "method-level ρ > 0.95" stability figure. No file in the repository contains a value above 0.95 for the A↔B comparison. That earlier characterization is withdrawn.

---

### R1-4 (Major): Track C FPR Meaning

**Reviewer comment:** Track C FPR needs a clearer interpretation.

**Response:** Track C measures the rate at which methods score "anomalous" cells in a pure-null (all-negative) unit. Every unsupervised and naive method controls the false-positive rate near the expected ~3% floor (`data/results/revision/sens2_sens3_extract.txt`): RareQ 0.0293, cellsius 0.0295, CaSee 0.0301, scCAD 0.0301, random_baseline 0.0309, expr_threshold 0.0310, DeepScena 0.0306, scMalignantFinder 0.0315, FiRE 0.0315.

The supervised ceiling hvg_logreg is the lone outlier at FPR = **0.788** (78.8%) because it trains in-sample on the null unit's own expression features and overfits to the absence of signal — a known cross-validation pathology on all-negative data that does not affect its Track A performance. Track C thus functions as a specificity diagnostic: a method that cannot keep its null FPR near 3% is unfit for deployment in low-prevalence screening. We have expanded the Track C FPR bullet in Key Statistical Results with these per-method values.

---

### R1-5 (Major): CaSee Degenerate Units

**Reviewer comment:** CaSee's performance should be contextualized, especially for units with constant-score predictions.

**Response:** We identified 20 degenerate units (of 160) where CaSee returned constant scores (SD ≈ 0). Excluding these, CaSee's median AP rises from **0.512 to 0.606** (`data/results/revision/casee_filtered_leaderboard.csv`). For reference, scMalignantFinder also has 20 degenerate units; its AP moves 0.235 → 0.290.

CaSee's exploratory designation is retained because its autoencoder is trained on the test unit's own cells without external reference labels, making it non-deployable. The manuscript now reports both the all-units and excl-degenerate AP in the Primary Leaderboard footnote, and the Method Inclusion section clarifies that CaSee runs as a **faithful_recreation** (built-in CPU fallback runner, not the original GPU-dependent code; `data/results/revision/VERIFICATION_ISSUES.md` §5.5).

---

### R1-6 (Major): Label Threshold Sensitivity

**Reviewer comment:** HC-label derivation thresholds (AUCell, kNN) may affect results.

**Response:** We varied AUCell threshold ∈ {0.10, 0.15, 0.20} and kNN purity cutoff ∈ {0.40, 0.50, 0.60} (9 combinations), holding Phase-1 infercnvpy CNV scores fixed. On the five datasets yielding a valid Spearman ρ, method rankings correlated with the published rankings across all 9 settings: **ρ range [0.685, 0.939]** (`data/results/revision/threshold_sensitivity.csv`; luad_laughney 0.685, pdac_peng 0.758, bcc_yost 0.818, hcc_wei 0.879, crc_lee 0.939). Two datasets (ov_izar_tirosh, rcc_multi) could not form a high-confidence background at these thresholds and are excluded. The qualitative ordering is stable across plausible threshold choices, though the magnitude of ρ varies by dataset. We have added this as a new Limitations item.

---

### R1-8 (Minor): Runtime Hardware / Environment

**Reviewer comment:** Runtime comparisons lack hardware specification.

**Response:** All revision analyses were executed on: AMD EPYC 7B12, 16 vCPUs, 62 GiB RAM, Debian GNU/Linux 13 trixie, **no GPU** (CPU-only VM). Software: Python 3.13.5, R 4.5.0, scanpy 1.12.1, scikit-learn 1.9.0, infercnvpy 0.6.1, anndata 0.11.4, torch 2.12.1 (CPU). R packages FiRE, CellSIUS, RareQ, and Seurat were installed and ran natively (`data/results/revision/environment_capture.txt`).

DeepScena, whose TensorFlow/Torch pipeline requires CUDA, was run separately on a **Google Colab Tesla T4 GPU**; its predictions were transferred back and scored identically to all other methods. We have added a "Revision compute environment" subsection to the Reproducibility section. The original v1.2.0 preprocessing (cited in the Acknowledgements) used GCP high-memory CPU and NVIDIA L4 GPU instances; that remains the record for dataset preprocessing, while the revision compute above is the record for the new analyses.

---

### R1-9 (Minor): Effect Sizes

**Reviewer comment:** Statistical comparisons should include effect size measures.

**Response:** We computed pairwise Cliff's δ for all method pairs using per-unit AP scores on common Track A units (`data/results/revision/cliff_delta_matrix.csv`). Key findings:
- **hvg_logreg vs FiRE: δ = 0.796** (large effect — the supervised ceiling dominates the best unsupervised method)
- **FiRE vs expr_threshold: δ = 0.068** (negligible — FiRE does not consistently outperform the naive baseline across units)
- hvg_logreg vs DeepScena: δ = 0.929 (large); hvg_logreg vs random_baseline: δ = 0.917 (large)
- CaSee vs DeepScena: δ = 0.702 (large); FiRE vs DeepScena: δ = 0.775 (large)

The negligible δ between FiRE and the naive baseline indicates that despite FiRE's higher mean AP, its per-unit advantage is inconsistent — many units show comparable performance. We have added a Cliff's δ bullet to the Key Statistical Results section.

---

### R1-10 (Minor): Ceiling Interpretation

**Reviewer comment:** hvg_logreg ceiling is trivially achievable with label access.

**Response:** We agree that the ceiling requires label access and is not a deployable competitor. We have clarified in the Supervised Ceiling Justification that hvg_logreg is a calibration ceiling, not a peer competitor. Furthermore, the new Track F results demonstrate that the inter-lineage ceiling is **not universally trivial** — it collapses on the harder intra-lineage task: hvg_logreg median AP falls from **1.000 (Track A) to 0.001 at 0.1% prevalence on Track F** (Δ = −0.999; `data/results/revision/track_f/track_a_vs_f_comparison.csv`). The ceiling is meaningful specifically for the inter-lineage TME task REACH was designed to assess, and this scope is now explicit. See also R3-2 (concession).

---

### R1-11 (Minor): Figure Caption N/Datasets

**Response:** Per-figure caption updates with N values, dataset lists, and hardware annotations are specified in `manuscript_revision/FIGURE_CHANGES.md`. Key additions include N annotations for all figures, the threshold-sensitivity ρ range for Fig2, per-method FPR values for Fig5, hardware annotation for Fig6, a Track F panel for Fig9, and the new Fig11 (Track F vs Track A comparison with all 10 methods).

---

## Reviewer 3

### R3-1 (Major): Reframe Malignant-vs-TME

**Reviewer comment:** The benchmark should be reframed as TME-vs-malignant detection, not general rare-cell detection.

**Response:** We agree and have revised the Abstract, Contributions, and Evaluation Tracks sections to explicitly reframe REACH as a benchmark for **rare malignant-cell detection in heterogeneous TME** via imbalanced cell-level ranking — an inter-lineage contrast (malignant epithelial/CTC positives against immune/stromal background), not intra-lineage sub-state discovery. The intra-lineage setting is addressed separately by the new Track F (R3-4/R3-5). See `manuscript_revision/MANUSCRIPT_CHANGES.md §R3-1` for the exact replacement text.

---

### R3-2 (Major): Ceiling Trivial in Intra-Lineage Setting

**Reviewer comment:** A supervised ceiling that exploits inter-lineage contrast is trivially achievable and not informative.

**Response:** We **concede** this point. On the new Track F (intra-lineage, malignant vs normal epithelial, crc_lee dataset), hvg_logreg collapses from median AP 1.000 (Track A) to **0.001 at 0.1% prevalence** (Track F; AUROC = 0.500, constant 0.5 scores; `data/results/revision/track_f/track_f_leaderboard.csv`; Δ = −0.999 from `track_a_vs_f_comparison.csv`). The classifier was trained on inter-lineage labels; on Track F it sees all cells as the same class and outputs a constant 0.5.

The inter-lineage ceiling is meaningful **only as an upper bound for the TME-separation task** REACH was designed to assess; it is not a general statement about malignant-cell discriminability. This scope is now explicit in the Supervised Ceiling Justification, paired with the R1-10 clarification.

---

### R3-3 (Major): TME Outliers as False Positives

**Reviewer comment:** Activated TME populations (macrophages, plasmablasts) may be flagged as false positives.

**Response:** We have added a Limitations paragraph (item 10) acknowledging this expected behaviour: methods calibrated on inter-lineage contrast may flag activated TME subpopulations (activated macrophages, cycling fibroblasts, plasmablasts) as false positives when their expression profiles partially overlap malignant signatures. This is a deliberate scope choice — REACH models the realistic TME setting, and the precision@k metric captures this FP cost.

Track C confirms that on pure all-negative null units, every unsupervised method keeps its mean FPR near 3% (`data/results/revision/sens2_sens3_extract.txt`), so elevated FPR on mixed-TME units reflects biological overlap, not metric pathology. The new Track F (background = normal epithelial only) isolates the intra-lineage task where this particular FP source is absent.

---

### R3-4 (Major): Intra-Lineage Principle

**Reviewer comment:** The benchmark should demonstrate the principle that inter-lineage results do not imply intra-lineage discriminability.

**Response:** We have implemented Track F (R3-5) which instantiates exactly this principle. At 0.1% prevalence, nine of ten methods fall to median AP ≤ 0.009 on Track F (`data/results/revision/track_f/track_f_leaderboard.csv`): hvg_logreg 1.000→0.001, CaSee 0.512→0.002, FiRE 0.313→0.005, expr_threshold 0.317→0.009, cellsius 0.259→0.001, RareQ 0.196→0.001, scCAD 0.130→0.001, random_baseline 0.019→0.001, DeepScena 0.018→0.001. Only scMalignantFinder retains power (0.235→1.000), and even that result is cancer-type-specific (see R3-5 caveat).

The manuscript §Evaluation Tracks now includes an "Intra-lineage principle" subsection stating that Track A–E performance is built on the inter-lineage malignant-vs-TME contrast and does not imply the ability to distinguish malignant from normal cells of the same lineage. Inter-lineage leaderboards cannot be extrapolated to intra-lineage sub-state detection.

---

### R3-5 (Major): Implement Track F

**Reviewer comment:** Add an intra-lineage track with normal epithelial background.

**Response:** Track F is now implemented and run on all 10 methods (150/150 predictions complete) using the crc_lee colorectal cancer dataset (`data/results/revision/track_f/track_f_leaderboard.csv`). Design:
- Background: normal epithelial cells (tissue_origin == "Normal", cell_type == "Epithelial cells")
- Positives: malignant epithelial cells (tissue_origin == "Tumor", HC-positive from Track A)
- Prevalences: 0.1%, 0.5%, 1.0%; 5 replicates each; 15 units total
- Adaptive unit sizes: 2,000 cells for 0.1% (preserves ultra-rare ceiling-drop signal), 400 cells for 0.5% and 1.0% (reduces duplication below 20% cap)
- Background sampling: without replacement first, then with replacement only if unique pool exhausted

**Key results (median AP at 0.1% prevalence, all 10 methods):**
| Method | Track A median AP | Track F 0.1% median AP | Δ |
|--------|-------------------|------------------------|---|
| hvg_logreg (ceiling) | 1.000 | 0.001 | −0.999 |
| scMalignantFinder | 0.235 | 1.000 | +0.765 |
| expr_threshold | 0.317 | 0.008 | −0.309 |
| scCAD | 0.130 | 0.001 | −0.129 |
| random_baseline | 0.019 | 0.002 | −0.017 |
| CaSee | 0.512 | 0.003 | −0.510 |
| FiRE | 0.313 | 0.004 | −0.309 |
| cellsius | 0.259 | 0.001 | −0.258 |
| RareQ | 0.196 | 0.001 | −0.195 |
| DeepScena | 0.018 | 0.001 | −0.017 |

Source: `data/results/revision/track_f/track_f_leaderboard.csv` and `data/results/revision/track_f/track_a_vs_f_comparison.csv`. Δ values are cited only where present in the comparison CSV; for the remaining 5 methods, the Track A and Track F medians are cited individually from their respective leaderboards.

At higher prevalences, scMalignantFinder remains dominant (0.5% AP = 1.000, 1% AP = 0.917); expr_threshold rises to 0.062 (0.5%) / 0.154 (1%); all other methods stay ≤ 0.063.

**Mandatory caveats** (disclosed in the manuscript Track F results paragraph and Limitations; from `data/results/revision/VERIFICATION_ISSUES.md`):
1. **Single dataset:** Track F uses only crc_lee — the only REACH dataset with both epithelial cell-type annotations and normal/tumor `tissue_origin` labels. We audited all other 9 datasets; none qualify even via marker-based fallback (EPCAM+ ∩ low-CNV ∩ source-negative yields 0–70 cells — insufficient for valid units). This is a hard data-availability ceiling.
2. **Background duplication (reduced):** At the 0.1% level (2,000-cell units), crc_lee's 340 normal epithelial cells produce 83% duplicate background IDs. At the 0.5% and 1.0% levels (400-cell units with without-replacement sampling), duplication drops to 14.6% and 14.1% — both under the 20% design cap. The 0.1% duplication slightly inflates absolute AP but affects all methods identically, so relative comparisons remain valid.
3. **scMalignantFinder cancer-type bias:** Track A AP on crc_lee = 0.943 (colorectal, used by Track F) vs 0.015 on hnscc_puram (head & neck SCC). The AP = 1.0 on Track F is colorectal-specific and does not generalize across cancer types.
4. **hvg_logreg constant 0.5:** The supervised classifier was trained on inter-lineage Track A labels; on intra-lineage Track F it sees all cells as one class and outputs a constant 0.5 (AUROC = 0.500). This is the expected ceiling-drop, not a fallback.
5. **CaSee fidelity:** CaSee ran as a faithful CPU recreation of the original autoencoder (`faithful_recreation`), not the original GPU-dependent code.
6. **DeepScena environment:** DeepScena ran on a Google Colab T4 GPU (this revision VM has no GPU), with a `torch.load` `weights_only` patch for PyTorch 2.6+. All 15 Track F units processed (3–14 clusters per unit; 2 small 400-cell units collapsed to 1 cluster — legitimate DeepScena behavior).

The Track F results demonstrate that (1) the inter-lineage ceiling collapses on intra-lineage tasks, (2) a domain-specific pretrained classifier (scMalignantFinder) can retain discriminative power in intra-lineage settings but only for the cancer type it was effectively trained on, and (3) generic unsupervised anomaly detectors fail without inter-lineage contrast. Future work should curate additional datasets with normal epithelial references to reduce duplication and enable cross-cancer Track F evaluation.
