// The Docs live element: cells stream left to right through the twelve pipeline phase gates, thinning and
// sorting into lanes as they pass. The gates of the section in view light up (scroll-spy, see Docs.tsx), and
// cells crossing a lit gate turn accent for a moment. Outside the pipeline (setup, troubleshooting) a slow
// scan walks the gates instead. Page-local because the shared LiveField has no external "lit" state.
// ponytail: plain 2D canvas, ~520 cells; same ceiling as LiveField (move to WebGL past ~6k).
import { useEffect, useRef } from 'react';
import { PHASES } from './phases';

const GATE_FIRST = 0.1;
const GATE_STEP = 0.0727; // twelve gates from 10% to 90% of the width
const gateX = (i: number): number => GATE_FIRST + i * GATE_STEP;
const LANES = [0.2, 0.36, 0.64, 0.8] as const;
const SPEED = 0.022; // unit widths per second: ~45 s to cross
const SCAN_STEP = 0.7; // seconds per gate in scan mode
const EASE_RATE = 9; // gate light easing per second (~250 ms to settle)

type Cell = { p: number; lane: number; row: number; sy: number; die: number; r: number; shade: number; ph: number; signal: boolean };

const rand = (() => { let s = 20260; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
const gauss = () => Math.sqrt(-2 * Math.log(rand() + 1e-9)) * Math.cos(2 * Math.PI * rand());

function makeCells(n: number): Cell[] {
  const cells: Cell[] = [];
  for (let i = 0; i < n; i++) {
    cells.push({
      p: rand(), lane: Math.floor(rand() * 4), row: rand() < 0.5 ? -1 : 1, sy: 0.5 + gauss() * 0.22,
      die: rand() < 0.45 ? 99 : Math.floor(rand() * 12), r: 0.8 + rand() * 1.1, shade: rand(), ph: rand() * Math.PI * 2, signal: false,
    });
  }
  for (let i = 0; i < 6; i++) cells.push({ p: i / 6 + rand() * 0.05, lane: 0, row: 0, sy: 0.5 + gauss() * 0.2, die: 99, r: 2.3, shade: 1, ph: rand() * 6, signal: true });
  return cells;
}

const smooth = (x: number) => { const k = Math.min(1, Math.max(0, x)); return k * k * (3 - 2 * k); };

export function GateBand({ gates, className = '' }: { gates: readonly number[]; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const litRef = useRef<readonly number[]>(gates);
  const redrawRef = useRef<() => void>(() => {});

  useEffect(() => { litRef.current = gates; redrawRef.current(); }, [gates]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0, raf = 0, visible = true, last = performance.now(), t = 0;
    let cells: Cell[] = [];
    const level = new Float32Array(12);
    let col = { cell: '#626977', ink: '#0e1116', gate: '#cdd1d8', accent: '#2f5bea', signal: '#ff5a1f' };

    const readColors = () => {
      const cs = getComputedStyle(canvas);
      const v = (name: string, fb: string) => cs.getPropertyValue(name).trim() || fb;
      col = { cell: v('--ink-3', col.cell), ink: v('--ink', col.ink), gate: v('--line-strong', col.gate), accent: v('--accent', col.accent), signal: v('--signal', col.signal) };
    };
    const resize = () => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr)); canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cells = makeCells(Math.round(Math.min(560, Math.max(220, w * 0.75))));
    };

    const targets = (): Float32Array => {
      const out = new Float32Array(12);
      const lit = litRef.current;
      if (lit.length) lit.forEach((n) => { out[n - 1] = 1; });
      else if (!reduce) out[Math.floor(t / SCAN_STEP) % 12] = 0.7;
      return out;
    };

    const draw = (dt: number) => {
      const goal = targets();
      for (let i = 0; i < 12; i++) level[i] = reduce ? goal[i] : level[i] + (goal[i] - level[i]) * Math.min(1, dt * EASE_RATE);
      ctx.clearRect(0, 0, w, h);

      // Gates: hairlines, lit ones in accent.
      for (let i = 0; i < 12; i++) {
        const x = Math.round(gateX(i) * w) + 0.5;
        ctx.globalAlpha = 1; ctx.lineWidth = 1; ctx.strokeStyle = col.gate;
        ctx.beginPath(); ctx.moveTo(x, h * 0.06); ctx.lineTo(x, h * 0.94); ctx.stroke();
        if (level[i] > 0.02) {
          ctx.globalAlpha = level[i]; ctx.strokeStyle = col.accent; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(x, h * 0.06); ctx.lineTo(x, h * 0.94); ctx.stroke();
        }
      }

      const glow = 7 / Math.max(1, w); // half-width of the "crossing a lit gate" window, in unit space
      for (const c of cells) {
        if (!reduce) c.p += dt * SPEED * (c.signal ? 1.08 : 1);
        if (c.p > 1) { c.p -= 1; c.sy = 0.5 + gauss() * 0.22; }
        const x = c.p;
        const passed = Math.floor((x - GATE_FIRST) / GATE_STEP) + 1; // gates already crossed
        let alpha = c.signal ? 1 : 0.28 + 0.5 * c.shade;
        if (passed > c.die) alpha *= Math.max(0, 1 - (x - gateX(c.die)) / (GATE_STEP * 0.6));
        if (x < GATE_FIRST) alpha *= 0.35 + 0.65 * (x / GATE_FIRST);
        if (alpha <= 0.01) continue;
        const order = smooth((x - 0.04) / 0.8);
        const home = c.signal ? 0.5 : LANES[c.lane] + c.row * 0.035;
        const wobble = reduce ? 0 : Math.sin(t * 0.8 + c.ph) * 0.012 * (1 - order);
        const y = c.sy + (home - c.sy) * order + wobble;
        const nearest = Math.round((x - GATE_FIRST) / GATE_STEP);
        const hot = nearest >= 0 && nearest < 12 && Math.abs(x - gateX(nearest)) < glow ? level[nearest] : 0;
        ctx.globalAlpha = Math.min(1, alpha + hot * 0.5);
        ctx.fillStyle = c.signal ? col.signal : hot > 0.3 ? col.accent : c.shade > 0.72 ? col.ink : col.cell;
        ctx.beginPath(); ctx.arc(x * w, y * h, c.r * (1 + hot * 0.35), 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (visible && !document.hidden) { t += dt; draw(dt); }
      raf = requestAnimationFrame(loop);
    };
    // A still frame is drawn up front and after every resize, so a band that starts off-screen (the phase map
    // further down) is never an empty box while the loop is paused; the loop then only runs while visible.
    readColors(); resize(); draw(0);
    if (!reduce) raf = requestAnimationFrame(loop);
    redrawRef.current = () => { if (reduce || !visible) draw(0); };

    const ro = new ResizeObserver(() => { resize(); draw(0); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(canvas);
    const mo = new MutationObserver(() => { readColors(); draw(0); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); mo.disconnect(); redrawRef.current = () => {}; };
  }, []);

  return (
    <div className={className}>
      <canvas ref={canvasRef} aria-hidden="true" className="block h-[72px] w-full sm:h-20" />
      <div aria-hidden="true" className="relative h-5">
        {PHASES.map((p, i) => {
          const on = gates.includes(p.n);
          return (
            <span key={p.n} style={{ left: `${(gateX(i) * 100).toFixed(2)}%` }}
              className={`absolute top-0 -translate-x-1/2 font-mono text-[11px] tabular-nums transition-colors duration-300 ${on ? 'font-medium text-accent' : 'text-ink-3'}`}>
              {p.n}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/** Twelve-segment phase strip for the sticky chrome (sidebar, mobile jump bar): the same lit gates, no motion. */
export function GateStrip({ gates, className = '' }: { gates: readonly number[]; className?: string }) {
  return (
    <div aria-hidden="true" className={`flex gap-[3px] ${className}`}>
      {PHASES.map((p) => (
        <span key={p.n} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${gates.includes(p.n) ? 'bg-accent' : 'bg-line-strong'}`} />
      ))}
    </div>
  );
}
