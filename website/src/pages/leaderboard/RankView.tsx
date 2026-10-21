import type { CSSProperties } from 'react';
import { GLOBAL_STATS } from '../../data/benchmarkData';
import { cx } from '../../lib/format';
import { useGlide } from '../../ui/motion/useGlide';
import { BANDS, RANK_K, REFERENCE_ROWS, rankPct, type Row } from './model';
import { Dot, RefKey } from './parts';

/* Figure 4b: within-unit rank over all 10 methods, domain 0.5 to 10.5. */
const K = RANK_K;
const TICKS = Array.from({ length: K }, (_, i) => i + 1);
const COLS: CSSProperties = { display: 'grid', gridTemplateColumns: '260px minmax(0, 1fr) 128px' };

function RankRow({ row }: { row: Row }) {
  const { rankMean: mean, rankCILow: lo, rankCIHigh: hi } = row.m;
  const whisker = (v: number): CSSProperties => ({ left: rankPct(v), background: row.color });
  const ink = row.isRef ? 'text-ink-2' : 'text-ink';
  return (
    <li data-glide={row.id} style={COLS}
      className={cx('lb-row relative min-h-11 items-center bg-canvas', row.band === 'ceiling' ? 'border-b border-dashed border-line-strong' : 'border-b border-line')}>
      <span className="flex min-h-11 min-w-0 items-center gap-2.5 pr-3">
        <Dot row={row} />
        <span className={cx('truncate font-mono text-[13px]', ink, row.isRef ? 'font-normal' : 'font-semibold')}>{row.name}</span>
        {(row.isRef || row.role !== 'Published') && <span className="truncate font-mono text-[11px] text-ink-3">{row.role}</span>}
      </span>
      <span role="img" aria-label={`${row.name}: mean within-unit rank ${mean.toFixed(2)}, 95% bootstrap interval ${lo} to ${hi} of ${K}`} className="relative block h-6">
        {TICKS.map((t) => <span key={t} aria-hidden="true" className="absolute inset-y-0 w-px bg-line" style={{ left: rankPct(t) }} />)}
        {REFERENCE_ROWS.map((r) => <span key={r.id} aria-hidden="true" className="absolute inset-y-0 border-l border-dashed opacity-70" style={{ left: rankPct(r.m.rankMean), borderColor: r.color }} />)}
        <span aria-hidden="true" className={cx('absolute', row.isRef ? 'top-[11px] h-0 border-t-[1.5px] border-dashed' : 'top-2.5 h-1 rounded-sm opacity-35')}
          style={{ left: rankPct(lo), width: `calc(${rankPct(hi)} - ${rankPct(lo)})`, ...(row.isRef ? { borderColor: row.color } : { background: row.color }) }} />
        <span aria-hidden="true" className="absolute top-[7px] h-2.5 w-px" style={whisker(lo)} />
        <span aria-hidden="true" className="absolute top-[7px] h-2.5 w-px" style={whisker(hi)} />
        <span aria-hidden="true" className="absolute top-3 -ml-[5px] -mt-[5px] box-border h-2.5 w-2.5 rounded-full"
          style={{ left: rankPct(mean), ...(row.isRef ? { background: 'var(--surface)', border: `1.5px dashed ${row.color}` } : { background: row.color, boxShadow: '0 0 0 2px var(--surface)' }) }} />
      </span>
      <span className="whitespace-nowrap text-right font-mono text-xs text-ink tabular-nums">{mean.toFixed(2)} <span className="text-ink-3">[{lo}–{hi}]</span></span>
    </li>
  );
}

export function RankView({ rows }: { rows: Row[] }) {
  const ref = useGlide<HTMLDivElement>(rows.map((r) => r.id).join(','));
  const bands = BANDS.map((b) => ({ ...b, rows: rows.filter((r) => r.band === b.id) })).filter((b) => b.rows.length > 0);
  return (
    <section aria-labelledby="rank-unc-h" className="pt-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="min-w-0 max-w-[72ch]">
          <h3 id="rank-unc-h" className="m-0 text-lg font-semibold leading-[1.3] tracking-[-0.01em]">Within-unit rank, all {K} methods (Figure 4b)</h3>
          <p className="m-0 mt-1.5 text-sm leading-[1.6] text-ink-2">Each unit ranks all {K} methods 1 to {K}; the dot is the mean rank, the bar its 95% bootstrap interval. It includes the reference methods, so it is not the leaderboard rank.</p>
          <p className="m-0 mt-1.5 font-mono text-[11px] text-ink-3">Rows sort by mean within-unit rank inside each group, so the order can differ from the median-AP leaderboard.</p>
        </div>
        <p className="m-0 font-mono text-xs text-ink-2">Nemenyi CD = {GLOBAL_STATS.nemenyiCD.toFixed(2)} · N = {GLOBAL_STATS.trackACommonUnits}</p>
      </div>
      <div role="region" aria-label="Rank uncertainty chart, scrollable" tabIndex={0} className="relative mt-5 overflow-x-auto border-t border-line-strong">
        <div ref={ref} className="relative min-w-[720px]">
          <div aria-hidden="true" className="h-8" style={COLS}>
            <span />
            <span className="relative">
              <span className="absolute top-3 h-px bg-ink" style={{ left: rankPct(1), width: `${(GLOBAL_STATS.nemenyiCD / K) * 100}%` }} />
              <span className="absolute top-4 font-mono text-[11px] text-ink-2" style={{ left: rankPct(1) }}>CD {GLOBAL_STATS.nemenyiCD.toFixed(2)}</span>
            </span>
            <span />
          </div>
          {bands.map((b) => (
            <div key={b.id}>
              <p data-glide={`band-${b.id}`} className="relative m-0 flex items-baseline gap-3 border-b border-line bg-canvas pb-2 pt-4">
                <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-2">{b.label}</span>
                <span className="font-mono text-[11px] text-ink-3">{b.note}</span>
              </p>
              <ol className="m-0 list-none p-0">{b.rows.map((r) => <RankRow key={r.id} row={r} />)}</ol>
            </div>
          ))}
          <div aria-hidden="true" data-glide="rank-ticks" className="relative" style={COLS}>
            <span />
            <span className="relative h-5 font-mono text-[11px] text-ink-3">
              {TICKS.map((t) => <span key={t} className="absolute top-1.5 -translate-x-1/2" style={{ left: rankPct(t) }}>{t}</span>)}
            </span>
            <span />
          </div>
        </div>
      </div>
      <RefKey lead="Dashed marks, mean within-unit rank:" value={(r) => r.m.rankMean.toFixed(2)} className="mt-3" />
      <p className="m-0 mt-4 max-w-[80ch] text-xs leading-[1.6] text-ink-2">
        Mean within-unit rank over the {GLOBAL_STATS.trackACommonUnits} common Track A units, lower is better. Methods closer than the critical difference are not separable. expr_threshold, scMalignantFinder, CellSIUS, RareQ and scCAD form an overlapping middle band; on this statistic CellSIUS sits below scMalignantFinder, the reverse of their median-AP order.
      </p>
    </section>
  );
}
