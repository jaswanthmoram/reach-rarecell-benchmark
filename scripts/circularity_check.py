#!/usr/bin/env python3
import pandas as pd
import numpy as np
import scanpy as sc
from scipy.stats import spearmanr
from pathlib import Path
from rarecellbenchmark.validate.tiers import rederive_hc_labels_no_cnv
from rarecellbenchmark.evaluate.metrics import load_prediction_scores, average_precision

def main():
    processed_dir = Path("data/processed")
    predictions_dir = Path("data/predictions")
    tracks_a_dir = Path("data/tracks/a")
    output_dir = Path("data/results/revision")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Get all datasets
    h5ad_files = sorted(processed_dir.glob("*.h5ad"))
    datasets = [f.stem for f in h5ad_files]
    print(f"Found datasets: {datasets}")
    
    # 1. Precompute new labels for all datasets
    new_labels_dict = {}
    for dataset_id in datasets:
        print(f"Re-deriving labels for {dataset_id}...")
        adata = sc.read_h5ad(processed_dir / f"{dataset_id}.h5ad")
        new_labels = rederive_hc_labels_no_cnv(adata, signatures=Path("configs/signatures.yaml"))
        new_labels_dict[dataset_id] = new_labels
        
    # 2. Collect all Track A units
    unit_label_files = sorted(tracks_a_dir.glob("**/*_labels.parquet"))
    print(f"Found {len(unit_label_files)} Track A unit label files.")
    
    # Map unit_id to its relabeled binary y_true (Series)
    relabeled_units = {}
    for f in unit_label_files:
        unit_id = f.stem.removesuffix("_labels")
        parts = unit_id.split("_track_a_")
        dataset_id = parts[0]
        
        # Load original unit labels
        orig_labels = pd.read_parquet(f)
        cell_ids = orig_labels.index.astype(str)
        
        # Get the new labels for these cell IDs
        ds_new_labels = new_labels_dict[dataset_id].copy()
        ds_new_labels.index = ds_new_labels.index.astype(str)
        unit_new_labels = ds_new_labels.reindex(cell_ids.astype(str))
        
        # Map 'positive' to 1, and everything else (background, unknown) to 0.
        y_true = (unit_new_labels == "positive").astype(int)
        
        if y_true.sum() == 0:
            print(f"Warning: unit {unit_id} has 0 positive cells after relabeling!")
            continue
            
        relabeled_units[unit_id] = y_true

    # 3. Find predictions for each method and calculate AP
    methods = [d.name for d in predictions_dir.iterdir() if d.is_dir() and d.name != "__pycache__"]
    print(f"Found methods: {methods}")
    
    results = []
    
    for method in methods:
        pred_files = sorted((predictions_dir / method).glob("*_track_a_*_predictions.csv"))
        for pred_file in pred_files:
            unit_id = pred_file.stem.removesuffix("_predictions")
            if unit_id not in relabeled_units:
                continue
                
            y_true = relabeled_units[unit_id]
            scores = load_prediction_scores(pred_file)
            
            # Align scores to y_true
            aligned_scores = scores.reindex(y_true.index)
            if aligned_scores.isna().any():
                fill_value = 0.0 if scores.empty else float(np.nanmin(scores.values)) - 1.0
                aligned_scores = aligned_scores.fillna(fill_value)
                
            ap = average_precision(y_true.values, aligned_scores.values)
            results.append({
                "method_id": method,
                "unit_id": unit_id,
                "ap": ap
            })
            
    df_results = pd.DataFrame(results)
    
    # Compute median AP per method
    method_medians = df_results.groupby("method_id")["ap"].median().reset_index()
    method_medians.columns = ["method_id", "median_ap_no_cnv"]
    
    # Load published leaderboard
    leaderboard = pd.read_csv("data/results/leaderboard.csv")
    
    # Merge and calculate Spearman rho
    merged = pd.merge(method_medians, leaderboard[["method_id", "median_ap"]], on="method_id")
    print("\nMerged Leaderboard Comparison:")
    print(merged.to_string(index=False))
    
    rho, pval = spearmanr(merged["median_ap_no_cnv"], merged["median_ap"])
    print(f"\nSpearman Correlation (rho): {rho:.6f} (p-value: {pval:.2e})")
    
    # Write ranking CSV
    merged["spearman_rho"] = rho
    merged["spearman_pvalue"] = pval
    merged.to_csv(output_dir / "circularity_ranking.csv", index=False)
    print(f"Saved circularity check to {output_dir / 'circularity_ranking.csv'}")

if __name__ == "__main__":
    main()
