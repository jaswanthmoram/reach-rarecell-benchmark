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

## Included Methods

The `rarecellbenchmark.methods.registry` module exposes 10 included wrappers: FiRE, DeepScena, RareQ, cellsius, scCAD, scMalignantFinder, CaSee, random_baseline, expr_threshold, and hvg_logreg.

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
ORCID: [TODO]

## Acknowledgements

[TODO: insert funding, institutional support, computational resources, and
contributor acknowledgements]

## Competing Interests

The author declares no competing interests.

## Author Contributions

M.V.S.J. conceived the benchmark, implemented the software, curated datasets,
ran all evaluations, performed statistical analyses, generated figures, and
wrote the manuscript.
