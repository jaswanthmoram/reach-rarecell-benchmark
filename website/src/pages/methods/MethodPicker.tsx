import { useId, useState, type ReactNode } from 'react';
import { EmptyState, Icon, fmt } from '../../ui';
import { MethodLabel, PairwiseLink } from './parts';
import { ROLE_WORD, isGpu, isRanked } from './shared';
import { DEFAULT_ANSWERS, UNSTABLE_PCT, answeredCount, isDefault, recommend, type Answers, type Fit, type Pick } from './pickerModel';

interface Option<T extends string> { value: T; title: string; hint: string }
interface Question<K extends keyof Answers> { key: K; ask: string; options: Option<NonNullable<Answers[K]>>[] }

const Q_LINEAGE: Question<'lineage'> = {
  key: 'lineage', ask: 'What separates your malignant cells from the rest?',
  options: [
    { value: 'inter', title: 'Other lineages', hint: 'Malignant cells against immune, stromal and normal-epithelial background (Tracks A to E).' },
    { value: 'intra', title: 'The same lineage', hint: 'Malignant against normal cells of the same epithelial lineage (Track F).' },
  ],
};
const Q_COMPUTE: Question<'compute'> = {
  key: 'compute', ask: 'What will you run it on?',
  options: [
    { value: 'cpu', title: 'CPU only', hint: 'A workstation or a CPU cluster node.' },
    { value: 'gpu', title: 'A GPU is available', hint: 'For example a Colab T4, as used for DeepScena.' },
  ],
};
const Q_STABILITY: Question<'stability'> = {
  key: 'stability', ask: 'Must every sample return usable scores?',
  options: [
    { value: 'required', title: 'Yes, stable output', hint: `Flag methods that fall back or return constant scores on ${UNSTABLE_PCT}% or more of units.` },
    { value: 'tolerant', title: 'No, I can rerun failures', hint: 'Keep methods that fail on some cohorts.' },
  ],
};

const FIT_TITLE: Record<Fit, string> = { start: 'Start with', consider: 'Also consider', care: 'Use with care' };
const SUMMARY: Record<string, string> = {
  inter: 'Inter-lineage', intra: 'Intra-lineage', cpu: 'CPU only', gpu: 'GPU available', required: 'Stable output', tolerant: 'Failures tolerated',
};

function Choice<K extends keyof Answers>({ q, n, value, onPick }: { q: Question<K>; n: number; value: Answers[K]; onPick: (v: NonNullable<Answers[K]>) => void }) {
  const name = useId();
  return (
    <fieldset className="min-w-0">
      <legend className="mb-3 flex items-baseline gap-2 text-[15px] font-semibold text-ink">
        <span className="font-mono text-[11px] font-normal text-ink-3 tabular">0{n}</span>{q.ask}
      </legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {q.options.map((o) => {
          const on = value === o.value;
          return (
            <label key={o.value}
              className={`group relative flex min-h-11 cursor-pointer flex-col gap-0.5 rounded-card border px-3.5 py-3 transition-[border-color,background-color] duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${on ? 'border-accent bg-accent-tint' : 'border-line bg-surface hover:border-line-strong'}`}>
              <input type="radio" name={name} value={o.value} checked={on} onChange={() => onPick(o.value)} className="sr-only" />
              <span className="flex items-center justify-between gap-2 text-sm font-medium text-ink">
                {o.title}
                <span aria-hidden="true" className={`grid size-4 shrink-0 place-items-center rounded-full border transition-colors duration-150 ${on ? 'border-accent bg-accent text-canvas' : 'border-line-strong bg-canvas'}`}>
                  {on && <Icon name="check" size={10} />}
                </span>
              </span>
              <span className="text-xs leading-snug text-ink-2">{o.hint}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function Line({ icon, tone, children }: { icon: 'check' | 'warning-circle'; tone: string; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-2">
      <Icon name={icon} size={14} className={`mt-[3px] shrink-0 ${tone}`} />
      <span>{children}</span>
    </li>
  );
}

function PickRow({ p }: { p: Pick }) {
  const role = isRanked(p.m) ? `Leaderboard rank ${p.m.publishedRankNum} of 6` : `Reference, not ranked (${ROLE_WORD[p.m.paperRole ?? ''] ?? 'reference'})`;
  return (
    <li className="border-t border-line py-4 first:border-t-0 first:pt-0">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <MethodLabel m={p.m} />
          <span className="font-mono text-[12px] text-ink tabular">
            {fmt.secs(p.m.runtimeS)} <span className="font-sans text-[11px] text-ink-3">per unit, {isGpu(p.m) ? 'T4 GPU' : 'CPU'}</span>
          </span>
        </div>
        <p className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-ink-3">
          <span>{role}</span><span aria-hidden="true">·</span>
          <span className="text-ink-2">{p.regime}</span><span aria-hidden="true">·</span>
          <span>Scenario {p.scenarios.join(', ')}</span>
        </p>
        <ul className="mt-2.5 flex flex-col gap-1">
          {p.reasons.map((r) => <Line key={r} icon="check" tone="text-ok">{r}</Line>)}
          {p.caveats.map((c) => (
            <Line key={c} icon="warning-circle" tone="text-warn">
              {c}{p.pairwise && c.endsWith('pairwise tests.') && <>{' '}<PairwiseLink /></>}
            </Line>
          ))}
        </ul>
      </div>
    </li>
  );
}

function Results({ a }: { a: Answers }) {
  const out = recommend(a);
  if (!out) {
    const left = 3 - answeredCount(a);
    return (
      <EmptyState compact icon="list-numbers" className="h-full justify-center bg-canvas"
        title={left === 3 ? undefined : `${left} more ${left === 1 ? 'answer' : 'answers'} to go`}>
        The shortlist appears here: each pick with the measured reason from the paper&apos;s practitioner scenarios, what to avoid, and how much it costs to run.
      </EmptyState>
    );
  }
  const groups = (['start', 'consider', 'care'] as const).map((f) => ({ f, picks: out.picks.filter((p) => p.fit === f) })).filter((g) => g.picks.length > 0);
  return (
    <div key={`${a.lineage}-${a.compute}-${a.stability}`} className="rise flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
        <p className="text-sm font-semibold text-ink">
          {out.picks.length === 1 ? 'One detector' : `${out.picks.length} detectors`} for this situation
        </p>
        <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3">
          {[a.lineage, a.compute, a.stability].map((v) => SUMMARY[v ?? '']).join(' · ')}
        </p>
      </div>
      {groups.map((g) => (
        <section key={g.f} aria-label={FIT_TITLE[g.f]}>
          <p className={`label mb-3 ${g.f === 'care' ? 'text-warn' : ''}`}>{FIT_TITLE[g.f]}</p>
          <ol className="flex flex-col">
            {g.picks.map((p) => <PickRow key={p.m.id} p={p} />)}
          </ol>
        </section>
      ))}
      <div className="rounded-card border border-line bg-canvas p-4">
        <p className="label mb-2">Avoid</p>
        <ul className="flex flex-col gap-1.5">
          {out.avoid.map((v) => (
            <li key={v.text} className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-2">
              <Icon name="x" size={13} className="mt-[4px] shrink-0 text-bad" />
              <span>{v.text} <span className="text-ink-3">(scenario {v.scenario})</span></span>
            </li>
          ))}
        </ul>
      </div>
      <ul className="flex flex-col gap-1.5">
        {out.notes.map((t) => (
          <li key={t} className="flex items-start gap-2 text-xs leading-relaxed text-ink-2">
            <Icon name="info" size={14} className="mt-px shrink-0 text-ink-3" />{t}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MethodPicker() {
  const [a, setA] = useState<Answers>(DEFAULT_ANSWERS);
  const set = <K extends keyof Answers>(k: K) => (v: NonNullable<Answers[K]>) => setA((prev) => ({ ...prev, [k]: v }));
  const preset = isDefault(a);
  return (
    <div className="rounded-card border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
        <p className="label">Method picker<span className="text-ink-2"> · {preset ? 'common case' : 'your answers'}</span></p>
        <button type="button" onClick={() => setA(DEFAULT_ANSWERS)} disabled={preset}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-chip px-2 text-xs font-medium text-ink-2 transition-colors duration-150 hover:bg-sunk hover:text-ink disabled:pointer-events-none disabled:opacity-40">
          <Icon name="arrow-left" size={13} />Reset to preset
        </button>
      </div>
      <div className="grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <form className="flex flex-col gap-7 self-start p-5 md:p-6 lg:sticky lg:top-20" onSubmit={(e) => e.preventDefault()} aria-label="Describe your data">
          <Choice q={Q_LINEAGE} n={1} value={a.lineage} onPick={set('lineage')} />
          <Choice q={Q_COMPUTE} n={2} value={a.compute} onPick={set('compute')} />
          <Choice q={Q_STABILITY} n={3} value={a.stability} onPick={set('stability')} />
        </form>
        <div className="border-t border-line p-5 md:p-6 lg:border-l lg:border-t-0" aria-live="polite">
          <Results a={a} />
        </div>
      </div>
    </div>
  );
}
