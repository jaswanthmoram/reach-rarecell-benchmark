import {
  DATASETS_DATA,
  GLOBAL_STATS as G,
  LEADERBOARD_DATA,
  TRACKS_DATA,
  TRACK_E_NOISE_CONDITIONS,
  type MethodResult,
  type TrackInfo,
} from '../../data/benchmarkData';
import { fmt, type LiveLayout } from '../../ui';

/* ---------- Tracks ---------- */
export const letterOf = (t: TrackInfo) => t.code.replace('Track ', '');
export const TRACKS = [...TRACKS_DATA].sort((a, b) => a.code.localeCompare(b.code));
export const LETTERS = TRACKS.map(letterOf);

/** Non-breaking hyphens so "Spike-Ins" never splits across lines. */
export const nb = (s: string) => s.replace(/-/g, '‑');

/** One-word names for the compact (mobile) selector. */
export const SHORT: Record<string, string> = {
  A: 'Spike-ins', B: 'Synthetic', C: 'Null', D: 'Blood', E: 'Noise', F: 'Lineage',
};

/** How each track's numbers are read. Only A produces leaderboard ranks. */
export const READING: Record<string, string> = {
  A: 'Primary ranking', B: 'Stress test', C: 'Pass / fail', D: 'Supplement', E: 'Supervised only', F: 'Diagnostic',
};

/** Compact design facts for the overview table (paraphrased from TRACKS_DATA). */
export const DESIGN_SHORT: Record<string, { datasets: string; regime: string }> = {
  A: { datasets: '8 solid cohorts', regime: 'T1 to T4 · 5–10% down to 0.01–0.1%' },
  B: { datasets: '8 Splatter fits', regime: 'T1 to T4 · 3–4 replicates' },
  C: { datasets: '8 cohorts × 4 sizes', regime: 'Background only, no positives' },
  D: { datasets: '2 blood / CTC cohorts', regime: 'Natural prevalence' },
  E: { datasets: '8 solid × 4 conditions', regime: '4 label-noise regimes' },
  F: { datasets: '1 cohort (crc_lee)', regime: '0.1%, 0.5%, 1.0% prevalence' },
};

/* ---------- Methods ---------- */
export const M: Record<string, MethodResult> = Object.fromEntries(LEADERBOARD_DATA.map((m) => [m.id, m]));
export const byName = (name: string) => LEADERBOARD_DATA.find((m) => m.method === name);
export const isRef = (m: MethodResult) => m.publishedRankNum === null;
export const isCeiling = (id: string) => id === 'hvg_logreg';
/** References always appear in one fixed order (exploratory, naive, floor), on every chart and table. */
const REF_ORDER = ['CaSee', 'expr_threshold', 'random_baseline'];
export const byRefOrder = (a: MethodResult, b: MethodResult) => REF_ORDER.indexOf(a.id) - REF_ORDER.indexOf(b.id);

/** Short role words for reference methods, used in key columns and notes. */
const ROLE_SHORT: Record<string, string> = {
  'Supervised ceiling': 'ceiling', Exploratory: 'exploratory', 'Naive baseline': 'naive', 'Floor baseline': 'floor',
};
export const roleShort = (m: MethodResult) => (m.paperRole ? ROLE_SHORT[m.paperRole] ?? 'ref' : 'ref');

const cohortCells = (id: string) => DATASETS_DATA.find((d) => d.id === id)?.cellsNum;

/* ---------- Per-track overrides ---------- */
export interface Metric { label: string; value: string; sub: string }
export interface Performer { id: string; value: string; note: string }

const a2b = LEADERBOARD_DATA.map((m) => ({ m, d: m.trackBRank - m.trackARank }));
const rise = a2b.reduce((x, y) => (y.d < x.d ? y : x));
const drop = a2b.reduce((x, y) => (y.d > x.d ? y : x));

/** Track D lists rank only the six ranked detectors; every reference (ceiling included) is excluded. */
const rankedD = LEADERBOARD_DATA.filter((m) => !isRef(m)).sort((x, y) => y.trackDAP - x.trackDAP);
const fLow = LEADERBOARD_DATA.filter((m) => m.trackF01AP <= 0.009).length;
const fDelta = (m: MethodResult) => m.trackF01AP - m.medianAP;

/** One plain sentence per track, no figures: the stat row and chart carry the numbers. */
export const FINDING: Record<string, string> = {
  A: 'Track A is the only track that produces leaderboard ranks. Gaps between neighbouring detectors are small, so read the order with the pairwise tests.',
  B: 'Synthetic Splatter ranks do not predict real-data ranks: graph and clustering methods rise and marker-based methods fall.',
  C: 'Every unsupervised method sits at the random floor on background-only units. The supervised ceiling is the one method that over-flags.',
  D: `On natural blood and CTC samples every unsupervised method stays low, with ${rankedD[0].method}, ${rankedD[1].method} and ${rankedD[2].method} highest among the ranked detectors.`,
  E: 'The supervised ceiling tolerates missed positives but loses much of its precision when background cells are labelled positive.',
  F: 'Without the lineage contrast almost every method collapses. scMalignantFinder holds, on a single colorectal cohort.',
};

export const METRICS: Partial<Record<string, Metric[]>> = {
  /* The FiRE vs expr_threshold test lives on the leaderboard (rule 7); the panel links there. */
  A: [
    { label: 'Friedman χ²', value: '695.05', sub: 'p < 0.001 over 140 common units, Iman–Davenport F = 171.01' },
    { label: 'Supervised ceiling', value: fmt.ap(M.hvg_logreg.medianAP), sub: 'hvg_logreg median AP, reference' },
    { label: 'Steepest rarity slope', value: '+0.220', sub: 'CellSIUS, then RareQ (+0.212) and CaSee (+0.179)' },
  ],
  B: [
    { label: 'Spearman, A vs B', value: G.trackABSpearmanRho.toFixed(3), sub: `p = ${G.trackABSpearmanP} over 10 methods: synthetic ranks do not predict real data` },
    { label: 'Largest rise', value: `${-rise.d} places`, sub: `${rise.m.method}, mean within-unit rank, Track A to Track B` },
    { label: 'Largest drop', value: `${drop.d} places`, sub: `${drop.m.method}, mean within-unit rank, Track A to Track B` },
  ],
  D: [
    { label: 'Highest among ranked', value: fmt.ap(rankedD[0].trackDAP), sub: `${rankedD[0].method} mean AP, then ${rankedD[1].method} ${fmt.ap(rankedD[1].trackDAP)} and ${rankedD[2].method} ${fmt.ap(rankedD[2].trackDAP)}` },
    { label: 'Supervised ceiling', value: fmt.ap(M.hvg_logreg.trackDAP), sub: 'hvg_logreg mean AP, reference' },
    { label: 'Cohorts', value: '2', sub: `mm_ledergor (${fmt.int(cohortCells('mm_ledergor') ?? 0)} cells), breast_ctc_szczerba (${fmt.int(cohortCells('breast_ctc_szczerba') ?? 0)})` },
  ],
  F: [
    { label: 'scMalignantFinder', value: fmt.ap(M.scMalignantFinder.trackF01AP), sub: `median AP at 0.1%, crc_lee only (${fmt.ap(M.scMalignantFinder.trackF05AP)} at 0.5%, ${fmt.ap(M.scMalignantFinder.trackF10AP)} at 1.0%)` },
    { label: 'Ceiling change, Δ', value: fDelta(M.hvg_logreg).toFixed(3).replace('-', '−'), sub: `hvg_logreg ${fmt.ap(M.hvg_logreg.medianAP)} on Track A → ${fmt.ap(M.hvg_logreg.trackF01AP)} at 0.1%` },
    { label: 'At or below 0.009 AP', value: `${fLow} / ${LEADERBOARD_DATA.length}`, sub: 'methods at 0.1% prevalence (Table 5)' },
  ],
};

/** One headline number per track, shown on its tab so B to F carry a result before they are opened. */
const fpUnsup = LEADERBOARD_DATA.filter((m) => !isCeiling(m.id)).map((m) => m.nullFPRate);
export const HEADLINE: Record<string, string> = {
  A: `FiRE ${fmt.ap(M.FiRE.medianAP)} median AP`,
  B: `ρ = ${G.trackABSpearmanRho.toFixed(3)}, A vs B`,
  C: `max FPR ${Math.max(...fpUnsup).toFixed(4)}`,
  D: `${rankedD[0].method} ${fmt.ap(rankedD[0].trackDAP)} mean AP`,
  E: `RI ${(TRACK_E_NOISE_CONDITIONS.find((c) => c.code === 'fp_30')?.robustnessIndex ?? 0).toFixed(3)}, 30% Bg → Pos`,
  F: `${fLow} of ${LEADERBOARD_DATA.length} at ≤ 0.009 AP`,
};

/** Named methods for tracks whose chart and stat row do not already name them (A, B and D do). */
export const TOP: Partial<Record<string, { label: string; items: Performer[]; note?: string }>> = {
  C: {
    label: 'Lowest null FPR',
    items: [...LEADERBOARD_DATA].sort((x, y) => x.nullFPRate - y.nullFPRate).slice(0, 2).map((m) => ({ id: m.id, value: m.nullFPRate.toFixed(4), note: 'FPR' })),
  },
  E: {
    label: 'Supervised ceiling only',
    items: [{ id: 'hvg_logreg', value: fmt.ap(TRACK_E_NOISE_CONDITIONS.find((c) => c.code === 'fn_30')?.meanAP ?? 0), note: 'mean AP at 30% Pos → Bg' }],
    note: 'Unsupervised detectors do not use labels, so Track E is read for hvg_logreg alone.',
  },
  F: {
    label: 'Track F, 0.1% prevalence',
    items: [{ id: 'scMalignantFinder', value: fmt.ap(M.scMalignantFinder.trackF01AP), note: 'median AP' }],
    note: 'A colorectal-specific result on one cohort. The paper says it must not be generalized.',
  },
};

/** Far layer for the shared LiveHero: sparse, slow, no signal, drifting the same way as the lanes. */
export const farField: LiveLayout = (r) =>
  Array.from({ length: 260 }, () => ({ x: r(), y: r(), r: 0.6 + r() * 0.9, vx: 0.003 + r() * 0.004 }));
