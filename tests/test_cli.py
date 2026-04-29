"""Tests for REACH CLI."""

from pathlib import Path

import pandas as pd
from typer.testing import CliRunner

from rarecellbenchmark import __version__
from rarecellbenchmark.cli import app

runner = CliRunner()


def test_cli_help() -> None:
    result = runner.invoke(app, ["--help"])
    assert result.exit_code == 0
    assert "REACH" in result.output


def test_cli_version() -> None:
    result = runner.invoke(app, ["--version"])
    assert result.exit_code == 0
    assert __version__ in result.output


def test_cli_init() -> None:
    result = runner.invoke(app, ["init"])
    assert result.exit_code == 0
    assert "Initialization complete" in result.output


def test_run_track_accepts_lowercase_track(monkeypatch, tmp_path: Path) -> None:
    """The README advertises lowercase track IDs such as ``--track a``."""
    from rarecellbenchmark import tracks

    calls = {}

    class DummyTrackGenerator:
        def generate(self, dataset_id, processed_h5ad, out_dir, config):
            calls["dataset_id"] = dataset_id
            calls["processed_h5ad"] = processed_h5ad
            calls["out_dir"] = out_dir
            calls["config"] = config
            unit = out_dir / "unit_manifest.json"
            unit.write_text("{}")
            return [unit]

    monkeypatch.setitem(tracks.TRACK_GENERATORS, "A", DummyTrackGenerator)
    processed_h5ad = tmp_path / "processed.h5ad"
    processed_h5ad.write_text("placeholder")
    output_dir = tmp_path / "tracks"

    result = runner.invoke(
        app,
        [
            "run-track",
            "--track",
            "a",
            "--processed-h5ad",
            str(processed_h5ad),
            "--output-dir",
            str(output_dir),
        ],
    )

    assert result.exit_code == 0, result.output
    assert calls["dataset_id"] == "unknown"
    assert calls["processed_h5ad"] == processed_h5ad
    assert calls["out_dir"] == output_dir
    assert "Track A: generated 1 unit(s)" in result.output


def test_figures_all_loads_public_result_tables(monkeypatch, tmp_path: Path) -> None:
    """The advertised figures command should work from tracked public CSVs."""
    import rarecellbenchmark.cli as cli
    import rarecellbenchmark.figures as fig_module

    tables_dir = tmp_path / "data" / "results" / "tables" / "phase11"
    snapshot_dir = tmp_path / "data" / "results" / "snapshots" / "paper_v1"
    tables_dir.mkdir(parents=True)
    snapshot_dir.mkdir(parents=True)

    pd.DataFrame(
        {"method_id": ["m1", "m2"], "mean_ap": [0.2, 0.8]}
    ).to_csv(tables_dir / "leaderboard.csv", index=False)
    pd.DataFrame(
        {"method_id": ["m1", "m2"], "n_cells": [100, 200], "runtime_seconds": [1.0, 2.0]}
    ).to_csv(snapshot_dir / "results_per_unit.csv", index=False)

    calls = []

    def fake_plot_leaderboard(leaderboard_df, out_path):
        calls.append(("leaderboard", list(leaderboard_df["method_id"])))
        out_path.write_text("leaderboard")

    def fake_plot_runtime_comparison(runtime_df, out_path):
        calls.append(("runtime", list(runtime_df["method_id"])))
        out_path.write_text("runtime")

    monkeypatch.setattr(cli, "REPO_ROOT", tmp_path)
    monkeypatch.setattr(fig_module, "plot_leaderboard", fake_plot_leaderboard)
    monkeypatch.setattr(fig_module, "plot_runtime_comparison", fake_plot_runtime_comparison)

    output_dir = tmp_path / "figures"
    result = runner.invoke(app, ["figures", "--all", "--output-dir", str(output_dir)])

    assert result.exit_code == 0, result.output
    assert (output_dir / "leaderboard.png").exists()
    assert (output_dir / "runtime.png").exists()
    assert calls == [("leaderboard", ["m1", "m2"]), ("runtime", ["m1", "m2"])]


def test_evaluate_uses_labels_to_write_metrics(tmp_path: Path) -> None:
    """Evaluation should compute AP/AUROC/top-k metrics, not score summaries."""
    predictions_dir = tmp_path / "predictions" / "expr_threshold"
    labels_dir = tmp_path / "labels"
    predictions_dir.mkdir(parents=True)
    labels_dir.mkdir()

    pd.DataFrame(
        {
            "cell_id": ["cell_0", "cell_1", "cell_2", "cell_3"],
            "score": [0.9, 0.8, 0.2, 0.1],
        }
    ).to_csv(predictions_dir / "toy_unit_01_predictions.csv", index=False)
    pd.DataFrame(
        {
            "cell_id": ["cell_0", "cell_1", "cell_2", "cell_3"],
            "y_true": [1, 0, 1, 0],
        }
    ).to_parquet(labels_dir / "toy_unit_01_labels.parquet")

    output_file = tmp_path / "metrics.csv"
    result = runner.invoke(
        app,
        [
            "evaluate",
            "--track",
            "a",
            "--predictions-dir",
            str(tmp_path / "predictions"),
            "--labels-dir",
            str(labels_dir),
            "--output",
            str(output_file),
        ],
    )

    assert result.exit_code == 0, result.output
    metrics = pd.read_csv(output_file)
    assert metrics.loc[0, "method_id"] == "expr_threshold"
    assert metrics.loc[0, "unit_id"] == "toy_unit_01"
    assert metrics.loc[0, "ap"] > 0
    assert metrics.loc[0, "auroc"] > 0
    assert "score_mean" not in metrics.columns


def test_evaluate_requires_labels_when_predictions_are_present(tmp_path: Path) -> None:
    predictions_dir = tmp_path / "predictions"
    predictions_dir.mkdir()
    pd.DataFrame({"cell_id": ["cell_0"], "score": [0.5]}).to_csv(
        predictions_dir / "toy_unit_01_predictions.csv",
        index=False,
    )

    result = runner.invoke(
        app,
        [
            "evaluate",
            "--track",
            "a",
            "--predictions-dir",
            str(predictions_dir),
        ],
    )

    assert result.exit_code == 1
    assert "Evaluation requires label files" in result.output
