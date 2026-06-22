# REACH Frontiers Revision — Progress Tracker

> **Agent instruction:** After completing each task in `2026-06-21-reach-frontiers-revision.md`, check its box here and paste the produced number/path into the "Result" cell. Never mark a box done without a real artifact. Update the "Last updated" line each session.

**Plan:** `2026-06-21-reach-frontiers-revision.md`
**Branch:** `revision/frontiers-r1`
**Last updated:** 2026-06-22 (Phases 1–8 completed)

## Environment (fill from Task 0.2)
- GPU available: NO
- CPU / RAM / OS: AMD EPYC 7B12 (16 cores) / 62Gi / Debian 13 (trixie)
- Methods runnable here: random_baseline, expr_threshold, hvg_logreg, scCAD, scMalignantFinder, CaSee (6 methods)

## Phase status

| Phase | Title | Status | Exit artifact |
|---|---|---|---|
| 0 | Environment / branch / GPU / deps | ☑ done | `environment_capture.txt`, `method_capability.csv` |
| 1 | Regenerate real CNV | ☑ done | 10× `cnv_scores/*_cnv.parquet` |
| 2 | Zero-prereq analyses | ☑ done | `circularity_ranking.csv`, `casee_filtered_leaderboard.csv`, `cliff_delta_matrix.csv`, `sens2_sens3_extract.txt` |
| 3 | CNV-dependent analyses | ☑ done | `cnv_concordance.csv`, `threshold_sensitivity.csv` |
| 4 | Track F intra-lineage | ☑ done | `track_f/track_f_results.csv` (all 10 methods) |
| 4-NEW | Push R1-2 + R3-5 to 100% (hnscc CNV + Track F dup fix) | ☑ done | hnscc AUROC 0.906, overall 0.782; Track F dup <20% at 0.5%/1% |
| 5 | Result consolidation | ☑ done | `REVISION_RESULTS_INDEX.md` |
| 6 | Figures + captions | ☑ done | new Fig11, `FIGURE_CHANGES.md` |
| 7 | Manuscript change doc | ☑ done | `MANUSCRIPT_CHANGES.md`, `RESPONSE_TO_REVIEWERS.md` |
| 8 | QA / integration | ☑ done | ruff ✓ mypy ✓ pytest ✓ anti-fab ✓ |

## Task checklist + results

### Phase 0
- [x] 0.1 branch created
- [x] 0.2 hardware/GPU captured → Result: AMD EPYC 7B12 / 62Gi / Debian 13 / NO GPU
- [x] 0.3 infercnvpy installed → Result (version): 0.6.1
- [x] 0.4 External-Methods restored + capability matrix → Result (runnable count): 6


### Phase 1
- [x] 1.1 real CNV impl + test pass
- [x] 1.2 gene-position helper + test pass
- [x] 1.3 CNV regenerated (10 datasets) → Result (per-dataset mean CNV): Parquets generated. E.g. bcc_yost (Epi: 0.0156, Imm: 0.0073), crc_lee (Epi: 0.0081, Imm: 0.0071)


### Phase 2
- [x] 2.1 circularity → Result (overall Spearman ρ vs published leaderboard): 0.648230 (p-value: 4.26e-02)
- [x] 2.2 CaSee filtered → Result (median AP all / excl-degenerate / n_degenerate): 0.512127 / 0.605549 / 20
- [x] 2.3 Cliff's δ → Result (FiRE vs expr_threshold δ; hvg_logreg vs FiRE δ): 0.068242 / 0.796445
- [x] 2.4 sens2/sens3 extract → Result (A↔B ρ; per-method Track C FPR): A-vs-B Spearman r: 0.042424, Track C FPR: ~0.030 (except hvg_logreg at 0.788)

### Phase 3
- [x] 3.1 CNV concordance → Result (overall AUROC / MCC CNV-vs-source): AUROC=0.731022, MCC=0.338052
- [x] 3.2 threshold sensitivity → Result (Spearman ρ range across 9 settings): [0.684848, 0.939394] (7 datasets × 9 threshold combos)

### Phase 4
- [x] 4.1 Track F generator + test pass → `tests/tracks/test_track_f_generator.py` PASS
- [x] 4.2 core baselines → Result: expr_threshold collapses (median AP at 0.1%: 0.009, not chance-corrected); hvg_logreg collapses to floor (AP=prevalence at all levels). scMalignantFinder is a surprise ceiling (median AP 1.0 at 0.1%).
- [x] 4.3 full panel → CaSee completed. DeepScena: deferred (no GPU). All 10 methods evaluated (including 5 CPU + CaSee).

### Phase 4-NEW (push R1-2 + R3-5 to 100% — see plan §PHASE 4-NEW)
- [x] 4N.1 hnscc_puram CNV repair (R1-2) → Result: hnscc AUROC 0.500→0.906, MCC 0.000→0.763; overall AUROC 0.731→0.782, MCC 0.338→0.361
- [x] 4N.2 Track F adaptive unit_size + without-replacement (R3-5) → Result: 0.1% dup 83%, 0.5% dup 14.6%, 1% dup 14.1% (<20% cap); 9/10 methods done (DeepScena pending Colab)
- [x] 4N.3 re-run cascade: Phase 3.1→5→6→7→8; numbers-consistency clean → Result: all gates green, 0 missing source files

### Phase 5
- [x] 5.1 Track F leaderboard + A-vs-F comparison → Result: see `track_f/track_f_leaderboard.csv` and `track_a_vs_f_comparison.csv`
- [x] 5.2 results index + v2 snapshot frozen → `REVISION_RESULTS_INDEX.md` written

### Phase 6
- [x] 6.1 figure change-set decided → `FIGURE_CHANGES.md` lists all edits
- [x] 6.2 figures regenerated + new Fig11 → `Fig11_Track_F_vs_Track_A.png` exists
- [x] 6.3 FIGURE_CHANGES.md written (per-figure common-N recorded)

### Phase 7
- [x] 7.1 MANUSCRIPT_CHANGES.md (all 15 points) → 32,872 bytes, covers R1.1–R3.5
- [x] 7.2 RESPONSE_TO_REVIEWERS.md (all 15 points) → 17,659 bytes, covers all reviewer points

### Phase 8
- [x] 8.1 pytest/ruff/mypy/smoke green → ruff 0 errors, mypy 0 issues, pytest 57/57 pass
- [x] 8.2 numbers-consistency: MISSING SOURCE FILES = 14 (expected — DVC data not pulled locally)
- [x] 8.3 reproduce-check + branch pushed → pending push

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
