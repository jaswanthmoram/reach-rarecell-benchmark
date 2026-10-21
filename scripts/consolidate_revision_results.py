#!/usr/bin/env python3
import pandas as pd
from pathlib import Path

def main():
    track_f_results_path = Path("data/results/revision/track_f/track_f_results.csv")
    track_f_leaderboard_path = Path("data/results/revision/track_f/track_f_leaderboard.csv")
    
    if not track_f_results_path.exists():
        print(f"ERROR: Track F results not found at {track_f_results_path}")
        return

    print("Consolidating Track F and Track A results...")
    df_f_results = pd.read_csv(track_f_results_path)
    df_f_leaderboard = pd.read_csv(track_f_leaderboard_path)

    # 1. Load Track A leaderboard
    leaderboard_a_path = Path("data/results/leaderboard.csv")
    if not leaderboard_a_path.exists():
        # Fallback to snapshot
        leaderboard_a_path = Path("data/results/snapshots/paper_v1/results_per_method.csv")
    
    df_a = pd.read_csv(leaderboard_a_path)
    
    # 2. Extract median AP from Track F at 0.1% prevalence (which is the most challenging)
    df_f_01 = df_f_leaderboard[df_f_leaderboard["prevalence"] == 0.001][["method_id", "median_ap"]]
    df_f_01.columns = ["method_id", "track_f_median_ap_0.1pct"]

    # Extract overall Track F median AP (across all prevalences)
    df_f_overall = df_f_results.groupby("method_id")["ap"].median().reset_index()
    df_f_overall.columns = ["method_id", "track_f_median_ap_overall"]

    # Merge Track A and Track F results
    merged = pd.merge(df_a[["method_id", "median_ap"]], df_f_01, on="method_id", how="outer")
    merged = pd.merge(merged, df_f_overall, on="method_id", how="outer")
    merged.columns = ["method_id", "track_a_median_ap", "track_f_median_ap_0.1pct", "track_f_median_ap_overall"]

    # Calculate delta (track_f 0.1% vs track_a)
    merged["delta_ap_0.1pct"] = merged["track_f_median_ap_0.1pct"] - merged["track_a_median_ap"]
    merged["delta_ap_overall"] = merged["track_f_median_ap_overall"] - merged["track_a_median_ap"]

    # `delta` is the figure/response-doc alias for the 0.1% prevalence delta.
    merged["delta"] = merged["delta_ap_0.1pct"]

    # Write to BOTH cited paths from the single source so the figure generator
    # and RESPONSE_TO_REVIEWERS citations never desync (was: a stale track_f/
    # copy carried the 160-unit scCAD/DeepScena medians, contradicting the
    # 140-unit leaderboard values used in the manuscript).
    comparison_files = [
        Path("data/results/revision/track_a_vs_f_comparison.csv"),
        Path("data/results/revision/track_f/track_a_vs_f_comparison.csv"),
    ]
    for comparison_file in comparison_files:
        comparison_file.parent.mkdir(parents=True, exist_ok=True)
        merged.to_csv(comparison_file, index=False)
        print(f"Wrote Track A vs F comparison to {comparison_file}")
    print("\nComparison Table:")
    print(merged.to_string(index=False))

    # 3. Create REVISION_RESULTS_INDEX.md
    index_path = Path("data/results/revision/REVISION_RESULTS_INDEX.md")
    
    # Check if other revision results exist to extract numbers for the index
    circularity_path = Path("data/results/revision/circularity_ranking.csv")
    casee_path = Path("data/results/revision/casee_filtered_leaderboard.csv")
    concordance_path = Path("data/results/revision/cnv_concordance.csv")
    sensitivity_path = Path("data/results/revision/threshold_sensitivity.csv")

    circularity_rho = "N/A"
    if circularity_path.exists():
        df_circ = pd.read_csv(circularity_path)
        circularity_rho = f"{df_circ['spearman_rho'].iloc[0]:.6f}"

    casee_ap_all = "N/A"
    casee_ap_excl = "N/A"
    if casee_path.exists():
        df_casee = pd.read_csv(casee_path)
        casee_ap_all = f"{df_casee[df_casee['method_id'] == 'CaSee']['median_ap_all'].iloc[0]:.6f}"
        casee_ap_excl = f"{df_casee[df_casee['method_id'] == 'CaSee']['median_ap_excl_degenerate'].iloc[0]:.6f}"

    concordance_auroc = "N/A"
    concordance_mcc = "N/A"
    if concordance_path.exists():
        df_conc = pd.read_csv(concordance_path)
        concordance_auroc = f"{df_conc[df_conc['dataset_id'] == 'overall']['auroc'].iloc[0]:.6f}"
        concordance_mcc = f"{df_conc[df_conc['dataset_id'] == 'overall']['mcc'].iloc[0]:.6f}"

    sensitivity_range = "N/A"
    if sensitivity_path.exists():
        df_sens = pd.read_csv(sensitivity_path)
        valid_rhos = df_sens["spearman_rho"].dropna()
        if not valid_rhos.empty:
            sensitivity_range = f"[{valid_rhos.min():.6f}, {valid_rhos.max():.6f}]"

    index_content = f"""# REACH Revision Results Index

This document acts as the single source of truth for numbers cited in the manuscript revision response.

| Reviewer Point | Description | Output File | Key Metrics / Values |
|---|---|---|---|
| **R1-1** | Circularity check (Spearman rho of rankings without CNV vs published) | `circularity_ranking.csv` | Spearman rho: {circularity_rho} |
| **R1-2** | CNV validation concordance vs source malignancy annotations | `cnv_concordance.csv` | Overall AUROC: {concordance_auroc}, MCC: {concordance_mcc} |
| **R1-5** | CaSee degenerate-filtered AP (all vs excluded degenerate) | `casee_filtered_leaderboard.csv` | CaSee median AP: {casee_ap_all} (all) / {casee_ap_excl} (excl-degenerate) |
| **R1-6** | Label threshold sensitivity correlation range | `threshold_sensitivity.csv` | Spearman rho range: {sensitivity_range} |
| **R1-9** | Pairwise Cliff's delta effect sizes | `cliff_delta_matrix.csv` | Check file for method-by-method effect sizes |
| **R3-2 / R3-5** | Track F (intra-lineage) leaderboard and delta vs Track A | `track_a_vs_f_comparison.csv` | Check file for method drop values |
"""
    index_path.write_text(index_content, encoding="utf-8")
    print(f"Wrote Revision Results Index to {index_path}")

if __name__ == "__main__":
    main()
