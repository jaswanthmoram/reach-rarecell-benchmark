#!/usr/bin/env python3
import json
import argparse
import sys
import pandas as pd
import scanpy as sc
from pathlib import Path
from rarecellbenchmark.tracks.track_f_generator import TrackFGenerator
from rarecellbenchmark.methods.registry import get_method
from rarecellbenchmark.evaluate.metrics import evaluate_predictions

def discover_track_f_manifests(units_dir: Path) -> list[Path]:
    if not units_dir.exists():
        return []
    return sorted(units_dir.rglob("*_manifest.json"))

def load_manifest(path: Path) -> dict:
    data = json.loads(path.read_text())
    data.setdefault("unit_id", path.stem.removesuffix("_manifest"))
    return data

def expression_path_for_manifest(manifest_path: Path, manifest: dict) -> Path:
    unit_id = str(manifest["unit_id"])
    # Path is: data/tracks/f/{dataset_id}/prev_{prevalence}/{unit_id}_expression.h5ad
    candidate = manifest_path.with_name(f"{unit_id}_expression.h5ad")
    if candidate.exists():
        return candidate
    raise FileNotFoundError(f"Expression file not found: {candidate}")

def parse_args():
    parser = argparse.ArgumentParser(description="Run Track F pipeline")
    parser.add_argument(
        "--methods",
        nargs="+",
        default=["random_baseline", "expr_threshold", "hvg_logreg"],
        help="Method IDs to run"
    )
    parser.add_argument(
        "--datasets",
        nargs="+",
        default=["crc_lee", "rcc_multi"],
        help="Dataset IDs to run"
    )
    parser.add_argument(
        "--evaluate-only",
        action="store_true",
        help="Only run evaluation on existing predictions"
    )
    return parser.parse_args()

def main():
    args = parse_args()
    
    tracks_dir = Path("data/tracks/f")
    predictions_dir = Path("data/predictions")
    results_dir = Path("data/results/revision/track_f")
    results_dir.mkdir(parents=True, exist_ok=True)
    
    if not args.evaluate_only:
        # Step 1: Generate units for each dataset
        for dataset_id in args.datasets:
            print(f"\n=== Generating Track F units for {dataset_id} ===")
            
            processed_h5ad = Path("data/processed") / f"{dataset_id}.h5ad"
            if not processed_h5ad.exists():
                print(f"ERROR: Processed h5ad not found: {processed_h5ad}")
                sys.exit(1)
                
            # Load existing high-confidence positives from Track A units
            pos_cell_ids = set()
            track_a_dir = Path("data/tracks/a") / dataset_id
            if track_a_dir.exists():
                for label_path in track_a_dir.glob("**/*_labels.parquet"):
                    df_labels = pd.read_parquet(label_path)
                    pos_cell_ids.update(df_labels[df_labels["true_label"] == "positive"].index.astype(str))
            
            print(f"Loaded {len(pos_cell_ids)} positive cell IDs from Track A units.")
            
            adata = sc.read_h5ad(processed_h5ad)
            
            if dataset_id == "crc_lee":
                # Epithelial cells: cell_type is "Epithelial cells"
                epithelial = adata.obs["cell_type"] == "Epithelial cells"
                # Malignant epithelial cells: epithelial, from tumor tissue, and in positive cell IDs from Track A
                malignant_mask = epithelial & (adata.obs["tissue_origin"] == "Tumor") & adata.obs.index.astype(str).isin(pos_cell_ids)
                # Normal epithelial cells: epithelial, and from normal tissue
                normal_epi_mask = epithelial & (adata.obs["tissue_origin"] == "Normal")
            elif dataset_id == "rcc_multi":
                cell_types = adata.obs["cell_type_raw"].astype(str) if "cell_type_raw" in adata.obs.columns else adata.obs["cell_type"].astype(str)
                # Malignant epithelial cells: cell_type_raw == "Tumor cells" and in pos_cell_ids
                malignant_mask = (cell_types == "Tumor cells") & adata.obs.index.astype(str).isin(pos_cell_ids)
                # Normal epithelial cells: cell_type_raw == "Normal epithelial"
                normal_epi_mask = cell_types == "Normal epithelial"
            else:
                raise ValueError(f"Dataset {dataset_id} is not supported for Track F.")
                
            print(f"Malignant Epithelial count: {malignant_mask.sum()}")
            print(f"Normal Epithelial count: {normal_epi_mask.sum()}")
            
            if malignant_mask.sum() == 0 or normal_epi_mask.sum() == 0:
                print(f"ERROR: Malignant or Normal Epithelial count is 0 for {dataset_id}!")
                sys.exit(1)
                
            # Generate Track F units
            generator = TrackFGenerator()
            config = {
                "malignant_mask": malignant_mask,
                "normal_epi_mask": normal_epi_mask,
                "prevalences": (0.001, 0.005, 0.01),
                "n_replicates": 5,
                "unit_size": 2000,
                "base_seed": 42
            }
            generator.generate(
                dataset_id=dataset_id,
                processed_h5ad=processed_h5ad,
                out_dir=tracks_dir / dataset_id,
                config=config
            )
            
        # Step 2: Run wrappers for specified methods on generated units
        manifest_paths = discover_track_f_manifests(tracks_dir)
        print(f"\nDiscovered {len(manifest_paths)} Track F unit manifest(s)")
        
        for manifest_path in manifest_paths:
            manifest = load_manifest(manifest_path)
            unit_id = str(manifest["unit_id"])
            dataset_id = manifest.get("dataset_id", unit_id.split("_track_f_")[0])
            
            if dataset_id not in args.datasets:
                continue
                
            for method_id in args.methods:
                pred_csv = predictions_dir / method_id / f"{unit_id}_predictions.csv"
                if pred_csv.exists():
                    print(f"Skipping {method_id} on {unit_id} (already completed)")
                    continue
                    
                print(f"Running method {method_id} on {unit_id}...")
                try:
                    expr_path = expression_path_for_manifest(manifest_path, manifest)
                    wrapper = get_method(method_id)()
                    wrapper.run(
                        expr_path,
                        predictions_dir / method_id,
                        {**manifest, "unit_id": unit_id, "seed": 42}
                    )
                except Exception as exc:
                    print(f"ERROR: {method_id} failed on {unit_id}: {exc}", file=sys.stderr)
                    sys.exit(1)

    # Step 3: Post-evaluation
    print("\n=== Evaluating Track F predictions ===")
    
    pred_files = sorted(predictions_dir.rglob("*_predictions.csv"))
    pred_files = [path for path in pred_files if "_track_f_" in path.name]
    
    if args.methods:
        pred_files = [path for path in pred_files if path.parent.name in args.methods]
        
    if not pred_files:
        print("Warning: No prediction files found for Track F evaluation.")
        return
        
    rows = []
    for pred_path in pred_files:
        unit_id = pred_path.stem.removesuffix("_predictions")
        # Find manifest file to load unit metadata
        manifests = sorted(tracks_dir.rglob(f"{unit_id}_manifest.json"))
        if not manifests:
            print(f"Warning: Manifest not found for unit {unit_id}")
            continue
        manifest = load_manifest(manifests[0])
        labels_path = manifests[0].with_name(f"{unit_id}_labels.parquet")
        
        run_meta = {
            "method_id": pred_path.parent.name,
            "unit_id": unit_id,
            "track": "F",
            "prevalence": manifest["prevalence"],
            "replicate": manifest["replicate"],
            "dataset_id": manifest.get("dataset_id", unit_id.split("_track_f_")[0])
        }
        try:
            metrics = evaluate_predictions(pred_path, labels_path, run_meta=run_meta)
            rows.append(metrics)
        except Exception as exc:
            print(f"Warning: Failed to evaluate {unit_id} for {run_meta['method_id']}: {exc}")
            
    if not rows:
        print("Warning: No metrics computed.")
        return
        
    df_results = pd.DataFrame(rows)
    results_file = results_dir / "track_f_results.csv"
    df_results.to_csv(results_file, index=False)
    print(f"Wrote detailed unit results to {results_file}")
    
    # Compute median AP per method and prevalence
    leaderboard_rows = []
    grouped = df_results.groupby(["method_id", "prevalence"])
    for (method, prev), group in grouped:
        leaderboard_rows.append({
            "method_id": method,
            "prevalence": prev,
            "median_ap": group["ap"].median(),
            "mean_ap": group["ap"].mean(),
            "n_units": len(group)
        })
        
    df_leaderboard = pd.DataFrame(leaderboard_rows)
    leaderboard_file = results_dir / "track_f_leaderboard.csv"
    df_leaderboard.to_csv(leaderboard_file, index=False)
    print(f"Wrote Track F leaderboard to {leaderboard_file}")
    
    print("\nTrack F Leaderboard:")
    print(df_leaderboard.sort_values(by=["prevalence", "median_ap"], ascending=[True, False]).to_string(index=False))

if __name__ == "__main__":
    main()
