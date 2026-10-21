import {
  DATASET_METHOD_MATRIX,
  GLOBAL_STATS as G,
  LEADERBOARD_DATA,
  PAIRWISE_COMPARISONS,
  PIPELINE_PHASES,
  TRACKS_DATA,
  type MethodResult,
} from '../../data/benchmarkData';
import { methodColor } from '../../lib/format';

/** Field cohorts, in the order the board lays out the clouds (one cloud per cohort). */
export const FIELD_COHORTS = ['hnscc_puram', 'ov_izar_tirosh', 'hcc_wei', 'luad_laughney', 'rcc_multi', 'pdac_peng', 'crc_lee', 'bcc_yost', 'mm_ledergor', 'breast_ctc_szczerba'] as const;
export const RARE_PER_COHORT = 3;
export const RARE_TOTAL = FIELD_COHORTS.length * RARE_PER_COHORT;

export interface RankRow {
  id: string;
  name: string;
  rank: number | null;
  role: string;
  isRef: boolean;
  color: string;
  median: number;
  lo: number;
  hi: number;
  mean: number;
  /** Rare cells ringed per cohort: three times the method's Track A mean AP on that cohort, rounded; null where it has no Track A score. */
  found: (number | null)[];
}

const ROLE: Record<string, string> = {
  'Supervised ceiling': 'supervised ceiling',
  Exploratory: 'exploratory comparator',
  'Naive baseline': 'naive baseline, total UMI',
  'Floor baseline': 'floor',
};

function toRow(m: MethodResult): RankRow {
  const isRef = m.publishedRankNum == null;
  const found = FIELD_COHORTS.map((c) => {
    const cell = DATASET_METHOD_MATRIX.find((x) => x.dataset === c && x.method === m.id);
    return cell?.meanAP == null ? null : Math.min(RARE_PER_COHORT, Math.round(cell.meanAP * RARE_PER_COHORT));
  });
  return {
    id: m.id, name: m.method, rank: m.publishedRankNum, isRef, color: methodColor(m.id),
    role: isRef ? ROLE[m.paperRole ?? ''] ?? '' : '',
    median: m.medianAP, lo: m.bootAPLow ?? m.medianAP, hi: m.bootAPHigh ?? m.medianAP, mean: m.bootstrapMeanAP, found,
  };
}

/** Cohorts on the field with no Track A score for any method (the blood / CTC cohorts). */
export const UNSCORED_COHORTS: readonly string[] = FIELD_COHORTS.filter((c) => !DATASET_METHOD_MATRIX.some((x) => x.dataset === c && x.meanAP != null));

/** Ringed cells and the cells the method could ring (its scored cohorts only). */
export function ringTally(row: RankRow) {
  const scored = row.found.filter((n): n is number => n != null);
  return { ringed: scored.reduce((a, b) => a + b, 0), of: scored.length * RARE_PER_COHORT, cohorts: scored.length };
}

const byId = (id: string) => LEADERBOARD_DATA.find((m) => m.id === id);
const rows = LEADERBOARD_DATA.map(toRow);

/** Ranking order: supervised ceiling, ranks 1 to 6, then the unranked references. */
export const CEILING = rows.filter((r) => r.id === 'hvg_logreg');
export const RANKED = rows.filter((r) => r.rank != null).sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
const REF_ORDER = ['CaSee', 'expr_threshold', 'random_baseline'];
export const REFS = REF_ORDER.map((id) => rows.find((r) => r.id === id)).filter((r): r is RankRow => !!r);
export const ALL_ROWS = [...CEILING, ...RANKED, ...REFS];

const pair = (a: string, b: string) => PAIRWISE_COMPARISONS.find((p) => (p.methodA === a && p.methodB === b) || (p.methodA === b && p.methodB === a));
const num = (s: string | undefined) => (s ? s.replace(/\s*\(.*\)$/, '') : 'n/a');
const signed = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(3)}`;

const fire = byId('FiRE');
const expr = byId('expr_threshold');
const ceil = byId('hvg_logreg');
const smf = byId('scMalignantFinder');
const rareq = byId('RareQ');
const fireExpr = pair('FiRE', 'expr_threshold');
const fireSmf = pair('FiRE', 'scMalignantFinder');
const ceilFire = pair('hvg_logreg', 'FiRE');
const fTierMax = 0.009;
const fFailing = LEADERBOARD_DATA.filter((m) => m.trackF01AP <= fTierMax).length;
const shift = (m: MethodResult | undefined) => (m ? Math.abs(m.trackARank - m.trackBRank) : 0);

export const CARD_NOTE = {
  fireExpr: num(fireExpr?.pAdjusted),
  fireSmf: num(fireSmf?.pAdjusted),
  units: G.trackAUnits,
  commonUnits: G.trackACommonUnits,
};

/** Hero counts: plain integers, so they may count up once (never AP or test statistics). */
export const STATS = [
  { label: 'Cohorts', value: G.datasetsCount, note: `${G.solidCohorts} solid + ${G.hematologicCohorts} blood / CTC`, to: '/datasets' as const },
  { label: 'Cells', value: Number(G.totalCells.replace(/\D/g, '')), note: 'QC-filtered', to: '/datasets' as const },
  { label: 'Units', value: G.totalUnits, note: `${G.coreUnits.toLocaleString('en-US')} core + ${G.trackFUnits} Track F`, to: '/tracks' as const },
];

export interface Finding {
  n: string;
  tag: string;
  figure: string;
  title: string;
  body: string;
  link: string;
  to: '/leaderboard' | '/tracks';
  query?: string;
}

export const FINDINGS: Finding[] = [
  {
    n: '01', tag: 'BH-FDR · FiRE vs expr_threshold', figure: num(fireExpr?.pAdjusted),
    title: 'The top-ranked published detector is not significantly better than a naive baseline.',
    body: `FiRE reaches ${fire?.medianAP.toFixed(3)} median AP on Track A. The total-UMI expression baseline reaches ${expr?.medianAP.toFixed(3)}. Wilcoxon p = ${fireExpr?.pRaw}, Cliff’s δ ${signed(fireExpr?.cliffsDelta ?? 0)}: a negligible difference.`,
    link: 'See the pairwise tests', to: '/leaderboard',
  },
  {
    n: '02', tag: 'Spearman · Track A vs B ranks', figure: `ρ = ${G.trackABSpearmanRho.toFixed(3)}`,
    title: 'Synthetic benchmarks do not predict real rankings.',
    body: `Across all ${G.methodsIncluded} methods, RareQ gains ${shift(rareq)} places on simulated Track B while the expression baseline loses ${shift(expr)}. A near-zero correlation means a synthetic score says little about patient-derived performance.`,
    link: 'Open Track B', to: '/tracks', query: 'track=b',
  },
  {
    n: '03', tag: 'mean AP gap · supervised ceiling vs FiRE', figure: signed(ceilFire?.meanDiff ?? 0),
    title: 'Unsupervised detectors sit far below the supervised ceiling.',
    body: `A logistic regression trained on the labels reaches ${ceil?.medianAP.toFixed(3)} median AP. It needs ground truth, and it over-flags pure background (Track C null FPR ${ceil?.nullFPRate.toFixed(3)}).`,
    link: 'See the reference rows', to: '/leaderboard',
  },
  {
    n: '04', tag: `methods at median AP ≤ ${fTierMax} · Track F, 0.1% tier`, figure: `${fFailing} of ${LEADERBOARD_DATA.length}`,
    title: 'Remove lineage contrast and most detectors fail.',
    body: `Track F spikes malignant epithelium into normal epithelium. At 0.1% prevalence only scMalignantFinder holds up (${smf?.trackF01AP.toFixed(3)}, crc_lee only). FiRE drops to ${fire?.trackF01AP.toFixed(3)}.`,
    link: 'Inspect Track F', to: '/tracks', query: 'track=f',
  },
];

export const TRACK_ROWS = [...TRACKS_DATA]
  .sort((a, b) => a.code.localeCompare(b.code))
  .map((t) => ({ letter: t.code.replace('Track ', ''), name: t.name, role: t.roleBadge, units: t.units }));

/* ---------- Pipeline stages (Phase 00 is the environment lock, counted apart) ---------- */
const pad = (n: number) => String(n).padStart(2, '0');
const phaseNums = (label: string) => {
  const m = (label.match(/\d+/g) ?? []).map(Number);
  if (m.length === 1) return [m[0]];
  if (m.length === 2) return Array.from({ length: m[1] - m[0] + 1 }, (_, i) => m[0] + i);
  return [];
};

export interface Stage {
  name: string;
  num: string;
  count: number;
  hasLock: boolean;
  range: string;
  phases: (typeof PIPELINE_PHASES)[number][];
}

export const STAGES: Stage[] = ['Prep', 'Tracks', 'Methods', 'Exec', 'Eval'].map((name, i) => {
  const phases = PIPELINE_PHASES.filter((p) => p.stage === name);
  const ns = phases.flatMap((p) => phaseNums(p.phase));
  const lo = Math.min(...ns);
  const hi = Math.max(...ns);
  return {
    name, num: pad(i + 1), count: ns.filter((x) => x > 0).length, hasLock: ns.includes(0), phases,
    range: lo === hi ? `Phase ${pad(lo)}` : `Phases ${pad(lo)}–${pad(hi)}`,
  };
});

/* ---------- Finding micro-charts (drawn once on view) ---------- */
export interface Interval { id: string; name: string; color: string; isRef: boolean; mean: number; lo: number; hi: number }
const interval = (m: MethodResult | undefined): Interval | null => (m ? {
  id: m.id, name: m.method, color: methodColor(m.id), isRef: m.publishedRankNum == null,
  mean: m.bootstrapMeanAP, lo: m.bootAPLow ?? m.bootstrapMeanAP, hi: m.bootAPHigh ?? m.bootstrapMeanAP,
} : null);

/** 01: FiRE and the total-UMI baseline, bootstrap mean AP with 95% interval. */
export const PAIR_CI = [interval(fire), interval(expr)].filter((r): r is Interval => !!r);

/** 02: Track A rank against Track B rank for every method; the two named in the card are highlighted. */
export const RANK_SHIFT = LEADERBOARD_DATA.map((m) => ({
  id: m.id, name: m.method, a: m.trackARank, b: m.trackBRank, color: methodColor(m.id),
  focus: m.id === 'RareQ' || m.id === 'expr_threshold',
}));

/** 03: the supervised ceiling's median AP against the six ranked detectors. */
export const CEILING_GAP = {
  ceiling: ceil ? { name: ceil.method, median: ceil.medianAP } : null,
  ranked: RANKED.map((r) => ({ id: r.id, name: r.name, median: r.median, color: r.color })),
};

/** 04: Track F median AP at the 0.1% tier, per method. */
export const TRACK_F = {
  max: fTierMax,
  rows: LEADERBOARD_DATA.map((m) => ({ id: m.id, name: m.method, v: m.trackF01AP, color: methodColor(m.id), holds: m.trackF01AP > fTierMax })),
};


