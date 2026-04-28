.PHONY: install test test-cov lint format typecheck clean docs-serve smoke toy figures

install:
	pip install -e '.[dev]'

test:
	pytest -q

test-cov:
	pytest --cov=rarecellbenchmark --cov-fail-under=70 -q

lint:
	ruff check src tests scripts

format:
	ruff format src tests scripts

typecheck:
	mypy src/rarecellbenchmark

clean:
	rm -rf build/ dist/ .pytest_cache
	find . -type d -name "__pycache__" -exec rm -rf {} +

docs-serve:
	mkdocs serve

smoke:
	rcb smoke-test

toy:
	rcb create-toy-data

figures:
	python scripts/generate_figures.py --pipeline --track-design --method-audit --output-dir data/results/figures
