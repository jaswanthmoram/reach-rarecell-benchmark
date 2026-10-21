import { useEffect, useRef } from 'react';
import { cx } from '../../lib/format';
import { Reveal, reducedMotion, useScrollProgress } from '../../ui/motion';
import { BranchIcon, KeyDot, PageChip } from './parts';
import type { Persona } from './personas';

/* "Route" section: goal, the questions the reader brings, and the numbered stops, with edge cases nested under the stop that raises them. */

/** Viewport fraction a stop has to pass to light up (audit Use cases P1: stops 1 to 5 light as each step enters view). */
const READING_LINE = 0.62;
const SUB = 'm-0 mb-2.5 text-sm font-medium text-ink-3';

/** Light every stop above the reading line and fill each rail segment up to it. DOM only, no re-render per frame. */
function paint(ol: HTMLOListElement | null) {
  if (!ol) return;
  const line = window.innerHeight * READING_LINE;
  const all = reducedMotion();
  ol.dataset.armed = 'on';
  ol.querySelectorAll<HTMLElement>('[data-stop]').forEach((el) => {
    const r = el.getBoundingClientRect();
    el.toggleAttribute('data-lit', all || r.top + r.height / 2 <= line);
  });
  ol.querySelectorAll<HTMLElement>('[data-rail]').forEach((el) => {
    const r = el.getBoundingClientRect();
    const f = all ? 1 : Math.min(1, Math.max(0, (line - r.top) / Math.max(1, r.height)));
    el.style.transform = `scaleY(${f.toFixed(3)})`;
  });
}

function Stops({ p }: { p: Persona }) {
  const list = useRef<HTMLOListElement>(null);
  // The wrapper is the scroll trigger; every tick re-measures the stops inside it.
  const trigger = useScrollProgress<HTMLDivElement>(() => paint(list.current));
  // A new reader swaps the stops: paint them against the current scroll position straight away.
  useEffect(() => { paint(list.current); }, [p.id]);

  return (
    <div ref={trigger} className="min-w-0">
    <ol ref={list} className="uc-stops m-0 flex list-none flex-col p-0" aria-label={`Route for ${p.role}`}>
      {p.steps.map((st, i) => {
        const key = i === p.keyStop - 1;
        const last = i === p.steps.length - 1;
        const edges = p.edges.filter((e) => e.step === i);
        return (
          <li key={`${p.id}-${st.l}-${i}`} className={cx('relative grid grid-cols-[32px_minmax(0,1fr)] gap-x-6 max-sm:grid-cols-[28px_minmax(0,1fr)] max-sm:gap-x-3', !last && 'pb-10')}>
            {!last && (
              <span aria-hidden="true" className="absolute top-8 bottom-0 left-[15.5px] w-px bg-line-strong max-sm:left-[13.5px] max-sm:top-7">
                <span data-rail className="uc-rail absolute inset-x-[-0.5px] top-0 h-full bg-accent" />
              </span>
            )}
            <span data-stop data-key={key || undefined}
              className={cx('uc-stop relative box-border grid size-8 place-items-center rounded-full border bg-surface font-mono text-xs font-semibold max-sm:size-7 max-sm:text-[11px]',
                key ? 'border-accent text-accent' : 'border-line-strong text-ink')}>
              <span className="sr-only">Stop </span>{i + 1}
            </span>
            <div className={cx('min-w-0', key ? 'uc-key fx-hairline-gradient -mt-3 rounded-card border bg-surface p-4 max-sm:-mt-2 max-sm:p-3' : 'pt-0.5')}>
              <span className="flex flex-wrap items-center gap-2">
                <PageChip to={st.to}>{st.l}</PageChip>
                {key && <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-ink"><KeyDot size={12} />Answers the main question</span>}
              </span>
              <p className="mt-2.5 mb-0 text-[15px] font-medium leading-[1.35] max-sm:text-sm">{st.does}</p>
              <p className="mt-1.5 mb-0 max-w-[64ch] text-sm leading-relaxed text-ink-2">{st.learns}</p>
              {edges.length > 0 && (
                <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3 max-sm:grid-cols-1">
                  {edges.map((e) => (
                    <div key={e.q} className="rounded-card border border-dashed border-line-strong bg-surface p-4 shadow-[var(--elev-1)]">
                      <p className="m-0 flex gap-2 text-sm font-medium leading-[1.4]"><BranchIcon /><span>“{e.q}”</span></p>
                      <p className="mt-2 mb-0 text-[13px] leading-relaxed text-ink-2">{e.a}</p>
                      <PageChip to={e.to} className="mt-3">{e.l}</PageChip>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
    </div>
  );
}

export function Route({ p }: { p: Persona }) {
  const summary = `${p.steps.length} stops · answered at stop ${p.keyStop}, ${p.keyLabel} · ${p.edges.length} edge cases`;
  return (
    <section id="journey" aria-labelledby="journey-h" className="mx-auto box-border max-w-[1240px] px-4 pt-14 pb-24 sm:px-6 max-sm:pt-10 max-sm:pb-16">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-line pb-6 max-sm:mb-8">
        <h2 id="journey-h" aria-live="polite" className="section-title m-0 text-balance">{p.role}</h2>
        <p className="m-0 font-mono text-xs text-ink-2">{summary}</p>
      </div>

      <div className="grid grid-cols-[minmax(0,4fr)_minmax(0,8fr)] gap-16 max-[900px]:grid-cols-1 max-[900px]:gap-10">
        <Reveal as="aside" className="flex flex-col gap-6 self-start min-[901px]:sticky min-[901px]:top-[calc(var(--header-h)+var(--section-nav-h,0px)+24px)]">
          <div>
            <h3 className={SUB}>Goal</h3>
            <p className="m-0 text-lg leading-[1.35] tracking-[-0.01em]">{p.goal}</p>
            <p className="mt-3 mb-0 text-sm leading-relaxed text-ink-2">{p.context}</p>
          </div>
          <div>
            <h3 className={SUB}>Questions they bring</h3>
            <ul className="card m-0 list-none p-0">
              {p.questions.map((q, i) => (
                <li key={q} className={cx('m-0 px-4 py-3 text-sm leading-[1.4]', i > 0 && 'border-t border-line')}>{q}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-card border border-line bg-sunk p-4">
            <h3 className={SUB}>Leaves with</h3>
            <p className="m-0 text-sm leading-relaxed">{p.leaves}</p>
          </div>
        </Reveal>

        <Stops p={p} />
      </div>
    </section>
  );
}
