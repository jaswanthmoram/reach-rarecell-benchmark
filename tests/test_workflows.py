"""Tests for reproducibility workflow entrypoints."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import yaml


def test_phase11_statistics_regenerates_from_snapshots(tmp_path: Path) -> None:
    output_dir = tmp_path / "phase11"
    result = subprocess.run(
        [
            sys.executable,
            "scripts/phase11_statistics.py",
            "--from-snapshots",
            "--output-dir",
            str(output_dir),
            "--no-compat-copy",
        ],
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr + result.stdout
    assert (output_dir / "leaderboard.csv").exists()
    assert (output_dir / "rank_ci.csv").exists()
    assert (output_dir / "global_tests.csv").exists()


def test_run_methods_dry_run_discovers_unit_manifests(tmp_path: Path) -> None:
    units_dir = tmp_path / "units"
    units_dir.mkdir()
    manifest_path = units_dir / "toy_unit_01_manifest.json"
    manifest_path.write_text(
        '{"unit_id": "toy_unit_01", "expression_path": "toy_expression.h5ad"}',
        encoding="utf-8",
    )

    result = subprocess.run(
        [
            sys.executable,
            "scripts/run_methods.py",
            "--methods",
            "random_baseline",
            "--units-dir",
            str(units_dir),
            "--output-dir",
            str(tmp_path / "predictions"),
            "--dry-run",
        ],
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr + result.stdout
    assert "random_baseline" in result.stdout
    assert "toy_unit_01" in result.stdout


def test_dvc_commands_reference_existing_scripts() -> None:
    config = yaml.safe_load(Path("dvc.yaml").read_text())
    for stage_name, stage in config["stages"].items():
        cmd = stage["cmd"]
        assert "scripts/" in cmd, f"{stage_name} command should use a repo script: {cmd}"
        script = cmd.split()[1]
        assert Path(script).exists(), f"{stage_name} references missing script {script}"


def test_snakefile_uses_snapshot_public_targets() -> None:
    text = Path("Snakefile").read_text()
    assert "data/results/snapshots/paper_v1/results_per_unit.csv" in text
    assert "data/results/all_metrics.parquet" not in text
