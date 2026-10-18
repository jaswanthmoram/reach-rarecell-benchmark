import { useEffect, useRef } from 'react';
import type { RoutePath } from '../../app/router';
import { DEST_PAGES, PERSONAS, KEY_PAGE } from './personas';
import { DEST_INSET, destY, originY } from './journeyGeometry';

/**
 * Five live journeys, one per reader, travelling through the cell field to the page that answers that reader.
 * Each path is a dotted bezier with cells moving along it; the selected reader's path turns accent and leaves a
 * short trail, a hovered reader or destination lifts its paths halfway. Emphasis eases over ~300ms.
 * Theme-aware (reads CSS tokens), DPR-capped at 2, paused off-screen and in hidden tabs, one static frame under
 * prefers-reduced-motion (redrawn when the selection changes).
 * ponytail: page-local 2D canvas beside the shared LiveField; promote to src/ui if another page needs paths.
 */

/** `origins`: optional 0..1 y for each reader's start, so a route can begin level with its picker row. */
type Props = { active: string; hover: string | null; hoverPage: RoutePath | null; origins?: number[] | null; className?: string };

const TRAVELLERS = 5;
const EASE_MS = 300;

export function JourneyField({ active, hover, hoverPage, origins = null, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const state = useRef({ active, hover, hoverPage, origins });
  const redraw = useRef<() => void>(() => {});

  useEffect(() => {
    state.current = { active, hover, hoverPage, origins };
    redraw.current();
  }, [active, hover, hoverPage, origins]);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const emphasis = PERSONAS.map((p) => (p.id === state.current.active ? 1 : 0));
    let w = 0, h = 0, raf = 0, visible = true, last = performance.now();
    const t0 = last;
    let colors = { cell: '#8a909c', ink: '#4a5160', accent: '#2f5bea', canvas: '#fafafa' };

    const readColors = () => {
      const cs = getComputedStyle(canvas);
      const v = (n: string, f: string) => cs.getPropertyValue(n).trim() || f;
      colors = { cell: v('--ink-3', colors.cell), ink: v('--ink-2', colors.ink), accent: v('--accent', colors.accent), canvas: v('--canvas', colors.canvas) };
    };
    const resize = () => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr)); canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const target = (i: number) => {
      const { active: a, hover: hv, hoverPage: hp } = state.current;
      const p = PERSONAS[i];
      if (p.id === a) return 1;
      return p.id === hv || KEY_PAGE[p.id] === hp ? 0.55 : 0;
    };
    /** Point on journey i at t in px: a cubic bezier with a gentle meander so paths read as travelled, not plotted. */
    const at = (i: number, t: number): [number, number] => {
      const x0 = 10, x3 = w - DEST_INSET, y0 = (state.current.origins?.[i] ?? originY(i)) * h, y3 = destY(KEY_PAGE[PERSONAS[i].id]) * h;
      const x1 = x0 + (x3 - x0) * 0.42, x2 = x0 + (x3 - x0) * 0.58, y1 = y0, y2 = y3;
      const u = 1 - t;
      const x = u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3;
      const y = u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3;
      return [x, y + Math.sin(t * Math.PI * 3 + i * 1.7) * Math.sin(t * Math.PI) * h * 0.035];
    };

    const draw = (now: number) => {
      const dt = now - last; last = now;
      const time = (now - t0) / 1000;
      const k = reduce ? 1 : Math.min(1, dt / EASE_MS);
      PERSONAS.forEach((_, i) => { emphasis[i] += (target(i) - emphasis[i]) * k; });
      ctx.clearRect(0, 0, w, h);
      // Draw quiet paths first, the selected one last so it sits on top where paths cross.
      const order = PERSONAS.map((_, i) => i).sort((a, b) => emphasis[a] - emphasis[b]);
      for (const i of order) {
        const e = emphasis[i];
        ctx.lineCap = 'round';
        ctx.setLineDash([1, 6]);
        ctx.lineWidth = 1.4 + e;
        ctx.strokeStyle = e > 0.5 ? colors.accent : colors.cell;
        ctx.globalAlpha = 0.35 + 0.6 * e;
        ctx.beginPath();
        for (let s = 0; s <= 64; s++) { const [x, y] = at(i, s / 64); if (s) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
        ctx.stroke();
        ctx.setLineDash([]);
        // Origin: the question a reader arrives with.
        const [ox, oy] = at(i, 0);
        ctx.globalAlpha = 0.5 + 0.5 * e; ctx.lineWidth = 1.2; ctx.strokeStyle = e > 0.5 ? colors.accent : colors.ink;
        ctx.fillStyle = colors.canvas;
        ctx.beginPath(); ctx.arc(ox, oy, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        // Travelling cells; the selected journey's cells leave a fading trail.
        const speed = 0.055 + i * 0.006;
        for (let n = 0; n < TRAVELLERS; n++) {
          const t = ((reduce ? 0.1 : time * speed) + n / TRAVELLERS + i * 0.07) % 1;
          const fade = Math.min(1, t * 8, (1 - t) * 8);
          const trail = e > 0.5 && !reduce ? 5 : 0;
          for (let g = trail; g >= 0; g--) {
            const tt = t - g * 0.008;
            if (tt < 0) continue;
            const [x, y] = at(i, tt);
            ctx.globalAlpha = fade * (0.45 + 0.55 * e) * (1 - g / (trail + 1));
            ctx.fillStyle = e > 0.5 ? colors.accent : colors.ink;
            ctx.beginPath(); ctx.arc(x, y, 1.5 + e * 1.3, 0, Math.PI * 2); ctx.fill();
          }
        }
      }
      // Destination nodes: a ring closes on the page that answers the selected reader.
      DEST_PAGES.forEach((page) => {
        const x = w - DEST_INSET, y = destY(page) * h;
        const on = KEY_PAGE[state.current.active] === page;
        ctx.globalAlpha = 1; ctx.fillStyle = on ? colors.accent : colors.ink;
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
        if (on) {
          const ring = reduce ? 0.6 : (time % 2.4) / 2.4;
          ctx.strokeStyle = colors.accent; ctx.lineWidth = 1.2; ctx.globalAlpha = reduce ? 0.7 : 1 - ring;
          ctx.beginPath(); ctx.arc(x, y, 7 + ring * 14, 0, Math.PI * 2); ctx.stroke();
        }
      });
      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => { if (visible && !document.hidden) draw(now); else last = now; raf = requestAnimationFrame(loop); };
    readColors(); resize();
    redraw.current = reduce ? () => draw(performance.now()) : () => {};
    if (reduce) draw(performance.now()); else raf = requestAnimationFrame(loop);

    const ro = new ResizeObserver(() => { resize(); if (reduce) draw(performance.now()); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(canvas);
    const mo = new MutationObserver(() => { readColors(); if (reduce) draw(performance.now()); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); mo.disconnect(); redraw.current = () => {}; };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className={className} style={{ display: 'block', width: '100%', height: '100%' }} />;
}
