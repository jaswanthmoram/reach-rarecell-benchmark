# Changelog

## [1.2.0] - 2026-04-29

### Added
- Registered all 10 included method wrappers and added interface tests for ranked and exploratory wrappers.
- Added label-based CLI/script evaluation from prediction CSVs plus label parquet files.
- Added `scripts/run_methods.py` and `scripts/phase11_statistics.py` for batch method execution and Phase 11 snapshot/statistics regeneration.
- Added executable public Snakemake and DVC workflows for toy and snapshot reproduction.
- Added `data/results/phase11/` as a compatibility copy of the canonical `data/results/tables/phase11/` bundle.
- Added repository-level `paper.md` publication summary.

### Changed
- Bumped package and citation metadata to `v1.2.0`.
- Updated reproducibility docs to distinguish Git-tracked toy/snapshot outputs from external Zenodo/GitHub release archives.
- Updated Docker/GHCR release workflow metadata for release, `latest`, and `paper-2026` tags on published releases.

## Public result bundle - 2026-04-28

### Added
- Curated Phase 11 CSV summary tables under `data/results/tables/phase11/`.
- Curated Phase 12 PNG figure previews under `data/results/figures/phase12/`.
- README result preview and result-bundle regeneration instructions.
- Snapshot reproduction script now writes the public Phase 11/12 bundle.

### Changed
- Release notes now describe Zenodo and GHCR as release-triggered services rather than pending placeholders.

## [1.1.0] - 2026-04-28

### Added
- Clean public repository under `jaswanthmoram/reach-rarecell-benchmark`.
- Python package `rarecellbenchmark` and CLI entry point `rcb`.
- Dataset, method, metric, signature, and track configuration files.
- Unit tests, smoke tests, GitHub Actions CI, Dockerfile, and future GHCR release workflow.
- Toy-data generation commands and a small `data/results/snapshots/paper_v1/` CSV snapshot.
- Public project docs, contribution guidelines, issue templates, PR template, security policy, and citation metadata.

### Changed
- Public repository links now point to `reach-rarecell-benchmark`.
- Zenodo DOI and GHCR image references are marked pending until the first archive and release exist.
- Generated data, local caches, virtual environments, logs, old staging folders, and local assistant/tooling state are excluded from version control.
