import { useEffect, useRef } from 'react';
import type { MethodResult } from '../../data/benchmarkData';
import { fmt } from '../../ui';
import { AP_TICKS, BOARD_ORDER, REFERENCE_MARKS, apPos, bootCI, isCeiling, isReference } from './model';

/**
 * Live forest plot of the Track A bootstrap intervals (Figure 4a), in board order: the supervised ceiling as a
 * dashed rule on top, ranks 1 to 6 below it, the unranked references as dashed vertical marks.
 * Each ranked row streams short-lived dots drawn inside its own 95% interval, so the interval reads as a cloud of
 * resamples. Interval ends and the mean dot are the real numbers; the moving dots are illustrative.
 * Same axis (AP_DOMAIN, ceiling clipped), gridlines and dashed reference marks as the table's interval column, so it hands off.
 * ponytail: plain 2D canvas, ~60 particles a row; pauses off-screen and in hidden tabs, one still frame under reduced motion.
 */
const RANKED = BOARD_ORDER.filter((m) => !isReference(m));
const CEILING = BOARD_ORDER.find(isCeiling);
const PER_ROW = 64;

type Particle = { x: number; dy: number; born: number; life: number };
type Colors = { ink: string; ink2: string; ink3: string; line: string; surface: string; mono: string; m: Record<string, string> };

const gauss = () => Math.sqrt(-2 * Math.log(Math.random() + 1e-9)) * Math.cos(2 * Math.PI * Math.random());

/** One bootstrap-like draw: normal around the mean with the interval as ±1.96 sd, kept inside the interval. */
function draw(m: MethodResult): number {
  const [lo, hi] = bootCI(m);
  const v = m.bootstrapMeanAP + gauss() * ((hi - lo) / 3.92);
  return Math.min(hi, Math.max(lo, v));
}

function spawn(m: MethodResult, now: number, spread = 1): Particle {
  return { x: draw(m), dy: (Math.random() * 2 - 1) * spread, born: now - Math.random() * 1.8 * Number(spread === 1), life: 1.1 + Math.random() * 1.6 };
}

export function ForestCanvas({ onPick, counterRef }: { onPick?: (id: string) => void; counterRef?: React.RefObject<HTMLSpanElement | null> }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t0 = performance.now() / 1000;
    const parts = RANKED.map((m) => Array.from({ length: PER_ROW }, () => spawn(m, t0)));
    const glow = RANKED.map(() => 1);
    let hover = -1, w = 0, h = 0, raf = 0, visible = true;
    let c: Colors = { ink: '#0e1116', ink2: '#4a5160', ink3: '#626977', line: '#e2e4e8', surface: '#fff', mono: 'monospace', m: {} };

    const readColors = () => {
      const cs = getComputedStyle(canvas);
      const v = (n: string, f: string) => cs.getPropertyValue(n).trim() || f;
      c = {
        ink: v('--ink', c.ink), ink2: v('--ink-2', c.ink2), ink3: v('--ink-3', c.ink3), line: v('--line-strong', c.line),
        surface: v('--surface', c.surface), mono: v('--font-mono', c.mono),
        m: Object.fromEntries(BOARD_ORDER.map((m) => [m.id, v(`--m-${m.id.toLowerCase()}`, c.ink3)])),
      };
    };
    const resize = () => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr)); canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    // Geometry: label gutter, plot area, ceiling rule, six rows, axis.
    const geo = () => {
      const padL = w < 420 ? 104 : 150, padR = 18, ceilY = 18, top = 44, axisY = h - 24;
      const step = (axisY - 12 - top) / RANKED.length;
      return { padL, padR, ceilY, top, axisY, step, x: (v: number) => padL + apPos(v) * (w - padL - padR), y: (i: number) => top + step * (i + 0.5) };
    };

    const frame = (nowMs: number) => {
      const now = nowMs / 1000;
      const g = geo();
      ctx.clearRect(0, 0, w, h);
      ctx.font = `11px ${c.mono}`; ctx.textBaseline = 'middle';

      // Gridlines and the axis, as in the table's interval column.
      const end = AP_TICKS[AP_TICKS.length - 1];
      ctx.globalAlpha = 1; ctx.strokeStyle = c.line; ctx.lineWidth = 1;
      for (const t of AP_TICKS) { const x = Math.round(g.x(t)) + 0.5; ctx.beginPath(); ctx.moveTo(x, g.top - 6); ctx.lineTo(x, g.axisY); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(g.x(0), g.axisY + 0.5); ctx.lineTo(g.x(end), g.axisY + 0.5); ctx.stroke();
      ctx.fillStyle = c.ink3;
      AP_TICKS.forEach((t, k) => { ctx.textAlign = k === 0 ? 'left' : k === AP_TICKS.length - 1 ? 'right' : 'center'; ctx.fillText(t.toFixed(1), g.x(t), g.axisY + 13); });
      ctx.textAlign = 'left'; ctx.fillText('TRACK A AP', 0, g.axisY + 13);

      // Unranked references: dashed vertical marks at their bootstrap mean AP.
      ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
      for (const r of REFERENCE_MARKS) {
        ctx.strokeStyle = c.m[r.id]; ctx.globalAlpha = 0.75;
        const x = Math.round(g.x(r.bootstrapMeanAP)) + 0.5;
        ctx.beginPath(); ctx.moveTo(x, g.top - 6); ctx.lineTo(x, g.axisY); ctx.stroke();
      }

      // Supervised ceiling: a dashed rule above the ranked block, clipped at the right edge with its value.
      if (CEILING) {
        const label = `${fmt.ap(CEILING.bootstrapMeanAP)} →`, lw = ctx.measureText(label).width;
        ctx.globalAlpha = 0.9; ctx.strokeStyle = c.m[CEILING.id];
        ctx.beginPath(); ctx.moveTo(g.x(0), g.ceilY + 0.5); ctx.lineTo(w - g.padR - lw - 8, g.ceilY + 0.5); ctx.stroke();
        ctx.globalAlpha = 1; ctx.fillStyle = c.ink2; ctx.fillText(CEILING.method, 0, g.ceilY);
        ctx.textAlign = 'right'; ctx.fillText(label, w - g.padR, g.ceilY); ctx.textAlign = 'left';
      }
      ctx.setLineDash([]);

      // Ranked rows, 1 to 6.
      const anyHover = hover >= 0;
      RANKED.forEach((m, i) => {
        const target = !anyHover || hover === i ? 1 : 0.28;
        glow[i] += (target - glow[i]) * (reduce ? 1 : 0.14);
        const a = glow[i], y = g.y(i), col = c.m[m.id], [lo, hi] = bootCI(m);
        const spread = Math.min(11, g.step * 0.38);

        ctx.globalAlpha = Math.max(a, 0.5); ctx.fillStyle = hover === i ? c.ink : c.ink2;
        ctx.fillText(String(m.publishedRankNum), 0, y);
        ctx.fillStyle = hover === i ? c.ink : c.ink2;
        ctx.fillText(m.method.length > 12 && w < 420 ? `${m.method.slice(0, 10)}…` : m.method, 16, y);

        // Interval lane, then the resample cloud.
        ctx.fillStyle = col; ctx.globalAlpha = a * 0.08;
        ctx.fillRect(g.x(lo), y - spread - 3, Math.max(2, g.x(hi) - g.x(lo)), (spread + 3) * 2);
        parts[i].forEach((p, k) => {
          let age = now - p.born;
          if (!reduce && age > p.life) { parts[i][k] = { ...spawn(m, now), born: now }; age = 0; }
          const life = reduce ? 1 : Math.sin(Math.PI * Math.min(1, age / p.life));
          ctx.globalAlpha = a * (reduce ? 0.55 : 0.8 * life);
          ctx.beginPath(); ctx.arc(g.x(parts[i][k].x), y + parts[i][k].dy * spread, 1.7, 0, Math.PI * 2); ctx.fill();
        });

        // Real interval and bootstrap mean.
        ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineWidth = 1.5;
        const x0 = g.x(lo), x1 = g.x(hi);
        ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.moveTo(x0, y - 5); ctx.lineTo(x0, y + 5); ctx.moveTo(x1, y - 5); ctx.lineTo(x1, y + 5); ctx.stroke();
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(g.x(m.bootstrapMeanAP), y, hover === i ? 5.5 : 4.5, 0, Math.PI * 2); ctx.fill();

        if (hover === i) {
          const txt = `mean ${fmt.ap(m.bootstrapMeanAP)} · 95% ${fmt.ap(lo)}–${fmt.ap(hi)}`;
          const tw = ctx.measureText(txt).width, right = x1 + 12 + tw < w;
          ctx.globalAlpha = 1; ctx.fillStyle = c.ink; ctx.textAlign = right ? 'left' : 'right';
          ctx.fillText(txt, right ? x1 + 12 : x0 - 12, y);
          ctx.textAlign = 'left';
        }
      });
      ctx.globalAlpha = 1;
    };

    let shown = 0;
    const loop = (nowMs: number) => {
      if (visible && !document.hidden) {
        frame(nowMs);
        // Resample counter: 2,000 draws per 10 s sweep, written straight to the DOM (no React render per frame).
        const n = Math.floor(((nowMs / 1000 - t0) % 10) / 10 * 2000) + 1;
        if (counterRef?.current && n !== shown) { shown = n; counterRef.current.textContent = fmt.int(n); }
      }
      raf = requestAnimationFrame(loop);
    };

    const rowAt = (ev: PointerEvent) => {
      const r = canvas.getBoundingClientRect(), g = geo(), y = ev.clientY - r.top;
      const i = Math.floor((y - g.top) / g.step);
      return i >= 0 && i < RANKED.length ? i : -1;
    };
    const onMove = (ev: PointerEvent) => { hover = rowAt(ev); canvas.style.cursor = hover >= 0 && onPick ? 'pointer' : 'default'; if (reduce) frame(performance.now()); };
    const onLeave = () => { hover = -1; if (reduce) frame(performance.now()); };
    const onClick = (ev: PointerEvent) => { const i = rowAt(ev); if (i >= 0) onPick?.(RANKED[i].id); };

    readColors(); resize();
    if (reduce) { frame(performance.now()); if (counterRef?.current) counterRef.current.textContent = '2,000'; }
    else raf = requestAnimationFrame(loop);

    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('click', onClick as EventListener);
    const ro = new ResizeObserver(() => { resize(); if (reduce) frame(performance.now()); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(canvas);
    const retheme = () => { readColors(); if (reduce) frame(performance.now()); };
    const mo = new MutationObserver(retheme);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    const mq = matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', retheme);
    document.fonts?.ready.then(retheme);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); mo.disconnect(); mq.removeEventListener('change', retheme);
      canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerleave', onLeave); canvas.removeEventListener('click', onClick as EventListener);
    };
  }, [onPick, counterRef]);

  const summary = `Forest plot of Track A bootstrap mean AP with 95% intervals. Ceiling ${CEILING?.method ?? ''} ${CEILING ? fmt.ap(CEILING.bootstrapMeanAP) : ''}. `
    + RANKED.map((m) => { const [lo, hi] = bootCI(m); return `${m.publishedRankNum} ${m.method} ${fmt.ap(m.bootstrapMeanAP)} (${fmt.ap(lo)} to ${fmt.ap(hi)})`; }).join('; ')
    + `. References: ${REFERENCE_MARKS.map((r) => `${r.method} ${fmt.ap(r.bootstrapMeanAP)}`).join(', ')}.`;

  return <canvas ref={ref} role="img" aria-label={summary} className="block h-[236px] w-full touch-manipulation md:h-[268px]" />;
}
