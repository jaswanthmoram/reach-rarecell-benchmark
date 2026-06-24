import numpy as np
import pandas as pd
import scanpy as sc
from anndata import AnnData
from rarecellbenchmark.validate.cnv import compute_cnv_score


def _toy_adata(n=200, g=400, seed=0):
    rng = np.random.default_rng(seed)
    X = rng.poisson(1.0, size=(n, g)).astype(float)
    X[: n // 2, : g // 4] += 8.0  # chromosomal gain in half the cells
    var = pd.DataFrame(index=[f"g{i}" for i in range(g)])
    var["chromosome"] = ["chr1"] * (g // 2) + ["chr2"] * (g - g // 2)
    var["start"] = np.arange(g) * 1000
    var["end"] = var["start"] + 500
    obs = pd.DataFrame(index=[f"c{i}" for i in range(n)])
    obs["cell_type"] = ["malignant"] * (n // 2) + ["T cells"] * (n - n // 2)
    a = AnnData(X=X, obs=obs, var=var)
    sc.pp.normalize_total(a, target_sum=1e4)
    sc.pp.log1p(a)
    return a


def test_cnv_score_is_per_cell_and_separates_aneuploid():
    a = _toy_adata()
    s = compute_cnv_score(a, reference_cats=["T cells"])
    assert isinstance(s, pd.Series)
    assert list(s.index) == list(a.obs_names)
    assert s.notna().all()
    assert s.iloc[:100].mean() > s.iloc[100:].mean()
