# REACH Benchmark

Rare-cell Evaluation Across Cancer Heterogeneity (REACH) is a reproducible benchmark for rare malignant cell detection in single-cell RNA-seq data.

[![CI](https://github.com/jaswanthmoram/reach-rarecell-benchmark/actions/workflows/ci.yml/badge.svg)](https://github.com/jaswanthmoram/reach-rarecell-benchmark/actions/workflows/ci.yml)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)

## Status

This repository is the clean public source repository for REACH. It contains code, configuration, tests, documentation, toy-data generation, a frozen CSV snapshot for reproducibility checks, and a small public result bundle.

Release artifacts are pending:

| Artifact | Status |
|---|---|
| GitHub repository | `jaswanthmoram/reach-rarecell-benchmark` |
| Zenodo DOI | Enabled for GitHub release archiving; DOI appears after the first release is archived |
| GHCR Docker image | Built by the Docker workflow when a GitHub release is published |
| Python package import | `rarecellbenchmark` |
| CLI | `rcb` |

## Result Preview

The public repository includes lightweight Phase 11 summary tables and Phase 12 PNG figures generated from the frozen CSV snapshot.

![Phase 11 method-by-dataset AP heatmap](data/results/figures/phase12/Fig0_Phase11_Summary_Heatmap.png)

Key result paths:

| Path | Contents |
|---|---|
| `data/results/snapshots/paper_v1/` | Frozen CSV snapshot used for public reproducibility checks |
| `data/results/tables/phase11/` | Leaderboard, dataset summaries, rank tests, sensitivity summaries, and related Phase 11 CSV tables |
| `data/results/figures/phase12/` | GitHub-friendly PNG previews for leaderboard, sensitivity, null controls, runtime, pipeline, track design, and method audit |

Regenerate the public result bundle with:

```bash
python scripts/reproduce_from_snapshots.py
```

## Quickstart

```bash
git clone https://github.com/jaswanthmoram/reach-rarecell-benchmark.git
cd reach-rarecell-benchmark
python -m venv .venv
source .venv/bin/activate
python -m pip install -e '.[dev]'
rcb create-toy-data
rcb smoke-test
```

`rcb create-toy-data` writes a small synthetic dataset to `data/toy/`. The generated `.h5ad`, parquet, and manifest files are intentionally ignored by Git.

To build the container locally before the first GHCR release:

```bash
docker build -t reach-rarecell-benchmark:local .
docker run --rm reach-rarecell-benchmark:local rcb smoke-test
```

## Scope

REACH defines a benchmark framework with:

| Area | Contents |
|---|---|
| Datasets | 10 configured scRNA-seq cohorts across solid tumors and blood malignancies |
| Tracks | A-E: spike-ins, synthetic stress tests, null controls, natural prevalence, noisy labels |
| Methods | 10 wrappers: ranked detectors, naive baselines, a supervised ceiling, and one exploratory method |
| Metrics | Average Precision, AUROC, top-k metrics, calibration checks, runtime, and rank summaries |
| Reproducibility | Fixed configs, file contracts, tests, smoke checks, and snapshot CSVs |

Large processed datasets, track units, predictions, and full unit-level result exports are not committed to this repository. Small public summary tables and PNG previews are tracked for review and reproducibility checks. Large artifacts belong in release archives.

## Repository Layout

```text
reach-rarecell-benchmark/
├── .github/          # CI, smoke, docs, and release workflows
├── configs/          # Dataset, method, metric, signature, and track configs
├── data/             # Directory skeleton, snapshot CSVs, and small public result bundle
├── docs/             # Architecture, installation, reproducibility, and extension guides
├── requirements/     # Split dependency lists
├── scripts/          # Toy data, validation, orchestration, and snapshot utilities
├── setup/            # Optional environment setup notes
├── src/              # Python package: rarecellbenchmark
├── tables/           # Notes for generated table outputs
└── tests/            # Unit and smoke tests
```

## Tracks

| Track | Name | Purpose |
|---|---|---|
| A | Controlled real spike-ins | Primary controlled benchmark with rare malignant cells spiked into background cells |
| B | Synthetic stress test | Synthetic units for stress testing prevalence and separability |
| C | Null controls | Background-only units for false-positive calibration |
| D | Natural prevalence | Blood/CTC-style natural-prevalence units |
| E | Noisy-label robustness | Label-corruption stress tests for methods that use labels |

## Methods

The repository includes wrappers or baselines for `FiRE`, `DeepScena`, `RareQ`, `cellsius`, `scCAD`, `scMalignantFinder`, `CaSee`, `random_baseline`, `expr_threshold`, and `hvg_logreg`.

External methods may require their original R/Python packages or model assets. See [docs/METHODS.md](docs/METHODS.md) and [docs/EXTENDING_METHODS.md](docs/EXTENDING_METHODS.md).

## Data Policy

Git tracks source files, configuration, docs, tests, directory placeholders, the `data/results/snapshots/paper_v1/` CSV snapshot, and the curated public result bundle under `data/results/tables/phase11/` and `data/results/figures/phase12/`. Git does not track generated or large artifacts such as:

- raw or processed `.h5ad` files
- parquet predictions and labels
- generated toy data
- full track units and full benchmark outputs beyond the curated public summary bundle
- logs, caches, virtual environments, and local assistant/tooling state

See [data/README.md](data/README.md) and [docs/reproducibility.md](docs/reproducibility.md) for expected data locations and regeneration notes.

## Development

```bash
python -m pip install -e '.[dev]'
pytest -q
ruff check src tests scripts
rcb create-toy-data
rcb smoke-test
```

The GitHub CI workflow runs linting, unit tests, and the CLI smoke test.

## Citation

Citation metadata is provided in [CITATION.cff](CITATION.cff). Zenodo archiving is enabled for the GitHub repository; the DOI badge can be added after the first release is archived by Zenodo.

## License

REACH is released under the [MIT License](LICENSE). Contributions are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md).
