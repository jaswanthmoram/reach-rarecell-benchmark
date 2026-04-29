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
