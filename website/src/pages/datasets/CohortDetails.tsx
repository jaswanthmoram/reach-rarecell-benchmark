/* Expanded row: description, per-cohort results, repository metadata. Shared by the table, specimen cards and phone list. */
import { cx } from '../../lib/format';
import { int, results, topRanked, type Cohort, type ResultLine } from './model';
import { Swatch, btn, eyebrow } from './parts';

const resultNote = (c: Cohort) =>
  c.units ? 'Mean AP over 20 Track A units; top scores as in Table 6a. The highest score in a cohort is not a leaderboard rank.' : 'Repository value; the paper prints no per-cohort Track D numbers.';
const unitsLine = (c: Cohort) => (c.units ? `${c.units} Track A units` : 'Not in Track A · natural prevalence (Track D)');

function Result({ r }: { r: ResultLine }) {
  return (
    <div className={cx(r.lead && 'rounded-chip border border-line bg-surface px-3 py-2.5')}>
      <dt className={eyebrow}>{r.label}</dt>
      <dd className="m-0 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="inline-flex items-center gap-1.5 font-mono text-[13px]"><Swatch method={r.name} ranked={r.ranked} />{r.name}</span>
        <span className="font-mono text-[13px] font-semibold tabular-nums">{r.value}</span>
        <span className="text-[12px] text-ink-3">{r.note}</span>
      </dd>
    </div>
  );
}

function Results({ c }: { c: Cohort }) {
  return (
    <div className="grid content-start gap-3">
      <dl className="m-0 grid content-start gap-3">
        {topRanked(c) === null && (
          <div><dt className={eyebrow}>Highest-scoring ranked detector</dt><dd className="m-0 mt-1 text-[12px] text-ink-3">n/a: no per-method result for this cohort</dd></div>
        )}
        {results(c).map((r) => <Result key={r.label} r={r} />)}
      </dl>
      <p className="m-0 text-[12px] leading-normal text-ink-3">{resultNote(c)}</p>
    </div>
  );
}

/** Three-column details for the table row. */
export function RowDetails({ c, onCompare }: { c: Cohort; onCompare: (id: string) => void }) {
  return (
    <div className="rise grid grid-cols-[minmax(0,1.15fr)_minmax(0,1.35fr)_minmax(0,0.9fr)] gap-6 text-sm">
      <div className="flex flex-col items-start gap-3">
        <p className="m-0 max-w-[60ch] leading-relaxed text-ink-2">{c.desc}</p>
        <p className="m-0 font-mono text-[12px] text-ink-3">{unitsLine(c)}</p>
        <button type="button" className={btn} onClick={() => onCompare(c.id)}>Compare this cohort</button>
      </div>
      <Results c={c} />
      <dl className="m-0 grid grid-cols-[auto_1fr] content-start gap-x-4 gap-y-2">
        <dt className={eyebrow}>Donors</dt><dd className="m-0">{c.donors}</dd>
        <dt className={eyebrow}>Genes</dt><dd className="m-0 font-mono">{int(c.genes)}</dd>
        <dt className={eyebrow}>Purity</dt>
        <dd className="m-0"><span className="rounded-chip border border-line bg-surface px-1.5 py-0.5 font-mono text-[11px]">{c.purity}</span></dd>
        <dd className="col-span-2 m-0 text-[12px] text-ink-3"><sup>d</sup> Repository metadata, not reported in the paper</dd>
      </dl>
    </div>
  );
}

/** Stacked details for the specimen cards and the phone list. */
export function StackDetails({ c, onCompare }: { c: Cohort; onCompare: (id: string) => void }) {
  return (
    <div className="rise mt-2 flex flex-col gap-3 border-t border-line pt-4 text-[13px]">
      <p className="m-0 leading-relaxed text-ink-2">{c.desc}</p>
      <p className="m-0 font-mono text-[12px] text-ink-3">{unitsLine(c)}</p>
      <Results c={c} />
      <p className="m-0 text-[12px] text-ink-2">{c.donors} · {int(c.genes)} genes · {c.purity} purity <sup>d</sup></p>
      <button type="button" className={cx(btn, 'self-start')} onClick={() => onCompare(c.id)}>Compare this cohort</button>
    </div>
  );
}
