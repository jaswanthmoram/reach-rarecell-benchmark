// The clickable phase map in "Reproduce the paper": pick a phase to see its code, archive status, rerun
// command and the sections that cover it. With no pick, phases 11 and 12 (the snapshot rebuild) are lit.
import { useState } from 'react';
import { cx } from '../../lib/format';
import { C, Jump } from './kit';
import { GateNumbers } from './GateBand';
import { PHASES, gateX, pad2, sectionsForPhase, type PhaseMark } from './phases';

const DEFAULT_LIT = [11, 12] as const;

function Mark({ mark }: { mark: PhaseMark }) {
  if (!mark) return <span aria-hidden="true" className="inline-block w-2.5 flex-none" />;
  return <span aria-hidden="true" className={cx('inline-block size-2.5 flex-none rounded-full border', mark === 'snapshot' ? 'border-accent bg-accent' : 'border-ink-3 bg-surface')} />;
}

export function PhaseMap({ onJump }: { onJump: (id: string) => void }) {
  const [hot, setHot] = useState<number | null>(null);
  const lit: readonly number[] = hot ? [hot] : DEFAULT_LIT;
  const P = PHASES.find((p) => p.n === hot);
  return (
    <figure className="m-0 mt-7 overflow-hidden rounded-card border border-line bg-surface">
      <div className="border-b border-line bg-sunk px-4 pb-1 pt-3">
        <svg viewBox="0 0 1000 64" role="img" aria-label={`Twelve pipeline gates; ${hot ? `phase ${hot} is` : 'phases 11 and 12 are'} lit`} className="block h-auto w-full">
          {PHASES.map((p, i) => {
            const on = lit.includes(p.n);
            return <line key={p.n} className="rp-lit" x1={gateX(i)} x2={gateX(i)} y1={4} y2={60} stroke={on ? 'var(--accent)' : 'var(--line-strong)'} strokeWidth={on ? 2 : 1} />;
          })}
        </svg>
        <GateNumbers lit={lit} />
      </div>

      <ol aria-label="The twelve pipeline phases" className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(176px,1fr))] gap-x-4 gap-y-0.5 p-2">
        {PHASES.map((p) => {
          const on = p.n === hot;
          return (
            <li key={p.n}>
              <button type="button" aria-pressed={on} onClick={() => setHot(on ? null : p.n)}
                className={cx('flex min-h-10 w-full cursor-pointer items-baseline gap-2.5 rounded-chip border-0 px-2 py-1.5 text-left text-sm transition-colors duration-[var(--dur-1)]',
                  on ? 'bg-accent-tint font-medium text-ink' : 'bg-transparent text-ink-2 hover:bg-sunk hover:text-ink')}>
                <span className={cx('w-5 flex-none font-mono text-[11px] tabular-nums', on ? 'text-accent' : 'text-ink-3')}>{pad2(p.n)}</span>
                <span className="flex-auto">{p.name}</span>
                <span className="self-center"><Mark mark={p.mark} /></span>
                <span className="sr-only">{p.mark === 'snapshot' ? ', reruns from Git snapshots' : p.mark === 'archived' ? ', output archived on Zenodo' : ''}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div aria-live="polite" className="flex flex-col gap-2 border-t border-line px-4 py-3.5">
        <p className="m-0 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="eyebrow">{P ? `Phase ${pad2(P.n)}` : 'Phases 11 and 12'}</span>
          <span className="text-base font-semibold">{P ? P.name : 'Rebuild from Git snapshots'}</span>
        </p>
        <p className="m-0 text-sm leading-[1.6] text-ink-2">{P ? P.body : 'Pick a phase in the list to see where its code lives, whether its output is archived, and which section covers it.'}</p>
        {P && (
          <>
            {P.paper && <p className="m-0 text-[13px] leading-[1.6] text-ink-2"><span className="text-ink">In the paper:</span> {P.paper}</p>}
            <p className="m-0 text-[13px] leading-[1.6] text-ink-2">Source <C>{P.folder}</C> · Rerun <C>{P.cmd}</C></p>
            <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-2">
              Covered in
              {sectionsForPhase(P.n).map((s) => <Jump key={s.id} to={s.id} onJump={onJump}>{s.title}</Jump>)}
              <button type="button" onClick={() => setHot(null)}
                className="ml-auto min-h-8 cursor-pointer rounded-chip border border-line bg-surface px-2.5 text-xs text-ink-2 transition-colors duration-150 hover:border-line-strong hover:text-ink">Show snapshot phases</button>
            </p>
          </>
        )}
      </div>

      <figcaption className="flex flex-col gap-2 border-t border-line px-4 py-3 text-sm leading-[1.6] text-ink-2">
        <span className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
          <span className="inline-flex items-center gap-2"><Mark mark="snapshot" />Reruns from Git snapshots</span>
          <span className="inline-flex items-center gap-2"><Mark mark="archived" />Output archived on Zenodo</span>
        </span>
        <span>Source: <C>docs/architecture.md</C>. A Git checkout reruns phases 11 and 12 from frozen CSVs. The Zenodo archives hold the outputs of phases 2, 4 to 8 and 10, so a full-data rerun starts at phase 11.</span>
      </figcaption>
    </figure>
  );
}
