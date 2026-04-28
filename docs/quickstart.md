# Quickstart

Use this path to verify the package, CLI, toy-data generator, and smoke checks.

## Prerequisites

- Python 3.11+
- Git
- A working C/C++ build toolchain for scientific Python wheels if your platform needs local builds

## Install

```bash
git clone https://github.com/jaswanthmoram/reach-rarecell-benchmark.git
cd reach-rarecell-benchmark
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e '.[dev]'
```

On Windows, activate the environment with `.venv\Scripts\activate`.

## Verify

```bash
rcb --help
pytest -q
ruff check src tests scripts
rcb create-toy-data
rcb smoke-test
```

`rcb create-toy-data` generates a small synthetic dataset in `data/toy/`. Those generated files are ignored by Git.

`rcb smoke-test` checks imports, toy-data creation, configs, metrics, and schemas.

## Local Docker Build

A pre-built GHCR image is available. Pull and run directly:

```bash
docker pull ghcr.io/jaswanthmoram/reach-rarecell-benchmark:latest
docker run --rm ghcr.io/jaswanthmoram/reach-rarecell-benchmark:latest rcb smoke-test
```

Or build locally:

```bash
docker build -t reach-rarecell-benchmark:local .
docker run --rm reach-rarecell-benchmark:local rcb smoke-test
```

## Next Steps

- [Installation](installation.md) for dependency options.
- [Architecture](architecture.md) for the benchmark phases and data contracts.
- [Adding a New Method](adding_new_method.md) to wrap another detector.
