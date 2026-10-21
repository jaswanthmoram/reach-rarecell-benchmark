#!/usr/bin/env python3
import pandas as pd
from pathlib import Path

def main():
    results_file = Path("data/results/results_per_unit.csv")
    output_dir = Path("data/results/revision")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    if not results_file.exists():
        raise FileNotFoundError(f"Results file not found at {results_file}")
        
    df = pd.read_csv(results_file)
    
    # Filter for Track A
    df_track_a = df[df["track"] == "A"].copy()
    
    # We want to make sure 'is_degenerate' is treated correctly as boolean
    if df_track_a["is_degenerate"].dtype == object:
        df_track_a["is_degenerate"] = df_track_a["is_degenerate"].astype(str).str.lower().isin(["true", "1", "yes"])
    else:
        df_track_a["is_degenerate"] = df_track_a["is_degenerate"].astype(bool)
        
    # Group by method and compute metrics
    methods = df_track_a["method_id"].unique()
    summary = []
    
    for method in sorted(methods):
        sub = df_track_a[df_track_a["method_id"] == method]
        
        median_ap_all = sub["ap"].median()
        n_degenerate = sub["is_degenerate"].sum()
        
        sub_excl = sub[~sub["is_degenerate"]]
        median_ap_excl = sub_excl["ap"].median() if len(sub_excl) > 0 else float("nan")
        
        summary.append({
            "method_id": method,
            "median_ap_all": median_ap_all,
            "n_degenerate": int(n_degenerate),
            "n_total": len(sub),
            "median_ap_excl_degenerate": median_ap_excl
        })
        
    df_summary = pd.DataFrame(summary)
    
    print("\nTrack A Method Summaries (All vs Excluded Degenerate):")
    print(df_summary.to_string(index=False))
    
    # Write to CSV
    output_file = output_dir / "casee_filtered_leaderboard.csv"
    df_summary.to_csv(output_file, index=False)
    print(f"\nSaved filtered leaderboard to {output_file}")

if __name__ == "__main__":
    main()
