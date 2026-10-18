import { useEffect, useRef } from 'react';
import { TrackChip } from '../../ui';
import { LETTERS, SHORT, TRACKS, letterOf, nb } from './model';

/**
 * Hero stage: six live lanes, one per track, each moving the way its track behaves.
 * A spike-ins (a few rare cells inside real background), B synthetic (a jittering simulated lattice), C null (nothing to
 * find: the scan ring misses), D natural blood (sparse clumps, slow), E label noise (labels flicker), F same lineage
 * (one trajectory, rare cells barely different). The selected track's lane takes focus; the others dim (alpha
 * crossfade inside the canvas). Paused off-screen and in hidden tabs; one static frame under reduced motion.
 * ponytail: page-local renderer because the shared LiveField has one behaviour for all lanes.
 */

/** What each lane is doing, in one line, shown under the stage for the focused track. */
const NOTE: Record<string, string> = {
  A: 'Real malignant cells spiked into real tumour backgrounds, 5–10% down to 0.01–0.1%.',
  B: 'Splatter-simulated cells: a fitted lattice with synthetic noise.',
  C: 'Background only. There is nothing to find, so a pass is a miss.',
  D: 'Natural blood and CTC samples at their own prevalence.',
  E: 'Training labels flipped both ways: hidden positives, background marked positive.',
  F: 'Malignant and normal cells from one lineage, nearly identical.',
};

type Cell = { x: number; y: number; r: number; ph: number; kind: 0 | 1 | 2 }; // 0 cell · 1 rare cell · 2 flipping label
const SPEED = [0.018, 0.012, 0.011, 0.007, 0.015, 0.009];

const rng = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r());

/** Cells per lane in lane space: x 0..1 (wraps), y -0.5..0.5 of the lane height. */
function buildLanes(): Cell[][] {
  const r = rng(20260818);
  const cell = (x: number, y: number, rr: number, kind: Cell['kind'] = 0): Cell => ({ x, y: Math.max(-0.42, Math.min(0.42, y)), r: rr, ph: r() * Math.PI * 2, kind });
  const A = [...Array.from({ length: 150 }, () => cell(r(), gauss(r) * 0.16, 0.8 + r())),
    ...[0.22, 0.24, 0.235, 0.71].map((x, i) => cell(x, (i - 1.5) * 0.08, 2.4, 1))];
  const B: Cell[] = [];
  for (let c = 0; c < 36; c++) for (let row = 0; row < 4; row++) B.push(cell(c / 36 + 0.007 * gauss(r), -0.27 + row * 0.18, 1.1));
  B.push(cell(0.43, 0.09, 2.4, 1), cell(0.88, -0.09, 2.4, 1));
  const C = Array.from({ length: 140 }, () => cell(r(), gauss(r) * 0.17, 0.8 + r()));
  const D: Cell[] = [];
  for (let k = 0; k < 9; k++) { const cx = k / 9 + r() * 0.05, cy = gauss(r) * 0.12; for (let i = 0; i < 6 + Math.floor(r() * 6); i++) D.push(cell(cx + gauss(r) * 0.012, cy + gauss(r) * 0.07, 0.9 + r() * 0.9)); }
  D.push(cell(0.31, 0.2, 2.4, 1), cell(0.79, -0.18, 2.4, 1));
  const E = [...Array.from({ length: 130 }, () => cell(r(), gauss(r) * 0.16, 0.8 + r())),
    ...[0.12, 0.5, 0.83].map((x) => cell(x, gauss(r) * 0.12, 2.4, 1)),
    ...Array.from({ length: 7 }, (_, i) => cell(0.05 + i * 0.14 + r() * 0.04, gauss(r) * 0.15, 2, 2))];
  const F = Array.from({ length: 170 }, (_, i) => { const x = i / 170; return cell(x, Math.sin(x * Math.PI * 2.4) * 0.2 + gauss(r) * 0.045, 1 + r() * 0.5, i % 41 === 7 ? 1 : 0); });
  return [A, B, C, D, E, F];
}

type Colors = { cell: string; signal: string; accent: string; line: string };

export function TrackLanes({ active, onSelect }: { active: string; onSelect: (l: string) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const focus = useRef(LETTERS.indexOf(active));
  const redraw = useRef<() => void>(() => {});

  useEffect(() => { focus.current = LETTERS.indexOf(active); redraw.current(); }, [active]);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const lanes = buildLanes();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const alpha = LETTERS.map((_, i) => (i === focus.current ? 1 : 0.3));
    let w = 0, h = 0, raf = 0, visible = true, last = performance.now();
    const t0 = last;
    let c: Colors = { cell: '#626977', signal: '#ff5a1f', accent: '#2f5bea', line: '#e2e4e8' };

    const readColors = () => {
      const cs = getComputedStyle(canvas);
      const v = (n: string, d: string) => cs.getPropertyValue(n).trim() || d;
      c = { cell: v('--ink-3', c.cell), signal: v('--signal', c.signal), accent: v('--accent', c.accent), line: v('--line-strong', c.line) };
    };
    const resize = () => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr)); canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const dot = (x: number, y: number, r: number) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };
    const ring = (x: number, y: number, r: number, dashed = false) => {
      ctx.setLineDash(dashed ? [3, 3] : []); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    };

    const draw = (now: number) => {
      // rAF timestamps can precede t0 on the first frame; clamp so step indices never go negative.
      const t = reduce ? 2.2 : Math.max(0, now - t0) / 1000;
      const dt = Math.min(0.1, Math.max(0, now - last) / 1000); last = now;
      const k = reduce ? 1 : 1 - Math.exp(-dt / 0.09); // ~250ms crossfade
      ctx.clearRect(0, 0, w, h);
      const lh = h / 6;
      lanes.forEach((cells, l) => {
        const on = l === focus.current;
        alpha[l] += ((on ? 1 : 0.3) - alpha[l]) * k;
        const a = alpha[l], cy = lh * (l + 0.5), sx = (x: number) => (((x + t * SPEED[l]) % 1) + 1) % 1 * w;
        // Focus band and lane hairline.
        ctx.globalAlpha = (a - 0.3) * 0.1; ctx.fillStyle = c.accent; ctx.fillRect(0, lh * l, w, lh);
        ctx.globalAlpha = 0.5; ctx.fillStyle = c.line; if (l) ctx.fillRect(0, Math.round(lh * l), w, 1);
        const rare: [number, number][] = [];
        for (const p of cells) {
          let y = cy + p.y * lh;
          if (l === 1) y += Math.sin(t * 2.6 + p.ph) * lh * 0.035; // synthetic jitter
          else y += Math.sin(t * 0.7 + p.ph) * lh * 0.02;
          const x = sx(p.x);
          if (p.kind === 1) { rare.push([x, y]); continue; }
          if (p.kind === 2) { // E: a flipped label fades between background and positive
            const s = reduce ? 0.5 : 0.5 + 0.5 * Math.sin(t * 1.8 + p.ph * 3);
            ctx.globalAlpha = a; ctx.fillStyle = s > 0.5 ? c.signal : c.cell; dot(x, y, p.r * (0.85 + 0.3 * s));
            if (on) { ctx.strokeStyle = c.accent; ctx.lineWidth = 1; ctx.globalAlpha = 0.35 + 0.4 * s; ring(x, y, 6, true); }
            continue;
          }
          ctx.globalAlpha = a * (0.45 + 0.35 * ((p.ph / 6.28) % 1)); ctx.fillStyle = c.cell; dot(x, y, p.r);
        }
        // Rare cells: full signal on A, B, D, E; F's are barely distinguishable from their lineage.
        rare.forEach(([x, y], i) => {
          ctx.globalAlpha = a * (l === 5 ? 0.55 : 1); ctx.fillStyle = c.signal;
          dot(x, y, l === 5 ? 1.6 : 2.4 * (reduce ? 1 : 1 + 0.15 * Math.sin(t * 3 + i)));
        });
        if (!on) return;
        // The search ring: closes on a rare cell (A, B, D, E), misses on C, hesitates on F.
        const cyc = 1.8, step = Math.floor(t / cyc), u = reduce ? 1 : Math.min(1, ((t % cyc) / cyc) * 2.2);
        ctx.strokeStyle = c.accent; ctx.lineWidth = 1.2; ctx.globalAlpha = reduce ? 0.9 : 1 - Math.max(0, u - 0.85) * 4;
        if (l === 2 || l === 5) {
          const p = cells[(step * 37) % cells.length];
          ring(sx(p.x), cy + p.y * lh, 18 - 8 * u, true);
        } else if (rare.length) {
          const [x, y] = rare[step % rare.length];
          ring(x, y, 20 - 12 * u);
        }
      });
      ctx.globalAlpha = 1;
    };
    /* Draw at once on focus, resize and theme change: resizing clears the bitmap, and a paused loop must not leave it blank. */
    redraw.current = () => draw(performance.now());

    const loop = (now: number) => { if (visible && !document.hidden) draw(now); else last = now; raf = requestAnimationFrame(loop); };
    readColors(); resize();
    if (reduce) draw(performance.now()); else raf = requestAnimationFrame(loop);
    const ro = new ResizeObserver(() => { resize(); redraw.current(); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(canvas);
    const mo = new MutationObserver(() => { readColors(); redraw.current(); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); mo.disconnect(); };
  }, []);

  const t = TRACKS[LETTERS.indexOf(active)] ?? TRACKS[0];
  return (
    <figure className="rise overflow-hidden rounded-card border border-line bg-canvas/85 [animation-delay:80ms]">
      <div className="relative h-[216px] md:h-[252px]">
        <canvas ref={ref} aria-hidden="true" className="absolute inset-y-0 left-11 right-0 block h-full w-[calc(100%-2.75rem)]" />
        <div className="absolute inset-y-0 left-0 grid w-11 grid-rows-6 border-r border-line">
          {TRACKS.map((tr) => {
            const l = letterOf(tr), on = l === active;
            return (
              <button key={l} type="button" aria-pressed={on} onClick={() => onSelect(l)} aria-label={`Show Track ${l}: ${SHORT[l]}`}
                className="group grid place-items-center focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent">
                <TrackChip letter={l} className={`transition-colors duration-150 ${on ? 'border-accent text-accent' : 'text-ink-2 group-hover:border-ink/40 group-hover:text-ink'}`} />
              </button>
            );
          })}
        </div>
      </div>
      <figcaption className="flex min-h-12 flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-line bg-surface/80 px-4 py-2.5">
        <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink">{t.code} · {nb(SHORT[active])}</span>
        <span className="text-xs leading-snug text-ink-2">{NOTE[active]}</span>
      </figcaption>
    </figure>
  );
}
