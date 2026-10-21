/* Cohort model for the Datasets page, built from DATASETS_DATA and DATASET_METHOD_MATRIX (proof Tables 2a, 6a, 9b). */
import { DATASETS_DATA, DATASET_METHOD_MATRIX, GLOBAL_STATS, LEADERBOARD_DATA } from '../../data/benchmarkData';
import { fmt } from '../../lib/format';

export type Status = 'ok' | 'fallback' | 'degenerate';
export type Score = { ap: number | null; status: Status | 'no-track-a' };

export interface Cohort {
  id: string;
  ct: string;
  solid: boolean;
  platform: string;
  n: number;
  /** The paper prints "~47,000" for bcc_yost; the exact count carries footnote a. */
  approx: boolean;
  acc: string;
  tracks: string;
  pos: number | null;
  cc: number | null;
  au: number | null;
  se: number | null;
  sp: number | null;
  mcc: number | null;
  units: number;
  genes: number;
  donors: string;
  purity: string;
  best: [string, number];
  unsup: [string, number];
  desc: string;
  /** Track A mean AP for each ranked detector, in leaderboard order. Null for Track D cohorts. */
  mx: Score[] | null;
}

interface MethodMeta { rank: number | null; role?: string; order: number }

/** The six ranked detectors in leaderboard order, read from LEADERBOARD_DATA (publishedRankNum 1 to 6). */
const RANKED_ROWS = LEADERBOARD_DATA.filter((m) => m.publishedRankNum != null).sort((a, b) => (a.publishedRankNum ?? 0) - (b.publishedRankNum ?? 0));
export const RANKED: readonly string[] = RANKED_ROWS.map((m) => m.method);

/** Unranked references and where they sit around the ranks: the ceiling first, the rest after rank 6. */
const REFERENCES: Record<string, { role: string; order: number }> = {
  hvg_logreg: { role: 'supervised ceiling', order: 0 },
  CaSee: { role: 'exploratory comparator', order: 10 },
  expr_threshold: { role: 'naive baseline', order: 11 },
  random_baseline: { role: 'floor baseline', order: 12 },
};

/** Leaderboard order: supervised ceiling, ranks 1 to 6, then the unranked references. */
export const METHODS: Record<string, MethodMeta> = Object.fromEntries([
  ...Object.entries(REFERENCES).map(([k, v]): [string, MethodMeta] => [k, { rank: null, ...v }]),
  ...RANKED_ROWS.map((m): [string, MethodMeta] => [m.method, { rank: m.publishedRankNum, order: m.publishedRankNum ?? 0 }]),
]);

const APPROX_IDS = new Set(['bcc_yost']);
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
const canon = (m: string) => Object.keys(METHODS).find((k) => same(k, m)) ?? m;

function trackAScores(id: string): Score[] | null {
  const cells = DATASET_METHOD_MATRIX.filter((c) => c.dataset === id);
  if (cells.length === 0) return null;
  return RANKED.map((m) => {
    const cell = cells.find((c) => same(c.method, m));
    return cell ? { ap: cell.meanAP, status: cell.status } : { ap: null, status: 'fallback' };
  });
}

export const COHORTS: Cohort[] = DATASETS_DATA.map((d): Cohort => ({
  id: d.id,
  ct: d.cancerType,
  solid: d.tissueCategory === 'Solid Tumor',
  platform: d.platform,
  n: d.cellsNum,
  approx: APPROX_IDS.has(d.id),
  acc: d.accession,
  tracks: d.tracks.map((t) => t.replace('Track ', '')).join(''),
  pos: d.cnvPos ?? null,
  cc: d.cnvCells ?? null,
  au: d.cnvAUROC ?? null,
  se: d.cnvSensitivity ?? null,
  sp: d.cnvSpecificity ?? null,
  mcc: d.cnvMCC ?? null,
  units: d.trackAUnits,
  genes: d.genes,
  donors: d.donors.replace(/ & /g, ' and '),
  purity: d.purityTier,
  best: [canon(d.bestOverallMethod), d.bestOverallAP],
  unsup: [canon(d.bestUnsupMethod), d.bestUnsupAP],
  desc: d.description,
  mx: trackAScores(d.id),
})).sort((a, b) => b.n - a.n);

export const TOTAL_CELLS = COHORTS.reduce((s, c) => s + c.n, 0);
export const SOLID_N = COHORTS.filter((c) => c.solid).length;

/* ---------- formatters ---------- */
export const int = fmt.int;
export const f3 = fmt.ap;
export const compact = (n: number) => (n >= 10000 ? `${Math.round(n / 1000)}k` : int(n));
/** Position on the catalogue's log axis, 10^2 to 2 × 10^5 cells. */
export const logPos = (v: number) => {
  const lo = 2, hi = Math.log10(200000);
  return Math.max(0, Math.min(1, (Math.log10(Math.max(v, 1)) - lo) / (hi - lo)));
};
export const tissueLabel = (c: Cohort) => (c.solid ? 'Solid tumour' : 'Blood / CTC');
export const cnvPct = (c: Cohort) => (c.cc && c.pos != null ? fmt.pct(c.pos / c.cc) : 'No CNV set');
export const cnvFrac = (c: Cohort) => (c.cc && c.pos != null ? `${int(c.pos)} / ${int(c.cc)}` : 'see note b');
export const cnvShare = (c: Cohort) => (c.cc && c.pos != null ? c.pos / c.cc : -1);

export function accLinks(c: Cohort) {
  return c.acc.split('/').map((a) => a.trim()).filter(Boolean).map((acc) => ({
    acc,
    url: acc.startsWith('GSE') ? `https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=${acc}` : `https://ngdc.cncb.ac.cn/gsa/browse/${acc}`,
  }));
}

export const cohortAP = (c: Cohort, i: number): Score => (c.units && c.mx ? c.mx[i] : { ap: null, status: 'no-track-a' });

export function topRanked(c: Cohort): { method: string; ap: number; source: 'A' | 'D' } | null {
  if (!c.units) return METHODS[c.best[0]]?.rank ? { method: c.best[0], ap: c.best[1], source: 'D' } : null;
  let top: { method: string; ap: number; source: 'A' } | null = null;
  RANKED.forEach((m, i) => {
    const v = cohortAP(c, i);
    if (v.ap !== null && (top === null || v.ap > top.ap)) top = { method: m, ap: v.ap, source: 'A' };
  });
  return top;
}

export interface ResultLine { label: string; name: string; value: string; ranked: boolean; note: string; order: number; lead: boolean }

function resultLine(label: string, method: string, ap: number, lead: boolean): ResultLine {
  const m = METHODS[method] ?? { rank: null, role: 'reference', order: 99 };
  const ranked = m.rank !== null;
  return {
    label, name: method, value: ap.toFixed(3), ranked, order: m.order, lead,
    note: ranked ? `(ranked detector, leaderboard ${m.rank} of 6)` : `(reference, not ranked: ${m.role})`,
  };
}

/** Per-cohort result lines for the row details: highest-scoring ranked detector, plus any higher reference score. */
export function results(c: Cohort): ResultLine[] {
  const trackD = !c.units, ranked = topRanked(c);
  const topIsRanked = ranked !== null && c.best[0] === ranked.method;
  const unsupDiffers = c.unsup[0] !== c.best[0] && (ranked === null || c.unsup[0] !== ranked.method);
  const out: ResultLine[] = [];
  if (ranked) out.push(resultLine(trackD ? 'Highest-scoring ranked detector · Track D AP' : 'Highest-scoring ranked detector · mean AP', ranked.method, ranked.ap, true));
  if (!topIsRanked) out.push(resultLine('Top score in this cohort', c.best[0], c.best[1], false));
  if (unsupDiffers) out.push(resultLine('Top score without supervision', c.unsup[0], c.unsup[1], false));
  return out.sort((x, y) => x.order - y.order);
}

export const CNV_POOLED = {
  au: GLOBAL_STATS.cnvOverallAUROC,
  se: GLOBAL_STATS.cnvOverallSensitivity,
  sp: GLOBAL_STATS.cnvOverallSpecificity,
  mcc: GLOBAL_STATS.cnvOverallMCC,
  pos: GLOBAL_STATS.cnvPositiveCells,
  cells: GLOBAL_STATS.cnvValidatedCells,
  bg: GLOBAL_STATS.cnvBackgroundCells,
};

export const ARMS = [
  { title: 'Source annotation', tool: 'Author cell-type labels', body: 'Published annotations separate tumour cells from immune, stromal and normal compartments.', pos: 'Source positive', neg: 'Source negative' },
  { title: 'CNV burden', tool: 'infercnvpy v0.6.1 · GRCh38', body: `Copy-number inference on gene positions. Checked against author labels on ${int(CNV_POOLED.cells)} cells (AUROC ${f3(CNV_POOLED.au)}).`, pos: 'Aneuploid', neg: 'Diploid' },
  { title: 'Malignancy signature', tool: 'AUCell · τ = 0.15', body: 'Cancer-signature score per cell. Threshold tested at 0.10, 0.15 and 0.20.', pos: 'AUCell ≥ 0.15', neg: 'Low signature' },
  { title: 'Neighbourhood agreement', tool: 'kNN purity · k = 15 · τ = 0.50', body: 'Share of the 15 nearest PCA neighbours with the same provisional class. Tested at 0.40, 0.50 and 0.60.', pos: 'Purity ≥ 0.50', neg: 'Benign neighbourhood' },
];
