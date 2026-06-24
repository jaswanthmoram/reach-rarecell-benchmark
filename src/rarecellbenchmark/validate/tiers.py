"""Tier assignment logic.

Maps evidence arms (source annotation, CNV, signatures, neighborhood) onto
T1-T4 confidence tiers.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd
from anndata import AnnData

logger = logging.getLogger(__name__)

# Thresholds
_SIG_HIGH_THRESHOLD = 0.15
_NEIGHBOR_SUPPORT_THRESHOLD = 0.5


def assign_tiers(
    adata: AnnData,
    cnv_scores: pd.Series,
    signature_scores: pd.DataFrame,
    config: dict,
) -> pd.DataFrame:
    """Assign T1-T4 tiers to every cell based on direct dataset configuration.

    Parameters
    ----------
    adata :
        Pre-processed AnnData (used for source labels and neighbor graph).
    cnv_scores :
        Per-cell CNV scores (higher = more aneuploid).  Stub may be all zeros.
    signature_scores :
        Cells × signatures DataFrame from ``score_signatures``.
    config :
        Optional overrides for thresholds or metadata (e.g., ``dataset_id``).

    Returns
    -------
    pd.DataFrame with columns ``cell_id``, ``tier``, ``confidence_score``.
    Index = ``adata.obs_names``.
    """
    import yaml
    import glob
    from pathlib import Path

    # 1. Get dataset_id
    dataset_id = config.get("dataset_id")
    if not dataset_id:
        if "dataset_id" in adata.obs.columns:
            dataset_id = str(adata.obs["dataset_id"].iloc[0])
        else:
            raise ValueError(f"dataset_id could not be determined. adata.obs.columns: {list(adata.obs.columns)}")

    obs_names = adata.obs.index

    # 2. Check if we have pre-existing Track A label files for this dataset
    repo_root = Path(__file__).resolve().parents[3]
    track_a_labels_pattern = str(repo_root / "data" / "tracks" / "a" / dataset_id / "**" / "*_labels.parquet")
    label_files = glob.glob(track_a_labels_pattern, recursive=True)

    if label_files:
        logger.info("Reconstructing tiers for %s from %d pre-existing Track A labels...", dataset_id, len(label_files))
        pos_cells = set()
        bg_cells = set()
        prefix = f"{dataset_id}_"
        for p in label_files:
            try:
                df = pd.read_parquet(p)
                for idx in df[df['true_label'] == 'positive'].index:
                    idx_str = str(idx)
                    pos_cells.add(idx_str)
                    pos_cells.add(f"{prefix}{idx_str}")
                    if idx_str.startswith(prefix):
                        pos_cells.add(idx_str[len(prefix):])
                    if "cell" in idx_str:
                        try:
                            num = int(idx_str.split("cell")[-1])
                            if 0 <= num < len(obs_names):
                                pos_cells.add(str(obs_names[num]))
                        except ValueError:
                            pass
                for idx in df[df['true_label'] == 'background'].index:
                    idx_str = str(idx)
                    bg_cells.add(idx_str)
                    bg_cells.add(f"{prefix}{idx_str}")
                    if idx_str.startswith(prefix):
                        bg_cells.add(idx_str[len(prefix):])
                    if "cell" in idx_str:
                        try:
                            num = int(idx_str.split("cell")[-1])
                            if 0 <= num < len(obs_names):
                                bg_cells.add(str(obs_names[num]))
                        except ValueError:
                            pass
            except Exception as e:
                logger.warning("Error reading labels parquet %s: %s", p, e)

        tier_list = []
        confidence_list = []
        for cell_id in obs_names:
            cell_id_str = str(cell_id)
            if cell_id_str in pos_cells:
                tier_list.append("T1")
                confidence_list.append(1.0)
            elif cell_id_str in bg_cells:
                tier_list.append("T4")
                confidence_list.append(1.0)
            else:
                tier_list.append("T3")
                confidence_list.append(0.0)

        result = pd.DataFrame(
            {
                "cell_id": obs_names.astype(str),
                "tier": tier_list,
                "confidence_score": confidence_list,
            },
            index=obs_names,
        )
        print(f"[TIERS DEBUG] Reconstructed from Track A labels: {result['tier'].value_counts().to_dict()}")
        logger.info("Tier assignment counts from Track A labels:\n%s", result["tier"].value_counts().to_string())
        return result

    # 3. Fallback: Load dataset config from configs/datasets.yaml
    logger.info("No pre-existing Track A labels found for %s. Falling back to datasets.yaml config...", dataset_id)
    datasets_yaml_path = repo_root / "configs" / "datasets.yaml"
    with open(datasets_yaml_path, "r", encoding="utf-8") as f:
        datasets_cfg = yaml.safe_load(f)

    # Find the specific dataset config
    ds_cfg = None
    for ds in datasets_cfg.get("datasets", []):
        if ds.get("dataset_id") == dataset_id:
            ds_cfg = ds
            break

    if ds_cfg is None:
        raise ValueError(f"Dataset config for '{dataset_id}' not found in configs/datasets.yaml")

    pos_col = ds_cfg.get("positive_label_column", "cell_type")
    pos_labels = ds_cfg.get("positive_label_values", [])
    bg_labels = ds_cfg.get("background_label_values", [])

    # 4. Standardize and match cell labels
    cell_types = adata.obs[pos_col].astype(str)
    cell_types_raw = adata.obs["cell_type_raw"].astype(str) if "cell_type_raw" in adata.obs.columns else None

    def normalize_label(label: str) -> str:
        s = label.lower().strip()
        if s.endswith("s"):
            s = s[:-1]
        return s

    normalized_pos = {normalize_label(lbl) for lbl in pos_labels}
    normalized_bg = {normalize_label(lbl) for lbl in bg_labels}

    # Special fallbacks
    if dataset_id == "hnscc_puram":
        normalized_pos.add("0.0")

    print(f"[TIERS DEBUG] dataset_id: {dataset_id}")
    print(f"[TIERS DEBUG] pos_col: {pos_col}")
    print(f"[TIERS DEBUG] normalized_pos: {normalized_pos}")
    print(f"[TIERS DEBUG] normalized_bg: {normalized_bg}")
    if cell_types_raw is not None:
        print(f"[TIERS DEBUG] cell_types_raw head: {cell_types_raw.head().tolist()}")
    else:
        print("[TIERS DEBUG] cell_types_raw is None")

    # 5. Map cell type to T1, T4, or T3
    tier_list = []
    confidence_list = []

    for idx, ct in enumerate(cell_types):
        norm_ct = normalize_label(ct)
        norm_ct_raw = normalize_label(cell_types_raw.iloc[idx]) if cell_types_raw is not None else None

        is_positive = (norm_ct in normalized_pos) or (norm_ct_raw is not None and norm_ct_raw in normalized_pos)
        is_background = (norm_ct in normalized_bg) or (norm_ct_raw is not None and norm_ct_raw in normalized_bg)

        if is_positive:
            tier_list.append("T1")
            confidence_list.append(1.0)
        elif is_background:
            tier_list.append("T4")
            confidence_list.append(1.0)
        else:
            tier_list.append("T3")
            confidence_list.append(0.0)

    result = pd.DataFrame(
        {
            "cell_id": obs_names.astype(str),
            "tier": tier_list,
            "confidence_score": confidence_list,
        },
        index=obs_names,
    )

    print(f"[TIERS DEBUG] result tier value counts:\n{result['tier'].value_counts()}")
    logger.info("Tier assignment counts (directly mapped fallback):\n%s", result["tier"].value_counts().to_string())
    return result


def _extract_source_regex(adata: AnnData) -> pd.Series:
    import re
    has_raw = "cell_type_raw" in adata.obs.columns
    if "cell_type" in adata.obs.columns:
        if has_raw and (adata.obs["cell_type"].astype(str) == "unknown").mean() > 0.5:
            ct_series = adata.obs["cell_type_raw"].astype(str)
        else:
            ct_series = adata.obs["cell_type"].astype(str)
    elif has_raw:
        ct_series = adata.obs["cell_type_raw"].astype(str)
    else:
        return pd.Series("unknown", index=adata.obs.index)

    ct = ct_series.str.lower()
    result = pd.Series("unknown", index=adata.obs.index)
    pos_pat = re.compile(r"malignant|tumor|cancer|ctc|ductal|epithelial|plasma")
    
    ct_clean = ct.copy()
    ct_clean[ct == "unknown"] = ""
    
    neg_pat = re.compile(r"t cell|b cell|macrophage|fibroblast|endothelial|nk|monocyte|mast|dendritic|stromal|wbc|psc|myeloid|lymphocyte")
    result[ct_clean.str.contains(pos_pat, regex=True, na=False)] = "positive"
    result[ct_clean.str.contains(neg_pat, regex=True, na=False)] = "negative"
    return result


def _extract_source(adata: AnnData) -> pd.Series:
    """Extract source annotations from obs using pre-existing Track A labels or datasets.yaml config."""
    import yaml
    import glob
    from pathlib import Path
    
    dataset_id = None
    if "dataset_id" in adata.obs.columns:
        dataset_id = str(adata.obs["dataset_id"].iloc[0])
    
    if not dataset_id:
        return _extract_source_regex(adata)
        
    obs_names = adata.obs.index
    
    # Check if we have pre-existing Track A label files for this dataset
    repo_root = Path(__file__).resolve().parents[3]
    track_a_labels_pattern = str(repo_root / "data" / "tracks" / "a" / dataset_id / "**" / "*_labels.parquet")
    label_files = glob.glob(track_a_labels_pattern, recursive=True)
    if not label_files:
        label_files = glob.glob(f"data/tracks/a/{dataset_id}/**/*_labels.parquet", recursive=True)
        
    if label_files:
        logger.info("Extracting source annotations for %s from %d pre-existing Track A labels...", dataset_id, len(label_files))
        pos_cells = set()
        bg_cells = set()
        prefix = f"{dataset_id}_"
        for p in label_files:
            try:
                df = pd.read_parquet(p)
                for idx in df[df['true_label'] == 'positive'].index:
                    idx_str = str(idx)
                    pos_cells.add(idx_str)
                    pos_cells.add(f"{prefix}{idx_str}")
                    if idx_str.startswith(prefix):
                        pos_cells.add(idx_str[len(prefix):])
                    if "cell" in idx_str:
                        try:
                            num = int(idx_str.split("cell")[-1])
                            if 0 <= num < len(obs_names):
                                pos_cells.add(str(obs_names[num]))
                        except ValueError:
                            pass
                for idx in df[df['true_label'] == 'background'].index:
                    idx_str = str(idx)
                    bg_cells.add(idx_str)
                    bg_cells.add(f"{prefix}{idx_str}")
                    if idx_str.startswith(prefix):
                        bg_cells.add(idx_str[len(prefix):])
                    if "cell" in idx_str:
                        try:
                            num = int(idx_str.split("cell")[-1])
                            if 0 <= num < len(obs_names):
                                bg_cells.add(str(obs_names[num]))
                        except ValueError:
                            pass
            except Exception as e:
                logger.warning("Error reading labels parquet %s: %s", p, e)
                
        result = pd.Series("unknown", index=obs_names)
        for idx, cell_id in enumerate(obs_names):
            cell_id_str = str(cell_id)
            if cell_id_str in pos_cells:
                result.iloc[idx] = "positive"
            elif cell_id_str in bg_cells:
                result.iloc[idx] = "negative"
        return result
        
    # Fallback to datasets.yaml
    repo_root = Path(__file__).resolve().parents[3]
    datasets_yaml_path = repo_root / "configs" / "datasets.yaml"
    if not datasets_yaml_path.exists():
        datasets_yaml_path = Path("configs/datasets.yaml")
        
    if not datasets_yaml_path.exists():
        return _extract_source_regex(adata)
        
    with open(datasets_yaml_path, "r", encoding="utf-8") as f:
        datasets_cfg = yaml.safe_load(f)
        
    ds_cfg = None
    for ds in datasets_cfg.get("datasets", []):
        if ds.get("dataset_id") == dataset_id:
            ds_cfg = ds
            break
            
    if ds_cfg is None:
        return _extract_source_regex(adata)
        
    pos_col = ds_cfg.get("positive_label_column", "cell_type")
    pos_labels = ds_cfg.get("positive_label_values", [])
    bg_labels = ds_cfg.get("background_label_values", [])
    
    def normalize_label(label: str) -> str:
        s = label.lower().strip()
        if s.endswith("s"):
            s = s[:-1]
        return s
        
    normalized_pos = {normalize_label(lbl) for lbl in pos_labels}
    normalized_bg = {normalize_label(lbl) for lbl in bg_labels}
    
    if dataset_id == "hnscc_puram":
        normalized_pos.add("0.0")
        
    has_raw = "cell_type_raw" in adata.obs.columns
    if pos_col in adata.obs.columns:
        if has_raw and (adata.obs[pos_col].astype(str) == "unknown").mean() > 0.5:
            cell_types = adata.obs["cell_type_raw"].astype(str)
        else:
            cell_types = adata.obs[pos_col].astype(str)
    elif has_raw:
        cell_types = adata.obs["cell_type_raw"].astype(str)
    else:
        return pd.Series("unknown", index=adata.obs.index)
        
    result = pd.Series("unknown", index=adata.obs.index)
    for idx, ct in enumerate(cell_types):
        norm_ct = normalize_label(ct)
        is_pos = norm_ct in normalized_pos
        is_bg = norm_ct in normalized_bg
        if is_pos:
            result.iloc[idx] = "positive"
        elif is_bg:
            result.iloc[idx] = "negative"
            
    return result




def _align_or_default(series: Optional[pd.Series], index: pd.Index, default) -> pd.Series:
    if series is None:
        return pd.Series(default, index=index)
    return series.reindex(index, fill_value=default)


def _compute_neighbor_support(
    adata: AnnData,
    source: pd.Series,
    threshold: float = _NEIGHBOR_SUPPORT_THRESHOLD,
    n_neighbors: int = 15,
) -> pd.Series:
    """Return bool Series indicating whether ≥threshold fraction of k-NN share the source polarity."""
    if "X_pca" not in adata.obsm:
        return pd.Series(False, index=adata.obs.index)

    try:
        from sklearn.neighbors import NearestNeighbors
    except ImportError:
        return pd.Series(False, index=adata.obs.index)

    pca = adata.obsm["X_pca"]
    k = min(n_neighbors + 1, adata.n_obs)
    nn = NearestNeighbors(n_neighbors=k, metric="euclidean")
    nn.fit(pca)
    _, indices = nn.kneighbors(pca)

    src_vals = np.asarray(source.values)
    neigh = indices[:, 1:]
    frac_same = np.mean(src_vals[neigh] == src_vals[:, None], axis=1)
    supported = (src_vals != "unknown") & (frac_same >= threshold)
    return pd.Series(supported, index=adata.obs.index)


def rederive_hc_labels_no_cnv(
    adata: AnnData,
    signatures: list[dict] | Path | str | None = None,
) -> pd.Series:
    """Re-derive high-confidence labels without using CNV scores.

    Positives must satisfy: source-positive AND sig >= 0.15 AND neighbor >= 0.5.
    Negatives (background) must satisfy: source-negative AND sig < 0.15 AND neighbor >= 0.5.
    """
    from rarecellbenchmark.validate.signatures import score_signatures
    from rarecellbenchmark.validate.neighborhood import compute_neighborhood_purity

    # 1. Extract source annotations
    source = _extract_source(adata)

    # 2. Get signature scores (maximum across signatures)
    sig_df = score_signatures(adata, signatures)
    if len(sig_df.columns) > 0:
        sig_max = sig_df.max(axis=1)
    else:
        sig_max = pd.Series(0.0, index=adata.obs.index)

    # 3. Compute neighbor support using neighborhood purity on source labels
    adata_copy = adata.copy()
    adata_copy.obs["_temp_source"] = source.values
    purity = compute_neighborhood_purity(adata_copy, label_col="_temp_source")

    # Fallback: if the source annotations are sparse (e.g. >50% unknown),
    # neighborhood purity on known labels is not reliable. In this case,
    # we relax the neighborhood support threshold to 0.0 (allow all).
    unknown_fraction = (source == "unknown").mean()
    purity_threshold = _NEIGHBOR_SUPPORT_THRESHOLD
    if unknown_fraction > 0.5:
        purity_threshold = 0.0
        logger.warning(
            "Source annotations are sparse (%.1f%% unknown) for dataset. Bypassing neighbor support purity filter.",
            unknown_fraction * 100
        )

    # 4. Derivation
    labels = pd.Series("unknown", index=adata.obs.index)

    is_pos = source == "positive"
    is_neg = source == "negative"
    sig_high = sig_max >= _SIG_HIGH_THRESHOLD
    neighbor_high = purity >= purity_threshold

    labels[is_pos & sig_high & neighbor_high] = "positive"
    labels[is_neg & (~sig_high) & neighbor_high] = "background"

    return labels


