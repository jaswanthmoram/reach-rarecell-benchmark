import { useEffect, useRef, useState } from 'react';
import { DATASETS_DATA, GLOBAL_STATS } from '../../data/benchmarkData';
import { Button, Container, LiveHero, fmt, type LiveLayout } from '../../ui';
import { SlotMark } from './Compare';
import { focusHandlers, getFocusCohort, subscribeFocus, useFocusCohort } from './focus';
import { pct } from './model';
import { CohortGlyph } from './parts';

/* ---------- Plate geometry: ten wells, largest cohort first (the catalogue's default sort) ---------- */
const WELLS = [...DATASETS_DATA].sort((a, b) => b.cellsNum - a.cellsNum);
/** Dot scale. Density is drawn to scale: one dot is the same number of cells in every well. */
const CELLS_PER_DOT = { wide: 250, narrow: 500 } as const;
const NARROW_WELL = 40; // px radius below which the plate switches to the coarser scale
const FOUND_EVERY = 1.4; // s per well for the cobalt "found" ring
const EASE = 0.16; // per-frame approach toward the lit state (~250ms at 60fps)

/** Far layer: a sparse, slow drift of cells behind the plate. */
const FAR_FIELD: LiveLayout = (r) => Array.from({ length: 320 }, () => ({ x: r(), y: r(), r: 0.5 + r() * 0.9, vx: 0.003 + r() * 0.006 }));

const mulberry = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
type Dot = { a: number; d: number; ph: number };
/** Unit-disk positions, uniform by area, deterministic per cohort. */
const dotsFor = (n: number, seed: number): Dot[] => {
  const r = mulberry(seed);
  return Array.from({ length: n }, () => ({ a: r() * Math.PI * 2, d: Math.sqrt(r()) * 0.84, ph: r() * Math.PI * 2 }));
};

/** Signal dots: the cohort's CNV-set positive share of its dots (at least one when any cell is positive). */
const signalCount = (d: (typeof WELLS)[number], n: number) =>
  d.cnvCells && d.cnvPos ? Math.max(1, Math.round((n * d.cnvPos) / d.cnvCells)) : 0;
const SIGNAL_WELLS = WELLS.flatMap((d, i) => (d.cnvCells ? [i] : []));

type Props = { pair: string[]; onToggle: (id: string) => void; onCompare: () => void; onEvidence: () => void };

/**
 * Datasets hero. Two live layers: a far drift of cells (shared LiveField) and a specimen plate drawn on one canvas,
 * one well per cohort, with dot density at true scale. A cohort hovered anywhere on the page (catalogue, specimen
 * cards, compare picker) lights its well; clicking a well adds it to the comparison as cohort A or B.
 */
export default function SpecimenHero({ pair, onToggle, onCompare, onEvidence }: Props) {
  const g = GLOBAL_STATS;
  return (
    <LiveHero layout={FAR_FIELD} seed={11} intensity={0.6} className="bg-canvas">
      <Container className="grid gap-8 py-8 md:grid-cols-[minmax(0,1fr)_minmax(0,500px)] md:items-center md:gap-10 md:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:gap-14">
        <div className="rise min-w-0 max-w-[600px]">
          <p className="label mb-3">Table 2a · GEO and GSA accessions</p>
          <h1 className="balance text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] text-ink md:text-[2.5rem]">Ten public cohorts, one labelling rule</h1>
          <p className="mt-3 max-w-[58ch] text-base leading-relaxed text-ink-2">
            {g.solidCohorts} solid tumours and {g.hematologicCohorts} blood or circulating-tumour-cell cohorts, {g.totalCells} cells in all.
            A cell is labelled malignant only when four independent evidence arms agree.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button size="sm" icon="scales" onClick={onCompare}>Compare two cohorts</Button>
            <Button size="sm" variant="secondary" iconRight="arrow-right" onClick={onEvidence}>How labels are built</Button>
          </div>
        </div>
        <Plate pair={pair} onToggle={onToggle} />
      </Container>
    </LiveHero>
  );
}

/* ---------- The specimen plate ---------- */
function Plate({ pair, onToggle }: { pair: string[]; onToggle: (id: string) => void }) {
  const focus = useFocusCohort();
  const [scale, setScale] = useState<number>(CELLS_PER_DOT.wide);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const slotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const pairRef = useRef(pair);
  const repaintRef = useRef<() => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let dpr = 1, raf = 0, visible = true, cellsPerDot: number = CELLS_PER_DOT.wide;
    let geo: { x: number; y: number; r: number }[] = [];
    let dots: Dot[][] = [];
    const lit = WELLS.map(() => 0); // eased 0..1 per well
    let col = { cell: '#626977', ink: '#0e1116', signal: '#ff5a1f', accent: '#2f5bea' };
    const t0 = performance.now();

    const readColors = () => {
      const cs = getComputedStyle(canvas);
      const v = (n: string, f: string) => cs.getPropertyValue(n).trim() || f;
      col = { cell: v('--ink-3', col.cell), ink: v('--ink', col.ink), signal: v('--signal', col.signal), accent: v('--accent', col.accent) };
    };
    const measure = () => {
      dpr = Math.min(2, devicePixelRatio || 1);
      const box = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(box.width * dpr));
      canvas.height = Math.max(1, Math.round(box.height * dpr));
      geo = slotRefs.current.map((el) => {
        const b = el?.getBoundingClientRect();
        return b ? { x: b.left - box.left + b.width / 2, y: b.top - box.top + b.height / 2, r: b.width / 2 } : { x: 0, y: 0, r: 0 };
      });
      const next = (geo[0]?.r ?? 0) < NARROW_WELL ? CELLS_PER_DOT.narrow : CELLS_PER_DOT.wide;
      if (next !== cellsPerDot || dots.length === 0) {
        cellsPerDot = next;
        dots = WELLS.map((d, i) => dotsFor(Math.max(1, Math.round(d.cellsNum / cellsPerDot)), 97 + i * 31));
        setScale(next);
      }
    };

    const draw = (now: number) => {
      const t = reduce ? 0 : (now - t0) / 1000;
      const hot = getFocusCohort();
      const anyLit = hot !== null || pairRef.current.length > 0;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const found = SIGNAL_WELLS[Math.floor(t / FOUND_EVERY) % SIGNAL_WELLS.length];

      WELLS.forEach((d, i) => {
        const g = geo[i]; if (!g || g.r === 0) return;
        const target = d.id === hot || pairRef.current.includes(d.id) ? 1 : 0;
        lit[i] = reduce ? target : lit[i] + (target - lit[i]) * EASE;
        const k = lit[i];
        const dim = anyLit ? 1 - k : 0;
        // A slow breathing drift; a lit well's cells turn gently, like a slide under the stage.
        const spin = t * 0.05 + k * t * 0.12;
        const dotR = Math.max(0.8, g.r * 0.021) * (1 + 0.15 * k);
        const pos = (p: Dot) => {
          const a = p.a + spin * (1 - p.d * 0.5) + Math.sin(t * 0.7 + p.ph) * 0.02;
          const rr = (p.d + Math.sin(t * 0.9 + p.ph * 1.7) * 0.012) * g.r;
          return [g.x + Math.cos(a) * rr, g.y + Math.sin(a) * rr] as const;
        };
        const pts = dots[i];
        const nSig = signalCount(d, pts.length);
        ctx.fillStyle = k > 0.5 ? col.ink : col.cell;
        ctx.globalAlpha = 0.78 - 0.48 * dim + 0.12 * k;
        for (let j = nSig; j < pts.length; j++) { const [x, y] = pos(pts[j]); ctx.beginPath(); ctx.arc(x, y, dotR, 0, Math.PI * 2); ctx.fill(); }
        // Signal cells: the CNV-set positive share of this cohort (Table 9b), pulsing.
        ctx.fillStyle = col.signal; ctx.globalAlpha = 1 - 0.55 * dim;
        for (let j = 0; j < nSig; j++) {
          const [x, y] = pos(pts[j]);
          const pulse = reduce ? 1 : 1 + 0.25 * Math.sin(t * 3 + j * 1.3);
          ctx.beginPath(); ctx.arc(x, y, Math.max(1.6, dotR * 1.7) * pulse, 0, Math.PI * 2); ctx.fill();
        }
        // One well at a time is "found": a cobalt ring closes on its first signal cell.
        const ringOn = nSig > 0 && (reduce ? k > 0.5 : (hot ? d.id === hot : i === found));
        if (ringOn) {
          const [sx, sy] = pos(pts[0]);
          const q = reduce ? 1 : Math.min(1, ((t % FOUND_EVERY) / FOUND_EVERY) * 2.2);
          ctx.strokeStyle = col.accent; ctx.lineWidth = 1.2;
          ctx.globalAlpha = reduce ? 0.9 : 1 - Math.max(0, q - 0.85) * 4;
          ctx.beginPath(); ctx.arc(sx, sy, g.r * 0.42 - g.r * 0.28 * q, 0, Math.PI * 2); ctx.stroke();
        }
      });
      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => { if (visible && !document.hidden) draw(now); raf = requestAnimationFrame(loop); };
    readColors(); measure();
    if (reduce) draw(performance.now()); else raf = requestAnimationFrame(loop);

    const redrawStill = () => { if (reduce) draw(performance.now()); };
    const ro = new ResizeObserver(() => { measure(); redrawStill(); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(canvas);
    const mo = new MutationObserver(() => { readColors(); redrawStill(); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    // Under reduced motion there is no loop, so focus and pair changes repaint the still frame directly.
    repaintRef.current = redrawStill;
    const unsub = reduce ? subscribeFocus(redrawStill) : () => {};
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); mo.disconnect(); unsub(); };
  }, []);

  useEffect(() => { pairRef.current = pair; repaintRef.current(); }, [pair]);

  return (
    <figure className="rise relative min-w-0 rounded-card border border-line bg-surface/80 p-3 backdrop-blur-[2px] [animation-delay:80ms] sm:p-4">
      <figcaption className="mb-2 flex items-baseline justify-between gap-3 font-mono text-[11px] text-ink-2">
        <span className="whitespace-nowrap uppercase tracking-[0.06em]">Specimen plate</span>
        <span className="whitespace-nowrap tabular">1 dot ≈ {fmt.int(scale)} cells<span className="hidden sm:inline"> · to scale</span></span>
      </figcaption>
      <div className="relative">
        <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 h-full w-full" />
        <ul className="grid grid-cols-5 gap-x-1.5 gap-y-1.5 sm:gap-x-3" aria-label="Cohorts, largest first. Select up to two to compare.">
          {WELLS.map((d, i) => {
            const slot = pair.indexOf(d.id);
            const on = slot !== -1;
            const hot = focus === d.id || on;
            return (
              <li key={d.id} className="min-w-0">
                <button type="button" aria-pressed={on} onClick={() => onToggle(d.id)} {...focusHandlers(d.id)}
                  aria-label={`${d.id}, ${d.cancerType}, ${fmt.int(d.cellsNum)} cells, ${d.cnvCells && d.cnvPos !== undefined ? `CNV set ${pct(d.cnvPos, d.cnvCells)} positive` : 'no CNV set'}. ${on ? `Cohort ${'AB'[slot]} in the comparison` : 'Add to the comparison'}`}
                  className="group flex w-full min-w-0 flex-col items-center rounded-chip px-0.5 pb-1 pt-1 text-center outline-offset-2">
                  <span ref={(el) => { slotRefs.current[i] = el; }}
                    className={`relative block aspect-square w-full max-w-[72px] rounded-full border bg-sunk transition-[border-color,transform] duration-200 [transition-timing-function:var(--ease-out)] ${hot ? 'scale-[1.04] border-accent' : d.cnvCells ? 'border-line-strong group-hover:border-ink/40' : 'border-dashed border-line-strong group-hover:border-ink/40'}`}>
                    {on && (
                      <span className="absolute -right-1 -top-1 z-20 inline-flex items-center gap-0.5 rounded-chip border border-line bg-surface px-1 font-mono text-[11px] leading-4 text-ink">
                        <SlotMark slot={slot as 0 | 1} size={7} />{'AB'[slot]}
                      </span>
                    )}
                  </span>
                  <span className={`mt-1.5 flex max-w-full items-center gap-1 font-mono text-[11px] leading-4 transition-colors duration-150 ${hot ? 'text-ink' : 'text-ink-2'}`}>
                    <span className="hidden sm:inline-flex"><CohortGlyph id={d.id} size={12} className={hot ? 'text-ink' : ''} /></span>
                    <span className="truncate">{d.id.split('_')[0]}</span>
                  </span>
                  <span className="font-mono text-[11px] leading-4 text-ink-3 tabular">{compact(d.cellsNum)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <p className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-line pt-2 font-mono text-[11px] text-ink-2">
        <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="size-1.5 rounded-full bg-signal" />CNV-set positive share</span>
        <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="size-2 rounded-full border border-dashed border-ink-3" />no CNV set</span>
        <span className="hidden sm:inline">Click a well to compare</span>
      </p>
    </figure>
  );
}

/** 123,488 → "123k"; small counts stay exact. */
const compact = (n: number) => (n >= 10000 ? `${Math.round(n / 1000)}k` : fmt.int(n));

