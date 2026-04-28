# Contributing to REACH Benchmark

Thank you for your interest in contributing!

## How to Report Bugs

Please use [GitHub Issues](../../issues) and select the **bug_report** template.  
Include a minimal reproducible example, expected vs. actual behavior, and your environment details.

## How to Request a New Method

Open a [GitHub Issue](../../issues) using the **method_request** template.  
Describe the method, provide references, and note any special dependencies or licensing constraints.

## How to Request a New Dataset

Open a [GitHub Issue](../../issues) using the **dataset_request** template.  
Include the data source, expected size, relevant metadata, and access instructions.

## Development Setup

```bash
pip install -e '.[dev]'
```

## Running Tests

```bash
pytest -q
```

## Code Style

We use **ruff** for linting/formatting and **mypy** for static type checking.  
Please ensure your changes pass both before opening a pull request:

```bash
ruff check src tests scripts
mypy src/rarecellbenchmark
```

## Branch Naming

- `feature/...` - new features or enhancements
- `fix/...` - bug fixes
- `docs/...` - documentation updates

## Pull Request Checklist

- [ ] Tests pass locally (`pytest -q`)
- [ ] Linting passes (`ruff check src tests scripts`)
- [ ] Type checks pass (`mypy src/rarecellbenchmark`)
- [ ] Smoke test passes (`rcb smoke-test`)
- [ ] Docstrings updated for new public APIs
- [ ] CHANGELOG.md updated if applicable
- [ ] Branch is up to date with the main branch before requesting review
