import { useEffect, useRef, type ReactNode } from 'react';
import { ROUTES, currentPath, href, routeLabel as labelOf, useNavPending, type Route, type RoutePath } from '../lib/router';
import { Mark } from './Header';

/**
 * The loader mark: the REACH 3x3 plate; the cobalt reticle sweeps across the plate and locks onto the vermilion
 * signal cell. Each sweep is finite (1.8s, six runs, then it rests locked); it exists only while a page loads.
 * Reduced or paused motion: the locked, still mark.
 */
function LoaderMark({ size = 40 }: { size?: number }) {
  const cells: { x: number; y: number; near: boolean }[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) if (!(r === 1 && c === 1)) cells.push({ x: 4 + c * 12, y: 4 + r * 12, near: r === 1 || c === 1 });
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0 overflow-visible">
      <g fill="#4a5160">
        {cells.map((p) => <circle key={`${p.x}-${p.y}`} cx={p.x} cy={p.y} r={2.3} opacity={p.near ? 0.78 : 0.42} />)}
      </g>
      <circle className="ld-signal" cx={16} cy={16} r={3.1} fill="var(--signal)" />
      <g className="ld-reticle">
        <path d="M 22.202 13.743 A 6.6 6.6 0 1 1 17.146 9.500" fill="none" stroke="var(--accent)" strokeWidth={1.6} strokeLinecap="round" />
      </g>
    </svg>
  );
}

/**
 * Loading state while a page chunk downloads: the same centred mark and wordmark as the boot screen in index.html, so a
 * reload and a route change look alike. It fills the first viewport (the footer stays below the fold, so the page
 * arriving shifts nothing) and fades in after 150ms, so a fast load never flashes it.
 */
export function PageLoading({ route }: { route: Route }) {
  const label = labelOf(route);
  return (
    <div aria-busy="true" className="grid min-h-[calc(100dvh-var(--header-h))] w-full place-items-center px-4">
      <p role="status" className="ld-root m-0 flex items-center gap-3 text-[17px] font-semibold tracking-[0.012em] text-ink">
        <LoaderMark size={32} />
        <span aria-hidden="true">REACH</span>
        <span className="sr-only">Loading the {label} page</span>
      </p>
    </div>
  );
}

/** Shared frame for the error and not-found states: first-viewport height, the mark, a mono eyebrow, the copy. */
function StateFrame({ eyebrow, title, children, role }: { eyebrow: ReactNode; title: string; children: ReactNode; role?: 'alert' }) {
  return (
    <div role={role} className="mx-auto flex min-h-[calc(100dvh-var(--header-h))] w-full max-w-[1240px] flex-col px-4 pb-16 pt-12 sm:px-6 lg:pt-16">
      <div className="flex max-w-[640px] flex-col items-start gap-5">
        <p className="m-0 flex items-center gap-3"><Mark size={40} /><span className="eyebrow">{eyebrow}</span></p>
        <h1 tabIndex={-1} className="m-0 text-balance text-[clamp(28px,3.2vw,40px)] font-semibold leading-[1.1] tracking-[-0.025em]">{title}</h1>
        {children}
      </div>
    </div>
  );
}

const btnPrimary = 'inline-flex min-h-10 items-center rounded-chip bg-ink px-4 text-sm font-medium text-canvas no-underline transition-transform duration-[var(--dur-1)] active:scale-[0.97]';
const btnLine = 'inline-flex min-h-10 items-center rounded-chip border border-line-strong bg-surface px-4 text-sm text-ink no-underline transition-colors duration-[var(--dur-1)] hover:bg-sunk active:scale-[0.97]';

/** Error state: the page chunk did not arrive. "Try again" refetches it; reload is the last resort. */
export function PageError({ route, onRetry }: { route: Route; onRetry: () => void }) {
  const other: { to: RoutePath; label: string } = route === '/leaderboard' ? { to: '/', label: 'Go to the overview' } : { to: '/leaderboard', label: 'Open the leaderboard' };
  return (
    <StateFrame role="alert" eyebrow={`${labelOf(route)} · not loaded`} title="This page did not load">
      <p className="m-0 max-w-[58ch] text-[15px] leading-relaxed text-ink-2">
        The page file could not be fetched. Your connection may have dropped, or the site was updated while this tab was open. Nothing you did was lost.
      </p>
      <span className="flex flex-wrap gap-2">
        <button type="button" onClick={onRetry} className={btnPrimary}>Try again</button>
        <button type="button" onClick={() => location.reload()} className={btnLine}>Reload the page</button>
        <a href={href(other.to)} className={btnLine}>{other.label}</a>
      </span>
    </StateFrame>
  );
}

/** Not-found state: names the address that missed and lists every page. */
export function NotFound() {
  const asked = typeof window === 'undefined' ? '' : currentPath();
  return (
    <StateFrame eyebrow={`404${asked ? ` · ${asked}` : ''}`} title="Nothing was found at this address">
      <p className="m-0 max-w-[58ch] text-[15px] leading-relaxed text-ink-2">
        The page may have moved, or the link was cut short. Every REACH page is listed below, and Use cases suggests a route by what you need.
      </p>
      <span className="flex flex-wrap gap-2">
        <a href={href('/')} className={btnPrimary}>Go to the overview</a>
        <a href={href('/use-cases')} className={btnLine}>Find your route</a>
      </span>
      <nav aria-label="All pages" className="w-full border-t border-line pt-5">
        <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
          {ROUTES.map((r) => (
            <li key={r.path}>
              <a href={href(r.path)} className="inline-flex min-h-9 items-center rounded-full border border-line bg-surface px-3 text-[13px] text-ink-2 no-underline transition-colors duration-[var(--dur-1)] hover:border-line-strong hover:text-ink">{r.label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </StateFrame>
  );
}

/** A navigation shorter than this never shows the bar. */
const SHOW_AFTER_MS = 120;
/** Longest the finishing sweep may take before the bar is reset (matches .route-progress in app.css). */
const FINISH_MS = 420;

/**
 * Thin top route-progress bar: grows (scaleX) while a route change is in flight, sweeps to the end and fades
 * when the page is on screen and its chunk loaded. Transform and opacity only.
 */
export function RouteProgress() {
  const busy = useNavPending();
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (busy) { started.current = performance.now(); el.dataset.state = 'run'; return; }
    if (el.dataset.state !== 'run') return;
    if (performance.now() - started.current < SHOW_AFTER_MS) { el.dataset.state = 'idle'; return; }
    el.dataset.state = 'done';
    const t = window.setTimeout(() => { if (el.dataset.state === 'done') el.dataset.state = 'idle'; }, FINISH_MS);
    return () => window.clearTimeout(t);
  }, [busy]);
  return <div ref={ref} aria-hidden="true" className="route-progress" data-state="idle" />;
}
