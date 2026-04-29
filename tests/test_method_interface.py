"""Tests for registered method wrappers."""

import importlib
import json
from pathlib import Path

import numpy as np
import pandas as pd
import pytest
import yaml

from rarecellbenchmark.methods.base import validate_predictions
from rarecellbenchmark.methods.registry import METHOD_REGISTRY, list_methods


EXPECTED_INCLUDED_METHODS = {
    "random_baseline",
    "expr_threshold",
    "hvg_logreg",
    "FiRE",
    "DeepScena",
    "RareQ",
    "cellsius",
    "scCAD",
    "scMalignantFinder",
    "CaSee",
}


def test_registry_exposes_all_included_methods() -> None:
    """The publication docs claim 10 included method wrappers."""
    assert set(list_methods()) == EXPECTED_INCLUDED_METHODS


def test_method_config_wrapper_paths_resolve() -> None:
    """Each shipped method YAML should point at an importable wrapper class."""
    for config_path in sorted(Path("configs/methods").glob("*.yaml")):
        if config_path.name == "TEMPLATE_new_method.yaml":
            continue
        config = yaml.safe_load(config_path.read_text())
        module_name, class_name = config["wrapper"].rsplit(".", 1)
        module = importlib.import_module(module_name)
        wrapper_cls = getattr(module, class_name)
        assert wrapper_cls.method_id == config["method_id"]
        assert wrapper_cls.category == config["category"]


@pytest.mark.parametrize("method_id", list(METHOD_REGISTRY.keys()))
def test_method_runs(method_id: str, toy_adata, tmp_path: Path) -> None:
    """Instantiate each registered wrapper, run on toy data, and verify outputs."""
    wrapper_cls = METHOD_REGISTRY[method_id]
    wrapper = wrapper_cls()
    out_dir = tmp_path / method_id

    h5ad_path = tmp_path / "input.h5ad"
    toy_adata.write_h5ad(h5ad_path)

    config = {"unit_id": "toy_unit_01", "seed": 42}

    try:
        wrapper.run(h5ad_path, out_dir, config)
    except (RuntimeError, ImportError) as exc:
        pytest.skip(f"Method {method_id} skipped due to missing dependency: {exc}")

    pred_files = list(out_dir.glob("*_predictions.csv"))
    meta_files = list(out_dir.glob("*_runmeta.json"))

    assert len(pred_files) == 1, f"Expected one predictions file for {method_id}, got {pred_files}"
    assert len(meta_files) == 1, f"Expected one runmeta file for {method_id}, got {meta_files}"

    predictions = pd.read_csv(pred_files[0])
    validate_predictions(predictions, toy_adata)


@pytest.mark.parametrize(
    ("module_name", "class_name", "core_method"),
    [
        ("rarecellbenchmark.methods.ranked.sccad", "ScCADWrapper", "_run_scCAD"),
        (
            "rarecellbenchmark.methods.ranked.scmalignantfinder",
            "ScMalignantFinderWrapper",
            "_run_scMalignantFinder",
        ),
        ("rarecellbenchmark.methods.exploratory.casee", "CaSeeWrapper", "_run_casee"),
    ],
)
def test_ranked_and_exploratory_wrappers_write_standard_outputs(
    module_name: str,
    class_name: str,
    core_method: str,
    toy_adata,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Migrated wrappers should honour the BaseMethodWrapper file contract."""
    module = importlib.import_module(module_name)
    wrapper_cls = getattr(module, class_name)

    def fake_core(self, adata, **kwargs):
        scores = pd.Series(
            np.linspace(0.0, 1.0, adata.n_obs),
            index=adata.obs.index,
            name=self.method_id,
        )
        return scores, {"method_fidelity": "test_stub"}

    monkeypatch.setattr(wrapper_cls, core_method, fake_core)

    h5ad_path = tmp_path / "input.h5ad"
    toy_adata.write_h5ad(h5ad_path)
    out_dir = tmp_path / wrapper_cls.method_id

    result = wrapper_cls().run(
        h5ad_path,
        out_dir,
        {"unit_id": "toy_unit_01", "seed": 7, "timeout": 1},
    )

    assert result.method_id == wrapper_cls.method_id
    assert result.unit_id == "toy_unit_01"
    assert result.status == "success"
    assert result.predictions_path == out_dir / "toy_unit_01_predictions.csv"
    assert result.runmeta_path == out_dir / "toy_unit_01_runmeta.json"

    predictions = pd.read_csv(result.predictions_path)
    validate_predictions(predictions, toy_adata)

    meta = json.loads(result.runmeta_path.read_text())
    assert meta["method_id"] == wrapper_cls.method_id
    assert meta["unit_id"] == "toy_unit_01"
    assert meta["status"] == "success"
    assert meta["seed"] == 7
    assert meta["method_fidelity"] == "test_stub"
