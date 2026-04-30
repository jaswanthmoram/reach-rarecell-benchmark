# REACH: A Reproducible Benchmark for Rare Malignant-Cell Detection in Single-Cell RNA Sequencing

> **Article type:** Original Research | **Version:** v1.2.0 | **Date:** 2026-04-30

---

## Abstract

Rare malignant cells in single-cell RNA sequencing (scRNA-seq) can represent circulating tumor cells, minimal residual disease, drug-tolerant persisters, metastatic intermediates, or small tumor compartments embedded in a complex microenvironment. These populations are biologically important but statistically difficult: the positive class is scarce, labels are assembled from imperfect evidence, and a high AUROC can coexist with poor recovery of top-ranked cells. We present REACH, not a new detector but a reproducible benchmark and software/data resource for rare malignant-cell detection that treats the task as imbalanced cell-level ranking. REACH v1.2.0 combines ten curated public scRNA-seq datasets (approx. 360,000 cells), five evaluation tracks, ten standardized method wrappers, confidence-tiered multi-arm labels, fallback-aware metrics, nonparametric paired statistics, and figure regeneration from frozen result tables. Across 1,110 benchmark units, REACH produced 11,100 method-unit evaluations. On the primary controlled real-cell Track A endpoint, the supervised in-sample `hvg_logreg` ceiling reached median average precision (AP) 1.000 (mean 0.909, mean AUROC 0.953), showing that high-confidence labels often retain recoverable expression signal. The exploratory comparator `CaSee` reached median AP 0.512 but is reported separately from ranked published detectors. Among ranked published methods, `FiRE` had the highest primary median AP (0.313), while paired tests showed it was not significantly different from `expr_threshold` or `scMalignantFinder`. Global Track A method differences were strongly supported on the 140-unit common subset (Friedman χ²=695.05, p=8.0×10⁻¹⁴⁴; Iman-Davenport F=171.01, p=8.4×10⁻²¹¹). REACH exposes a large gap between supervised separability and current unsupervised ranking, substantial prevalence sensitivity, dataset-specific winners, and method reliability issues that would be hidden by a single leaderboard number.

---

## Public Release Scope

This repository contains source code, tests, method wrappers, workflow entrypoints, toy data, lightweight Phase 11 CSV snapshots, Phase 12 PNG previews, and submission-ready figures. Large processed datasets, track units, full prediction outputs, and complete result archives are external Zenodo/GitHub release assets.

---

## Contributions

1. REACH formalizes rare malignant-cell detection as a per-unit, imbalanced ranking task over high-confidence positive and background cells.
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

| Track | Type | Units | Interpretation |
|-------|------|-------|----------------|
| A | Controlled real-cell spike-ins (4 prevalence tiers) | 160 | Primary endpoint |
| B | Synthetic Splatter stress-test | 120 | Secondary, not blended into primary leaderboard |
| C | Background-dominated null controls | 160 | False-positive diagnostic |
| D | Natural blood/CTC prevalence | 30 | Supplementary primary |
| E | Noisy-label robustness | 640 | Supervised-only interpretive track and label-noise diagnostic |

**Track E interpretation.** Track E is a supervised-only interpretive track and label-noise diagnostic. It is interpreted as algorithmic robustness only for `hvg_logreg`, which consumes labels. For unsupervised methods, Track E reflects metric sensitivity to corrupted labels, not algorithmic robustness. Track E is therefore not part of the primary unsupervised method ranking.

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
| Included | CaSee | Exploratory | Faithful | Autoencoder-Isolation Forest (Yu et al., 2022) |
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

### Supervised Ceiling Justification

hvg_logreg is a supervised logistic regression trained in-sample on 2,000 highly variable genes. It consumes ground-truth labels and therefore represents the upper bound of what is learnable from expression data alone. It is NOT a peer competitor to unsupervised methods. It is included as a calibration ceiling to quantify the gap between supervised separability and current unsupervised ranking — a gap that REACH v1.2 measures at ~0.687 median AP (1.000 vs 0.313).

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

---

## Key Statistical Results

- **Global test (140-unit common Track A subset):** Friedman χ² = 695.05, p = 8.0×10⁻¹⁴⁴; Iman-Davenport F = 171.01, p = 8.4×10⁻²¹¹
- **Bootstrap rank intervals (2,000 resamples):** hvg_logreg and CaSee stable at ranks 1 and 2; FiRE median rank 3 (95% CI [3, 4])
- **Pairwise vs FiRE:** FiRE significantly better than DeepScena, random_baseline, scCAD, RareQ, cellsius (BH FDR < 0.05). FiRE NOT significantly different from scMalignantFinder (p=0.812) or expr_threshold (p=0.836). CaSee significantly higher than FiRE (Δmean AP = -0.139, BH FDR = 6.1×10⁻⁸) but remains exploratory.
- **Track B vs Track A:** Spearman ρ = 0.042, p = 0.907 (no rank correlation — Track B is a separate stress test)
- **Track E (supervised only):** hvg_logreg mean AP drops from 0.909 to 0.460–0.829 under four label perturbation conditions
- **Track C null FPR:** Most unsupervised methods ~3% mean FPR; hvg_logreg 0.788 (in-sample behaviour)

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

1. **Single CNV caller.** Version 1 uses infercnvpy as the sole copy-number inference arm. Cross-validation with CopyKAT, Numbat, or SCEVAN would strengthen CNV evidence but was not feasible at this scale.
2. **Imperfect ground truth.** High-confidence labels (P_HC/B_HC) rely on consensus across four evidence arms. False positives in source annotation or CNV calls can propagate. The tier-assignment system mitigates this by using only P_HC vs B_HC for primary AP computation.
3. **Fallback and degenerate rates.** Across all methods, 249 units produced fallback scores and 377 units produced degenerate outputs. These rates are high and reflect current engineering stability limitations of method wrappers rather than algorithmic quality.
4. **Dataset diversity.** The 10 datasets span 8 solid-tumour types and 2 blood malignancies but are dominated by 10x Chromium (8/10). SMART-seq2 is represented in only 2 datasets. No spatial transcriptomics or multi-omics data are included.
5. **Track D size.** Natural prevalence evaluation (Track D) contains only 30 units from 2 datasets, limiting statistical power for this track.
6. **No held-out datasets.** All datasets are public. Method developers can tune against the leaderboard, though REACH's multi-track design with null controls and label-noise tracks makes simple overfitting harder.
7. **Single contributor.** The benchmark was developed by a single author. Independent verification by additional researchers would strengthen reproducibility claims.
8. **Cancer-type scope.** Several therapeutically important cancer types (glioblastoma, prostate adenocarcinoma, gastric cancer) are not represented.

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

- **v1.2.0 (2026-04-29):** Publication-ready snapshot. 10 datasets, 10 methods, 1,110 units, 11,100 evaluations. Added public Phase 11/12 tables and figures, label-based evaluation, all method wrappers exposed through registry, paper.md, and reproducibility receipt.
- **v1.1.0 (2026-04-28):** Initial public release. Code, configs, tests, Docker, CI/CD, toy-data generation, frozen CSV snapshots, Zenodo DOIs.
