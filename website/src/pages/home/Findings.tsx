import type { ComponentType } from 'react';
import { cx } from '../../lib/format';
import { href, preloadRoute } from '../../lib/router';
import { ArrowRight, ICON_STROKE } from '../../ui/icons';
import { Reveal } from '../../ui/motion';
import { SectionHeader } from '../../ui/SectionHeader';
import { CeilingChart, PairChart, RankShiftChart, TrackFChart } from './MicroCharts';
import { FINDINGS, TRACK_ROWS } from './model';

/** Each finding's number is paired with a picture of what it measures (audit Home P1), keyed by finding. */
const CHARTS: Record<string, ComponentType> = { '01': PairChart, '02': RankShiftChart, '03': CeilingChart, '04': TrackFChart };

const linkCls = 'hm-link hm-ul group inline-flex min-h-11 items-center gap-1 text-sm font-medium hover:text-ink';

export function Findings() {
  return (
    <section id="findings" aria-labelledby="f-h" className="border-t border-line px-4 pb-12 pt-16 sm:px-6 sm:pt-20">
      <div className="mx-auto max-w-[1240px]">
        <SectionHeader id="f-h" title="What the benchmark shows" className="mb-10 sm:mb-14"
          lede="When a pairwise test is not significant, the order between those methods is reported as unsettled. “Rare” here means few malignant cells among immune, stromal and normal cells." />
        <Reveal variant="mask" className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,460px),1fr))] gap-4 sm:gap-5">
          {FINDINGS.map((f, i) => {
            const Chart = CHARTS[f.n];
            const lead = i === 0;
            return (
              <article key={f.n} aria-labelledby={`f-${f.n}`}
                className={cx('fx-card flex flex-col p-6 sm:p-10', lead && 'fx-sheen')}>
                <p className="m-0 font-mono text-xs text-ink-3">{f.tag.charAt(0).toUpperCase() + f.tag.slice(1)}</p>
                <div className="mt-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
                  <p className={cx('m-0 font-semibold leading-none tracking-[-0.04em] tabular', lead ? 'text-[56px] sm:text-[72px]' : 'text-[44px] sm:text-[52px]')}>{f.figure}</p>
                  {Chart && <div className="min-w-[240px] flex-1 sm:max-w-[360px]"><Chart /></div>}
                </div>
                <h3 id={`f-${f.n}`} className="m-0 mt-8 max-w-[34ch] text-balance text-xl font-semibold leading-[1.35] tracking-[-0.015em]">{f.title}</h3>
                <p className="m-0 mt-3 max-w-[60ch] text-base leading-relaxed text-ink-2">{f.body}</p>
                {/* The link stretches over the card (its ::after), so the lifted card is the target it looks like. */}
                <a href={href(f.to, f.query)} onPointerEnter={() => void preloadRoute(f.to)}
                  className={`${linkCls} mt-auto self-start pt-6 after:absolute after:inset-0 after:rounded-card after:content-['']`}>
                  <span className="fx-underline">{f.link}</span><ArrowRight size={14} strokeWidth={ICON_STROKE} aria-hidden="true" className="hm-nudge" />
                </a>
              </article>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}

export function TrackList() {
  return (
    <section id="tracks" aria-labelledby="t-h" className="border-t border-line px-4 pb-12 pt-16 sm:px-6 sm:pt-20">
      <div className="mx-auto max-w-[1240px]">
        <SectionHeader id="t-h" title="Six tracks, one question each"
          lede="Track A is the ranked endpoint. The other five test whether a Track A score survives simulation, empty samples, natural blood, noisy labels and same-lineage contrast."
          actions={(
            <a href={href('/tracks')} onPointerEnter={() => void preloadRoute('/tracks')}
              className="hm-press group inline-flex min-h-11 items-center gap-1.5 rounded-chip border border-line-strong bg-surface px-4 text-sm font-medium text-ink no-underline hover:border-ink-3 hover:text-ink">
              All tracks<ArrowRight size={16} strokeWidth={ICON_STROKE} aria-hidden="true" className="hm-nudge" />
            </a>
          )} />
        <Reveal as="ul" className="m-0 list-none border-t border-line p-0">
          {TRACK_ROWS.map((t) => (
            <li key={t.letter} className="border-b border-line">
              <a href={href('/tracks', `track=${t.letter.toLowerCase()}`)} onPointerEnter={() => void preloadRoute('/tracks')}
                className="hm-row group grid min-h-14 grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-4 px-2 py-3.5 text-ink no-underline hover:text-ink">
                <span className="hm-chip grid size-7 place-items-center rounded-chip border border-line-strong bg-surface font-mono text-xs font-semibold">{t.letter}</span>
                <span className="min-w-0">
                  <span className="fx-underline fx-underline--bare text-[15px] font-medium">{t.name}</span>
                  <span className="block text-[13px] text-ink-2">{t.role}</span>
                </span>
                <span className="flex items-center gap-2 whitespace-nowrap font-mono text-sm">
                  {t.units}<span className="text-xs text-ink-3 max-sm:sr-only"> units</span>
                  <ArrowRight size={14} strokeWidth={ICON_STROKE} aria-hidden="true" className="hm-nudge text-ink-3" />
                </span>
              </a>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
