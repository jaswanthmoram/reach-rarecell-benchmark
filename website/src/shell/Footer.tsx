import type { ReactNode } from 'react';
import { GLOBAL_STATS as G } from '../data/globalStats';
import { ROUTES, href, preloadRoute } from '../lib/router';
import { useInView } from '../lib/motion';
import { ArrowUpRight, ICON_STROKE, Pause, Play } from '../ui/icons';
import { setMotionPaused, useMotionPaused } from '../ui/motion/paused';
import { ShaderBackdrop } from '../ui/effects/ShaderBackdrop';
import { Mark } from './Header';

const ext = 'inline-flex items-center gap-1 text-ink-2 no-underline transition-colors duration-[var(--dur-1)] hover:text-ink';

/** Every new-tab link says so to screen readers and drops the opener. */
function External({ to, children, className = ext }: { to: string; children: ReactNode; className?: string }) {
  return (
    <a href={to} target="_blank" rel="noopener noreferrer" className={className}>
      {children}<ArrowUpRight size={13} strokeWidth={ICON_STROKE} aria-hidden="true" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/** WCAG 2.2.2: one switch pauses every looping animation on the site (and remembers it). */
function MotionSwitch() {
  const paused = useMotionPaused();
  const Icon = paused ? Play : Pause;
  return (
    <button type="button" aria-pressed={paused} onClick={() => setMotionPaused(!paused)}
      className="inline-flex min-h-8 items-center gap-1.5 rounded-chip border border-line bg-surface px-2.5 text-xs text-ink-2 transition-colors duration-[var(--dur-1)] hover:border-line-strong hover:text-ink">
      <Icon size={12} strokeWidth={ICON_STROKE} aria-hidden="true" />{paused ? 'Play motion' : 'Pause motion'}
    </button>
  );
}

export function Footer() {
  const [ref, seen] = useInView<HTMLDivElement>(0.1);
  const paused = useMotionPaused();
  const links = (from: number, to?: number) => ROUTES.slice(from, to).map((r) => (
    <li key={r.path}><a href={href(r.path)} onPointerEnter={() => { void preloadRoute(r.path); }} onFocus={() => { void preloadRoute(r.path); }} className={ext}>{r.label}</a></li>
  ));
  return (
    <footer className="relative isolate mt-16 border-t border-line">
      {/* Very low intensity band (AA budget: design/DESIGN-r9.md); static CSS field under reduced or paused motion. */}
      <ShaderBackdrop intensity={0.22} palette="lab" fade="top" className="absolute inset-0 -z-10" />
      <div ref={ref} data-reveal={seen || paused ? 'in' : 'wait'} className="mx-auto grid max-w-[1240px] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <span className="flex items-center gap-2.5 text-[17px] font-semibold"><Mark size={24} />REACH</span>
          <p className="m-0 max-w-[54ch] text-sm leading-relaxed text-ink-2">
            Rare-cell Evaluation Across Cancer Heterogeneity: a reproducible benchmark of rare malignant cell detection in single-cell RNA-seq.
            {' '}{G.datasetsCount} cohorts, {G.tracksCount} tracks, {G.methodsIncluded} methods, {G.totalUnits.toLocaleString('en-GB')} benchmark units.
          </p>
          <p className="m-0 text-sm text-ink-2">
            {G.journalCitation}. <External to={G.articleUrl} className="inline-flex items-center gap-1 font-medium">Read the article on Frontiers</External>
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3" style={{ ['--i' as string]: 1 }}>
          <div>
            <p className="eyebrow m-0 mb-3">Pages</p>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-sm">{links(0, 5)}</ul>
          </div>
          <div>
            <p className="eyebrow m-0 mb-3">Resources</p>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-sm">{links(5)}</ul>
          </div>
          <div>
            <p className="eyebrow m-0 mb-3">Project</p>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-sm">
              <li><External to={G.articleUrl}>Article</External></li>
              <li><External to={G.githubUrl}>GitHub</External></li>
              <li><External to={`https://doi.org/${G.zenodoConceptDoi}`}>Zenodo archive</External></li>
            </ul>
          </div>
        </nav>
      </div>
      <div className="mx-auto flex max-w-[1240px] flex-col gap-3 border-t border-line px-4 py-5 text-xs text-ink-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <span>© {G.year} REACH authors · SRM University-AP</span>
        <span className="flex flex-wrap items-center gap-3">
          <MotionSwitch />
          <span className="font-mono">{G.version} · doi:{G.doi}</span>
        </span>
      </div>
    </footer>
  );
}
