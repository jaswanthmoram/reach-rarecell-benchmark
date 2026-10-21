/* Specimen plate geometry: one dot per N cells, CNV-set positive share drawn as signal dots. Seeded, so stable. */
import { COHORTS, type Cohort } from './model';

interface Dot { x: string; y: string }
/** One well, pre-drawn as CSS masks (`url(...)` values): the cells and the signal dots. */
export interface Well { dotsMask: string; sigsMask: string | null; nSig: number; rx: string; ry: string }

/* The dots are rasterised once as an SVG mask image on a coloured layer, so they cost no DOM and no per-frame style
 * work while the layer above them spins or drifts. Zero-length round-capped segments draw the dots; a non-scaling
 * stroke keeps each one at its pixel size however the box stretches the 100 x 100 viewBox. */
const dotPath = (pts: readonly Dot[]) => pts.map((d) => `M${d.x} ${d.y}h0`).join('');
const strokePath = (d: string, width: number | string, opacity: number | string = 1) =>
  `<path d='${d}' fill='none' stroke='#000' stroke-linecap='round' stroke-width='${width}' stroke-opacity='${opacity}' vector-effect='non-scaling-stroke'/>`;
const maskUrl = (inner: string, stretch = false) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'${stretch ? " preserveAspectRatio='none'" : ''}>${inner}</svg>`)}")`;
/** Plate dot diameters in px (cell, signal). */
const DOT_PX = 1.6;
const SIG_PX = 3;

const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

function well(c: Cohort, i: number, perDot: number): Well {
  const r = rng(97 + i * 31);
  const n = Math.max(1, Math.round(c.n / perDot));
  const nSig = c.cc && c.pos != null ? Math.max(1, Math.round((n * c.pos) / c.cc)) : 0;
  const pts: Dot[] = [];
  for (let k = 0; k < n; k++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.42;
    pts.push({ x: (50 + Math.cos(a) * d * 100).toFixed(1), y: (50 + Math.sin(a) * d * 100).toFixed(1) });
    r(); // keeps the seeded sequence (and so every dot position) identical to the per-dot version
  }
  return {
    dotsMask: maskUrl(strokePath(dotPath(pts.slice(nSig)), DOT_PX)),
    sigsMask: nSig ? maskUrl(strokePath(dotPath(pts.slice(0, nSig)), SIG_PX)) : null,
    nSig, rx: nSig ? pts[0].x : '50', ry: nSig ? pts[0].y : '50',
  };
}

/** Desktop plate: 1 dot ≈ 250 cells. Phone plate (52 px wells): 1 dot ≈ 500 cells. */
export const PER_DOT = { wide: 250, narrow: 500 } as const;
export const PLATE_WIDE = COHORTS.map((c, i) => well(c, i, PER_DOT.wide));
export const PLATE_NARROW = COHORTS.map((c, i) => well(c, i, PER_DOT.narrow));

/** Order in which the cobalt "found" ring visits the wells that have a CNV set. */
export const SIGNAL_ORDER = COHORTS.map((c, i) => (c.cc ? i : -1)).filter((i) => i >= 0);

const fr = rng(11);
const FAR_DOTS = Array.from({ length: 90 }, () => {
  const dot = { x: (fr() * 100).toFixed(1), y: (fr() * 100).toFixed(1), r: 1 + fr() * 1.6, o: 0.25 + fr() * 0.35 };
  fr(); fr(); // the old per-dot duration and delay: drawn so every position stays where it was
  return dot;
});

export interface FarLayer { dur: number; delay: number; mask: string }
/** Far-field dots behind the hero, in three drifting layers (one transform each); every dot keeps its size and alpha. */
export const FAR_LAYERS: FarLayer[] = [18, 24, 30].map((dur, li) => ({
  dur,
  delay: li * 7,
  mask: maskUrl(FAR_DOTS.filter((_, i) => i % 3 === li).map((f) => strokePath(`M${f.x} ${f.y}h0`, f.r.toFixed(1), f.o.toFixed(2))).join(''), true),
}));
