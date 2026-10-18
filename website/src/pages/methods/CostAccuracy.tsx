import { useState } from 'react';
import { Icon, Section, asset, fmt } from '../../ui';
import { GLOBAL_STATS as G, LEADERBOARD_DATA } from '../../data/benchmarkData';
import { MethodLabel } from './parts';
import { CostScatter } from './CostScatter';
import { SECTION_SCROLL, inPageOrder, isGpu, unreliablePct } from './shared';

/** Page order: ceiling, ranked 1 to 6, then comparator and baselines (rule 1). */
const rows = inPageOrder(LEADERBOARD_DATA, (m) => m.id);
const find = (id: string) => LEADERBOARD_DATA.find((m) => m.id === id) ?? LEADERBOARD_DATA[0];
const fire = find('FiRE');
const expr = find('expr_threshold');
/** Unreliable shares at or above this are set in the warning tone. */
const WARN_PCT = 10;

function Legend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-ink-2" aria-label="Chart legend">
      <li className="inline-flex items-center gap-2"><span aria-hidden="true" className="inline-block size-2.5 rounded-full bg-ink-2" />Ranked published detector</li>
      <li className="inline-flex items-center gap-2"><span aria-hidden="true" className="inline-block size-2.5 rounded-full border-[1.5px] border-dashed border-ink-2" />Reference, not ranked</li>
      <li className="inline-flex items-center gap-2"><span aria-hidden="true" className="inline-block size-4 rounded-full border border-ink-3/60 bg-ink-3/15" />Halo area: share of fallback or degenerate units</li>
    </ul>
  );
}

export default function CostAccuracy() {
  const [active, setActive] = useState<string | null>(null);
  return (
    <Section id="cost" className={`border-t border-line ${SECTION_SCROLL}`} label="Cost and accuracy"
      title="Runtime does not buy precision"
      lead={`FiRE, rank 1, takes ${fmt.secs(fire.runtimeS)} per Track A unit. expr_threshold, not significantly different from it, takes ${fmt.secs(expr.runtimeS)}. Read runtime together with how often a method falls back or returns constant scores.`}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start lg:gap-8">
        <figure className="reveal min-w-0 rounded-card border border-line bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-x-3 border-b border-line px-4 py-1.5">
            <figcaption className="py-2 text-sm font-semibold text-ink">Median AP against runtime, Track A</figcaption>
            <a href={asset('figures/paper/fig-6.webp')} target="_blank" rel="noreferrer"
              className="inline-flex min-h-10 items-center gap-1 rounded-chip font-mono text-[11px] uppercase tracking-[0.06em] text-ink-2 transition-colors duration-150 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent">
              Proof Figure 6 <Icon name="arrow-up-right" size={12} />
            </a>
          </div>
          <div className="px-3 pb-3 pt-9 sm:px-5">
            <CostScatter rows={rows} active={active} onActive={setActive} />
          </div>
          <div className="border-t border-line px-4 py-3"><Legend /></div>
        </figure>

        <div className="reveal min-w-0 rounded-card border border-line bg-surface">
          <table className="w-full border-collapse text-left sm:table-fixed">
            <caption className="sr-only">Median Track A AP, mean runtime per Track A unit and share of fallback or degenerate units, in page order: ceiling, ranked detectors 1 to 6, then references</caption>
            <colgroup><col className="sm:w-[40%]" /><col className="sm:w-[14%]" /><col className="sm:w-[22%]" /><col /></colgroup>
            <thead>
              <tr className="h-10 border-b border-line bg-sunk">
                <th scope="col" className="label pl-3 pr-2 font-normal sm:pl-4">Method</th>
                <th scope="col" className="label hidden px-2 text-right font-normal sm:table-cell">AP</th>
                <th scope="col" className="label px-2 text-right font-normal">Runtime</th>
                <th scope="col" className="label pl-2 pr-3 text-right font-normal sm:pr-4"><span className="sr-only">Share of </span>Unreliable</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => {
                const bad = unreliablePct(m);
                return (
                  <tr key={m.id} onMouseEnter={() => setActive(m.id)} onMouseLeave={() => setActive(null)} onClick={() => setActive((a) => (a === m.id ? null : m.id))}
                    className={`h-10 border-b border-line transition-colors duration-150 last:border-b-0 ${active === m.id ? 'bg-sunk' : ''}`}>
                    <th scope="row" className="pl-3 pr-2 text-left font-normal sm:max-w-0 sm:pl-4"><MethodLabel m={m} /></th>
                    <td className="hidden px-2 text-right font-mono text-[13px] text-ink tabular sm:table-cell">{fmt.ap(m.medianAP)}</td>
                    <td className="whitespace-nowrap px-2 text-right font-mono text-[13px] text-ink tabular">
                      {fmt.secs(m.runtimeS)}{isGpu(m) && <span className="ml-1 hidden font-sans text-[11px] uppercase tracking-[0.06em] text-ink-3 sm:inline">GPU</span>}
                    </td>
                    <td className="pl-2 pr-3 text-right font-mono text-[12px] tabular sm:pr-4">
                      <span className={bad >= WARN_PCT ? 'text-warn' : 'text-ink-3'}>{bad === 0 ? '0%' : `${bad}%`}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="border-t border-line px-4 py-3 text-xs leading-relaxed text-ink-2">
            <span className="sm:hidden">Median AP is plotted above. </span>Unreliable: fallback plus degenerate units over all {fmt.int(G.coreUnits)} primary units (proof Figure 3c). Runtime is the mean per Track A unit on CPU,
            except DeepScena on a Colab T4 GPU.
          </p>
        </div>
      </div>
    </Section>
  );
}
