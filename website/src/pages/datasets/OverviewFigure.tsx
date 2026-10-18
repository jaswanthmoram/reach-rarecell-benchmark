import { useState } from 'react';
import { FIGURES_DATA, GLOBAL_STATS } from '../../data/benchmarkData';
import { href } from '../../app/router';
import { Button, ErrorState, Icon, Skeleton, asset, fmt } from '../../ui';

const FIG1 = FIGURES_DATA.find((f) => f.figNum === 'Figure 1');
const SRC = asset('figures/paper/fig-1.webp');
const W = 1647;
const H = 1172;

type Load = 'loading' | 'ready' | 'error';

/** Figure 1 on its paper sheet. Skeleton while it loads (fixed aspect, no layout shift); ErrorState with retry if it fails. */
function Sheet() {
  const [state, setState] = useState<Load>('loading');
  const [attempt, setAttempt] = useState(0);
  const src = attempt === 0 ? SRC : `${SRC}?retry=${attempt}`;
  const retry = () => { setState('loading'); setAttempt((n) => n + 1); };

  if (state === 'error') {
    return (
      <ErrorState compact title="Figure 1 did not load" onRetry={retry} retryLabel="Load again" className="rounded-none border-0"
        detail="figures/paper/fig-1.webp">
        The rest of the page is unaffected. You can also open the figure from the Figures page.
      </ErrorState>
    );
  }
  return (
    <a href={src} target="_blank" rel="noreferrer" aria-label="Open Figure 1 at full size in a new tab"
      className="group relative block bg-[#fafafa] p-4 md:p-6">
      <span className="relative block" style={{ aspectRatio: `${W} / ${H}` }}>
        {/* The skeleton class sets position: relative, so it sits in its own absolute frame to stay out of flow. */}
        {state === 'loading' && <span className="absolute inset-0"><Skeleton className="h-full w-full rounded-chip" /></span>}
        <img key={attempt} src={src} width={W} height={H} loading="eager" fetchPriority="low" decoding="async"
          onLoad={() => setState('ready')} onError={() => setState('error')}
          alt="Figure 1 of the paper: ten curated cohorts are preprocessed, assigned confidence-tiered labels from four evidence arms, turned into six evaluation tracks, run through ten method wrappers and summarised by metrics and statistical tests."
          className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${state === 'ready' ? 'opacity-100' : 'opacity-0'}`} />
      </span>
      <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-chip border border-line-strong bg-surface px-2 py-1 text-xs text-ink-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
        <Icon name="arrows-out-simple" size={12} />Full size
      </span>
    </a>
  );
}

export default function OverviewFigure() {
  const g = GLOBAL_STATS;
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <figure className="reveal overflow-hidden rounded-card border border-line bg-surface">
        <Sheet />
        <figcaption className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-line px-4 py-2.5">
          <span className="label whitespace-nowrap">Figure 1 · {g.journalShort} {g.year}</span>
          <span className="whitespace-nowrap font-mono text-[11px] text-ink-3">{FIG1?.proofRef}</span>
        </figcaption>
      </figure>
      <div className="lg:sticky lg:top-24">
        <h3 className="text-lg font-semibold tracking-[-0.01em] text-ink">From ten accessions to {fmt.int(g.totalEvaluations)} evaluations</h3>
        <p className="mt-3 text-sm leading-relaxed text-ink-2">Each cohort is preprocessed, labelled by four evidence arms, cut into six evaluation tracks (A to F) and scored for all ten methods.</p>
        <div className="mt-5"><Button href={href('/figures')} variant="secondary" size="sm" iconRight="arrow-right">All paper figures</Button></div>
      </div>
    </div>
  );
}
