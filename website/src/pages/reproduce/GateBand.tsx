// The gate band (board hero): cells stream left to right through the twelve phase gates. The gates of the
// section in view are lit; with no lit gates a slow scan walks them. The gate lines are SVG; the 126 moving cells
// and the scan are one canvas at ~30 fps behind the shared loop gate (on screen, tab visible, motion allowed).
// Held, it draws one still frame; under reduced motion that frame is the computed start position of each cell.
import { useEffect, useRef } from 'react';
import { useLoopGate } from '../../ui/motion/useLoopGate';
import { cx } from '../../lib/format';
import { gateX } from './phases';

const GATES = Array.from({ length: 12 }, (_, i) => ({ n: i + 1, x: gateX(i) }));
const VIEW_W = 1000, VIEW_H = 84;
const FRAME_MS = 33;
const MAX_DPR = 2;
/** Scan: each gate flashes for 9% of an 8.4 s cycle, 0.7 s after the one before it. */
const SCAN_S = 8.4, SCAN_STEP = 0.7;

type Dot = { f: number; y: number; r: number; fill: string; dur: number; delay: number };

function makeDots(): Dot[] {
  let seed = 20260;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const LANES = [16, 30, 54, 68];
  const dots: Dot[] = [];
  for (let k = 0; k < 120; k++) {
    const dur = 22 + rnd() * 8;
    const f = Math.floor(rnd() * 6);
    const shade = rnd();
    const y = LANES[Math.floor(rnd() * 4)] + (rnd() < 0.5 ? -3 : 3);
    const r = 1 + rnd() * 1.4;
    dots.push({ f, y, r, fill: shade > 0.72 ? '--ink' : shade > 0.35 ? '--ink-3' : '#a7adb8', dur, delay: rnd() * dur });
  }
  for (let s = 0; s < 6; s++) dots.push({ f: s % 4, y: 42, r: 3, fill: '--signal', dur: 24, delay: s * 4 });
  return dots;
}
const DOTS = makeDots();

/* The six flight paths (linear between stops): [offset, value]. Cells start at x = -20 and travel 1020. */
type Stops = [number, number][];
const lane = (a: number, b: number): { x: Stops; y: Stops } => ({ x: [[0, 0], [0.55, 560], [1, 1020]], y: [[0, a], [0.55, b], [1, 0]] });
const PATHS: { x: Stops; y: Stops; o: Stops }[] = [
  { ...lane(-26, -2), o: [[0, 0.25], [0.1, 1], [1, 1]] },
  { ...lane(-12, -1), o: [[0, 0.25], [0.1, 1], [1, 1]] },
  { ...lane(12, 1), o: [[0, 0.25], [0.1, 1], [1, 1]] },
  { ...lane(26, 2), o: [[0, 0.25], [0.1, 1], [1, 1]] },
  { x: [[0, 0], [0.4, 400], [1, 1020]], y: [[0, -34], [0.4, -6], [1, 0]], o: [[0, 0.2], [0.1, 0.9], [0.4, 0.9], [0.52, 0], [1, 0]] },
  { x: [[0, 0], [0.3, 300], [1, 1020]], y: [[0, 34], [0.3, 8], [1, 0]], o: [[0, 0.2], [0.1, 0.9], [0.3, 0.9], [0.42, 0], [1, 0]] },
];
function at(stops: Stops, p: number) {
  for (let i = 1; i < stops.length; i++) {
    const [o1, v1] = stops[i];
    const [o0, v0] = stops[i - 1];
    if (p <= o1) return v0 + ((p - o0) / (o1 - o0)) * (v1 - v0);
  }
  return stops[stops.length - 1][1];
}
/** Opacity of gate i's scan flash at time t (0 before its first cycle starts). */
function scanAt(i: number, t: number) {
  const local = t - i * SCAN_STEP;
  if (local < 0) return 0;
  const q = (local % SCAN_S) / SCAN_S;
  if (q < 0.03) return (0.7 * q) / 0.03;
  return q < 0.09 ? 0.7 * (1 - (q - 0.03) / 0.06) : 0;
}

function paint(ctx: CanvasRenderingContext2D, t: number, scan: boolean, colour: (k: string) => string) {
  if (scan) {
    ctx.strokeStyle = colour('--accent'); ctx.lineWidth = 2;
    GATES.forEach((g, i) => {
      const o = scanAt(i, t);
      if (o <= 0) return;
      ctx.globalAlpha = o; ctx.beginPath(); ctx.moveTo(g.x, 4); ctx.lineTo(g.x, 80); ctx.stroke();
    });
  }
  // Most cells fly at full opacity: those go into one path per colour (four fills), the fading few one by one.
  const solid = new Map<string, Path2D>();
  for (const d of DOTS) {
    const path = PATHS[d.f], p = (((t + d.delay) / d.dur) % 1 + 1) % 1, o = at(path.o, p);
    if (o <= 0) continue;
    const x = -20 + at(path.x, p), y = d.y + at(path.y, p), fill = colour(d.fill);
    if (o >= 0.999) {
      let batch = solid.get(fill);
      if (!batch) { batch = new Path2D(); solid.set(fill, batch); }
      batch.moveTo(x + d.r, y); batch.arc(x, y, d.r, 0, 6.283);
      continue;
    }
    ctx.globalAlpha = o; ctx.fillStyle = fill;
    ctx.beginPath(); ctx.arc(x, y, d.r, 0, 6.283); ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const [fill, batch] of solid) { ctx.fillStyle = fill; ctx.fill(batch); }
}

/** ~30 fps without 60 rAF callbacks a second: wait out most of the frame budget, then take the next vsync. */
function makeTicker(frame: (now: number) => void) {
  let raf = 0, timer = 0;
  const tick = (now: number) => {
    // The rAF timestamp can be most of a frame old; time the gap from when this callback actually runs.
    const began = performance.now();
    frame(now);
    timer = window.setTimeout(() => { raf = requestAnimationFrame(tick); }, Math.max(0, FRAME_MS - 8 - (performance.now() - began)));
  };
  return {
    start: () => { window.clearTimeout(timer); cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); },
    stop: () => { window.clearTimeout(timer); cancelAnimationFrame(raf); },
  };
}

/** Drives the band canvas: sized to the wrapper, ~30 fps while `running`, one still frame otherwise. */
function useBandCanvas(running: boolean, scan: boolean) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runningRef = useRef(running), scanRef = useRef(scan);
  const api = useRef({ redraw: () => {}, start: () => {} });
  useEffect(() => {
    const el = canvasRef.current;
    const ctx = el?.getContext('2d');
    if (!el || !ctx) return; // No 2D context: the gates still show and light; only the cells are missing.
    const css = getComputedStyle(document.documentElement);
    const cache = new Map<string, string>();
    const colour = (k: string) => {
      if (!k.startsWith('--')) return k;
      let v = cache.get(k);
      if (v === undefined) { v = css.getPropertyValue(k).trim() || '#626977'; cache.set(k, v); }
      return v;
    };
    let t = 0, last = 0, w = 0;
    const draw = (now: number, hold: boolean) => {
      if (!hold) t += Math.max(0, Math.min(0.1, (now - last) / 1000));
      last = now;
      if (!w) return;
      const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1), h = (w * VIEW_H) / VIEW_W;
      const pw = Math.round(w * dpr), ph = Math.round(h * dpr);
      if (el.width !== pw || el.height !== ph) { el.width = pw; el.height = ph; }
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, pw, ph);
      const k = (dpr * w) / VIEW_W;
      ctx.setTransform(k, 0, 0, k, 0, 0);
      paint(ctx, t, scanRef.current, colour);
    };
    const ticker = makeTicker((now) => draw(now, false));
    const start = () => { last = performance.now() - FRAME_MS; ticker.start(); };
    const redraw = () => { ticker.stop(); draw(performance.now(), true); };
    api.current = { redraw, start };
    const ro = new ResizeObserver(() => { w = el.clientWidth; if (!runningRef.current) redraw(); });
    ro.observe(el);
    w = el.clientWidth;
    if (runningRef.current) start(); else redraw();
    return () => { ticker.stop(); ro.disconnect(); api.current = { redraw: () => {}, start: () => {} }; };
  }, []);
  useEffect(() => { scanRef.current = scan; if (!runningRef.current) api.current.redraw(); }, [scan]);
  useEffect(() => { runningRef.current = running; if (running) api.current.start(); else api.current.redraw(); }, [running]);
  return canvasRef;
}

export function GateNumbers({ lit }: { lit: readonly number[] }) {
  return (
    <div aria-hidden="true" className="relative h-[18px]">
      {GATES.map((g) => (
        <span key={g.n} style={{ left: `${(g.x / 10).toFixed(2)}%` }}
          className={cx('absolute top-0 -translate-x-1/2 font-mono text-[11px] tabular-nums transition-colors duration-300', lit.includes(g.n) ? 'font-semibold text-accent' : 'text-ink-3')}>{g.n}</span>
      ))}
    </div>
  );
}

export function GateBand({ lit, label }: { lit: readonly number[]; label: string }) {
  // Footer "Pause motion" (WCAG 2.2.2), reduced motion, a hidden tab or the band off screen all hold the frame.
  const { ref, running, loopProps } = useLoopGate<HTMLDivElement>();
  const canvasRef = useBandCanvas(running, lit.length === 0);
  return (
    <>
      <div ref={ref} {...loopProps} className="relative">
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label={label} className="block h-auto w-full overflow-hidden">
          {GATES.map((g) => (
            <g key={g.n}>
              <line x1={g.x} x2={g.x} y1={4} y2={80} stroke="var(--line-strong)" strokeWidth={1} />
              <line className="rp-lit" x1={g.x} x2={g.x} y1={4} y2={80} stroke="var(--accent)" strokeWidth={2} style={{ opacity: lit.includes(g.n) ? 1 : 0 }} />
            </g>
          ))}
        </svg>
        <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 block h-full w-full" />
      </div>
      <GateNumbers lit={lit} />
    </>
  );
}

/** The twelve-segment strip (sidebar and phone bar). */
export function GateStrip({ lit, className }: { lit: readonly number[]; className?: string }) {
  return (
    <div aria-hidden="true" className={cx('grid grid-cols-12 gap-[3px]', className)}>
      {GATES.map((g) => <span key={g.n} className={cx('rp-seg h-1 rounded-full', lit.includes(g.n) ? 'bg-accent' : 'bg-line-strong')} />)}
    </div>
  );
}
