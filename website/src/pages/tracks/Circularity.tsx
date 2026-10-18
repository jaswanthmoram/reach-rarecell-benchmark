import { CIRCULARITY_DATA, GLOBAL_STATS as G, type MethodResult } from '../../data/benchmarkData';
import { href } from '../../app/router';
import { MethodName, fmt } from '../../ui';
import { M, byName, byRefOrder, isCeiling, isRef, roleShort } from './model';

/*
 * Proof Table 9a, CNV-free labels. DESIGN v2.2: no 1-to-10 positions or shifts here, so rows show median AP with
 * and without CNV labels only. Ceiling above, the six ranked detectors in leaderboard order, then references.
 */
interface Row { id: string; method: string; m?: MethodResult; fullAP: number; noCnvAP: number }

const ROWS: Row[] = CIRCULARITY_DATA.map((r) => {
  const m = byName(r.method);
  return { id: m?.id ?? r.method, method: r.method, m, fullAP: r.fullAP, noCnvAP: r.noCnvAP };
});
const known = (r: Row): r is Row & { m: MethodResult } => r.m !== undefined;
const GROUPS: { title: string; rows: (Row & { m: MethodResult })[] }[] = [
  { title: 'Supervised ceiling, not ranked', rows: ROWS.filter(known).filter((r) => isCeiling(r.id)) },
  {
    title: 'Ranked detectors, leaderboard order 1 to 6',
    rows: ROWS.filter(known).filter((r) => !isRef(r.m)).sort((a, b) => (a.m.publishedRankNum ?? 0) - (b.m.publishedRankNum ?? 0)),
  },
  {
    title: 'Reference methods, not ranked',
    rows: ROWS.filter(known).filter((r) => isRef(r.m) && !isCeiling(r.id)).sort((a, b) => byRefOrder(a.m, b.m)),
  },
];

const noCnvLo = Math.min(...ROWS.map((r) => r.noCnvAP));
const noCnvHi = Math.max(...ROWS.map((r) => r.noCnvAP));
const keyOf = (m: MethodResult) => (isRef(m) ? roleShort(m) : String(m.publishedRankNum));

function DesktopTable() {
  return (
    <div className="hidden overflow-x-auto rounded-card border border-line bg-surface md:block">
      <table className="w-full min-w-[560px] text-left text-sm">
        <caption className="sr-only">Proof Table 9a: median Track A AP per method with and without CNV labels. Ceiling first, ranked detectors in leaderboard order, then references.</caption>
        <thead className="border-b border-line">
          <tr className="h-10">
            <th scope="col" className="label w-24 px-4 font-normal">Key</th>
            <th scope="col" className="label px-4 font-normal">Method</th>
            <th scope="col" className="label px-4 text-right font-normal">AP with CNV</th>
            <th scope="col" className="label px-4 text-right font-normal">AP without CNV</th>
          </tr>
        </thead>
        {GROUPS.map((g) => (
          <tbody key={g.title} className="border-b border-line last:border-b-0">
            <tr className="h-8 bg-sunk/50">
              <th scope="rowgroup" colSpan={4} className="label px-4 font-normal text-ink-3">{g.title}</th>
            </tr>
            {g.rows.map((r) => (
              <tr key={r.id} className="h-10 border-t border-line transition-colors duration-150 hover:bg-sunk/60">
                <td className={`px-4 font-mono text-[11px] tabular ${isRef(r.m) ? 'text-ink-3' : 'text-ink'}`}>{keyOf(r.m)}</td>
                <th scope="row" className="px-4 font-normal"><MethodName id={r.id} name={r.method} reference={isRef(r.m)} /></th>
                <td className="px-4 text-right font-mono text-ink tabular">{fmt.ap(r.fullAP)}</td>
                <td className="px-4 text-right font-mono text-ink-2 tabular">{fmt.ap(r.noCnvAP)}</td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

function MobileCards() {
  return (
    <div className="flex flex-col gap-4 md:hidden">
      {GROUPS.map((g) => (
        <section key={g.title} aria-label={g.title}>
          <p className="label mb-1.5">{g.title}</p>
          <ul className="divide-y divide-line rounded-card border border-line bg-surface">
            {g.rows.map((r) => (
              <li key={r.id} className="px-4 py-3">
                <span className="flex items-baseline justify-between gap-3">
                  <MethodName id={r.id} name={r.method} reference={isRef(r.m)} className="min-w-0 truncate" />
                  <span className="shrink-0 font-mono text-[11px] text-ink-3">{keyOf(r.m)}</span>
                </span>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <dt className="text-ink-2">AP with / without CNV</dt>
                  <dd className="text-right font-mono text-ink tabular">{fmt.ap(r.fullAP)} / {fmt.ap(r.noCnvAP)}</dd>
                </dl>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** Fact: label, value, context (the Stat order), one step down in scale so the table leads. */
function Fact({ label, value, context }: { label: string; value: string; context: string }) {
  return (
    <div className="flex flex-col gap-1 border-t border-line pt-3">
      <dt className="label">{label}</dt>
      <dd className="text-xl font-semibold tracking-[-0.02em] text-ink tabular">{value}</dd>
      <dd className="text-xs leading-snug text-ink-2">{context}</dd>
    </div>
  );
}

export function Circularity() {
  const fire = M.FiRE;
  return (
    <div className="grid gap-10 lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* The table is the section's dominant element; the three facts are context at one step down in scale. */}
      <dl className="grid content-start gap-5 sm:grid-cols-3 lg:grid-cols-1">
        <Fact label="Rank agreement, Spearman" value={G.circularitySpearmanRho.toFixed(3)}
          context={`Order agreement with and without CNV labels, Table 9a, p = ${G.circularityP}.`} />
        <Fact label="AP band without CNV" value={`${fmt.ap(noCnvLo)}–${fmt.ap(noCnvHi)}`}
          context={`Every method falls to near chance (${fire.method} ${fmt.ap(fire.medianAP)} to ${fmt.ap(ROWS.find((r) => r.id === fire.id)?.noCnvAP ?? 0)}). Only the broad order is kept.`} />
        <Fact label="Evidence arms kept" value="3 of 4" context="Source label, AUCell signature and kNN purity; the CNV arm is dropped." />
      </dl>

      <div className="min-w-0">
        <DesktopTable />
        <MobileCards />
        <p className="mt-3 max-w-[72ch] text-xs leading-relaxed text-ink-2">
          Median Track A AP per method under full and CNV-free labels (Table 9a). Key: leaderboard rank for the six ranked
          detectors, role for references. For the ranking itself, see the{' '}
          <a href={href('/leaderboard')} className="text-accent underline decoration-accent/30 underline-offset-2 hover:decoration-accent">leaderboard</a>.
        </p>
      </div>
    </div>
  );
}
