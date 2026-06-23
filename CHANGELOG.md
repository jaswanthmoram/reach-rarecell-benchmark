# Changelog

## [1.3.0] - 2026-06-23

### Frontiers Revision (branch `revision/frontiers-r1`)

### Added
- **Track F (intra-lineage benchmark):** New evaluation track where background is normal-diploid epithelial cells (same lineage as positives), testing intra-lineage discriminability. 15 units (3 prevalences × 5 replicates) from crc_lee. All 10 methods evaluated (150/150 predictions). Adaptive unit sizes (2,000 cells for 0.1%, 400 for 0.5%/1%) with without-replacement sampling (duplication <20% at 0.5%/1%).
- **CNV circularity check (R1-1):** Recomputed HC labels with CNV removed; Spearman ρ=0.648. Honestly disclosed that CNV-free labels collapse to chance floor (0.009–0.010).
- **CNV validation concordance (R1-2):** Validated infercnvpy CNV against published source annotations — overall AUROC=0.782, MCC=0.361 across 9 datasets. Fixed hnscc_puram (AUROC 0.500→0.906) by correcting reference category labels.
- **Track A↔B correlation (R1-3):** Method-level ρ=0.042 (p=0.907); withdrew prior ">0.95" claim.
- **Track C FPR analysis (R1-4):** Per-method FPR ~3% (9 methods); hvg_logreg outlier 0.788.
- **CaSee degenerate filtering (R1-5):** 20/160 degenerate units filtered; AP 0.512→0.606. Documented as faithful_recreation.
- **Threshold sensitivity (R1-6):** 9 threshold combos × 7 datasets; honestly disclosed labels are threshold-insensitive.
- **Effect sizes (R1-9):** Pairwise Cliff's δ matrix.
- **Track F figure (Fig11):** New figure showing Track A vs Track F median AP per method with ceiling-collapse annotation.
- **DeepScena Colab workflow:** `docs/deepscena_colab_instructions.md` for reproducing DeepScena on Google Colab T4 GPU.

### Changed
- **Supervised ceiling justification (R1-10/R3-2):** Conceded ceiling is trivial for intra-lineage; hvg_logreg collapses 1.000→0.001 on Track F.
- **Scope reframe (R3-1):** Reframed as "rare malignant-cell detection in heterogeneous TME" (inter-lineage), not intra-lineage sub-state discovery.
- **Limitations expanded:** 10 items (was 8) — added threshold sensitivity, TME overlap scope choice.
- **Reproducibility:** Added revision compute environment section (AMD EPYC 7B12, 62 GiB, no GPU; DeepScena on Colab T4).
- **Real CNV implementation:** Replaced zero-stub with genuine infercnvpy; fixed gene-name quote-wrapping (hnscc_puram) and headerless gene_positions.tsv parsing.
- **Track F generator:** Adaptive unit_size + without-replacement sampling.
- Abstract updated: six tracks (was five), 1,125 units (was 1,110), 11,250 evaluations (was 11,100).

### Fixed
- hnscc_puram CNV all-zeros → AUROC 0.906 (reference category label mismatch + gene-name quote-wrapping).
- Track F duplication 83% (all levels) → 83% at 0.1% only, <20% at 0.5%/1%.
- Stale manuscript numbers: "ten of ten" → "nine of ten", Track F higher-prevalence values updated.
- Fig5 caption N=80 → N=160 (actual Track C unit count).

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
