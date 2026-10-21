import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { GLOBAL_STATS as G } from '../data/globalStats';
import { ROUTES, href, preloadRoute, type Route } from '../lib/router';
import { cx } from '../lib/format';
import { ChevronDown, GithubMark, ICON_STROKE, Menu, X } from '../ui/icons';
import { useSlidingPill } from '../ui/useSlidingPill';
import { focusMain } from './routeFocus';

const MAIN = ROUTES.slice(0, 6);
const MORE = ROUTES.slice(6);
/** Start downloading a page as soon as someone points at or tabs to its link. */
const warm = (path: Route) => ({ onPointerEnter: () => { void preloadRoute(path); }, onFocus: () => { void preloadRoute(path); } });

/**
 * The canvas mark: 3x3 plate, signal cell centred, open reticle. `live`: the reticle swings in and locks once
 * (1.2s, finite), neighbours dip, the signal pulses; changing `cycle` plays it once more (hover/focus of the home
 * link). It never loops. Reduced or paused motion: the still mark.
 */
export function Mark({ size = 26, live = false, cycle = 0 }: { size?: number; live?: boolean; cycle?: number }) {
  const cells: { x: number; y: number; d: number }[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) if (!(r === 1 && c === 1)) cells.push({ x: 4 + c * 12, y: 4 + r * 12, d: Math.hypot(c - 1, r - 1) });
  // Alternating keyframe names restart the CSS animation without a reflow.
  const run = live ? (cycle % 2 ? 'b' : 'a') : undefined;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0 overflow-visible" data-mark-run={run}>
      <g fill="#4a5160">
        {cells.map((p) => (
          <circle key={`${p.x}-${p.y}`} className={live ? 'pm-cell' : undefined} style={live ? { animationDelay: `${Math.round(p.d * 70)}ms` } : undefined}
            cx={p.x} cy={p.y} r={2.3} opacity={p.d < 1.2 ? 0.78 : 0.42} />
        ))}
      </g>
      <circle className={live ? 'pm-signal' : undefined} cx={16} cy={16} r={3.1} fill="var(--signal)" />
      <path className={live ? 'pm-ring' : undefined} d="M 22.202 13.743 A 6.6 6.6 0 1 1 17.146 9.500" fill="none" stroke="var(--accent)" strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

/** Length of one find (matches .pm-* in app.css): a replay is ignored while one is still playing. */
const MARK_FIND_MS = 1300;

/** Replays the header mark's find on hover or keyboard focus of the home link, at most once per run. */
function useMarkReplay() {
  const [cycle, setCycle] = useState(0);
  const last = useRef(0);
  const replay = useCallback(() => {
    const now = performance.now();
    if (now - last.current < MARK_FIND_MS) return;
    last.current = now;
    setCycle((n) => n + 1);
  }, []);
  useEffect(() => { last.current = performance.now(); }, []); // the load run counts as the first
  return { cycle, replay };
}

const link = 'relative z-[1] inline-flex min-h-9 items-center rounded-full px-3 text-sm no-underline transition-[color,transform] duration-[var(--dur-1)] active:translate-y-px';

function MoreMenu({ route }: { route: Route }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const on = MORE.some((r) => r.path === route);
  useEffect(() => { if (ref.current) ref.current.open = false; }, [route]);
  useEffect(() => {
    const close = (e: PointerEvent) => { if (ref.current?.open && !ref.current.contains(e.target as Node)) ref.current.open = false; };
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !ref.current?.open) return;
      ref.current.open = false;
      ref.current.querySelector('summary')?.focus();
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', esc); };
  }, []);
  return (
    <details ref={ref} className="group relative z-[1]" onPointerEnter={() => MORE.forEach((r) => { void preloadRoute(r.path); })}>
      <summary data-pill-key="more" className={cx(link, 'cursor-pointer list-none gap-1 [&::-webkit-details-marker]:hidden', on ? 'font-medium text-ink' : 'text-ink-2 hover:bg-sunk hover:text-ink')}>
        More <ChevronDown size={14} strokeWidth={ICON_STROKE} aria-hidden="true" className="transition-transform duration-[var(--dur-2)] group-open:rotate-180" />
      </summary>
      <div className="pop-in absolute right-0 top-11 z-40 flex min-w-[220px] flex-col gap-0.5 rounded-[10px] border border-line bg-surface p-1.5 shadow-pop">
        {MORE.map((r) => (
          <a key={r.path} href={href(r.path)} aria-current={route === r.path ? 'page' : undefined} {...warm(r.path)}
            className={cx('flex min-h-[38px] items-center rounded-md px-3 text-sm text-ink no-underline transition-colors duration-[var(--dur-1)] hover:bg-sunk', route === r.path && 'bg-[var(--nav-active)]')}>{r.label}</a>
        ))}
      </div>
    </details>
  );
}

/** data-scrolled once the page leaves the top (sentinel + IntersectionObserver, no scroll handler). */
function useScrolled() {
  const sentinel = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { sentinel, scrolled };
}

/** 2px reading-progress bar: scaleX only, written once per frame. The scroll range is cached from a
 * ResizeObserver (after layout), so a scroll frame reads only scrollY. */
function useScrollProgressBar() {
  const bar = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let frame = 0;
    let max = 0;
    const paint = () => {
      frame = 0;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(paint); };
    const measure = () => { max = document.documentElement.scrollHeight - window.innerHeight; onScroll(); };
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
    return () => { ro.disconnect(); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', measure); cancelAnimationFrame(frame); };
  }, []);
  return bar;
}

/** Mobile sheet: Escape closes, Tab stays inside, the page behind does not scroll. */
function useSheet(open: boolean, close: () => void, toggle: RefObject<HTMLButtonElement | null>, panel: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = 'hidden';
    panel.current?.focus({ preventScroll: true }); // the panel, not the first link: no focus ring after a tap
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { close(); toggle.current?.focus(); return; }
      if (e.key !== 'Tab' || !panel.current) return;
      const items = [toggle.current, ...Array.from(panel.current.querySelectorAll<HTMLElement>('a'))].filter(Boolean) as HTMLElement[];
      const i = items.indexOf(document.activeElement as HTMLElement);
      const next = i < 0 ? (e.shiftKey ? items.length - 1 : 1) : e.shiftKey ? (i === 0 ? items.length - 1 : i - 1) : (i === items.length - 1 ? 0 : i + 1);
      e.preventDefault();
      items[next].focus();
    };
    document.addEventListener('keydown', onKey);
    return () => { html.style.overflow = prev; document.removeEventListener('keydown', onKey); };
  }, [open, close, toggle, panel]);
}

export function Header({ route }: { route: Route }) {
  const [sheet, setSheet] = useState(false);
  const [seen, setSeen] = useState(route);
  if (seen !== route) { setSeen(route); setSheet(false); }
  const { sentinel, scrolled } = useScrolled();
  const bar = useScrollProgressBar();
  const pillKey = MAIN.some((r) => r.path === route) ? route : MORE.some((r) => r.path === route) ? 'more' : null;
  const { containerRef, pillRef } = useSlidingPill<HTMLDivElement>(pillKey);
  const toggle = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setSheet(false), []);
  useSheet(sheet, close, toggle, panel);
  const { cycle, replay } = useMarkReplay();

  return (
    <>
      {/* First stop for keyboard users. Handled in JS: href="#main" alone would be read as a route. */}
      <a href="#main" onClick={(e) => { e.preventDefault(); focusMain(); }}
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:inline-flex focus:min-h-10 focus:items-center focus:rounded-chip focus:bg-ink focus:px-4 focus:text-sm focus:font-medium focus:text-canvas focus:no-underline focus:shadow-pop">
        Skip to content
      </a>
      <div ref={sentinel} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 h-px w-px" />
      <header className="site-header fx-header-hairline vt-header sticky top-0 z-30" data-scrolled={scrolled || sheet || undefined}>
        <nav aria-label="Main" className="flex min-h-[60px] w-full items-center gap-6 px-4 py-2.5 sm:px-8">
          <a href={href('/')} onPointerEnter={() => { void preloadRoute('/'); replay(); }} onFocus={() => { void preloadRoute('/'); replay(); }}
            className="pnav-home flex min-h-11 items-center gap-2.5 text-ink no-underline" aria-label="REACH Benchmark, overview">
            <Mark live cycle={cycle} />
            <span className="text-[17px] font-semibold tracking-[0.012em]">REACH</span>
            <span className="hidden font-mono text-[11px] tracking-[0.1em] text-ink-3 sm:inline">BENCHMARK</span>
          </a>
          <div className="hidden min-w-0 flex-1 justify-center lg:flex">
            <div ref={containerRef} className="relative flex flex-wrap items-center gap-0.5">
              <span ref={pillRef} aria-hidden="true" className="slide-pill" />
              {MAIN.map((r) => (
                <a key={r.path} href={href(r.path)} data-pill-key={r.path} aria-current={route === r.path ? 'page' : undefined} {...warm(r.path)}
                  className={cx(link, route === r.path ? 'font-medium text-ink' : 'text-ink-2 hover:bg-sunk hover:text-ink')}>{r.label}</a>
              ))}
              <MoreMenu route={route} />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <a href={G.githubUrl} target="_blank" rel="noopener noreferrer" aria-label="REACH source on GitHub"
              className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-ink px-3 text-[13px] font-medium text-canvas no-underline transition-transform duration-[var(--dur-1)] active:scale-[0.97] max-sm:px-2.5">
              <GithubMark size={15} /><span className="max-sm:sr-only">GitHub</span>
            </a>
            <button ref={toggle} type="button" onClick={() => setSheet((s) => !s)} aria-expanded={sheet} aria-controls="mobile-menu" aria-label={sheet ? 'Close menu' : 'Open menu'}
              className="grid size-11 place-items-center rounded-chip border border-line bg-surface text-ink-2 lg:hidden">
              {sheet ? <X size={16} strokeWidth={ICON_STROKE} aria-hidden="true" /> : <Menu size={16} strokeWidth={ICON_STROKE} aria-hidden="true" />}
            </button>
          </div>
        </nav>
        <span ref={bar} aria-hidden="true" className="scroll-progress" />
        <div id="mobile-menu" className="sheet lg:hidden" data-open={sheet || undefined} inert={!sheet}
          onClick={(e) => { if (e.target === e.currentTarget) setSheet(false); }}>
          <div ref={panel} tabIndex={-1} aria-label="Site pages" role="group" className="sheet-panel outline-none max-h-full overflow-y-auto border-t border-line bg-canvas px-4 pb-6 pt-2 shadow-pop">
            <ul className="m-0 list-none p-0">
              {ROUTES.map((r) => (
                <li key={r.path}>
                  <a href={href(r.path)} aria-current={route === r.path ? 'page' : undefined} {...warm(r.path)} onClick={close}
                    className={cx('flex min-h-12 items-center justify-between border-b border-line text-base text-ink no-underline', route === r.path && 'font-medium')}>
                    {r.label}{route === r.path && <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />}
                  </a>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between gap-3 pt-4">
              <span className="eyebrow">Source and data</span>
              <a href={G.githubUrl} target="_blank" rel="noopener noreferrer" aria-label="REACH source on GitHub"
                className="grid size-11 place-items-center rounded-chip border border-line bg-surface text-ink no-underline transition-colors duration-[var(--dur-1)] hover:bg-sunk">
                <GithubMark size={18} />
              </a>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
