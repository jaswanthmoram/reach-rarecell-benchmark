"""REACH CLI built with Typer."""

from __future__ import annotations

import json
import traceback
from pathlib import Path
from typing import Optional

import typer

from rarecellbenchmark import __version__
from rarecellbenchmark.constants import PROJECT_NAME, REPO_ROOT, TRACKS
from rarecellbenchmark.logging import setup_logging

app = typer.Typer(
    name="rcb",
    help=f"{PROJECT_NAME} - reproducible benchmark for rare malignant cell detection in scRNA-seq data.",
    no_args_is_help=True,
    add_completion=False,
)


def _version_callback(value: bool) -> None:
    if value:
        typer.echo(f"{PROJECT_NAME} {__version__}")
        raise typer.Exit()


@app.callback()
def main(
    version: Optional[bool] = typer.Option(
        None, "--version", "-v", callback=_version_callback, is_eager=True, help="Show version and exit."
    ),
    verbose: bool = typer.Option(False, "--verbose", "-V", help="Enable verbose logging."),
) -> None:
    """REACH command-line interface."""
    setup_logging("DEBUG" if verbose else "INFO")


# ─────────────────────────────────────────────────────────────────────────────
# init
# ─────────────────────────────────────────────────────────────────────────────

@app.command()
def init() -> None:
    """Create necessary directories for the benchmark."""
    dirs = [
        REPO_ROOT / "data" / "raw",
        REPO_ROOT / "data" / "processed",
        REPO_ROOT / "data" / "validation",
        REPO_ROOT / "data" / "tracks",
        REPO_ROOT / "data" / "predictions",
        REPO_ROOT / "data" / "results",
        REPO_ROOT / "data" / "toy",
        REPO_ROOT / "figures",
        REPO_ROOT / "logs",
        REPO_ROOT / "configs",
    ]
    for d in dirs:
        d.mkdir(parents=True, exist_ok=True)
        typer.echo(f"Ensured directory: {d}")
    typer.echo("Initialization complete.")


# ─────────────────────────────────────────────────────────────────────────────
# create-toy-data
# ─────────────────────────────────────────────────────────────────────────────

@app.command(name="create-toy-data")
def create_toy_data(
    n_cells: int = typer.Option(300, "--n-cells", help="Number of cells."),
    n_genes: int = typer.Option(200, "--n-genes", help="Number of genes."),
    n_positive: int = typer.Option(50, "--n-positive", help="Number of malignant cells."),
    out_dir: Path = typer.Option(REPO_ROOT / "data" / "toy", "--out-dir", help="Output directory."),
    seed: int = typer.Option(42, "--seed", help="Random seed."),
) -> None:
    """Generate toy data in data/toy/."""
    import numpy as np
    import pandas as pd

    try:
        import anndata as ad
    except ImportError as exc:
        typer.echo(f"Error: anndata is required for create-toy-data: {exc}", err=True)
        raise typer.Exit(1)

    rng = np.random.default_rng(seed)

    # Positive cells: elevated expression in first 20 genes
    X_pos = rng.poisson(5.0, size=(n_positive, n_genes)).astype(float)
    X_pos[:, :20] += rng.poisson(10.0, size=(n_positive, 20))

    # Background cells: baseline expression
    X_neg = rng.poisson(2.0, size=(n_cells - n_positive, n_genes)).astype(float)
    X = np.vstack([X_pos, X_neg])

    obs = pd.DataFrame(
        {
            "cell_type": ["Malignant cells"] * n_positive + ["T cells"] * (n_cells - n_positive),
            "patient_id": ["P1"] * (n_cells // 2) + ["P2"] * (n_cells - n_cells // 2),
            "malignant_raw": ["1"] * n_positive + ["0"] * (n_cells - n_positive),
            "dataset_id": ["toy"] * n_cells,
            "batch": ["P1"] * n_cells,
        },
        index=pd.Index([f"cell_{i}" for i in range(n_cells)], dtype=object),
    )
    for col in obs.columns:
        if obs[col].dtype.name in ("str", "string", "object"):
            obs[col] = obs[col].astype(object)

    var = pd.DataFrame(
        {
            "gene_symbol": [f"GENE{i}" for i in range(n_genes)],
            "chromosome": ["chr1"] * n_genes,
            "start": np.arange(n_genes) * 1000,
            "end": np.arange(n_genes) * 1000 + 1000,
        },
        index=pd.Index([f"GENE{i}" for i in range(n_genes)], dtype=object),
    )
    for col in var.columns:
        if var[col].dtype.name in ("str", "string", "object"):
            var[col] = var[col].astype(object)

    adata = ad.AnnData(X=X, obs=obs, var=var)
    adata.layers["counts"] = X.copy()
    adata.layers["log1p_norm"] = np.log1p(X / X.sum(axis=1, keepdims=True) * 1e4)

    # PCA
    try:
        from sklearn.decomposition import PCA

        pca = PCA(n_components=10, random_state=seed)
        adata.obsm["X_pca"] = pca.fit_transform(adata.layers["log1p_norm"])
    except ImportError:
        adata.obsm["X_pca"] = np.zeros((n_cells, 10))

    adata.uns["rarecellbenchmark"] = {
        "version": "1.0.0",
        "dataset_id": "toy",
    }

    out_dir.mkdir(parents=True, exist_ok=True)
    h5ad_path = out_dir / "toy_expression.h5ad"
    labels_path = out_dir / "toy_labels.parquet"
    manifest_path = out_dir / "toy_manifest.json"

    adata.write_h5ad(h5ad_path)

    labels = pd.DataFrame(
        {
            "cell_id": adata.obs_names,
            "y_true": [1] * n_positive + [0] * (n_cells - n_positive),
            "tier": ["T1"] * n_cells,
            "positive_class": ["Malignant cells"] * n_positive + ["None"] * (n_cells - n_positive),
            "background_class": ["None"] * n_positive + ["T cells"] * (n_cells - n_positive),
        }
    )
    labels.to_parquet(labels_path)

    manifest = {
        "dataset_id": "toy",
        "track": "a",
        "tier": "T1",
        "replicate": 1,
        "prevalence": n_positive / n_cells,
        "seed": seed,
        "n_cells": n_cells,
        "n_genes": n_genes,
    }
    manifest_path.write_text(json.dumps(manifest, indent=2))

    typer.echo(f"Created toy data ({n_cells} cells x {n_genes} genes) at {out_dir}")
    typer.echo(f"  - {h5ad_path}")
    typer.echo(f"  - {labels_path}")
    typer.echo(f"  - {manifest_path}")


# ─────────────────────────────────────────────────────────────────────────────
# run-phase
# ─────────────────────────────────────────────────────────────────────────────

@app.command(name="run-phase")
def run_phase(
    phase: int = typer.Option(..., "--phase", help="Phase number to run."),
    dataset: Optional[str] = typer.Option(None, "--dataset", help="Dataset ID to process."),
) -> None:
    """Run a specific phase of the benchmark pipeline."""
    typer.echo(
        f"Phase {phase} execution requires benchmark data that is not bundled with "
        "this source checkout. Download data archives from Zenodo:\n"
        "  Processed datasets:  https://doi.org/10.5281/zenodo.19850652\n"
        "  Track units A-C:      https://doi.org/10.5281/zenodo.19850972\n"
        "  Track units D-E:      https://doi.org/10.5281/zenodo.19851287\n"
        "  Complete results:     https://doi.org/10.5281/zenodo.19851710\n"
        "See docs/benchmark_regeneration.md for detailed instructions."
    )
    raise typer.Exit(1)


# ─────────────────────────────────────────────────────────────────────────────
# run-track
# ─────────────────────────────────────────────────────────────────────────────

@app.command(name="run-track")
def run_track(
    track: str = typer.Option(..., "--track", help=f"Track to generate ({', '.join(TRACKS)})."),
    dataset: Optional[str] = typer.Option(None, "--dataset", help="Dataset ID to process."),
    processed_h5ad: Optional[Path] = typer.Option(None, "--processed-h5ad", exists=True, help="Path to processed .h5ad with tier assignments."),
    output_dir: Optional[Path] = typer.Option(None, "--output-dir", help="Output directory for generated units."),
) -> None:
    """Run track generation for a given track."""
    track = track.lower()
    if track not in TRACKS:
        typer.echo(f"Error: track must be one of {TRACKS}", err=True)
        raise typer.Exit(1)

    if processed_h5ad is None:
        typer.echo(
            "Track generation requires a processed .h5ad file with tier assignments.\n"
            "  Usage: rcb run-track --track a --processed-h5ad data/processed/my_dataset.h5ad\n"
            "  Data: Download processed datasets from Zenodo: https://doi.org/10.5281/zenodo.19850652",
            err=True,
        )
        raise typer.Exit(1)

    from rarecellbenchmark.tracks import TRACK_GENERATORS

    generator_key = track.upper()
    try:
        gen_cls = TRACK_GENERATORS[generator_key]
    except KeyError:
        typer.echo(f"Error: no generator for track '{track}'", err=True)
        raise typer.Exit(1)

    output_dir = output_dir or REPO_ROOT / "data" / "tracks" / track
    output_dir.mkdir(parents=True, exist_ok=True)
    config = {"global_seed": 42, "n_replicates": 5}
    generator = gen_cls()
    units = generator.generate(dataset or "unknown", processed_h5ad, output_dir, config)
    typer.echo(f"Track {track.upper()}: generated {len(units)} unit(s)")
    for u in units[:5]:
        typer.echo(f"  {u.name}")


# ─────────────────────────────────────────────────────────────────────────────
# run-method
# ─────────────────────────────────────────────────────────────────────────────

@app.command(name="run-method")
def run_method(
    method: str = typer.Option(..., "--method", help="Method ID to run."),
    unit_id: str = typer.Option(..., "--unit-id", help="Track unit ID to run on."),
    input_h5ad: Path = typer.Option(..., "--input", exists=True, dir_okay=False, readable=True, help="Path to unit expression .h5ad file."),
    output_dir: Optional[Path] = typer.Option(None, "--output-dir", help="Output directory (default: data/predictions/<method>)."),
    seed: int = typer.Option(42, "--seed", help="Random seed."),
) -> None:
    """Run one method on one track unit."""
    from rarecellbenchmark.methods.registry import get_method

    try:
        wrapper_cls = get_method(method)
    except KeyError:
        from rarecellbenchmark.methods.registry import list_methods
        typer.echo(f"Error: method '{method}' not found. Available: {list_methods()}", err=True)
        raise typer.Exit(1)

    output_dir = output_dir or REPO_ROOT / "data" / "predictions" / method
    output_dir.mkdir(parents=True, exist_ok=True)

    wrapper = wrapper_cls()
    result = wrapper.run(input_h5ad, output_dir, {"unit_id": unit_id, "seed": seed})
    typer.echo(f"Method '{method}' completed on unit '{unit_id}': {result.status}")
    typer.echo(f"  Predictions: {result.predictions_path}")
    typer.echo(f"  Run meta:    {result.runmeta_path}")


# ─────────────────────────────────────────────────────────────────────────────
# evaluate
# ─────────────────────────────────────────────────────────────────────────────

@app.command()
def evaluate(
    track: str = typer.Option(..., "--track", help=f"Track to evaluate ({', '.join(TRACKS)})."),
    method: Optional[str] = typer.Option(None, "--method", help="Optional method ID filter."),
    predictions_dir: Optional[Path] = typer.Option(None, "--predictions-dir", exists=True, help="Path to predictions directory."),
    labels_dir: Optional[Path] = typer.Option(None, "--labels-dir", exists=True, file_okay=False, dir_okay=True, help="Path to label parquet files."),
    output_file: Optional[Path] = typer.Option(None, "--output", help="Path to write metrics CSV."),
) -> None:
    """Evaluate predictions for a track."""
    track = track.lower()
    if track not in TRACKS:
        typer.echo(f"Error: track must be one of {TRACKS}", err=True)
        raise typer.Exit(1)

    if predictions_dir is None:
        typer.echo(
            "Evaluation requires prediction files and label files.\n"
            "  Usage: rcb evaluate --track a --predictions-dir data/predictions/\n"
            "  Or use scripts/evaluate_results.py for script-based evaluation.\n"
            "  Data: Download results from Zenodo: https://doi.org/10.5281/zenodo.19851710",
            err=True,
        )
        raise typer.Exit(1)

    if labels_dir is None:
        typer.echo(
            "Evaluation requires label files.\n"
            "  Usage: rcb evaluate --track a --predictions-dir data/predictions/ --labels-dir data/tracks/a/\n"
            "  Labels are stored externally with track units in the Zenodo archives.",
            err=True,
        )
        raise typer.Exit(1)

    import json

    import pandas as pd

    from rarecellbenchmark.evaluate.metrics import evaluate_predictions

    def _unit_id_from_prediction(path: Path) -> str:
        return path.stem.removesuffix("_predictions")

    def _method_id_from_prediction(path: Path) -> str:
        if method is not None:
            return method
        if path.parent != predictions_dir:
            return path.parent.name
        return "unknown"

    def _find_labels(unit_id: str) -> Path:
        candidates = [
            labels_dir / f"{unit_id}_labels.parquet",
            labels_dir / f"{unit_id}.parquet",
        ]
        for candidate in candidates:
            if candidate.exists():
                return candidate
        recursive_matches = sorted(labels_dir.rglob(f"{unit_id}_labels.parquet"))
        if recursive_matches:
            return recursive_matches[0]
        raise FileNotFoundError(f"No labels parquet found for unit '{unit_id}' in {labels_dir}")

    def _load_run_meta(prediction_path: Path, unit_id: str) -> dict:
        candidates = [
            prediction_path.with_name(f"{unit_id}_runmeta.json"),
            prediction_path.with_name(f"{unit_id}_run_meta.json"),
        ]
        for candidate in candidates:
            if candidate.exists():
                return json.loads(candidate.read_text())
        return {}

    # Collect predictions from directory
    pred_files = sorted(predictions_dir.rglob("*_predictions.csv"))
    if method is not None:
        pred_files = [
            path for path in pred_files
            if path.parent.name == method or path.stem.startswith(f"{method}_")
        ]
    if not pred_files:
        typer.echo(f"Error: no prediction files found in {predictions_dir}", err=True)
        raise typer.Exit(1)

    typer.echo(f"Found {len(pred_files)} prediction file(s)")

    rows = []
    for pred_path in pred_files:
        unit_id = _unit_id_from_prediction(pred_path)
        try:
            labels_path = _find_labels(unit_id)
        except FileNotFoundError as exc:
            typer.echo(f"Error: {exc}", err=True)
            raise typer.Exit(1)
        run_meta = {
            "method_id": _method_id_from_prediction(pred_path),
            "unit_id": unit_id,
            "track": track.upper(),
            **_load_run_meta(pred_path, unit_id),
        }
        rows.append(evaluate_predictions(pred_path, labels_path, run_meta=run_meta))

    summary = pd.DataFrame(rows)
    output_file = output_file or REPO_ROOT / "data" / "results" / f"eval_{track}_summary.csv"
    output_file.parent.mkdir(parents=True, exist_ok=True)
    summary.to_csv(output_file, index=False)
    typer.echo(f"Evaluation metrics written to {output_file}")
    metric_cols = [c for c in ["ap", "auroc", "precision_at_k", "recall_at_k", "f1_at_k"] if c in summary.columns]
    if metric_cols:
        typer.echo(summary[metric_cols].describe().to_string())


# ─────────────────────────────────────────────────────────────────────────────
# figures
# ─────────────────────────────────────────────────────────────────────────────

@app.command()
def figures(
    all_flag: bool = typer.Option(False, "--all", help="Generate all figures."),
    leaderboard: bool = typer.Option(False, "--leaderboard", help="Generate leaderboard figure."),
    runtime: bool = typer.Option(False, "--runtime", help="Generate runtime figure."),
    output_dir: Path = typer.Option(REPO_ROOT / "data" / "results" / "figures", "--output-dir", help="Output directory."),
) -> None:
    """Generate publication figures."""
    if not any([all_flag, leaderboard, runtime]):
        typer.echo("Error: specify at least one of --all, --leaderboard, --runtime", err=True)
        raise typer.Exit(1)

    try:
        import pandas as pd

        from rarecellbenchmark import figures as fig_module
        output_dir.mkdir(parents=True, exist_ok=True)
        if all_flag or leaderboard:
            leaderboard_path = REPO_ROOT / "data" / "results" / "tables" / "phase11" / "leaderboard.csv"
            if not leaderboard_path.exists():
                typer.echo(f"Missing leaderboard table: {leaderboard_path}", err=True)
                raise typer.Exit(1)
            leaderboard_df = pd.read_csv(leaderboard_path)
            out_path = output_dir / "leaderboard.png"
            fig_module.plot_leaderboard(leaderboard_df, out_path)
            typer.echo(f"  Generated: {out_path}")
        if all_flag or runtime:
            runtime_path = REPO_ROOT / "data" / "results" / "snapshots" / "paper_v1" / "results_per_unit.csv"
            if not runtime_path.exists():
                typer.echo(f"Missing runtime source table: {runtime_path}", err=True)
                raise typer.Exit(1)
            runtime_df = pd.read_csv(runtime_path)
            out_path = output_dir / "runtime.png"
            fig_module.plot_runtime_comparison(runtime_df, out_path)
            typer.echo(f"  Generated: {out_path}")
        typer.echo("Figures complete.")
    except Exception as exc:
        typer.echo(f"Cannot generate data-driven figures: {exc}", err=True)
        typer.echo("Use scripts/generate_figures.py for schematic figures (--pipeline --track-design --method-audit).")
        raise typer.Exit(1)


# ─────────────────────────────────────────────────────────────────────────────
# smoke-test
# ─────────────────────────────────────────────────────────────────────────────

@app.command(name="smoke-test")
def smoke_test(
    method: Optional[str] = typer.Option(None, "--method", help="Optional method ID to test."),
) -> None:
    """Run smoke tests to verify the installation and core functionality."""
    import logging

    logger = logging.getLogger(__name__)
    setup_logging("INFO")

    passed: list[str] = []
    failed: list[str] = []
    skipped: list[str] = []

    def _check(name: str, fn, *args, **kwargs):
        try:
            fn(*args, **kwargs)
            passed.append(name)
            logger.info(f"  ✓ {name}")
        except ImportError as exc:
            skipped.append(name)
            logger.warning(f"  ⊘ {name} - SKIPPED (missing dep: {exc})")
        except Exception as exc:
            failed.append(name)
            logger.error(f"  ✗ {name} - FAILED: {exc}")
            traceback.print_exc()

    def _test_imports():
        import importlib

        modules = [
            "rarecellbenchmark",
            "rarecellbenchmark.cli",
            "rarecellbenchmark.config",
            "rarecellbenchmark.constants",
            "rarecellbenchmark.logging",
            "rarecellbenchmark.schemas",
        ]
        for mod in modules:
            importlib.import_module(mod)

    def _test_toy_data(tmp_path: Path):
        create_toy_data(n_cells=100, n_genes=50, n_positive=20, out_dir=tmp_path, seed=42)
        assert (tmp_path / "toy_expression.h5ad").exists()
        assert (tmp_path / "toy_labels.parquet").exists()
        assert (tmp_path / "toy_manifest.json").exists()

    def _test_configs():
        import yaml

        datasets_yaml = REPO_ROOT / "configs" / "datasets.yaml"
        if datasets_yaml.exists():
            with open(datasets_yaml) as fh:
                cfg = yaml.safe_load(fh)
            assert "datasets" in cfg
        protocol_yaml = REPO_ROOT / "configs" / "protocol_version.yaml"
        if protocol_yaml.exists():
            with open(protocol_yaml) as fh:
                cfg = yaml.safe_load(fh)
            assert "tracks" in cfg

    def _test_metrics():
        import numpy as np

        from rarecellbenchmark.schemas import PredictionSchema

        preds = [
            PredictionSchema(cell_id="cell_0", score=0.9),
            PredictionSchema(cell_id="cell_1", score=0.1),
        ]
        assert len(preds) == 2

        y_true = np.array([1, 1, 1, 0, 0, 0, 0, 0, 0, 0])
        y_score = np.array([1.0, 0.9, 0.8, 0.3, 0.2, 0.1, 0.05, 0.04, 0.03, 0.01])

        # Basic AUROC sanity check
        try:
            from sklearn.metrics import roc_auc_score

            assert roc_auc_score(y_true, y_score) > 0.99
        except ImportError:
            pass

    typer.echo("\n" + "=" * 60)
    typer.echo(f"{PROJECT_NAME} - Smoke Test Suite")
    typer.echo("=" * 60)

    tests = [
        ("Import core modules", _test_imports),
        ("Create toy data", lambda: _test_toy_data(Path("/tmp/rcb_smoke_toy"))),
        ("Validate configs", _test_configs),
        ("Metrics & schemas", _test_metrics),
    ]

    for name, fn in tests:
        _check(name, fn)

    if method:
        typer.echo(f"\nNote: per-method smoke testing for '{method}' not yet implemented in CLI.")

    typer.echo("\n" + "=" * 60)
    typer.echo(f"RESULTS: {len(passed)} passed, {len(failed)} failed, {len(skipped)} skipped")
    typer.echo("=" * 60)

    if failed:
        raise typer.Exit(1)
    typer.echo("✓ All smoke tests passed")


# ─────────────────────────────────────────────────────────────────────────────
# verify-checksums
# ─────────────────────────────────────────────────────────────────────────────

@app.command(name="verify-checksums")
def verify_checksums(
    dataset: str = typer.Option(..., "--dataset", help="Dataset ID to verify."),
) -> None:
    """Verify dataset checksums against the registry."""
    typer.echo(
        "Checksum verification requires external dataset files. Expected checksums "
        "and provenance fields are documented in configs/datasets.yaml."
    )
    raise typer.Exit(1)


# ─────────────────────────────────────────────────────────────────────────────
# freeze-leaderboard
# ─────────────────────────────────────────────────────────────────────────────

@app.command(name="freeze-leaderboard")
def freeze_leaderboard(
    tag: str = typer.Option(..., "--tag", help="Tag for the leaderboard snapshot."),
) -> None:
    """Freeze a leaderboard snapshot."""
    typer.echo(
        "Leaderboard freezing requires generated evaluation outputs. The public "
        "repository includes lightweight snapshot CSVs in data/results/snapshots/."
    )
    raise typer.Exit(1)


if __name__ == "__main__":
    app()
