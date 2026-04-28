"""Smoke test for new method template workflow."""

import importlib.util
import shutil
import sys
from pathlib import Path

import pandas as pd
import pytest

from rarecellbenchmark.methods.base import validate_predictions
from rarecellbenchmark.methods.registry import METHOD_REGISTRY, register


def test_smoke_new_method_template(toy_adata, tmp_path: Path) -> None:
    template_path = Path("src/rarecellbenchmark/methods/TEMPLATE_new_method.py")
    if not template_path.exists():
        pytest.skip("TEMPLATE_new_method.py not found")

    # Copy and rename class / method_id in a temp module
    temp_module_path = tmp_path / "my_method.py"
    shutil.copy(template_path, temp_module_path)
    content = temp_module_path.read_text()
    content = content.replace("class MyMethodWrapper", "class MyNewMethodWrapper")
    content = content.replace('method_id = "my_method"', 'method_id = "my_new_method"')
    temp_module_path.write_text(content)

    spec = importlib.util.spec_from_file_location("my_method_module", temp_module_path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules["my_method_module"] = mod
    spec.loader.exec_module(mod)

    wrapper_cls = mod.MyNewMethodWrapper
    register(wrapper_cls)

    # Ensure cleanup so other tests are not affected
    try:
        wrapper = wrapper_cls()
        h5ad_path = tmp_path / "input.h5ad"
        toy_adata.write_h5ad(h5ad_path)
        out_dir = tmp_path / "my_new_method_output"
        config = {"unit_id": "toy_unit_01", "seed": 42}

        result = wrapper.run(h5ad_path, out_dir, config)

        assert result.predictions_path.exists(), "predictions file missing"
        assert result.runmeta_path.exists(), "runmeta file missing"

        predictions = pd.read_csv(result.predictions_path)
        validate_predictions(predictions, toy_adata)
    finally:
        METHOD_REGISTRY.pop("my_new_method", None)
        sys.modules.pop("my_method_module", None)
