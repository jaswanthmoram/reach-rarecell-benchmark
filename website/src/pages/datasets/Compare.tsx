/* Compare two cohorts: chip picker, side-by-side grid and the six-detector small multiples. Pair lives in ?compare=a,b. */
import { cx, fmt } from '../../lib/format';
import { absoluteHref } from '../../lib/router';
import { COHORTS, TOTAL_CELLS, f3, int, logPos, tissueLabel, topRanked, type Cohort } from './model';
import { CompareMultiples } from './CompareMultiples';
import { CohortGlyph, SlotMark, btn, srOnly } from './parts';
import { hoverProps } from './hover';
import { SectionHeader } from '../../ui/SectionHeader';
import { Check, Copy, ICON_STROKE } from '../../ui/icons';
import { useCopy } from '../../ui/useCopy';

interface Block { big: string; sub: string; bar?: number }
type Row = { label: string; note: string; f: (c: Cohort) => Block };

const ROWS: Row[] = [
  { label: 'Cells', note: `Log scale, as in the catalogue. All cohorts: ${int(TOTAL_CELLS)}.`, f: (c) => ({ big: int(c.n), sub: `${fmt.pct(c.n / TOTAL_CELLS)} of all cells`, bar: logPos(c.n) }) },
  { label: 'CNV set +', note: 'Positive share of the CNV validation subset (Table 9b), not the malignant fraction.', f: (c) => (c.cc && c.pos != null ? { big: fmt.pct(c.pos / c.cc), sub: `${int(c.pos)} / ${int(c.cc)}`, bar: c.pos / c.cc } : { big: 'n/a', sub: 'no CNV reference in the release' }) },
  { label: 'CNV AUROC', note: 'infercnvpy call against author labels.', f: (c) => (c.au !== null ? { big: f3(c.au), sub: `sensitivity ${f3(c.se)}, specificity ${f3(c.sp)}` } : { big: 'n/a', sub: 'not validated' }) },
  { label: 'Tracks', note: 'Tracks that use this cohort.', f: (c) => ({ big: c.tracks.split('').join(' '), sub: c.units ? `${c.units} Track A units` : 'Track D only, natural prevalence' }) },
  { label: 'Highest-scoring ranked detector', note: 'Highest of the six ranked published detectors. Not a leaderboard rank.', f: (c) => { const r = topRanked(c); return r ? { big: `${r.method}  ${r.ap.toFixed(3)}`, sub: r.source === 'A' ? 'Track A mean AP, 20 units' : 'Track D AP, repository value' } : { big: 'n/a', sub: 'no per-method result for this cohort' }; } },
  { label: 'Source', note: 'GEO or GSA accession.', f: (c) => ({ big: c.acc.split('/').map((a) => a.trim()).join(', '), sub: c.platform }) },
];
const COPY_OPTS = { resetMs: 1600 } as const;
const EXAMPLE = [...COHORTS].sort((x, y) => y.n - x.n).slice(0, 2).map((c) => c.id);

const ghost = 'min-h-8 cursor-pointer rounded-chip border-0 bg-transparent px-2.5 text-[12px] font-medium text-ink transition-colors hover:bg-(--chip-active)';

/** One value cell. The sr-only prefix ties it to its column, since the rows are a visual grid, not a table. */
function Cell({ b, c, slot }: { b: Block; c: Cohort; slot: 0 | 1 }) {
  return (
    <span className="min-w-0">
      <span className={srOnly}>Cohort {slot === 0 ? 'A' : 'B'}, {c.id}: </span>
      <span className="block break-words font-mono text-[15px] font-semibold tabular-nums">{b.big}</span>
      <span className="mt-0.5 block text-[12px] text-ink-3">{b.sub}</span>
      {b.bar !== undefined && (
        <span aria-hidden="true" className="mt-2 block h-1 max-w-[220px] overflow-hidden rounded-[2px] bg-line">
          <span className="ds-grow block h-full origin-left rounded-[2px] bg-ink-2" style={{ transform: `scaleX(${b.bar.toFixed(3)})` }} />
        </span>
      )}
    </span>
  );
}

const grid = 'grid grid-cols-2 gap-x-6 gap-y-2 px-4 sm:grid-cols-[176px_minmax(0,1fr)_minmax(0,1fr)] sm:px-5';

function Head({ c, slot }: { c: Cohort; slot: 0 | 1 }) {
  return (
    <span className="min-w-0">
      <span className="flex items-center gap-1.5 font-mono text-[11px] text-ink-2"><SlotMark slot={slot} />Cohort {slot === 0 ? 'A' : 'B'}</span>
      <b className="break-all font-mono text-sm">{c.id}</b>
      <span className="block text-sm text-ink-2">{c.ct}</span>
      <span className="block text-[12px] text-ink-3">{tissueLabel(c)} · {c.platform}</span>
    </span>
  );
}

function SideBySide({ a, b }: { a: Cohort; b: Cohort }) {
  const anyTrackA = a.units > 0 || b.units > 0;
  return (
    <div className="rise mt-6 overflow-hidden rounded-card border border-line bg-surface shadow-[var(--elev-1)]">
      <div className={cx(grid, 'bg-sunk py-4')}>
        <span aria-hidden="true" className="hidden sm:block" />
        <Head c={a} slot={0} />
        <Head c={b} slot={1} />
      </div>
      {ROWS.map((r) => (
        <div key={r.label} className={cx(grid, 'border-t border-line py-3.5')}>
          <span className="col-span-2 sm:col-span-1"><span className="eyebrow block">{r.label}</span><span className="mt-1 block text-[12px] leading-snug text-ink-3">{r.note}</span></span>
          <Cell b={r.f(a)} c={a} slot={0} />
          <Cell b={r.f(b)} c={b} slot={1} />
        </div>
      ))}
      <div className="border-t border-line px-4 pb-5 pt-4 sm:px-5">
        <h3 className="m-0 mb-3 text-[15px] font-semibold">The six ranked detectors, Track A mean AP</h3>
        {anyTrackA ? <CompareMultiples a={a} b={b} /> : (
          <div className="rounded-[6px] border border-dashed border-line-strong p-6 text-center">
            <p className="m-0 text-sm font-semibold">Neither cohort is in Track A</p>
            <p className="mx-auto mb-0 mt-1.5 max-w-[60ch] text-[13px] leading-normal text-ink-2">
              {a.id} and {b.id} are evaluated only under natural prevalence (Track D). The paper prints no per-detector Track D table, so there is nothing to line up.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Same grid as SideBySide, drawn as dotted cells, so picking the second cohort does not make the page jump. */
function Placeholder({ a, n, onTry }: { a: Cohort | undefined; n: number; onTry: () => void }) {
  return (
    <div className="mt-6 overflow-hidden rounded-card border border-dashed border-line-strong bg-[rgb(255_255_255/0.5)]">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-dashed border-line-strong bg-surface px-4 py-3 sm:px-5">
        <p className="m-0 text-sm text-ink-2">
          <b className="font-semibold text-ink">{n === 1 ? 'Pick one more cohort.' : 'Pick two cohorts to compare.'}</b>{' '}
          {n === 1 && a ? `${a.id} is cohort A; the grid fills in with the second pick.` : 'The grid and detector panels fill in here.'}
        </p>
        {n === 0 && <button type="button" className={btn} onClick={onTry}>Try {EXAMPLE[0]} and {EXAMPLE[1]}</button>}
      </div>
      <div aria-hidden="true">
        <div className={cx(grid, 'py-4')}>
          <span className="hidden sm:block" />
          {a ? <Head c={a} slot={0} /> : <GhostHead slot={0} />}
          <GhostHead slot={1} />
        </div>
        {ROWS.map((r) => (
          <div key={r.label} className={cx(grid, 'border-t border-dashed border-line py-3.5')}>
            <span className="col-span-2 sm:col-span-1"><span className="eyebrow block">{r.label}</span><span className="mt-1 block text-[12px] leading-snug text-ink-3">{r.note}</span></span>
            {a ? <Cell b={r.f(a)} c={a} slot={0} /> : <GhostCell />}
            <GhostCell />
          </div>
        ))}
        <div className="border-t border-dashed border-line px-4 pb-5 pt-4 sm:px-5">
          <p className="m-0 mb-3 text-[15px] font-semibold text-ink-3">The six ranked detectors, Track A mean AP</p>
          <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="flex h-[116px] flex-col gap-2.5 rounded-chip border border-dashed border-line-strong p-3">
                <span className="ds-ghost h-3 w-28" />
                <span className="ds-ghost mt-1 h-2.5 w-full" />
                <span className="ds-ghost h-2.5 w-4/5" />
                <span className="ds-ghost mt-auto h-3 w-20" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function GhostHead({ slot }: { slot: 0 | 1 }) {
  return (
    <span className="min-w-0">
      <span className="flex items-center gap-1.5 font-mono text-[11px] text-ink-3"><SlotMark slot={slot} />Cohort {slot === 0 ? 'A' : 'B'}</span>
      <span className="ds-ghost mt-1.5 h-4 w-32" />
      <span className="ds-ghost mt-1.5 h-3.5 w-44 max-w-full" />
      <span className="ds-ghost mt-1.5 h-3 w-36 max-w-full" />
    </span>
  );
}

function GhostCell() {
  return (
    <span className="min-w-0">
      <span className="ds-ghost h-[18px] w-24" />
      <span className="ds-ghost mt-1.5 h-3 w-32 max-w-full" />
    </span>
  );
}

interface Props { pair: string[]; hot: string | null; onToggle: (id: string) => void; onHot: (id: string | null) => void; setPair: (p: string[]) => void }

export function Compare({ pair, hot, onToggle, onHot, setPair }: Props) {
  const { copy: copyText, state: copied } = useCopy(COPY_OPTS);
  const a = COHORTS.find((c) => c.id === pair[0]), b = COHORTS.find((c) => c.id === pair[1]);
  const n = pair.length;

  const copy = () => {
    const url = absoluteHref('/datasets', `compare=${pair.join(',')}`);
    void copyText(url);
  };

  const status = n === 2 && a && b ? `Comparing ${a.id} and ${b.id}. A third pick replaces cohort A.` : n === 1 && a ? `Cohort A is ${a.id}. Pick one more.` : 'Pick two cohorts.';

  return (
    <section id="compare" aria-labelledby="cmp-h" className="border-t border-line pb-14 pt-16 sm:pb-20 sm:pt-32">
      <SectionHeader
        id="cmp-h"
        title="Two cohorts, side by side"
        lede="Size, CNV-set share, tracks and the top score of a ranked detector line up on one grid. Below it, each of the six ranked detectors gets a small panel on the same 0 to 1 AP scale. Pick wells in the plate above or the chips here."
      />
      <p aria-live="polite" className={srOnly}>{status}</p>
      {n > 0 && (
      <div className="-mt-3 mb-3 flex min-h-8 flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p aria-hidden="true" className="m-0 text-sm text-ink-2">{status}</p>
        <div className="flex flex-wrap gap-1">
          {n === 2 && <button type="button" className={ghost} onClick={() => setPair([pair[1], pair[0]])}>Swap A and B</button>}
          {n > 0 && <button type="button" className={ghost} onClick={() => setPair([])}>Clear</button>}
          {n === 2 && (
            <button type="button" className={cx(btn, 'gap-1.5 px-2.5')} onClick={copy}>
              {copied === 'copied' ? <Check size={13} strokeWidth={ICON_STROKE} aria-hidden="true" /> : <Copy size={13} strokeWidth={ICON_STROKE} aria-hidden="true" />}
              <span aria-live="polite">{copied === 'copied' ? 'Copied' : copied === 'failed' ? 'Copy failed' : 'Copy link'}</span>
            </button>
          )}
        </div>
      </div>
      )}
      <ul aria-label="Cohorts to compare" className="m-0 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-[repeat(auto-fill,minmax(196px,1fr))]">
        {COHORTS.map((c) => {
          const slot = pair.indexOf(c.id), on = slot >= 0;
          return (
            <li key={c.id} className="min-w-0">
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onToggle(c.id)}
                {...hoverProps(c.id, onHot)}
                className={cx('flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-chip border bg-surface px-2.5 text-left transition-colors duration-150 hover:border-cell', on ? 'border-ink' : hot === c.id ? 'border-cell' : 'border-line')}
              >
                <CohortGlyph id={c.id} size={16} className="hidden sm:block" />
                <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-ink">{c.id}</span>
                {on ? <span className="inline-flex items-center gap-1 font-mono text-[11px] text-ink"><SlotMark slot={slot} />{slot === 0 ? 'A' : 'B'}</span> : <span className="font-mono text-[11px] text-ink-3">{int(c.n)}</span>}
              </button>
            </li>
          );
        })}
      </ul>

      {a && b ? <SideBySide key={`${a.id},${b.id}`} a={a} b={b} /> : <Placeholder a={a} n={n} onTry={() => setPair(EXAMPLE)} />}
    </section>
  );
}
