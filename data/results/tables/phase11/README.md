# Phase 11 Public Tables

This directory contains small CSV exports from the REACH evaluation and statistics phase.

The tables are kept in Git because they are summary-sized and useful for
reviewing the public repository without downloading full prediction outputs.
The large unit-level parquet export and raw prediction files remain outside
Git and are expected to be archived separately.

Key entry points:

- `leaderboard.csv` - method-level AP/AUROC/runtime summary.
- `per_dataset_summary.csv` - method summaries stratified by dataset.
- `unit_metrics_sample.csv` - first 1,000 unit rows from the frozen CSV snapshot.
- `rank_ci.csv`, `pairwise_tests.csv`, `global_tests.csv`, and sensitivity tables - Phase 11 statistical summaries.
