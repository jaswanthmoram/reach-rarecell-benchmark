# Release Manifest

## Current Repository State

- Repository: `https://github.com/jaswanthmoram/reach-rarecell-benchmark`
- Package: `rarecellbenchmark`
- CLI: `rcb`
- License: MIT
- Zenodo DOI: created by Zenodo after the first GitHub release archive
- GHCR image: built by the release workflow and published to `ghcr.io/jaswanthmoram/reach-rarecell-benchmark`

## Included in Git

- Source package under `src/rarecellbenchmark/`
- Tests and smoke tests under `tests/`
- Configuration files under `configs/`
- Documentation under `docs/`
- GitHub issue templates, PR template, and workflows
- Dockerfile, docker-compose file, Makefile, Snakemake workflow outline, and DVC pipeline file
- Toy-data generation code
- Small reproducibility snapshot files under `data/results/snapshots/paper_v1/`
- Curated Phase 11 summary CSV tables under `data/results/tables/phase11/`
- Curated Phase 12 GitHub-friendly PNG figures under `data/results/figures/phase12/`

## Excluded from Git

- Raw, processed, and track-unit `.h5ad` files
- Prediction parquet files and generated toy parquet files
- Full benchmark outputs beyond the curated public summary bundle
- Publication/vector figure exports and large unit-level metric exports
- Virtual environments, caches, logs, build outputs, egg-info, and local assistant/tooling directories

## First Release Checklist

1. Confirm CI passes on `main`.
2. Publish the first GitHub release.
3. Let the Docker workflow publish `ghcr.io/jaswanthmoram/reach-rarecell-benchmark:latest` and `ghcr.io/jaswanthmoram/reach-rarecell-benchmark:paper-2026`.
4. Archive the release on Zenodo.
5. Add the assigned DOI badge to `README.md` after Zenodo reports it.
