# Supplementary Note 1 — Excluded Methods

Seven selected methods were excluded from the primary REACH Benchmark leaderboard after output-quality control. This note documents the rationale for each exclusion. Full wrapper code for excluded methods is retained in `src/methods/orthogonal/` and `src/methods/ranked/` for reproducibility and future repair.

---

## 1. CopyKAT

**Category:** Orthogonal (CNV-based)  
**Language:** R  
**Reason for exclusion:** R CopyKAT failed on every dataset due to `skipped_too_many_cells_windows` (large datasets) or `copykat_low_informative_fraction` (low signal-to-noise). Because it produced zero successful prediction units, it could not be included in the primary leaderboard. It is documented as an orthogonal comparator whose failure was environmental (compute constraints) rather than algorithmic.

---

## 2. MACE

**Category:** Orthogonal (CNV-based)  
**Language:** Python  
**Reason for exclusion:** MACE required dynamic reference passing that was not supported by its automated wrapper in the benchmark pipeline. Attempts to run it produced empty or malformed outputs. The method is retained as an orthogonal comparator for future Version 2 wrapper repair.

---

## 3. SCANER

**Category:** Ranked (Deep learning)  
**Language:** Python (PyTorch)  
**Reason for exclusion:** SCANER is GPU-heavy and could not be co-scheduled with other GPU methods. In the Version 1 execution plan, it repeatedly exhausted GPU memory on large datasets (e.g., `pdac_peng`) and returned fallback scores. Its outputs were degenerate on a high fraction of units.

---

## 4. SCEVAN

**Category:** Orthogonal (CNV-based)  
**Language:** R  
**Reason for exclusion:** SCEVAN's R wrapper failed to complete within the benchmark timeout on datasets >20,000 cells. It produced partial outputs that could not be aligned to the benchmark unit schema.

---

## 5. RaceID3

**Category:** Ranked (Cluster-based)  
**Language:** R  
**Reason for exclusion:** RaceID3 returned constant (degenerate) scores on the majority of units, indicating that its rare-cluster detection heuristic did not generalise across the diverse tumour types in the benchmark. It performed at or near random baseline levels.

---

## 6. scATOMIC

**Category:** Orthogonal (Pan-cancer annotation)  
**Language:** R  
**Reason for exclusion:** scATOMIC is a pan-cancer cell-type annotator, not a rare-cell detector. Its outputs were not directly comparable (categorical annotations rather than continuous malignancy scores). Converting annotations to scores introduced arbitrary thresholds that violated the benchmark's scoring contract.

---

## 7. GiniClust3

**Category:** Ranked (Cluster-based)  
**Language:** Python  
**Reason for exclusion:** GiniClust3 produced degenerate outputs (constant scores) on a large fraction of units. Its Gini-index-based rare-cluster detection was unstable across datasets with highly variable background compositions.

---

## Summary Table

| Method | Category | Reason | Future Action |
|--------|----------|--------|---------------|
| CopyKAT | Orthogonal | OOM / skipped on all datasets | Retry with chunked mode in V2 |
| MACE | Orthogonal | Dynamic reference unsupported | Repair wrapper in V2 |
| SCANER | Ranked | GPU OOM, degenerate outputs | Better GPU guard + containerisation |
| SCEVAN | Orthogonal | Timeout on large datasets | Increase timeout or chunking |
| RaceID3 | Ranked | Degenerate outputs | Re-evaluate with updated R package |
| scATOMIC | Orthogonal | Score contract mismatch | Design custom score mapping |
| GiniClust3 | Ranked | Degenerate outputs | Re-evaluate with updated parameters |

---

*Note:* Excluded methods are NOT included in `leaderboard.csv`, `all_metrics.parquet`, or any primary figure. They are documented here for transparency and to guide future benchmark versions.
