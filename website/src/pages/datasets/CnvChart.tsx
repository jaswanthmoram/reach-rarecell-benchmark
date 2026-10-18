import { useLayoutEffect, useRef, useState } from 'react';
import { GLOBAL_STATS } from '../../data/benchmarkData';
import { fmt } from '../../ui';
import { CNV_COHORTS, TOTALS, f3 } from './model';

/**
 * Sensitivity against specificity of the infercnvpy call, per cohort (Table 9b). Drawn at the container's real
 * pixel width (no viewBox scaling) so every label stays 11px at 390 and 1440. Point area follows the size of the
 * cohort's CNV validation set; the pooled value is the one accent mark.
 */
const X_DOMAIN: [number, number] = [0.7, 1];
const Y_DOMAIN: [number, number] = [0, 1];
const X_TICKS = [0.7, 0.8, 0.9, 1];
const Y_TICKS = [0, 0.25, 0.5, 0.75, 1];
const M = { top: 14, right: 14, bottom: 40, left: 60 };
const FONT = 11;

type Place = 'right' | 'left' | 'above' | 'below' | 'below-left';
/** Label side per cohort, chosen so neighbouring points never collide (layout only; values come from the data). */
const PLACE: Record<string, Place> = {
  hnscc_puram: 'above', ov_izar_tirosh: 'left', pdac_peng: 'below', hcc_wei: 'left',
  crc_lee: 'above', rcc_multi: 'below', breast_ctc_szczerba: 'below-left',
};
const short = (id: string) => id.split('_')[0];

function useWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [w, setW] = useState(fallback);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

function label(place: Place, r: number) {
  switch (place) {
    case 'left': return { dx: -(r + 5), dy: 4, anchor: 'end' as const };
    case 'above': return { dx: 0, dy: -(r + 5), anchor: 'middle' as const };
    case 'below': return { dx: 0, dy: r + 13, anchor: 'middle' as const };
    case 'below-left': return { dx: 2, dy: r + 13, anchor: 'end' as const };
    default: return { dx: r + 5, dy: 4, anchor: 'start' as const };
  }
}

export default function CnvChart() {
  const [ref, w] = useWidth<HTMLDivElement>(640);
  const h = Math.round(Math.min(360, Math.max(280, w * 0.56)));
  const iw = Math.max(1, w - M.left - M.right);
  const ih = h - M.top - M.bottom;
  const x = (v: number) => M.left + ((v - X_DOMAIN[0]) / (X_DOMAIN[1] - X_DOMAIN[0])) * iw;
  const y = (v: number) => M.top + (1 - (v - Y_DOMAIN[0]) / (Y_DOMAIN[1] - Y_DOMAIN[0])) * ih;
  const maxCells = Math.max(...CNV_COHORTS.map((d) => d.cnvCells ?? 0));
  const rad = (n: number) => 3 + 6 * Math.sqrt(n / maxCells);
  const g = GLOBAL_STATS;
  const px = x(g.cnvOverallSpecificity); const py = y(g.cnvOverallSensitivity);
  const summary = CNV_COHORTS.map((d) => `${d.id} sensitivity ${f3(d.cnvSensitivity)}, specificity ${f3(d.cnvSpecificity)}`).join('; ');

  return (
    <div ref={ref} className="w-full">
      <svg width={w} height={h} role="img" className="block overflow-visible"
        aria-label={`Scatter of CNV-arm sensitivity against specificity for ${CNV_COHORTS.length} cohorts. Pooled: sensitivity ${f3(g.cnvOverallSensitivity)}, specificity ${f3(g.cnvOverallSpecificity)}. ${summary}.`}>
        {/* grid and axes */}
        {Y_TICKS.map((t) => (
          <g key={`y${t}`}>
            <line x1={M.left} x2={M.left + iw} y1={y(t)} y2={y(t)} stroke="var(--line)" />
            <text x={M.left - 8} y={y(t) + 4} textAnchor="end" fontSize={FONT} className="fill-ink-3 font-mono tabular">{t === 0 ? '0' : t.toFixed(2)}</text>
          </g>
        ))}
        {X_TICKS.map((t) => (
          <g key={`x${t}`}>
            <line x1={x(t)} x2={x(t)} y1={M.top} y2={M.top + ih} stroke="var(--line)" />
            <text x={x(t)} y={M.top + ih + 16} textAnchor={t === 1 ? 'end' : 'middle'} fontSize={FONT} className="fill-ink-3 font-mono tabular">{t.toFixed(1)}</text>
          </g>
        ))}
        <text x={M.left + iw} y={h - 4} textAnchor="end" fontSize={FONT} className="fill-ink-2 font-mono uppercase tracking-[0.06em]">Specificity →</text>
        <text transform={`translate(11 ${M.top}) rotate(-90)`} textAnchor="end" fontSize={FONT} className="fill-ink-2 font-mono uppercase tracking-[0.06em]">Sensitivity →</text>

        {/* pooled crosshair */}
        <line x1={px} x2={px} y1={M.top} y2={M.top + ih} stroke="var(--accent)" strokeDasharray="3 3" opacity={0.5} />
        <line x1={M.left} x2={M.left + iw} y1={py} y2={py} stroke="var(--accent)" strokeDasharray="3 3" opacity={0.5} />

        {/* cohorts, largest first so small points stay on top */}
        {[...CNV_COHORTS].sort((a, b) => (b.cnvCells ?? 0) - (a.cnvCells ?? 0)).map((d) => {
          const cx = x(d.cnvSpecificity ?? 0); const cy = y(d.cnvSensitivity ?? 0); const r = rad(d.cnvCells ?? 0);
          const l = label(PLACE[d.id] ?? 'right', r);
          return (
            <g key={d.id}>
              <title>{`${d.id}: sensitivity ${f3(d.cnvSensitivity)}, specificity ${f3(d.cnvSpecificity)}, ${fmt.int(d.cnvCells ?? 0)} cells`}</title>
              <circle cx={cx} cy={cy} r={r} fill="var(--ink-2)" fillOpacity={0.18} stroke="var(--ink-2)" strokeWidth={1.25} />
              <text x={cx + l.dx} y={cy + l.dy} textAnchor={l.anchor} fontSize={FONT} className="fill-ink-2 font-mono">{short(d.id)}</text>
            </g>
          );
        })}
        <g>
          <title>{`Pooled: sensitivity ${f3(g.cnvOverallSensitivity)}, specificity ${f3(g.cnvOverallSpecificity)}, ${fmt.int(TOTALS.cnvCells)} cells`}</title>
          <circle cx={px} cy={py} r={6} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
          <text x={px - 11} y={py - 8} textAnchor="end" fontSize={FONT} className="fill-accent font-mono font-semibold">Pooled</text>
        </g>
      </svg>
    </div>
  );
}
