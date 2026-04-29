# Benchmark Regeneration

This guide explains how to regenerate the full REACH benchmark from scratch, from toy data to publication figures.

---

## Toy Smoke Test (seconds)

The fastest way to verify the local installation:

```bash
rcb create-toy-data
rcb smoke-test
python scripts/run_all.py --toy
```

- `create-toy-data` writes a small synthetic dataset to `data/toy/`.
- `smoke-test` verifies imports, config loading, toy-data creation, and metric/schema basics.

---

## Snapshot Regeneration (no external data)

The Git repository can reproduce the public Phase 11 tables and Phase 12 PNG previews from tracked CSV snapshots:

```bash
python scripts/phase11_statistics.py --from-snapshots
python scripts/reproduce_from_snapshots.py
python scripts/run_all.py --from-snapshots
snakemake -n --cores 1
dvc repro --dry
```

This mode is the supported Git-only reproducibility path. It does not rerun method predictions.

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

Raw data accessions are listed in `configs/datasets.yaml`. The public release expects processed `.h5ad` archives from Zenodo for normal reproduction; raw GEO ingestion is not a Git-only operation.

### Phase 2 - Preprocessing

```bash
python scripts/run_phase.py --phase 2 --dataset <DATASET>
```

**Outputs:** `data/processed/*.h5ad`, `data/interim/*_qc_report.json`

### Phase 3 - Validation

```bash
python scripts/run_phase.py --phase 3 --dataset <DATASET>
```

**Outputs:** `data/validation/*_tier_assignments.parquet`, `*_validation_report.json`

### Phases 4-8 - Track Generation

```bash
rcb run-track --track a --dataset <DATASET> --processed-h5ad data/processed/<DATASET>.h5ad
```

**Outputs:** `data/tracks/*/*_expression.h5ad`, `*_labels.parquet`, `*_manifest.json`

### Phase 9 - Method Wrappers (already in repo)

No separate command; wrappers live in `src/methods/`.

### Phase 10 - Prediction Execution

```bash
python scripts/run_methods.py \
    --methods all \
    --units-dir data/tracks \
    --output-dir data/predictions \
    --continue-on-error
```

**Outputs:** `data/predictions/<method>/<unit_id>_predictions.csv` + `<unit_id>_runmeta.json`

### Phase 11 - Evaluation

```bash
python scripts/evaluate_results.py \
    --track all \
    --predictions-dir data/predictions \
    --labels-dir data/tracks \
    --output-dir data/results/tables/phase11
python scripts/phase11_statistics.py --metrics-csv data/results/tables/phase11/unit_metrics.csv
```

**Outputs:** `data/results/tables/phase11/*.csv` and compatibility copies in `data/results/phase11/`

### Phase 12 - Figures

```bash
rcb figures --all --output-dir data/results/figures
python scripts/reproduce_from_snapshots.py
```

**Outputs:** `data/results/figures/*`

---

## DVC Pipeline (recommended for reproducibility)

If you have DVC installed, the benchmark is also expressed as a DVC pipeline:

```bash
dvc repro --dry   # verify public stages without modifying outputs
dvc repro         # run stale public stages
```

Each phase is a DVC stage with explicit dependencies and outputs, so `dvc repro` only reruns what changed.

---

## Snakemake Pipeline (HPC clusters)

For HPC execution with Slurm or PBS:

```bash
snakemake -n --cores 1
snakemake --cores 4 all
```

The default Snakemake target covers public snapshot-derived outputs. Full-data rules require external archives.

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

If you already have prediction CSVs and track-unit labels restored from release assets, you can skip Phases 0-10 and run only Phases 11-12:

```bash
python scripts/run_phase.py --phase 11
python scripts/run_phase.py --phase 12
```

---

*Next: [Adding a New Method](adding_new_method.md) or [Metrics](metrics.md)*
