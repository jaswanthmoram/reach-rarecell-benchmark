# Installation Guide

REACH can be installed directly from the source checkout. The Python package name is `rarecellbenchmark` and the CLI entry point is `rcb`.

## Source Install

```bash
git clone https://github.com/jaswanthmoram/reach-rarecell-benchmark.git
cd reach-rarecell-benchmark
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e '.[dev]'
```

Verify the install:

```bash
rcb --help
pytest -q
ruff check src tests scripts
rcb smoke-test
```

## Conda or Mamba

```bash
conda env create -f environment.yml
conda activate rarecellbenchmark
python -m pip install -e '.[dev]'
```

Use the conda environment if you prefer conda-forge binaries for scientific Python dependencies.

## Docker

The GHCR image is pending the first GitHub release. Build the same container locally:

```bash
docker build -t reach-rarecell-benchmark:local .
docker run --rm reach-rarecell-benchmark:local rcb smoke-test
```

The compose file builds the local image and runs the smoke test:

```bash
docker compose up --build
```

## Optional Extras

GPU dependencies:

```bash
python -m pip install -e '.[gpu]'
```

R bridge dependencies:

```bash
python -m pip install -e '.[r]'
```

Some method wrappers require their original upstream packages or model files. The wrappers report missing optional dependencies at runtime.

## Environment Snapshot

For reproducible local reports:

```bash
python -m pip freeze > setup/frozen-requirements.txt
```

Do not commit local environment snapshots unless they are part of a planned release artifact.
