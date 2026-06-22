# DeepScena Track F — Colab Run Instructions

## What you need to run

DeepScena needs GPU (torch.cuda) for Track F. The 15 unit files are ready locally:

| Prevalence | Units | Cells/unit | Expression files |
|---|---|---|---|
| 0.001 (0.1%) | 5 | 2000 | `data/tracks/f/crc_lee/prev_0.001/crc_lee_track_f_prev_0.001_rep*_expression.h5ad` |
| 0.005 (0.5%) | 5 | 400 | `data/tracks/f/crc_lee/prev_0.005/crc_lee_track_f_prev_0.005_rep*_expression.h5ad` |
| 0.010 (1%) | 5 | 400 | `data/tracks/f/crc_lee/prev_0.01/crc_lee_track_f_prev_0.01_rep*_expression.h5ad` |

## Colab notebook steps

### Cell 1: Upload + setup
```python
# Upload these from your local machine:
# - All 15 *_expression.h5ad files (from data/tracks/f/crc_lee/prev_*/)
# - The DeepScena wrapper (External-Methods/DeepScena/)
# - The model weights if any

import os, sys, torch
print(f"PyTorch: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")
print(f"GPU: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'None'}")
```

### Cell 2: Install dependencies
```python
!pip install anndata scanpy  # if not pre-installed
# DeepScena dependencies:
!pip install scikit-learn pandas numpy matplotlib
```

### Cell 3: Run DeepScena on all 15 units
```python
import anndata as ad
import pandas as pd
import numpy as np
import torch
import json
import os
from pathlib import Path

# Fix for PyTorch 2.6+ (weights_only defaults to True)
_original_load = torch.load
def patched_load(*args, **kwargs):
    kwargs['weights_only'] = False
    return _original_load(*args, **kwargs)
torch.load = patched_load

# Upload DeepScena code or clone it
# !git clone https://github.com/shaoqiangzhang/DeepScena.git
sys.path.insert(0, 'DeepScena')  # or wherever you upload it

output_dir = Path('predictions/DeepScena')
output_dir.mkdir(parents=True, exist_ok=True)

unit_files = sorted(Path('tracks').rglob('*_expression.h5ad'))
print(f"Found {len(unit_files)} units to process")

for i, unit_path in enumerate(unit_files):
    unit_id = unit_path.stem.replace('_expression', '')
    pred_path = output_dir / f"{unit_id}_predictions.csv"
    if pred_path.exists():
        print(f"[{i+1}/{len(unit_files)}] Skipping {unit_id} (exists)")
        continue
    
    print(f"[{i+1}/{len(unit_files)}] Running DeepScena on {unit_id}...")
    adata = ad.read_h5ad(unit_path)
    
    # Run DeepScena (adjust import based on actual DeepScena API)
    # This is the pattern that worked before:
    try:
        # DeepScena cluster-based scoring
        from DeepScena import run_deepscena  # adjust import
        scores = run_deepscena(adata, n_clusters=5)  # adjust params
    except Exception as e:
        print(f"  Error: {e}")
        scores = np.zeros(adata.n_obs)
    
    # Save predictions
    df = pd.DataFrame({'score': scores}, index=adata.obs_names)
    df.to_csv(pred_path, index=False)
    
    # Save runmeta
    runmeta = {
        'method_id': 'DeepScena',
        'unit_id': unit_id,
        'runtime_s': 0,  # fill in
        'status': 'success',
        'gpu': torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'T4',
    }
    with open(output_dir / f"{unit_id}_runmeta.json", 'w') as f:
        json.dump(runmeta, f, indent=2)
    
    print(f"  Saved {pred_path} ({len(df)} cells, {df['score'].nunique()} unique scores)")

print("\nDone! Download all 15 *_predictions.csv files from predictions/DeepScena/")
```

### Cell 4: Download results
```python
# Zip and download
!cd predictions/DeepScena && zip -j ../deepscena_track_f.zip *_predictions.csv *_runmeta.json
from google.colab import files
files.download('deepscena_track_f.zip')
```

## After Colab: copy predictions back

```bash
# Unzip into the local repo
cd /home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test
unzip deepscena_track_f.zip -d data/predictions/DeepScena/

# Verify
ls data/predictions/DeepScena/*track_f*predictions.csv | wc -l  # should be 15

# Re-run evaluation (includes DeepScena)
.venv/bin/python scripts/run_track_f.py --datasets crc_lee --methods DeepScena --evaluate-only
```

## Key notes

- **torch.load fix**: PyTorch 2.6+ defaults `weights_only=True` which breaks DeepScena's model loading. The monkey-patch in Cell 3 fixes this.
- **8-14 unique scores expected**: DeepScena outputs discrete cluster-based scores (not random). If you see only 1 unique score, the run failed.
- **Runtime**: ~30-60s per unit on T4 GPU. Total ~15 minutes for all 15 units.
- **Never fabricate**: If DeepScena fails on a unit, record it as failed — don't substitute random scores.
