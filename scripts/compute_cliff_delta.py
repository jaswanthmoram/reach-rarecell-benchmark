#!/usr/bin/env python3
import pandas as pd
import numpy as np
from pathlib import Path
from rarecellbenchmark.evaluate.statistics import cliff_delta

def main():
    results_file = Path("data/results/results_per_unit.csv")
    output_dir = Path("data/results/revision")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    if not results_file.exists():
        raise FileNotFoundError(f"Results file not found at {results_file}")
        
    df = pd.read_csv(results_file)
    
    # Filter for Track A
    df_track_a = df[df["track"] == "A"].copy()
    
    # Pivot to get method × unit AP matrix
    # rows: unit_id, columns: method_id, values: ap
    pivot_df = df_track_a.pivot(index="unit_id", columns="method_id", values="ap")
    
    methods = sorted(pivot_df.columns)
    n_methods = len(methods)
    
    # Create empty matrix
    matrix = pd.DataFrame(np.zeros((n_methods, n_methods)), index=methods, columns=methods)
    
    for i in range(n_methods):
        for j in range(n_methods):
            m1 = methods[i]
            m2 = methods[j]
            # cliff_delta(m1, m2)
            # pairwise on aligned unit AP values
            aligned = pivot_df[[m1, m2]].dropna()
            if len(aligned) > 0:
                matrix.loc[m1, m2] = cliff_delta(aligned[m1].values, aligned[m2].values)
            else:
                matrix.loc[m1, m2] = 0.0
                
    print("\nCliff's Delta Matrix:")
    print(matrix.round(4).to_string())
    
    # Write to CSV
    output_file = output_dir / "cliff_delta_matrix.csv"
    matrix.to_csv(output_file)
    print(f"\nSaved Cliff's Delta matrix to {output_file}")
    
    # Print key values
    # FiRE vs expr_threshold
    if "FiRE" in matrix.index and "expr_threshold" in matrix.columns:
        print(f"\nFiRE vs expr_threshold Cliff's delta: {matrix.loc['FiRE', 'expr_threshold']:.6f}")
    # hvg_logreg vs FiRE
    if "hvg_logreg" in matrix.index and "FiRE" in matrix.columns:
        print(f"hvg_logreg vs FiRE Cliff's delta: {matrix.loc['hvg_logreg', 'FiRE']:.6f}")

if __name__ == "__main__":
    main()
