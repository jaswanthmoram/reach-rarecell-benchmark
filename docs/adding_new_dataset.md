# Adding a New Dataset

This guide explains how to add a new scRNA-seq dataset to REACH, from GEO accession to validated tracks.

---

## 1. Register the dataset

Add an entry to `configs/datasets.yaml`:

```yaml
datasets:
  - dataset_id: glioma_zhang
    accession: GSE123456
    disease: Glioblastoma
    platform: 10x_chromium
    ranked_status: ranked
    copykat_feasible: true
    cnv_fallback: infercnvpy
    expected_cells: 25000
    url: https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE123456
```

Required fields:
- `dataset_id` - lowercase snake_case identifier.
- `accession` - GEO accession (e.g. `GSE123456`).
- `disease` - Human-readable cancer type.
- `platform` - `10x_chromium` or `smart_seq2`.
- `ranked_status` - `ranked` (included in primary leaderboard) or `exploratory`.

---

## 2. Implement a loader

Create `src/rarecellbenchmark/ingest/glioma_zhang_loader.py`:

```python
def load_glioma_zhang(raw_dir: str) -> ad.AnnData:
    """Load GSE123456 into an AnnData with raw counts in .X."""
    import scanpy as sc
    import pandas as pd
    from pathlib import Path

    raw_dir = Path(raw_dir)
    # Example: 10x output structure
    adata = sc.read_10x_mtx(raw_dir / "filtered_gene_bc_matrices/")
    adata.obs["dataset_id"] = "glioma_zhang"
    adata.obs["patient_id"] = adata.obs["sample"].astype("category")
    return adata
```

Register the loader in `src/rarecellbenchmark/ingest/__init__.py`:

```python
from .glioma_zhang_loader import load_glioma_zhang

LOADERS = {
    "glioma_zhang": load_glioma_zhang,
    # ... existing loaders ...
}
```

---

## 3. Add source annotations

Edit `src/rarecellbenchmark/validate/source_annotations.py` and add a function that maps the raw metadata to `positive` / `negative` / `unknown`:

```python
def annotate_glioma_zhang(adata: ad.AnnData) -> pd.Series:
    """Return a Series of 'positive'|'negative'|'unknown' per cell."""
    # Example: use the 'cell_type' column from the original study
    mapping = {
        "malignant": "positive",
        "T_cell": "negative",
        "macrophage": "negative",
        "oligodendrocyte": "negative",
    }
    return adata.obs["cell_type"].map(mapping).fillna("unknown")
```

Register it:

```python
ANNOTATORS = {
    "glioma_zhang": annotate_glioma_zhang,
    # ... existing annotators ...
}
```

---

## 4. Add gene signatures

Edit `configs/signatures.yaml` and add disease-specific signatures:

```yaml
signatures:
  glioma_malignant:
    genes: [EGFR, PTEN, MGMT, IDH1, IDH2, TP53]
    applicable_cancers: [glioblastoma]
  glioma_stemness:
    genes: [SOX2, OLIG2, NESTIN, CD133]
    applicable_cancers: [glioblastoma]
```

---

## 5. Run validation

```bash
python scripts/download_dataset.py \
    --dataset glioma_zhang

python src/rarecellbenchmark/preprocess/preprocess_dataset.py \
    --input data/raw/glioma_zhang/ \
    --output data/processed/glioma_zhang.h5ad \
    --dataset_id glioma_zhang

python scripts/run_phase.py --phase 3 \
    --dataset glioma_zhang
```

Inspect the validation report:

```bash
cat data/validation/glioma_zhang_validation_report.json
```

Check tier counts:

```bash
python - <<'PY'
import pandas as pd
tiers = pd.read_parquet("data/validation/glioma_zhang_tier_assignments.parquet")
print(tiers["tier"].value_counts())
PY
```

You need at least **50 P_HC** and **200 B_HC** cells to generate Track A units.

---

## 6. Generate tracks

```bash
python scripts/run_phase.py --phase 4 --dataset glioma_zhang
python scripts/run_phase.py --phase 5 --dataset glioma_zhang
python scripts/run_phase.py --phase 6 --dataset glioma_zhang
```

---

## 7. Update the leaderboard scope

If the new dataset is `ranked`, edit `configs/protocol_version.yaml`:

```yaml
version: '1.3'
num_datasets: 11
```

Then rerun Phase 11-12 to include the new dataset in leaderboards and figures.

---

## Checklist

- [ ] Entry in `configs/datasets.yaml`
- [ ] Loader in `src/rarecellbenchmark/ingest/`
- [ ] Annotator in `src/rarecellbenchmark/validate/source_annotations.py`
- [ ] Signatures in `configs/signatures.yaml`
- [ ] Validation produces ≥50 P_HC and ≥200 B_HC
- [ ] Tracks A-C generated successfully
- [ ] Smoke test passes on at least one unit
- [ ] `protocol_version.yaml` updated

---

*Next: [Adding a New Track](adding_new_track.md)*
