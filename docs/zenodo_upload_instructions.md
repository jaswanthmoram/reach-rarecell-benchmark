# REACH Benchmark — Zenodo Upload and Synchronization Instructions

This document provides step-by-step instructions on how to upload the newly generated REACH benchmark archives to Zenodo and synchronize the DOI references across the codebase.

## 1. Staged Archives

The `scripts/create_zenodo_archives.py` script has packaged all 8 archives into the `archives/` directory of the repository:

| Archive Filename | Content | Target Path (Unpacks to) | Size |
|------------------|---------|---------------------------|------|
| `reach-processed-datasets.tar` | Processed .h5ad datasets | `data/processed/` | ~7.4 GB |
| `reach-track-units-abc.tar` | Track A, B, C units (including complete Track C) | `data/tracks/{a,b,c}/` | ~18.0 GB |
| `reach-track-units-de.tar` | Track D, E units | `data/tracks/{d,e}/` | ~2.3 GB |
| `reach-track-units-f.tar` | Track F intra-lineage units (NEW) | `data/tracks/f/` | ~187 MB |
| `reach-cnv-results.tar` | CNV scores + concordance validation results (NEW) | `data/results/revision/cnv_scores/` | ~6.8 MB |
| `reach-track-f-results.tar` | Track F leaderboard + results (NEW) | `data/results/revision/track_f/` | ~30 KB |
| `reach-frozen-results.tar.gz` | Frozen snapshot tables backing figures | `data/results/snapshots/paper_v1/` | ~1.0 MB |
| `reach-complete-results.tar` | Complete predictions for all tracks | `data/predictions/` | ~1.6 GB |

## 2. Uploading to Zenodo

1. Go to [Zenodo](https://zenodo.org/) and log in to your account.
2. Go to **New Upload** (or create a new version of your existing record).
3. Upload each of the files above. You can create separate records or put them in the same record. We recommend:
   - **Record 1 (Datasets):** `reach-processed-datasets.tar`
   - **Record 2 (Track ABC Units):** `reach-track-units-abc.tar`
   - **Record 3 (Track DE Units):** `reach-track-units-de.tar`
   - **Record 4 (Track F Units - NEW):** `reach-track-units-f.tar`
   - **Record 5 (CNV Results - NEW):** `reach-cnv-results.tar`
   - **Record 6 (Track F Results - NEW):** `reach-track-f-results.tar`
   - **Record 7 (Complete & Frozen Results):** `reach-frozen-results.tar.gz` and `reach-complete-results.tar`
4. Publish the records and obtain the new **Zenodo Record IDs** (the numbers in the DOI URL, e.g., `19850652` for `10.5281/zenodo.19850652`).

## 3. Updating DOI References in the Codebase

Once you have published the archives and have the new Record IDs/DOIs, update them in the following places:

### A. Download Script
In `scripts/download_zenodo_data.py`, update the URLs at the top of the file to point to the new Zenodo records:

```python
ARCHIVES = [
    {
        "url": "https://zenodo.org/api/records/<NEW_DATASET_ID>/files/reach-processed-datasets.tar/content",
        "filename": "reach-processed-datasets.tar",
        "desc": "Processed datasets (7.4 GB)",
    },
    ...
]
```
*(Also change `.tar.gz` to `.tar` in the download script filenames if you chose not to compress them).*

### B. Readme and CITATION.cff
Update the DOI badges and links in:
- `README.md` (search for `doi.org/10.5281/zenodo` or `badge/DOI`)
- `CITATION.cff` (update `identifiers` section)
- `pyproject.toml` (update `zenodo_doi` reference)

### C. Paper and Documentation
Update DOI mentions in:
- `paper.md`
- `docs/reproducibility.md`
- `manuscript_revision/paper_pdf.md` (PDF-ready manuscript)

## 4. Verification

After updating the download script, test that a clean download and extraction works successfully:

```bash
python scripts/download_zenodo_data.py
```

This will automatically fetch your newly uploaded archives from Zenodo using `aria2c` and extract them into the correct directory structure!