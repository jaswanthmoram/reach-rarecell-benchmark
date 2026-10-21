/* Small multiples: the six ranked detectors, Track A mean AP for cohort A (filled) and B (outlined), 0 to 1 scale. */
import { cx } from '../../lib/format';
import { METHODS, RANKED, cohortAP, type Cohort, type Score } from './model';
import { Swatch } from './parts';

const STATUS_NOTE: Partial<Record<Score['status'], string>> = { fallback: 'fallback run, no score', degenerate: 'degenerate output' };
const MIN_BAR = 0.012;
/** Bars grow from 0 when a pair is shown, panel by panel (a state change, not a scroll effect). */
const STEP_MS = 40;
/** A score in thousandths, as displayed (3 decimals), so A − B matches the two printed values. */
const milli = (v: number) => Math.round(Number(v.toFixed(3)) * 1000);

function Bar({ v, slot, step }: { v: Score; slot: 0 | 1; step: number }) {
  const degenerate = v.status === 'degenerate';
  return (
    <div className="grid grid-cols-[12px_minmax(0,1fr)_44px] items-center gap-2">
      <span className={cx('box-border size-[9px] rounded-full', slot === 0 ? 'bg-ink' : 'border-2 border-ink bg-surface')} />
      <span className="relative block h-2.5 overflow-hidden rounded-[2px] bg-(--chip-active)">
        {v.ap !== null && (
          <span
            className={cx('ds-grow absolute inset-0 origin-left rounded-[2px]', slot === 0 ? 'bg-ink' : 'bg-surface shadow-[inset_0_0_0_1.5px_var(--ink)]')}
            style={{ transform: `scaleX(${Math.max(MIN_BAR, v.ap).toFixed(3)})`, opacity: degenerate ? 0.4 : 1, animationDelay: `${step * STEP_MS}ms` }}
          />
        )}
      </span>
      <span className={cx('text-right font-mono text-[13px] tabular-nums', degenerate ? 'text-cell line-through' : 'text-ink')}>{v.ap === null ? 'n/a' : v.ap.toFixed(3)}</span>
    </div>
  );
}

export function CompareMultiples({ a, b }: { a: Cohort; b: Cohort }) {
  const missing = [a, b].filter((c) => !c.units);
  return (
    <>
      <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {RANKED.map((m, i) => {
          const va = cohortAP(a, i), vb = cohortAP(b, i);
          const diff = va.ap !== null && vb.ap !== null ? (milli(va.ap) - milli(vb.ap)) / 1000 : null;
          const notes = ([[a, va], [b, vb]] as const).filter(([, v]) => STATUS_NOTE[v.status]).map(([c, v]) => `${c.id}: ${STATUS_NOTE[v.status]}`);
          const said = `${m}, ranked ${METHODS[m].rank} of 6: ${a.id} ${va.ap === null ? 'n/a' : va.ap.toFixed(3)}, ${b.id} ${vb.ap === null ? 'n/a' : vb.ap.toFixed(3)}`;
          return (
            <li key={m} aria-label={said} className="flex flex-col rounded-chip border border-line bg-surface p-3">
              <p className="m-0 flex min-w-0 items-center gap-2">
                <span className="font-mono text-[11px] text-ink-3">{METHODS[m].rank}</span>
                <Swatch method={m} ranked />
                <span className="font-mono text-[13px]">{m}</span>
              </p>
              <div aria-hidden="true" className="mt-3 grid gap-1.5">
                <Bar v={va} slot={0} step={i} />
                <Bar v={vb} slot={1} step={i} />
              </div>
              <p aria-hidden="true" className={cx('m-0 mt-2.5 font-mono text-[11px]', diff === null ? 'text-ink-3' : 'text-ink')}>
                {diff === null ? 'A − B needs both scores' : `A − B ${diff >= 0 ? '+' : '−'}${Math.abs(diff).toFixed(3)}`}
              </p>
              {notes.map((t) => <p key={t} className="m-0 mt-1 text-[11px] leading-snug text-warn">{t}</p>)}
            </li>
          );
        })}
      </ul>
      <p className="m-0 mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-2">
        <span className="inline-flex items-center gap-1.5"><span className="size-[9px] rounded-full bg-ink" />{a.id}</span>
        <span className="inline-flex items-center gap-1.5"><span className="box-border size-[9px] rounded-full border-2 border-ink" />{b.id}</span>
        <span className="text-ink-3">Track A mean AP over 20 units, bars on 0 to 1. Six ranked detectors in leaderboard order; references omitted.</span>
      </p>
      {missing.length > 0 && (
        <p className="m-0 mt-2 flex flex-wrap gap-1.5">
          {missing.map((c) => <span key={c.id} className="rounded-chip border border-line bg-sunk px-1.5 py-0.5 font-mono text-[11px]">{c.id}: Track D only, no Track A score</span>)}
        </p>
      )}
    </>
  );
}
