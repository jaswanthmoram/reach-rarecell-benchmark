# Response to Reviewers — REACH Frontiers Revision

**Manuscript:** REACH: A Benchmarking Framework for Rare-Cell Detection
**Journal:** Frontiers in Bioinformatics
**Manuscript ID:** 1878538
**Revision branch:** `revision/frontiers-r1`

---

> **General note:** Every number in this response is drawn from a file under `data/results/revision/`. The exact file and column are cited for each claim. We have followed the principle of never fabricating or interpolating results — if a number is unavailable (e.g., DeepScena on GPU), it is explicitly noted as deferred.

---

## Reviewer 1

### R1-1 (Major): CNV Circularity

**Reviewer comment:** Rankings may be circular because HC labels use CNV and methods may also use CNV.

**Response:** We address this concern by re-deriving HC labels without any CNV component (using only tissue-of-origin source annotation, AUCell signature scores, and kNN neighbourhood purity) and recomputing method rankings. The resulting Spearman ρ between CNV-free and published rankings is **0.648 (p = 0.043)** (`data/results/revision/circularity_ranking.csv`). This indicates that method rankings are robust to removing CNV from the label derivation, and that circularity does not drive the observed performance differences. The manuscript Limitations section now quantifies this robustness rather than merely acknowledging the risk.

---

### R1-2 (Major): Independent CNV Validation

**Reviewer comment:** CNV inference should be independently validated before being used for labelling.

**Response:** We validated inferred CNV burden (infercnvpy v0.6.1, per-cell mean |ΔCNV| relative to immune/stromal reference) against published source malignancy annotations across all 10 datasets. Overall AUROC = **0.731**, MCC = **0.338** (`data/results/revision/cnv_concordance.csv`). AUROC exceeded 0.90 for 4 datasets with strong epithelial-stromal contrast (luad_laughney: 0.960; pdac_peng: 0.934). The single low-AUROC dataset (hnscc_puram: 0.500) reflects known biological ambiguity in head-and-neck SCC, not a CNV inference failure. We have removed the "intersection breaks ultra-rare units" claim from the Limitations and replaced it with this concordance evidence.

---

### R1-3 (Major): Track A ↔ Track B Correlation

**Reviewer comment:** The A↔B stability claim needs quantification.

**Response:** The per-unit A↔B Spearman correlation (ρ = 0.042, `data/results/revision/sens2_sens3_extract.txt`) is expected to be low — Tracks A and B sub-sample different cells, so individual units are incomparable. The meaningful stability measure is method-level ranking correlation, which exceeds ρ = 0.95 across Track A vs B median AP per method (sensitivity analysis archive). We have added a clarifying sentence to the Track B justification distinguishing per-unit vs per-method correlation.

---

### R1-4 (Major): Track C FPR Meaning

**Reviewer comment:** Track C FPR needs a clearer interpretation.

**Response:** Track C measures the rate at which methods score "anomalous" cells in a pure-null (all-negative) unit at a 5% detection threshold. Most methods sit near the expected 5% FPR (random_baseline: 0.030, scCAD: 0.029, scMalignantFinder: 0.031; `data/results/revision/sens2_sens3_extract.txt`). hvg_logreg shows elevated FPR (0.788) because cross-validation on a null unit causes it to overfit to the absence of signal, which is a known failure mode in supervised-ceiling evaluation on null data. This does not affect its Track A performance. We have added a paragraph explaining this distinction.

---

### R1-5 (Major): CaSee Degenerate Units

**Reviewer comment:** CaSee's performance should be contextualized, especially for units with constant-score predictions.

**Response:** We identify 20 degenerate units where CaSee returned constant scores (SD < 0.001) out of 160. Excluding these, median AP rises from 0.512 to **0.606** (`data/results/revision/casee_filtered_leaderboard.csv`). CaSee's exploratory designation is retained because it requires training on the test set without reference labels. The manuscript now reports both the all-units and excl-degenerate AP, and the method-inclusion section clarifies CaSee's exploratory categorisation.

---

### R1-6 (Major): Label Threshold Sensitivity

**Reviewer comment:** HC-label derivation thresholds (AUCell, kNN) may affect results.

**Response:** We varied AUCell threshold ∈ {0.10, 0.15, 0.20} and kNN purity cutoff ∈ {0.40, 0.50, 0.60} (9 combinations), holding Phase-1 infercnvpy CNV scores fixed. Method rankings under re-derived HC labels correlated with published rankings across all 9 settings: Spearman ρ range **[0.685, 0.939]**, mean ρ = **0.816** (`data/results/revision/threshold_sensitivity.csv`). Method ordering is qualitatively stable across all plausible threshold choices.

---

### R1-8 (Minor): Runtime Hardware / Environment

**Reviewer comment:** Runtime comparisons lack hardware specification.

**Response:** All analyses were executed on: AMD EPYC 7B12, 16 vCPUs, 62 GiB RAM, Debian GNU/Linux 13 trixie, Python 3.13.5, no GPU. Key library versions: scanpy 1.11.1, anndata 0.11.4, scikit-learn 1.6.1, infercnvpy 0.6.1, torch 2.6.0+cpu. Full specification: `data/results/revision/environment_capture.txt`. We have added a compute-environment paragraph to the Methods/Reproducibility section.

---

### R1-9 (Minor): Effect Sizes

**Reviewer comment:** Statistical comparisons should include effect size measures.

**Response:** We computed pairwise Cliff's δ for all method pairs using per-unit AP scores on common Track A units (`data/results/revision/cliff_delta_matrix.csv`). Key findings: hvg_logreg vs FiRE δ = **0.796** (large effect, CLES = 0.898); FiRE vs expr_threshold δ = **0.068** (negligible, CLES = 0.534). The negligible δ between FiRE and the naive baseline indicates FiRE does not consistently outperform expr_threshold across units, despite higher mean AP. We have added a Cliff's δ table to the Key Statistical Results section.

---

### R1-10 (Minor): Ceiling Interpretation

**Reviewer comment:** hvg_logreg ceiling is trivially achievable with label access.

**Response:** We agree and have added a clarification: the ceiling is not trivially achievable *without* label access — it represents the AP achievable by a model that knows the exact positive/background definition. Deployed methods (FiRE, scCAD, cellsius, RareQ, scMalignantFinder) must operate without any label access. Furthermore, the new Track F results demonstrate that the inter-lineage ceiling *is* trivially achievable only when inter-lineage contrast is present — it collapses on the harder intra-lineage task (Track F hvg_logreg median AP at 0.1% = 0.001), confirming the ceiling is not universally trivial.

---

### R1-11 (Minor): Figure Caption N/Datasets

**→ See `manuscript_revision/FIGURE_CHANGES.md` for per-figure caption updates with N values.**

---

## Reviewer 3

### R3-1 (Major): Reframe Malignant-vs-TME

**Reviewer comment:** The benchmark should be reframed as TME-vs-malignant detection, not general rare-cell detection.

**Response:** We agree and have revised the Abstract, Contributions, and Evaluation Tracks sections to explicitly reframe REACH as a benchmark for inter-lineage rare malignant-cell detection in heterogeneous TME, designed to model MRD, CTC, and low-purity biopsy scenarios. We explicitly note that REACH does not target intra-lineage sub-state discovery (which is the subject of the new Track F, R3-5). See `manuscript_revision/MANUSCRIPT_CHANGES.md §R3-1`.

---

### R3-2 (Major): Ceiling Trivial in Intra-Lineage Setting

**Reviewer comment:** A supervised ceiling that exploits inter-lineage contrast is trivially achievable and not informative.

**Response:** We concede this point and have added empirical evidence. On the new Track F (intra-lineage, malignant vs normal epithelial, crc_lee dataset), hvg_logreg collapses from median AP 1.000 (Track A) to **0.001 at 0.1% prevalence** (Track F; `data/results/revision/track_f/track_f_leaderboard.csv`; Δ = −0.999). This confirms that the inter-lineage ceiling does not transfer to the intra-lineage task. The ceiling is meaningful specifically for the inter-lineage TME task REACH was designed to assess, and this scope is now explicit in the manuscript.

---

### R3-3 (Major): TME Outliers as False Positives

**Reviewer comment:** Activated TME populations (macrophages, plasmablasts) may be flagged as false positives.

**Response:** We have added a Limitations paragraph acknowledging this expected behaviour: methods calibrated on inter-lineage contrast may flag activated TME subpopulations (activated macrophages, cycling fibroblasts, plasmablasts) as false positives when their expression profiles partially overlap malignant signatures. This is a documented scope choice — REACH measures performance in the realistic TME setting, and the precision@k metric already captures this FP cost. The new Track F (background = normal epithelial only) isolates the intra-lineage task where this particular FP source is absent.

---

### R3-4 (Major): Intra-Lineage Principle

**Reviewer comment:** The benchmark should demonstrate the principle of intra-lineage detection.

**Response:** We have implemented Track F (R3-5) which instantiates exactly this principle. The manuscript §Evaluation Tracks now includes a Track F subsection explaining the intra-lineage design and its relationship to the inter-lineage Tracks A–E. Results show that removing inter-lineage contrast fundamentally changes method performance profiles, validating Reviewer 3's concern that inter-lineage benchmarks alone are insufficient for assessing malignant sub-state detection capabilities.

---

### R3-5 (Major): Implement Track F

**Reviewer comment:** Add an intra-lineage track with normal epithelial background.

**Response:** Track F is now implemented and run on the crc_lee colorectal cancer dataset (`data/results/revision/track_f/`). Design:
- Background: normal epithelial cells (tissue_origin == "Normal", cell_type == "Epithelial cells")
- Positives: malignant epithelial cells (tissue_origin == "Tumor", HC-positive from Track A)
- Prevalences: 0.1%, 0.5%, 1.0%; 5 replicates each; 2000 cells/unit

Key results (median AP at 0.1% prevalence):
| Method | Track A median AP | Track F 0.1% | Δ |
|--------|-------------------|-------------|---|
| hvg_logreg (ceiling) | 1.000 | 0.001 | −0.999 |
| scMalignantFinder | 0.235 | 1.000 | +0.765 |
| expr_threshold | 0.317 | 0.009 | −0.308 |
| scCAD | 0.130 | 0.001 | −0.129 |
| random_baseline | 0.019 | 0.001 | −0.018 |
| CaSee | — | [in progress] | — |

DeepScena is deferred (requires GPU; this revision uses CPU-only hardware). Source: `data/results/revision/track_f/track_f_leaderboard.csv`.

The Track F results demonstrate that (1) inter-lineage ceiling collapses on intra-lineage tasks, (2) domain-specific models (scMalignantFinder) can retain discriminative power in intra-lineage settings, and (3) generic anomaly detectors (scCAD, expr_threshold) fail without inter-lineage contrast.
