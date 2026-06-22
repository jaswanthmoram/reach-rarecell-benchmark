#!/usr/bin/env python3
import pandas as pd
import numpy as np
import scanpy as sc
from scipy.stats import spearmanr
from pathlib import Path
from rarecellbenchmark.validate.tiers import _extract_source
from rarecellbenchmark.validate.signatures import score_signatures
from rarecellbenchmark.validate.neighborhood import compute_neighborhood_purity
from rarecellbenchmark.evaluate.metrics import load_prediction_scores, average_precision

def main():
    processed_dir = Path("data/processed")
    cnv_dir = Path("data/results/revision/cnv_scores")
    predictions_dir = Path("data/predictions")
    tracks_a_dir = Path("data/tracks/a")
    output_dir = Path("data/results/revision")
    output_dir.mkdir(parents=True, exist_ok=True)

    h5ad_files = sorted(processed_dir.glob("*.h5ad"))
    datasets = [f.stem for f in h5ad_files]
    print(f"Found datasets: {datasets}")

    # Load published dataset-specific leaderboard to compare rankings
    df_dataset_leaderboard = pd.read_csv("data/results/snapshots/paper_v1/results_per_dataset.csv")

    methods = [d.name for d in predictions_dir.iterdir() if d.is_dir() and d.name != "__pycache__"]
    print(f"Found methods: {methods}")

    # Pre-load predictions paths
    pred_files_by_method = {}
    for method in methods:
        pred_files_by_method[method] = sorted((predictions_dir / method).glob("*_track_a_*_predictions.csv"))

    # Map unit_id to its unit labels file paths
    unit_label_files = sorted(tracks_a_dir.glob("**/*_labels.parquet"))
    unit_info = []
    for f in unit_label_files:
        unit_id = f.stem.removesuffix("_labels")
        parts = unit_id.split("_track_a_")
        dataset_id = parts[0]
        unit_info.append({
            "unit_id": unit_id,
            "dataset_id": dataset_id,
            "path": f
        })
    df_units = pd.DataFrame(unit_info)

    sig_settings = [0.10, 0.15, 0.20]
    knn_settings = [0.40, 0.50, 0.60]

    sensitivity_results = []

    # Process dataset by dataset
    for dataset_id in datasets:
        print(f"\nProcessing {dataset_id}...")
        
        # Load dataset once
        adata = sc.read_h5ad(processed_dir / f"{dataset_id}.h5ad")
        cnv_file = cnv_dir / f"{dataset_id}_cnv.parquet"
        if not cnv_file.exists():
            print(f"Warning: CNV parquet not found for {dataset_id}")
            continue
        df_cnv = pd.read_parquet(cnv_file)
        cnv_scores = df_cnv["cnv_score"]
        
        # Precompute source labels
        source = _extract_source(adata)
        
        # Precompute signatures
        sig_df = score_signatures(adata, Path("configs/signatures.yaml"))
        if sig_df is not None and len(sig_df.columns) > 0:
            sig_max = sig_df.max(axis=1)
        else:
            sig_max = pd.Series(0.0, index=adata.obs.index)
            
        # Precompute neighborhood purity on source labels
        adata_copy = adata.copy()
        adata_copy.obs["_temp_source"] = source.values
        purity = compute_neighborhood_purity(adata_copy, label_col="_temp_source")
        
        unknown_fraction = (source == "unknown").mean()
        is_pos = source == "positive"
        is_neg = source == "negative"
        
        # CNV threshold: 75th percentile of the full dataset
        cnv_threshold = np.percentile(cnv_scores.values, 75)
        cnv_high = cnv_scores >= cnv_threshold
        
        # Get units for this dataset
        ds_units = df_units[df_units["dataset_id"] == dataset_id]
        if ds_units.empty:
            continue
            
        # Load predictions and align cells for this dataset
        ds_predictions = {}
        for method in methods:
            for pred_file in pred_files_by_method[method]:
                uid = pred_file.stem.removesuffix("_predictions")
                if uid in ds_units["unit_id"].values:
                    scores = load_prediction_scores(pred_file)
                    ds_predictions[(method, uid)] = scores
                    
        # Now evaluate all 9 combinations
        for sig_t in sig_settings:
            for knn_t in knn_settings:
                purity_threshold = knn_t
                if unknown_fraction > 0.5:
                    purity_threshold = 0.0
                    
                # Derive tiers
                labels = pd.Series("unknown", index=adata.obs.index)
                sig_high = sig_max >= sig_t
                neighbor_high = purity >= purity_threshold
                
                labels[is_pos & sig_high & neighbor_high & cnv_high] = "positive"
                labels[is_neg & (~sig_high) & neighbor_high & (~cnv_high)] = "background"
                
                labels.index = labels.index.astype(str)
                
                # Relabel Track A units under this setting
                relabeled_units = {}
                for idx, row in ds_units.iterrows():
                    orig_labels = pd.read_parquet(row["path"])
                    cell_ids = orig_labels.index.astype(str)
                    unit_new_labels = labels.reindex(cell_ids)
                    y_true = (unit_new_labels == "positive").astype(int)
                    if y_true.sum() > 0:
                        relabeled_units[row["unit_id"]] = y_true

                if not relabeled_units:
                    continue

                # Compute AP per method for this dataset and setting
                ds_ap_results = []
                for (method, uid), scores in ds_predictions.items():
                    if uid not in relabeled_units:
                        continue
                    y_true = relabeled_units[uid]
                    aligned_scores = scores.reindex(y_true.index)
                    if aligned_scores.isna().any():
                        fill_value = 0.0 if scores.empty else float(np.nanmin(scores.values)) - 1.0
                        aligned_scores = aligned_scores.fillna(fill_value)

                    ap = average_precision(y_true.values, aligned_scores.values)
                    ds_ap_results.append({
                        "method_id": method,
                        "unit_id": uid,
                        "ap": ap
                    })

                if not ds_ap_results:
                    continue

                df_ds_aps = pd.DataFrame(ds_ap_results)
                method_medians = df_ds_aps.groupby("method_id")["ap"].median().reset_index()

                # Get published rankings for this dataset
                published_ds = df_dataset_leaderboard[df_dataset_leaderboard["dataset_id"] == dataset_id]
                merged = pd.merge(method_medians, published_ds[["method_id", "median_ap"]], on="method_id")
                
                if len(merged) < 3:
                    rho, pval = np.nan, np.nan
                else:
                    rho, pval = spearmanr(merged["ap"], merged["median_ap"])

                n_pos = int((labels == "positive").sum())
                n_bg = int((labels == "background").sum())

                sensitivity_results.append({
                    "dataset_id": dataset_id,
                    "aucell_threshold": sig_t,
                    "knn_threshold": knn_t,
                    "n_P_HC": n_pos,
                    "n_B_HC": n_bg,
                    "spearman_rho": rho,
                    "spearman_pvalue": pval
                })
                
            print(f"  AUCell=0.15, kNN=0.50: n_P={n_pos}, n_B={n_bg}, Spearman rho={rho:.6f}")

    df_sensitivity = pd.DataFrame(sensitivity_results)
    
    # Save sensitivity analysis results
    output_file = output_dir / "threshold_sensitivity.csv"
    df_sensitivity.to_csv(output_file, index=False)
    print(f"\nSaved threshold sensitivity report to {output_file}")

    # Summary statistics: print range of Spearman rho values
    valid_rhos = df_sensitivity["spearman_rho"].dropna()
    if not valid_rhos.empty:
        print(f"\nSpearman Correlation Range: [{valid_rhos.min():.6f}, {valid_rhos.max():.6f}]")
        print(f"Mean Spearman correlation: {valid_rhos.mean():.6f}")

if __name__ == "__main__":
    main()
