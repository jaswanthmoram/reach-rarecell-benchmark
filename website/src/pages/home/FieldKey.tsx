import { LEADERBOARD_DATA } from '../../data/benchmarkData';
import { MethodDot, methodColor } from '../../ui';
import type { Hot } from './CohortField';
import { RARE_PER_COHORT, SCENE, foundBy } from './heroModel';

const TOTAL = SCENE.cohorts.length * RARE_PER_COHORT;

/** Legend and readout for the live field: what the clouds are, and which rare cells the highlighted method rings. */
export default function FieldKey({ hot }: { hot: Hot }) {
  const found = hot ? foundBy(hot.id) : null;
  const m = hot ? LEADERBOARD_DATA.find((r) => r.id === hot.id) : undefined;
  const color = hot ? methodColor(hot.id) : 'var(--signal)';
  return (
    <section aria-labelledby="field-key-h" className="rounded-card border border-line bg-surface/80 p-5 backdrop-blur-sm">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="field-key-h" className="label">Live field</h2>
        <span className="font-mono text-[11px] text-ink-3">{SCENE.cohorts.length} cohorts · {TOTAL} rare cells</span>
      </div>

      <p aria-live="polite" className="mt-3 min-h-[4.5rem] text-sm leading-relaxed text-ink-2">
        {m && found
          ? <><span className="inline-flex items-center gap-1.5 font-mono text-ink"><MethodDot id={m.id} dashed={hot?.dashed} />{m.method}</span> rings <span className="font-mono text-ink tabular">{found.size} of {TOTAL}</span> rare cells: in each cohort, three times its mean AP on that cohort, rounded. Illustrative, not per-cell output.</>
          : <>Each cloud is one cohort, sized by its cell count. Three vermilion rare cells sit in each; the cobalt ring finds them in turn. Point at a method in the card, or tap it, to ring the cells it recovers.</>}
      </p>

      <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 border-t border-line pt-4" aria-label={m ? `Rare cells ringed by ${m.method}, per cohort` : 'Rare cells per cohort'}>
        {SCENE.cohorts.map((c, k) => {
          const n = found ? [0, 1, 2].filter((s) => found.has(k * RARE_PER_COHORT + s)).length : RARE_PER_COHORT;
          return (
            <li key={c.id} className="flex items-center justify-between gap-2 font-mono text-[11px] text-ink-2">
              <span className="truncate">{c.id}</span>
              <span className="flex shrink-0 gap-1" aria-label={`${n} of ${RARE_PER_COHORT}`}>
                {[0, 1, 2].map((s) => {
                  const on = s < n;
                  return (
                    <span key={s} aria-hidden="true"
                      className={`size-2 rounded-full border-[1.5px] transition-[background-color,border-color] duration-200 ${hot?.dashed ? 'border-dashed' : ''}`}
                      style={{ borderColor: on ? color : 'var(--line-strong)', backgroundColor: on && !hot?.dashed ? color : 'transparent' }} />
                  );
                })}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
