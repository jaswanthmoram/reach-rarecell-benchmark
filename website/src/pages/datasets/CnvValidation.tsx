import { GLOBAL_STATS } from '../../data/benchmarkData';
import { CIBar, fmt } from '../../ui';
import { CNV_COHORTS, NO_CNV, TOTALS, f3 } from './model';
import { CohortGlyph } from './parts';
import CnvChart from './CnvChart';

const ROWS = [...CNV_COHORTS].sort((a, b) => (b.cnvAUROC ?? 0) - (a.cnvAUROC ?? 0));
const DOMAIN: [number, number] = [0.5, 1];
const NUM = 'px-3 text-right font-mono tabular';

function Scale() {
  return (
    <div className="flex justify-between font-mono text-[11px] text-ink-3 tabular" aria-hidden="true">
      <span>0.5</span><span>0.75</span><span>1.0</span>
    </div>
  );
}

export default function CnvValidation() {
  const g = GLOBAL_STATS;
  const sens = ROWS.map((d) => d.cnvSensitivity ?? 0);
  const spec = ROWS.map((d) => d.cnvSpecificity ?? 0);
  const fewest = [...ROWS].sort((a, b) => (a.cnvNeg ?? 0) - (b.cnvNeg ?? 0))[0];
  return (
    <>
      <div className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10">
        <figure className="overflow-hidden rounded-card border border-line bg-surface">
          <figcaption className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-line px-4 py-2.5">
            <span className="label">Sensitivity against specificity · Table 9b</span>
            <span className="font-mono text-[11px] text-ink-3">point area · validation cells</span>
          </figcaption>
          <div className="px-3 pb-3 pt-4 md:px-5"><CnvChart /></div>
        </figure>
        <div className="flex flex-col gap-5 lg:pt-1">
          <dl className="grid grid-cols-2 gap-x-5 gap-y-4">
            <div className="border-t border-line pt-3">
              <dt className="label">Specificity</dt>
              <dd className="mt-1 font-mono text-xl font-semibold tracking-[-0.02em] text-ink tabular">{f3(g.cnvOverallSpecificity)}</dd>
              <dd className="mt-0.5 font-mono text-[11px] text-ink-2 tabular">{f3(Math.min(...spec))} to {f3(Math.max(...spec))}</dd>
            </div>
            <div className="border-t border-line pt-3">
              <dt className="label">Sensitivity</dt>
              <dd className="mt-1 font-mono text-xl font-semibold tracking-[-0.02em] text-ink tabular">{f3(g.cnvOverallSensitivity)}</dd>
              <dd className="mt-0.5 font-mono text-[11px] text-ink-2 tabular">{f3(Math.min(...sens))} to {f3(Math.max(...sens))}</dd>
            </div>
          </dl>
          <p className="text-sm leading-relaxed text-ink-2">
            Pooled over {fmt.int(TOTALS.cnvCells)} cells, the CNV call rarely flags a benign cell but misses many malignant ones. Specificity stays high in every cohort while sensitivity spreads widely, which is why aneuploidy is one of four required criteria and never a label on its own.
          </p>
          {fewest && (
            <p className="text-xs leading-relaxed text-ink-3">
              {fewest.id} reaches specificity {f3(fewest.cnvSpecificity)} on {fmt.int(fewest.cnvNeg ?? 0)} background cells, so that value carries little weight.
            </p>
          )}
        </div>
      </div>

      {/* md and up: table */}
      <div className="relative hidden overflow-x-auto rounded-card border border-line bg-surface md:block">
        <table className="w-full min-w-[860px] text-left text-sm">
          <caption className="sr-only">CNV arm agreement with author labels per cohort (Table 9b), sorted by AUROC, with pooled totals</caption>
          <thead className="border-b border-line bg-sunk">
            <tr className="h-10">
              <th scope="col" className="label px-3 font-normal">Cohort</th>
              <th scope="col" className="label w-[28%] px-3 font-normal"><span className="sr-only">AUROC on a 0.5 to 1.0 scale</span><Scale /></th>
              <th scope="col" className={`label font-normal ${NUM}`}>AUROC</th>
              <th scope="col" className={`label font-normal ${NUM}`}>Sens.</th>
              <th scope="col" className={`label font-normal ${NUM}`}>Spec.</th>
              <th scope="col" className={`label font-normal ${NUM}`}>MCC</th>
              <th scope="col" className={`label font-normal ${NUM}`}>Positive</th>
              <th scope="col" className={`label font-normal ${NUM}`}>Background</th>
              <th scope="col" className={`label font-normal ${NUM}`}>Cells</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((d) => (
              <tr key={d.id} className="h-10 border-b border-line transition-colors duration-150 hover:bg-sunk/45">
                <th scope="row" className="px-3 font-normal">
                  <span className="inline-flex items-center gap-2.5 font-mono text-[13px] text-ink"><CohortGlyph id={d.id} size={16} />{d.id}</span>
                </th>
                <td className="px-3"><CIBar value={d.cnvAUROC ?? 0} domain={DOMAIN} label={`${d.id}: CNV AUROC ${f3(d.cnvAUROC)}`} /></td>
                <td className={`${NUM} text-ink`}>{f3(d.cnvAUROC)}</td>
                <td className={`${NUM} text-ink-2`}>{f3(d.cnvSensitivity)}</td>
                <td className={`${NUM} text-ink-2`}>{f3(d.cnvSpecificity)}</td>
                <td className={`${NUM} text-ink-2`}>{f3(d.cnvMCC)}</td>
                <td className={`${NUM} text-ink-2`}>{fmt.int(d.cnvPos ?? 0)}</td>
                <td className={`${NUM} text-ink-2`}>{fmt.int(d.cnvNeg ?? 0)}</td>
                <td className={`${NUM} text-ink-2`}>{fmt.int(d.cnvCells ?? 0)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-sunk">
            <tr className="h-10 font-semibold">
              <th scope="row" className="px-3 font-mono text-[13px] font-semibold text-ink">Pooled · {ROWS.length} cohorts</th>
              <td className="px-3"><CIBar value={g.cnvOverallAUROC} domain={DOMAIN} highlight label={`Pooled CNV AUROC ${f3(g.cnvOverallAUROC)}`} /></td>
              <td className={`${NUM} text-ink`}>{f3(g.cnvOverallAUROC)}</td>
              <td className={`${NUM} text-ink`}>{f3(g.cnvOverallSensitivity)}</td>
              <td className={`${NUM} text-ink`}>{f3(g.cnvOverallSpecificity)}</td>
              <td className={`${NUM} text-ink`}>{f3(g.cnvOverallMCC)}</td>
              <td className={`${NUM} text-ink`}>{fmt.int(TOTALS.cnvPos)}</td>
              <td className={`${NUM} text-ink`}>{fmt.int(TOTALS.cnvNeg)}</td>
              <td className={`${NUM} text-ink`}>{fmt.int(TOTALS.cnvCells)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* under md: one row per cohort, the four Table 9b numbers in a fixed four-column grid */}
      <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface md:hidden">
        <li aria-hidden="true" className="bg-sunk px-4 py-2"><span className="label">AUROC</span><div className="mt-1"><Scale /></div></li>
        {ROWS.map((d) => (
          <li key={d.id} className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex min-w-0 items-center gap-2 break-all font-mono text-[13px] text-ink"><CohortGlyph id={d.id} size={16} />{d.id}</span>
              <span className="font-mono text-sm font-semibold text-ink tabular">{f3(d.cnvAUROC)}</span>
            </div>
            <div className="mt-1.5"><CIBar value={d.cnvAUROC ?? 0} domain={DOMAIN} label={`${d.id}: CNV AUROC ${f3(d.cnvAUROC)}`} /></div>
            <dl className="mt-1.5 grid grid-cols-[auto_auto_auto_minmax(0,1fr)] gap-x-4 font-mono tabular">
              {([['Sens.', f3(d.cnvSensitivity)], ['Spec.', f3(d.cnvSpecificity)], ['MCC', f3(d.cnvMCC)], ['Pos. / all', `${fmt.int(d.cnvPos ?? 0)} / ${fmt.int(d.cnvCells ?? 0)}`]] as const).map(([k, v], i) => (
                <div key={k} className={i === 3 ? 'text-right' : ''}>
                  <dt className="label">{k}</dt>
                  <dd className="mt-0.5 whitespace-nowrap text-[12px] text-ink-2">{v}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
        <li className="bg-sunk px-4 py-3 font-mono text-[12px] text-ink tabular">
          <span className="font-semibold">Pooled: AUROC {f3(g.cnvOverallAUROC)}</span>
          <span className="mt-0.5 block text-ink-2">Sens. {f3(g.cnvOverallSensitivity)} · Spec. {f3(g.cnvOverallSpecificity)} · MCC {f3(g.cnvOverallMCC)}</span>
          <span className="mt-0.5 block text-ink-2">{fmt.int(TOTALS.cnvPos)} + {fmt.int(TOTALS.cnvNeg)} = {fmt.int(TOTALS.cnvCells)} cells</span>
        </li>
      </ul>

      <p className="mt-3 max-w-[72ch] text-sm leading-relaxed text-ink-2">
        Agreement between the infercnvpy call and author annotations (Table 9b), sorted by AUROC; scale 0.5 to 1.0. Positive plus background sums to the validation set
        ({fmt.int(TOTALS.cnvPos)} + {fmt.int(TOTALS.cnvNeg)} = {fmt.int(TOTALS.cnvCells)}). {NO_CNV.join(', ')} has no CNV reference and is not included.
        Sensitivity is moderate, so a CNV call counts as one of the four criteria that must all agree.
      </p>
    </>
  );
}
