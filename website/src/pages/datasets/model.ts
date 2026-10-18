import { DATASETS_DATA, DATASET_METHOD_MATRIX, LEADERBOARD_DATA, type DatasetInfo } from '../../data/benchmarkData';

/* ---------- Derived, reconciled numbers (every total is summed from DATASETS_DATA) ---------- */
export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
export const CNV_COHORTS = DATASETS_DATA.filter((d) => d.cnvCells !== undefined && d.cnvPos !== undefined);
export const NO_CNV = DATASETS_DATA.filter((d) => d.cnvCells === undefined).map((d) => d.id);
export const TOTALS = {
  cells: sum(DATASETS_DATA.map((d) => d.cellsNum)),
  cnvCells: sum(CNV_COHORTS.map((d) => d.cnvCells ?? 0)),
  cnvPos: sum(CNV_COHORTS.map((d) => d.cnvPos ?? 0)),
  cnvNeg: sum(CNV_COHORTS.map((d) => d.cnvNeg ?? 0)),
  trackAUnits: sum(DATASETS_DATA.map((d) => d.trackAUnits)),
};
/** Cohorts whose CNV validation set is larger than the cohort itself would not reconcile; footnoted, never hidden. */
export const CNV_OVERFLOW = CNV_COHORTS.filter((d) => (d.cnvCells ?? 0) > d.cellsNum).map((d) => d.id);
/** Cell counts the paper prints as approximate (Table 2a). */
export const APPROX_CELLS = DATASETS_DATA.filter((d) => d.cells.startsWith('~')).map((d) => d.id);
/** Accessions whose second identifier differs from the repository docs (PAPER-AUDIT (e)). */
export const ACCESSION_PENDING = ['pdac_peng', 'mm_ledergor'];

export const pct = (n: number, d: number) => `${((n / d) * 100).toFixed(1)}%`;
export const f3 = (v?: number) => (v === undefined ? 'n/a' : v.toFixed(3));
export const tissueLabel = (d: DatasetInfo) => (d.tissueCategory === 'Solid Tumor' ? 'Solid tumour' : 'Blood / CTC');

/* ---------- Cell counts on a log scale (357 to 123,488 spans three orders of magnitude) ---------- */
export const LOG_DOMAIN: [number, number] = [100, 200_000];
export const LOG_TICKS = [1_000, 10_000, 100_000];
export const logPos = (v: number) => {
  const [lo, hi] = LOG_DOMAIN.map(Math.log10);
  return Math.max(0, Math.min(1, (Math.log10(Math.max(v, 1)) - lo) / (hi - lo)));
};
export const tickLabel = (v: number) => (v >= 1000 ? `${v / 1000}k` : String(v));

/* ---------- Footnote markers (shared between the table, the grid and the notes list) ---------- */
export const NOTE = { approx: 'a', cnv: 'b', accession: 'c', meta: 'd' } as const;
/* ---------- Accessions ---------- */
export const accessionUrl = (acc: string): string | undefined => {
  if (acc.startsWith('GSE')) return `https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=${acc}`;
  if (acc.startsWith('CRA')) return `https://ngdc.cncb.ac.cn/gsa/browse/${acc}`;
  return undefined;
};
export const accessions = (d: DatasetInfo) => d.accession.split('/').map((a) => a.trim()).filter(Boolean);

/* ---------- Methods: one resolver for ids ('cellsius') and display names ('CellSIUS') ---------- */
const BY_KEY = new Map(LEADERBOARD_DATA.flatMap((m) => [[m.id.toLowerCase(), m], [m.method.toLowerCase(), m]] as const));
export const methodInfo = (key: string) => BY_KEY.get(key.toLowerCase());
export const methodLabel = (key: string) => methodInfo(key)?.method ?? key;
export const isRanked = (key: string) => (methodInfo(key)?.publishedRankNum ?? null) !== null;
/** The six ranked published detectors in leaderboard order (Table 4). */
export const RANKED = LEADERBOARD_DATA.filter((m) => m.publishedRankNum !== null)
  .sort((a, b) => (a.publishedRankNum ?? 0) - (b.publishedRankNum ?? 0));

/**
 * Site-wide method order (rule 1): the supervised ceiling first, then ranks 1 to 6, then the references
 * (CaSee, expr_threshold, random_baseline). Lower sorts first.
 */
const REFERENCE_ORDER = ['casee', 'expr_threshold', 'random_baseline'];
export function methodOrder(key: string): number {
  const m = methodInfo(key);
  if (!m) return 99;
  if (m.paperRole === 'Supervised ceiling') return 0;
  if (m.publishedRankNum !== null) return m.publishedRankNum;
  const ref = REFERENCE_ORDER.indexOf(m.id.toLowerCase());
  return ref === -1 ? 50 : 10 + ref;
}

export type CellStatus = 'ok' | 'fallback' | 'degenerate' | 'no-track-a';
/** Track A mean AP of one method on one cohort; null with a reason when there is no value. */
export function cohortAP(d: DatasetInfo, methodId: string): { ap: number | null; status: CellStatus } {
  if (d.trackAUnits === 0) return { ap: null, status: 'no-track-a' };
  const c = DATASET_METHOD_MATRIX.find((x) => x.dataset === d.id && x.method.toLowerCase() === methodId.toLowerCase());
  if (!c) return { ap: null, status: 'fallback' };
  return { ap: c.meanAP, status: c.status };
}

/**
 * Best ranked published detector on a cohort. Track A cohorts: highest Track A mean AP among the six ranked
 * detectors (per-dataset summary, 20 units). Track D cohorts: the repository best, which is a ranked detector.
 */
export function bestRanked(d: DatasetInfo): { method: string; ap: number; source: 'A' | 'D' } | null {
  if (d.trackAUnits === 0) return isRanked(d.bestOverallMethod) ? { method: methodLabel(d.bestOverallMethod), ap: d.bestOverallAP, source: 'D' } : null;
  let best: { method: string; ap: number; source: 'A' } | null = null;
  for (const m of RANKED) {
    const { ap } = cohortAP(d, m.id);
    if (ap !== null && (best === null || ap > best.ap)) best = { method: m.method, ap, source: 'A' };
  }
  return best;
}
