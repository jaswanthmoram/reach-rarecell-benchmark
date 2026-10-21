import { useState } from 'react';
import { asset, cx } from '../../lib/format';
import { scrollToId } from '../../lib/router';
import { SectionHeader } from '../../ui/SectionHeader';
import { Reveal } from '../../ui/motion';
import { ArrowUp, ArrowUpRight, Check, ICON_STROKE, X } from '../../ui/icons';
import { CRITERIA, EXCLUDED, METHODS, STATS, capFirst, word } from './model';
import { ghostBtn, label, sectionCls } from './ui';

const th = 'px-3 font-normal';
type Row = (typeof EXCLUDED)[number] & { criterion: string };

function IncludedSummary() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
      <div className="min-w-0">
        <p className="m-0 flex flex-wrap items-center gap-2 text-[13px] font-medium">
          <span className="inline-flex items-center gap-1 rounded-chip border border-[#b9dcc8] px-1.5 py-0.5 font-mono text-[11px] text-ok">
            <Check size={12} strokeWidth={2} aria-hidden="true" />Included
          </span>
          {STATS.included} methods passed all five criteria
        </p>
        <p className="mb-0 mt-1.5 font-mono text-xs leading-relaxed text-ink-2">{METHODS.map((m) => m.name).join(' · ')}</p>
      </div>
      <button type="button" onClick={() => scrollToId('matrix')}
        className="m-ul group inline-flex min-h-10 cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-sm font-medium text-accent-ink">
        <span className="fx-underline">Details in the method matrix</span><ArrowUp size={14} strokeWidth={ICON_STROKE} aria-hidden="true" className="transition-transform duration-[var(--dur-1)] group-hover:-translate-y-0.5" />
      </button>
    </div>
  );
}

function Excluded({ name }: { name: string }) {
  return <><X size={13} strokeWidth={2} aria-hidden="true" className="mr-1 inline-block -translate-y-px align-middle text-bad" />{name}</>;
}

/** 768px and up: the full audit table. */
function AuditTable({ rows, caption }: { rows: Row[]; caption: string }) {
  return (
    <div className="hidden overflow-x-auto rounded-card border border-line bg-surface md:block">
      <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="h-10 bg-sunk font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3">
            <th scope="col" className="pl-4 pr-3 font-normal">Method</th><th scope="col" className={th}>Criterion failed</th><th scope="col" className={th}>Paradigm</th><th scope="col" className="pl-3 pr-4 font-normal">Reason (proof Figure 3a)</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-line bg-[var(--row-hover)]"><td colSpan={4} className="px-4 py-3"><IncludedSummary /></td></tr>
          {rows.length === 0 && (
            <tr className="border-t border-line"><td colSpan={4} className="px-4 py-6 text-center text-[13px] text-ink-2">No candidates failed this criterion.</td></tr>
          )}
          {rows.map((e) => (
            <tr key={e.m} className="border-t border-line align-top transition-colors duration-[var(--dur-1)] hover:bg-[var(--row-hover)]">
              <th scope="row" className="py-3 pl-4 pr-3 font-mono font-medium">
                <Excluded name={e.m} />
                <span className="mt-0.5 block font-sans text-xs font-normal text-ink-3">{e.meta}</span>
              </th>
              <td className="p-3 text-ink">{e.criterion}</td>
              <td className="p-3 text-ink-2">{e.par}</td>
              <td className="py-3 pl-3 pr-4 leading-normal">{e.why}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Under 768px (audit P1): one stacked record per exclusion, so the reason is never off-screen. */
function AuditList({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface md:hidden">
      <div className="bg-[var(--row-hover)] px-4 py-3"><IncludedSummary /></div>
      {rows.length === 0 && <p className="m-0 border-t border-line px-4 py-6 text-center text-[13px] text-ink-2">No candidates failed this criterion.</p>}
      <ul aria-label="Excluded candidates" className="m-0 list-none p-0">
        {rows.map((e) => (
          <li key={e.m} className="border-t border-line px-4 py-3.5">
            <p className="m-0 font-mono text-[13px] font-medium"><Excluded name={e.m} /></p>
            <p className="m-0 mt-0.5 text-xs text-ink-3">{e.meta}</p>
            <dl className="m-0 mt-2.5 grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[13px] leading-normal">
              <dt className={cx(label, 'pt-0.5')}>Failed</dt><dd className="m-0 text-ink">{e.criterion}</dd>
              <dt className={cx(label, 'pt-0.5')}>Paradigm</dt><dd className="m-0 text-ink-2">{e.par}</dd>
              <dt className={cx(label, 'pt-0.5')}>Reason</dt><dd className="m-0 text-ink">{e.why}</dd>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function InclusionAudit() {
  const [crit, setCrit] = useState<number | null>(null);
  const rows: Row[] = CRITERIA.flatMap((c, i) => (crit !== null && crit !== i ? [] : c.failed.flatMap((name) => {
    const e = EXCLUDED.find((x) => x.m === name);
    return e ? [{ ...e, criterion: c.title }] : [];
  })));
  const showing = crit === null
    ? `Showing all ${STATS.excluded} exclusions, grouped by the criterion each failed.`
    : `Showing ${rows.length} of ${STATS.excluded} exclusions: ${CRITERIA[crit].title.toLowerCase()}.`;

  const included = word(STATS.included), excluded = word(STATS.excluded), audited = word(STATS.audited);
  const caption = crit === null
    ? `${capFirst(audited)} audited candidates: a summary row for the ${included} included methods, then each of the ${excluded} excluded methods with the criterion it failed and the reason.`
    : `A summary row for the ${included} included methods, then the ${word(rows.length)} of ${excluded} excluded methods that failed "${CRITERIA[crit].title}", with the reason.`;

  return (
    <section id="audit" aria-labelledby="audit-h" className={sectionCls('tight')}>
      <SectionHeader id="audit-h" eyebrow="Proof Figure 3a" title={`How ${included} of ${audited} made it in`}
        lede={<>Every candidate was audited before any benchmark run. {STATS.included} passed all five criteria. The other {STATS.excluded} sit under the criterion each one failed, with the reason from proof Figure 3a. Select a criterion to see only its exclusions.</>} />
      <Reveal role="group" aria-label="Filter exclusions by criterion" className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
        {CRITERIA.map((c, i) => {
          const on = crit === i;
          return (
            <button key={c.title} type="button" aria-pressed={on} onClick={() => setCrit(on ? null : i)}
              className={cx('flex w-full cursor-pointer flex-col justify-start rounded-card border p-4 text-left font-sans transition-[border-color,background-color] duration-[var(--dur-1)]', on ? 'border-accent bg-accent-tint' : 'border-line bg-surface hover:border-line-strong')}>
              <span className="block text-[15px] font-semibold text-ink">{c.title}</span>
              <span className="mb-2.5 mt-1.5 block text-[13px] leading-normal text-ink-2">{c.body}</span>
              <span className="mt-auto block font-mono text-xs text-bad">{c.failed.length} excluded</span>
              <span className="mt-0.5 flex items-start gap-1 font-mono text-xs text-ink">
                <X size={12} strokeWidth={2} aria-hidden="true" className="mt-0.5 flex-none text-bad" />{c.failed.join(', ')}
              </span>
            </button>
          );
        })}
      </Reveal>
      <div className="mb-2 mt-6 flex flex-wrap items-center justify-between gap-2">
        <p aria-live="polite" className="m-0 text-[13px] text-ink-2">{showing}</p>
        {crit !== null && <button type="button" onClick={() => setCrit(null)} className={ghostBtn}>Show all {STATS.excluded}</button>}
      </div>
      <AuditTable rows={rows} caption={caption} />
      <AuditList rows={rows} />
      <p className="mb-0 mt-3 text-xs text-ink-2">
        Proof Figure 3 also plots Track A AP for the {included} included methods and their fallback and degenerate rates.{' '}
        <a href={asset('figures/paper/fig-3.webp')} target="_blank" rel="noopener noreferrer" className="m-ul group inline-flex items-center gap-0.5 font-medium">
          <span className="fx-underline">Open Figure 3</span><ArrowUpRight size={13} strokeWidth={ICON_STROKE} aria-hidden="true" className="transition-transform duration-[var(--dur-1)] group-hover:-translate-y-px group-hover:translate-x-px" />
        </a>
      </p>
    </section>
  );
}
