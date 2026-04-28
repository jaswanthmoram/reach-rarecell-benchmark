"""REACH data-contract schemas (Pydantic v2)."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Literal, Optional

import pandas as pd
from pydantic import BaseModel, Field, field_validator, model_validator


# ---------------------------------------------------------------------------
# Dataset manifest
# ---------------------------------------------------------------------------

class DatasetManifest(BaseModel):
    """Manifest describing a processed dataset asset."""

    dataset_id: str = Field(..., description="Unique dataset identifier.")
    n_cells: int = Field(..., ge=1, description="Number of cells.")
    n_genes: int = Field(..., ge=1, description="Number of genes.")
    checksums: dict[str, str] = Field(default_factory=dict, description="Filename -> SHA-256 mapping.")
    version: str = Field(default="1.0.0")
    created_at: Optional[str] = Field(default=None)
    notes: Optional[str] = Field(default=None)

    @field_validator("checksums", mode="before")
    @classmethod
    def _coerce_none(cls, v: Any) -> Any:
        if v is None:
            return {}
        return v


# ---------------------------------------------------------------------------
# Track unit manifest
# ---------------------------------------------------------------------------

class TrackUnitManifest(BaseModel):
    """Manifest describing a single track unit (dataset × track × tier × replicate)."""

    unit_id: str = Field(..., description="Globally unique unit identifier.")
    dataset_id: str = Field(...)
    track: str = Field(..., pattern=r"^[a-e]$", description="Track letter.")
    tier: str = Field(..., description="Tier identifier, e.g. T1, T2, U_obs.")
    replicate: int = Field(..., ge=1, description="Replicate number.")
    prevalence: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    seed: int = Field(..., ge=0)
    hashes: dict[str, str] = Field(default_factory=dict, description="Filename -> SHA-256 mapping.")
    status: Literal["success", "skipped", "failed"] = Field(default="success")
    out_dir: Optional[str] = Field(default=None)

    @field_validator("hashes", mode="before")
    @classmethod
    def _coerce_none(cls, v: Any) -> Any:
        if v is None:
            return {}
        return v

    @model_validator(mode="after")
    def _derive_unit_id(self) -> "TrackUnitManifest":
        if not self.unit_id:
            self.unit_id = (
                f"{self.dataset_id}_track_{self.track}_{self.tier}_rep{self.replicate:02d}"
            )
        return self


# ---------------------------------------------------------------------------
# Prediction schema
# ---------------------------------------------------------------------------

class PredictionSchema(BaseModel):
    """Single-row prediction output for a cell."""

    cell_id: str = Field(..., description="Cell identifier.")
    score: float = Field(..., ge=0.0, le=1.0, description="Malignancy score.")

    @field_validator("score", mode="before")
    @classmethod
    def _clip_score(cls, v: float) -> float:
        return float(max(0.0, min(1.0, v)))


class PredictionManifest(BaseModel):
    """Collection of predictions with metadata."""

    method_id: str = Field(...)
    unit_id: str = Field(...)
    predictions: list[PredictionSchema] = Field(default_factory=list)
    created_at: Optional[str] = Field(default=None)

    @field_validator("predictions", mode="before")
    @classmethod
    def _coerce_none(cls, v: Any) -> Any:
        if v is None:
            return []
        return v


# ---------------------------------------------------------------------------
# Run metadata schema
# ---------------------------------------------------------------------------

class RunMetaSchema(BaseModel):
    """Metadata for a successful method run."""

    method_id: str = Field(...)
    unit_id: str = Field(...)
    status: Literal["success"] = Field(default="success")
    runtime_s: float = Field(..., ge=0.0)
    peak_memory_mb: Optional[float] = Field(default=None, ge=0.0)
    device: Literal["cpu", "cuda", "mps", "unknown"] = Field(default="unknown")
    seed: int = Field(default=42)
    method_version: Optional[str] = Field(default=None)
    wrapper_version: Optional[str] = Field(default=None)
    input_hash: Optional[str] = Field(default=None)
    output_hash: Optional[str] = Field(default=None)
    timestamp: Optional[str] = Field(default=None)
    notes: Optional[str] = Field(default=None)


# ---------------------------------------------------------------------------
# Failure schema
# ---------------------------------------------------------------------------

class FailureSchema(BaseModel):
    """Metadata for a failed method run."""

    method_id: str = Field(...)
    unit_id: str = Field(...)
    status: Literal["timeout", "error", "oom", "crash"] = Field(...)
    error_type: Optional[str] = Field(default=None)
    error_message: str = Field(default="")
    traceback: Optional[str] = Field(default=None)
    runtime_s: Optional[float] = Field(default=None, ge=0.0)
    peak_memory_mb: Optional[float] = Field(default=None, ge=0.0)
    fallback_generated: bool = Field(default=False)
    timestamp: Optional[str] = Field(default=None)
    notes: Optional[str] = Field(default=None)


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------

def validate_predictions_csv(path: Path | str) -> pd.DataFrame:
    """Validate a predictions CSV file against the prediction schema.

    Returns the loaded DataFrame on success, or raises *ValueError*.
    """
    import numpy as np

    df = pd.read_csv(path)
    cols = [str(c).lower().replace("_", "") for c in df.columns]

    if "cellid" not in cols or "score" not in cols:
        raise ValueError(
            f"Missing required columns in {path}. Columns found: {df.columns.tolist()}"
        )

    score_col = df.columns[cols.index("score")]
    scores = df[score_col]

    if scores.isna().any() or np.isinf(scores).any():
        raise ValueError(f"NaN or Inf scores found in {path}")

    if (scores < 0.0).any() or (scores > 1.0).any():
        raise ValueError(f"Scores out of [0, 1] range found in {path}")

    return df


def validate_predictions_list(rows: list[dict[str, Any]]) -> list[PredictionSchema]:
    """Validate a list of raw dicts as prediction rows."""
    return [PredictionSchema.model_validate(row) for row in rows]


def validate_manifest_json(path: Path | str) -> DatasetManifest:
    """Load and validate a dataset manifest JSON file."""
    import json

    with open(path, "r", encoding="utf-8") as fh:
        raw = json.load(fh)
    return DatasetManifest.model_validate(raw)


def validate_track_unit_manifest(path: Path | str) -> TrackUnitManifest:
    """Load and validate a track unit manifest JSON file."""
    import json

    with open(path, "r", encoding="utf-8") as fh:
        raw = json.load(fh)
    return TrackUnitManifest.model_validate(raw)
