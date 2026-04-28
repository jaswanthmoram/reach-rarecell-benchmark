# REACH Documentation

Welcome to the REACH benchmark documentation. This site covers everything from getting started to advanced topics like adding new methods, tracks, and datasets.

## Getting Started

- **[Quickstart](quickstart.md)** - Clone, install, and run your first smoke test in under 10 minutes.
- **[Installation](installation.md)** - Full installation guide: pip, conda, Docker, R dependencies, and GPU extras.

## System Design

- **[Architecture](architecture.md)** - 12-phase system architecture, file contracts, track descriptions, and design principles.
- **[Data Contracts](data_contracts.md)** - Specifications for processed AnnData, track units, predictions, and failure records.

## Benchmarking

- **[Benchmark Regeneration](benchmark_regeneration.md)** - Step-by-step workflow to regenerate the full benchmark from scratch.
- **[Metrics](metrics.md)** - Definitions and formulas for AP, AUROC, F1@k, precision@k, recall@k, balanced accuracy, ECE, Wilcoxon tests, and critical difference diagrams.
- **[Results Interpretation](results_interpretation.md)** - How to read leaderboard.csv, interpret prevalence stratification, tier breakdown, and statistical significance stars.

## Extending the Benchmark

- **[Adding a New Method](adding_new_method.md)** - Step-by-step guide to wrap and register a new detection method.
- **[Adding a New Dataset](adding_new_dataset.md)** - How to add a dataset to the registry, implement a loader, and run validation.
- **[Adding a New Track](adding_new_track.md)** - Subclassing `BaseTrackGenerator`, updating configs, and implementing track logic.

## Operations & Reproducibility

- **[Reproducibility](reproducibility.md)** - Random seeds, checksums, environment pinning, frozen leaderboards, and Zenodo releases.
- **[Troubleshooting](troubleshooting.md)** - Common issues: missing R, out-of-memory, timeouts, checksum mismatches, and label branch setup.

---

**Version:** 1.1.0  
**Last updated:** 2026-04-28
