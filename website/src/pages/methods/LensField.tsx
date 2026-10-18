import { useEffect, useRef } from 'react';
import { fmt } from '../../ui';
import { getFocusedLens, subscribeLens } from './lensStore';

/**
 * Detector lenses over one shared cell field. Each lens is a method: as it drifts across the field it lights the
 * cells that method scores highest. Ranked detectors draw a solid ring, references a dashed one (DESIGN v2.2).
 * Hovering or pinning a method (hero chips, matrix rows, picker) brings its lens forward and dims the others.
 * Same contract as the shared LiveField: theme-aware, DPR <= 2, paused off-screen or in a hidden tab, one still
 * frame under prefers-reduced-motion.
 */
export interface LensMethod { id: string; name: string; ap: number; reference: boolean }

const PREVALENCE = 0.03;
const CELLS = 2200;
const CYCLE_S = 9;
const SLOTS = 3;

/**
 * Which cells a method lights. Illustrative, tuned so precision among lit cells equals the method's median AP
 * (floored at prevalence): recall R = min(1, 2a), false-positive rate F = p R (1 - a) / (a (1 - p)).
 * ponytail: a picture of median AP, not a replay of real scores; swap in per-cell scores if a unit is ever shipped.
 */
const rates = (ap: number) => {
  const a = Math.max(PREVALENCE, Math.min(1, ap));
  const recall = Math.min(1, 2 * a);
  return { recall, fpr: (PREVALENCE * recall * (1 - a)) / (a * (1 - PREVALENCE)) };
};

const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r());

type Cell = { x: number; y: number; r: number; signal: boolean; u: number; v: number; ph: number };

/** A soft embedding: seven cohort clusters plus a sparse background, malignant cells at 3% prevalence. */
function makeCells(): Cell[] {
  const r = rng(29);
  const centres = Array.from({ length: 7 }, () => ({ x: 0.1 + r() * 0.8, y: 0.12 + r() * 0.76, sx: 0.06 + r() * 0.07, sy: 0.07 + r() * 0.08 }));
  return Array.from({ length: CELLS }, (_, i) => {
    const c = centres[i % centres.length];
    const loose = i % 5 === 0;
    const x = loose ? r() : c.x + gauss(r) * c.sx;
    const y = loose ? r() : c.y + gauss(r) * c.sy;
    return { x: Math.min(0.995, Math.max(0.005, x)), y: Math.min(0.995, Math.max(0.005, y)), r: 0.8 + r() * 0.9, signal: r() < PREVALENCE, u: r(), v: r(), ph: r() * Math.PI * 2 };
  });
}

/** Lissajous path per slot, so three lenses never stack. */
const PATHS = [
  { a: 0.11, b: 0.17, p: 0.3, q: 1.1 },
  { a: 0.07, b: 0.13, p: 2.4, q: 0.2 },
  { a: 0.09, b: 0.11, p: 4.1, q: 2.6 },
];

export function LensField({ methods, className }: { methods: LensMethod[]; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || methods.length === 0) return;
    const cells = makeCells();
    const byId = new Map(methods.map((m) => [m.id, { ...m, ...rates(m.ap) }]));
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0, reserve = 0, raf = 0, visible = true, last = performance.now(), clock = 4.2;
    let col = { cell: '#8a909c', signal: '#ff5a1f', canvas: '#fafafa', ink2: '#4a5160', methods: new Map<string, string>() };
    // Focused lens state: what slot 0 shows, its crossfade and the focus mix (0 roaming, 1 focused).
    let shown: string | null = null, fade = 1, mix = 0;
    // Readout chips drawn this frame, so two lens labels never overlap (a label that fits nowhere is skipped).
    let chips: { x: number; y: number; w: number; h: number }[] = [];

    const readColors = () => {
      const cs = getComputedStyle(canvas);
      const v = (n: string, d: string) => cs.getPropertyValue(n).trim() || d;
      col = {
        cell: v('--ink-3', col.cell), signal: v('--signal', col.signal), canvas: v('--canvas', col.canvas), ink2: v('--ink-2', col.ink2),
        methods: new Map(methods.map((m) => [m.id, v(`--m-${m.id.toLowerCase()}`, col.cell)])),
      };
    };
    const resize = () => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr)); canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const legend = canvas.parentElement?.querySelector<HTMLElement>('[data-lens-legend]');
      reserve = legend ? legend.offsetHeight + 12 : 0;
    };

    const lens = (id: string, cx: number, cy: number, R: number, alpha: number) => {
      const m = byId.get(id);
      if (!m || alpha <= 0.01) return;
      const hue = col.methods.get(id) ?? col.cell;
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
      ctx.globalAlpha = 0.72 * alpha; ctx.fillStyle = col.canvas; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      for (const c of cells) {
        const x = c.x * w, y = c.y * (h - reserve);
        if ((x - cx) ** 2 + (y - cy) ** 2 > R * R) continue;
        const lit = c.signal ? c.u < m.recall : c.v < m.fpr;
        if (lit) {
          ctx.globalAlpha = alpha; ctx.fillStyle = c.signal ? col.signal : hue;
          ctx.beginPath(); ctx.arc(x, y, c.r + 1.2, 0, Math.PI * 2); ctx.fill();
          if (c.signal) { ctx.strokeStyle = hue; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, c.r + 3.6, 0, Math.PI * 2); ctx.stroke(); }
        } else {
          ctx.globalAlpha = 0.28 * alpha; ctx.fillStyle = c.signal ? col.signal : col.cell;
          ctx.beginPath(); ctx.arc(x, y, c.r, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
      // Ring: solid for ranked detectors, dashed for references; four ticks like a reticle.
      ctx.globalAlpha = alpha; ctx.strokeStyle = hue; ctx.lineWidth = 1.5;
      ctx.setLineDash(m.reference ? [5, 4] : []);
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]); ctx.lineWidth = 1;
      for (let k = 0; k < 4; k++) {
        const a = (k * Math.PI) / 2;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (R + 3), cy + Math.sin(a) * (R + 3)); ctx.lineTo(cx + Math.cos(a) * (R + 9), cy + Math.sin(a) * (R + 9)); ctx.stroke();
      }
      // Readout under the lens: name and median AP, ink text on a canvas chip (text never takes the method hue).
      const text = `${m.name}  ${fmt.ap(m.ap)}`;
      ctx.font = '500 11px "Geist Mono", ui-monospace, monospace';
      const tw = ctx.measureText(text).width;
      const tx = Math.max(4, Math.min(w - tw - 12, cx - tw / 2 - 4));
      const clash = (y: number) => chips.some((c) => tx < c.x + c.w && c.x < tx + tw + 8 && y - 12 < c.y + c.h && c.y < y + 5);
      const below = Math.min(h - reserve - 4, cy + R + 22);
      const above = Math.max(16, cy - R - 14);
      const ty = !clash(below) ? below : !clash(above) ? above : null;
      if (ty === null) { ctx.globalAlpha = 1; return; }
      chips.push({ x: tx, y: ty - 12, w: tw + 8, h: 17 });
      ctx.globalAlpha = 0.9 * alpha; ctx.fillStyle = col.canvas;
      ctx.fillRect(tx, ty - 12, tw + 8, 17);
      ctx.globalAlpha = alpha; ctx.fillStyle = col.ink2; ctx.fillText(text, tx + 4, ty);
      ctx.globalAlpha = 1;
    };

    const draw = (dt: number) => {
      clock += reduce ? 0 : dt;
      const t = clock;
      const target = getFocusedLens();
      // Crossfade slot 0 to the focused method (~160 ms out, ~160 ms in), then ease the focus mix (~300 ms).
      if (target !== shown) { fade -= dt * 6; if (fade <= 0 || reduce) { shown = target; fade = reduce ? 1 : 0; } }
      else fade = Math.min(1, fade + dt * 6);
      mix += ((shown ? 1 : 0) - mix) * (reduce ? 1 : 1 - Math.exp(-dt * 10));

      ctx.clearRect(0, 0, w, h);
      chips = [];
      const fh = h - reserve;
      for (const c of cells) {
        const x = c.x * w + (reduce ? 0 : Math.sin(t * 0.5 + c.ph) * 1.6);
        const y = c.y * fh + (reduce ? 0 : Math.cos(t * 0.4 + c.ph * 1.3) * 1.6);
        ctx.globalAlpha = c.signal ? 0.75 : 0.3 + 0.25 * ((c.ph % 1) + 0.1);
        ctx.fillStyle = c.signal ? col.signal : col.cell;
        ctx.beginPath(); ctx.arc(x, y, c.signal ? c.r + 0.6 : c.r, 0, Math.PI * 2); ctx.fill();
      }

      const base = Math.max(34, Math.min(fh * 0.27, w * 0.15));
      for (let i = SLOTS - 1; i >= 0; i--) {
        const P = PATHS[i];
        const R = base * (i === 0 ? 1 + 0.3 * mix : 1);
        const cx = R + 10 + (w - 2 * R - 20) * (0.5 + 0.5 * Math.sin(t * P.a + P.p));
        const cy = R + 10 + Math.max(0, fh - 2 * R - 44) * (0.5 + 0.5 * Math.sin(t * P.b + P.q));
        const phase = (t + i * (CYCLE_S / SLOTS)) / CYCLE_S;
        const id = methods[(Math.floor(phase) * SLOTS + i) % methods.length].id;
        const k = phase % 1;
        const envelope = reduce ? 1 : Math.min(1, k / 0.08, (1 - k) / 0.08);
        if (i === 0 && shown) lens(shown, cx, cy, R, fade);
        else lens(id, cx, cy, R, envelope * (1 - 0.8 * mix) * (i === 0 ? fade : 1));
      }
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (visible && !document.hidden) draw(dt);
      raf = requestAnimationFrame(loop);
    };
    readColors(); resize();
    if (reduce) draw(0); else raf = requestAnimationFrame(loop);

    const redraw = () => { if (reduce) draw(0); };
    const unsub = subscribeLens(redraw);
    const ro = new ResizeObserver(() => { resize(); redraw(); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(canvas);
    const mo = new MutationObserver(() => { readColors(); redraw(); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onScheme = () => { readColors(); redraw(); };
    mq.addEventListener('change', onScheme);
    return () => { cancelAnimationFrame(raf); unsub(); ro.disconnect(); io.disconnect(); mo.disconnect(); mq.removeEventListener('change', onScheme); };
  }, [methods]);

  return <canvas ref={ref} aria-hidden="true" className={className} style={{ display: 'block', width: '100%', height: '100%' }} />;
}
