"""Canonical AnnData preprocessing pipeline.

Migrates core logic from the original ``src/preprocess/preprocess_dataset.py``
into the new ``rarecellbenchmark`` package structure.
"""

from __future__ import annotations

import hashlib
import json
import logging
import re
from pathlib import Path
from typing import Callable

import numpy as np
import pandas as pd
import scanpy as sc
import scipy.sparse as sp
from anndata import AnnData

from rarecellbenchmark.io import validate_anndata_contract, write_h5ad
from rarecellbenchmark.preprocess.gene_annotations import annotate_genes
from rarecellbenchmark.preprocess.normalize import normalize_log1p, run_pca
from rarecellbenchmark.preprocess.qc import filter_cells

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Dataset-specific loaders (adapted from original)
# ─────────────────────────────────────────────────────────────────────────────


def _load_text_matrix(raw_dir: Path) -> AnnData:
    """Generic text-matrix loader (GEO supplementary .txt.gz / .csv)."""
    candidates: list[Path] = []
    for pattern in ["*.txt.gz", "*.txt", "*.tsv.gz", "*.tsv", "*.csv.gz", "*.csv"]:
        candidates.extend(raw_dir.glob(pattern))
    if not candidates:
        raise FileNotFoundError(f"No text matrix file found in {raw_dir}")

    def _score(path: Path) -> tuple[int, int, str]:
        name = path.name.lower()
        value = 0
        exclude = ("annotation", "metadata", "tcr", "summary", "feature_summary")
        if any(hint in name for hint in exclude):
            value -= 100
        if "raw_umi" in name:
            value += 60
        if "count" in name or "counts" in name:
            value += 40
        if "matrix" in name:
            value += 25
        if "tpm" in name:
            value -= 10
        return (value, -len(name), name)

    best = max(candidates, key=_score)
    if _score(best)[0] < 0:
        raise FileNotFoundError(f"No usable text matrix file found in {raw_dir}")

    fpath = best
    sep = "\t" if str(fpath).endswith((".txt", ".txt.gz", ".tsv", ".tsv.gz")) else ","
    compression = "gzip" if str(fpath).endswith(".gz") else None
    df = pd.read_csv(fpath, sep=sep, index_col=0, compression=compression)

    # Orient to cells x genes
    if df.shape[1] > df.shape[0]:
        df = df.T

    # Drop non-numeric rows/cols
    numeric_cols = pd.to_numeric(df.iloc[0], errors="coerce").notna()
    if not numeric_cols.all():
        df = df.loc[:, numeric_cols]
    numeric_rows = pd.to_numeric(df.iloc[:, 0], errors="coerce").notna()
    if not numeric_rows.all():
        df = df.loc[numeric_rows, :]

    try:
        matrix = df.to_numpy(dtype=float, copy=True)
    except (ValueError, TypeError):
        matrix = df.apply(pd.to_numeric, errors="coerce").fillna(0).to_numpy(dtype=float)

    if "log" in fpath.name.lower() and np.isfinite(matrix).all() and matrix.min() >= 0 and matrix.max() <= 50:
        matrix = np.expm1(matrix)

    obs = pd.DataFrame({"cell_id": df.index.astype(str)})
    obs["patient_id"] = "unknown"
    obs["cell_type_raw"] = "unknown"
    obs["cell_type"] = "unknown"
    obs.index = obs["cell_id"].values

    var = pd.DataFrame(index=df.columns.astype(str))
    var["gene_name"] = var.index.astype(str)

    adata = AnnData(X=sp.csr_matrix(matrix), obs=obs, var=var)
    return adata


def _load_10x_mtx(raw_dir: Path) -> AnnData:
    """Load 10x Chromium data from matrix.mtx.gz directories."""
    import tarfile

    # Extract sample archives
    for archive in sorted(raw_dir.glob("*.tar.gz")) + sorted(raw_dir.glob("*.tar")):
        if re.match(r"^GSE\d+_RAW\.(tar\.gz|tar)$", archive.name, re.IGNORECASE):
            continue
        stem = archive.name
        for suffix in (".tar.gz", ".tar"):
            if stem.endswith(suffix):
                stem = stem[: -len(suffix)]
                break
        target_dir = raw_dir / stem
        if target_dir.exists() and any(target_dir.iterdir()):
            continue
        try:
            with tarfile.open(archive) as tf:
                tf.extractall(str(target_dir))
        except Exception:
            continue

    mtx_files: list[Path] = []
    for pattern in ["matrix.mtx.gz", "matrix.mtx", "*/matrix.mtx.gz", "*/matrix.mtx", "**/matrix.mtx.gz", "**/matrix.mtx"]:
        mtx_files.extend(raw_dir.glob(pattern))
    if not mtx_files:
        raise FileNotFoundError(f"No matrix.mtx found in {raw_dir}")

    mtx_dirs = sorted({f.parent for f in mtx_files})
    if len(mtx_dirs) == 1:
        adata = sc.read_10x_mtx(str(mtx_dirs[0]), var_names="gene_symbols", cache=False)
        adata.var_names_make_unique()
        return adata

    adatas: list[AnnData] = []
    for mtx_dir in mtx_dirs:
        try:
            a = sc.read_10x_mtx(str(mtx_dir), var_names="gene_symbols", cache=False)
            a.var_names_make_unique()
            sample_name = mtx_dir.parent.name
            a.obs["sample_id"] = sample_name
            a.obs.index = sample_name + "_" + a.obs.index.astype(str)
            adatas.append(a)
        except Exception as exc:
            logger.warning("_load_10x_mtx: skipping %s (%s)", mtx_dir, exc)

    if not adatas:
        raise FileNotFoundError(f"Could not load any 10x mtx from {raw_dir}")

    adata = AnnData.concatenate(*adatas, join="outer", fill_value=0)
    adata.var_names_make_unique()
    return adata


def _try_10x_load(raw_dir: Path) -> AnnData:
    """Try 10x loaders then fall back to text matrix."""
    h5_files = list(raw_dir.glob("*.h5")) + list(raw_dir.glob("**/*.h5"))
    if h5_files:
        adata = sc.read_10x_h5(h5_files[0])
        adata.var_names_make_unique()
        return adata

    try:
        return _load_10x_mtx(raw_dir)
    except FileNotFoundError:
        pass

    return _load_text_matrix(raw_dir)


# Simplified loader registry
_DATASET_LOADERS: dict[str, Callable[[Path], AnnData]] = {
    "melanoma_tirosh": _load_text_matrix,
    "oligo_tirosh": _load_text_matrix,
    "gbm_patel": _load_text_matrix,
    "breast_chung": _load_text_matrix,
    "hnscc_puram": _load_text_matrix,
    "bcc_yost": _try_10x_load,
    "luad_laughney": _try_10x_load,
    "pdac_peng": _try_10x_load,
    "hcc_wei": _try_10x_load,
    "crc_lee": _try_10x_load,
    "luad_kim": _try_10x_load,
    "ov_izar_tirosh": _try_10x_load,
    "gastric_li": _try_10x_load,
    "ov_meta": _try_10x_load,
    "rcc_multi": _try_10x_load,
    "glioma_diaz": _try_10x_load,
    "mm_ledergor": _try_10x_load,
    "breast_ctc_szczerba": _load_text_matrix,
    "prostate_ctc_liss": _load_text_matrix,
    "prostate_ctc_miyamoto": _load_text_matrix,
    "melanoma_ctc_fankhauser": _load_text_matrix,
}

# Lazy import for scipy.sparse
scipy = None  # type: ignore


def _get_scipy():
    global scipy
    if scipy is None:
        import scipy as _scipy
        scipy = _scipy
    return scipy


# ─────────────────────────────────────────────────────────────────────────────
# Core preprocessing pipeline
# ─────────────────────────────────────────────────────────────────────────────


def _sanitize_nonfinite(adata: AnnData, context: str = "") -> None:
    """Replace NaN/Inf values in X and layers with 0."""
    import scipy.sparse as sp

    for lk, lmat in [("X", adata.X), ("counts", adata.layers.get("counts"))]:
        if lmat is None:
            continue
        if sp.issparse(lmat):
            bad = ~np.isfinite(lmat.data)
            if bad.any():
                logger.warning("%s: fixing %d non-finite values in %s", context, int(bad.sum()), lk)
                lmat.data[bad] = 0.0
                lmat.eliminate_zeros()
        else:
            arr = np.asarray(lmat, dtype=float)
            bad = ~np.isfinite(arr)
            if bad.any():
                logger.warning("%s: fixing %d non-finite values in %s", context, int(bad.sum()), lk)
                clean = np.nan_to_num(arr, nan=0.0, posinf=0.0, neginf=0.0)
                if lk == "X":
                    adata.X = clean
                else:
                    adata.layers[lk] = clean


def preprocess_dataset(
    raw_path: Path,
    dataset_id: str,
    out_dir: Path,
    config: dict,
) -> Path:
    """Run the full preprocessing pipeline for a single dataset.

    Parameters
    ----------
    raw_path :
        Directory containing raw count-matrix files.
    dataset_id :
        Benchmark dataset identifier.
    out_dir :
        Directory where the canonical ``{dataset_id}.h5ad`` will be written.
    config :
        Pre-processing parameters.  Recognised keys:
        ``min_genes``, ``max_genes``, ``max_mt_pct``, ``target_sum``,
        ``n_hvgs``, ``n_pca_components``, ``gene_positions_path``.

    Returns
    -------
    Path - the written ``.h5ad`` file.
    """
    raw_path = Path(raw_path)
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    min_genes = config.get("min_genes", 200)
    max_genes = config.get("max_genes", 10_000)
    max_mt_pct = config.get("max_mt_pct", 20.0)
    target_sum = config.get("target_sum", 1e4)
    n_hvgs = config.get("n_hvgs", 2000)
    n_pca_components = config.get("n_pca_components", 50)
    gene_positions_path = config.get("gene_positions_path", Path("configs/grch38_gene_positions.tsv"))

    logger.info("[%s] Starting preprocessing", dataset_id)

    # Step 1: Load
    loader = _DATASET_LOADERS.get(dataset_id, _try_10x_load)
    adata = loader(raw_path)
    n_cells_raw = adata.n_obs
    logger.info("[%s] Loaded %d cells x %d genes", dataset_id, n_cells_raw, adata.n_vars)

    # Step 2: Gene harmonisation
    adata.var.index = adata.var.index.str.replace(r"\.\d+$", "", regex=True)
    adata.var_names_make_unique()
    adata.var["gene_name"] = adata.var.index.astype(str)
    adata.var["gene_symbol"] = adata.var["gene_name"]

    _sanitize_nonfinite(adata, context=dataset_id)

    # Step 3: Mitochondrial annotation
    adata.var["mt"] = adata.var.index.str.startswith("MT-")
    sc.pp.calculate_qc_metrics(adata, qc_vars=["mt"], percent_top=None, log1p=False, inplace=True)

    # Step 4: QC
    adata = filter_cells(adata, min_genes=min_genes, max_genes=max_genes, max_mt_pct=max_mt_pct)
    sc.pp.filter_genes(adata, min_cells=3)
    logger.info("[%s] After QC: %d cells x %d genes", dataset_id, adata.n_obs, adata.n_vars)

    # Step 5: Store raw counts
    adata.layers["counts"] = adata.X.copy()

    # Step 6: Normalise
    adata = normalize_log1p(adata, target_sum=target_sum)

    # Step 7: HVG selection
    _sanitize_nonfinite(adata, context=f"{dataset_id} pre-HVG")
    hvg_flavor = "seurat_v3"
    try:
        sc.pp.highly_variable_genes(adata, n_top_genes=n_hvgs, flavor="seurat_v3", layer="counts", subset=False)
    except Exception as e1:
        logger.warning("[%s] seurat_v3 HVG failed (%s), retrying with 'seurat'", dataset_id, e1)
        try:
            sc.pp.highly_variable_genes(adata, n_top_genes=n_hvgs, flavor="seurat", subset=False)
            hvg_flavor = "seurat"
        except Exception as e2:
            logger.warning("[%s] seurat HVG failed (%s), retrying with 'cell_ranger'", dataset_id, e2)
            sc.pp.highly_variable_genes(adata, n_top_genes=n_hvgs, flavor="cell_ranger", subset=False)
            hvg_flavor = "cell_ranger"
    logger.info("[%s] HVG selection (%s): %d HVGs selected", dataset_id, hvg_flavor, int(adata.var["highly_variable"].sum()))

    # Step 8: PCA
    adata = run_pca(adata, n_comps=n_pca_components)

    # Step 9: Neighbors + Leiden (for downstream use)
    sc.pp.neighbors(adata, n_neighbors=20, n_pcs=min(30, n_pca_components))
    sc.tl.leiden(adata, resolution=0.5, random_state=42)

    # Step 10: Gene positions
    if Path(gene_positions_path).exists():
        adata = annotate_genes(adata, Path(gene_positions_path))
    else:
        logger.warning("[%s] Gene position file not found: %s", dataset_id, gene_positions_path)

    # Step 11: Standardise obs / var / uns
    adata.obs["dataset_id"] = dataset_id
    if "patient_id" not in adata.obs.columns:
        adata.obs["patient_id"] = "unknown"
    if "cell_type_raw" not in adata.obs.columns:
        adata.obs["cell_type_raw"] = adata.obs.get("cell_type", "unknown")
    if "cell_type" not in adata.obs.columns:
        adata.obs["cell_type"] = "unknown"
    if "batch" not in adata.obs.columns:
        adata.obs["batch"] = adata.obs["patient_id"]

    # Ensure contract fields
    adata.obs["cell_id"] = adata.obs.index.astype(str)
    adata.uns["rarecellbenchmark"] = {
        "version": "1.0.0",
        "dataset_id": dataset_id,
        "n_cells_raw": int(n_cells_raw),
        "n_cells_after_qc": int(adata.n_obs),
        "n_genes": int(adata.n_vars),
        "normalization_method": "normalize_total_log1p",
        "hvg_flavor": hvg_flavor,
        "n_hvgs": int(adata.var["highly_variable"].sum()),
        "n_pca_components": n_pca_components,
    }

    # Validate contract
    validate_anndata_contract(adata)

    # Step 12: Write
    out_path = out_dir / f"{dataset_id}.h5ad"
    write_h5ad(adata, out_path)

    # Step 13: SHA-256
    sha256 = hashlib.sha256()
    with open(out_path, "rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            sha256.update(chunk)
    logger.info("[%s] SHA-256: %s", dataset_id, sha256.hexdigest())

    # Step 14: QC report
    qc_report = {
        "dataset_id": dataset_id,
        "n_cells_raw": int(n_cells_raw),
        "n_cells_after_qc": int(adata.n_obs),
        "n_genes": int(adata.n_vars),
        "median_umi": float(np.median(adata.obs.get("total_counts", np.zeros(adata.n_obs)))),
        "median_genes": float(np.median(adata.obs.get("n_genes_by_counts", np.zeros(adata.n_obs)))),
        "normalization_method": "normalize_total_log1p",
        "n_hvgs": int(adata.var["highly_variable"].sum()),
        "pca_components": n_pca_components,
        "output_path": str(out_path),
    }
    interim_dir = out_dir.parent / "interim"
    interim_dir.mkdir(parents=True, exist_ok=True)
    qc_path = interim_dir / f"{dataset_id}_qc_report.json"
    with open(qc_path, "w") as f:
        json.dump(qc_report, f, indent=2)
    logger.info("[%s] QC report: %s", dataset_id, qc_path)

    return out_path
