import { Component, useCallback, useRef, useState, type ReactNode } from 'react';
import { GLOBAL_STATS as G } from '../../data/benchmarkData';
import { asset } from '../../lib/format';
import { href, preloadRoute, type RoutePath } from '../../lib/router';
import { ArrowRight, ArrowUpRight, ChartColumn, Database, FileText, GithubMark, ICON_STROKE } from '../../ui/icons';
import { CountUp } from '../../ui/motion';
import { useMedia } from '../../ui/useMedia';
import { FieldKey } from './FieldKey';
import { Headline } from './Headline';
import { HeroArt, HeroBackdrop, HeroCallouts } from './HeroStage';
import { HeroField } from './HeroField';
import { LiveField } from './LiveField';
import { ALL_ROWS, STATS } from './model';
import { RankCard } from './RankCard';
import { TrustStrip } from './TrustStrip';

/** States board, "field fails, content stays": if a visual cannot draw, the hero text and ranking card carry on without it. */
class VisualBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

const cta = 'hm-press group inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] px-5 text-[15px] font-medium no-underline';
const quiet = 'hm-ul group inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ink-2 no-underline hover:text-ink';
const icon = { strokeWidth: ICON_STROKE, 'aria-hidden': true } as const;
/** Warm the next route's chunk while the pointer is on its way (the View Transition then lands on the page, not a skeleton). */
const warm = (to: RoutePath) => ({ onPointerEnter: () => void preloadRoute(to), onFocus: () => void preloadRoute(to) });
const ext = { target: '_blank', rel: 'noopener noreferrer' } as const;
/** Desktop stage box: from the middle of the hero to the viewport's right edge. */
const STAGE_BOX = 'inset-y-[-32px] left-[50%] right-[calc((100%-100vw)/2)]';
/** Max parallax shift of the artwork, CSS px. */
const DRIFT = 14;
const NEW_TAB = <span className="sr-only"> (opens in a new tab)</span>;

/** The one status line: the article is out. Links to it. */
function PublishedChip() {
  return (
    <a href={G.articleUrl} {...ext}
      className="hm-pill fade-in group inline-flex min-h-8 max-w-full items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--accent)_26%,var(--line))] bg-white/80 py-1 pl-2.5 pr-3 text-[12px] leading-tight text-ink-2 no-underline hover:border-[color-mix(in_srgb,var(--accent)_50%,var(--line))] hover:text-ink">
      <FileText size={14} {...icon} className="shrink-0 text-accent-ink" />
      <span className="min-w-0">
        <span className="font-medium text-ink">Published {G.publishedDate}</span>
        <span className="hidden min-[400px]:inline"> · {G.journalName}</span>
      </span>
      <ArrowUpRight size={13} {...icon} className="hm-nudge-up shrink-0" />
      {NEW_TAB}
    </a>
  );
}

const EXPLORE: readonly { label: string; to?: RoutePath; url?: string; glyph: ReactNode }[] = [
  { label: 'Explore the methods', to: '/methods', glyph: <ChartColumn size={16} {...icon} /> },
  { label: 'View the code', url: G.githubUrl, glyph: <GithubMark size={15} /> },
  { label: 'Browse the datasets', to: '/datasets', glyph: <Database size={16} {...icon} /> },
];

function Actions() {
  return (
    <div className="rise mt-8 [animation-delay:520ms] lg:mt-9">
      <div className="flex flex-col gap-3 min-[480px]:flex-row min-[480px]:flex-wrap">
        <a href={href('/leaderboard')} {...warm('/leaderboard')} className={`${cta} bg-ink text-canvas hover:bg-[#262b33] hover:text-canvas`}>
          Open the leaderboard<ArrowRight size={16} {...icon} className="hm-nudge" />
        </a>
        <a href={asset('manuscript/reach-fbinf-2026-1878538.pdf')} {...ext}
          className={`${cta} border border-line-strong bg-surface text-ink hover:border-ink-3 hover:text-ink`}>
          <FileText size={16} {...icon} />Read the manuscript
          <span aria-hidden="true" className="h-4 w-px bg-line-strong" />
          <span className="font-mono text-[11px] font-normal text-ink-3">PDF</span>{NEW_TAB}
        </a>
      </div>
      <ul className="m-0 mt-4 flex list-none flex-wrap gap-x-6 gap-y-0 p-0">
        {EXPLORE.map((l) => (
          <li key={l.label}>
            <a href={l.to ? href(l.to) : l.url} {...(l.to ? warm(l.to) : ext)} className={quiet}>
              <span className="text-ink-3 transition-colors group-hover:text-ink">{l.glyph}</span>
              <span className="fx-underline">{l.label}</span>{l.url && NEW_TAB}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stats() {
  return (
    <section aria-label="Benchmark scale" className="grid grid-cols-3 gap-5 lg:gap-x-14">
      {STATS.map((s) => (
        <div key={s.label} className="min-w-0 border-t border-line-strong pt-3.5">
          <div className="text-[26px] font-semibold leading-none tracking-[-0.03em] sm:text-[30px]"><CountUp value={s.value} /></div>
          <div className="mt-2 text-[13px] font-medium text-ink">{s.label}</div>
          <a href={href(s.to)} {...warm(s.to)} className="fx-underline inline-block text-xs text-ink-2 hover:text-ink">{s.note}</a>
        </div>
      ))}
    </section>
  );
}

/**
 * Overview hero. A full-width flow field (HeroField) runs behind the whole hero band; the text sits left on a soft
 * canvas-colour pool; on desktop the artwork fills the right of the hero to the viewport edge with callout cards
 * pinned to it, below 1024px the portrait artwork is a faded backdrop behind the top-right of the text instead.
 * Then the trust strip, the scale strip, and the Track A ranking card beside the interactive cohort field.
 */
export function Hero() {
  // Only one artwork mounts (and downloads): the stage on desktop, the backdrop below it.
  const wide = useMedia('(min-width: 1024px)');
  const band = useRef<HTMLDivElement>(null);
  // The art drifts a few px against the pointer: written straight to CSS variables, no React render per move.
  const onPointer = useCallback((x: number, y: number) => {
    band.current?.style.setProperty('--hx', `${((0.5 - x) * DRIFT).toFixed(1)}px`);
    band.current?.style.setProperty('--hy', `${((0.5 - y) * DRIFT * 0.6).toFixed(1)}px`);
  }, []);
  // Pointer or keyboard focus previews a method; a click or tap pins it (tap again to clear).
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const hotId = previewId ?? pinnedId;
  const hot = ALL_ROWS.find((r) => r.id === hotId) ?? null;
  const pinned = ALL_ROWS.find((r) => r.id === pinnedId) ?? null;
  const handlers = { hotId, pinnedId, onPreview: setPreviewId, onPin: (id: string) => setPinnedId((p) => (p === id ? null : id)) };

  return (
    <section aria-labelledby="h1" className="relative overflow-hidden">
      {/* The hero band: full width, the flow field behind everything in it (art z-0, field z-1, callouts z-2, text z-10). */}
      <div ref={band} className="relative">
        {!wide && <VisualBoundary><HeroBackdrop className="absolute right-0 top-0" /></VisualBoundary>}
        <VisualBoundary><HeroField calm={wide ? 0.56 : 1} onPointer={onPointer} className="pointer-events-none absolute inset-0 z-[1] size-full" /></VisualBoundary>
        <div className="relative mx-auto max-w-[1240px] px-4 pb-4 pt-8 sm:px-6 lg:pb-10 lg:pt-14">
          <div className="relative lg:flex lg:min-h-[600px] lg:items-center">
            {wide && <VisualBoundary><HeroArt className={`absolute z-0 ${STAGE_BOX}`} /></VisualBoundary>}
            <div className="relative z-10 max-w-[40rem] lg:w-[52%] lg:max-w-none lg:pr-8">
              {/* A soft canvas-colour pool under the text, so the flow behind it reads as texture, not noise. */}
              <span aria-hidden="true" className="hm-calm pointer-events-none absolute -inset-x-16 -inset-y-12 -z-10" />
              <PublishedChip />
              <Headline className="m-0 mt-7 lg:mt-8" />
              <span aria-hidden="true" className="hm-rule mt-7 lg:mt-8" />
              <p className="rise m-0 mt-5 max-w-[30ch] text-balance font-display text-[20px] font-semibold leading-snug tracking-[-0.015em] text-ink [animation-delay:380ms] lg:text-[24px]">
                The top-ranked published detector is not significantly better than counting UMIs.
              </p>
              <p className="rise m-0 mt-4 max-w-[46ch] text-pretty text-[17px] leading-relaxed text-ink-2 [animation-delay:440ms] lg:text-[18px]">
                REACH benchmarks rare malignant-cell detection in single-cell RNA sequencing: {G.methodsIncluded} methods, {G.datasetsCount} tumour and blood cohorts, spike‑ins down to 0.01% prevalence, four‑arm ground truth.
              </p>
              <Actions />
            </div>
            {wide && <VisualBoundary><HeroCallouts className={`absolute z-[2] ${STAGE_BOX}`} /></VisualBoundary>}
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-[1240px] px-4 pb-12 sm:px-6 lg:pb-24">
        <TrustStrip className="rise relative z-10 mt-8 border-t border-line pt-6 [animation-delay:680ms] lg:mt-6" />
        <div className="rise mt-10 [animation-delay:760ms] lg:mt-12"><Stats /></div>
        <div className="mt-8 flex flex-col gap-8 lg:mt-10 lg:grid lg:grid-cols-2 lg:items-stretch lg:gap-x-14">
          <div className="rise flex min-w-0 flex-col [animation-delay:840ms] [&>*]:flex-1">
            <RankCard {...handlers} />
          </div>
          <div className="rise card flex min-w-0 flex-col overflow-hidden [animation-delay:920ms]">
            <div className="hm-field-mask-y flex flex-1 items-center border-b border-line bg-canvas px-2 pt-2">
              <VisualBoundary><LiveField hot={hot} className="h-auto w-full" /></VisualBoundary>
            </div>
            <FieldKey hot={hot} pinned={pinned} bare />
          </div>
        </div>
      </div>
    </section>
  );
}
