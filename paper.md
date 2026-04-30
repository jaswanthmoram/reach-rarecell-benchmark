# REACH Publication Summary

REACH (Rare-cell Evaluation Across Cancer Heterogeneity) is a reproducible benchmark for rare malignant cell detection in single-cell RNA-seq data.

## Public Release Scope

This Git repository contains source code, tests, method wrappers, workflow entrypoints, toy data, lightweight Phase 11 CSV snapshots, and Phase 12 PNG previews. Large processed datasets, track units, full prediction outputs, and complete result archives are external Zenodo/GitHub release assets.

## Reproducibility Entry Points

```bash
rcb smoke-test
python scripts/run_all.py --toy
python scripts/phase11_statistics.py --from-snapshots
python scripts/reproduce_from_snapshots.py
snakemake -n --cores 1
dvc repro --dry
```

Full-data evaluation requires restoring the external archives listed in `README.md` and `docs/reproducibility.md`.

## Key Repository Paths

| Path | Contents |
|---|---|
| `docs/METHODS.md` | Included and excluded method descriptions |
| `docs/metrics.md` | Metric definitions and evaluation rules |
| `data/results/snapshots/paper_v1/` | Frozen public CSV snapshots |
| `data/results/tables/phase11/` | Canonical Phase 11 public table bundle |
| `data/results/phase11/` | Compatibility copy of Phase 11 public tables |
| `data/results/figures/phase12/` | Public PNG figure previews |

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
| Excluded | scATOMIC | — | — | Score contract mismatch (multi-class classifier, not continuous rarity score) |
| Excluded | GiniClust3 | — | — | Score contract mismatch (cluster-level, not cell-level) |

### Wrapper Fidelity Notes

- **Faithful:** The wrapper executes the original published software package with
  default parameters and documented configurations.
- **Proxy:** The wrapper reimplements the published algorithm from the paper
  description. Performance may differ from the original implementation.

### Supervised Ceiling Justification

hvg_logreg is a supervised logistic regression trained in-sample on 2,000 highly
variable genes. It consumes ground-truth labels and therefore represents the
upper bound of what is learnable from expression data alone. It is NOT a peer
competitor to unsupervised methods. It is included as a calibration ceiling to
quantify the gap between supervised separability and current unsupervised
ranking — a gap that REACH v1.2 measures at ~0.687 median AP (1.000 vs 0.313).

## Included Methods

The `rarecellbenchmark.methods.registry` module exposes 10 included wrappers: FiRE, DeepScena, RareQ, cellsius, scCAD, scMalignantFinder, CaSee, random_baseline, expr_threshold, and hvg_logreg.

## Limitations

1. **Single CNV caller.** Version 1 uses infercnvpy as the sole copy-number
   inference arm. Cross-validation with CopyKAT, Numbat, or SCEVAN would
   strengthen CNV evidence but was not feasible at this scale.
2. **Imperfect ground truth.** High-confidence labels (P_HC/B_HC) rely on
   consensus across four evidence arms. False positives in source annotation or
   CNV calls can propagate. The tier-assignment system mitigates this by only
   using P_HC vs B_HC for primary AP computation.
3. **Fallback and degenerate rates.** Across all methods, 249 units (22.4% of
   Track A) produced fallback scores and 377 units (34.0%) produced degenerate
   (constant/near-constant) outputs. These rates are high and reflect current
   engineering stability limitations of method wrappers rather than algorithmic
   quality.
4. **Dataset diversity.** The 10 datasets span 8 solid-tumour types and 2 blood
   malignancies but are dominated by 10x Chromium (8/10). SMART-seq2 is
   represented in only 2 datasets. No spatial transcriptomics or multi-omics
   data are included.
5. **Track D size.** Natural prevalence evaluation (Track D) contains only 30
   units from 2 datasets, limiting statistical power for this track.
6. **No held-out datasets.** All datasets are public. Method developers can
   tune against the leaderboard, though REACH's multi-track design with null
   controls and label-noise tracks makes simple overfitting harder.
7. **Single contributor.** The benchmark was developed by a single author.
   Independent verification by additional researchers would strengthen
   reproducibility claims.
8. **Cancer-type scope.** Several therapeutically important cancer types
   (glioblastoma, prostate adenocarcinoma, gastric cancer) are not represented.

## Comparison to Related Benchmarks

REACH differs from existing single-cell benchmarks in several ways:

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

## Version History

- **v1.2.0 (2026-04-29):** Publication-ready snapshot. 10 datasets, 10 methods,
  1,110 units, 11,100 evaluations. Added public Phase 11/12 tables and figures,
  label-based evaluation, all method wrappers exposed through registry, paper.md,
  and reproducibility receipt.
- **v1.1.0 (2026-04-28):** Initial public release. Code, configs, tests, Docker,
  CI/CD, toy-data generation, frozen CSV snapshots, Zenodo DOIs.

## Citation

Use `CITATION.cff` for software citation metadata. The concept DOI is `10.5281/zenodo.19847108`.

## Abstract

REACH (Rare-cell Evaluation Across Cancer Heterogeneity) is a reproducible
benchmark framework for evaluating computational methods that detect rare
malignant cells in single-cell RNA sequencing data. Version 1.2 combines
10 curated scRNA-seq datasets (n=359,739 cells) across 8 solid-tumour
types and 2 blood malignancies, five complementary evaluation tracks
(controlled spike-ins, synthetic stress-test, null controls, natural
blood/CTC prevalence, and label-noise robustness), and 10 standardised
method wrappers. REACH evaluates 1,110 benchmark units producing 11,100
method-unit evaluations with Average Precision (AUPRC) as the primary
metric. The supervised in-sample hvg_logreg ceiling reaches median AP of
1.000, while the highest-ranked published detector FiRE attains median AP
of 0.313. REACH exposes a large gap between supervised separability and
current unsupervised ranking, identifies dataset-level winners that do not
generalise, and demonstrates that ranking, null-control, and label-noise
behaviour cannot be summarised by a single number.

## Data and Code Availability

- **Source code:** https://github.com/jaswanthmoram/reach-rarecell-benchmark
- **Concept DOI:** https://doi.org/10.5281/zenodo.19847108
- **Processed datasets (7.3 GB):** https://doi.org/10.5281/zenodo.19850652
- **Track Units A-C (9.7 GB):** https://doi.org/10.5281/zenodo.19850972
- **Track Units D-E (2.2 GB):** https://doi.org/10.5281/zenodo.19851287
- **Complete results (425 MB):** https://doi.org/10.5281/zenodo.19851710
- **Docker image:** ghcr.io/jaswanthmoram/reach-rarecell-benchmark:latest
- **License:** MIT
- **GEO accessions:** GSE103322, GSE123813, GSE149614, GSE123902, GSE202051,
  GSE132465, GSE159115, GSE146026, GSE161801, GSE109761

## Author

**Moram Venkata Satya Jaswanth**
Department of Computer Science and Engineering, SRM University AP
Email: jaswanthmoram@gmail.com
ORCID: https://orcid.org/0000-0000-0000-0000 (register at https://orcid.org)

## Acknowledgements

The author thanks the REACH working group for feedback on benchmark design.
This work used computational resources at [TODO: institution/cloud provider].
Funding: [TODO: grant numbers and funding sources].

Contributor acknowledgements: [TODO: dataset authors, software maintainers,
reviewers, and colleagues who provided feedback on early drafts].

## Competing Interests

The author declares no competing interests.

## Author Contributions

M.V.S.J. conceived the benchmark, implemented the software, curated datasets,
ran all evaluations, performed statistical analyses, generated figures, and
wrote the manuscript.
