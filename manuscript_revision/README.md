# manuscript_revision/

Author-facing folder for the *Frontiers in Bioinformatics* MS 1878538 revision. You apply all manuscript text and image edits **by hand** from here (and humanize the suggested wording). Agents populate these files from real result artifacts; they do not edit `paper.md` or the PDF directly.

## Contents (populated by the plan)

| File | Filled in | Purpose |
|---|---|---|
| `MANUSCRIPT_CHANGES.md` | Phase 7 | Per-reviewer-point text edits: `paper.md` section + line, current text quoted, proposed replacement, source file for every number. You edit `paper.md`/Word by hand from this. |
| `RESPONSE_TO_REVIEWERS.md` | Phase 7 | Point-by-point reply letter (1 reply per the 15 points) with evidence references. |
| `FIGURE_CHANGES.md` | Phase 6 | Which figures change/are added, why, new caption text (incl. R1-11 "N = … common units" detail). |
| `images/` | Phase 6 | Regenerated/new figures staged for upload (Fig8 pipeline, Fig9 track design, new Fig11 Track F). |
| `tables/` | Phase 5–7 | New/updated result tables (Track F leaderboard, A-vs-F comparison, CaSee filtered, Cliff's δ) staged for the manuscript/supplement. |

## How to use (after the plan runs)
1. Read `MANUSCRIPT_CHANGES.md` top to bottom; it is ordered by manuscript section.
2. For each block: locate the quoted current text in `paper.md`, replace with the proposed text, humanize the wording, keep the cited number exactly as given (it comes from a real file under `data/results/revision/`).
3. Swap figures from `images/` per `FIGURE_CHANGES.md` and update each caption.
4. Paste `RESPONSE_TO_REVIEWERS.md` into the Frontiers forum, one reply per point.

## Source of every number
`data/results/revision/REVISION_RESULTS_INDEX.md` maps each reviewer point → output file → key value. If a number in `MANUSCRIPT_CHANGES.md` is not traceable there, it is a bug — do not submit it.

## Manuscript section map (`paper.md`, 273 lines) — for quick navigation
Abstract (L7) · Public Release Scope (L13) · Contributions (L19) · Datasets (L28) · Evaluation Tracks (L47) · Included Methods (L61) · Method Inclusion/Exclusion (L80) · Wrapper Fidelity (L104) · Supervised Ceiling Justification (L109) · Primary Leaderboard Track A (L115) · Key Statistical Results (L132) · Dataset-Level Winners (L143) · Limitations (L158) · Comparison to Related Benchmarks (L171) · Data and Code Availability (L186) · Reproducibility (L202) · Contribution to the Field (L264).
