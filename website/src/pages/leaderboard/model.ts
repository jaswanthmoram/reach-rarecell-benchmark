import {
  CLIFF_DELTA_MATRIX, CLIFF_DELTA_METHODS, GLOBAL_STATS, LEADERBOARD_DATA, PAIRWISE_COMPARISONS, type MethodResult, type PairwiseComparison,
} from '../../data/benchmarkData';
import { fmt, methodColor } from '../../lib/format';
import type { DrawInOptions } from '../../ui/motion/useDrawSvg';

/* Board model for P02 Leaderboard: every number comes from LEADERBOARD_DATA (proof-verified). */

export type Band = 'ceiling' | 'ranked' | 'reference';
export type Group = 'ranked' | 'reference';
export type ViewId = 'overall' | 'tier' | 'trackC' | 'trackF' | 'runtime' | 'rank';
export type TierId = 't1' | 't2' | 't3' | 't4';
export type SortKey = 'rank' | 'view' | 'medianAP' | 'meanAP' | 'auroc' | 'topKF1' | 'runtimeS';
export type Sort = { key: SortKey; dir: 'asc' | 'desc' } | null;

export interface Row {
  id: string;
  name: string;
  rank: number | null;
  band: Band;
  role: string;
  color: string;
  isRef: boolean;
  m: MethodResult;
}

const ROLE: Record<NonNullable<MethodResult['paperRole']>, string> = {
  'Supervised ceiling': 'Supervised ceiling',
  Published: 'Published',
  'Published/proxy': 'Published · proxy',
  Exploratory: 'Exploratory comparator',
  'Naive baseline': 'Naive baseline',
  'Floor baseline': 'Floor baseline',
};

const bandOf = (m: MethodResult): Band =>
  m.paperRole === 'Supervised ceiling' ? 'ceiling' : m.publishedRankNum != null ? 'ranked' : 'reference';

export const ROWS: Row[] = LEADERBOARD_DATA.map((m) => ({
  id: m.id,
  name: m.method,
  rank: m.publishedRankNum,
  band: bandOf(m),
  role: m.paperRole ? ROLE[m.paperRole] : m.category,
  color: methodColor(m.method),
  isRef: m.publishedRankNum == null,
  m,
}));

export const BY_NAME = new Map(ROWS.map((r) => [r.name.toLowerCase(), r]));
export const rowOf = (name: string) => BY_NAME.get(name.toLowerCase());

const BAND_ORDER: Record<Band, number> = { ceiling: 0, ranked: 1, reference: 2 };
/** Board order: ceiling, ranks 1 to 6, then the references by Track A median AP. */
export const BOARD_ORDER: Row[] = [...ROWS].sort(
  (a, b) => BAND_ORDER[a.band] - BAND_ORDER[b.band] || (a.rank ?? 99) - (b.rank ?? 99) || b.m.medianAP - a.m.medianAP,
);
export const REFERENCE_ROWS = BOARD_ORDER.filter((r) => r.band === 'reference');
export const RANKED_COUNT = ROWS.filter((r) => !r.isRef).length;
export const UNRANKED_COUNT = ROWS.length - RANKED_COUNT;

export const BANDS: { id: Band; label: string; note: string }[] = [
  { id: 'ceiling', label: 'Supervised ceiling', note: 'Not ranked · trained on labels' },
  { id: 'ranked', label: 'Ranked detectors', note: `Leaderboard ranks 1 to ${RANKED_COUNT}` },
  { id: 'reference', label: 'Comparator and baselines', note: 'Not ranked' },
];

export const TIERS: { id: TierId; label: string; range: string }[] = [
  { id: 't1', label: 'T1 · 5–10%', range: '5–10%' },
  { id: 't2', label: 'T2 · 1–5%', range: '1–5%' },
  { id: 't3', label: 'T3 · 0.1–1%', range: '0.1–1%' },
  { id: 't4', label: 'T4 · 0.01–0.1%', range: '0.01–0.1%' },
];
const TIER_KEY: Record<TierId, keyof MethodResult> = { t1: 't1MedianAP', t2: 't2MedianAP', t3: 't3MedianAP', t4: 't4MedianAP' };

export interface View {
  label: string;
  col: (t: TierId) => string;
  better: 'higher' | 'lower';
  get: (m: MethodResult, t: TierId) => number;
  fmt: (v: number) => string;
  note: (t: TierId) => string;
  order: (t: TierId) => string;
}

const tierRange = (t: TierId) => TIERS.find((x) => x.id === t)?.range ?? '';

export const VIEWS: Record<ViewId, View> = {
  overall: {
    label: 'Track A AP', col: () => 'Median AP', better: 'higher', get: (m) => m.medianAP, fmt: fmt.ap,
    note: () => 'Track A median AP · P_HC vs B_HC · fallback-filtered units (160; 140 for scCAD, DeepScena)',
    order: () => 'Track A median AP, highest first',
  },
  tier: {
    label: 'By prevalence tier', col: (t) => `${t.toUpperCase()} median AP`, better: 'higher',
    get: (m, t) => m[TIER_KEY[t]] as number, fmt: fmt.ap,
    note: (t) => `Median AP at ${t.toUpperCase()} · ${tierRange(t)} prevalence · n = 40 units per tier`,
    order: (t) => `${t.toUpperCase()} median AP, highest first`,
  },
  trackC: {
    label: 'Track C null FP', col: () => 'Null FP rate', better: 'lower', get: (m) => m.nullFPRate, fmt: (v) => v.toFixed(4),
    note: () => 'False-positive rate on background-only null units (Table 8) · lower is better · N = 160 units',
    order: () => 'Track C null false-positive rate, lowest first',
  },
  trackF: {
    label: 'Track F 0.1%', col: () => 'Track F 0.1% AP', better: 'higher', get: (m) => m.trackF01AP, fmt: fmt.ap,
    note: () => 'Median AP at 0.1% prevalence (Table 5) · malignant vs normal epithelial, crc_lee only · 15 diagnostic units',
    order: () => 'Track F median AP at 0.1% prevalence, highest first',
  },
  runtime: {
    label: 'Runtime', col: () => 'Runtime', better: 'lower', get: (m) => m.runtimeS, fmt: fmt.secs,
    note: () => 'Mean wall-clock time per Track A unit · lower is better · DeepScena ran on a Colab T4 GPU',
    order: () => 'mean runtime per unit, fastest first',
  },
  rank: {
    label: 'Rank uncertainty', col: () => 'Within-unit rank', better: 'lower', get: (m) => m.rankMean, fmt: (v) => v.toFixed(2),
    note: () => 'Within-unit rank, all 10 methods (Figure 4b) · 140 common units · 95% bootstrap interval',
    order: () => 'mean within-unit rank, lowest first',
  },
};
export const VIEW_ORDER: ViewId[] = ['overall', 'tier', 'trackC', 'trackF', 'runtime', 'rank'];
export const isViewId = (v: string | null): v is ViewId => v != null && (VIEW_ORDER as string[]).includes(v);
export const isTierId = (v: string | null): v is TierId => v != null && TIERS.some((t) => t.id === v);

const COL_LABEL: Record<Exclude<SortKey, 'view'>, string> = {
  rank: 'Rank', medianAP: 'Median AP', meanAP: 'Mean AP', auroc: 'AUROC', topKF1: 'Top-k F1', runtimeS: 'Runtime',
};

export const defaultSort = (view: ViewId) => ({ key: 'view' as const, dir: VIEWS[view].better === 'higher' ? ('desc' as const) : ('asc' as const) });

function sortValue(r: Row, key: SortKey, view: ViewId, tier: TierId) {
  switch (key) {
    case 'rank': return r.rank ?? 99;
    case 'view': return VIEWS[view].get(r.m, tier);
    case 'medianAP': return r.m.medianAP;
    case 'meanAP': return r.m.meanAP;
    case 'auroc': return r.m.auroc;
    case 'topKF1': return r.m.topKF1;
    default: return r.m.runtimeS;
  }
}

/** Header click cycle: first direction, then the other, then back to the view default. */
export function nextSort(current: NonNullable<Sort>, key: SortKey, view: ViewId): Sort {
  const lowerFirst = key === 'rank' || key === 'runtimeS' || (key === 'view' && VIEWS[view].better === 'lower');
  const first = lowerFirst ? 'asc' : 'desc';
  if (current.key !== key) return { key, dir: first };
  if (current.dir === first) return { key, dir: first === 'asc' ? 'desc' : 'asc' };
  return null;
}

export const matches = (r: Row, q: string) =>
  !q || [r.name, r.m.paradigm, r.m.mechanism, r.role].some((t) => t.toLowerCase().includes(q));

/** Filter, then sort inside each band. Bands never interleave. */
export function selectRows(opts: { view: ViewId; tier: TierId; sort: Sort; groups: Record<Group, boolean>; query: string }) {
  const { view, tier, groups } = opts;
  const sort = opts.sort ?? defaultSort(view);
  const q = opts.query.trim().toLowerCase();
  return ROWS
    .filter((r) => groups[r.isRef ? 'reference' : 'ranked'] && matches(r, q))
    .map((r) => ({ r, v: sortValue(r, sort.key, view, tier) }))
    .sort((a, b) => BAND_ORDER[a.r.band] - BAND_ORDER[b.r.band]
      || (a.v === b.v ? b.r.m.medianAP - a.r.m.medianAP : sort.dir === 'asc' ? a.v - b.v : b.v - a.v))
    .map((x) => x.r);
}

export const orderText = (view: ViewId, tier: TierId, sort: Sort) => {
  if (!sort) return VIEWS[view].order(tier);
  const label = sort.key === 'view' ? VIEWS[view].col(tier) : COL_LABEL[sort.key];
  return `${label}, ${sort.dir === 'asc' ? 'ascending' : 'descending'}`;
};

export const signed = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(3)}`;

/** Detail facts (board order and wording). */
export const factsOf = (m: MethodResult) => [
  { k: 'Paradigm', v: `${m.paradigm} · ${m.language}` },
  { k: 'Degenerate units', v: `Track A ${m.trackADegenerate} · all tracks ${m.degenerateUnits} (${m.degeneratePct}%)` },
  { k: 'Fallback units', v: `Track A ${m.trackAFallback} · all tracks ${m.fallbackUnits} (${m.fallbackPct}%)` },
  { k: 'Track F Δ', v: `${signed(m.trackF01AP - m.medianAP)} (Track F 0.1% median ${fmt.ap(m.trackF01AP)} − Track A median ${fmt.ap(m.medianAP)})` },
  { k: 'Excl. degenerate', v: `median AP ${fmt.ap(m.exclDegenerateMedianAP)} · mean ${fmt.ap(m.exclDegenerateMeanAP)}` },
  { k: 'Within-unit rank', v: `${m.rankMean.toFixed(2)} [${m.rankCILow}–${m.rankCIHigh}] of 10 (Figure 4b, not the leaderboard rank)` },
  { k: 'Track B vs A', v: `within-unit rank ${m.trackBRank} synthetic vs ${m.trackARank} real, of 10` },
];

/** Shared Track A AP axis for the hero forest plot and the table intervals: 0 to 0.6. */
export const AP_MAX = 0.6;
export const AP_TICKS = [0, 0.2, 0.4, 0.6];

/** CSV of the rows on screen, in on-screen order. */
export function toCsv(rows: Row[], view: ViewId, tier: TierId) {
  const V = VIEWS[view];
  const head = ['group', 'rank', 'method', 'role', ...(view !== 'overall' ? [V.col(tier)] : []), 'median_ap', 'mean_ap', 'sd_ap',
    'bootstrap_mean_ap', 'bootstrap_ci_low', 'bootstrap_ci_high', 'auroc', 'top_k_f1', 'runtime_s'];
  const esc = (s: string | number) => (/[",\n]/.test(String(s)) ? `"${String(s).replace(/"/g, '""')}"` : String(s));
  const lines = rows.map((r) => [
    BANDS.find((b) => b.id === r.band)?.label ?? r.band, r.rank ?? '', r.name, r.role,
    ...(view !== 'overall' ? [V.fmt(V.get(r.m, tier)).replace(' s', '')] : []),
    fmt.ap(r.m.medianAP), fmt.ap(r.m.meanAP), fmt.ap(r.m.stdAP), fmt.ap(r.m.bootstrapMeanAP),
    fmt.ap(r.m.bootAPLow ?? r.m.bootstrapMeanAP), fmt.ap(r.m.bootAPHigh ?? r.m.bootstrapMeanAP),
    fmt.ap(r.m.auroc), fmt.ap(r.m.topKF1), r.m.runtimeS.toFixed(1),
  ].map(esc).join(','));
  return [head.map(esc).join(','), ...lines].join('\n');
}

export const csvName = (view: ViewId, tier: TierId) => `reach-leaderboard-${view}${view === 'tier' ? `-${tier}` : ''}.csv`;

/* ---------- Pairwise statistics (Tables 6b and 7) ---------- */
const pairKey = (a: string, b: string) => [a.toLowerCase(), b.toLowerCase()].sort().join('|');
const PAIRS = new Map(PAIRWISE_COMPARISONS.map((p) => [pairKey(p.methodA, p.methodB), p]));
export const pairOf = (a: string, b: string) => PAIRS.get(pairKey(a, b));
/** BH-FDR as a number, when Table 6b prints one ("0.831 (NS)" gives 0.831). */
export const fdrOf = (p: PairwiseComparison | undefined) => {
  const v = p ? Number.parseFloat(p.pAdjusted) : Number.NaN;
  return Number.isFinite(v) && !/×/.test(p?.pAdjusted ?? '') ? v : null;
};
const cliffIdx = (n: string) => CLIFF_DELTA_METHODS.findIndex((x) => x.toLowerCase() === n.toLowerCase());
/** Cliff's δ, row method versus column method (Table 7): positive means `a` scores higher. */
export const cliffOf = (a: string, b: string) => {
  const i = cliffIdx(a);
  const j = cliffIdx(b);
  return i < 0 || j < 0 ? null : CLIFF_DELTA_MATRIX[i][j];
};
export const magnitude = (d: number) => {
  const a = Math.abs(d);
  return a < 0.147 ? 'negligible' : a < 0.33 ? 'small' : a < 0.474 ? 'medium' : 'large';
};

/*
 * Interval charts arrive once, on first view (audit S-17): mean dots fade in 30 ms apart, then each whisker grows out
 * of its own mean dot (scaleX 0.4 to 1, origin at the dot), then the dashed reference marks fade in. Markup contract:
 *   [data-ci] data-ox data-oy  a <g> holding the interval band and whiskers; (ox, oy) is the mean dot in SVG units
 *   [data-ci-dot]               the mean dot
 *   [data-ci-ref]               a <g> of dashed reference marks (no opacity attribute on the group itself)
 * `useDrawIn(ref, { ...INTERVAL_DRAW_IN, once })`. Values (AP text) never animate.
 */
export const INTERVAL_DRAW_IN: DrawInOptions = {
  selector: '[data-ci-dot]', from: { opacity: 0 }, duration: 0.24, stagger: 0.03,
  then: [
    { selector: '[data-ci]', from: { opacity: 0, scaleX: 0.4, svgOrigin: (_i: number, el: SVGGElement) => `${el.dataset.ox ?? 0} ${el.dataset.oy ?? 0}` }, at: 0.06, duration: 0.42, stagger: 0.03 },
    { selector: '[data-ci-ref]', from: { opacity: 0 }, at: 0.3, duration: 0.3, stagger: 0 },
  ],
};

/** Figure 4b rank axis: domain 0.5 to K + 0.5 (K methods) so the end markers are not cut; `left: rankPct(rank)`. */
export const RANK_K = GLOBAL_STATS.methodsIncluded;
export const rankPct = (rank: number) => `${(((rank - 0.5) / RANK_K) * 100).toFixed(2)}%`;

/** Heatmap colour ramp: `ink` mixed into the surface at `share` (clamped to 1) of `max` percent. */
export const tint = (ink: string, share: number, max = 62) => `color-mix(in srgb, ${ink} ${Math.round(Math.min(1, share) * max)}%, var(--surface))`;
