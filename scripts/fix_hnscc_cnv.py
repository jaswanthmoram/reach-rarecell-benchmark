#!/usr/bin/env python3
"""Fix hnscc_puram CNV — strip quote-wrapped gene names and use correct reference_cats.

hnscc_puram has gene names wrapped in single quotes ('C9orf152') which don't match
the gene positions reference (C9orf152). Its cell_type labels are also singular
forms ('T cell', 'Fibroblast') not matching the original default reference cats.

This script:
1. Strips single quotes from var_names
2. Annotates gene positions
3. Computes CNV with explicit reference_cats matching hnscc_puram's labels
4. Saves to data/results/revision/cnv_scores/hnscc_puram_cnv.parquet
5. Asserts nonzero CNV
"""
import os
import time

import pandas as pd
import scanpy as sc

from rarecellbenchmark.validate.cnv import compute_cnv_score

HNSCC_REFERENCE_CATS = [
    "Fibroblast", "T cell", "Endothelial", "B cell",
    "Mast", "Macrophage", "Dendritic", "myocyte",
]


def main():
    processed_path = "data/processed/hnscc_puram.h5ad"
    positions_file = "data/reference/gene_positions.tsv"
    out_path = "data/results/revision/cnv_scores/hnscc_puram_cnv.parquet"

    if not os.path.exists(processed_path):
        raise FileNotFoundError(processed_path)
    if not os.path.exists(positions_file):
        raise FileNotFoundError(positions_file)

    print(f"Loading {processed_path}...")
    adata = sc.read_h5ad(processed_path)
    print(f"  {adata.n_obs} cells, {adata.n_vars} genes")

    quote_wrapped = adata.var_names[0].startswith("'") or adata.var_names[0].startswith('"')
    if quote_wrapped:
        print(f"  Stripping quote characters from {adata.n_vars} gene names...")
        adata.var_names = [str(g).strip("'\"") for g in adata.var_names]
        adata.var.index = adata.var.index.astype(object)
        if "gene_name" in adata.var.columns:
            adata.var["gene_name"] = [str(g).strip("'\"") for g in adata.var["gene_name"]]
        print(f"  Example: first 5 genes = {list(adata.var_names[:5])}")

    print("Annotating gene positions...")
    gene_pos = pd.read_csv(
        positions_file,
        sep="\t",
        header=None,
        names=["gene_name", "chromosome", "start", "end"],
    )
    gene_pos = gene_pos.drop_duplicates(subset="gene_name").set_index("gene_name")
    common = adata.var.index.intersection(gene_pos.index)
    print(f"  {len(common)}/{adata.n_vars} genes matched reference")

    if len(common) == 0:
        raise RuntimeError("No genes matched reference — aborting")

    adata.var["chromosome"] = gene_pos.reindex(adata.var.index)["chromosome"].fillna("").astype(str).values
    adata.var["start"] = gene_pos.reindex(adata.var.index)["start"].values
    adata.var["end"] = gene_pos.reindex(adata.var.index)["end"].values

    n_valid = (
        adata.var["chromosome"].notna()
        & (adata.var["chromosome"].astype(str) != "")
        & adata.var["start"].notna()
        & adata.var["end"].notna()
    ).sum()
    print(f"  {n_valid}/{adata.n_vars} genes have valid genomic positions")

    if n_valid == 0:
        raise RuntimeError("No genes matched after quote stripping — aborting")

    print(f"Computing CNV with reference_cats={HNSCC_REFERENCE_CATS}...")
    t0 = time.time()
    cnv_scores = compute_cnv_score(adata, reference_cats=HNSCC_REFERENCE_CATS)
    duration = time.time() - t0

    nonzero_frac = (cnv_scores != 0).mean()
    print(f"  Completed in {duration:.1f}s")
    print(f"  Mean CNV: {cnv_scores.mean():.6f}")
    print(f"  Nonzero fraction: {nonzero_frac:.2%}")
    print(f"  Max CNV: {cnv_scores.max():.6f}")

    assert nonzero_frac > 0.5, f"CNV is still mostly zeros ({nonzero_frac:.2%}) — fix failed"

    df = pd.DataFrame(cnv_scores)
    df.to_parquet(out_path)
    print(f"Saved to {out_path}")

    obs = adata.obs.copy()
    obs["cnv_score"] = cnv_scores.values
    epi_mask = obs["cell_type"].astype(str).str.lower().str.contains("epithelial|malignant|tumor|0\\.0")
    imm_mask = obs["cell_type"].astype(str).str.lower().str.contains("t cell|b cell|fibroblast|endothelial|mast|macrophage|dendritic|myocyte")
    if epi_mask.any():
        print(f"  Tumor/epithelial (0.0 + Tumor labels) mean CNV: {obs.loc[epi_mask, 'cnv_score'].mean():.6f}")
    if imm_mask.any():
        print(f"  Reference (immune/stromal) mean CNV: {obs.loc[imm_mask, 'cnv_score'].mean():.6f}")


if __name__ == "__main__":
    main()
