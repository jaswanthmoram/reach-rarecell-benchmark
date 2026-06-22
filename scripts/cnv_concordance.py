#!/usr/bin/env python3
import pandas as pd
import numpy as np
import scanpy as sc
from sklearn.metrics import confusion_matrix, matthews_corrcoef, roc_auc_score
from pathlib import Path
from rarecellbenchmark.validate.tiers import _extract_source

def compute_metrics(y_true, y_score, y_pred_bin):
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred_bin).ravel()
    sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0
    mcc = matthews_corrcoef(y_true, y_pred_bin)
    
    # AUROC
    try:
        auroc = roc_auc_score(y_true, y_score)
    except Exception:
        auroc = 0.5
        
    return sensitivity, specificity, mcc, auroc

def main():
    processed_dir = Path("data/processed")
    cnv_dir = Path("data/results/revision/cnv_scores")
    output_dir = Path("data/results/revision")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    h5ad_files = sorted(processed_dir.glob("*.h5ad"))
    
    results = []
    
    # To accumulate for overall metrics
    all_y_true = []
    all_y_score = []
    all_y_pred_bin = []
    
    for f in h5ad_files:
        dataset_id = f.stem
        cnv_file = cnv_dir / f"{dataset_id}_cnv.parquet"
        if not cnv_file.exists():
            print(f"Warning: CNV file not found for {dataset_id}")
            continue
            
        print(f"Calculating concordance for {dataset_id}...")
        adata = sc.read_h5ad(f)
        
        # Load CNV scores
        df_cnv = pd.read_parquet(cnv_file)
        cnv_scores = df_cnv["cnv_score"]
        
        # Get source labels
        source = _extract_source(adata)
        
        # Align indexes
        cnv_scores = cnv_scores.reindex(source.index)
        
        # Filter for known labels (positive or negative)
        valid_mask = source.isin(["positive", "negative"])
        if valid_mask.sum() == 0:
            print(f"Warning: No valid source labels for {dataset_id}")
            continue
            
        y_true = (source[valid_mask] == "positive").astype(int).values
        y_score = cnv_scores[valid_mask].values
        
        # Binarize CNV at 75th percentile of the full dataset
        threshold = np.percentile(cnv_scores.values, 75)
        y_pred_bin = (y_score >= threshold).astype(int)
        
        sens, spec, mcc, auroc = compute_metrics(y_true, y_score, y_pred_bin)
        
        results.append({
            "dataset_id": dataset_id,
            "n_cells": len(y_true),
            "n_positive": int(y_true.sum()),
            "n_background": int(len(y_true) - y_true.sum()),
            "sensitivity": sens,
            "specificity": spec,
            "mcc": mcc,
            "auroc": auroc
        })
        
        all_y_true.extend(y_true)
        all_y_score.extend(y_score)
        all_y_pred_bin.extend(y_pred_bin)
        
    if all_y_true:
        all_y_true = np.array(all_y_true)
        all_y_score = np.array(all_y_score)
        all_y_pred_bin = np.array(all_y_pred_bin)
        
        sens, spec, mcc, auroc = compute_metrics(all_y_true, all_y_score, all_y_pred_bin)
        results.append({
            "dataset_id": "overall",
            "n_cells": len(all_y_true),
            "n_positive": int(all_y_true.sum()),
            "n_background": int(len(all_y_true) - all_y_true.sum()),
            "sensitivity": sens,
            "specificity": spec,
            "mcc": mcc,
            "auroc": auroc
        })
        
    df_results = pd.DataFrame(results)
    print("\nCNV vs Source Concordance:")
    print(df_results.to_string(index=False))
    
    # Save to CSV
    output_file = output_dir / "cnv_concordance.csv"
    df_results.to_csv(output_file, index=False)
    print(f"\nSaved CNV concordance to {output_file}")

if __name__ == "__main__":
    main()
