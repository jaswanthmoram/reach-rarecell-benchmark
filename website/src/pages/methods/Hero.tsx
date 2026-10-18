import type { LiveLayout } from '../../ui';
import { Button, Container, LiveHero, MethodDot } from '../../ui';
import { href } from '../../app/router';
import { GLOBAL_STATS as G } from '../../data/benchmarkData';
import { LensField, type LensMethod } from './LensField';
import { hoverLens, pinLens, usePinnedLens, useFocusedLens } from './lensStore';
import { ROLE_GROUPS, isReference, scrollTo } from './shared';

/** Far layer: a sparse dust of cells drifting right very slowly, behind the lens stage (shared LiveField engine). */
const dust: LiveLayout = (r) => Array.from({ length: 420 }, () => ({ x: r(), y: r(), r: 0.5 + r() * 0.6, vx: 0.002 + r() * 0.003 }));

/** Page order: ceiling, ranked 1 to 6, then references (round-4 rule 1). */
const METHODS = ROLE_GROUPS.flatMap((g) => g.methods);
const LENSES: LensMethod[] = METHODS.map((m) => ({ id: m.id, name: m.method, ap: m.medianAP, reference: isReference(m) }));

function Legend() {
  const pinned = usePinnedLens();
  const focused = useFocusedLens();
  return (
    <div data-lens-legend className="absolute inset-x-0 bottom-0 px-4 pb-3 md:px-6 md:pb-4">
      <p className="mb-1.5 hidden font-mono text-[11px] text-ink-2 md:block">Each lens lights the cells its method ranks highest. Illustration: precision among lit cells is set to the median AP.</p>
      <ul aria-label="Method lenses" className="-mx-4 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        {METHODS.map((m) => {
          const on = pinned === m.id;
          const lit = focused === m.id;
          return (
            <li key={m.id} className="shrink-0">
              <button type="button" aria-pressed={on}
                onMouseEnter={() => hoverLens(m.id)} onMouseLeave={() => hoverLens(null)}
                onFocus={() => hoverLens(m.id)} onBlur={() => hoverLens(null)}
                onClick={() => pinLens(on ? null : m.id)}
                className={`inline-flex h-8 items-center gap-1.5 rounded-chip border px-2 font-mono text-[11px] transition-[border-color,background-color,color] duration-150 ${on ? 'border-accent bg-accent-tint text-ink' : lit ? 'border-line-strong bg-surface text-ink' : 'border-line bg-surface/80 text-ink-2 hover:border-line-strong hover:text-ink'}`}>
                <MethodDot id={m.id} dashed={isReference(m)} size={7} />
                {m.publishedRankNum != null && <span className="text-ink-3 tabular">{m.publishedRankNum}</span>}
                {m.method}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Hero() {
  return (
    <LiveHero layout={dust} seed={11} intensity={0.6} className="md:min-h-[340px]">
      <Container className="relative z-10 py-8 md:py-10">
        <div className="rise md:max-w-[min(540px,44vw)]">
          <h1 className="balance text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] text-ink md:text-[2.5rem]">
            {G.methodsIncluded} of {G.methodsAudited} candidates passed the audit. {G.methodsRankedPublished} are ranked.
          </h1>
          <p className="mt-3 max-w-[56ch] text-base leading-relaxed text-ink-2">
            What each method does, where it fails, why {G.methodsExcluded} were left out, and a picker for the detector that fits your data.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={() => scrollTo('guidance')} size="sm" iconRight="arrow-right">Pick a detector</Button>
            <Button href={href('/leaderboard')} variant="secondary" size="sm">Leaderboard</Button>
          </div>
        </div>
      </Container>
      {/* Lens stage: a band under the text on phones, the right half of the hero from md. */}
      <div className="relative h-[232px] border-t border-line md:absolute md:inset-y-0 md:right-0 md:h-auto md:w-[52%] md:border-l md:border-t-0">
        <LensField methods={LENSES} className="absolute inset-0" />
        <Legend />
      </div>
    </LiveHero>
  );
}
