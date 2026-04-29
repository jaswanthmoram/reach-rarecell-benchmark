# REACH - System Architecture

> **Version:** 1.2-final  
> **Date:** 2026-04-27  
> **Scope:** Technical architecture of the REACH benchmark evaluation framework

---

## 1. Project Overview

REACH is a systematic, reproducible evaluation framework for computational methods that detect rare malignant cells in single-cell RNA-sequencing (scRNA-seq) data. The benchmark is organised into **12 phases** (Phase 0-12) that span the complete lifecycle from raw dataset ingestion to publication-quality figure generation.

### Benchmark Scope

- **Datasets:** 10 curated scRNA-seq datasets spanning 8 solid-tumour types and 2 blood/hematological malignancies.
- **Methods evaluated:** 10 included methods (6 ranked published detectors, 2 naive baselines, 1 supervised ceiling, 1 exploratory faithful method). Seven additional selected methods were excluded after output-quality control and are documented separately.
- **Benchmark units:** 1,110 total units across 5 tracks (A-E), producing 11,100 method-unit evaluations.
- **Primary endpoint:** Median Average Precision (AP) on Track A, computed on high-confidence positive (P_HC) versus high-confidence background (B_HC) cells.

### Design Principles

1. **Modularity** - Each phase is self-contained with explicit input/output contracts. Phases can be re-run independently without invalidating downstream outputs, provided upstream contracts are satisfied.
2. **Reproducibility** - All random seeds are fixed; SHA-256 checksums track processed data. Every prediction, metric, and figure is traceable to a specific code version and dataset hash.
3. **Extensibility** - New methods are added via a standardised wrapper interface (Phase 9). New datasets, tracks, or metrics require only localised changes.
4. **Robustness** - Failure handling is per-method and per-unit. Missing predictions do not crash evaluation; fallback scores are explicitly flagged and filtered from primary metric aggregation.

---

## 2. Repository Structure and Phase Dependency DAG

### 2.1 Top-Level Layout

```text
reach-rarecell-benchmark/
├── configs/               # Master configuration registry
├── data/                  # Raw, processed, tracks, validation, and results
│   ├── raw/
│   ├── processed/         # Canonical .h5ad files
│   ├── validation/        # Phase 3 tier assignments
│   ├── tracks/            # Track A/B/C/D/E units
│   └── results/           # Metrics, leaderboards, figures
├── docs/                  # Project documentation (not paper drafts)
├── src/                   # Core library code
│   └── rarecellbenchmark/
│       ├── preprocess/    # Phase 2
│       ├── validate/      # Phase 3
│       ├── tracks/        # Phases 4-8
│       ├── methods/       # Phase 9 wrappers
│       ├── evaluate/      # Phase 11
│       └── figures/       # Phase 12
├── scripts/               # Execution and analysis scripts
├── tests/                 # Unit and smoke tests
└── scripts/run_all.py     # Master orchestrator
```

### 2.2 Phase Dependency DAG

```
Phase 0: Environment Setup
    │
    ▼
Phase 1: Dataset Ingestion ──► configs/datasets.yaml
    │
    ▼
Phase 2: Preprocessing ──────► data/processed/*.h5ad
    │                          data/interim/*_qc_report.json
    │
    ▼
Phase 3: Validation ─────────► data/validation/*_tier_assignments.parquet
    │
    ├──► Phase 4: Track A (controlled real spike-ins)
    ├──► Phase 5: Track B (synthetic Splatter stress-test)
    ├──► Phase 6: Track C (null controls)
    ├──► Phase 7: Track D (natural blood/CTC prevalence)
    └──► Phase 8: Track E (noisy-label robustness)
    │
    ▼
Phase 9: Method Wrappers ────► src/methods/*/*_wrapper.py
    │
    ▼
Phase 10: Execution ─────────► results/<method_id>/<unit_id>/
    │                              predictions.csv + runmeta.json
    │
    ▼
Phase 11: Evaluation ────────► data/results/tables/phase11/*.csv
    │                          data/results/phase11/*.csv (compatibility copy)
    │
    ▼
Phase 12: Figure Generation ─► data/results/figures/phase12/*.png
```

Phases 4-8 are independent of each other once Phase 3 completes. Phase 10 can run in parallel across methods and units, subject to resource constraints. Phase 11 depends only on Phase 10 outputs and the hidden label files from Phases 4-8. Phase 12 depends only on Phase 11 outputs.

---

## 3. Data Flow

### 3.1 Raw → Processed → Validated → Tracks → Predictions → Metrics

```
GEO Dataset (raw counts)
    │
    ├──► src/preprocess/preprocess_dataset.py
    │      - Hard QC (min_genes=200, min_umi=500)
    │      - Normalisation (normalize_total + log1p)
    │      - HVG selection (2000 genes, seurat_v3)
    │      - PCA (50 components)
    │      - GRCh38 gene position annotation
    │
    ▼
Processed AnnData (.h5ad)
    ├── layers["counts"]        ← raw
    ├── layers["log1p_norm"]    ← normalised
    ├── obsm["X_pca"]           ← PCA embedding
    ├── var["chromosome"]       ← for CNV methods
    └── obs["cell_type"]        ← source annotation
    │
    ├──► src/validate/phase3_runner.py
    │      - Source annotation extraction
    │      - CNV inference (infercnvpy primary)
    │      - AUCell signature scoring
    │      - Tier assignment (P_HC-B_LC)
    │
    ▼
Tier Assignments (parquet)
    ├── P_HC / P_MC / P_LC
    ├── B_HC / B_MC / B_LC
    └── excluded / unknown
    │
    ├──► src/tracks/track_a_generator.py
    │      - Sample P_HC → positives
    │      - Sample B_HC → background
    │      - Merge at controlled prevalence (T1-T4)
    │
    ▼
Track Unit (.h5ad + .parquet + .json)
    ├── {unit_id}_expression.h5ad   ← blind (no labels)
    ├── {unit_id}_labels.parquet    ← hidden ground truth
    └── {unit_id}_manifest.json     ← metadata
    │
    ├──► src/methods/*/wrapper.py
    │      - Read blind expression
    │      - Compute cell-level malignancy scores
    │      - Write predictions.csv
    │
    ▼
Predictions (CSV)
    ├── cell_id, score, pred_label
    └── run_meta.json (runtime, memory, version, success)
    │
    ├──► src/evaluate/evaluate.py
    │      - Align predictions to hidden labels
    │      - Compute AP, AUROC, F1, precision, recall
    │      - Aggregate per method/dataset/track
    │
    ▼
Results (CSV)
    ├── data/results/tables/phase11/leaderboard.csv
    ├── data/results/tables/phase11/unit_metrics_sample.csv
    └── data/results/tables/phase11/*.csv
```

---

## 4. Full Description of Phases 1-12

### Phase 0 - Environment Setup
- **Purpose:** Prepare compute environment (Python virtual environment, R packages, GPU drivers).
- **Inputs:** `setup/requirements*.txt`, `setup/setup_r_packages.R`.
- **Outputs:** Executable benchmark environment with pinned dependency versions.
- **Key script:** `setup/setup_new_vm.sh`.

### Phase 1 - Dataset Ingestion
- **Purpose:** Download raw scRNA-seq data from GEO and register metadata.
- **Inputs:** `configs/datasets.yaml` (10 active dataset entries with accession IDs).
- **Outputs:** Raw count matrices in `data/raw/`; updated dataset registry.
- **Key script:** `src/ingest/download_dataset.py`.
- **Key outcome:** 10 datasets are registered and available for preprocessing.

### Phase 2 - Preprocessing
- **Purpose:** Convert raw data to canonical, QC-filtered AnnData objects.
- **Pipeline (16 steps):**
  1. Dataset-specific loader
  2. Gene symbol harmonisation (strip Ensembl version suffixes)
  3. Mitochondrial gene annotation
  4. Hard QC filters (`min_genes=200`, `min_umi=500`, `min_cells=3`)
  5. Doublet detection (Scrublet, gracefully skipped if unavailable)
  6. Adaptive mitochondrial filter (flags but does not auto-remove malignant high-mito cells)
  7. Normalisation (`normalize_total` target sum 10,000 + `log1p`)
  8. Raw counts stored in `layers["counts"]`
  9. Log-normalised layer stored in `layers["log1p_norm"]`
  10. HVG selection (Seurat v3, 2,000 genes; fallback to `cell_ranger`)
  11. PCA (50 components on HVG subset)
  12. Neighbourhood graph + Leiden clustering (resolution 0.5, seed 42)
  13. GRCh38 gene position annotation (`var["chromosome"]`, `var["start"]`, `var["end"]`)
  14. Obs column standardisation (`dataset_id`, `patient_id`, `cell_type`, `batch`)
  15. Write compressed `.h5ad` to `data/processed/`
  16. SHA-256 checksum + JSON QC report to `data/interim/`
- **Outputs:** `data/processed/{dataset_id}.h5ad`, `data/interim/{dataset_id}_qc_report.json`.

### Phase 3 - Validation and Tier Assignment
- **Purpose:** Assign per-cell confidence tiers using multi-arm evidence.
- **Evidence arms:**
  1. **Source annotation** - cell type labels from original publication metadata.
  2. **CNV prediction** - aneuploid vs diploid inference via `infercnvpy` (primary CNV caller for Version 1).
  3. **Signature score** - AUCell enrichment for cancer-type-specific gene signatures (threshold = 0.15).
  4. **Neighborhood support** - ≥50% of k=15 nearest PCA neighbors share the provisional class.
- **Tier rules (positive cells):**
  - P_HC: source=positive AND CNV=aneuploid AND sig=high AND neighbor_support=True
  - P_MC: source=positive AND 2 of {CNV=aneuploid, sig=high, neighbor_support}
  - P_LC: source=positive AND 1 of {CNV=aneuploid, sig=high, neighbor_support}
  - EXCLUDED: source=positive but 0 confirming arms
- **Tier rules (background cells):**
  - B_HC: source=negative AND CNV=diploid AND sig=low AND neighbor_support=True
  - B_MC: source=negative AND 2 of {CNV=diploid, sig=low, neighbor_support}
  - B_LC: source=negative AND 1 of {CNV=diploid, sig=low, neighbor_support}
  - EXCLUDED: source=negative but 0 confirming arms
- **Outputs:** `data/validation/{dataset_id}_tier_assignments.parquet`, `{dataset_id}_validation_report.json`.

### Phase 4 - Track A (Controlled Real Spike-ins)
- **Purpose:** Primary evaluation track. Real P_HC cells are spiked into real B_HC background at controlled prevalence.
- **Tiers:** T1 (5-10%), T2 (1-5%), T3 (0.1-1%), T4 (0.01-0.1%).
- **Rules:** ≥50 P_HC and ≥200 B_HC available; 5 replicates per tier per dataset; target ~2,000 cells per unit; duplicate fraction ≤20%.
- **Outputs:** `data/tracks/a/{dataset_id}/{tier}/{unit_id}_expression.h5ad`, `{unit_id}_labels.parquet`, `{unit_id}_manifest.json`.
- **Scale:** 200 units (8 datasets × 4 tiers × 5 replicates, with T4 limited to datasets with sufficient background cells).

### Phase 5 - Track B (Synthetic Splatter Stress-Test)
- **Purpose:** Secondary stress-test using synthetic data generated by the R package Splatter.
- **Rules:** 3 replicates per tier per dataset; realism audit (library size, dropout, DE overlap, PCA separation); failures tagged and excluded.
- **Outputs:** `data/tracks/b/...` (same naming convention as Track A).
- **Scale:** 120 units.

### Phase 6 - Track C (Null Controls)
- **Purpose:** Diagnostic false-positive control. Units contain only B_HC cells.
- **Rules:** Size-matched to median Track A unit per dataset; all labels = background (0).
- **Outputs:** `data/tracks/c/...`.
- **Scale:** 200 units.

### Phase 7 - Track D (Natural Blood/CTC Prevalence)
- **Purpose:** Evaluate methods on natural prevalence without artificial spike-ins.
- **Modes:** D_obs (natural prevalence), D_aug (diluted with PBMC background to hit target tiers).
- **Datasets:** `mm_ledergor` (multiple myeloma), `breast_ctc_szczerba` (breast CTCs).
- **Outputs:** `data/tracks/d/...`.
- **Scale:** 30 units.

### Phase 8 - Track E (Noisy-Label Robustness)
- **Purpose:** Test robustness to corrupted labels while keeping expression matrices unchanged.
- **Conditions:** noise10 (10% symmetric flip), noise20 (20% symmetric flip), asym_pos (30% positive→background), asym_neg (30% background→positive).
- **Critical restriction:** Because unsupervised methods do not consume labels as input, their predictions on Track E are identical to Track A. Evaluating identical predictions against corrupted labels measures metric degradation, not algorithmic robustness. Therefore, Track E robustness claims are restricted to the supervised `hvg_logreg` oracle.
- **Outputs:** `data/tracks/e/...`.
- **Scale:** 560 units (4 noise conditions × 140 Track A units).

### Phase 9 - Method Wrappers
- **Purpose:** Standardise the interface between benchmark units and each detection method.
- **Contract:** Every wrapper implements `run(input_h5ad: str, output_dir: str, config: dict) -> None`.
- **Required outputs:**
  - `predictions.csv` - columns: `cell_id`, `score`, `pred_label`
  - `runmeta.json` - keys: `method`, `version`, `runtime_seconds`, `peak_ram_mb`, `success`, `n_cells`, `fidelity` (`faithful` | `proxy` | `fallback`), `is_degenerate` (bool)
- **Categories:**
  - **Naive Baseline:** `random_baseline`, `expr_threshold`, `hvg_logreg` (supervised ceiling, not a competitor).
  - **Ranked Detector:** `FiRE`, `DeepScena`, `RareQ`, `cellsius`, `scCAD`, `scMalignantFinder`.
  - **Exploratory:** `CaSee` (Yu et al., 2022) - faithful implementation, reported separately from ranked published methods.
- **Excluded methods (7):** CopyKAT, MACE, SCANER, SCEVAN, raceid3, scATOMIC, GiniClust3 - documented in `docs/EXCLUDED_METHODS.md`.

### Phase 10 - Prediction Execution
- **Purpose:** Run every included method on every benchmark unit.
- **Strategy:** Resource-aware batching - naive baselines first, then fast Python methods, then R-based methods, then GPU-heavy methods (never simultaneously), then exploratory methods.
- **Failure handling:** Failed runs produce failure JSONs. Successful runs are never overwritten (`skip_existing=True`).
- **Outputs:** `results/<method_id>/<unit_id>/predictions.csv` + `runmeta.json`.
- **Scale:** 10 methods × 1,110 units = 11,100 prediction jobs.

### Phase 11 - Evaluation and Statistics
- **Purpose:** Compute metrics, aggregate leaderboards, run statistical tests, and generate sensitivity analyses.
- **Primary metric:** Average Precision (AP) on P_HC vs B_HC.
- **Secondary metrics:** AUROC, F1@top-k, Precision@k, Recall@k, Balanced Accuracy, Runtime.
- **Fallback filtering:** Units where a method returned a random fallback score (due to timeout or memory limit) are excluded from AP aggregation. There are 249 fallback units across all methods.
- **Degenerate handling:** Units with constant or near-constant scores are flagged (`is_degenerate=True`) but retained in aggregation with explicit documentation. There are 377 degenerate units.
- **Statistical tests:**
  - Global: Friedman test + Iman-Davenport correction on Track A AP per unit.
  - Pairwise: Wilcoxon signed-rank test with Benjamini-Hochberg FDR (α = 0.05).
  - Rank stability: Bootstrap 95% CIs on median-AP ranks.
- **Outputs:**
  - `data/results/tables/phase11/*.csv` (canonical public Phase 11 tables)
  - `data/results/phase11/*.csv` (compatibility copy)
  - Large complete per-unit metrics and prediction archives are external release assets.

### Phase 12 - Figure Generation
- **Purpose:** Produce publication-quality vector PDFs.
- **Figures (8 total):**
  1. `Fig0_Phase11_Summary_Heatmap.pdf` - method × dataset median AP heatmap
  2. `Fig1_Leaderboard.pdf` - Track A AP leaderboard with error bars
  3. `Fig2_Sensitivity_Robustness.pdf` - sensitivity and robustness panels
  4. `Fig3_Critical_Difference.pdf` - critical difference diagram (Friedman Nemenyi)
  5. `Fig4_AP_nAP_Prevalence.pdf` - AP and normalised AP vs log10 prevalence
  6. `Fig5_TrackC_Null_Calibration.pdf` - null-control false-positive calibration
  7. `Fig6_Runtime_Scalability_Pareto.pdf` - runtime vs AP Pareto front
  8. `Fig7_Rank_Bootstrap_Forest.pdf` - bootstrap rank interval forest plot
- **Outputs:** `data/results/figures/phase11/*.pdf`

---

## 5. Method Wrapper Categories

| Category | Methods | Fidelity | Description |
|----------|---------|----------|-------------|
| **Naive Baseline** | `random_baseline`, `expr_threshold`, `hvg_logreg` | Faithful | Floor (`random`), naive biological signal (`expr_threshold`), and supervised in-sample ceiling (`hvg_logreg`). The ceiling is not a competitor. |
| **Ranked Detector** | `FiRE`, `DeepScena`, `RareQ`, `cellsius`, `scCAD`, `scMalignantFinder` | Faithful / Proxy | Published methods designed for rare malignant cell detection. All Version 1 ranked methods were implemented faithfully via their published software packages. |
| **Exploratory** | `CaSee` | Faithful | Autoencoder-Isolation Forest architecture (Yu et al., 2022). Reported separately from ranked methods for transparent comparator separation. |

**Adding a new method:**
1. Create `src/methods/<category>/<method>_wrapper.py`
2. Implement `run(input_h5ad, output_dir, config)`
3. Add metadata to `configs/methods/<method>.yaml`
4. Run smoke test: `python tests/smoke_test.py --method <method>`
5. Run on full benchmark: `python run_all.py --phase evaluate --methods <method>`

---

## 6. Metric System

### 6.1 Primary Metric: Average Precision (AP)

AP is computed as the area under the precision-recall curve using `sklearn.metrics.average_precision_score`. It is threshold-independent and naturally down-weights the large background majority, making it ideal for rare-cell detection.

**Scoring population:** Only P_HC (high-confidence positives) versus B_HC (high-confidence backgrounds) cells are included in primary AP. P_MC, P_LC, B_MC, and B_LC cells are excluded to maximise ground-truth reliability.

### 6.2 Secondary Metrics

| Metric | Description |
|--------|-------------|
| AUROC | Threshold-independent discrimination; less sensitive to class imbalance than AP. |
| F1@top-k | F1 when threshold selects exactly k cells (k = n_true_positives). |
| Precision@k | Precision at top-k. |
| Recall@k | Recall at top-k. |
| Balanced Accuracy | (TPR + TNR) / 2. |
| Runtime (s) | Wall-clock execution time per unit. |

### 6.3 Rarity-Stratified AP

Track A units are generated at four prevalence tiers (T1-T4). The **breakdown tier** metric reports the lowest tier where a method achieves median AP > 0.50.

### 6.4 Calibration Metrics

Calibration (Brier score, Expected Calibration Error) is computed only for methods that output probability-like scores. Score-only detectors are marked *not applicable* rather than forced into probability calibration.

---

## 7. Track Construction Logic and Leaderboard Rules

### 7.1 Track A - Controlled Real Spike-ins (Primary)

Real P_HC cells are merged with real B_HC cells at controlled prevalence. Five replicates per tier per dataset. This is the sole track used for primary ranking.

### 7.2 Track B - Synthetic Splatter Stress-Test (Secondary)

Synthetic data simulated with Splatter parameters fitted to real data. Realism audits enforce biological plausibility. Results are reported separately and are not averaged into the primary leaderboard.

### 7.3 Track C - Null Controls (Diagnostic)

Background-only units test false-positive calibration. Well-calibrated unsupervised methods should return near-chance scores.

### 7.4 Track D - Natural Blood/CTC Prevalence (Primary)

Natural prevalence evaluation on blood-origin datasets without artificial spike-ins. Reported as a supplementary primary track.

### 7.5 Track E - Noisy-Label Robustness (Restricted)

Label corruption while expression is held constant. Valid only for supervised methods (`hvg_logreg`); unsupervised methods do not consume labels and therefore cannot be evaluated for label-noise robustness on this track.

### 7.6 Primary Leaderboard Aggregation

**Ranking rule (tie-breaking order):**
1. Median AP Track A (strict, fallback-filtered) - primary
2. Track D AP
3. Median F1
4. Null-control FPR (lower is better)
5. AP drop under noise10 (smaller is better)
6. Median runtime (lower is better)

**Leaderboard splits:**
- `leaderboard.csv` - all 10 included methods
- `leaderboard_faithful.csv` - faithful methods + naive baselines (excludes any proxy-ranked methods if present)

---

## 8. File I/O Contracts Between Phases

| From → To | Input | Output |
|-----------|-------|--------|
| Phase 2 → Phase 3 | `data/processed/{dataset_id}.h5ad` | `data/validation/{dataset_id}_tier_assignments.parquet`, `{dataset_id}_validation_report.json` |
| Phase 3 → Phases 4-8 | `data/validation/{dataset_id}_tier_assignments.parquet` | `data/tracks/{track}/{dataset_id}/{tier}/{unit_id}_expression.h5ad`, `{unit_id}_labels.parquet`, `{unit_id}_manifest.json` |
| Phases 4-8 → Phase 10 | `data/tracks/{track}/{dataset_id}/{tier}/{unit_id}_expression.h5ad` | `results/{method_id}/{unit_id}/predictions.csv`, `runmeta.json` |
| Phase 10 → Phase 11 | `data/predictions/{method_id}/{unit_id}_predictions.csv`, `data/tracks/**/{unit_id}_labels.parquet` | `data/results/tables/phase11/*.csv`, `data/results/phase11/*.csv` |
| Phase 11 → Phase 12 | `data/results/tables/phase11/*.csv`, `data/results/snapshots/paper_v1/*.csv` | `data/results/figures/phase12/*.png` |

---

## 9. Failure Handling, Extensibility, and Reproducibility

### 9.1 Per-Method Failure Protocol

1. Failed runs produce `*_failure.json` with error type and traceback.
2. Read failure JSON and wrapper source code.
3. Fix the wrapper (edit tool).
4. Delete only the failure JSON (preserve successful predictions).
5. Re-run just that method (`skip_existing=True` skips done units).
6. Verify the fix worked.

### 9.2 Evaluation Tolerance

- Missing prediction files are skipped (not treated as zero).
- Methods with >50% missing scores per unit are flagged as degenerate.
- Partial failures (some units succeed, some fail) are accepted and documented.
- Fallback scores (random outputs generated on timeout/OOM) are filtered from AP aggregation.

### 9.3 Extension Points

**New dataset:**
1. Add entry to `configs/datasets.yaml`
2. Add loader to `src/preprocess/`
3. Add annotator to `src/validate/source_annotations.py`
4. Add signatures to `configs/signatures.yaml`
5. Run Phases 2-12.

**New track:**
1. Create `src/tracks/track_f_generator.py`
2. Add track config to `configs/tracks.yaml`
3. Update `run_all.py`, `src/evaluate/evaluate.py`, and `scripts/generate_figures.py`.

**New metric:**
1. Add metric function to `src/evaluate/evaluate.py`
2. Update aggregation functions.
3. Add figure function to `scripts/generate_figures.py` or `src/rarecellbenchmark/figures/`. For schematics (no data required), add to `src/rarecellbenchmark/figures/`; for data-driven plots, update `scripts/generate_figures.py`.
4. Regenerate Phases 11-12.

### 9.4 Reproducibility Details

- **Random seeds:** Fixed across all track generators (`_seeding.py`).
- **Software versions:** Pinned in `setup/requirements-phase11.txt` and `setup/requirements-phase10-heavy.txt`.
- **Data provenance:** SHA-256 checksums for every processed `.h5ad` stored in `configs/datasets.yaml`.
- **Execution logs:** Every prediction unit includes `runmeta.json` with runtime, memory, device (CPU/GPU), and method version.

---

### 9.5 Fairness of Comparison

- **Uniform input contract:** Every method receives the same blind `expression.h5ad` file with ground-truth labels stripped. `load_blind_adata()` raises an error if labels are accidentally present.
- **No modality mixing:** All methods operate on gene expression (log-normalised counts). CNV-based methods (CopyKAT, Numbat) are acknowledged but excluded because they access a fundamentally different data layer.
- **Supervised ceiling excluded from ranking:** `hvg_logreg` sees labels but is not a competitor — it calibrates the upper bound of what is learnable from expression data.
- **Per-unit evaluation:** All metrics are computed per benchmark unit (N=1,110 independent observations), avoiding pseudoreplication.
- **Fallback transparency:** Failed and degenerate runs are documented in `data/results/snapshots/paper_v1/degenerate_predictions_report.csv`.
- **Seed determinism:** All track seeds are derived deterministically from a single global seed (`42`), ensuring reproducibility across runs.

See also: [`docs/fairness.md`](fairness.md) for a detailed explanation.

---

*End of REACH Full System Architecture*
