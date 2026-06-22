import numpy as np
import pandas as pd
import pytest
from anndata import AnnData
from rarecellbenchmark.validate.tiers import rederive_hc_labels_no_cnv


def test_rederive_hc_labels_no_cnv():
    # 40 cells:
    # c0-c19: malignant (source positive), c20-c39: T cells (source negative)
    # PCA: c0-c19 at [0, 0], c20-c39 at [100, 100]
    obs = pd.DataFrame(
        {
            "cell_type": ["malignant"] * 20 + ["T cells"] * 20,
        },
        index=[f"c{i}" for i in range(40)]
    )
    
    obsm = {
        "X_pca": np.array(
            [[0.0, 0.0]] * 20 + [[100.0, 100.0]] * 20
        )
    }
    
    # 40 cells, 2 genes
    # We want:
    # - c0: malignant, sig high (pct >= 0.15), neighbors are all malignant (purity = 1.0 >= 0.5) -> positive
    # - c20: T cell, sig low (pct < 0.15), neighbors are all T cells (purity = 1.0 >= 0.5) -> background
    # - c39: T cell, sig high (pct >= 0.15), neighbors are all T cells (purity = 1.0 >= 0.5) -> unknown
    #
    X = np.zeros((40, 2))
    
    # Set scores for T cells (indices 20 to 39)
    for i in range(20, 39):
        X[i, 0] = (i - 20) * 0.1  # c20: 0.0 (rank 1 -> pct 0.025), c21: 0.1, ..., c38: 1.8
    X[39, 0] = 10.0               # c39: 10.0 (rank 39.5 -> pct 0.9875)
    
    # Set scores for malignant cells (indices 0 to 19)
    X[0, 0] = 10.0                # c0: 10.0 (rank 39.5 -> pct 0.9875)
    for i in range(1, 20):
        X[i, 0] = 5.0 + (i - 1) * 0.1
    
    var = pd.DataFrame(index=["Marker1", "Marker2"])
    adata = AnnData(X=X, obs=obs, var=var, obsm=obsm)
    
    # Signature dictionary
    signatures = [{"name": "Sig1", "genes": ["Marker1"]}]
    
    labels = rederive_hc_labels_no_cnv(adata, signatures=signatures)
    
    assert isinstance(labels, pd.Series)
    assert labels.loc["c0"] == "positive"     # malignant, sig high, neighbor high
    assert labels.loc["c20"] == "background"   # T cell, sig low, neighbor high
    assert labels.loc["c39"] == "unknown"      # T cell, sig high -> not background

