import { Section } from '../../ui';
import { LEADERBOARD_DATA, PRACTITIONER_SCENARIOS } from '../../data/benchmarkData';
import { MethodLabel } from './parts';
import MethodPicker from './MethodPicker';
import { ROLE_WORD, SECTION_SCROLL } from './shared';

/** Which methods each scenario recommends, in page order, with the regime the recommendation is limited to. */
const PICKS: Record<string, { id: string; where?: string }[]> = {
  'intra-lineage': [{ id: 'scMalignantFinder', where: 'crc_lee only' }],
  'ultra-rare': [{ id: 'FiRE' }, { id: 'CaSee' }],
  'moderate-rare': [{ id: 'FiRE' }, { id: 'cellsius' }],
  'mesenchymal-rcc': [{ id: 'cellsius', where: 'rcc_multi' }, { id: 'RareQ', where: 'rcc_multi' }, { id: 'scCAD', where: 'Track D blood/CTC' }],
};

const method = (id: string) => LEADERBOARD_DATA.find((m) => m.id === id);
const roleOf = (id: string) => {
  const m = method(id);
  if (!m) return '';
  return m.publishedRankNum !== null ? `rank ${m.publishedRankNum}` : ROLE_WORD[m.paperRole ?? ''] ?? 'reference';
};

const needOf = (question: string) => question.replace(/^Scenario \d+:\s*/, '').replace('SAME', 'same');

function UseList({ id }: { id: string }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {(PICKS[id] ?? []).map((u) => {
        const m = method(u.id);
        return m && (
          <li key={`${u.id}-${u.where ?? ''}`} className="flex flex-col gap-0.5">
            <MethodLabel m={m} />
            <span className="pl-4 font-mono text-[11px] text-ink-3">{roleOf(u.id)}{u.where && ` · ${u.where}`}</span>
          </li>
        );
      })}
    </ul>
  );
}

const COLS = ['If you need', 'Use', 'Measured', 'Because', 'Avoid'] as const;

/** One row per practitioner scenario: the same five fields, so they read as a table. */
function ScenarioTable() {
  return (
    <>
      <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface lg:hidden">
        {PRACTITIONER_SCENARIOS.map((s) => (
          <li key={s.id} className="flex flex-col gap-3 p-4">
            <div>
              <p className="text-[15px] font-semibold leading-snug text-ink">{needOf(s.question)}</p>
              <p className="mt-1 font-mono text-[11px] text-ink-3">{s.badge}</p>
            </div>
            <dl className="flex flex-col gap-3 text-[13px] leading-relaxed">
              <div><dt className="label mb-1">Use</dt><dd><UseList id={s.id} /></dd></div>
              <div><dt className="label mb-1">Measured</dt><dd className="font-mono text-xs text-ink tabular">{s.expectedAP}</dd></div>
              <div><dt className="label mb-1">Because</dt><dd className="text-ink-2">{s.rationale}</dd></div>
              <div><dt className="label mb-1">Avoid</dt><dd className="text-ink-2">{s.avoidMethods}</dd></div>
            </dl>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto rounded-card border border-line bg-surface lg:block">
        <table className="w-full min-w-[960px] table-fixed border-collapse text-left text-[13px]">
          <caption className="sr-only">The paper's four practitioner scenarios: what each needs, which methods to use, the measured AP, why, and what to avoid</caption>
          <colgroup>
            <col className="w-[22%]" /><col className="w-[17%]" /><col className="w-[15%]" /><col /><col className="w-[17%]" />
          </colgroup>
          <thead>
            <tr className="h-10 border-b border-line bg-sunk">
              {COLS.map((h) => <th key={h} scope="col" className="label whitespace-nowrap px-3 font-normal first:pl-4">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {PRACTITIONER_SCENARIOS.map((s) => (
              <tr key={s.id} className="border-b border-line align-top transition-colors duration-150 last:border-b-0 hover:bg-sunk/50">
                <th scope="row" className="py-4 pl-4 pr-3 text-left font-normal">
                  <span className="block text-[14px] font-semibold leading-snug text-ink">{needOf(s.question)}</span>
                  <span className="mt-1.5 block font-mono text-[11px] text-ink-3">{s.badge}</span>
                </th>
                <td className="px-3 py-4"><UseList id={s.id} /></td>
                <td className="px-3 py-4 font-mono text-xs leading-relaxed text-ink tabular">{s.expectedAP}</td>
                <td className="px-3 py-4 leading-relaxed text-ink-2">{s.rationale}</td>
                <td className="py-4 pl-3 pr-4 leading-relaxed text-ink-2">{s.avoidMethods}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function Guidance() {
  return (
    <Section id="guidance" className={`border-t border-line ${SECTION_SCROLL}`} label="Practitioner guidance" title="Which detector for which job"
      lead="The picker opens on the common case. Change any answer and the shortlist, drawn from the paper's four practitioner scenarios, updates. Expected AP is what was measured in that regime, not a promise for new data.">
      <MethodPicker />

      <div className="mb-4 mt-16 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold tracking-[-0.01em] text-ink">The four scenarios behind the picker</h3>
        <p className="text-xs text-ink-2">Proof pages 18 to 19, read as decisions.</p>
      </div>
      <ScenarioTable />
    </Section>
  );
}
