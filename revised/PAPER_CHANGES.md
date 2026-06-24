# REACH Benchmark — Frontiers Revision Change Ledger (R1)

This document serves as a comprehensive ledger of all changes, improvements, and response actions taken during the Frontiers Revision 1 (R1) cycle. It maps reviewer concerns directly to corresponding codebase and manuscript changes.

---

## Part 1: Scientific & Architectural Corrections (Codebase)

The primary codebase (`revision/frontiers-r1` branch) was refactored to be a clean, production-ready, code-only repository. All paper/manuscript-specific narrative files and vector figure assets were migrated to the dedicated `manuscript_frontiers_creation` branch to keep the open-source library lightweight and user-centric.

### 1.1 Core Code Bug Fixes (5 Bugs Resolved)
1. **Bug 1: CLI KeyError in `rcb run-track`**
   - **Issue:** Running `rcb run-track --track a` directly raised `KeyError: 'tier_assignments'` because config keys for several tracks (D, E, F) were not populated, and Track F was excluded from the `TRACKS` constants list.
   - **Fix:** Fixed `src/rarecellbenchmark/cli.py` to gracefully load and default parameters for all tracks. Added `"f"` to `TRACKS` in `constants.py`. Supplied `ctc_mask` (Track D), `track_a_dir` (Track E), and `malignant_mask`/`normal_epi_mask` (Track F) dynamically with safe fallback mechanisms.
2. **Bug 2: Zenodo Archive Inconsistencies & Packaging script**
   - **Issue:** Old Zenodo uploads had folder mismatches (nested `data/` vs flat root) and were missing complete Track C and several Track A units. No reproducible way existed to pack them.
   - **Fix:** Created a robust packaging script `scripts/create_zenodo_archives.py` that builds all 8 archives from the repo root with the correct `data/` layout using fast native parallel-tar mechanisms. Includes Track F units, CNV scores, and Track F leaderboard CSVs as new archives.
3. **Bug 3: evaluate_results.py Track Filtering**
   - **Issue:** Evaluator searched the entire predictions directory for `*_predictions.csv`, causing crashes when executing on a single track.
   - **Fix:** (Already present) Filtered prediction files matching `_track_{track}_` suffix.
4. **Bug 4: tarfile extractall Deprecation Warning**
   - **Issue:** Calling `extractall` without filters raised a deprecation warning on Python 3.12+ (will fail in Python 3.14+).
   - **Fix:** Patched `src/rarecellbenchmark/preprocess/preprocess_dataset.py:118` to use `filter='data'` with a robust guard check.
5. **Bug 5: Setup & Execution of R-based Methods**
   - **Issue:** Unsupervised R-based methods (FiRE, CellSIUS, RareQ) couldn't be easily run because R was missing in the Python-only `Dockerfile`.
   - **Fix:** Created `Dockerfile.r` extending Python with R-base and system dev headers. Added `setup/install_r_packages.R` to automate installation of all CRAN and GitHub dependencies.

---

## Part 2: Figure and Table Improvements (Track F Updates)

Both schematic figures and the comparison tables in the manuscript were updated to incorporate the new **Track F (intra-lineage)** design, resolving any stale "5 tracks" references.

### 2.1 Figure Schematic Re-generation
All 13 figures were regenerated from raw snapshot tables using `.venv/bin/python scripts/generate_figures.py`:
- **Fig8 (Pipeline Overview):** Added the Track F box into the workflow. Updated the subtitle counts to **6 tracks**, **1,125 units**, and **11,250 evaluations**.
- **Fig9 (Track Design):** Added a dedicated sixth row for Track F showing its intra-lineage design (15 units on colorectal cancer `crc_lee`, 3 prevalence tiers). Updated the subtitle to **"Six complementary tracks..."** and footer to **"Total: 1,125 units per method"**.
- **style.py:** Added pink color (`#E91E63`) for Track F and style mapping for `track_f` box backgrounds.
- **Snakefile:** Added Fig8–Fig11 build targets to ensure complete reproducible pipeline.

---

## Part 3: Manuscript Revisions & Reviewer Responses

The primary manuscript (`revised/paper.md` and `revised/paper_pdf.md`) was revised to incorporate all 15 reviewer points and reframe specific performance findings.

### 3.1 scMalignantFinder Track F Reframe (Pretrained Ceiling)
- **Action:** Reframed `scMalignantFinder` in the newly created **"Intra-Lineage Evaluation (Track F)"** section.
- **Justification:** Rather than being ranked as a "winner" against unsupervised/naive methods, `scMalignantFinder` is treated as a **pretrained supervised ceiling reference**. Because it was trained on thousands of labeled somatic malignant cells, it possesses lineage-specific somatic and expression boundaries. In contrast, all unsupervised methods (and the in-sample `hvg_logreg` ceiling which relies on simple highly variable genes) collapse to the chance floor (AP ≤ 0.009). This parallel matches the supervised `hvg_logreg` ceiling in Track A.

### 3.2 Manuscript Tables & Captions
- **Comparison to Related Benchmarks Table:** Updated features from "5 tracks" to "6 tracks (including intra-lineage)".
- **Datasets Table:** Added `"F"` to `crc_lee`'s track role, indicating its dual role in Track A/B/C/E and Track F.
- **Track F Leaderboard Table:** Added a dedicated leaderboard table showing the median AP scores for all 10 methods across the three prevalence tiers (0.1%, 0.5%, 1.0%), highlighting `scMalignantFinder` as the pretrained ceiling.
- **Figure Captions:** Updated Fig8 and Fig9 captions in `paper_pdf.md` to reference the newly added Track F box/row.

---

## Part 4: Verification and PDF Generation

Bothclean and redline PDFs were built using the finalized xelatex engine to support Greek math characters and layout formatting.

### 4.1 Deliverables
1. **Clean PDF (`revised/paper_clean.pdf`):** Full revised manuscript with 12 embedded figures at semantic anchors, formatted as a clean publication camera-ready version.
2. **Tracked PDF (`revised/paper_tracked.pdf`):** Red-ink tracked-changes document showing word-level diff additions and strike-through deletions from the original Google Drive `final_sample.tex` baseline.

All outputs were validated as fully compiled, correct, and free of layout/math nesting issues.
