# Release Manifest

## Current Repository State

- Repository: `https://github.com/jaswanthmoram/reach-rarecell-benchmark`
- Package: `rarecellbenchmark`
- CLI: `rcb`
- License: MIT
- Zenodo DOI: pending first archive
- GHCR image: pending first GitHub release

## Included in Git

- Source package under `src/rarecellbenchmark/`
- Tests and smoke tests under `tests/`
- Configuration files under `configs/`
- Documentation under `docs/`
- GitHub issue templates, PR template, and workflows
- Dockerfile, docker-compose file, Makefile, Snakemake workflow outline, and DVC pipeline file
- Toy-data generation code
- Small reproducibility snapshot files under `data/results/snapshots/paper_v1/`

## Excluded from Git

- Raw, processed, and track-unit `.h5ad` files
- Prediction parquet files and generated toy parquet files
- Full benchmark outputs and generated figures/tables
- Virtual environments, caches, logs, build outputs, egg-info, and local assistant/tooling directories

## First Release Checklist

1. Confirm CI passes on `main`.
2. Publish the first GitHub release.
3. Let the Docker workflow publish `ghcr.io/jaswanthmoram/reach-rarecell-benchmark:<tag>`.
4. Archive the release on Zenodo.
5. Add the assigned DOI to `CITATION.cff`, `README.md`, and project metadata.
