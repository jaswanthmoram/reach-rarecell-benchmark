import { GLOBAL_STATS, LEADERBOARD_DATA, type MethodResult } from '../../data/benchmarkData';
import { fmt } from '../../ui';

export type ViewId = 'overall' | 'tier' | 'trackC' | 'trackF' | 'runtime' | 'rank';
export type Tier = 't1' | 't2' | 't3' | 't4';
export type SortKey = 'rank' | 'view' | 'medianAP' | 'meanAP' | 'auroc' | 'topKF1' | 'runtimeS';
export type SortDir = 'asc' | 'desc';
export interface SortState { key: SortKey; dir: SortDir }
export type Group = 'ranked' | 'reference';

/**
 * Proof Table 4: only the six published detectors carry a leaderboard rank (1–6, by Track A median AP).
 * The supervised ceiling, the exploratory comparator and the two baselines are unranked reference rows.
 */
export const isReference = (m: MethodResult) => m.publishedRankNum === null;
export const groupOf = (m: MethodResult): Group => (isReference(m) ? 'reference' : 'ranked');
export const isCeiling = (m: MethodResult) => m.category === 'Supervised Ceiling';

const ROLE_LABEL: Record<NonNullable<MethodResult['paperRole']>, string> = {
  'Supervised ceiling': 'Supervised ceiling',
  Exploratory: 'Exploratory comparator',
  'Naive baseline': 'Naive baseline',
  'Floor baseline': 'Floor baseline',
  Published: 'Published',
  'Published/proxy': 'Published · proxy',
};
export const roleLabel = (m: MethodResult) => (m.paperRole ? ROLE_LABEL[m.paperRole] : m.category);

/** `label` is the visible chip text; `noun` completes it for screen readers ("Ranked detectors"). */
export const GROUPS: { value: Group; label: string; noun: string; count: number }[] = [
  { value: 'ranked', label: 'Ranked', noun: 'detectors', count: LEADERBOARD_DATA.filter((m) => !isReference(m)).length },
  { value: 'reference', label: 'Unranked', noun: 'rows', count: LEADERBOARD_DATA.filter(isReference).length },
];

/** Prevalence tiers as defined in the paper (Figure 2, §3.6). */
export const TIERS: { value: Tier; label: string; prevalence: string }[] = [
  { value: 't1', label: 'T1 · 5–10%', prevalence: '5–10%' },
  { value: 't2', label: 'T2 · 1–5%', prevalence: '1–5%' },
  { value: 't3', label: 'T3 · 0.1–1%', prevalence: '0.1–1%' },
  { value: 't4', label: 'T4 · 0.01–0.1%', prevalence: '0.01–0.1%' },
];
const TIER_KEY: Record<Tier, keyof MethodResult> = { t1: 't1MedianAP', t2: 't2MedianAP', t3: 't3MedianAP', t4: 't4MedianAP' };
const unitsPerTier = GLOBAL_STATS.trackAUnits / TIERS.length;

interface ViewDef {
  label: string;
  column: (tier: Tier) => string;
  better: 'higher' | 'lower';
  get: (m: MethodResult, tier: Tier) => number;
  format: (v: number) => string;
  /** Mono line under the tabs: metric · population · n. */
  note: (tier: Tier) => string;
  /** Plain-language ordering key, used in the caption. */
  order: (tier: Tier) => string;
}

export const VIEWS: Record<ViewId, ViewDef> = {
  overall: {
    label: 'Track A AP',
    column: () => 'Median AP',
    better: 'higher',
    get: (m) => m.medianAP,
    format: fmt.ap,
    note: () => `Track A median AP · P_HC vs B_HC · fallback-filtered units (${GLOBAL_STATS.trackAUnits}; 140 for scCAD, DeepScena)`,
    order: () => 'Track A median AP, highest first',
  },
  tier: {
    label: 'By prevalence tier',
    column: (t) => `${t.toUpperCase()} median AP`,
    better: 'higher',
    get: (m, t) => m[TIER_KEY[t]] as number,
    format: fmt.ap,
    note: (t) => `Median AP at ${t.toUpperCase()} · ${TIERS.find((x) => x.value === t)!.prevalence} prevalence · n = ${unitsPerTier} units per tier`,
    order: (t) => `${t.toUpperCase()} median AP, highest first`,
  },
  trackC: {
    label: 'Track C null FP',
    column: () => 'Null FP rate',
    better: 'lower',
    get: (m) => m.nullFPRate,
    format: fmt.ap,
    note: () => `False-positive rate on background-only null units · lower is better · N = ${GLOBAL_STATS.trackCFriedmanN} units`,
    order: () => 'Track C null false-positive rate, lowest first',
  },
  trackF: {
    label: 'Track F 0.1%',
    column: () => 'Track F 0.1% AP',
    better: 'higher',
    get: (m) => m.trackF01AP,
    format: fmt.ap,
    note: () => `Median AP at 0.1% prevalence (Table 5) · malignant vs normal epithelial, crc_lee only · ${GLOBAL_STATS.trackFUnits} diagnostic units`,
    order: () => 'Track F median AP at 0.1% prevalence, highest first',
  },
  runtime: {
    label: 'Runtime',
    column: () => 'Runtime',
    better: 'lower',
    get: (m) => m.runtimeS,
    format: fmt.secs,
    note: () => 'Mean wall-clock time per Track A unit · lower is better · DeepScena ran on a Colab T4 GPU',
    order: () => 'mean runtime per unit, fastest first',
  },
  rank: {
    label: 'Rank uncertainty',
    column: () => 'Within-unit rank',
    better: 'lower',
    get: (m) => m.rankMean,
    format: (v) => v.toFixed(2),
    note: () => `Within-unit rank, all ${GLOBAL_STATS.methodsIncluded} methods (Figure 4b) · ${GLOBAL_STATS.friedmanN} common units · 95% bootstrap interval`,
    order: () => 'mean within-unit rank, lowest first',
  },
};

export const VIEW_OPTIONS = (Object.keys(VIEWS) as ViewId[]).map((v) => ({ value: v, label: VIEWS[v].label }));

const NULL_RANK = 99;
function sortValue(m: MethodResult, key: SortKey, view: ViewId, tier: Tier): number {
  if (key === 'rank') return m.publishedRankNum ?? NULL_RANK;
  if (key === 'view') return VIEWS[view].get(m, tier);
  return m[key];
}

/** First click picks the "good first" direction; second flips; third returns to the default order. */
export function nextSort(current: SortState | null, key: SortKey, view: ViewId): SortState | null {
  const lowerFirst = key === 'rank' || key === 'runtimeS' || (key === 'view' && VIEWS[view].better === 'lower');
  const first: SortDir = lowerFirst ? 'asc' : 'desc';
  if (!current || current.key !== key) return { key, dir: first };
  if (current.dir === first) return { key, dir: first === 'asc' ? 'desc' : 'asc' };
  return null;
}

/** Default order: the view metric in its "better" direction. For Overall this is exactly the median-AP order. */
export const defaultSort = (view: ViewId): SortState => ({ key: 'view', dir: VIEWS[view].better === 'higher' ? 'desc' : 'asc' });

export interface Selection { view: ViewId; tier: Tier; sort: SortState | null; groups: Set<Group>; query: string }

/** Row groups in display order (DESIGN v2.2): ceiling pinned above, the contiguous ranked block 1–6, then the references. */
export type Band = 'ceiling' | 'ranked' | 'reference';
export const bandOf = (m: MethodResult): Band => (isCeiling(m) ? 'ceiling' : isReference(m) ? 'reference' : 'ranked');
export const BANDS: { value: Band; label: string; note: string }[] = [
  { value: 'ceiling', label: 'Supervised ceiling', note: 'Not ranked · trained on labels' },
  { value: 'ranked', label: 'Ranked detectors', note: 'Leaderboard ranks 1 to 6' },
  { value: 'reference', label: 'Comparator and baselines', note: 'Not ranked' },
];
const BAND_ORDER: Record<Band, number> = { ceiling: 0, ranked: 1, reference: 2 };

/** Filters, then sorts inside each band. Bands never interleave, whatever the sort. */
export function selectRows({ view, tier, sort, groups, query }: Selection): MethodResult[] {
  const q = query.trim().toLowerCase();
  const s = sort ?? defaultSort(view);
  return LEADERBOARD_DATA
    .filter((m) => groups.has(groupOf(m)))
    .filter((m) => !q || [m.method, m.paradigm, m.mechanism, roleLabel(m)].some((t) => t.toLowerCase().includes(q)))
    .map((m) => ({ m, v: sortValue(m, s.key, view, tier) }))
    .sort((a, b) => BAND_ORDER[bandOf(a.m)] - BAND_ORDER[bandOf(b.m)]
      || (a.v === b.v ? b.m.medianAP - a.m.medianAP : s.dir === 'asc' ? a.v - b.v : b.v - a.v))
    .map((x) => x.m);
}

/** Site rule 1: ceiling first, ranks 1 to 6 contiguous, then references by median AP. Used by every method axis on the page. */
export const byBoardOrder = (a: MethodResult, b: MethodResult) =>
  BAND_ORDER[bandOf(a)] - BAND_ORDER[bandOf(b)]
  || (a.publishedRankNum ?? 0) - (b.publishedRankNum ?? 0)
  || b.medianAP - a.medianAP;
export const BOARD_ORDER: MethodResult[] = [...LEADERBOARD_DATA].sort(byBoardOrder);

/** Splits already-ordered rows into their bands, dropping empty ones. */
export const bandsOf = (rows: MethodResult[]) =>
  BANDS.map((b) => ({ ...b, rows: rows.filter((m) => bandOf(m) === b.value) })).filter((b) => b.rows.length > 0);

/** The three reference rows, drawn as thin vertical marks on the shared axis of every row. */
export const REFERENCE_MARKS = LEADERBOARD_DATA.filter((m) => bandOf(m) === 'reference');

export const isDefaultState = (s: Selection) =>
  s.view === 'overall' && s.tier === 't1' && s.sort === null && s.groups.size === GROUPS.length && s.query === '';

/** Compact scientific notation for printed p-values: '1.66 × 10⁻²³' becomes '1.66×10⁻²³'. */
export const compactP = (p: string) => p.replace(' (NS)', '').replace(/\s*×\s*/g, '×');

export const signed = (v: number, d = 3) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(d)}`;

/** 95% bootstrap interval of Track A AP (2,000 resamples, Figure 4a). Falls back to the point if bounds are missing. */
export const bootCI = (m: MethodResult): [number, number] => [m.bootAPLow ?? m.bootstrapMeanAP, m.bootAPHigh ?? m.bootstrapMeanAP];

/**
 * Shared AP axis for the hero forest plot and the table's interval column. Every detector and reference sits
 * below 0.6, so 0 to 1 would waste most of the column; the ceiling (0.999) is drawn clipped at the right edge.
 */
export const AP_DOMAIN: [number, number] = [0, 0.6];
export const AP_TICKS = [0, 0.2, 0.4, 0.6];
/** Position on the shared axis, 0 to 1, clamped. */
export const apPos = (v: number) => Math.max(0, Math.min(1, (v - AP_DOMAIN[0]) / (AP_DOMAIN[1] - AP_DOMAIN[0])));
export const offScale = (v: number) => v > AP_DOMAIN[1];

/** Sequential single-hue ramp on the accent; capped so ink text keeps ≥ 4.5:1 in both themes. */
export const accentMix = (t: number) => `color-mix(in oklab, var(--accent) ${Math.round(Math.max(0, Math.min(1, t)) * 60)}%, var(--surface))`;
/** Gray pole for the diverging scale. */
export const grayMix = (t: number) => `color-mix(in oklab, var(--ink-3) ${Math.round(Math.max(0, Math.min(1, t)) * 70)}%, var(--surface))`;
