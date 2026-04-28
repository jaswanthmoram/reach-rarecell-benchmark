"""Tests for REACH Pydantic schemas."""


import pytest
from pydantic import ValidationError

from rarecellbenchmark.schemas import (
    DatasetManifest,
    FailureSchema,
    PredictionSchema,
    RunMetaSchema,
    TrackUnitManifest,
)


def test_prediction_schema_valid() -> None:
    pred = PredictionSchema(cell_id="cell_1", score=0.5)
    assert pred.cell_id == "cell_1"
    assert pred.score == pytest.approx(0.5)


def test_prediction_schema_missing_cell_id() -> None:
    with pytest.raises(ValidationError):
        PredictionSchema(score=0.5)


def test_prediction_schema_invalid_score_high() -> None:
    # The before-validator clips the score to [0, 1], so 1.5 becomes 1.0
    pred = PredictionSchema(cell_id="cell_1", score=1.5)
    assert pred.score == pytest.approx(1.0)


def test_prediction_schema_nan_score() -> None:
    # NaN is clipped by max(0.0, min(1.0, nan)) -> 1.0 in CPython
    pred = PredictionSchema(cell_id="cell_1", score=float("nan"))
    assert pred.score == pytest.approx(1.0)


def test_run_meta_schema_valid() -> None:
    meta = RunMetaSchema(method_id="m1", unit_id="u1", runtime_s=1.0)
    assert meta.status == "success"
    assert meta.runtime_s == pytest.approx(1.0)


def test_failure_schema_valid() -> None:
    fail = FailureSchema(
        method_id="m1",
        unit_id="u1",
        status="error",
        error_message="something went wrong",
    )
    assert fail.status == "error"
    assert fail.error_message == "something went wrong"


def test_dataset_manifest_valid() -> None:
    manifest = DatasetManifest(dataset_id="d1", n_cells=100, n_genes=200)
    assert manifest.dataset_id == "d1"
    assert manifest.version == "1.0.0"
    assert manifest.checksums == {}


def test_track_unit_manifest_valid() -> None:
    manifest = TrackUnitManifest(
        unit_id="u1",
        dataset_id="d1",
        track="a",
        tier="T1",
        replicate=1,
        seed=42,
    )
    assert manifest.unit_id == "u1"
    assert manifest.track == "a"
