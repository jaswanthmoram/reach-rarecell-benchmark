# Comparison: `1878538_Manuscript.PDF` vs `final_sample.pdf`

**Text-only comparison (images/figures excluded from change count)**

## Quick answer

| | |
|---|---|
| **Same paper?** | **YES** — same scientific content |
| **Real body-text changes?** | **0** (no rewritten sentences) |
| **Cosmetic/formatting diffs?** | **2–3** (underscores in IDs, CSV filenames, typography) |
| **Extra in manuscript only?** | **9 Frontiers submission sections** (not in final_sample) |
| **Image/figure diffs?** | **Yes** — Fig 6 panel labels changed (excluded from text count) |

## Files in this folder

| File | Description |
|------|-------------|
| `manuscript_original.txt` | Full text extracted from `1878538_Manuscript.PDF` |
| `final_sample_current.txt` | Full text extracted from `final_sample.pdf` |
| `manuscript_body_only.txt` | Manuscript body only (Frontiers cover pages stripped) |
| `final_sample_body_only.txt` | Final sample body text |
| `body_unified_diff.txt` | Line-by-line diff of body text |
| `COMPARISON_REPORT.md` | Detailed section-by-section report |
| `SUMMARY_VERDICT.md` | Final verdict summary |

## What is ONLY in the Manuscript PDF (not in final_sample)

1. Frontiers submission header (journal, specialty, manuscript ID **1878538**)
2. Scope Statement
3. Conflict of interest statement
4. Credit Author Statement
5. Keywords block
6. Funding statement
7. Ethics statements (animal / human / identifiable data)
8. Generative AI disclosure
9. Cover-page duplicate abstract with word count

## Body text: what actually changed?

### No scientific rewrites
Abstract, Introduction, Related Work, Methodology prose, Experiments, Results narrative, Discussion, Limitations, Conclusion, and Data Availability are **the same**.

### Cosmetic differences only (~2–3 items)
1. **Table/dataset IDs**: `hnscc_puram` (final) vs `hnscc puram` (manuscript PDF tables)
2. **Method names in tables**: `hvg_logreg` vs `hvg logreg`
3. **CSV filenames in table captions**: `statistical_ranking.csv` vs `statistical ranking.csv`

### Figure-related (not counted as text changes)
- Fig 6 embedded panel title: manuscript image says *"Runtime vs accuracy"*; final figure says *"Runtime and AP Pareto behaviour"*
- Figure caption text for Fig 6 is **identical** in both: *"Runtime and AP Pareto behavior"*

## Statistics

- Body text similarity (normalized): **94.6%**
- Manuscript PDF pages: **20**
- final_sample.pdf pages: **18**
- Difference is mostly Frontiers front matter + layout, not new science
