#!/usr/bin/env python3
"""Acceptance criteria checker for REACH repository."""
import subprocess
import sys
from pathlib import Path

REQUIRED_FILES = [
    "README.md",
    "LICENSE",
    "CITATION.cff",
    "pyproject.toml",
    ".github/workflows/ci.yml",
    "docs/benchmark_regeneration.md",
    "docs/adding_new_method.md",
    "docs/assets/architecture.mmd",
    "src/rarecellbenchmark/methods/base.py",
    "src/rarecellbenchmark/methods/TEMPLATE_new_method.py",
    "configs/methods/TEMPLATE_new_method.yaml",
    "data/README.md",
    "tests/smoke/test_smoke_full_toy_pipeline.py",
]


def repo_root() -> Path:
    # Assumes script lives in <repo>/scripts/
    return Path(__file__).resolve().parent.parent


def check_files(root: Path):
    results = {}
    for f in REQUIRED_FILES:
        path = root / f
        exists = path.exists()
        results[f] = exists
    return results


def check_pyproject(root: Path):
    try:
        import tomllib
    except ImportError:
        import tomli as tomllib
    try:
        with open(root / "pyproject.toml", "rb") as f:
            tomllib.load(f)
        return True, "Valid TOML"
    except Exception as e:
        return False, str(e)


def _python_exe(root: Path) -> str:
    """Return the Python executable to use."""
    # Prefer venv python
    venv_python = root / ".venv" / "bin" / "python"
    if venv_python.exists():
        return str(venv_python)
    return sys.executable


def check_rcb_help(root: Path):
    try:
        python = _python_exe(root)
        result = subprocess.run(
            [python, "-m", "rarecellbenchmark.cli", "--help"],
            cwd=root,
            capture_output=True,
            text=True,
            check=True,
        )
        return True, result.stdout.strip()[:200]
    except Exception as e:
        return False, str(e)


def check_create_toy_data(root: Path):
    try:
        python = _python_exe(root)
        result = subprocess.run(
            [python, "scripts/create_toy_data.py"],
            cwd=root,
            capture_output=True,
            text=True,
            check=True,
        )
        return True, result.stdout.strip()[:200]
    except Exception as e:
        return False, str(e)


def check_pytest(root: Path):
    try:
        python = _python_exe(root)
        result = subprocess.run(
            [python, "-m", "pytest", "-q"],
            cwd=root,
            capture_output=True,
            text=True,
        )
        return result.returncode == 0, result.stdout.strip()[-200:] + "\n" + result.stderr.strip()[-200:]
    except Exception as e:
        return False, str(e)


def main():
    root = repo_root()
    print("=" * 60)
    print("REACH Repository Validation")
    print("=" * 60)

    all_pass = True

    # 1. Required files
    file_results = check_files(root)
    print("\n[Required Files]")
    for f, ok in file_results.items():
        status = "PASS" if ok else "FAIL"
        if not ok:
            all_pass = False
        print(f"  [{status}] {f}")

    # 2. pyproject.toml valid
    print("\n[pyproject.toml Valid]")
    ok, msg = check_pyproject(root)
    status = "PASS" if ok else "FAIL"
    if not ok:
        all_pass = False
    print(f"  [{status}] {msg}")

    # 3. rcb --help
    print("\n[CLI rcb --help]")
    ok, msg = check_rcb_help(root)
    status = "PASS" if ok else "FAIL"
    if not ok:
        all_pass = False
    print(f"  [{status}] {msg}")

    # 4. create_toy_data.py
    print("\n[Create Toy Data]")
    ok, msg = check_create_toy_data(root)
    status = "PASS" if ok else "FAIL"
    if not ok:
        all_pass = False
    print(f"  [{status}] {msg}")

    # 5. pytest
    print("\n[Pytest -q]")
    ok, msg = check_pytest(root)
    status = "PASS" if ok else "FAIL"
    if not ok:
        all_pass = False
    print(f"  [{status}] {msg}")

    print("\n" + "=" * 60)
    if all_pass:
        print("OVERALL: PASS")
        sys.exit(0)
    else:
        print("OVERALL: FAIL")
        sys.exit(1)


if __name__ == "__main__":
    main()
