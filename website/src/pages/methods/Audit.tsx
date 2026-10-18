import { Fragment } from 'react';
import { Badge, Icon, MethodDot, Section, asset, type IconName } from '../../ui';
import { GLOBAL_STATS as G, METHOD_AUDIT_DATA, type MethodAuditEntry } from '../../data/benchmarkData';
import { SECTION_SCROLL, inPageOrder, isReferenceId, scrollTo } from './shared';

/** Included methods in page order: ceiling, ranked 1 to 6, then comparator and baselines. */
const included = inPageOrder(METHOD_AUDIT_DATA.filter((e) => e.status !== 'Excluded'), (e) => e.method);
const excluded = METHOD_AUDIT_DATA.filter((e) => e.status === 'Excluded');
/** Reason text from proof Figure 3a, sentence case. */
const reasonOf = (e: MethodAuditEntry) => {
  const r = e.auditOutcome.replace(/^Excluded:\s*/, '');
  return r.charAt(0).toUpperCase() + r.slice(1);
};
const entry = (method: string) => excluded.find((e) => e.method === method);
/** The audit table uses ", " for fields the proof does not report. */
const known = (s: string) => (/^[\s,]*$/.test(s) ? null : s);

/** Inclusion criteria, one per exclusion reason in proof Figure 3a. */
const CRITERIA: { icon: IconName; title: string; body: string; failed: string[] }[] = [
  { icon: 'rows', title: 'Scores each cell', body: 'One value per cell, so average precision can rank every cell in a unit.', failed: ['raceid3'] },
  { icon: 'timer', title: 'Finishes at benchmark scale', body: 'Completes the Track A units at their real cell counts.', failed: ['scAIDE'] },
  { icon: 'dna', title: 'Runs on scRNA-seq alone', body: 'Expression counts are the only input, with no paired modality.', failed: ['SCANER'] },
  { icon: 'pulse', title: 'Returns non-constant scores', body: 'Scores must vary across cells, because a constant output carries no ranking.', failed: ['MACE'] },
  { icon: 'list-numbers', title: 'Ranks cells by expression', body: 'A continuous expression-based score. CNV callers, tumour-only callers and label classifiers do not rank cells.', failed: ['CopyKAT', 'SCEVAN', 'scATOMIC'] },
];

const Missing = () => <span className="text-ink-3">Not reported</span>;

/** Excluded candidates grouped under the criterion each one failed, in the order of proof Figure 3a. */
const GROUPS = CRITERIA.map((c) => ({ ...c, rows: c.failed.map(entry).filter((e): e is MethodAuditEntry => Boolean(e)) }));
const COLS = 4;

function Meta({ e }: { e: MethodAuditEntry }) {
  return (
    <>
      <span className="block text-ink-2">{known(e.language) ?? <Missing />}</span>
      <span className="block text-xs text-ink-3">{known(e.venueYear) ?? 'Venue not reported'}</span>
    </>
  );
}

/** The ten included methods are documented in the matrix above; here they are one row that points there. */
function IncludedSummary() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-ink">
          <Badge tone="ok"><Icon name="check" size={11} />Included</Badge>
          {included.length} methods passed all five criteria
        </p>
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1" aria-label="Included methods">
          {included.map((e) => (
            <li key={e.method} className="inline-flex items-center gap-1.5 font-mono text-[12px] text-ink-2">
              <MethodDot id={e.method} dashed={isReferenceId(e.method)} />{e.method}
            </li>
          ))}
        </ul>
      </div>
      <button type="button" onClick={() => scrollTo('matrix')}
        className="group inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-chip px-2 text-sm font-medium text-accent transition-colors duration-150 hover:bg-accent-tint">
        Details in the method matrix
        <Icon name="caret-up" size={14} className="transition-transform duration-150 group-hover:-translate-y-0.5" />
      </button>
    </div>
  );
}

function CriterionHead({ g }: { g: (typeof GROUPS)[number] }) {
  return (
    <span className="flex items-start gap-3">
      <span className="mt-px grid size-7 shrink-0 place-items-center rounded-chip border border-line bg-surface text-ink-3"><Icon name={g.icon} size={15} /></span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-[13px] font-semibold text-ink">{g.title}</span>
          <span className="font-mono text-[11px] text-bad tabular">{g.rows.length} excluded</span>
        </span>
        <span className="mt-0.5 block text-xs leading-snug text-ink-2">{g.body}</span>
      </span>
    </span>
  );
}

function ExcludedMark({ e }: { e: MethodAuditEntry }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[13px] font-medium text-ink">
      <Icon name="x" size={12} className="shrink-0 text-bad" />
      <span>{e.method}<span className="sr-only">, excluded</span></span>
    </span>
  );
}

function AuditCards() {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface md:hidden">
      <div className="bg-sunk/50 p-4"><IncludedSummary /></div>
      {GROUPS.map((g) => (
        <section key={g.title} aria-label={g.title} className="border-t border-line">
          <div className="bg-canvas px-4 py-3"><CriterionHead g={g} /></div>
          <ul className="divide-y divide-line border-t border-line">
            {g.rows.map((r) => (
              <li key={r.method} className="flex flex-col gap-1 px-4 py-3">
                <ExcludedMark e={r} />
                <p className="text-[13px] leading-relaxed text-ink">{reasonOf(r)}</p>
                <p className="text-xs text-ink-3">
                  {[known(r.language), known(r.venueYear), known(r.paradigm)].filter(Boolean).join(' · ') || 'Language, venue and paradigm not reported'}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function AuditTable() {
  return (
    <div className="hidden overflow-x-auto rounded-card border border-line bg-surface md:block">
      <table className="w-full min-w-[720px] table-fixed border-collapse text-left text-[13px]">
        <caption className="sr-only">
          Inclusion audit of {METHOD_AUDIT_DATA.length} candidates: one row for the {included.length} included methods, then the {excluded.length} exclusions grouped by the criterion each failed, with the reason from proof Figure 3a
        </caption>
        <colgroup><col className="w-[22%]" /><col className="w-[18%]" /><col className="w-[24%]" /><col /></colgroup>
        <thead>
          <tr className="h-10 border-b border-line bg-sunk">
            {['Method', 'Language · venue', 'Paradigm', 'Reason'].map((h) => (
              <th key={h} scope="col" className="label whitespace-nowrap px-3 font-normal first:pl-4">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-line bg-sunk/40"><td colSpan={COLS} className="px-4 py-3"><IncludedSummary /></td></tr>
          {GROUPS.map((g) => (
            <Fragment key={g.title}>
              <tr className="border-b border-line bg-canvas">
                <th colSpan={COLS} scope="colgroup" className="px-4 py-3 text-left font-normal"><CriterionHead g={g} /></th>
              </tr>
              {g.rows.map((r) => (
                <tr key={r.method} className="border-b border-line align-top transition-colors duration-150 last:border-b-0 hover:bg-sunk/50">
                  <th scope="row" className="py-3 pl-4 pr-3 text-left font-normal"><span className="pl-10"><ExcludedMark e={r} /></span></th>
                  <td className="px-3 py-3"><Meta e={r} /></td>
                  <td className="px-3 py-3 text-ink-2">{known(r.paradigm) ?? <Missing />}</td>
                  <td className="px-3 py-3 pr-4 leading-relaxed text-ink">{reasonOf(r)}</td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Audit() {
  return (
    <Section id="audit" className={`border-t border-line ${SECTION_SCROLL}`} label={`Inclusion audit · ${G.methodsAudited} candidates`}
      title="How ten of seventeen made it in"
      lead={`Every candidate was audited before any benchmark run. ${G.methodsIncluded} passed all five criteria. The other ${G.methodsExcluded} sit under the criterion each one failed, with the reason from proof Figure 3a.`}>
      <AuditCards />
      <AuditTable />
      <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-2">
        <span>Proof Figure 3 also plots Track A AP for the ten included methods and their fallback and degenerate rates.</span>
        <a href={asset('figures/paper/fig-3.webp')} target="_blank" rel="noreferrer"
          className="inline-flex min-h-10 items-center gap-1 rounded-chip font-medium text-accent underline decoration-accent/30 underline-offset-2 transition-colors duration-150 hover:decoration-accent focus-visible:outline-2 focus-visible:outline-accent">
          Open Figure 3 <Icon name="arrow-up-right" size={12} />
        </a>
      </p>
    </Section>
  );
}
