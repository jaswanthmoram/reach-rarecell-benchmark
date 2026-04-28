# Datasets

REACH configures **10 curated scRNA-seq datasets** spanning solid tumours and blood malignancies. Processed `.h5ad` files are large generated artifacts and are not committed to this repository.

## Dataset table

| Dataset ID | Cancer Type | Platform | Cells | Accession | Data Access |
|---|---|---|---|---|---|
| hnscc_puram | Head & neck SCC | SMART-seq2 | 5,902 | GSE103322 | open |
| ov_izar_tirosh | Ovarian cancer (ascites) | 10x Chromium | 9,482 | GSE146026 | open |
| hcc_wei | Hepatocellular carcinoma | 10x Chromium | 19,382 | GSE149614 | public_processed_controlled_raw |
| luad_laughney | Lung adenocarcinoma | 10x Chromium | 33,782 | GSE123902 | open |
| rcc_multi | Renal cell carcinoma | 10x Chromium | 33,574 | GSE159115 | open |
| pdac_peng | Pancreatic ductal adenocarcinoma | 10x Chromium | 123,488 | GSE202051 | open |
| crc_lee | Colorectal cancer | 10x Chromium | 55,551 | GSE132465 | open |
| bcc_yost | Basal cell carcinoma | 10x Chromium | ~47,000 | GSE123813 | open |
| mm_ledergor | Multiple myeloma | 10x Chromium | 31,181 | GSE161801 | public_processed_controlled_raw |
| breast_ctc_szczerba | Breast cancer CTCs | SMART-seq2 | 357 | GSE109761 | open |

### Data access classification

- **open** - Publicly available from GEO; processed `.h5ad` and raw counts can be downloaded without access controls.
- **public_processed_controlled_raw** - Processed count matrices are public via GEO, but raw sequencing data require controlled access (e.g., dbGaP or EGA application).

## Download instructions

Use the helper script to print per-dataset instructions:

```bash
python scripts/download_dataset.py --dataset <DATASET_ID>
```

### Manual download

1. Visit the GEO accession page (e.g., `https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE103322`).
2. Download the supplementary processed count matrix.
3. Place files in `data/raw/<dataset_id>/`.
4. Run the preprocessing pipeline (`run_all.py` or Snakemake) to generate the canonical `.h5ad`.

### Controlled-access datasets

| Dataset | Raw data access |
|---|---|
| hcc_wei | EGA EGAS00001004468 |
| mm_ledergor | EGA EGAS00001004805 |

For these datasets, the benchmark provides fully processed `.h5ad` files; raw FASTQs are not required to reproduce the benchmark units.

## Link

- [`scripts/download_dataset.py`](../scripts/download_dataset.py) - Stub downloader that reads `configs/datasets.yaml`.
