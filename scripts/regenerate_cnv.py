import glob
import os
import time
import pandas as pd
import scanpy as sc
from rarecellbenchmark.preprocess.gene_annotations import annotate_genes
from rarecellbenchmark.validate.cnv import compute_cnv_score

def main():
    processed_dir = "data/processed"
    output_dir = "data/results/revision/cnv_scores"
    os.makedirs(output_dir, exist_ok=True)
    
    positions_file = "data/reference/gene_positions.tsv"
    if not os.path.exists(positions_file):
        raise FileNotFoundError(f"Gene positions table not found at {positions_file}")
        
    import sys
    h5ad_files = sorted(glob.glob(os.path.join(processed_dir, "*.h5ad")))
    if len(sys.argv) > 1:
        target = sys.argv[1]
        h5ad_files = [f for f in h5ad_files if target in os.path.basename(f)]
        
    if not h5ad_files:
        print(f"No matching .h5ad files found in {processed_dir} for target '{sys.argv[1] if len(sys.argv) > 1 else ''}'")
        return

    print(f"Found {len(h5ad_files)} datasets to process.")
    
    summary_data = []
    
    for f in h5ad_files:
        dataset_name = os.path.basename(f).replace(".h5ad", "")
        out_path = os.path.join(output_dir, f"{dataset_name}_cnv.parquet")

        if os.path.exists(out_path):
            print(f"Skipping {dataset_name} as output parquet already exists at {out_path}")
            continue

        print(f"\nProcessing {dataset_name}...")
        t0 = time.time()
        
        # Load dataset
        adata = sc.read_h5ad(f)
        print(f"Loaded {dataset_name}: {adata.n_obs} cells, {adata.n_vars} genes")
        
        # Annotate gene coordinates
        adata = annotate_genes(adata, positions_file, delimiter="\t", drop_unmatched=False)
        
        # Compute CNV scores
        cnv_scores = compute_cnv_score(adata)
        
        # Save to parquet
        df = pd.DataFrame(cnv_scores)
        df.to_parquet(out_path)
        
        duration = time.time() - t0
        print(f"Completed {dataset_name} in {duration:.1f}s. Saved to {out_path}")
        
        # Sanity check: compare epithelial vs immune cells if columns exist
        epi_mean = None
        imm_mean = None
        if "cell_type" in adata.obs.columns:
            obs = adata.obs.copy()
            obs["cnv_score"] = cnv_scores
            
            # Identify epithelial/malignant cells
            epi_mask = obs["cell_type"].astype(str).str.lower().str.contains("epithelial|malignant|tumor")
            imm_mask = obs["cell_type"].astype(str).str.lower().str.contains("t cell|b cell|myeloid|immune|nk cell|plasma|lymphocyte")
            
            if epi_mask.any():
                epi_mean = obs.loc[epi_mask, "cnv_score"].mean()
            if imm_mask.any():
                imm_mean = obs.loc[imm_mask, "cnv_score"].mean()
                
            print(f"  Epithelial/Malignant mean CNV: {epi_mean}")
            print(f"  Immune/Stromal mean CNV: {imm_mean}")
            
        summary_data.append({
            "dataset": dataset_name,
            "n_cells": adata.n_obs,
            "n_genes": adata.n_vars,
            "epi_mean": epi_mean,
            "imm_mean": imm_mean,
            "duration_s": duration
        })
        
    summary_df = pd.DataFrame(summary_data)
    print("\n=== REGENERATED CNV SUMMARY ===")
    print(summary_df.to_string(index=False))

if __name__ == "__main__":
    main()
