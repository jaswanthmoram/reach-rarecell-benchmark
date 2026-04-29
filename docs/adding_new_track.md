# Adding a New Track

This guide explains how to add a custom benchmark track by subclassing `BaseTrackGenerator`.

---

## 1. Subclass `BaseTrackGenerator`

Create `src/rarecellbenchmark/tracks/track_f_generator.py`:

```python
from pathlib import Path
from typing import Dict, List
import anndata as ad
import numpy as np

from ._base import BaseTrackGenerator

class TrackFGenerator(BaseTrackGenerator):
    """Batch-effect robustness track.

    Creates units by mixing cells from two different 10x channels
    of the same dataset, testing whether methods are confounded
    by technical batch.
    """

    track_id = "f"
    description = "Batch-effect robustness"

    def generate_units(
        self,
        adata: ad.AnnData,
        tier_file: Path,
        output_dir: Path,
        config: dict,
    ) -> List[Path]:
        """Return list of written unit directories."""
        tiers = self.load_tiers(tier_file)
        units = []

        for replicate in range(1, config.get("n_replicates", 3) + 1):
            unit_id = f"{self.dataset_id}_track_f_batch_rep{replicate:02d}"
            unit_dir = output_dir / unit_id
            unit_dir.mkdir(parents=True, exist_ok=True)

            # Select cells from two distinct batches
            batches = adata.obs["batch"].cat.categories
            if len(batches) < 2:
                self.logger.warning("Skipping %s: only one batch", unit_id)
                continue

            batch_a = adata[adata.obs["batch"] == batches[0]].copy()
            batch_b = adata[adata.obs["batch"] == batches[1]].copy()

            # Sample positives and backgrounds respecting batch proportions
            positives = self.sample_positives(batch_a, n=config["n_positives"])
            backgrounds = self.sample_backgrounds(batch_b, n=config["n_backgrounds"])

            unit_adata = ad.concat([positives, backgrounds], join="outer")
            unit_adata = self.shuffle(unit_adata, seed=replicate)

            self.write_unit(
                unit_dir=unit_dir,
                unit_id=unit_id,
                adata=unit_adata,
                labels=unit_adata.obs["label"],
                manifest={
                    "track": "f",
                    "replicate": replicate,
                    "batch_a": str(batches[0]),
                    "batch_b": str(batches[1]),
                },
            )
            units.append(unit_dir)

        return units
```

### Base class contract

`BaseTrackGenerator` provides:
- `load_tiers(path)` → `pd.DataFrame` with `cell_id` and `tier` columns.
- `sample_positives(adata, n)` → `AnnData` sampled from P_HC.
- `sample_backgrounds(adata, n)` → `AnnData` sampled from B_HC.
- `shuffle(adata, seed)` → shuffled `AnnData`.
- `write_unit(unit_dir, unit_id, adata, labels, manifest)` → writes the three contract files.

You must implement:
- `generate_units(adata, tier_file, output_dir, config) → List[Path]`

---

## 2. Add track configuration

Edit `configs/tracks.yaml`:

```yaml
tracks:
  a:
    name: controlled_real_spikeins
    primary: true
    tiers: [T1, T2, T3, T4]
    replicates: 5
  # ... existing tracks ...
  f:
    name: batch_effect_robustness
    primary: false
    tiers: [batch_mix]
    replicates: 3
    params:
      n_positives: 100
      n_backgrounds: 1900
```

---

## 3. Register the generator

Edit `src/rarecellbenchmark/tracks/__init__.py`:

```python
from .track_a_generator import TrackAGenerator
# ... existing imports ...
from .track_f_generator import TrackFGenerator

GENERATORS = {
    "a": TrackAGenerator,
    "b": TrackBGenerator,
    "c": TrackCGenerator,
    "d": TrackDGenerator,
    "e": TrackEGenerator,
    "f": TrackFGenerator,
}
```

---

## 4. Update evaluation logic

Edit `src/rarecellbenchmark/evaluate/metrics.py`:

Find the track loop (usually around the metric computation) and add `"f"` to the list of evaluated tracks:

```python
TRACKS = ["a", "b", "c", "d", "e", "f"]
```

If your track has special metric needs (e.g. batch-mixing requires a custom calibration metric), add a branch:

```python
if unit_meta["track"] == "f":
    metrics["batch_confusion"] = compute_batch_confusion(adata, predictions)
```

---

## 5. Update figure generation

Edit `scripts/generate_figures.py`:

Add a panel or figure for the new track. At minimum, ensure the track appears in the dataset summary heatmap:

```python
TRACK_ORDER = ["a", "b", "c", "d", "e", "f"]
```

---

## 6. Generate the track

```bash
python scripts/run_phase.py --phase 8 --dataset <dataset>
```

Verify a unit:

```bash
ls data/tracks/f/bcc_yost/
# Expected: batch_mix directories with expression.h5ad, labels.parquet, manifest.json
```

---

## 7. Run methods and evaluate

```bash
python scripts/run_methods.py --config configs/protocol_version.yaml --tracks F
python scripts/evaluate_results.py
python scripts/generate_figures.py
```

---

## Checklist

- [ ] `BaseTrackGenerator` subclass in `src/tracks/`
- [ ] Entry in `configs/tracks.yaml`
- [ ] Registered in `src/tracks/__init__.py`
- [ ] Evaluation updated in `src/rarecellbenchmark/evaluate/metrics.py`
- [ ] Figures updated in `scripts/generate_figures.py` (add any new track to data-driven figure logic)
- [ ] Sample unit passes smoke test
- [ ] Re-evaluation and figures regenerate cleanly

---

*Next: [Metrics](metrics.md)*
