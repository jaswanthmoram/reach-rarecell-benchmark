/* Paper Figure 1 with the States board's error state ("Figure 1 did not load", Load again). */
import { useState } from 'react';
import { GLOBAL_STATS } from '../../data/benchmarkData';
import { asset } from '../../lib/format';
import { href, preloadRoute } from '../../lib/router';
import { SectionHeader } from '../../ui/SectionHeader';
import { ArrowRight, ICON_STROKE } from '../../ui/icons';
import { Reveal } from '../../ui/motion';
import { COHORTS, int } from './model';
import { btn } from './parts';

const SRC = 'figures/paper/fig-1.webp';

export function PipelineFigure() {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const src = asset(SRC) + (attempt ? `?retry=${attempt}` : '');
  return (
    <section id="pipeline" aria-labelledby="fig-h" className="border-t border-line pb-20 pt-16 sm:pb-28 sm:pt-32">
      <SectionHeader id="fig-h" eyebrow="Figure 1" title="Where the cohorts sit in the pipeline" />
      <Reveal variant="mask" className="flex flex-wrap items-start gap-8">
        <figure className="m-0 min-w-0 flex-[999_1_560px] overflow-hidden rounded-card border border-line bg-surface shadow-[var(--elev-1)]">
          {failed ? (
            <div role="alert" className="px-5 py-8 text-center">
              <p className="m-0 text-base font-semibold">Figure 1 did not load</p>
              <p className="m-0 mb-1 mt-1.5 text-sm text-ink-2">The rest of the page is unaffected. You can also open the figure from the Figures page.</p>
              <p className="m-0 mb-4 font-mono text-[11px] text-ink-3">{SRC}</p>
              <button type="button" className={btn} onClick={() => { setFailed(false); setAttempt((n) => n + 1); }}>Load again</button>
            </div>
          ) : (
            <span className="block bg-canvas p-4 sm:p-6">
              <img
                src={src}
                width={1647}
                height={1172}
                loading="lazy"
                decoding="async"
                onError={() => setFailed(true)}
                alt={`Figure 1 of the paper: ${COHORTS.length} curated cohorts are preprocessed, labelled by four evidence arms, cut into six evaluation tracks, run through ${GLOBAL_STATS.methodsIncluded} method wrappers and summarised by metrics.`}
                className="block h-auto w-full"
              />
            </span>
          )}
          <figcaption className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-t border-line px-4 py-2.5 font-mono text-[11px] text-ink-3">
            <span className="uppercase tracking-[0.08em]">Figure 1 · Front. Bioinform. {GLOBAL_STATS.year}</span>
            <span>Proof Figure 1 (p. 3)</span>
          </figcaption>
        </figure>
        <div className="min-w-0 flex-[1_1_280px] lg:sticky lg:top-[calc(var(--header-h)+76px)]">
          <h3 className="m-0 text-lg font-semibold">From ten accessions to {int(GLOBAL_STATS.totalEvaluations)} evaluations</h3>
          <p className="m-0 mb-5 mt-3 text-sm leading-relaxed text-ink-2">Each cohort is preprocessed, labelled by four evidence arms, cut into six evaluation tracks (A to F) and scored for all ten methods.</p>
          <a
            href={href('/figures')}
            onPointerEnter={() => void preloadRoute('/figures')}
            onFocus={() => void preloadRoute('/figures')}
            className={`${btn} ds-nudge gap-1.5`}
          >
            All paper figures <ArrowRight size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
          </a>
        </div>
      </Reveal>
    </section>
  );
}
