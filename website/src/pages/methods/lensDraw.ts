// Lens hero drawing (no React). The cell field is static: it is painted once per size, DPR and layout into an
// offscreen canvas and blitted each frame, so a frame only draws the three lenses. A coarse grid finds the cells
// under a lens without walking all 2200.
import type { Method } from './model';

export interface Cell { x: number; y: number; r: number; s: boolean; u: number; v: number; ph: number }
export interface Palette { hues: Map<string, string>; signal: string; bg: string }
export interface Field { cells: Cell[]; grid: number[][] }

const GRID = 20;
const GREY = '#8a909c';
const TAU = 6.283;

/* Seeded cell field: grey background cells with a few signal (malignant) cells. */
function makeCells(): Cell[] {
  let seed = 29;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());
  const centres = Array.from({ length: 7 }, () => ({ x: 0.1 + rnd() * 0.8, y: 0.12 + rnd() * 0.76, sx: 0.06 + rnd() * 0.07, sy: 0.07 + rnd() * 0.08 }));
  const clamp = (v: number) => Math.min(0.99, Math.max(0.01, v));
  return Array.from({ length: 2200 }, (_, i) => {
    const c = centres[i % 7], loose = i % 5 === 0;
    return { x: clamp(loose ? rnd() : c.x + gauss() * c.sx), y: clamp(loose ? rnd() : c.y + gauss() * c.sy), r: 0.8 + rnd() * 0.9, s: rnd() < 0.03, u: rnd(), v: rnd(), ph: rnd() * 6.28 };
  });
}

const cellOf = (v: number) => Math.min(GRID - 1, Math.max(0, Math.floor(v * GRID)));
let FIELD: Field | null = null;
/** Built once per page load, on first use (after first paint), not at import. */
export function getField(): Field {
  if (FIELD) return FIELD;
  const cells = makeCells();
  const grid: number[][] = Array.from({ length: GRID * GRID }, () => []);
  cells.forEach((c, i) => grid[cellOf(c.y) * GRID + cellOf(c.x)].push(i));
  FIELD = { cells, grid };
  return FIELD;
}

const smooth = (a: number, b: number, v: number) => { const k = Math.max(0, Math.min(1, (v - a) / (b - a))); return k * k * (3 - 2 * k); };

/** The static field, at device resolution, into its own canvas. Behind the copy (wide layout) it fades out so the headline keeps its contrast. */
export function paintField(out: HTMLCanvasElement, field: Field, w: number, h: number, dpr: number, wide: boolean, signal: string) {
  out.width = Math.round(w * dpr); out.height = Math.round(h * dpr);
  const g = out.getContext('2d');
  if (!g) return;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  for (const c of field.cells) {
    const behind = wide ? 0.18 + 0.82 * smooth(0.3, 0.56, c.x) : 1;
    g.globalAlpha = (c.s ? 0.75 : 0.32 + 0.2 * (c.ph % 1)) * behind; g.fillStyle = c.s ? signal : GREY;
    g.beginPath(); g.arc(c.x * w, c.y * h, c.s ? c.r + 0.6 : c.r, 0, TAU); g.fill();
  }
}

/** Recall and false-lit rate so that precision among lit cells equals the method's median AP (illustration). */
const rates = (ap: number) => { const a = Math.max(0.03, Math.min(1, ap)), R = Math.min(1, 2 * a); return { R, F: (0.03 * R * (1 - a)) / (a * 0.97) }; };

const dot = (path: Path2D, x: number, y: number, r: number) => { path.moveTo(x + r, y); path.arc(x, y, r, 0, TAU); };

/** The cells under a lens, batched into one path per look (dim grey, dim signal, lit hue, lit signal, rings). */
function lensCells(ctx: CanvasRenderingContext2D, field: Field, m: Method, hue: string, p: Palette, lens: { cx: number; cy: number; R: number; w: number; h: number; alpha: number }) {
  const { cx, cy, R, w, h, alpha } = lens, r = rates(m.d.medianAP);
  const dimGrey = new Path2D(), dimSignal = new Path2D(), litHue = new Path2D(), litSignal = new Path2D(), rings = new Path2D();
  const c0 = cellOf((cx - R) / w), c1 = cellOf((cx + R) / w), r0 = cellOf((cy - R) / h), r1 = cellOf((cy + R) / h);
  for (let gy = r0; gy <= r1; gy++) for (let gx = c0; gx <= c1; gx++) for (const i of field.grid[gy * GRID + gx]) {
    const c = field.cells[i], x = c.x * w, y = c.y * h;
    if ((x - cx) ** 2 + (y - cy) ** 2 > R * R) continue;
    const lit = c.s ? c.u < r.R : c.v < r.F;
    if (!lit) { dot(c.s ? dimSignal : dimGrey, x, y, c.r); continue; }
    dot(c.s ? litSignal : litHue, x, y, c.r + 1.2);
    if (c.s) dot(rings, x, y, c.r + 3.6);
  }
  ctx.globalAlpha = 0.28 * alpha;
  ctx.fillStyle = GREY; ctx.fill(dimGrey);
  ctx.fillStyle = p.signal; ctx.fill(dimSignal);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = hue; ctx.fill(litHue);
  ctx.fillStyle = p.signal; ctx.fill(litSignal);
  ctx.strokeStyle = hue; ctx.lineWidth = 1.2; ctx.stroke(rings);
}

/** A painted area in CSS px, cleared before the next frame. */
export type Rect = [x: number, y: number, w: number, h: number];
export interface LensSpec { m: Method; cx: number; cy: number; R: number; w: number; h: number; fh: number; alpha: number; xMax: number }

/** One lens: the cells under it lit by the method, its ring, and its label. Returns what it painted. */
export function drawLens(ctx: CanvasRenderingContext2D, field: Field, p: Palette, l: LensSpec): Rect[] {
  const { m, cx, cy, R, alpha } = l, hue = p.hues.get(m.key) ?? '#4a5160';
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
  ctx.globalAlpha = 0.72 * alpha; ctx.fillStyle = p.bg; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
  lensCells(ctx, field, m, hue, p, l);
  ctx.restore();
  ctx.globalAlpha = alpha; ctx.strokeStyle = hue; ctx.lineWidth = 1.5; ctx.setLineDash(m.ref ? [5, 4] : []);
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
  const text = `${m.name}  ${m.d.medianAP.toFixed(3)}`;
  ctx.font = '500 11px "Geist Mono", ui-monospace, monospace';
  const tw = ctx.measureText(text).width, ty = Math.min(l.fh - 4, cy + R + 20), tx = Math.max(4, Math.min(l.xMax - tw - 8, cx - tw / 2 - 4));
  ctx.globalAlpha = 0.9 * alpha; ctx.fillStyle = p.bg; ctx.fillRect(tx, ty - 12, tw + 8, 17);
  ctx.globalAlpha = alpha; ctx.fillStyle = '#4a5160'; ctx.fillText(text, tx + 4, ty); ctx.globalAlpha = 1;
  return [[cx - R - 2, cy - R - 2, 2 * R + 4, 2 * R + 4], [tx - 1, ty - 13, tw + 10, 19]];
}
