# Data Directory

This directory contains all data assets for the REACH project.
**Raw and processed data files are NOT committed to Git.** Use DVC or external storage for large files.

## Directory Structure

- `data/raw/` - downloaded raw matrices; not committed
- `data/interim/` - QC reports and temporary outputs
- `data/processed/` - canonical `.h5ad` files; DVC/external only
- `data/validation/` - tier assignments and validation reports
- `data/tracks/a/` - Track A controlled real spike-in units
- `data/tracks/b/` - Track B synthetic Splatter units
- `data/tracks/c/` - Track C null-control units
- `data/tracks/d/` - Track D natural prevalence units
- `data/tracks/e/` - Track E noisy-label robustness units
- `data/predictions/` - method predictions; DVC/external only
- `data/results/tables/` - regenerated metrics/leaderboards; ignored by default
- `data/results/figures/` - regenerated figures; ignored by default
- `data/results/snapshots/` - frozen result snapshots
- `data/toy/` - generated toy data used for tests and examples; ignored by default

## Data Access Barriers

The following table classifies each dataset by access level and provides links or instructions for requesting controlled-access raw data where applicable.

| dataset_id | access_class | request_url / instructions |
|---|---|---|
| hnscc_puram | public | Raw data unavailable due to privacy restrictions. Processed counts are public via GEO. |
| bcc_yost | public | Fully public via GEO. |
| hcc_wei | public_processed_controlled_raw | Raw data available via EGA: [EGAS00001004468](https://ega-archive.org/datasets/EGAS00001004468) |
| luad_laughney | public | Fully public via GEO. |
| pdac_peng | public | Fully public via GEO. |
| crc_lee | public | Raw data unavailable due to privacy restrictions. Processed counts are public via GEO. |
| rcc_multi | public | Raw data intended for dbGaP; see [dbGaP](https://www.ncbi.nlm.nih.gov/gap/) for study access. Processed counts are public via GEO. |
| ov_izar_tirosh | public | Raw data accessible via the DUOS/Broad route: [DUOS](https://duos.broadinstitute.org/). Processed counts are public via GEO. |
| mm_ledergor | public_processed_controlled_raw | Raw data available via EGA: [EGAS00001004805](https://ega-archive.org/datasets/EGAS00001004805) |
| breast_ctc_szczerba | public | Fully public via GEO. |
