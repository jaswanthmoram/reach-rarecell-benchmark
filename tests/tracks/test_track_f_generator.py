import numpy as np
import pandas as pd
import pytest
from anndata import AnnData
from rarecellbenchmark.tracks.track_f_generator import TrackFGenerator

def test_track_f_generator_units():
    # Construct a dummy AnnData of 5000 cells (100 malignant, 4900 normal epithelial)
    n = 5000
    g = 10
    X = np.zeros((n, g))
    obs = pd.DataFrame(index=[f"cell_{i}" for i in range(n)])
    adata = AnnData(X=X, obs=obs)
    
    # 100 malignant cells (positives)
    malignant_mask = np.zeros(n, dtype=bool)
    malignant_mask[:100] = True
    
    # 4900 normal epithelial cells (background)
    normal_epi_mask = np.zeros(n, dtype=bool)
    normal_epi_mask[100:] = True
    
    prevalences = (0.001, 0.005, 0.01)
    unit_size = 2000
    n_replicates = 5
    
    results = TrackFGenerator.generate_units(
        adata=adata,
        malignant_mask=malignant_mask,
        normal_epi_mask=normal_epi_mask,
        prevalences=prevalences,
        unit_size=unit_size,
        n_replicates=n_replicates,
        seed=42
    )
    
    # Total units should be len(prevalences) * n_replicates = 3 * 5 = 15
    assert len(results) == 15
    
    # Let's inspect the first unit (prevalence 0.001, rep 1)
    unit_01 = results[0]
    assert unit_01["status"] == "success"
    assert unit_01["manifest"]["prevalence"] == 0.001
    assert unit_01["manifest"]["n_positive"] == 2  # 0.001 * 2000 = 2
    assert unit_01["manifest"]["n_background"] == 1998
    assert unit_01["manifest"]["n_total"] == 2000
    assert unit_01["manifest"]["duplication_fraction"] < 0.20
    
    # Verify cell count and labels
    assert unit_01["unit_adata"].n_obs == 2000
    assert len(unit_01["true_labels"]) == 2000
    assert (unit_01["true_labels"] == "positive").sum() == 2
    assert (unit_01["true_labels"] == "background").sum() == 1998
    
    # All positives should come from malignant mask
    pos_cells = unit_01["true_labels"][unit_01["true_labels"] == "positive"].index
    for cell in pos_cells:
        cell_idx = int(cell.split("_")[1])
        assert cell_idx < 100
        
    # All background should come from normal epi mask
    bg_cells = unit_01["true_labels"][unit_01["true_labels"] == "background"].index
    for cell in bg_cells:
        cell_idx = int(cell.split("_")[1])
        assert cell_idx >= 100
