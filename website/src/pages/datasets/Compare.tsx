import type { ReactNode } from 'react';
import { DATASETS_DATA, GLOBAL_STATS, type DatasetInfo } from '../../data/benchmarkData';
import { Badge, Button, CopyButton, EmptyState, MethodDot, MethodName, fmt } from '../../ui';
import { RANKED, TOTALS, bestRanked, cohortAP, f3, pct, tissueLabel, type CellStatus } from './model';
import { AccessionLinks, Cells, CnvShare, CohortGlyph, LogAxis, LogBar, TrackSlots } from './parts';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
const BY_ID = new Map(DATASETS_DATA.map((d) => [d.id, d]));
/** The two largest cohorts: a sensible first comparison when nothing is picked. */
const EXAMPLE = [...DATASETS_DATA].sort((a, b) => b.cellsNum - a.cellsNum).slice(0, 2).map((d) => d.id);

/* ---------- Slot marks: shape, not colour, tells cohort A from cohort B (colours belong to methods) ---------- */
export function SlotMark({ slot, size = 10 }: { slot: 0 | 1; size?: number }) {
  return slot === 0
    ? <span aria-hidden="true" className="inline-block shrink-0 rounded-full bg-ink" style={{ width: size, height: size }} />
    : <span aria-hidden="true" className="inline-block shrink-0 rounded-full border-2 border-ink bg-surface" style={{ width: size, height: size }} />;
}
const SLOT_NAME = ['A', 'B'] as const;

/* ---------- Picker ---------- */
function Picker({ pair, onToggle }: { pair: string[]; onToggle: (id: string) => void }) {
  return (
    <ul className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5" aria-label="Cohorts to compare">
      {DATASETS_DATA.map((d) => {
        const slot = pair.indexOf(d.id);
        const on = slot !== -1;
        return (
          <li key={d.id}>
            <button type="button" aria-pressed={on} onClick={() => onToggle(d.id)}
              className={cx('group flex h-11 w-full md:h-12 min-w-0 items-center gap-2 rounded-chip border px-2.5 text-left transition-[border-color,background-color] duration-150 active:bg-sunk',
                on ? 'border-ink/70 bg-surface' : 'border-line bg-surface/60 hover:border-line-strong hover:bg-surface')}>
              <CohortGlyph id={d.id} size={18} className={on ? 'text-ink' : 'transition-colors duration-150 group-hover:text-ink-2'} />
              <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-ink" title={d.id}>{d.id}</span>
              {on
                ? <span className="inline-flex items-center gap-1 font-mono text-[11px] text-ink"><SlotMark slot={slot as 0 | 1} size={9} />{SLOT_NAME[slot]}</span>
                : <span className="hidden font-mono text-[11px] text-ink-3 tabular sm:inline">{fmt.int(d.cellsNum)}</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- Side-by-side rows ---------- */
function Row({ label, a, b, note }: { label: string; a: ReactNode; b: ReactNode; note?: string }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 border-t border-line px-4 py-3.5 md:grid-cols-[176px_minmax(0,1fr)_minmax(0,1fr)] md:gap-x-6 md:px-5">
      <div className="col-span-2 mb-2 md:col-span-1 md:mb-0">
        <p className="label">{label}</p>
        {note && <p className="mt-1 hidden text-xs leading-snug text-ink-3 md:block">{note}</p>}
      </div>
      <div className="min-w-0">{a}</div>
      <div className="min-w-0">{b}</div>
    </div>
  );
}

const NA = ({ children }: { children: ReactNode }) => <span className="text-xs leading-snug text-ink-3">n/a: {children}</span>;

function Meter({ value }: { value: number }) {
  return (
    <span aria-hidden="true" className="mt-2 block h-1 w-full max-w-[220px] overflow-hidden rounded-full bg-line">
      <span className="block h-full origin-left rounded-full bg-ink-2 transition-transform duration-300 [transition-timing-function:var(--ease-out)]"
        style={{ transform: `scaleX(${Math.max(0.01, Math.min(1, value))})` }} />
    </span>
  );
}

function CohortHead({ d, slot }: { d: DatasetInfo; slot: 0 | 1 }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="hidden sm:block"><CohortGlyph id={d.id} size={20} framed /></span>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 font-mono text-[11px] text-ink-2"><SlotMark slot={slot} size={9} />Cohort {SLOT_NAME[slot]}</p>
        <p className="mt-1 break-all font-mono text-[13px] font-semibold text-ink sm:text-sm">{d.id}</p>
        <p className="mt-0.5 text-sm leading-snug text-ink-2">{d.cancerType}</p>
        <p className="mt-1 text-xs text-ink-3">{tissueLabel(d)} · {d.platform}</p>
      </div>
    </div>
  );
}

function BestRanked({ d }: { d: DatasetInfo }) {
  const b = bestRanked(d);
  if (!b) return <NA>no per-method result for this cohort</NA>;
  return (
    <span className="flex flex-col gap-1">
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <MethodName id={b.method} name={b.method} />
        <span className="font-mono text-sm font-semibold text-ink tabular">{fmt.ap(b.ap)}</span>
      </span>
      <span className="text-xs text-ink-3">{b.source === 'A' ? 'Track A mean AP, 20 units' : 'Track D AP, repository value'}</span>
    </span>
  );
}

/* ---------- Small multiples: one panel per ranked detector, cohort A and B as two bars on 0 to 1 ---------- */
const STATUS_NOTE: Record<CellStatus, string> = { ok: '', fallback: 'fallback run, no score', degenerate: 'degenerate output', 'no-track-a': 'Track D only' };
const signed = (v: number) => `${v >= 0 ? '+' : '\u2212'}${Math.abs(v).toFixed(3)}`;

function PanelBar({ slot, v }: { slot: 0 | 1; v: ReturnType<typeof cohortAP> }) {
  const fill = slot === 0 ? 'bg-ink' : 'border-[1.5px] border-ink bg-surface';
  return (
    <div className="grid grid-cols-[12px_minmax(0,1fr)_44px] items-center gap-2">
      <SlotMark slot={slot} size={9} />
      <span className="relative block h-2.5 rounded-[2px] bg-line/70">
        {v.ap !== null && (
          <span className={cx('absolute inset-y-0 left-0 w-full origin-left rounded-[2px] transition-transform duration-300 [transition-timing-function:var(--ease-out)]', fill, v.status === 'degenerate' && 'opacity-40')}
            style={{ transform: `scaleX(${Math.max(0.012, v.ap)})` }} />
        )}
      </span>
      <span className="text-right font-mono text-[13px] tabular">
        {v.ap === null ? <span className="text-[11px] text-ink-3">n/a</span>
          : <span className={v.status === 'degenerate' ? 'text-ink-3 line-through decoration-ink-3/60' : 'text-ink'}>{fmt.ap(v.ap)}</span>}
      </span>
    </div>
  );
}

function Multiples({ a, b }: { a: DatasetInfo; b: DatasetInfo }) {
  if (a.trackAUnits === 0 && b.trackAUnits === 0) {
    return (
      <EmptyState compact icon="chart-scatter" title="Neither cohort is in Track A" className="m-4 md:m-5">
        {a.id} and {b.id} are evaluated only under natural prevalence (Track D). The paper prints no per-detector Track D table, so there is nothing to line up.
      </EmptyState>
    );
  }
  const missing = [a, b].filter((d) => d.trackAUnits === 0).map((d) => d.id);
  return (
    <div className="px-4 pb-5 pt-3 md:px-5">
      <ul className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2 md:grid-cols-3">
        {RANKED.map((m) => {
          const va = cohortAP(a, m.id); const vb = cohortAP(b, m.id);
          const notes = ([[a, va], [b, vb]] as const).flatMap(([d, v]) => (v.status === 'fallback' || v.status === 'degenerate' ? [`${d.id}: ${STATUS_NOTE[v.status]}`] : []));
          const diff = va.ap !== null && vb.ap !== null ? va.ap - vb.ap : null;
          return (
            <li key={m.id} className="flex flex-col rounded-chip border border-line bg-surface p-3"
              aria-label={`${m.method}, ranked ${m.publishedRankNum} of 6: ${a.id} ${va.ap === null ? 'n/a' : fmt.ap(va.ap)}, ${b.id} ${vb.ap === null ? 'n/a' : fmt.ap(vb.ap)}`}>
              <p className="flex min-w-0 items-center gap-2">
                <span className="font-mono text-[11px] text-ink-3 tabular">{m.publishedRankNum}</span>
                <MethodDot id={m.id} />
                <span className="min-w-0 truncate font-mono text-[13px] text-ink" title={m.method}>{m.method}</span>
              </p>
              <div className="mt-3 grid gap-1.5" aria-hidden="true">
                <PanelBar slot={0} v={va} />
                <PanelBar slot={1} v={vb} />
              </div>
              <p className="mt-auto pt-2.5 font-mono text-[11px] text-ink-2 tabular">
                {diff !== null ? <>A − B <span className="text-ink">{signed(diff)}</span></> : <span className="text-ink-3">A − B needs both scores</span>}
              </p>
              {notes.map((n) => <p key={n} className="mt-1 text-[11px] leading-snug text-warn">{n}</p>)}
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-2">
        <span className="inline-flex items-center gap-1.5"><SlotMark slot={0} size={9} />{a.id}</span>
        <span className="inline-flex items-center gap-1.5"><SlotMark slot={1} size={9} />{b.id}</span>
        <span className="text-ink-3">Track A mean AP over 20 units, bars on 0 to 1. Six ranked detectors in leaderboard order; references omitted.</span>
      </div>
      {missing.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {missing.map((id) => <li key={id}><Badge>{id}: Track D only, no Track A score</Badge></li>)}
        </ul>
      )}
    </div>
  );
}

/* ---------- Section body ---------- */
export default function Compare({ pair, onToggle, onSet }: { pair: string[]; onToggle: (id: string) => void; onSet: (ids: string[]) => void }) {
  const chosen = pair.map((id) => BY_ID.get(id)).filter((d): d is DatasetInfo => Boolean(d));
  const [a, b] = chosen;
  const link = `${window.location.origin}${window.location.pathname}#/datasets?compare=${pair.join(',')}`;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* With fewer than two picks the EmptyState below asks; this line stays for screen readers only. */}
        <p className={cx('text-sm text-ink-2', chosen.length < 2 && 'sr-only')} aria-live="polite">
          {chosen.length === 2 ? <>Comparing <span className="font-mono text-ink">{a.id}</span> and <span className="font-mono text-ink">{b.id}</span>. A third pick replaces cohort A.</>
            : chosen.length === 1 ? <>Cohort A is <span className="font-mono text-ink">{a.id}</span>. Pick one more.</>
              : 'Pick two cohorts.'}
        </p>
        <div className="flex flex-wrap items-center gap-1">
          {chosen.length === 2 && <Button variant="ghost" size="sm" onClick={() => onSet([pair[1], pair[0]])}>Swap A and B</Button>}
          {chosen.length > 0 && <Button variant="ghost" size="sm" onClick={() => onSet([])}>Clear</Button>}
          {chosen.length === 2 && <CopyButton text={link} label="Copy link" toast="Comparison link copied" />}
        </div>
      </div>
      <Picker pair={pair} onToggle={onToggle} />

      <div className="mt-6">
        {chosen.length < 2 ? (
          <EmptyState icon="scales"
            title={chosen.length === 0 ? 'Pick two cohorts to compare' : 'Pick one more cohort'}
            action={chosen.length === 0
              ? <Button variant="secondary" size="sm" onClick={() => onSet(EXAMPLE)}>Try {EXAMPLE[0]} and {EXAMPLE[1]}</Button>
              : undefined}>
            {chosen.length === 0
              ? 'Choose any two of the ten cohorts above. Nothing is preselected.'
              : `${a.id} is cohort A. Choose a second cohort above to line them up.`}
          </EmptyState>
        ) : (
          <div className="fade-in overflow-hidden rounded-card border border-line bg-surface">
            <div className="grid grid-cols-2 gap-x-4 bg-sunk px-4 py-4 md:grid-cols-[176px_minmax(0,1fr)_minmax(0,1fr)] md:gap-x-6 md:px-5">
              <p className="label col-span-2 mb-3 md:col-span-1 md:mb-0 md:pt-0.5">Side by side</p>
              <CohortHead d={a} slot={0} /><CohortHead d={b} slot={1} />
            </div>
            <Row label="Cells" note={`Log scale, as in the catalogue. All cohorts: ${GLOBAL_STATS.totalCells}.`}
              a={<><span className="font-mono text-xl font-semibold tracking-[-0.02em] text-ink tabular"><Cells d={a} /></span><span className="mt-0.5 block text-xs text-ink-3">{pct(a.cellsNum, TOTALS.cells)} of all cells</span><span className="mt-2 block max-w-[220px]"><LogBar value={a.cellsNum} /><LogAxis className="mt-1" /></span></>}
              b={<><span className="font-mono text-xl font-semibold tracking-[-0.02em] text-ink tabular"><Cells d={b} /></span><span className="mt-0.5 block text-xs text-ink-3">{pct(b.cellsNum, TOTALS.cells)} of all cells</span><span className="mt-2 block max-w-[220px]"><LogBar value={b.cellsNum} /><LogAxis className="mt-1" /></span></>} />
            <Row label="CNV set +" note="Positive share of the CNV validation subset (Table 9b), not the malignant fraction."
              a={a.cnvCells === undefined ? <NA>no CNV reference in the release</NA> : <><CnvShare d={a} /><Meter value={(a.cnvPos ?? 0) / a.cnvCells} /></>}
              b={b.cnvCells === undefined ? <NA>no CNV reference in the release</NA> : <><CnvShare d={b} /><Meter value={(b.cnvPos ?? 0) / b.cnvCells} /></>} />
            <Row label="CNV AUROC" note="infercnvpy call against author labels."
              a={a.cnvAUROC === undefined ? <NA>not validated</NA> : <span className="font-mono text-[13px] text-ink tabular">{f3(a.cnvAUROC)}</span>}
              b={b.cnvAUROC === undefined ? <NA>not validated</NA> : <span className="font-mono text-[13px] text-ink tabular">{f3(b.cnvAUROC)}</span>} />
            <Row label="Tracks" note="Filled letters are the tracks that use this cohort."
              a={<><TrackSlots d={a} size="md" /><span className="mt-1.5 block text-xs text-ink-3">{a.trackAUnits ? `${a.trackAUnits} Track A units` : 'Track D only, natural prevalence'}</span></>}
              b={<><TrackSlots d={b} size="md" /><span className="mt-1.5 block text-xs text-ink-3">{b.trackAUnits ? `${b.trackAUnits} Track A units` : 'Track D only, natural prevalence'}</span></>} />
            <Row label="Best ranked detector" note="Highest of the six ranked published detectors. Not a leaderboard rank."
              a={<BestRanked d={a} />} b={<BestRanked d={b} />} />
            <Row label="Source" a={<AccessionLinks d={a} touch />} b={<AccessionLinks d={b} touch />} />
            <div className="border-t border-line">
              <p className="label px-4 pt-4 md:px-5">All six ranked detectors · Track A mean AP</p>
              <Multiples a={a} b={b} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
