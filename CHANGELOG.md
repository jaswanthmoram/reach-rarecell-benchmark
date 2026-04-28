# Changelog

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
