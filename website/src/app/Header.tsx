import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { GLOBAL_STATS } from '../data/benchmarkData';
import { Button, Container, Icon, Lockup, Tooltip } from '../ui';
import { ROUTES, href, type Route } from './router';
import { MOD_KEY, openCommandPalette, toggleTheme, useTheme } from './theme';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
const PRIMARY = ROUTES.slice(0, 5);
const MORE = ROUTES.slice(5);
const GITHUB_URL = GLOBAL_STATS.githubUrl;

function ThemeToggle({ withLabel }: { withLabel?: boolean }) {
  const theme = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';
  if (withLabel) {
    return (
      <button type="button" onClick={toggleTheme} className="flex h-11 items-center gap-3 rounded-card border border-line bg-surface px-3 text-sm text-ink-2">
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} /> Switch to {next} theme
      </button>
    );
  }
  return (
    <Tooltip content={`Switch to ${next} theme`} side="bottom">
      <button type="button" onClick={toggleTheme} aria-label={`Switch to ${next} theme`}
        className="group grid size-9 place-items-center rounded-chip text-ink-2 transition-colors duration-150 hover:bg-sunk hover:text-ink">
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} className="transition-transform duration-300 [transition-timing-function:var(--ease-out)] group-hover:rotate-[18deg] group-active:scale-90" />
      </button>
    </Tooltip>
  );
}

function Kbd({ children }: { children: string }) {
  return <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-chip border border-line bg-canvas px-1 font-mono text-[10px] leading-none text-ink-3">{children}</kbd>;
}

function SearchTrigger() {
  return (
    <>
      <button type="button" onClick={() => openCommandPalette()} aria-label="Search the site" aria-keyshortcuts="Meta+K Control+K /"
        className="hidden h-8 w-[200px] items-center gap-2 rounded-chip border border-line bg-surface pl-2.5 pr-1.5 text-left text-xs text-ink-3 transition-colors duration-150 hover:border-line-strong hover:text-ink-2 xl:flex">
        <Icon name="magnifying-glass" size={14} />
        <span className="flex-1">Search</span>
        <span className="flex gap-0.5"><Kbd>{MOD_KEY}</Kbd><Kbd>K</Kbd></span>
      </button>
      <Tooltip content={<>Search <span className="font-mono opacity-70">{MOD_KEY} K</span></>} side="bottom">
        <button type="button" onClick={() => openCommandPalette()} aria-label="Search the site"
          className="grid size-9 place-items-center rounded-chip text-ink-2 transition-colors duration-150 hover:bg-sunk hover:text-ink xl:hidden">
          <Icon name="magnifying-glass" size={18} />
        </button>
      </Tooltip>
    </>
  );
}

/* ---------- More panel ---------- */
function MorePanel({ route, onClose }: { route: Route; onClose: (focusButton: boolean) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.querySelector<HTMLElement>('a')?.focus(); }, []);
  const onKey = (e: React.KeyboardEvent) => {
    const links = [...(ref.current?.querySelectorAll<HTMLElement>('a, button') ?? [])];
    const i = links.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); links[(i + 1) % links.length]?.focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); links[(i - 1 + links.length) % links.length]?.focus(); }
    if (e.key === 'Escape') { e.preventDefault(); onClose(true); }
  };
  return (
    <div className="absolute right-[-8px] top-full z-50 pt-2" onKeyDown={onKey}
      onBlur={(e) => { const scope = e.currentTarget.parentElement ?? e.currentTarget; if (e.relatedTarget && !scope.contains(e.relatedTarget as Node)) onClose(false); }}>
      <div ref={ref} id="more-panel" className="pop-in w-[360px] max-w-[calc(100vw-32px)] rounded-card border border-line bg-surface p-1.5 shadow-pop">
        <p className="label px-3 pb-1 pt-2">More pages</p>
        <ul>
          {MORE.map((r) => {
            const on = route === r.path;
            return (
              <li key={r.path}>
                <a href={href(r.path)} aria-current={on ? 'page' : undefined}
                  className={cx('group flex items-start gap-3 rounded-chip px-3 py-2.5 transition-colors duration-150 hover:bg-sunk focus-visible:bg-sunk', on && 'bg-sunk')}>
                  <span className={cx('mt-0.5 grid size-8 shrink-0 place-items-center rounded-chip border bg-surface transition-colors duration-150', on ? 'border-accent/40 text-accent' : 'border-line text-ink-3 group-hover:border-line-strong group-hover:text-ink')}>
                    <Icon name={r.icon} size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 text-sm font-medium text-ink">{r.label}{on && <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-ink-2">{r.desc}</span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
        <button type="button" onClick={() => { onClose(false); openCommandPalette(); }}
          className="mt-1 flex w-full items-center gap-3 rounded-chip border-t border-line px-3 py-2.5 text-left text-xs text-ink-2 transition-colors duration-150 hover:bg-sunk hover:text-ink">
          <Icon name="magnifying-glass" size={14} className="text-ink-3" />
          <span className="flex-1">Search pages, methods, cohorts and docs</span>
          <span className="flex gap-0.5"><Kbd>{MOD_KEY}</Kbd><Kbd>K</Kbd></span>
        </button>
      </div>
    </div>
  );
}

/* ---------- Sliding active indicator ---------- */
/** One 2px bar under the active item, moved with transform only (translateX + scaleX of a 1px element). */
function useIndicator(route: Route, moreActive: boolean) {
  const navRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ x: number; w: number; ready: boolean } | null>(null);
  const measure = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;
    const key = moreActive ? 'more' : route;
    const el = nav.querySelector<HTMLElement>(`[data-nav="${key}"]`);
    if (!el) { setBox(null); return; }
    const pad = 10;
    setBox((b) => ({ x: el.offsetLeft + pad, w: el.offsetWidth - pad * 2, ready: b !== null }));
  }, [route, moreActive]);
  useLayoutEffect(() => { measure(); }, [measure]);
  useEffect(() => {
    const ro = new ResizeObserver(measure);
    if (navRef.current) ro.observe(navRef.current);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
  }, [measure]);
  return { navRef, box };
}

/* ---------- Mobile sheet ---------- */
function MobileSheet({ route, onClose, openerRef }: { route: Route; onClose: () => void; openerRef: React.RefObject<HTMLButtonElement | null> }) {
  const sheetRef = useRef<HTMLDivElement>(null);
  // Move focus in, trap Tab, lock scroll, return focus to the opener on close.
  useEffect(() => {
    const opener = openerRef.current;
    const root = sheetRef.current;
    root?.querySelector<HTMLElement>('button, a')?.focus();
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !root) return;
      const f = [...root.querySelectorAll<HTMLElement>('a, button')];
      if (!f.length) return;
      const [first, last] = [f[0], f[f.length - 1]];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; opener?.focus(); };
  }, [onClose, openerRef]);

  const row = (r: (typeof ROUTES)[number]) => {
    const on = route === r.path;
    return (
      <li key={r.path}>
        <a href={href(r.path)} aria-current={on ? 'page' : undefined}
          className="flex min-h-14 items-center gap-3.5 border-b border-line py-3">
          <span className={cx('grid size-9 shrink-0 place-items-center rounded-chip border', on ? 'border-accent/40 text-accent' : 'border-line text-ink-3')}>
            <Icon name={r.icon} size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className={cx('block text-base', on ? 'font-medium text-ink' : 'text-ink')}>{r.label}</span>
            <span className="block text-xs leading-snug text-ink-2">{r.desc}</span>
          </span>
          {on && <span className="size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />}
        </a>
      </li>
    );
  };

  return (
    <div ref={sheetRef} className="fade-in fixed inset-0 z-50 flex flex-col overflow-y-auto bg-canvas md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <Container className="flex h-14 shrink-0 items-center justify-between border-b border-line">
        <Lockup size={22} link />
        <button type="button" onClick={onClose} className="grid size-11 place-items-center rounded-chip text-ink" aria-label="Close menu"><Icon name="x" size={20} /></button>
      </Container>
      <Container className="flex flex-col pb-10 pt-4">
        <button type="button" onClick={() => { onClose(); openCommandPalette(); }}
          className="mb-5 flex h-11 items-center gap-2.5 rounded-card border border-line bg-surface px-3 text-left text-sm text-ink-3">
          <Icon name="magnifying-glass" size={16} /> Search pages, methods, cohorts
        </button>
        <p className="label mb-1">Results</p>
        <ul className="mb-6">{PRIMARY.map(row)}</ul>
        <p className="label mb-1">More</p>
        <ul>{MORE.map(row)}</ul>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <ThemeToggle withLabel />
          <Button href={GITHUB_URL} external variant="secondary" icon="github-logo" className="h-11">GitHub repository</Button>
        </div>
      </Container>
    </div>
  );
}

/* ---------- Header ---------- */
export function Header({ route }: { route: Route }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Close menus when the route changes (state-from-props pattern, no effect).
  const [seenRoute, setSeenRoute] = useState(route);
  if (seenRoute !== route) { setSeenRoute(route); setMoreOpen(false); setSheet(false); }

  const moreActive = MORE.some((r) => r.path === route);
  const moreBtn = useRef<HTMLButtonElement>(null);
  const openBtn = useRef<HTMLButtonElement>(null);
  const { navRef, box } = useIndicator(route, moreActive);
  const closeSheet = useCallback(() => setSheet(false), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e: PointerEvent) => { if (!navRef.current?.contains(e.target as Node)) setMoreOpen(false); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [moreOpen, navRef]);

  const linkCls = (on: boolean) => cx('relative flex h-14 items-center px-2.5 text-sm transition-colors duration-150',
    on ? 'text-ink' : 'text-ink-2 hover:text-ink');

  return (
    <header className="sticky top-0 z-40">
      {/* Scroll state: the hairline and blur fade in after 8px (opacity only). */}
      <div aria-hidden="true" className={cx('absolute inset-0 -z-10 border-b border-line bg-canvas/80 backdrop-blur-md transition-opacity duration-300', scrolled ? 'opacity-100' : 'opacity-0')} />
      <Container className="flex h-14 items-center gap-4 lg:gap-7">
        <span className="flex lg:hidden"><Lockup size={22} link descriptor={false} /></span>
        <span className="hidden lg:flex"><Lockup size={22} link /></span>
        <nav aria-label="Main" className="relative hidden h-14 flex-1 items-center md:flex" ref={navRef}>
          {PRIMARY.map((r) => (
            <a key={r.path} data-nav={r.path} href={href(r.path)} aria-current={route === r.path ? 'page' : undefined} className={linkCls(route === r.path)}>
              <span className="rounded-chip px-0 py-1">{r.label}</span>
            </a>
          ))}
          <div className="relative" data-nav="more">
            <button ref={moreBtn} type="button" onClick={() => setMoreOpen((o) => !o)} aria-expanded={moreOpen} aria-controls="more-panel"
              className={cx(linkCls(moreActive), 'gap-1')}>
              More <Icon name="caret-down" size={12} className={cx('transition-transform duration-150', moreOpen && 'rotate-180')} />
            </button>
            {moreOpen && <MorePanel route={route} onClose={(focus) => { setMoreOpen(false); if (focus) moreBtn.current?.focus(); }} />}
          </div>
          {box && (
            <span aria-hidden="true" className={cx('absolute bottom-0 left-0 h-[2px] w-px origin-left rounded-full bg-ink', box.ready && 'transition-transform duration-300 [transition-timing-function:var(--ease-out)]')}
              style={{ transform: `translateX(${box.x}px) scaleX(${box.w})` }} />
          )}
        </nav>
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <SearchTrigger />
          <ThemeToggle />
          <span className="ml-1 hidden lg:flex"><Button href={GITHUB_URL} external variant="secondary" size="sm" icon="github-logo">GitHub</Button></span>
          <Tooltip content="GitHub repository" side="bottom">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" aria-label="GitHub repository"
              className="hidden size-9 place-items-center rounded-chip text-ink-2 transition-colors duration-150 hover:bg-sunk hover:text-ink md:grid lg:hidden">
              <Icon name="github-logo" size={18} />
            </a>
          </Tooltip>
          <button ref={openBtn} type="button" onClick={() => setSheet(true)} className="grid size-11 place-items-center rounded-chip text-ink md:hidden" aria-label="Open menu" aria-expanded={sheet}>
            <Icon name="list" size={20} />
          </button>
        </div>
      </Container>
      {sheet && <MobileSheet route={route} onClose={closeSheet} openerRef={openBtn} />}
    </header>
  );
}
