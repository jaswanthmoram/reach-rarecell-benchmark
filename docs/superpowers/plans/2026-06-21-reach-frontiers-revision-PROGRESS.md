# REACH Frontiers Revision — Progress Tracker

> **Agent instruction:** After completing each task in `2026-06-21-reach-frontiers-revision.md`, check its box here and paste the produced number/path into the "Result" cell. Never mark a box done without a real artifact. Update the "Last updated" line each session.

**Plan:** `2026-06-21-reach-frontiers-revision.md`
**Branch:** `revision/frontiers-r1`
**Last updated:** 2026-06-21 (Phase 0 completed)

## Environment (fill from Task 0.2)
- GPU available: NO
- CPU / RAM / OS: AMD EPYC 7B12 (16 cores) / 62Gi / Debian 13 (trixie)
- Methods runnable here: random_baseline, expr_threshold, hvg_logreg, scCAD, scMalignantFinder, CaSee (6 methods)

## Phase status

| Phase | Title | Status | Exit artifact |
|---|---|---|---|
| 0 | Environment / branch / GPU / deps | ☑ done | `environment_capture.txt`, `method_capability.csv` |
| 1 | Regenerate real CNV | ☐ not started | 10× `cnv_scores/*_cnv.parquet` |
| 2 | Zero-prereq analyses | ☐ not started | circularity/casee/cliff/sens extracts |
| 3 | CNV-dependent analyses | ☐ not started | `cnv_concordance.csv`, `threshold_sensitivity.csv` |
| 4 | Track F intra-lineage | ☐ not started | `track_f/track_f_results.csv` |
| 5 | Result consolidation | ☐ not started | `REVISION_RESULTS_INDEX.md` |
| 6 | Figures + captions | ☐ not started | new Fig11, `FIGURE_CHANGES.md` |
| 7 | Manuscript change doc | ☐ not started | `MANUSCRIPT_CHANGES.md`, `RESPONSE_TO_REVIEWERS.md` |
| 8 | QA / integration | ☐ not started | gates green, branch pushed |

## Task checklist + results

### Phase 0
- [x] 0.1 branch created
- [x] 0.2 hardware/GPU captured → Result: AMD EPYC 7B12 / 62Gi / Debian 13 / NO GPU
- [x] 0.3 infercnvpy installed → Result (version): 0.6.1
- [x] 0.4 External-Methods restored + capability matrix → Result (runnable count): 6


### Phase 1
- [ ] 1.1 real CNV impl + test pass
- [ ] 1.2 gene-position helper + test pass
- [ ] 1.3 CNV regenerated (10 datasets) → Result (per-dataset mean CNV): ____

### Phase 2
- [ ] 2.1 circularity → Result (overall Spearman ρ vs published leaderboard): ____
- [ ] 2.2 CaSee filtered → Result (median AP all / excl-degenerate / n_degenerate): ____
- [ ] 2.3 Cliff's δ → Result (FiRE vs expr_threshold δ; hvg_logreg vs FiRE δ): ____
- [ ] 2.4 sens2/sens3 extract → Result (A↔B ρ; per-method Track C FPR): ____

### Phase 3
- [ ] 3.1 CNV concordance → Result (overall AUROC / MCC CNV-vs-source): ____
- [ ] 3.2 threshold sensitivity → Result (Spearman ρ range across 9 settings): ____

### Phase 4
- [ ] 4.1 Track F generator + test pass
- [ ] 4.2 core baselines → Result (expr_threshold AP collapse?; hvg_logreg ceiling on Track F): ____
- [ ] 4.3 full panel → Result (CPU comparators APs; DeepScena/CaSee status): ____

### Phase 5
- [ ] 5.1 Track F leaderboard + A-vs-F comparison → Result (methods that dropped most): ____
- [ ] 5.2 results index + v2 snapshot frozen

### Phase 6
- [ ] 6.1 figure change-set decided → Result (list): ____
- [ ] 6.2 figures regenerated + new Fig11
- [ ] 6.3 FIGURE_CHANGES.md written (per-figure common-N recorded)

### Phase 7
- [ ] 7.1 MANUSCRIPT_CHANGES.md (all 15 points)
- [ ] 7.2 RESPONSE_TO_REVIEWERS.md (all 15 points)

### Phase 8
- [ ] 8.1 pytest/ruff/mypy/smoke green
- [ ] 8.2 numbers-consistency: MISSING SOURCE FILES = none
- [ ] 8.3 reproduce-check + branch pushed

## Open decisions / blockers
- [x] External-Methods upstream URLs VERIFIED via GitHub API (2026-06-21):
  - scCAD → `xuyp-csu/scCAD` (FIXED from broken `Tianxiao-Yang/scCAD` which 404s; correct repo: Xu et al. 2024, Nat Commun, 13 stars)
  - DeepScena → `shaoqiangzhang/DeepScena` ✓ (confirmed by wrapper code)
  - scMalignantFinder → `Jonyyqn/scMalignantFinder` ✓ (20 stars, 111 commits) + Zenodo `17888140` ✓
  - CaSee → `yuansh3354/CaSee` ✓ (confirmed by wrapper code)
  - FiRE → CRAN ✓ · CellSIUS → `Novartis/CellSIUS` ✓ · RareQ → `fabotao/RareQ` ✓
- [ ] CNV regeneration confirmed (no cached scores — regenerating from scratch). Owner: ____
- [ ] GPU host for DeepScena Track F ONLY (CaSee runs on CPU — `supports_gpu=False` with CPU fallback). Owner: ____
- [ ] scCAD_patched.py: upstream repo has `scCAD.py` only — plan creates a copy; apply n_jobs=4 + unique-temp-dir patch if running parallel. Owner: ____
- [ ] Check if `configs/grch38_gene_positions.tsv` already exists before downloading GENCODE v44. Owner: ____
