import type { ReactNode } from 'react';
import { fmt } from '../../lib/format';
import { useDrawIn, useDrawSvg } from '../../ui/motion';
import { CEILING_GAP, PAIR_CI, RANK_SHIFT, TRACK_F } from './model';

/* One small chart per finding (audit Home P1): what the number measures, drawn once on view.
 * Strokes (.mc-draw) draw with useDrawSvg, dashed references fade; marks (.mc-dot) fade 30 ms apart. Values are static text. */

const W = 300;
const H = 104;
const X0 = 16;
const X1 = W - 16;
const AXIS_Y = 80;
/** Marks fade in 30 ms apart after the strokes lead by 0.3 s; a mark with `data-from-x` also slides in from that many px. */
const DOTS_IN = {
  selector: '.mc-dot', from: { opacity: 0, x: (_i: number, el: Element) => Number(el.getAttribute('data-from-x') ?? 0) },
  duration: 0.55, stagger: 0.03, delay: 0.3,
};
const lin = (d0: number, d1: number) => (v: number) => X0 + ((v - d0) / (d1 - d0)) * (X1 - X0);

function Chart({ label, caption, children }: { label: string; caption: string; children: ReactNode }) {
  const ref = useDrawSvg<SVGSVGElement>({ selector: '.mc-draw', duration: 0.7, stagger: 0.06 });
  useDrawIn(ref, DOTS_IN);
  return (
    <figure className="m-0 w-full max-w-[360px]">
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="block h-auto w-full font-mono text-[10px]">
        {children}
      </svg>
      <figcaption className="mt-1 font-mono text-[11px] leading-snug text-ink-3">{caption}</figcaption>
    </figure>
  );
}

function Axis({ ticks, x }: { ticks: number[]; x: (v: number) => number }) {
  return (
    <g aria-hidden="true">
      <line className="mc-draw" x1={X0} x2={X1} y1={AXIS_Y} y2={AXIS_Y} stroke="var(--line-strong)" />
      {ticks.map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={AXIS_Y} y2={AXIS_Y + 4} stroke="var(--line-strong)" />
          <text x={x(t)} y={AXIS_Y + 15} textAnchor="middle" fill="var(--ink-3)">{t === 0 || t === 1 ? t.toFixed(0) : t.toFixed(1)}</text>
        </g>
      ))}
    </g>
  );
}

/** 01: the two intervals overlap. */
export function PairChart() {
  const x = lin(0.2, 0.5);
  const [a, b] = PAIR_CI;
  if (!a || !b) return null;
  const lo = Math.max(a.lo, b.lo);
  const hi = Math.min(a.hi, b.hi);
  const rows = [{ r: a, y: 26 }, { r: b, y: 54 }];
  return (
    <Chart caption="Bootstrap mean AP, 95% interval, Track A" label={`Bootstrap mean AP with 95% interval: ${a.name} ${fmt.ap(a.mean)} (${fmt.ap(a.lo)} to ${fmt.ap(a.hi)}), ${b.name} ${fmt.ap(b.mean)} (${fmt.ap(b.lo)} to ${fmt.ap(b.hi)}). The intervals overlap from ${fmt.ap(lo)} to ${fmt.ap(hi)}.`}>
      {hi > lo && <rect className="mc-dot" x={x(lo)} y={12} width={x(hi) - x(lo)} height={56} fill="var(--accent-tint)" rx={2} />}
      {hi > lo && <text className="mc-dot" x={(x(lo) + x(hi)) / 2} y={9} textAnchor="middle" fill="var(--accent-ink)">overlap</text>}
      {rows.map(({ r, y }) => (
        <g key={r.id}>
          <line className="mc-draw" x1={x(r.lo)} x2={x(r.hi)} y1={y} y2={y} stroke={r.color} strokeWidth={r.isRef ? 1.5 : 4}
            strokeOpacity={r.isRef ? 1 : 0.45} strokeLinecap="round" strokeDasharray={r.isRef ? '3 3' : undefined} />
          <circle className="mc-dot" cx={x(r.mean)} cy={y} r={4} fill={r.isRef ? 'var(--surface)' : r.color} stroke={r.color} strokeWidth={1.5}
            strokeDasharray={r.isRef ? '2 2' : undefined} />
          <text className="mc-dot" x={x(r.hi) + 8} y={y + 3.5} fill="var(--ink-2)">{r.name}</text>
        </g>
      ))}
      <Axis ticks={[0.2, 0.3, 0.4, 0.5]} x={x} />
    </Chart>
  );
}

/** 02: Track A rank against Track B rank; off the diagonal means the synthetic rank disagrees. */
export function RankShiftChart() {
  const cell = 8;
  const px = (rank: number) => 30 + (rank - 1) * cell;
  const py = (rank: number) => 8 + (rank - 1) * cell;
  const n = RANK_SHIFT.length;
  const focus = RANK_SHIFT.filter((r) => r.focus);
  const rest = RANK_SHIFT.filter((r) => !r.focus);
  return (
    <Chart caption="Rank on Track A (across) and Track B (down), 1 at top left" label={`Track A rank against Track B rank for ${n} methods. ${focus.map((r) => `${r.name}: Track A ${r.a}, Track B ${r.b}`).join('. ')}.`}>
      <rect x={px(1) - 6} y={py(1) - 6} width={(n - 1) * cell + 12} height={(n - 1) * cell + 12} fill="none" stroke="var(--line)" rx={2} />
      <line className="mc-draw" x1={px(1)} y1={py(1)} x2={px(n)} y2={py(n)} stroke="var(--ink-3)" strokeDasharray="2 3" />
      {focus.map((r) => <line key={`s-${r.id}`} className="mc-draw" x1={px(r.a)} y1={py(r.a)} x2={px(r.a)} y2={py(r.b)} stroke={r.color} strokeWidth={1.25} />)}
      {rest.map((r) => <circle key={r.id} className="mc-dot" cx={px(r.a)} cy={py(r.b)} r={3} fill="var(--cell)" fillOpacity={0.55} />)}
      {focus.map((r) => <circle key={r.id} className="mc-dot" cx={px(r.a)} cy={py(r.b)} r={3.6} fill={r.color} />)}
      <text x={px(n) + 10} y={py(n) + 4} fill="var(--ink-3)">same rank</text>
      {focus.map((r, i) => (
        <g key={`l-${r.id}`} className="mc-dot">
          <circle cx={150} cy={14 + i * 32} r={3.6} fill={r.color} />
          <text x={160} y={17.5 + i * 32} fill="var(--ink-2)">{r.name}</text>
          <text x={160} y={30 + i * 32} fill="var(--ink-3)">rank {r.a} on A, {r.b} on B</text>
        </g>
      ))}
    </Chart>
  );
}

/** 03: every ranked detector's median AP, far left of the supervised ceiling. */
export function CeilingChart() {
  const x = lin(0, 1);
  const { ceiling, ranked } = CEILING_GAP;
  if (!ceiling) return null;
  return (
    <Chart caption="Median AP, Track A" label={`Median AP: ${ceiling.name} supervised ceiling ${fmt.ap(ceiling.median)}; ranked detectors ${ranked.map((r) => `${r.name} ${fmt.ap(r.median)}`).join(', ')}.`}>
      <line className="mc-draw" x1={x(ceiling.median)} x2={x(ceiling.median)} y1={10} y2={AXIS_Y} stroke="var(--m-hvg_logreg)" strokeWidth={1.5} strokeDasharray="3 3" />
      <text className="mc-dot" x={x(ceiling.median) - 6} y={16} textAnchor="end" fill="var(--ink-2)">{ceiling.name} {fmt.ap(ceiling.median)}</text>
      {ranked.length > 0 && (() => {
        const lo = x(Math.min(...ranked.map((r) => r.median)));
        const hi = x(Math.max(...ranked.map((r) => r.median)));
        return (
          <g>
            <path className="mc-draw" d={`M${lo} 52 V48 H${hi} V52`} fill="none" stroke="var(--ink-3)" />
            <text className="mc-dot" x={(lo + hi) / 2} y={42} textAnchor="middle" fill="var(--ink-3)">ranked 1 to {ranked.length}</text>
          </g>
        );
      })()}
      {ranked.map((r) => (
        <circle key={r.id} className="mc-dot" data-from-x={x(0) - x(r.median)} cx={x(r.median)} cy={62} r={3.4} fill={r.color} stroke="var(--canvas)" strokeWidth={1} />
      ))}
      <Axis ticks={[0, 0.5, 1]} x={x} />
    </Chart>
  );
}

/** 04: at 0.1% prevalence nine methods sit at the floor; one holds. */
export function TrackFChart() {
  const x = lin(0, 1);
  const fail = TRACK_F.rows.filter((r) => !r.holds);
  const hold = TRACK_F.rows.filter((r) => r.holds);
  return (
    <Chart caption="Median AP, Track F at 0.1% prevalence" label={`Track F median AP at the 0.1% tier: ${fail.length} methods at or below ${TRACK_F.max}; ${hold.map((r) => `${r.name} ${fmt.ap(r.v)}`).join(', ')}.`}>
      {fail.map((r, i) => (
        <circle key={r.id} className="mc-dot" cx={x(r.v) + (i % 2) * 7} cy={AXIS_Y - 8 - Math.floor(i / 2) * 7} r={3} fill="var(--cell)" fillOpacity={0.6} />
      ))}
      <text className="mc-dot" x={x(0) + 18} y={AXIS_Y - 30} fill="var(--ink-3)">{fail.length} at or below {TRACK_F.max}</text>
      {hold.map((r) => (
        <g key={r.id}>
          <circle className="mc-dot" data-from-x={x(0) - x(r.v)} cx={x(r.v)} cy={AXIS_Y - 8} r={4} fill={r.color} />
          <text className="mc-dot" x={x(r.v)} y={AXIS_Y - 20} textAnchor="end" fill="var(--ink-2)">{r.name} {fmt.ap(r.v)}</text>
        </g>
      ))}
      <Axis ticks={[0, 0.5, 1]} x={x} />
    </Chart>
  );
}
