import { useEffect, useRef } from 'react';
import { motionAllowed, useMotionPaused } from '../../ui/motion';

/**
 * The hero's living background, across the whole hero: graphite molecules flow from left to right with a slight
 * vertical wobble and varied speed, slowing as they go, so they thin out on the left (behind the text) and gather
 * on the right where they merge into the artwork; a few vermilion rare cells travel with them inside spinning dashed
 * rings; the pointer parts them (they spring back). Off the right edge a particle re-enters off-screen left.
 *
 * Legibility: inside the text zone (`calm`, a fraction of the width; the whole width on phones) every mark is capped
 * at a low alpha, so ink-2 text keeps >= 5:1 and the cobalt headline >= 3.3:1 over the darkest possible mark.
 * Cost: one Path2D fill per colour group, 25 fps, only while on screen and the tab is visible; under reduced motion
 * or "Pause motion" one still frame. Particle count scales with width (~60 on phones, ~130 at 1440). Decorative.
 */
/** 25 fps: the flow is slow, and the field covers the whole hero. */
const FRAME_MS = 40;
const TAU = Math.PI * 2;
/** Particles per CSS px of width, clamped. */
const DENSITY = 0.09;
const MIN_CELLS = 60;
const MAX_CELLS = 150;
const RARE = 5;
/** Speed falls from 1 to 1 - SLOW across the width; density rises as 1 / speed. */
const SLOW = 0.72;
/** Pointer influence radius (CSS px) and push strength. */
const REACH = 120;
const PUSH = 26;
const EDGE = 24;
/** Alpha caps inside the text zone (see header): graphite, rare cells, rings. */
const CALM_CELL = 0.2;
const CALM_RARE = 0.35;
const CALM_RING = 0.3;
const FADE_IN_S = 0.9;

interface Cell { x: number; y: number; ox: number; oy: number; r: number; ph: number; sp: number; v: number; rare: boolean }

/** Deterministic pseudo-random so the layout is the same on every visit. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** Inverse CDF of the steady-state density (proportional to 1 / speed): the flow starts already settled. */
const steadyX = (u: number) => (1 - (1 - SLOW) ** u) / SLOW;

function makeCells(w: number, h: number): Cell[] {
  const rand = rng(1878538);
  const n = Math.round(Math.min(MAX_CELLS, Math.max(MIN_CELLS, w * DENSITY)));
  const out: Cell[] = [];
  for (let i = 0; i < n + RARE; i++) {
    const rare = i >= n;
    const x = steadyX(rand()) * (w + EDGE * 2) - EDGE;
    const y = (0.04 + rand() * 0.92) * h;
    out.push({ x, y, ox: 0, oy: 0, rare, r: rare ? 3.4 : 0.9 + rand() * 2.1, ph: rand() * TAU, sp: 0.3 + rand() * 0.6, v: rare ? 7 + rand() * 4 : 9 + rand() * 18 });
  }
  return out;
}

const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function token(name: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

interface HeroFieldProps {
  className?: string;
  /** Fraction of the width (from the left) where the text sits; marks there stay faint. 1 = everywhere (phones). */
  calm?: number;
  onPointer?: (x: number, y: number) => void;
}

export function HeroField({ className, calm = 0.55, onPointer }: HeroFieldProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const paused = useMotionPaused();

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const ink = token('--ink-2', '#4a5160');
    const far = token('--cell', '#8a909c');
    const signal = token('--signal', '#ff5a1f');
    const accent = token('--accent', '#2f5bea');
    const live = !paused && motionAllowed();
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

    let w = 0, h = 0, cells: Cell[] = [];
    let px = -9999, py = -9999;
    let raf = 0, timer = 0, running = false, inView = false;
    let t0: number | null = null, last = 0;

    const resize = () => {
      const nw = canvas.clientWidth, nh = canvas.clientHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(nw * dpr); canvas.height = Math.round(nh * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (nw !== w || nh !== h) { w = nw; h = nh; cells = makeCells(w, h); }
    };

    // 0 inside the text zone (faint marks), 1 beyond it.
    const zone = (x: number) => (calm >= 1 ? 0 : smooth(calm * w * 0.85, calm * w * 1.15, x));

    const draw = (now: number) => {
      ctx.clearRect(0, 0, w, h);
      const s = now / 1000;
      const dt = last ? Math.min(0.1, s - last) : 0;
      last = s;
      const fade = !live ? 1 : t0 === null ? 0 : Math.min(1, (s - t0) / FADE_IN_S);
      // Six groups (graphite far, graphite near, rare; each calm or full), one fill each.
      const g = [new Path2D(), new Path2D(), new Path2D(), new Path2D(), new Path2D(), new Path2D()];
      const rings: number[] = [];
      for (const c of cells) {
        if (live && dt) {
          c.x += c.v * (1 - SLOW * Math.min(1, Math.max(0, c.x / w))) * dt;
          if (c.x > w + EDGE) { c.x = -EDGE - Math.random() * 40; c.ox = 0; }
        }
        // Wobble, then the pointer pushes; the offset springs back.
        let tx = 0, ty = Math.sin(s * c.sp + c.ph) * 6;
        const dx = c.x - px, dy = c.y + ty - py, d = Math.hypot(dx, dy);
        if (d < REACH && d > 0.01) { const f = (1 - d / REACH) ** 2 * PUSH; tx += (dx / d) * f; ty += (dy / d) * f; }
        const ease = live ? 0.14 : 1;
        c.ox += (tx - c.ox) * ease; c.oy += (ty - c.oy) * ease;
        const x = c.x + c.ox, y = c.y + c.oy;
        if (x < -EDGE || x > w + EDGE) continue;
        const z = zone(x);
        const k = (c.rare ? 4 : c.r > 2 ? 2 : 0) + (z > 0.5 ? 1 : 0);
        g[k].moveTo(x + c.r, y); g[k].arc(x, y, c.r, 0, TAU);
        if (c.rare) rings.push(x, y, z);
      }
      const groups: readonly (readonly [string, number, number])[] = [[far, CALM_CELL * 0.8, 0.4], [ink, CALM_CELL, 0.55], [signal, CALM_RARE, 1]];
      groups.forEach(([colour, calmA, fullA], i) => {
        ctx.fillStyle = colour;
        ctx.globalAlpha = calmA * fade; ctx.fill(g[i * 2]);
        ctx.globalAlpha = fullA * fade; ctx.fill(g[i * 2 + 1]);
      });
      ctx.setLineDash([3, 3.5]); ctx.lineWidth = 1.4; ctx.strokeStyle = accent; ctx.lineDashOffset = -s * 4;
      for (let i = 0; i < rings.length; i += 3) {
        const x = rings[i], y = rings[i + 1], z = rings[i + 2];
        const near = Math.max(0, 1 - Math.hypot(x - px, y - py) / (REACH * 1.4)) * z;
        ctx.globalAlpha = (CALM_RING + (0.75 + near * 0.25 - CALM_RING) * z) * fade;
        ctx.beginPath(); ctx.arc(x, y, 11 + near * 5, 0, TAU); ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    };

    const tick = (now: number) => {
      const began = performance.now();
      if (t0 === null) { t0 = now / 1000; last = t0; }
      draw(now);
      timer = window.setTimeout(() => { raf = requestAnimationFrame(tick); }, Math.max(0, FRAME_MS - 8 - (performance.now() - began)));
    };
    const start = () => { if (running || !live || !inView || document.hidden) return; running = true; last = 0; raf = requestAnimationFrame(tick); };
    const stop = () => { running = false; cancelAnimationFrame(raf); clearTimeout(timer); };
    const sync = () => { if (live && inView && !document.hidden) start(); else stop(); };

    resize();
    draw(performance.now());
    const ro = new ResizeObserver(() => { resize(); if (!running) draw(performance.now()); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; sync(); });
    io.observe(canvas);
    document.addEventListener('visibilitychange', sync);

    const host = canvas.parentElement;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const r = canvas.getBoundingClientRect();
      px = e.clientX - r.left; py = e.clientY - r.top;
      onPointer?.(Math.min(1, Math.max(0, px / w)), Math.min(1, Math.max(0, py / h)));
    };
    const leave = () => { px = py = -9999; onPointer?.(0.5, 0.5); };
    if (fine && live && host) { host.addEventListener('pointermove', move); host.addEventListener('pointerleave', leave); }

    return () => {
      stop(); ro.disconnect(); io.disconnect();
      document.removeEventListener('visibilitychange', sync);
      if (host) { host.removeEventListener('pointermove', move); host.removeEventListener('pointerleave', leave); }
    };
  }, [paused, onPointer, calm]);

  return <canvas ref={ref} aria-hidden="true" className={className} />;
}
