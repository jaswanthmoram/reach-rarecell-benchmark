# FINAL VERDICT: Manuscript PDF vs final_sample (text only, no images)

## Are they the same?
**Mostly YES** — the core paper body is ~95% identical in meaning.

## How many real text changes?

### Category 1: Extra pages ONLY in Manuscript PDF (not content changes — missing from final_sample)
These are **9 Frontiers submission blocks** absent from final_sample.pdf:
- Submission header (Frontiers, ID 1878538)
- Scope Statement
- Conflict of interest
- Credit Author Statement
- Keywords
- Funding statement
- Ethics statements (3)
- Generative AI disclosure
- Cover-page duplicate abstract

### Category 2: Actual body-text differences between the two papers
Only **2–3 meaningful prose differences** (excluding figure captions and table formatting):

1. **Figure 6 caption wording** (figure-related, excluded per your request): Manuscript says *"Runtime vs accuracy"*; final_sample says *"Runtime and AP Pareto behavior"*.

2. **Formatting/notation only** (not scientific content changes): dataset IDs use underscores (`hnscc_puram` vs `hnscc puram`), method names (`hvg_logreg` vs `hvg logreg`), CSV filenames (`statistical_ranking.csv` vs `statistical ranking.csv`), subscripts (`P_HC` vs `P HC`).

3. **Minor encoding/typography**: `difficult` vs `diﬀicult` (ligature), `naïve` character form, equation subscript layout (`U_{A,m}^{valid}` ordering).

### Category 3: NO substantive scientific text rewrites found
- Abstract, Introduction, Related Work, Experiments, Limitations, Conclusion, Data Availability: **same text**
- Results numbers and conclusions: **unchanged**
- References list: **99% identical** (hyphenation in one title only)

## Bottom line
| Question | Answer |
|----------|--------|
| Same paper? | **Yes** |
| How many real text changes? | **0–1** (only Fig 6 caption if counting; **0** if excluding figures) |
| Extra content in manuscript PDF? | **Yes — 9 Frontiers submission sections** not in final_sample |
| Table/dataset name formatting diffs? | **Yes — cosmetic only** |
