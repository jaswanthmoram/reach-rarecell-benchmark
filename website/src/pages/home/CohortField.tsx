import { useEffect, useRef } from 'react';
import { RARE_PER_COHORT, SCENE, foundBy } from './heroModel';

/**
 * Near layer of the Home hero: ten cohort clouds breathing in place, rare vermilion cells, and a cobalt ring that
 * finds them one at a time (the cohort name appears beside it). When `hot` names a method, the cells that method
 * rings take its identity colour (dashed ring for reference methods) and the rest of the field steps back.
 * Canvas only; pauses off-screen and in hidden tabs; one static frame under prefers-reduced-motion.
 * ponytail: page-local because the shared LiveField has no external highlight input; fold in if a second page needs it.
 */
type Hot = { id: string; dashed: boolean } | null;
/** `area` is the part of the canvas the scene fills: [left, top, right, bottom] as fractions. */
type Props = { hot: Hot; area?: [number, number, number, number]; className?: string };
export type { Hot };

const STEP = 1.9; // seconds per found cell
const ENTER = 1.4; // seconds for the clouds to gather on first paint

export default function CohortField({ hot, area = [0.06, 0.08, 0.94, 0.92], className = '' }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const hotRef = useRef<{ hot: Hot; found: Set<number> }>({ hot: null, found: new Set() });
  const redraw = useRef<() => void>(() => {});

  useEffect(() => {
    hotRef.current = { hot, found: hot ? foundBy(hot.id) : new Set() };
    redraw.current();
  }, [hot]);

  const [ax0, ay0, ax1, ay1] = area;
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const { cells, rare, cohorts } = SCENE;
    let w = 0, h = 0, raf = 0, visible = true, mix = 0, last = performance.now();
    const t0 = last;
    const ptr = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4 };
    const css = { cell: '', ink: '', signal: '', accent: '', method: '', bg: '' };

    const readColors = () => {
      const cs = getComputedStyle(canvas);
      const v = (n: string) => cs.getPropertyValue(n).trim();
      css.cell = v('--ink-3') || '#8a909c'; css.ink = v('--ink-2') || '#4a5160';
      css.signal = v('--signal') || '#ff5a1f'; css.bg = v('--canvas') || '#fafafa'; css.accent = v('--accent') || '#2f5bea';
      const id = hotRef.current.hot?.id;
      css.method = (id && v(`--m-${id.toLowerCase()}`)) || css.accent;
    };
    const resize = () => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr)); canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    /* Cohort clouds sway on slow, distinct orbits so the field reads as alive without anything travelling far. */
    const X = (v: number) => (ax0 + v * (ax1 - ax0)) * w;
    const Y = (v: number) => (ay0 + v * (ay1 - ay0)) * h;
    const sway = (k: number, t: number) => [Math.sin(t * 0.21 + k * 1.7) * 0.012, Math.cos(t * 0.17 + k * 2.3) * 0.014];

    const draw = (now: number) => {
      const t = reduce ? 12 : Math.max(0, now - t0) / 1000;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const { hot: hc, found } = hotRef.current;
      mix = reduce ? (hc ? 1 : 0) : mix + ((hc ? 1 : 0) - mix) * Math.min(1, dt * 12);
      ptr.x += (ptr.tx - ptr.x) * Math.min(1, dt * 8); ptr.y += (ptr.ty - ptr.y) * Math.min(1, dt * 8);
      const enter = reduce ? 1 : Math.min(1, t / ENTER);
      const ease = 1 - (1 - enter) ** 3;
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = css.cell;
      for (const p of cells) {
        const c = cohorts[p.cohort];
        const [sx, sy] = sway(p.cohort, t);
        let x = X(c.x + (p.x - c.x) * ease + sx + Math.sin(t * 0.7 + p.ph) * 0.003);
        let y = Y(c.y + (p.y - c.y) * ease + sy + Math.cos(t * 0.6 + p.ph) * 0.003);
        const dx = x - ptr.x, dy = y - ptr.y, d2 = dx * dx + dy * dy;
        if (d2 < 9000) { const f = (1 - d2 / 9000) * 14 / Math.sqrt(d2 + 1); x += dx * f; y += dy * f; }
        ctx.globalAlpha = (0.32 + 0.38 * ((p.ph / 6.283) % 1)) * ease * (1 - 0.45 * mix);
        ctx.beginPath(); ctx.arc(x, y, p.r, 0, 6.283); ctx.fill();
      }

      const cur = Math.floor(t / STEP) % rare.length;
      const order = (i: number) => (i * 7) % rare.length; // hop between cohorts rather than walking one cloud
      rare.forEach((p, i) => {
        const [sx, sy] = sway(p.cohort, t);
        const x = X(p.x + sx), y = Y(p.y + sy);
        const isFound = found.has(i);
        const pulse = reduce ? 1 : 1 + 0.16 * Math.sin(t * 2.6 + i);
        ctx.globalAlpha = ease * (1 - mix * (isFound ? 0 : 0.6));
        ctx.fillStyle = css.signal;
        ctx.beginPath(); ctx.arc(x, y, 2.6 * pulse, 0, 6.283); ctx.fill();
        if (isFound && mix > 0.01) {
          ctx.globalAlpha = mix; ctx.strokeStyle = css.method; ctx.lineWidth = 1.4;
          ctx.setLineDash(hc?.dashed ? [2.5, 2.5] : []);
          ctx.beginPath(); ctx.arc(x, y, 7, 0, 6.283); ctx.stroke(); ctx.setLineDash([]);
        }
      });

      // Idle finder: a cobalt ring closes on one rare cell and names its cohort.
      if (mix < 0.99 && rare.length) {
        const p = rare[order(cur)];
        const [sx, sy] = sway(p.cohort, t);
        const x = X(p.x + sx), y = Y(p.y + sy);
        const k = reduce ? 1 : Math.min(1, ((t % STEP) / STEP) * 2.4);
        const fade = (reduce ? 1 : 1 - Math.max(0, ((t % STEP) / STEP - 0.82) * 5.5)) * (1 - mix) * ease;
        ctx.globalAlpha = fade; ctx.strokeStyle = css.accent; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.arc(x, y, 26 - 17 * k, 0, 6.283); ctx.stroke();
        if (k >= 1) {
          ctx.globalAlpha = fade * 0.9; ctx.fillStyle = css.ink; ctx.font = '11px "Geist Mono", ui-monospace, monospace';
          const label = `${cohorts[p.cohort].id} · rare cell ${p.slot + 1}/${RARE_PER_COHORT}`;
          const right = x + 14 + ctx.measureText(label).width < w - 8;
          ctx.textAlign = right ? 'left' : 'right';
          // A canvas-coloured halo keeps the label readable where it crosses a cloud.
          ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = css.bg;
          ctx.strokeText(label, right ? x + 14 : x - 14, y + 4);
          ctx.fillText(label, right ? x + 14 : x - 14, y + 4);
        }
      }
      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => { if (visible && !document.hidden) draw(now); raf = requestAnimationFrame(loop); };
    redraw.current = () => { readColors(); if (reduce) draw(performance.now()); };
    readColors(); resize();
    if (reduce) draw(performance.now()); else raf = requestAnimationFrame(loop);

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const b = canvas.getBoundingClientRect();
      ptr.tx = e.clientX - b.left; ptr.ty = e.clientY - b.top;
    };
    if (!reduce) addEventListener('pointermove', onMove, { passive: true });
    const ro = new ResizeObserver(() => { resize(); if (reduce) draw(performance.now()); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(canvas);
    const mo = new MutationObserver(() => redraw.current());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onScheme = () => redraw.current();
    mq.addEventListener('change', onScheme);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); mo.disconnect();
      mq.removeEventListener('change', onScheme); removeEventListener('pointermove', onMove);
      redraw.current = () => {};
    };
  }, [ax0, ay0, ax1, ay1]);

  return <canvas ref={ref} aria-hidden="true" className={className} style={{ display: 'block', width: '100%', height: '100%' }} />;
}
