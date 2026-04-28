# Data Contracts

Every phase in REACH communicates via well-defined file contracts. Changing a contract requires updating both the producer and consumer phases.

---

## 1. Processed AnnData Contract (Phase 2 → Phase 3)

**Path:** `data/processed/{dataset_id}.h5ad`

### Required fields

| Slot | Key | Dtype | Description |
|------|-----|-------|-------------|
| `X` | - | `float32` sparse or dense | Log-normalised expression (`log1p_norm`). This is the default matrix. |
| `layers["counts"]` | - | `int32` sparse or dense | Raw UMI counts before any normalisation. |
| `layers["log1p_norm"]` | - | `float32` sparse or dense | Copy of `X` for explicit access. |
| `obsm["X_pca"]` | - | `float32` ndarray (n_cells × 50) | PCA embedding computed on the top 2,000 HVGs. |
| `obs["dataset_id"]` | - | `category` | Benchmark dataset identifier (e.g. `bcc_yost`). |
| `obs["patient_id"]` | - | `category` | Patient or sample identifier from the original study. |
| `obs["cell_type"]` | - | `category` | Source annotation label from the original publication. |
| `obs["batch"]` | - | `category` | Technical batch (e.g. 10x channel, sequencing lane). |
| `var["chromosome"]` | - | `category` | GRCh38 chromosome (`chr1`, `chr2`, …). |
| `var["start"]` | - | `int64` | Gene start position on GRCh38. |
| `var["end"]` | - | `int64` | Gene end position on GRCh38. |
| `uns["provenance"]` | - | `dict` | Provenance metadata: `preprocess_version`, `git_sha`, `timestamp`, `n_cells_raw`, `n_cells_final`, `checksum_sha256`. |

### Invariants

- `X` and `layers["log1p_norm"]` must be identical.
- `layers["counts"]` must contain only non-negative integers.
- `obsm["X_pca"]` must have exactly 50 components.
- `var.index` must contain HGNC gene symbols (not Ensembl IDs with version suffixes).
- `uns["provenance"]["checksum_sha256"]` is the SHA-256 of the written `.h5ad` file itself (computed after write).

---

## 2. Track Unit Contract (Phases 4-8 → Phase 10)

Each benchmark unit is a directory containing three files.

**Directory pattern:** `data/tracks/{track}/{dataset_id}/{tier}/{unit_id}/`

### 2.1 Expression matrix

**Filename:** `{unit_id}_expression.h5ad`

- A subset of the processed AnnData containing only the cells selected for this unit.
- All `layers`, `obsm`, `obs`, and `var` columns from the processed contract are preserved.
- **Must not contain** any label columns that reveal the ground truth (e.g. no `obs["is_malignant"]`).

### 2.2 Ground-truth labels

**Filename:** `{unit_id}_labels.parquet`

| Column | Dtype | Description |
|--------|-------|-------------|
| `cell_id` | `string` | Cell identifier matching `obs.index` in the expression file. |
| `label` | `int8` | Ground-truth binary label: `1` = positive (malignant), `0` = background. |
| `confidence_tier` | `category` | `P_HC`, `P_MC`, `P_LC`, `B_HC`, `B_MC`, `B_LC`, `excluded`. |

### 2.3 Manifest

**Filename:** `{unit_id}_manifest.json`

```json
{
  "unit_id": "bcc_yost_track_a_T1_rep01",
  "track": "a",
  "dataset_id": "bcc_yost",
  "tier": "T1",
  "replicate": 1,
  "n_cells": 2000,
  "n_positives": 150,
  "prevalence": 0.075,
  "seed": 42,
  "generator_version": "1.2"
}
```

---

## 3. Prediction Contract (Phase 10 → Phase 11)

**Directory pattern:** `results/{method_id}/{unit_id}/`

### 3.1 Predictions CSV

**Filename:** `predictions.csv`

| Column | Dtype | Description |
|--------|-------|-------------|
| `cell_id` | `string` | Cell identifier matching the unit expression file. |
| `score` | `float64` | Continuous malignancy/rarity score (higher = more likely positive). |
| `pred_label` | `int8` | Binary prediction at the method's internal threshold (if any). |

### 3.2 Run metadata

**Filename:** `runmeta.json`

```json
{
  "method": "FiRE",
  "version": "1.0.1",
  "runtime_seconds": 101.8,
  "peak_ram_mb": 2048,
  "success": true,
  "n_cells": 2000,
  "fidelity": "faithful",
  "is_degenerate": false
}
```

**Fidelity values:**
- `faithful` - original published algorithm executed without approximation.
- `proxy` - faithful wrapper but method has training-data or implementation concerns.
- `fallback` - method failed (OOM/timeout) and returned a random or constant score.

---

## 4. Failure Contract

When a wrapper crashes, it must still write a failure record so that Phase 11 can distinguish "not yet run" from "ran but failed".

**Filename:** `failure.json` (in the same `results/{method_id}/{unit_id}/` directory)

```json
{
  "method": "scCAD",
  "unit_id": "pdac_peng_track_a_T4_rep03",
  "success": false,
  "error_type": "MemoryError",
  "traceback": "...",
  "runtime_seconds": 3600.0,
  "peak_ram_mb": 65536,
  "fidelity": "fallback"
}
```

Phase 11 skips units with `failure.json` for metric aggregation unless a fallback `predictions.csv` was also written (in which case the fallback flag filters it from primary AP).

---

## Contract Versioning

Contracts are versioned implicitly via the `generator_version` in manifests and the `preprocess_version` in AnnData provenance. If a breaking contract change is introduced, the version string is bumped and downstream phases assert the expected version on read.

---

*For the high-level architecture that produces these contracts, see [Architecture](architecture.md).*
