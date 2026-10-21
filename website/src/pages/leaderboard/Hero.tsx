import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { fmt } from '../../lib/format';
import { scrollToId } from '../../lib/router';
import { PageHeader } from '../../ui/PageHeader';
import { ArrowRight, ICON_STROKE } from '../../ui/icons';
import { useDrawIn, useMotionPaused } from '../../ui/motion';
import { useLoopGate } from '../../ui/motion/useLoopGate';
import { AP_MAX, AP_TICKS, BOARD_ORDER, RANKED_COUNT, REFERENCE_ROWS, UNRANKED_COUNT, fdrOf, pairOf, type Row, INTERVAL_DRAW_IN } from './model';
import { RefKey } from './parts';

/** Deterministic PRNG so the decorative dots never shift between renders. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NUM_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const word = (n: number) => NUM_WORDS[n] ?? String(n);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------- Background field: scattered graphite cells drifting. No vermilion here: the rare-cell signal stays inside the chart. ---------- */
const FIELD = (() => {
  const r = rng(7);
  return Array.from({ length: 300 }, () => ({ x: r() * 1440, y: r() * 420, rad: 0.6 + r() * 0.9, o: 0.25 + r() * 0.35 }));
})();
const FIELD_FADE = 'linear-gradient(90deg, var(--canvas) 0%, color-mix(in srgb, var(--canvas) 88%, transparent) 38%, transparent 70%)';

function Field() {
  // Off-screen, hidden tab or "Pause motion": the field holds its frame (data-loop="hold").
  const { ref, loopProps } = useLoopGate<SVGSVGElement>();
  return (
    <div aria-hidden="true" className="absolute inset-0">
      <svg ref={ref} viewBox="0 0 1440 420" preserveAspectRatio="xMidYMid slice" {...loopProps} className="lb-field absolute inset-0 h-full w-full">
        <g className="lb-drift loop" fill="var(--cell)">
          {FIELD.map((c, i) => <circle key={i} cx={c.x.toFixed(0)} cy={c.y.toFixed(0)} r={c.rad.toFixed(1)} opacity={c.o.toFixed(2)} />)}
        </g>
      </svg>
      <div className="absolute inset-0 max-lg:opacity-90" style={{ background: FIELD_FADE }} />
    </div>
  );
}

/* ---------- Figure 4a forest plot, laid out at the card's real pixel width ---------- */
const H = 268;
const ROW_Y0 = 59.7;
const ROW_STEP = 31.32;
const PLOT_TOP = 38;
const PLOT_BOTTOM = 244;
const DOTS = 22;
/** Two resample loops (2 x 2.6 s), then the draws settle to a faint static scatter (audit: motion on a chart). */
const RESAMPLE_MS = 5400;

const RANKED = BOARD_ORDER.filter((r) => r.band === 'ranked');
const CEILING = BOARD_ORDER.find((r) => r.band === 'ceiling');

interface Geometry { w: number; x0: number; x1: number; x: (v: number) => number }
/** Names start at 16 px; "scMalignantFinder" needs about 115 px of 11 px mono, so the axis starts after it. */
function geometry(w: number): Geometry {
  const x0 = w < 440 ? 136 : 150;
  const x1 = w - 12;
  return { w, x0, x1, x: (v) => x0 + Math.max(0, Math.min(1, v / AP_MAX)) * (x1 - x0) };
}

function ForestRow({ row, i, g, resample }: { row: Row; i: number; g: Geometry; resample: boolean }) {
  const cy = ROW_Y0 + i * ROW_STEP;
  const lo = g.x(row.m.bootAPLow ?? row.m.bootstrapMeanAP);
  const hi = g.x(row.m.bootAPHigh ?? row.m.bootstrapMeanAP);
  const mx = g.x(row.m.bootstrapMeanAP);
  const r = rng(101 + i * 17);
  return (
    <g>
      <text x="0" y={cy + 4} fill="var(--ink-2)">{row.rank}</text>
      <text x="16" y={cy + 4} fill="var(--ink)">{row.name}</text>
      <g data-ci data-ox={mx.toFixed(1)} data-oy={cy.toFixed(1)}>
        <rect x={lo} y={cy - 12} width={Math.max(hi - lo, 1)} height="24" fill={row.color} opacity="0.08" />
        {Array.from({ length: DOTS }, (_, k) => (
          <circle key={k} className={resample ? 'lb-rs lb-rs-run' : 'lb-rs'} cx={(lo + r() * (hi - lo)).toFixed(1)} cy={(cy - 8 + r() * 16).toFixed(1)} r="1.7" fill={row.color}
            style={{ animationDelay: `-${(r() * 2.6).toFixed(2)}s` }} />
        ))}
        <path d={`M${lo} ${cy}H${hi}M${lo} ${cy - 5}V${cy + 5}M${hi} ${cy - 5}V${cy + 5}`} stroke={row.color} strokeWidth="1.5" fill="none" />
      </g>
      <circle data-ci-dot cx={mx} cy={cy} r="4.5" fill={row.color} />
    </g>
  );
}

function Forest({ w, resample }: { w: number; resample: boolean }) {
  const g = geometry(w);
  const ref = useRef<SVGSVGElement>(null);
  useDrawIn(ref, { ...INTERVAL_DRAW_IN, start: 'top 95%' });
  const label = `Forest plot of Track A bootstrap mean AP with 95% intervals: ${RANKED.map((r) => `${r.name} ${fmt.ap(r.m.bootstrapMeanAP)}`).join(', ')}${CEILING ? `; supervised ceiling ${CEILING.name} ${fmt.ap(CEILING.m.bootstrapMeanAP)}, off the 0 to 0.6 axis` : ''}`;
  return (
    <svg ref={ref} viewBox={`0 0 ${w} ${H}`} width={w} height={H} role="img" aria-label={label} className="block font-mono text-[11px]">
      {AP_TICKS.map((t, i) => (
        <g key={t}>
          <line x1={g.x(t)} y1={PLOT_TOP} x2={g.x(t)} y2={PLOT_BOTTOM} stroke="var(--line-strong)" />
          <text x={g.x(t)} y="259" fill="var(--ink-3)" textAnchor={i === 0 ? 'start' : i === AP_TICKS.length - 1 ? 'end' : 'middle'}>{t.toFixed(1)}</text>
        </g>
      ))}
      <line x1={g.x0} y1={PLOT_BOTTOM + 0.5} x2={g.x1} y2={PLOT_BOTTOM + 0.5} stroke="var(--line-strong)" />
      <text x="0" y="259" fill="var(--ink-3)">TRACK A AP</text>
      <g data-ci-ref>
        {REFERENCE_ROWS.map((r) => (
          <line key={r.id} x1={g.x(r.m.bootstrapMeanAP)} y1={PLOT_TOP} x2={g.x(r.m.bootstrapMeanAP)} y2={PLOT_BOTTOM} stroke={r.color} strokeDasharray="3 4" opacity="0.75" />
        ))}
        {CEILING && (
          <g>
            <text x="0" y="22" fill="var(--ink-2)">{CEILING.name}</text>
            <line x1={g.x0} y1="18.5" x2={g.x1 - 58} y2="18.5" stroke={CEILING.color} strokeDasharray="3 4" opacity="0.9" />
            <text x={g.x1 - 10} y="22" fill="var(--ink)" textAnchor="end">{fmt.ap(CEILING.m.bootstrapMeanAP)}</text>
            <path d={`M${g.x1 - 6} 18.5H${g.x1}M${g.x1 - 3} 15.5L${g.x1} 18.5L${g.x1 - 3} 21.5`} stroke="var(--ink-2)" strokeWidth="1.2" fill="none" />
          </g>
        )}
      </g>
      {RANKED.map((r, i) => <ForestRow key={r.id} row={r} i={i} g={g} resample={resample} />)}
    </svg>
  );
}

/** Measures its own content width so the chart is drawn 1:1 (11 px labels stay 11 px on a phone). */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => setW(Math.max(240, Math.round(el.clientWidth)));
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, w };
}

function ForestCard() {
  const { ref, w } = useWidth<HTMLDivElement>();
  const paused = useMotionPaused();
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setSettled(true), RESAMPLE_MS);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <figure className="m-0 min-w-0 rounded-card border border-line bg-surface/90 p-4 backdrop-blur-[2px]">
      <figcaption className="mb-2 flex flex-wrap justify-between gap-x-3 gap-y-0.5 font-mono text-[11px] text-ink-3">
        <span className="uppercase tracking-[0.06em]">95% bootstrap intervals · Figure 4a</span>
        <span>2,000 resamples</span>
      </figcaption>
      <div ref={ref} className="min-w-0">{w != null && <Forest w={w} resample={!paused && !settled} />}</div>
      <RefKey lead="Faint dots: illustrative draws inside each interval. Dashed, bootstrap mean AP:" value={(r) => fmt.ap(r.m.bootstrapMeanAP)} className="mt-2 leading-[1.6]" />
    </figure>
  );
}

const FIRST = RANKED[0];
const vsSmf = fdrOf(pairOf(FIRST.name, 'scMalignantFinder'));
const vsExpr = fdrOf(pairOf(FIRST.name, 'expr_threshold'));
const BTN = 'lb-press lb-btn inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-chip text-sm font-medium text-ink';

export function Hero() {
  return (
    <div className="relative overflow-hidden">
      <Field />
      <PageHeader
        className="relative"
        eyebrow="Track A · primary endpoint"
        title={`${cap(word(RANKED_COUNT))} ranked detectors, ${word(UNRANKED_COUNT)} reference rows`}
        lede={(
          <p className="m-0">
            Ranked by Track A median AP. {FIRST.name} is highest of the {word(RANKED_COUNT)} but not significantly ahead of scMalignantFinder (BH-FDR{' '}
            <b className="font-medium text-ink">{vsSmf?.toFixed(3)}</b>) or the naive expr_threshold baseline (BH-FDR{' '}
            <b className="font-medium text-ink">{vsExpr?.toFixed(3)}</b>).
          </p>
        )}
        actions={(
          <>
            <button type="button" onClick={() => scrollToId('board')} className={`${BTN} border border-line-strong bg-surface px-3.5`}>
              Open the table <ArrowRight size={14} strokeWidth={ICON_STROKE} aria-hidden="true" className="lb-nudge rotate-90" />
            </button>
            <button type="button" onClick={() => scrollToId('pairwise')} className={`${BTN} border-0 bg-transparent px-3`}>
              Pairwise tests
            </button>
          </>
        )}
        art={<ForestCard />}
      />
    </div>
  );
}
