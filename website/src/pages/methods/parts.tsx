import type { MouseEvent, ReactNode } from 'react';
import { href, navigate } from '../../app/router';
import { Icon, MethodDot, fmt, methodColor } from '../../ui';
import type { MethodResult } from '../../data/benchmarkData';
import { ROLE_WORD, isRanked, isReference } from './shared';

/** Median AP as a number plus a dot on a 0 to 1 hairline, in the method's colour. */
export function APMark({ m, width = 'w-16', compact }: { m: MethodResult; width?: string; compact?: boolean }) {
  const left = `${Math.max(0, Math.min(1, m.medianAP)) * 100}%`;
  const dashed = isReference(m);
  return (
    <span className="inline-flex items-center gap-3">
      <span className={`font-mono text-[13px] text-ink tabular ${compact ? '' : 'w-[3.25rem] text-right'}`}>{fmt.ap(m.medianAP)}</span>
      <span aria-hidden="true" className={`relative h-3 ${width} shrink-0`}>
        <span className="absolute inset-x-0 top-1/2 h-px bg-line-strong" />
        <span className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full opacity-30" style={{ left: 0, width: left, background: methodColor(m.id) }} />
        <span className={`absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${dashed ? 'border-[1.5px] border-dashed bg-surface' : 'ring-2 ring-surface'}`}
          style={{ left, ...(dashed ? { borderColor: methodColor(m.id) } : { background: methodColor(m.id) }) }} />
      </span>
    </span>
  );
}

/** Rank 1 to 6 for ranked detectors; a role word for references (never a rank number). */
export function RankCell({ m }: { m: MethodResult }) {
  if (isRanked(m)) {
    return (
      <span className="inline-grid size-6 place-items-center rounded-chip border border-line-strong bg-surface font-mono text-xs font-semibold text-ink tabular"
        title={`Leaderboard rank ${m.publishedRankNum} of 6`}>
        {m.publishedRankNum}
        <span className="sr-only"> of 6</span>
      </span>
    );
  }
  return <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3" title="Reference, not ranked">{ROLE_WORD[m.paperRole ?? ''] ?? 'reference'}</span>;
}

export function MethodLabel({ m }: { m: MethodResult }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2 font-mono text-[13px] font-medium text-ink">
      <MethodDot id={m.id} dashed={isReference(m)} />
      <span className="truncate">{m.method}</span>
    </span>
  );
}

export function FidelityTag({ m }: { m: MethodResult }) {
  return m.fidelity === 'Faithful'
    ? <span className="font-mono text-[12px] text-ink-2">Faithful</span>
    : <span className="inline-flex h-5 items-center rounded-chip border border-dashed border-warn/50 px-1.5 font-mono text-[11px] text-warn">Proxy</span>;
}

/** Section heading row shared by the page's sections (mirrors the Section primitive). */
export function Head({ id, label, title, lead, aside }: { id: string; label: string; title: string; lead?: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-[68ch]">
        <p className="label mb-3">{label}</p>
        <h2 id={`${id}-h`} className="text-2xl font-semibold tracking-[-0.02em] text-ink md:text-4xl">{title}</h2>
        {lead && <p className="mt-4 text-pretty text-base leading-relaxed text-ink-2 md:text-lg">{lead}</p>}
      </div>
      {aside}
    </div>
  );
}

/** Points to the pairwise tests on the Leaderboard instead of restating the headline statistics (round-4 rule 7). */
export function PairwiseLink({ className = '' }: { className?: string }) {
  const go = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate('/leaderboard', { anchor: 'pairwise' });
  };
  return (
    <a href={href('/leaderboard')} onClick={go}
      className={`group inline-flex items-center gap-1 whitespace-nowrap rounded-chip font-medium text-accent underline decoration-accent/30 underline-offset-2 transition-colors duration-150 hover:decoration-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}>
      See pairwise tests
      <Icon name="arrow-right" size={12} className="transition-transform duration-150 group-hover:translate-x-0.5" />
    </a>
  );
}
