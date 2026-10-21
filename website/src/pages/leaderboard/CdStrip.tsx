import { useRef } from 'react';
import { GLOBAL_STATS } from '../../data/benchmarkData';
import { cx } from '../../lib/format';
import { useDrawIn } from '../../ui/motion';
import { BOARD_ORDER, RANK_K, rankPct, rowOf } from './model';
import { Dot } from './parts';

/*
 * Critical-difference strip (Figure 4b, one line): every method at its mean within-unit rank on the 1 to 10 axis,
 * with the Nemenyi CD (1.14) drawn as a bar from FiRE's rank. Methods inside the bar cannot be separated.
 * Draw-in once on view: markers slide in along the axis from rank 1, then the CD bar grows from its left end.
 */
const K = RANK_K;
const CD = GLOBAL_STATS.nemenyiCD;
const N = GLOBAL_STATS.friedmanN;
const BY_RANK = [...BOARD_ORDER].sort((a, b) => a.m.rankMean - b.m.rankMean);
const ANCHOR = rowOf('FiRE');
const TICKS = Array.from({ length: K }, (_, i) => i + 1);
/** Markers slide in from rank 1 (their own left offset), 30 ms apart; the CD bar grows from its left end at 0.35 s. */
const STRIP_DRAW_IN = {
  selector: '[data-cd-mark]', from: { opacity: 0, x: (_i: number, el: HTMLElement) => -el.offsetLeft }, duration: 0.5, stagger: 0.03,
  then: [{ selector: '[data-cd-bar]', from: { scaleX: 0, transformOrigin: '0% 50%' }, at: 0.35, duration: 0.42, stagger: 0 }],
};

export function CdStrip() {
  const ref = useRef<HTMLDivElement>(null);
  useDrawIn(ref, STRIP_DRAW_IN);
  const anchor = ANCHOR?.m.rankMean ?? 1;
  const label = `Mean within-unit rank, lower is better: ${BY_RANK.map((r) => `${r.name} ${r.m.rankMean.toFixed(2)}`).join(', ')}. Nemenyi critical difference ${CD.toFixed(2)}.`;
  return (
    <figure className="m-0 min-w-0">
      <div ref={ref} role="img" aria-label={label} className="relative">
        {/* CD bar above the axis, anchored at FiRE */}
        <div aria-hidden="true" className="relative h-7">
          <span data-cd-bar className="absolute top-[20px] h-[3px] rounded-full bg-ink"
            style={{ left: rankPct(anchor), width: `${((CD / K) * 100).toFixed(2)}%` }} />
          <span className="absolute top-0 -translate-x-1/2 font-mono text-[11px] text-ink-2" style={{ left: rankPct(anchor + CD / 2) }}>CD {CD.toFixed(2)}</span>
        </div>
        {/* Axis with markers */}
        <div aria-hidden="true" className="relative h-6">
          <span className="absolute inset-x-0 top-3 h-px bg-line-strong" />
          {TICKS.map((t) => <span key={t} className="absolute top-2 h-2 w-px bg-line-strong" style={{ left: rankPct(t) }} />)}
          {BY_RANK.map((r) => (
            <span key={r.id} data-cd-mark className="absolute top-3 -ml-[5px] -mt-[5px] leading-none" style={{ left: rankPct(r.m.rankMean) }}>
              <Dot row={r} />
            </span>
          ))}
        </div>
        {/* Method names under their markers, read top to bottom */}
        <div aria-hidden="true" className="relative h-[124px]">
          {BY_RANK.map((r) => (
            <span key={r.id} className={cx('absolute top-1 -translate-x-1/2 whitespace-nowrap font-mono text-[11px] [writing-mode:vertical-rl]',
              r.isRef ? 'text-ink-3' : 'text-ink-2')} style={{ left: rankPct(r.m.rankMean) }}>{r.name}</span>
          ))}
        </div>
      </div>
      <figcaption className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 font-mono text-[11px] text-ink-3">
        <span>Mean within-unit rank, lower is better · Figure 4b</span>
        <span>N = {N} units, k = {K}</span>
      </figcaption>
    </figure>
  );
}
