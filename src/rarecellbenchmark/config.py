"""REACH configuration models and loaders.

Uses Pydantic v2 for validation.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Literal, Optional

import yaml
from pydantic import BaseModel, Field, field_validator

from rarecellbenchmark.constants import GLOBAL_SEED


# ---------------------------------------------------------------------------
# Benchmark-level configuration
# ---------------------------------------------------------------------------

class BenchmarkConfig(BaseModel):
    """Top-level benchmark execution parameters."""

    global_seed: int = Field(default=GLOBAL_SEED, ge=0, description="Master random seed.")
    max_runtime_s: int = Field(default=3600, gt=0, description="Per-method runtime limit in seconds.")
    max_memory_mb: int = Field(default=32768, gt=0, description="Per-method memory limit in MB.")
    n_replicates: int = Field(default=3, ge=1, description="Number of replicates per track unit.")
    timeout_action: Literal["fail", "fallback"] = Field(default="fallback", description="Action on timeout.")
    parallel_jobs: int = Field(default=1, ge=1, description="Number of parallel workers.")


# ---------------------------------------------------------------------------
# Dataset registry contract
# ---------------------------------------------------------------------------

class DatasetConfig(BaseModel):
    """Single dataset entry from the dataset registry."""

    dataset_id: str = Field(..., description="Unique dataset identifier.")
    accession: str = Field(..., description="GEO or SRA accession.")
    bioproject: str = Field(..., description="BioProject ID.")
    sra_project: str = Field(..., description="SRA project ID.")
    verified_cell_count: int = Field(..., gt=0, description="Verified number of cells.")
    disease: str = Field(..., description="Disease or tissue description.")
    cancer_type: str = Field(..., description="Short cancer type code.")
    platform: str = Field(..., description="Sequencing platform.")
    gene_id_format: str = Field(default="symbol", description="Gene ID format (symbol / ensembl).")
    track_assignment: str = Field(..., description="Track assignment category.")
    ranked_status: Literal["ranked", "unranked", "challenge_only"] = Field(default="ranked")
    challenge_only: bool = Field(default=False)
    copykat_feasible: bool = Field(default=True)
    cnv_fallback: str = Field(default="infercnvpy")
    has_adjacent_normal: bool = Field(default=False)
    has_pbmc_fraction: bool = Field(default=False)
    has_normal_bone_marrow: bool = Field(default=False)
    source_annotation_method: str = Field(default="paper_cell_type_column")
    label_source_column: str = Field(default="cell_type")
    malignant_label: str = Field(..., description="Label string for malignant cells.")
    normal_labels: list[str] = Field(default_factory=list, description="List of normal cell type labels.")
    patient_id_column: str = Field(default="patient")
    raw_data_path: str = Field(..., description="Relative path to raw data directory.")
    processed_h5ad_sha256: Optional[str] = Field(default=None, description="SHA-256 of processed h5ad.")
    publication: str = Field(default="")
    pubmed_id: Optional[str] = Field(default=None)
    asset_qc_notes: str = Field(default="")
    cell_origin_column: Optional[str] = Field(default=None)
    fallback_validation_pair: bool = Field(default=False)
    track_d_tiers: Optional[dict[str, bool]] = Field(default=None)

    @field_validator("normal_labels", mode="before")
    @classmethod
    def _coerce_none_to_list(cls, v: Any) -> Any:
        if v is None:
            return []
        return v


class DatasetRegistry(BaseModel):
    """Root model for ``configs/datasets.yaml``."""

    version: str = Field(default="1.0")
    date: Optional[str] = Field(default=None)
    note: Optional[str] = Field(default=None)
    datasets: list[DatasetConfig] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Method configuration
# ---------------------------------------------------------------------------

class MethodConfig(BaseModel):
    """Single method entry from the methods registry."""

    method_id: str = Field(..., description="Unique method identifier.")
    name: str = Field(..., description="Human-readable method name.")
    category: Literal["ranked", "naive_baseline", "naive", "orthogonal", "exploratory", "supervised"] = Field(...)
    language: Literal["python", "r", "mixed"] = Field(default="python")
    wrapper_path: str = Field(..., description="Import path or script path for the wrapper.")
    consumes_labels: bool = Field(default=False, description="Whether the method uses ground-truth labels.")
    supports_gpu: bool = Field(default=False)
    requires_r: bool = Field(default=False)
    requires_gpu: bool = Field(default=False)
    timeout_seconds: int = Field(default=3600, gt=0)
    version: Optional[str] = Field(default=None, description="Method version string.")
    notes: Optional[str] = Field(default=None)


class MethodRegistry(BaseModel):
    """Root model for ``configs/methods.yaml``."""

    version: str = Field(default="1.0")
    methods: list[MethodConfig] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Track configuration
# ---------------------------------------------------------------------------

class TierSpec(BaseModel):
    """Tier specification within a track."""

    tier_id: str = Field(..., description="Tier identifier, e.g. T1, T2, U_obs.")
    description: str = Field(default="")
    prevalence_min: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    prevalence_max: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    enabled: bool = Field(default=True)


class TrackConfig(BaseModel):
    """Single track entry from the protocol configuration."""

    track_id: str = Field(..., description="Track identifier, e.g. a, b, c, d, e.")
    description: str = Field(...)
    primary_metric: Optional[str] = Field(default=None)
    secondary_metrics: list[str] = Field(default_factory=list)
    tiers: list[TierSpec] = Field(default_factory=list)
    n_replicates: int = Field(default=3, ge=1)


# ---------------------------------------------------------------------------
# Load helpers
# ---------------------------------------------------------------------------

def load_yaml(path: Path | str) -> Any:
    """Load a YAML file and return the parsed object."""
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"Config file not found: {p}")
    with open(p, "r", encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def load_benchmark_config(path: Path | str | None = None) -> BenchmarkConfig:
    """Load and validate a benchmark-level YAML config."""
    raw = load_yaml(path) if path else {"global_seed": GLOBAL_SEED}
    if not isinstance(raw, dict):
        raise ValueError("Benchmark config must be a mapping.")
    return BenchmarkConfig.model_validate(raw)


def load_dataset_registry(path: Path | str) -> DatasetRegistry:
    """Load and validate ``configs/datasets.yaml``."""
    raw = load_yaml(path)
    if not isinstance(raw, dict):
        raise ValueError("Dataset registry must be a mapping.")
    return DatasetRegistry.model_validate(raw)


def load_method_registry(path: Path | str) -> MethodRegistry:
    """Load and validate ``configs/methods.yaml``."""
    raw = load_yaml(path)
    if not isinstance(raw, dict):
        raise ValueError("Method registry must be a mapping.")
    return MethodRegistry.model_validate(raw)


def get_dataset_config(dataset_id: str, registry: DatasetRegistry) -> DatasetConfig:
    """Retrieve a dataset config by ID."""
    for ds in registry.datasets:
        if ds.dataset_id == dataset_id:
            return ds
    raise KeyError(f"Dataset '{dataset_id}' not found in registry.")


def get_method_config(method_id: str, registry: MethodRegistry) -> MethodConfig:
    """Retrieve a method config by ID."""
    for m in registry.methods:
        if m.method_id == method_id:
            return m
    raise KeyError(f"Method '{method_id}' not found in registry.")
