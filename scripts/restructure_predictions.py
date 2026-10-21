import shutil
from pathlib import Path

def main():
    predictions_dir = Path("data/predictions")
    if not predictions_dir.exists():
        print("predictions directory not found.")
        return
        
    print("Restructuring prediction files...")
    moved_preds = 0
    moved_metas = 0
    
    for method_dir in predictions_dir.iterdir():
        if not method_dir.is_dir():
            continue
        for unit_dir in list(method_dir.iterdir()):
            if not unit_dir.is_dir():
                continue
            pred_file = unit_dir / "predictions.csv"
            meta_file = unit_dir / "runmeta.json"
            
            if pred_file.exists():
                shutil.move(str(pred_file), str(method_dir / f"{unit_dir.name}_predictions.csv"))
                moved_preds += 1
            if meta_file.exists():
                shutil.move(str(meta_file), str(method_dir / f"{unit_dir.name}_runmeta.json"))
                moved_metas += 1
                
            try:
                unit_dir.rmdir()
            except OSError:
                pass
                
    print(f"Restructuring completed. Moved {moved_preds} predictions and {moved_metas} run metas.")

if __name__ == "__main__":
    main()
