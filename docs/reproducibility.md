# Reproducibility

REACH is designed so benchmark outputs can be traced to a code version, config set, dataset checksum, environment, and random seed.

## Seeds

Randomized steps use explicit seeds.

| Component | Seed source |
|---|---|
| Toy data | `rcb create-toy-data --seed` |
| Track generation | Unit metadata plus a fixed base seed |
| Method wrappers | Method config and unit metadata |
| Rank summaries | Fixed bootstrap seed in evaluation utilities |

## Checksums

Processed datasets are expected to carry SHA-256 checksums in config metadata and AnnData provenance fields. Large `.h5ad` files are not tracked in Git.

## Environment

For local reproducibility:

```bash
python -m pip install -e '.[dev]'
python -m pip freeze > setup/frozen-requirements.txt
```

Environment snapshots should be treated as release artifacts. They are not required for normal development.

## Snapshot Files

The public repository tracks lightweight CSV snapshots under:

```text
data/results/snapshots/paper_v1/
├── degenerate_predictions_report.csv
├── results_per_dataset.csv
├── results_per_method.csv
└── results_per_unit.csv
```

The larger parquet snapshot and full benchmark outputs are excluded from Git. The repository tracks a small public result bundle:

```text
data/results/tables/phase11/
data/results/figures/phase12/
```

These files are summary-sized CSV and PNG outputs generated from the frozen snapshot. Large data and prediction artifacts belong in release archives.

To regenerate lightweight tables from the tracked CSV snapshots:

```bash
python scripts/reproduce_from_snapshots.py
```

Generated public tables and figures are written under `data/results/` and are tracked only for the curated Phase 11/12 bundle.

## Data Archives

Zenodo DOI: [https://doi.org/10.5281/zenodo.19847108](https://doi.org/10.5281/zenodo.19847108)

Published archives:

| Archive | DOI |
|---|---|
| Processed datasets | [10.5281/zenodo.19850652](https://doi.org/10.5281/zenodo.19850652) |
| Track units A–C | [10.5281/zenodo.19850972](https://doi.org/10.5281/zenodo.19850972) |
| Track units D–E | [10.5281/zenodo.19851287](https://doi.org/10.5281/zenodo.19851287) |
| Complete results | [10.5281/zenodo.19851710](https://doi.org/10.5281/zenodo.19851710) |
