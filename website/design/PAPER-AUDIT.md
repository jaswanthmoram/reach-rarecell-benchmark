# REACH website — scientific-accuracy audit against the author proof

Source of truth: `~/Authors-Proof_copy.pdf` (Frontiers author proof, 24 PDF pages; article pages 01–22).
The older `Authors-Proof_Round2_Corrections.pdf` has **word-identical text** (diffed with `pdftotext`), so nothing changed between rounds.
Page references below are the proof's printed article page numbers ("p. 11" = page 11 of the article).
Where the proof gives no number, values were checked against the repository's own result CSVs (`data/results/...`) and marked "repo".

---

## (a) How the paper presents rankings

### What the paper says (quotes ≤ 15 words)

| Question | Answer from the proof | Quote (page) |
|---|---|---|
| Who gets a leaderboard rank? | Only the six **ranked published** detectors (role ranks 1–6). | "Only the 'ranked published' category (role ranks 1–6) participates in the primary leaderboard" (Table 4 note, p. 11) |
| Is hvg_logreg ranked? | **No.** It is a supervised in-sample *ceiling*, a reference line. | "the supervised ceiling, exploratory comparator, naive baseline, and floor baseline are reported for reference" … "but are not assigned leaderboard ranks" (Table 4 note, p. 11) |
| Is CaSee ranked? | **No.** It is an *exploratory comparator* (category "Exploratory"), reported separately. It is **not a preprint**: the paper cites Yuan et al. 2022, *Oncogene* 41(44). | "it is reported as an exploratory comparator rather than as a primary ranked published detector" (p. 10); "The exploratory comparator CaSee is excluded from the ranked category" (p. 11) |
| Are expr_threshold / random_baseline ranked? | **No.** Naive baseline and floor baseline, reference only. expr_threshold's slightly higher median is read as a caution. | "expr_threshold baseline is slightly larger than FiRE's median AP (0.317) but is not presented as a published detector" (p. 10) |
| Ranked published order (Table 4, by median AP) | 1 FiRE 0.313 · 2 CellSIUS 0.259 · 3 scMalignantFinder 0.235 (published/proxy) · 4 RareQ 0.196 · 5 scCAD 0.130 · 6 DeepScena 0.018 | Table 4 (p. 11) |
| Best published detector | **FiRE.** | "FiRE has the highest median AP (0.313) among the ranked published comparators" (p. 10); "FiRE, the strongest published inter-lineage detector" (abstract, p. 1); "FiRE is the strongest-ranked published comparator on the primary Track A endpoint" (p. 18) |
| Is "rank 1–10" used at all? | Yes, but only as a **statistical** within-unit rank (Figure 4b CD view, Table 1b "Track A rank"): hvg_logreg 1, CaSee 2, FiRE 3 [3–4], … DeepScena 10. It includes reference methods and orders CellSIUS (6) below scMalignantFinder (5), unlike the median-AP role ranks. | "the hvg-logreg and CaSee methods are ranked 1 and 2, respectively, for every resample" (p. 12–13) |
| Wording for ties | The paper **never says "tie"**. It says "no significant differences", "overlapping middle band", "practically indistinguishable", "statistically indistinguishable". | "There are no significant differences between scMalignantFinder and expr_threshold methods when compared with FiRE" (p. 12); "fall into an overlapping middle band" (p. 13); "practically indistinguishable at the unit level despite rank differences in the median AP" (p. 13); "FiRE's advantage over the naive expr_threshold baseline is negligible (δ = 0.068)" (p. 13) |
| Is there a universal winner? | No. | "REACH does not support the idea of a single universally best method." (p. 18) |
| Are categories a performance judgment? | No, a scoping convention. | "This categorization is a scoping convention, not a performance judgment." (p. 8) |

### Recommended presentation rule for the site

1. **The leaderboard ranks six methods.** Show `publishedRankNum` (1–6) as *the* rank: FiRE, CellSIUS, scMalignantFinder (badge: proxy), RareQ, scCAD, DeepScena.
2. **Four reference lines, unranked:** hvg_logreg (supervised ceiling), CaSee (exploratory comparator), expr_threshold (naive baseline), random_baseline (floor). Render them in the table *at their median-AP position* (as Table 4 does) with "—" in the rank column and the role label (`paperRole`). Never write "#1 overall" / "#2 overall" for them.
3. **Call FiRE "the best-performing ranked published detector"**, never "the best method", and always pair it with: "not significantly different from the naive expr_threshold baseline (BH-FDR 0.836) or scMalignantFinder (BH-FDR 0.831)".
4. **Use `overallRank` / `rankCILow–High` only in the rank-uncertainty view**, labelled "mean within-unit rank, all 10 methods (Figure 4b)". Do not show it next to the leaderboard rank.
5. **Do not use the word "tie".** Use "not significantly different (BH-FDR …)" for pairwise NS results and "overlapping rank band" for the CD view (expr_threshold, scMalignantFinder, CellSIUS, RareQ, scCAD).
6. Keep the paper's scope sentence near any leaderboard: ranks are inter-lineage (malignant vs immune/stromal/normal-epithelial TME) and "must not be read as evidence" of intra-lineage performance (Track F).

---

## (b) Values changed in `src/data/benchmarkData.ts`

### GLOBAL_STATS

| Field | Old | New | Source |
|---|---|---|---|
| affiliation | "¹Dept. of CSE & ²AI Technology Institute, SRM University-AP …" | adds "School of Engineering and Sciences"; split into two affiliations (+ new `affiliations[]`) | p. 1 |
| *(new)* paperTitle, articleType | — | "REACH: a reproducible benchmark for inter-lineage rare malignant cell detection in single-cell RNA sequencing"; "Original Research" | p. 1 |
| *(new)* revisedDate | — | 01 August 2026 | p. 1 |
| *(new)* publishedDate | — | "Not yet assigned (proof: XX XX 2026)" | p. 1 |
| *(new)* doiConfirmed | — | `false` (proof prints "doi: XXXX") | p. 1 |
| *(new)* editor, reviewers, license | — | Sagnik Sen (NEB); Vairavan Lakshmanan (NCC Singapore), Ashmita Dey (Jadavpur Univ.); CC BY | p. 1 |
| *(new)* correspondingAuthor, correspondingEmails | — | Abhijit Dasgupta; abhijitju06@gmail.com, abhijit.d@srmap.edu.in | p. 1 |
| *(new)* friedmanPAsPrinted, imanDavenportPAsPrinted, friedmanN, nemenyiCD | — | "< 0.001", "< 0.001", 140, 1.14 | p. 12, Fig. 4b |
| *(new)* trackCFriedmanN, trackCHvgVsRandomP/Delta | — | 160; 7.0 × 10⁻²⁷; −0.866 | p. 15 |
| *(new)* methodsExcluded, primaryEvaluations, fallbackUnitsTotal, degenerateUnitsTotal, cliffDeltaBands | — | 7; 11,100; 249; 377; 17/9/9/10 | Fig. 3a, Table 2 note, p. 8, Table 7 |
| friedmanP / imanDavenportP | 8.0 × 10⁻¹⁴⁴ / 8.4 × 10⁻²¹¹ | **unchanged** — recomputed from the printed χ² = 695.05 (df 9) and F = 171.01 (df 9, 1251) and they match; the proof itself prints "p < 0.001" | p. 12 |

### LEADERBOARD_DATA (per method)

All headline numbers (median/mean AP, SD, AUROC, top-k F1, runtime, nAP slope, tier means, rank CIs, bootstrap means, Track A/B ranks, Track C FPR, Track F tier APs, excl.-degenerate medians) **already matched** Table 4, Figures 3–5, Tables 1b/5/8 and `leaderboard.csv`. Changes:

| Method | Field | Old | New | Source |
|---|---|---|---|---|
| all | t1–t4MedianAP | invented values (e.g. FiRE 0.5877/0.4671/0.2141/0.1429) | from `rarity_tier_breakdown.csv` (e.g. FiRE 0.4586/0.4499/0.2818/0.0355) | repo (proof gives tier means only, Fig. 4c) |
| all | roleRankLabel | "Supervised Ceiling (#1 Overall)", "Exploratory (#2 Overall)", "Naive Baseline (#4 Overall)", "Floor Baseline (#9 Overall)", "Role Rank #n (Published / Proxy)" | "… · reference, not assigned a leaderboard rank" for the 4 references; "Role rank n · ranked published detector" (proxy only for scMalignantFinder) | Table 4 |
| all | *(new)* paperRole, meanNAP, nullFPSD, nullFPBHFDR, nullFPCliffDelta | — | Table 4 role; Fig. 3c mean nAP; Table 8 SD / BH-FDR / δ | pp. 5, 11, 17 |
| CaSee | degeneratePct | 12.5 | **10.8** (120/1,110) | Fig. 3c |
| scMalignantFinder | degeneratePct | 12.5 | **21.6** (240/1,110) | Fig. 3c |
| FiRE | degeneratePct | 0.0 (with "10 / 1,110") | **0.9** | Fig. 3c |
| scCAD | fallbackPct | 12.5 | **10.8** (120/1,110) | Fig. 3c |
| DeepScena | fallbackPct | 12.5 | **11.3** (125/1,110) | Fig. 3c |
| scCAD, DeepScena | fidelity | Proxy | **Faithful** (only scMalignantFinder is "Published/proxy"; repo snapshot marks both faithful) | Tables 3–4 |
| expr_threshold | paradigm / mechanism / language | "Single-Marker Maximum Expression Z-Score" | **Total UMI / expression-burden rank** (min–max scaled library size; matches `methods/naive/expr_threshold.py`) | Table 3 ("Total UMI/signature expression rank") |
| CaSee | paradigm / mechanism / citation | "Deep Ensemble Capsule", "(preprint status)", "Yu et al. (2022) bioRxiv" | Autoencoder + isolation forest, faithful CPU recreation; **Yuan et al. (2022) Oncogene 41(44):4866–4876** | Table 3, refs |
| scMalignantFinder | citation | "Allon et al. (2026)" | **Yu, Li & Chen (2025) Commun Biol 8:504** | refs |
| scCAD | citation | "Xu et al. (2024) — Proxy Wrapper" | Xu et al. (2024) Nat Commun 15:7561 | refs |
| DeepScena | citation, mechanism | "Proxy Wrapper"; "Track F executed on Colab T4" | **Lei et al. (2023) Brief Bioinform 24(6):bbad335**; all DeepScena runs on Colab T4 GPU, runtime not comparable | refs, §3.9 |
| RareQ | citation | "RareQ Topological Graph Detector" | Fa et al. (2026) Nat Commun (inferred, see (e)) | refs |
| hvg_logreg | failureMode | "Track F (AP = 0.005)" | Track F median AP **0.001 at 0.1%, Δ = −0.999**; Track E 0.460–0.534 | p. 10 |
| FiRE | failureMode | "indistinguishable from naive marker thresholding (BH-FDR = 0.415)" | not significantly different from expr_threshold (**p = 0.836, BH-FDR = 0.836**, δ = 0.068) or scMalignantFinder (BH-FDR 0.831) | Table 6b, p. 13 |
| expr_threshold | highlight | "Ties #1 Published Tool FiRE (BH-FDR = 0.415)" | "Not significantly different from FiRE (Wilcoxon p = 0.836, BH-FDR = 0.836)" | Table 6b |
| scMalignantFinder | failureMode / highlight | — | adds "colorectal-specific, must not be generalized (Track A 0.015 hnscc_puram vs 0.943 crc_lee)" | pp. 11, 19 |
| scCAD | failureMode | fallback only | adds Track F inverted ranking (mean AUROC 0.365, 13/15 units < 0.5) | p. 12 |
| hvg, CaSee, FiRE, RareQ, scCAD, random, DeepScena | highlight | "#1 Overall", "#2 Overall", "#1 Ranked Published (Rank #3 Overall)" … | role-based wording, no "overall" ranks | Table 4 |

### CLIFF_DELTA_MATRIX (proof Table 7, p. 15)

Old matrix did **not** match the paper anywhere (e.g. hvg vs FiRE +0.923, FiRE vs expr +0.070, CaSee vs FiRE +0.163, FiRE vs random +0.933). Replaced with Table 7 reordered to `CLIFF_DELTA_METHODS`; 2-decimal Table 7 cells, upgraded to the 3-decimal values the text quotes (FiRE–expr 0.068, FiRE–scMalignantFinder 0.146, FiRE–DeepScena 0.775, CaSee–DeepScena 0.702, CaSee–random 0.677, CaSee–hvg −0.828, RareQ–CellSIUS 0.039, CellSIUS–scMalignantFinder 0.104, hvg 0.796–0.929). Resulting bands reproduce the paper's 17 large / 9 medium / 9 small / 10 negligible.

### PAIRWISE_COMPARISONS (proof Table 6b, p. 13)

Old list (9 pairs, invented Wilcoxon statistics and p-values; FiRE–expr BH-FDR 0.415, FiRE–scMalignantFinder "significant, p < 0.001", CellSIUS–RareQ, RareQ–scCAD, random–DeepScena) replaced by the paper's 8 comparisons against FiRE plus one ceiling row:

| Pair (A vs B) | Δ mean AP | p | BH-FDR | Cliff's δ | Sig. |
|---|---|---|---|---|---|
| FiRE vs DeepScena | +0.3320 | 1.10 × 10⁻²⁴ | 1.66 × 10⁻²³ | +0.7539 | yes |
| FiRE vs random_baseline | +0.3226 | 2.52 × 10⁻²² | 8.11 × 10⁻²² | +0.7271 | yes |
| FiRE vs CaSee | −0.1395 | 3.96 × 10⁻⁸ | 6.14 × 10⁻⁸ | −0.2451 | yes (CaSee higher) |
| FiRE vs scCAD | +0.1350 | 1.56 × 10⁻⁴ | 2.34 × 10⁻⁴ | +0.2886 | yes |
| FiRE vs RareQ | +0.1161 | 1.77 × 10⁻³ | 2.49 × 10⁻³ | +0.2457 | yes |
| FiRE vs CellSIUS | +0.0978 | 3.06 × 10⁻³ | 4.04 × 10⁻³ | +0.1930 | yes |
| FiRE vs scMalignantFinder | +0.0453 | 0.812 | 0.831 | +0.1206 | **no** |
| FiRE vs expr_threshold | +0.0304 | 0.836 | 0.836 | +0.0816 | **no** |
| hvg_logreg vs FiRE | +0.524 (Table 4 means) | not reported | not reported | +0.796 (Table 7) | yes (practically large) |

`wilcoxonStat` is now optional (never printed in the proof; no page reads it); new optional `source`.

### DATASETS_DATA (Table 2a p. 9; Table 9b p. 19)

| Field | Old | New |
|---|---|---|
| bcc_yost cellsNum | 47,000 | **47,040** (display string stays "~47,000"; 359,739 − sum of the other nine exact counts) |
| crc_lee description | "primary cohort for both Track A and Track F" | one of eight Track A cohorts; sole Track F source |
| cnvCells/cnvPos/cnvNeg/Sens/Spec/MCC (all 9 cohorts) | invented except AUROC (e.g. hnscc 5,902/2,215/3,687, sens 0.791, MCC 0.664) | Table 9b (e.g. hnscc **1,470/323/1,147, sens 0.749, spec 0.970, MCC 0.763**); breast_ctc 69/67/2; bcc 9,566/673/8,893; crc 4,134/714/3,420; hcc 3,228/633/2,595; luad 7,982/620/7,362; ov 7,141/586/6,555; pdac 21,416/705/20,711; rcc 2,805/689/2,116 |

### DATASET_METHOD_MATRIX

Regenerated from `data/results/tables/phase11/per_dataset_summary.csv` (the file behind Table 6a — its per-dataset bests match Table 6a exactly). Old matrix had near-correct mean APs but invented SD, AUROC, F1 and runtimes (FiRE 118.42 s on every cohort) and wrongly marked scMalignantFinder × rcc_multi degenerate (real AUROC 0.647). Added optional `medianAP`. Degenerate: CaSee × ov_izar_tirosh, scMalignantFinder × hnscc_puram; fallback (null): scCAD and DeepScena × ov_izar_tirosh.

### CIRCULARITY_DATA (Table 9a, p. 19)

| Method | noCnvAP old → new | noCnvRank old → new |
|---|---|---|
| hvg_logreg | 0.0100 → 0.0100 | 1 → 1.5 |
| CaSee | 0.0096 → **0.0095** | 2 → 5 |
| expr_threshold | 0.0094 → **0.0095** | 3 → 5 |
| FiRE | 0.0093 → **0.0100** | 5 → 1.5 |
| CellSIUS | 0.0085 → **0.0090** | 10 → 8 |
| scMalignantFinder | 0.0094 → **0.0095** | 4 → 5 |
| RareQ | 0.0087 → **0.0090** | 8 → 8 |
| scCAD | 0.0088 → **0.0097** | 7 → 3 |
| random_baseline | 0.0087 → **0.0090** | 9 → 8 |
| DeepScena | 0.0091 → **0.0085** | 6 → 10 |

New ranks are average ranks with ties; Spearman on them reproduces ρ = 0.648, p = 0.043 exactly. The old ranks were invented; the "40 units: luad_laughney & crc_lee" comment is not in the paper and was removed.

### TRACKS_DATA

| Track | Field | Change |
|---|---|---|
| A | methodology, keyFinding, topPerformer, metricsSummary | removed "Overall Rank #1/#2"; FiRE vs expr BH-FDR 0.415 → **0.836**, δ +0.070 → **0.082 (6b) / 0.068 (7)**; Friedman p shown as printed (< 0.001); leaderboard = fallback-filtered medians, rank tests = 140 common units |
| B | datasetsCount, rarityRegime, methodology | "Synthetic Splatter Topologies"/"zero-inflation, mean-variance" → 8 datasets × T1–T4 × 3–4 reps; audited for library size, dropout, DE overlap (Fig. 2, §3.6) |
| C | datasetsCount, methodology, keyFinding, metricsSummary | "8 × 20 null replicates", "140 common units" → **8 datasets × 4 size tiers × 5 reps, N = 160**; BH-FDR > 0.86 → ≥ 0.863; adds hvg p = 7.0 × 10⁻²⁷, δ = −0.866 |
| F | keyFinding | "proving" → "indicating"; 0.1% values and Δ = −0.999; adds "must not be generalized" |

### Other blocks

| Block | Change | Source |
|---|---|---|
| EVIDENCE_ARMS | Arm 2: removed "GENCODE v44"; infercnvpy v0.6.1, GRCh38, MCC 0.361. Arm 3 metric "Lineage & Oncogenic Z-Score" → **AUCell (τ = 0.15)**. Arm 4 "50-PC graph purity" → **k = 15 kNN purity (τ = 0.50)**; P_HC/B_HC need all four criteria | §3.4–3.5, §7 |
| METHOD_AUDIT_DATA | Excluded list GapClust, GiniClust3, RaceID3, SCISSORS, CIARA, scAIDE, Edge → **raceid3, scAIDE, SCANER, MACE, CopyKAT, SCEVAN, scATOMIC** with Figure 3a reasons; included rows reworded to role ranks; scCAD/DeepScena "Included (Faithful)"; CaSee venue "bioRxiv 2022" → Oncogene 2022; scMalignantFinder "2026 (Proxy)" → Commun Biol 2025 | Fig. 3a |
| PIPELINE_PHASES | Phase 00: Python 3.11+/R 4.5 → paper run Python 3.13.5, R 4.5.0 | §3.9 |
| PRACTITIONER_SCENARIOS | S1 (scMalignantFinder for intra-lineage) now carries the paper's "crc_lee only, must not be generalized" caveat; S2 removed the unsupported "hash-sketching or marker Z-scoring are required"; S3 "0.562 median AP" (invented) → 0.518 mean / 0.493 median; S4 "single-marker epithelial thresholding" → expression-burden baseline | pp. 11, 18–19 |
| FIGURES_DATA | figNum/proofRef corrected (old ones pointed at nonexistent "Figure 7a/7b/8", wrong pages). Repository PNGs are labelled "Pipeline figure (cf. Figure X)" because **none of them is the published figure** (see (c)/(d)); captions now quote the proof's numbers | Figs 1–6 |

---

## (c) Page-copy corrections (do not edit here — for the page owners)

### Ranking framing (highest priority)

| File:line | Problem | Corrected text / behaviour |
|---|---|---|
| `src/pages/Home.tsx:18,77,84–86` | Hero card shows TOP5 by `overallRank` (hvg #1, CaSee #2, FiRE #3, expr #4, scMalignantFinder #5) | Show the ranked published top 5 by `publishedRankNum` (FiRE 1, CellSIUS 2, scMalignantFinder 3, RareQ 4, scCAD 5), plus a muted "Reference: ceiling 1.000 · exploratory 0.512 · naive 0.317" line. Drop the 1–10 CI bar here or label it "within-unit rank". |
| `Home.tsx:57` | caption "Top five of 10 methods by overall rank" | "Top five ranked published detectors by Track A median AP; reference methods are not ranked." |
| `Home.tsx:96` | "Not significant: they share a rank band." | "Not significantly different (BH-FDR 0.836); Cliff's δ negligible." |
| `Home.tsx:113–114` | "The top published tool ties a single-marker threshold" | "The best ranked published detector is not significantly different from a naive expression-burden baseline, and synthetic data does not predict the real ranking." |
| `Home.tsx:164` | "The top published tool ties a single-marker threshold." | "The best published detector is not significantly better than a naive baseline." |
| `Home.tsx:165` | "single-marker Z-scoring reaches …" | "the total-UMI expression baseline reaches …" |
| `Home.tsx:183` | "FiRE drops to {trackFMedianAP}" (0.022 = 0.5% tier) | Use `trackF01AP` and say "at 0.1% prevalence": "scMalignantFinder holds up (1.000, crc_lee only); FiRE drops to 0.005." |
| `Home.tsx:193` | "Where intervals overlap, we report a tie." | "Where pairwise tests are not significant, we say so rather than order the methods." |
| `src/pages/Leaderboard.tsx:16` | "CaSee, #2 overall, …" | "CaSee (exploratory comparator, unranked) scores …" |
| `Leaderboard.tsx:59–62` | "They carry a rank for context, not as competitors." Also CaSee is not shaded. | "Reference lines—the supervised ceiling, the exploratory comparator CaSee and the two baselines—are not assigned leaderboard ranks (proof Table 4)." |
| `Leaderboard.tsx:117` | "median AP over the 140 Track A units common to all 10 methods … read neighbouring rows as ties" | "median AP over each method's fallback-filtered Track A units (160; 140 for scCAD and DeepScena). Rank tests and intervals use the 140-unit common subset. Read neighbouring rows as not significantly different unless the pairwise tests say otherwise." |
| `Leaderboard.tsx:75,77` | `p = ${friedmanP}` shows 8.0 × 10⁻¹⁴⁴ | Either use `friedmanPAsPrinted` ("p < 0.001") or add "(recomputed from χ²)". Same for Iman–Davenport. |
| `Leaderboard.tsx:128` | "Wilcoxon signed-rank tests on 9 key pairs … the #1 published tool against a single-marker threshold" | "Wilcoxon signed-rank tests of every method against FiRE (Table 6b) … including FiRE against the naive expression-burden baseline." |
| `src/pages/leaderboard/model.ts:20` | `isReference` omits CaSee | Include `'Exploratory (Preprint)'` (or use `m.publishedRankNum === null`). |
| `model.ts:91` | overall view rank = `overallRank` | Use `publishedRankNum` (render "—" when null). |
| `model.ts:48` | "n = 140 common Track A units · rank CI = 95% bootstrap" | "median over fallback-filtered Track A units · rank CI = within-unit rank, 140 common units" |
| `model.ts:22–26` | Tier labels "T1 · 5%", "T2 · 1%", "T3 · 0.5%", "T4 · 0.1%", cell counts 100/20/10/2 | Paper tiers: **T1 5–10%, T2 1–5%, T3 0.1–1%, T4 0.01–0.1%** (Fig. 2, §3.6). Remove the per-tier cell counts unless sourced. |
| `model.ts:75` | Track F note | "sorted by 0.1% median AP (Table 5)"; consider `get: m => m.trackF01AP`. |
| `src/pages/leaderboard/RankTable.tsx:57` | badge `Published #n` OK; reference rows show "#" from `overallRank` (line 67–68) | Rank cell: `publishedRankNum ?? '—'`; secondary text "within-unit 3 [3–4]". |
| `RankTable.tsx:75,151,157,234` | "Track A rank … of 10" | "within-unit rank … of 10 (Figure 4b)" |
| `RankTable.tsx:83` | "Track F delta … Track F median (0.5%) − Track A median" | Paper's Δ uses the 0.1% tier: "Track F 0.1% median − Track A median" (hvg −0.999). |
| `leaderboard/Heatmaps.tsx:118` | "Treat them as ties, whatever the table above says." | "These pairs are not significantly different after BH-FDR correction; do not order them." |
| `Heatmaps.tsx:186` | "constant scores (AUROC 0.500)" | fine; note scMalignantFinder × rcc_multi is no longer marked degenerate. |
| `src/pages/Methods.tsx:22` | OK | — |
| `Methods.tsx:29` | "(BH-FDR = 0.415)" | "(Wilcoxon p = 0.836, BH-FDR = 0.836)" |
| `Methods.tsx:41` | "Preprint method. Ranked overall, kept out of the published role ranking." | "Cancer/normal scorer (Yuan et al., 2022, *Oncogene*). Reported as an exploratory comparator and not assigned a leaderboard rank." |
| `Methods.tsx:64–66` | "Overall #n · CI …" on every card | "Leaderboard rank: #n of 6" for published, "Reference (not ranked)" otherwise; within-unit rank as secondary text. |
| `Methods.tsx:136–139` | CRITERIA "failed" lists GapClust, GiniClust3, SCISSORS, Edge, RaceID3, CIARA, scAIDE | Use Figure 3a: not cell-level (raceid3); failed at scale (scAIDE); modality-incompatible (SCANER); degenerate outputs (MACE); not an expression scorer/ranker (CopyKAT, SCEVAN, scATOMIC). Also "Python 3.11+ and R 4.5" → paper ran Python 3.13.5 / R 4.5.0. |
| `src/pages/Tracks.tsx:244,252` | "Top three, same rank" stat (now evaluates to 0/3: hvg 1→1.5, CaSee 2→5, expr 3→5) | Replace with the paper's reading: "Without CNV, every method falls to 0.0085–0.0100; only the broad order is kept (ρ = 0.648)." |
| `Tracks.tsx:245,253` | "Largest shift" now = scCAD 8 → 3 (−5) on near-tied values | Keep only with the caveat "over near-tied chance values", or drop. |
| `Tracks.tsx:286–288` | "Median AP over 40 units (luad_laughney and crc_lee)" | Not in the paper. "Median Track A AP per method under CNV-free labels (Table 9a); values are near-tied chance values." |
| `Tracks.tsx:251` | "4-arm vs 3-arm (no-CNV) labels" | OK (source + AUCell + kNN). |
| `src/pages/Datasets.tsx:205` | P_HC rule "Author label positive and at least 2 of 3 non-author arms agree" | **Wrong.** "Source-positive, aneuploid (infercnvpy), AUCell ≥ 0.15 and kNN purity ≥ 0.50 — all four criteria." |
| `Datasets.tsx:207` | B_HC rule "Malignancy score ≤ 0.35 and diploid" | "All four criteria in the opposite direction (source-negative, diploid, low signature, kNN purity). Note: no cell met all four (n_B_HC = 0), so Track A backgrounds come from the broader source-negative, diploid, low-signature pool (§3.5)." |
| `src/pages/Cite.tsx:7–8` | TITLE hard-coded | Use `G.paperTitle` (same text, verified). |
| `Cite.tsx:93–95` | No "Revised", DOI shown as final | Add `{ k: 'Revised', v: G.revisedDate }`; when `!G.doiConfirmed` label DOI "provisional — proof shows XXXX" and keep the Frontiers article link off until confirmed. |
| `Cite.tsx` (authors) | Frontiers citation string matches the proof ("Satya Jaswanth MV, Gavin A, Aakash P, Tejesh Kumar M and Dasgupta A (2026) …") | — |
| `src/pages/Figures.tsx:13–24` | EXTRA "Figure 4 (Proof)" points to `figures/proof/Figure_04_TrackA_Primary.png`, which is actually a **crop of proof page 7 (body text + Table 1)**, not Figure 4; caption describes "4a CD, 4b bootstrap, 4d heatmap" | Replace the asset with the real Figure 4 (panels: a bootstrap AP intervals, b CD rank view, c rarity tiers + nAP slope) and fix the caption order (4a = bootstrap, 4b = CD). |
| `Figures.tsx:236` | "Every figure from the paper … as published" | Only Figures 1–2 are published figures; the rest are repository pipeline outputs. Say so. |
| `Datasets.tsx:372`, `Tracks.tsx:360` | captions | OK. |
| `index.html` | meta description | OK (no cell count). The **543,499** figure exists only in `_archive/v1/index.html:11` and `design/research/refero.md:147`; correct value is **359,739**. |
| `_archive/v1/src/components/Leaderboard.tsx:508` | "ceiling (Med AP = 0.768)" | Archived; the paper's ceiling median AP is **1.000** (mean 0.909). Do not reuse. |

### Known inconsistencies — resolved

| Issue | Resolution |
|---|---|
| cohort cellsNum sum 359,699 vs totalCells 359,739 | Table 2a prints bcc_yost as "~47,000"; the abstract's 359,739 implies 47,040. `cellsNum` set to 47040 → sum = 359,739. |
| per-cohort cnvPos sum 5,373 vs 5,010 | Per-cohort CNV values were wrong; Table 9b values now sum to 5,010 positives, 52,801 background, 57,811 cells. |
| hvg_logreg median AP 1.000 vs v1 copy 0.768 | **1.000** (abstract, Table 4, §5.2). 0.768 appears nowhere in the proof. |
| meta description 543,499 cells | Wrong. **359,739** cells (abstract p. 1). |

---

## (d) In the proof but not (properly) on the site

1. **The actual published Figures 3, 4, 5, 6** — none is in `public/figures/proof/`. The repository PNGs used instead show different analyses: Fig3 CD diagram uses dataset-level ranks with CD = 4.31 (paper: within-unit, CD = 1.14, N = 140); Fig7 forest plots dataset-level ranks (paper Fig. 4a: unit-level bootstrap AP); Fig5 plots top-k F1 (paper: FPR); Fig4 uses prevalence bins up to >15%; Fig6 is runtime vs dataset size (paper: runtime vs AP Pareto with unreliability bubbles); Fig10 lists GiniClust3 (paper: scAIDE); Fig11 prints FiRE 0.004 / expr 0.008 at 0.1% (Table 5: 0.005 / 0.009). Export Figures 3–6 from the proof and use them as the canonical images.
2. **Table 1a — label-threshold sensitivity** (3 × 3 τ grid; Spearman ρ crc_lee 0.939, hcc_wei 0.879, bcc_yost 0.818, pdac_peng 0.758, luad_laughney 0.685; rcc_multi and ov_izar_tirosh excluded). Not on the site.
3. **Table 4 role column / reference-row layout** — the site should mirror it (see (a)).
4. **Table 6a dataset-level bests** — CaSee best non-ceiling on 4 datasets, expr_threshold on 2, CellSIUS and scMalignantFinder on 1 each (data present in `DATASETS_DATA` but not presented as the "no single best method" finding).
5. **Table 8 per-unit SD, BH-FDR vs random and Cliff's δ** — now in `nullFPSD/nullFPBHFDR/nullFPCliffDelta`.
6. **Figure 3c multimetric heatmap** (mean nAP, Track E hvg 0.634, fallback/degenerate %) — mean nAP now in `meanNAP`.
7. **Track F mechanism for cluster methods** (§5.2): scCAD inverted (mean AUROC 0.365, 13/15 units < 0.5; prevalence-matched Track A AUROC 0.719); cluster methods emit ~4–30 distinct values per 2,000 cells; matched crc_lee AUROC drops (FiRE 0.988 → 0.705, CaSee 0.966 → 0.789, CellSIUS 0.751 → 0.319, scCAD 0.719 → 0.365, ceiling 1.000 → 0.500).
8. **"Rare" definition** (§3.1): low-abundance, not a rare biological sub-state; tools are "inter-lineage rare malignant cell detectors", not general rare-cell finders. Worth a sentence on Home/Methods.
9. **Limitations (§7)**: B_HC arm empty (n_B_HC = 0), single CNV caller (infercnvpy v0.6.1), Track F single dataset, mostly 10x data, no lineage-marker baseline. A short limitations panel is missing.
10. **Calibration (Fig. 5b right)**: ECE-15 hvg_logreg 0.079 vs random_baseline 0.477 — not shown.
11. **Editor / reviewers / revised date / both corresponding e-mails** — now in `GLOBAL_STATS`.
12. **Track D / Track E unit design text** from Figure 2 (Track E "640 method-units (supervised only)").

---

## (e) Values that could not be verified against the proof

| Item | Status |
|---|---|
| DOI `10.3389/fbinf.2026.1878538` | Proof prints "doi: XXXX"; pattern-derived. Flagged `doiConfirmed: false`. Publication date not assigned. |
| Accessions | Proof says GEO accessions are in "Data and Code Availability", but that section lists none. Site matches repo docs except **pdac_peng** (site "GSE202051 / CRA001160", docs "GSE202051") and **mm_ledergor** (site "GSE117156 / GSE161801", docs "GSE161801") — needs author confirmation. |
| `genes`, `donors`, `purityTier`, dataset descriptions (e.g. "portal vein thrombi", "pre/post PD-1") | Not in the proof. |
| Track D per-dataset bests (mm_ledergor scCAD 0.1148, breast_ctc RareQ 0.0814) and the Track D keyFinding (CellSIUS 4 fallbacks on Track D) | Proof gives no Track D numbers. Overall Track D APs match `sens4_track_d_natural.csv`, where hvg_logreg (0.728) is actually the best overall. |
| `trackDMedianAP`, `nullMeanScore`, `trackFMeanAP`, `exclDegenerateMeanAP`, `topKF1` per-tier, `oracleGap` | Not printed in the proof (oracleGap and topKF1 match repo CSVs). |
| `trackFMedianAP` | Equals the 0.5% column of Table 5 (the median of the three tier medians); the paper's headline Track F numbers use the 0.1% column (`trackF01AP`). |
| Repo `track_f_leaderboard.csv` | Gives FiRE 0.004 and expr_threshold 0.008 at 0.1%; the proof's Table 5 says 0.005 / 0.009. Site keeps the proof values. |
| Figure 3c "Track C FPR" column (0.012 hvg, 0.028 others) | Differs from Table 8 (0.788 / ~0.03); probably a different metric. Ask the authors. |
| Cliff's δ FiRE vs expr_threshold | Paper gives 0.0816 (Table 6b, 140 common units) and 0.068/0.07 (Table 7 and text). Both kept, labelled by source. |
| hvg_logreg vs FiRE Wilcoxon p | Not printed; row kept with "not reported". |
| RareQ citation | The proof never names RareQ's reference explicitly; Fa et al. (2026, Nat Commun, "Cell neighborhood topology…") is the only matching reference. Confirm. |
| FiRE citation | Site cites Jindal et al. 2018 (the original FiRE paper); the proof cites Märtens et al. 2023 at the FiRE mention and has no Jindal reference. |
| hvg_logreg "5-fold CV" | Code uses `LogisticRegressionCV(cv=5)` for regularization with in-sample scoring; the proof says only "in-sample ceiling … 2,000 HVGs" (code default `n_hvgs = 500` — check config). |
| Zenodo archive DOIs, sizes and contents | Proof only says "Versioned Zenodo archives". |
| `category` literal `'Exploratory (Preprint)'` | CaSee is published (Oncogene 2022). The type literal is used by pages, so it was not renamed; change it together with `Home.tsx:37`, `model.ts:15` and `Methods.tsx:39`. |
| Proof query Q1 (corresponding e-mail list) and Q2 (Q19/Q43 figure correction) | Open typesetter queries; may still change author block or a figure. |

Type-check after edits: `npx tsc --noEmit -p tsconfig.app.json` → exit 0.
