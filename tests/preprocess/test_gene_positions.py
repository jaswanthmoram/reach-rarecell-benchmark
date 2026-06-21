import numpy as np
import pandas as pd
from anndata import AnnData
from rarecellbenchmark.preprocess.gene_annotations import annotate_genes


def test_annotate_genes_adds_positions_and_drops_unmatched():
    # Create toy AnnData with 4 genes
    var = pd.DataFrame(index=["GAPDH", "ACTB", "UNKNOWN_GENE", "TP53"])
    obs = pd.DataFrame(index=["cell1", "cell2"])
    X = np.ones((2, 4))
    adata = AnnData(X=X, obs=obs, var=var)

    csv_path = "tests/fixtures/gene_pos_tiny.csv"
    
    res = annotate_genes(adata, csv_path, delimiter=",", drop_unmatched=True)
    
    assert res.n_vars == 3
    assert list(res.var_names) == ["GAPDH", "ACTB", "TP53"]
    assert "chromosome" in res.var.columns
    assert "start" in res.var.columns
    assert "end" in res.var.columns
    assert res.var.loc["GAPDH", "chromosome"] == "chr12"
    assert res.var.loc["GAPDH", "start"] == 6534517
