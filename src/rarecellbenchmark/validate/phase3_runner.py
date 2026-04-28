"""Phase 3 validation pipeline runner.

Adapted from the original ``src/validate/phase3_runner.py``.
"""

from __future__ import annotations

import json
import logging
import time
from pathlib import Path

import numpy as np
import pandas as pd
from anndata import AnnData

from rarecellbenchmark.io import read_h5ad
from rarecellbenchmark.validate.cnv import compute_cnv_score
from rarecellbenchmark.validate.neighborhood import compute_neighborhood_purity
from rarecellbenchmark.validate.signatures import score_signatures
from rarecellbenchmark.validate.tiers import assign_tiers

logger = logging.getLogger(__name__)

_MIN_P_HC_WARN = 50
_MIN_B_HC_WARN = 500


def run_phase3(
    processed_h5ad: Path,
    dataset_id: str,
    out_dir: Path,
    config: dict,
) -> Path:
    """Run the full Phase 3 validation pipeline for a single dataset.

    Parameters
    ----------
    processed_h5ad :
        Path to the pre-processed ``.h5ad`` file.
    dataset_id :
        Benchmark dataset identifier.
    out_dir :
        Directory where tier assignments and reports are written.
    config :
        Validation configuration.  Recognised keys:
        ``signatures_path``, ``n_neighbors``, ``seed``.

    Returns
    -------
    Path - the written validation-report JSON file.
    """
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    t0 = time.time()

    report: dict = {
        "dataset_id": dataset_id,
        "n_cells_input": 0,
        "steps": {},
    }

    # Load
    adata = read_h5ad(processed_h5ad)
    report["n_cells_input"] = int(adata.n_obs)

    # Step 1: Source annotations (simplified - derived from obs.cell_type)
    source_ann = _extract_source_annotations(adata)
    report["steps"]["source_annotations"] = {
        "n_positive": int((source_ann == "positive").sum()),
        "n_negative": int((source_ann == "negative").sum()),
        "n_unknown": int((source_ann == "unknown").sum()),
    }

    # Step 2: CNV scores
    cnv_scores = compute_cnv_score(adata)
    report["steps"]["cnv"] = {
        "status": "stub",
        "method_used": "compute_cnv_score",
        "n_cells": int(len(cnv_scores)),
    }

    # Step 3: Signature scoring
    sig_path = config.get("signatures_path", Path("configs/signatures.yaml"))
    sig_scores = score_signatures(adata, sig_path)
    report["steps"]["signature_scoring"] = {
        "status": "success" if sig_scores is not None else "skipped",
        "n_signatures": int(sig_scores.shape[1]) if sig_scores is not None else 0,
    }

    # Step 4: Neighborhood purity
    neighbor_purity = compute_neighborhood_purity(adata, label_col="cell_type")
    report["steps"]["neighborhood_purity"] = {
        "status": "success",
        "mean_purity": float(neighbor_purity.mean()),
    }

    # Step 5: Tier assignment
    tier_df = assign_tiers(
        adata=adata,
        cnv_scores=cnv_scores,
        signature_scores=sig_scores,
        config=config,
    )
    tier_path = out_dir / f"{dataset_id}_tier_assignments.parquet"
    tier_df.to_parquet(tier_path, index=True)
    report["steps"]["tier_assignment"] = {
        "output_path": str(tier_path),
        "tier_counts": tier_df["tier"].value_counts().to_dict(),
    }

    # Warnings
    warnings: list[str] = []
    p_hc = int((tier_df["tier"] == "T1").sum())
    b_hc = int((tier_df["tier"] == "T4").sum())
    if p_hc < _MIN_P_HC_WARN:
        warnings.append(f"T1 pool too small: {p_hc} < {_MIN_P_HC_WARN}")
    if b_hc < _MIN_B_HC_WARN:
        warnings.append(f"T4 pool too small: {b_hc} < {_MIN_B_HC_WARN}")
    if warnings:
        report["warnings"] = warnings
        for w in warnings:
            logger.warning("  WARNING: %s", w)

    report["elapsed_seconds"] = round(time.time() - t0, 2)
    report["tier_assignments_path"] = str(tier_path)

    report_path = out_dir / f"{dataset_id}_validation_report.json"
    with open(report_path, "w") as fh:
        json.dump(report, fh, indent=2, default=_json_serialise)
    logger.info("Wrote validation report -> %s", report_path)

    return report_path


def _extract_source_annotations(adata: AnnData) -> pd.Series:
    """Derive provisional source annotations from ``obs.cell_type``.

    Returns a Series indexed by ``adata.obs_names`` with values in
    {positive, negative, unknown}.
    """
    import re

    if "cell_type" not in adata.obs.columns:
        return pd.Series("unknown", index=adata.obs.index, name="source_annotation")

    ct = adata.obs["cell_type"].astype(str).str.lower()
    result = pd.Series("unknown", index=adata.obs.index, name="source_annotation")

    pos_pat = re.compile(r"malignant|tumor|cancer|ctc")
    neg_pat = re.compile(r"t cell|b cell|macrophage|fibroblast|endothelial|nk|monocyte|mast|dendritic|stromal")

    result[ct.str.contains(pos_pat, regex=True, na=False)] = "positive"
    result[ct.str.contains(neg_pat, regex=True, na=False)] = "negative"
    return result


def _json_serialise(obj):
    """JSON serialisation fallback for numpy types."""
    if isinstance(obj, np.bool_):
        return bool(obj)
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    raise TypeError(f"Object of type {type(obj)} is not JSON serialisable")
