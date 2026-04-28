# Benchmark Regeneration

This guide explains how to regenerate the full REACH benchmark from scratch, from toy data to publication figures.

---

## Toy Smoke Test (seconds)

The fastest way to verify that the pipeline works end-to-end:

```bash
rcb create-toy-data
rcb smoke-test
```

- `create-toy-data` writes a 1,000-cell synthetic dataset to `data/toy/`.
- `smoke-test` runs the three naive baselines and prints a mini-leaderboard.

---

## Full Regeneration (days)

The complete pipeline from raw GEO downloads to Phase 12 figures is organised into 12 phases. Estimated wall time on a 32-core, 128 GB RAM workstation: **~3 days**.

### Phase 0 - Environment

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
Rscript setup/setup_r_packages.R
bash setup/setup_external_methods.sh
```

### Phase 1 - Dataset Ingestion

```bash
python -m src.ingest.download_dataset --config configs/datasets.yaml --outdir data/raw/
```

### Phase 2 - Preprocessing

```bash
python scripts/run_preprocess3.py --config configs/datasets.yaml
```

**Outputs:** `data/processed/*.h5ad`, `data/interim/*_qc_report.json`

### Phase 3 - Validation

```bash
python scripts/run_validate3.py \
    --processed_dir data/processed/ \
    --output_dir data/validation/ \
    --config configs/datasets.yaml
```

**Outputs:** `data/validation/*_tier_assignments.parquet`, `*_validation_report.json`

### Phases 4-8 - Track Generation

```bash
python scripts/run_track_a.py --processed_dir data/processed/ --tier_file data/validation/tier_assignments.parquet --output_dir data/tracks/a/ --config configs/protocol_version.yaml
python scripts/run_track_b.py --processed_dir data/processed/ --tier_file data/validation/tier_assignments.parquet --output_dir data/tracks/b/ --config configs/protocol_version.yaml
python scripts/run_track_c.py --processed_dir data/processed/ --tier_file data/validation/tier_assignments.parquet --output_dir data/tracks/c/ --config configs/protocol_version.yaml
python scripts/run_track_d.py --processed_dir data/processed/ --tier_file data/validation/tier_assignments.parquet --output_dir data/tracks/d/ --config configs/protocol_version.yaml
python scripts/run_track_e.py --processed_dir data/processed/ --tier_file data/validation/tier_assignments.parquet --output_dir data/tracks/e/ --config configs/protocol_version.yaml
```

**Outputs:** `data/tracks/*/*_expression.h5ad`, `*_labels.parquet`, `*_manifest.json`

### Phase 9 - Method Wrappers (already in repo)

No separate command; wrappers live in `src/methods/`.

### Phase 10 - Prediction Execution

```bash
python scripts/run_methods.py \
    --config configs/protocol_version.yaml \
    --methods all \
    --tracks A B C D E
```

**Outputs:** `results/<method>/<unit_id>/predictions.csv` + `runmeta.json`

### Phase 11 - Evaluation

```bash
python scripts/evaluate.py
python scripts/phase11_enhanced_metrics.py
python scripts/phase11_statistics.py --n-boot 2000
```

**Outputs:** `data/results/all_metrics.parquet`, `leaderboard*.csv`, `phase11/*.csv`, `sensitivity_analyses/*.csv`

### Phase 12 - Figures

```bash
python scripts/generate_figures.py --all --output-dir data/results/figures
```

**Outputs:** `data/results/figures/*`

---

## DVC Pipeline (recommended for reproducibility)

If you have DVC installed, the benchmark is also expressed as a DVC pipeline:

```bash
dvc pull          # fetch cached outputs from remote storage
dvc repro         # run only stale stages
```

Each phase is a DVC stage with explicit dependencies and outputs, so `dvc repro` only reruns what changed.

---

## Snakemake Pipeline (HPC clusters)

For HPC execution with Slurm or PBS:

```bash
snakemake --cores 8 --use-conda all
```

Profiles for common HPC schedulers are in `profiles/`.

---

## Expected Runtime

| Stage | Estimated time | Parallelizable |
|-------|---------------|----------------|
| Data download | 4-8 h | Yes (dataset-level) |
| Preprocessing | 2-4 h | Yes |
| Validation (Phase 3) | 6-12 h | Yes |
| Track generation | 1-2 h | Yes |
| Method execution (10 methods × 1,110 units) | 48-96 h | Yes (unit-level) |
| Evaluation (Phase 11) | 10-20 min | No (single pipeline) |
| Figure generation | 5-10 min | No |
| **Total** | **~3-7 days** | - |

With 32 cores and 128 GB RAM, the full pipeline completes in ~3 days.

---

## No-Rerun Mode

The v1.0 publication pass is a **no-rerun** analysis. If you already have prediction CSVs in `results/`, you can skip Phases 0-10 and run only Phases 11-12:

```bash
python scripts/evaluate.py
python scripts/phase11_enhanced_metrics.py
python scripts/phase11_statistics.py --n-boot 2000
python scripts/plot_leaderboard.py
python scripts/plot_sensitivity.py
python scripts/plot_scalability.py
python scripts/plot_phase11_summary.py
```

---

*Next: [Adding a New Method](adding_new_method.md) or [Metrics](metrics.md)*
