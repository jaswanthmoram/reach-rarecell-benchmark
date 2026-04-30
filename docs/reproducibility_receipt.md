# Reproducibility Receipt — REACH v1.2.0

> **Date:** 2026-04-30
> **Git tag:** v1.2.0 (run `git rev-parse v1.2.0^{}` to get the exact commit)
> **Environment:** Python 3.12, Ubuntu 24.04, Docker 29.1.3

## Snapshot Reproduction (no external data required)

These commands reproduce the public Phase 11 tables and Phase 12 figures
from the frozen CSV snapshots tracked in this repository:

```bash
git clone https://github.com/jaswanthmoram/reach-rarecell-benchmark.git
cd reach-rarecell-benchmark
git checkout v1.2.0

# Install
python3.12 -m venv .venv && source .venv/bin/activate
pip install -e '.[dev]'

# Verify installation
rcb smoke-test
# Expected output: "4 passed, 0 failed, 0 skipped" + "✓ All smoke tests passed"

# Regenerate Phase 11 tables from snapshots
python scripts/phase11_statistics.py --from-snapshots
# Expected output: "Phase 11 tables written to data/results/tables/phase11"

# Regenerate Phase 12 figures
python scripts/reproduce_from_snapshots.py
# Expected output: "Public result regeneration complete."

# Generate publication figures
rcb figures --all --output-dir /tmp/rcb_figures_check
# Expected output: "Figures complete."

# Verify workflow structure (dry-runs)
snakemake -n --cores 1
# Expected: "Nothing to be done" or 2 jobs listed (public_phase12 + all)

dvc repro --dry
# Expected: lists public_phase11, public_phase12, toy_smoke, full_data_phase11 stages
```

## Full Benchmark Reproduction (requires Zenodo archives)

Download the four Zenodo archives listed in `README.md` before running:

```bash
python scripts/run_phase.py --phase 11
python scripts/run_all.py --toy
python scripts/run_methods.py --methods all
python scripts/phase11_statistics.py --from-snapshots
python scripts/reproduce_from_snapshots.py
```

## Docker Verification

```bash
docker build -t reach-rarecell-benchmark:1.2.0 .
docker run --rm reach-rarecell-benchmark:1.2.0 rcb smoke-test
# Expected: "4 passed, 0 failed" + "✓ All smoke tests passed"
```

## Verification Checksums

| File | SHA-256 |
|------|---------|
| `reach-rarecell-benchmark-v1.2.0-public-snapshots.tar.gz` | `f7e336aaa5645385483eeefda8bcea7ba4bc03675e0dae73c966c3736886723e` |

## Test Suite

```bash
pytest -q
# Expected: 50 passed, 2 skipped

ruff check .
# Expected: "All checks passed!"

mypy src/rarecellbenchmark
# Expected: "Success: no issues found in 78 source files"

pip check
# Expected: "No broken requirements found."
```

## Notes

- The 12-phase full-data pipeline requires ~20 GB of Zenodo archives.
- Snakemake/DVC dry-runs verify workflow integrity without data.
- All random seeds are fixed (global seed 42).
- SHA-256 checksums for processed .h5ad files are stored in configs/datasets.yaml.
