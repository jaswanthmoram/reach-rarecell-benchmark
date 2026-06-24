#!/usr/bin/env python3
import os
import sys
from pathlib import Path
import pandas as pd

# Add src to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from rarecellbenchmark.validate.phase3_runner import run_phase3
from rarecellbenchmark.tracks.track_a_generator import TrackAGenerator
from rarecellbenchmark.tracks.track_c_generator import TrackCGenerator

def main():
    root_dir = Path(__file__).resolve().parent.parent
    os.chdir(root_dir)
    print(f"Working in directory: {root_dir}")
    
    datasets = [
        "hnscc_puram",
        "ov_izar_tirosh",
        "hcc_wei",
        "luad_laughney",
        "rcc_multi",
        "pdac_peng",
        "crc_lee",
        "bcc_yost"
    ]
    
    validation_dir = root_dir / "data" / "validation"
    validation_dir.mkdir(parents=True, exist_ok=True)
    
    track_a_dir = root_dir / "data" / "tracks" / "a"
    track_a_dir.mkdir(parents=True, exist_ok=True)
    
    track_c_dir = root_dir / "data" / "tracks" / "c"
    track_c_dir.mkdir(parents=True, exist_ok=True)
    
    config = {
        "signatures_path": root_dir / "configs" / "signatures.yaml",
        "global_seed": 42,
        "base_seed": 42,
        "n_replicates": 5,
        "n_neighbors": 15
    }
    
    # 1. Run Phase 3 validation to generate tier assignments
    print("\nStep 1: Running Phase 3 validation for all datasets...")
    tier_dfs = {}
    for dataset_id in datasets:
        h5ad_path = root_dir / "data" / "processed" / f"{dataset_id}.h5ad"
        if not h5ad_path.exists():
            print(f"Skipping validation for {dataset_id}: processed file not found.")
            continue
            
        print(f"  Validating {dataset_id}...")
        try:
            run_phase3(
                processed_h5ad=h5ad_path,
                dataset_id=dataset_id,
                out_dir=validation_dir,
                config=config
            )
            tier_path = validation_dir / f"{dataset_id}_tier_assignments.parquet"
            tier_df = pd.read_parquet(tier_path)
            tier_dfs[dataset_id] = tier_df
        except Exception as e:
            print(f"  Error validating {dataset_id}: {e}")
            import traceback
            traceback.print_exc()
            
    # 2. Run Track A generation
    print("\nStep 2: Generating Track A units...")
    track_a_gen = TrackAGenerator()
    for dataset_id in datasets:
        h5ad_path = root_dir / "data" / "processed" / f"{dataset_id}.h5ad"
        if dataset_id not in tier_dfs:
            continue
        print(f"  Generating Track A for {dataset_id}...")
        try:
            # We want to place the outputs directly in data/tracks/a
            track_a_gen.generate(
                dataset_id=dataset_id,
                processed_h5ad=h5ad_path,
                out_dir=track_a_dir / dataset_id,
                config={
                    "tier_assignments": tier_dfs[dataset_id],
                    "global_seed": 42,
                    "base_seed": 42,
                    "n_replicates": 5
                }
            )
        except Exception as e:
            print(f"  Error generating Track A for {dataset_id}: {e}")
            
    # 3. Run Track C generation
    print("\nStep 3: Generating Track C units...")
    track_c_gen = TrackCGenerator()
    for dataset_id in datasets:
        h5ad_path = root_dir / "data" / "processed" / f"{dataset_id}.h5ad"
        if dataset_id not in tier_dfs:
            continue
        print(f"  Generating Track C for {dataset_id}...")
        try:
            track_c_gen.generate(
                dataset_id=dataset_id,
                processed_h5ad=h5ad_path,
                out_dir=track_c_dir / dataset_id,
                config={
                    "tier_assignments": tier_dfs[dataset_id],
                    "global_seed": 42,
                    "base_seed": 42,
                    "n_replicates": 5
                }
            )
        except Exception as e:
            print(f"  Error generating Track C for {dataset_id}: {e}")
            
    print("\nLocal track generation and validation completed successfully!")

if __name__ == "__main__":
    main()
