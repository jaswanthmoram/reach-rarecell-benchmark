# Note: Large results snapshots

The `results_snapshots/` folder in the original workspace contained:

- `all_metrics.parquet` - 11,100 rows × 27 columns (unit-level metrics)
- `results_per_unit.csv`
- `results_per_method.csv`
- `results_per_dataset.csv`
- `degenerate_predictions_report.csv`

The **`.parquet` file (`all_metrics.parquet`) is NOT tracked in Git** because it exceeds Git's recommended file-size limits and is a binary format poorly suited to line-based version control.

## How to obtain the parquet file

1. **DVC pull:** The file is registered in `dvc.yaml` and can be retrieved with:
   ```bash
   dvc pull data/results/snapshots/paper_v1/all_metrics.parquet
   ```
2. **Zenodo release:** A public archive is pending the first repository release.
3. **Regenerate:** Run the full benchmark pipeline (Phases 10-11) to reproduce `data/results/all_metrics.parquet` from scratch.

The `.csv` snapshots have been copied to `data/results/snapshots/paper_v1/` and are tracked in Git.
