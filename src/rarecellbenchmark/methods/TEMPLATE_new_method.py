"""
Template for adding a new method to REACH.

Steps:
1. Copy this file to src/rarecellbenchmark/methods/ranked/my_method.py
2. Rename class to MyMethodWrapper
3. Implement run() method
4. Add config/methods/my_method.yaml
5. Register in src/rarecellbenchmark/methods/registry.py
"""
from __future__ import annotations
from pathlib import Path
from typing import Any

import pandas as pd
from anndata import AnnData

from rarecellbenchmark.methods.base import BaseMethodWrapper, MethodRunResult, validate_predictions
from rarecellbenchmark.methods.common import load_blind_adata, write_predictions, write_runmeta

class MyMethodWrapper(BaseMethodWrapper):
    method_id = "my_method"
    supports_gpu = False
    consumes_labels = False

    def run(self, input_h5ad: Path, output_dir: Path, config: dict[str, Any]) -> MethodRunResult:
        # 1. Load blind expression data
        adata = load_blind_adata(input_h5ad)
        
        # 2. Start timing and memory tracking
        self._start_memory()
        
        # 3. Compute one score per cell (higher = more likely rare/malignant)
        # REPLACE THIS WITH YOUR METHOD LOGIC
        scores = self._compute_scores(adata, config)
        
        # 4. Build predictions DataFrame
        predictions = pd.DataFrame({
            "cell_id": adata.obs_names.tolist(),
            "score": scores,
        })
        
        # 5. Validate predictions
        validate_predictions(predictions, adata)
        
        # 6. Write predictions.csv
        pred_path = write_predictions(predictions, output_dir, config.get("unit_id", "unknown"))
        
        # 7. Stop timing/memory
        runtime_s, peak_memory_mb = self._stop_memory()
        
        # 8. Compute hashes
        from rarecellbenchmark.io.checksums import compute_checksum
        input_hash = compute_checksum(input_h5ad)
        output_hash = compute_checksum(pred_path)
        
        # 9. Write runmeta.json
        meta_path = write_runmeta(
            method_id=self.method_id,
            unit_id=config.get("unit_id", "unknown"),
            output_dir=output_dir,
            runtime_s=runtime_s,
            peak_memory_mb=peak_memory_mb,
            seed=config.get("seed", 42),
            input_hash=input_hash,
            output_hash=output_hash,
        )
        
        return MethodRunResult(
            method_id=self.method_id,
            unit_id=config.get("unit_id", "unknown"),
            predictions_path=pred_path,
            runmeta_path=meta_path,
            status="success",
        )
    
    def _compute_scores(self, adata: AnnData, config: dict[str, Any]) -> pd.Series:
        """REPLACE WITH ACTUAL METHOD."""
        import numpy as np
        rng = np.random.default_rng(config.get("seed", 42))
        return pd.Series(rng.random(adata.n_obs), index=adata.obs_names)
