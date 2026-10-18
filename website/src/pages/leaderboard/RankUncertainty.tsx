import { Fragment } from 'react';
import { CIBar, MethodDot, methodColor } from '../../ui';
import { GLOBAL_STATS, type MethodResult } from '../../data/benchmarkData';
import { REFERENCE_MARKS, bandsOf, isReference, roleLabel } from './model';
import { RefMarkKey } from './RefMarkKey';

const DOMAIN: [number, number] = [0.5, 10.5];
const TICKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const pct = (v: number) => ((v - DOMAIN[0]) / (DOMAIN[1] - DOMAIN[0])) * 100;
const ci = (m: MethodResult) => `${m.rankCILow}–${m.rankCIHigh}`;
const RANK_MARKS = REFERENCE_MARKS.map((r) => ({ id: r.id, label: `${r.method} ${r.rankMean.toFixed(2)}`, x: pct(r.rankMean) }));

function Grid() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {TICKS.map((t) => <span key={t} className="absolute inset-y-0 w-px bg-line" style={{ left: `${pct(t)}%` }} />)}
      {REFERENCE_MARKS.map((r) => (
        <span key={r.id} className="absolute inset-y-0 border-l border-dashed opacity-70" style={{ left: `${pct(r.rankMean)}%`, borderColor: methodColor(r.id) }} />
      ))}
    </div>
  );
}

/**
 * Figure 4b view: mean within-unit rank over all ten methods with its bootstrap interval.
 * This is a statistical rank and includes reference methods; it is never shown next to the leaderboard rank.
 */
export function RankUncertainty({ rows }: { rows: MethodResult[] }) {
  return (
    <section aria-labelledby="rank-unc-h" className="pt-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 id="rank-unc-h" className="text-lg font-semibold tracking-[-0.01em] text-ink">Within-unit rank, all 10 methods (Figure 4b)</h3>
          <p className="mt-1 max-w-[72ch] text-sm leading-relaxed text-ink-2">
            Each unit ranks all {GLOBAL_STATS.methodsIncluded} methods 1 to 10; the dot is the mean rank, the bar its 95% bootstrap interval.
            It includes the reference methods, so it is not the leaderboard rank.
          </p>
          <p className="mt-1 font-mono text-[11px] text-ink-3">Rows sort by mean within-unit rank inside each group, so the order can differ from the median-AP leaderboard.</p>
        </div>
        <p className="shrink-0 font-mono text-xs text-ink-2 tabular">Nemenyi CD = {GLOBAL_STATS.nemenyiCD} · N = {GLOBAL_STATS.friedmanN}</p>
      </div>

      <div className="mt-5 grid grid-cols-1 border-t border-line-strong md:grid-cols-[minmax(220px,280px)_minmax(0,1fr)_128px]">
        {/* CD scale bar */}
        <div className="hidden md:block" />
        <div className="relative hidden h-8 md:block" aria-hidden="true">
          <span className="absolute top-3 h-px bg-ink" style={{ left: `${pct(1)}%`, width: `${(GLOBAL_STATS.nemenyiCD / (DOMAIN[1] - DOMAIN[0])) * 100}%` }} />
          <span className="absolute left-0 top-4 font-mono text-[11px] text-ink-2" style={{ left: `${pct(1)}%` }}>CD {GLOBAL_STATS.nemenyiCD}</span>
        </div>
        <div className="hidden md:block" />

        {bandsOf(rows).map((b) => (
          <Fragment key={b.value}>
            <p className="flex items-baseline gap-3 border-b border-line pb-2 pt-4 md:col-span-3">
              <span className="label text-ink-2">{b.label}</span>
              <span className="font-mono text-[11px] text-ink-3">{b.note}</span>
            </p>
            <ol className="contents">
              {b.rows.map((m) => (
                <li key={m.id} className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-2 md:col-span-3 md:grid-cols-subgrid md:py-0 ${b.value === 'ceiling' ? 'border-b border-dashed border-line-strong' : 'border-b border-line'}`}>
                  <span className="flex min-h-10 min-w-0 items-center gap-2.5">
                    <MethodDot id={m.id} dashed={isReference(m)} />
                    <span className={`truncate font-mono text-[13px] ${isReference(m) ? 'text-ink-2' : 'font-semibold text-ink'}`}>{m.method}</span>
                    {isReference(m) && <span className="truncate font-mono text-[11px] text-ink-3">{roleLabel(m)}</span>}
                  </span>
                  <span className="whitespace-nowrap text-right font-mono text-xs text-ink tabular md:order-3">
                    {m.rankMean.toFixed(2)} <span className="text-ink-3">[{ci(m)}]</span>
                  </span>
                  <div className="relative col-span-2 self-stretch md:order-2 md:col-span-1 md:flex md:items-center">
                    <Grid />
                    <CIBar value={m.rankMean} low={m.rankCILow} high={m.rankCIHigh} domain={DOMAIN} color={methodColor(m.id)} dashed={isReference(m)}
                      label={`${m.method}: mean within-unit rank ${m.rankMean.toFixed(2)}, 95% bootstrap interval ${m.rankCILow} to ${m.rankCIHigh} of 10`} />
                  </div>
                </li>
              ))}
            </ol>
          </Fragment>
        ))}

        <div className="hidden md:block" />
        <div className="relative h-5 font-mono text-[11px] text-ink-3" aria-hidden="true">
          {TICKS.map((t) => <span key={t} className="absolute top-1.5 -translate-x-1/2" style={{ left: `${pct(t)}%` }}>{t}</span>)}
        </div>
        <div className="hidden md:block" />
        <div className="hidden md:block" />
        <RefMarkKey marks={RANK_MARKS} />
        <div className="hidden md:block" />
      </div>
      <p className="mt-4 max-w-[80ch] text-xs leading-relaxed text-ink-2">
        Mean within-unit rank over the {GLOBAL_STATS.friedmanN} common Track A units, lower is better. Methods closer than the critical difference
        are not separable. expr_threshold, scMalignantFinder, CellSIUS, RareQ and scCAD form an overlapping middle band; on this statistic
        CellSIUS sits below scMalignantFinder, the reverse of their median-AP order.
      </p>
    </section>
  );
}
