import { LEADERBOARD_DATA } from '../../data/benchmarkData';

/**
 * Dot miniatures of the six published figures, drawn by the contact-sheet hero. Everything is in tile unit space
 * (0..1, y down). Dots carry a tone; segments are the few axis, diagonal and divider lines each figure needs.
 * Figures 4 and 6 use the real AP and runtime values; the others are faithful sketches of each figure's layout.
 */
export type Tone = 'cell' | 'signal' | 'accent';
export type MiniDot = { x: number; y: number; r: number; tone: Tone };
export type MiniSeg = { x1: number; y1: number; x2: number; y2: number; dash?: boolean; tone?: Tone };
export type Mini = { dots: MiniDot[]; segs: MiniSeg[] };

export const mulberry = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r());

/** Site order: ceiling, ranked 1 to 6 by median AP, then references. */
const ORDER = ['hvg_logreg', 'FiRE', 'cellsius', 'scMalignantFinder', 'RareQ', 'scCAD', 'DeepScena', 'CaSee', 'expr_threshold', 'random_baseline'];
const METHODS = ORDER.map((id) => LEADERBOARD_DATA.find((m) => m.id === id)).filter((m) => m !== undefined);
const REFERENCES = new Set(['hvg_logreg', 'CaSee', 'expr_threshold', 'random_baseline']);

/** Figure 1: five pipeline stages as dot blocks, thinning left to right; the last stage holds the found cells. */
function pipeline(r: () => number): Mini {
  const dots: MiniDot[] = [];
  const segs: MiniSeg[] = [];
  for (let s = 0; s < 5; s++) {
    const x0 = 0.1 + s * 0.17, cols = 3, rows = 7 - s;
    for (let c = 0; c < cols; c++) for (let k = 0; k < rows; k++)
      dots.push({ x: x0 + c * 0.035, y: 0.5 + (k - (rows - 1) / 2) * 0.075, r: 1, tone: 'cell' });
    if (s < 4) segs.push({ x1: x0 + 0.1, y1: 0.5, x2: x0 + 0.15, y2: 0.5 });
  }
  dots.push({ x: 0.1 + 4 * 0.17 + 0.035, y: 0.5 + gauss(r) * 0.02, r: 2, tone: 'signal' });
  return { dots, segs };
}

/** Figure 2: tracks A to E as streams, Track F set apart below a dashed divider. */
function tracks(r: () => number): Mini {
  const dots: MiniDot[] = [];
  for (let l = 0; l < 6; l++) {
    const y = l < 5 ? 0.16 + l * 0.12 : 0.86;
    for (let i = 0; i < 16; i++) dots.push({ x: 0.1 + r() * 0.8, y: y + gauss(r) * 0.012, r: 0.9, tone: 'cell' });
    if (l !== 2) dots.push({ x: 0.2 + r() * 0.6, y, r: 1.8, tone: 'signal' });
  }
  return { dots, segs: [{ x1: 0.08, y1: 0.75, x2: 0.92, y2: 0.75, dash: true, tone: 'accent' }] };
}

/** Figure 3c: the multimetric summary as a dot heatmap, ten method rows by seven min-max scaled metrics (real values). */
function heatmap(): Mini {
  const cols: ((m: (typeof METHODS)[number]) => number)[] = [
    (m) => m.medianAP, (m) => m.meanAP, (m) => m.meanNAP ?? m.meanAP, (m) => m.auroc, (m) => m.topKF1,
    (m) => 1 - m.nullFPRate, (m) => -Math.log10(m.runtimeS),
  ];
  const scaled = cols.map((get) => {
    const v = METHODS.map(get), lo = Math.min(...v), hi = Math.max(...v);
    return v.map((x) => (x - lo) / (hi - lo || 1));
  });
  const dots: MiniDot[] = [];
  METHODS.forEach((_, row) => scaled.forEach((col, c) => {
    dots.push({ x: 0.14 + c * 0.12, y: 0.08 + row * 0.093, r: 0.35 + col[row] * 2.1, tone: row === 1 && c === 0 ? 'accent' : 'cell' });
  }));
  return { dots, segs: [{ x1: 0.08, y1: 0.125, x2: 0.92, y2: 0.125, dash: true, tone: 'accent' }] };
}

const apX = (ap: number) => 0.1 + ap * 0.8;

/** Figure 4a: bootstrap AP intervals, one row per method in site order, the ceiling as a dashed line on top. */
function forest(): Mini {
  const dots: MiniDot[] = [];
  const segs: MiniSeg[] = [{ x1: 0.1, y1: 0.92, x2: 0.9, y2: 0.92 }];
  METHODS.forEach((m, row) => {
    const y = 0.1 + row * 0.085;
    const lo = m.bootAPLow ?? m.bootstrapMeanAP, hi = m.bootAPHigh ?? m.bootstrapMeanAP;
    if (m.id === 'hvg_logreg') { segs.push({ x1: apX(m.bootstrapMeanAP), y1: 0.04, x2: apX(m.bootstrapMeanAP), y2: 0.88, dash: true, tone: 'accent' }); return; }
    for (let i = 0; i <= 6; i++) dots.push({ x: apX(lo + ((hi - lo) * i) / 6), y, r: 0.7, tone: 'cell' });
    dots.push({ x: apX(m.bootstrapMeanAP), y, r: REFERENCES.has(m.id) ? 1.4 : 2, tone: m.id === 'FiRE' ? 'accent' : 'cell' });
  });
  return { dots, segs };
}

/** Figure 5a: Track A against Track B per method, around the line of equal performance. */
function scatter(r: () => number): Mini {
  const dots: MiniDot[] = [];
  for (let i = 0; i < 40; i++) {
    const a = r();
    dots.push({ x: 0.12 + a * 0.76, y: 0.88 - Math.min(1, Math.max(0, a * 0.55 + 0.2 + gauss(r) * 0.16)) * 0.76, r: 0.9 + r() * 0.6, tone: 'cell' });
  }
  dots.push({ x: 0.8, y: 0.22, r: 2, tone: 'signal' });
  return { dots, segs: [{ x1: 0.12, y1: 0.88, x2: 0.88, y2: 0.12, dash: true, tone: 'accent' }, { x1: 0.1, y1: 0.9, x2: 0.9, y2: 0.9 }, { x1: 0.1, y1: 0.1, x2: 0.1, y2: 0.9 }] };
}

/** Figure 6: runtime (log) against median AP; each method a disc of dots sized by its unreliability. */
function pareto(r: () => number): Mini {
  const dots: MiniDot[] = [];
  const logs = METHODS.map((m) => Math.log10(m.runtimeS));
  const lo = Math.min(...logs), hi = Math.max(...logs);
  METHODS.forEach((m, i) => {
    const cx = 0.14 + ((logs[i] - lo) / (hi - lo || 1)) * 0.72;
    const cy = 0.86 - m.medianAP * 0.7;
    const rad = 0.025 + Math.min(0.06, (m.degeneratePct + m.fallbackPct) / 400);
    const n = 6 + Math.round(rad * 220);
    for (let k = 0; k < n; k++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * rad; dots.push({ x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d * 1.3, r: 0.8, tone: m.id === 'FiRE' ? 'accent' : 'cell' }); }
  });
  return { dots, segs: [{ x1: 0.1, y1: 0.92, x2: 0.9, y2: 0.92 }, { x1: 0.1, y1: 0.08, x2: 0.1, y2: 0.92 }] };
}

/** One miniature per published figure, in article order. */
export const MINIS: Mini[] = [pipeline, tracks, heatmap, forest, scatter, pareto].map((f, i) => f(mulberry(31 + i)));
