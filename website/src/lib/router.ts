import { useLayoutEffect, useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';
import { reducedMotion as reduced } from '../ui/motion/paused';

// Clean URLs over the History API: /reach-rarecell-benchmark/leaderboard/?track=d#pairwise. GitHub Pages has no SPA
// rewrite, so the build copies index.html into one folder per route (scripts/prerender-routes.mjs) and to 404.html.
// The first six are the main navbar; the rest live under "More" (as on the canvas navbar).
export const ROUTES = [
  { path: '/', label: 'Overview' },
  { path: '/leaderboard', label: 'Leaderboard' },
  { path: '/tracks', label: 'Tracks' },
  { path: '/datasets', label: 'Datasets' },
  { path: '/methods', label: 'Methods' },
  { path: '/reproduce', label: 'Reproduce' },
  { path: '/figures', label: 'Figures' },
  { path: '/cite', label: 'Cite' },
  { path: '/use-cases', label: 'Use cases' },
] as const;

export type RoutePath = (typeof ROUTES)[number]['path'];
export const NOT_FOUND = '*' as const;
export type Route = RoutePath | typeof NOT_FOUND;

/** Navbar label of a route ('Not found' for the 404). */
export const routeLabel = (route: Route): string => ROUTES.find((x) => x.path === route)?.label ?? 'Not found';

/** Vite's base: '/' in dev, '/reach-rarecell-benchmark/' in the production build. Always ends with '/'. */
const BASE = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
const isRoutePath = (p: string): p is RoutePath => ROUTES.some((r) => r.path === p);

/** Route-relative path of a pathname: the base and a trailing index.html dropped, slashes collapsed ('' is '/'). */
export function routePathOf(pathname: string): string {
  let p = pathname === BASE.slice(0, -1) ? BASE : pathname;
  p = p.startsWith(BASE) ? p.slice(BASE.length) : p;
  p = p.replace(/(^|\/)index\.html$/, '');
  return `/${p.split('/').filter(Boolean).join('/')}`;
}
/** Route-relative path of the address bar (`/leaderboard`; NotFound shows it). */
export const currentPath = () => routePathOf(window.location.pathname);
const read = (): Route => {
  const p = currentPath();
  return isRoutePath(p) ? p : NOT_FOUND;
};

/** The URL path of a route: the base, then the route with a trailing slash (the folder GitHub Pages serves). */
const urlPath = (path: string) => (path === '/' ? BASE : `${BASE}${path.replace(/^\/+|\/+$/g, '')}/`);

/** Query string of the address bar without the '?' (`/tracks/?track=f` gives `track=f`). */
export const useQuery = () => new URLSearchParams(useSyncExternalStore(subscribe, () => window.location.search.replace(/^\?/, '')));

/**
 * `href('/tracks', 'track=f')` gives `/reach-rarecell-benchmark/tracks/?track=f`; a third argument adds a fragment
 * (`href('/reproduce', '', 'install')`). Internal links are intercepted below and change the page without a reload.
 */
export const href = (path: RoutePath, query?: string, fragment?: string) =>
  `${urlPath(path)}${query ? `?${query}` : ''}${fragment ? `#${fragment}` : ''}`;

/** The same link as an absolute URL, for "Copy link" buttons. */
export const absoluteHref = (path: RoutePath, query?: string, fragment?: string) => new URL(href(path, query, fragment), window.location.origin).href;

/** Change only the query part, without adding history (tabs, filters). The fragment is kept. */
export function setQuery(query: string) {
  const { pathname, hash } = window.location;
  history.replaceState(history.state, '', `${pathname}${query ? `?${query}` : ''}${hash}`); // keep the entry key (scroll memory)
  listeners.forEach((l) => l());
}

/** The fragment of the address bar without the '#' ('' when there is none). */
export function currentFragment(): string {
  const raw = window.location.hash.replace(/^#/, '');
  if (!raw || raw.startsWith('/')) return '';
  try { return decodeURIComponent(raw); } catch { return raw; }
}

/** Point the fragment at an in-page section (or clear it with ''), without adding history or scrolling. */
export function setFragment(id: string) {
  const { pathname, search } = window.location;
  const next = `${pathname}${search}${id ? `#${encodeURIComponent(id)}` : ''}`;
  if (next !== `${pathname}${search}${window.location.hash}`) history.replaceState(history.state, '', next);
}

/* ---------- Old addresses ----------
 * Hash routes (`/#/tracks?track=d`) and `?section=<id>` (Reproduce) still open the right view: both are rewritten to
 * the clean URL in place (no new history entry). A known route also gets its canonical trailing slash. */
function canonicalUrl(): string {
  const { pathname, search, hash } = window.location;
  let path = pathname;
  let query = search.replace(/^\?/, '');
  let fragment = hash.replace(/^#/, '');
  if (fragment.startsWith('/')) {
    const [legacyPath, legacyQuery = ''] = fragment.split('?');
    path = urlPath(legacyPath || '/');
    query = legacyQuery;
    fragment = '';
  }
  const params = new URLSearchParams(query);
  const section = params.get('section');
  if (section !== null) {
    params.delete('section');
    query = params.toString();
    if (!fragment && section) fragment = encodeURIComponent(section);
  }
  const route = routePathOf(path);
  if (isRoutePath(route)) path = urlPath(route);
  return `${path}${query ? `?${query}` : ''}${fragment ? `#${fragment}` : ''}`;
}
function normaliseUrl() {
  const next = canonicalUrl();
  const { pathname, search, hash } = window.location;
  if (next !== `${pathname}${search}${hash}`) history.replaceState(history.state, '', next);
}
normaliseUrl();

/* ---------- Route chunk preloading ---------- */
type Loader = (path: Route) => Promise<unknown>;
let loader: Loader | null = null;
/** The shell registers its lazy page imports here (src/shell/App.tsx). */
export const registerRouteLoader = (fn: Loader) => { loader = fn; };
/** Start fetching a page chunk (nav hover/focus, idle). Safe to call many times. */
export const preloadRoute = (path: Route): Promise<unknown> => (loader ? loader(path).catch(() => undefined) : Promise.resolve());

/* ---------- Scrolling (native; a custom scroller can still plug in here) ---------- */
export type Scroller = { toElement: (el: HTMLElement) => void; toTop: () => void };
let scroller: Scroller | null = null;
/** Kept for compatibility (nothing sets it since r10 removed Lenis). `null` is native scrolling. */
export const setScroller = (s: Scroller | null) => { scroller = s; };

/** Scroll to an in-page section: smooth unless reduced motion. The sticky header and SectionNav offset comes from
 * `scroll-margin-top` on `[id]` (app.css). */
export function scrollToId(id: string, instant = false) {
  const el = document.getElementById(id);
  if (!el) return;
  if (scroller && !instant) scroller.toElement(el);
  else el.scrollIntoView({ behavior: instant || reduced() ? 'instant' : 'smooth', block: 'start' });
}

/** Jump to the top instantly (route changes). */
export const scrollToTop = () => (scroller ? scroller.toTop() : window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));

/* ---------- Scroll memory ----------
 * A new page opens at the top; Back/Forward return to where the reader was on that entry. The browser's own
 * restoration is off because it lands after the swap (the page jumped once the new route had painted at the top). */
type EntryState = { reachKey?: string } | null;
const scrollMemory = new Map<string, number>();
let entrySeq = 0;
/** Key of the current history entry, created (in history.state) the first time an entry is seen. */
function entryKey(): string {
  const state = history.state as EntryState;
  if (state?.reachKey) return state.reachKey;
  const key = `${Date.now().toString(36)}-${++entrySeq}`;
  history.replaceState({ ...(state ?? {}), reachKey: key }, '');
  return key;
}
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
/** Entry whose page is on screen; scroll positions are saved under it until the swap. */
let shownKey = entryKey();
let saveFrame = 0;
window.addEventListener('scroll', () => {
  if (saveFrame) return;
  saveFrame = requestAnimationFrame(() => { saveFrame = 0; scrollMemory.set(shownKey, window.scrollY); });
}, { passive: true });

/** Scroll for the entry now in the address bar: its remembered position (Back/Forward) or the top (new entry). */
function scrollForEntry(key: string) {
  const y = scrollMemory.get(key) ?? 0;
  if (y <= 0) { scrollToTop(); return; }
  const go = () => window.scrollTo({ top: y, left: 0, behavior: 'instant' });
  go();
  requestAnimationFrame(() => { if (Math.abs(window.scrollY - y) > 2) go(); }); // late layout (images, fonts)
}

/* ---------- One navigation handler (link clicks and popstate) ----------
 * A page change waits (capped) for the next page chunk, then swaps inside ONE View Transition, so the
 * transition goes old page -> new page instead of old page -> skeleton. Query-only changes update instantly. */
const listeners = new Set<() => void>();
let current: Route = read();
let navToken = 0;
type VT = { ready: Promise<void>; finished: Promise<void>; updateCallbackDone: Promise<void>; skipTransition?: () => void };
/** If the browser cannot paint (background tab, frozen frame), never leave the old page up. */
const VT_FALLBACK_MS = 400;
/** Cap on the animation once it starts: past this the new page is shown as is (the CSS animations run ~400ms). */
const VT_MAX_MS = 800;
/** Longest we hold the old page while the next chunk downloads. */
const PRELOAD_CAP_MS = 350;
/** On <html> while a route transition runs; app.css names the header only then. */
const VT_NAV_CLASS = 'vt-nav';
/** The transition on screen, so a newer navigation can end it before starting its own. */
let activeVT: VT | null = null;

const notify = () => listeners.forEach((l) => l());
const wait = (ms: number) => new Promise<void>((r) => { window.setTimeout(r, ms); });
const quiet = () => {}; // a skipped transition rejects its promises; that rejection is expected

/** Swap pages inside one View Transition that always ends: fallback if the update never runs, cap on the total. */
function transition(swap: () => void) {
  const doc = document as Document & { startViewTransition?: (fn: () => void) => VT };
  activeVT?.skipTransition?.();
  activeVT = null;
  if (!doc.startViewTransition || document.visibilityState !== 'visible' || reduced()) { swap(); return; }
  let done = false;
  const run = () => { if (done) return; done = true; flushSync(swap); };
  // The header is named only while a route transition runs (app.css): a view-transition-name makes it a backdrop
  // root, and its glass would stop blurring the page behind it.
  const root = document.documentElement;
  root.classList.add(VT_NAV_CLASS);
  const t = doc.startViewTransition(run);
  activeVT = t;
  t.updateCallbackDone.catch(quiet);
  const fallback = window.setTimeout(() => { if (!done) { run(); t.skipTransition?.(); } }, VT_FALLBACK_MS);
  let cap = 0;
  t.ready.then(() => { cap = window.setTimeout(() => t.skipTransition?.(), VT_MAX_MS); }, quiet);
  const end = () => {
    window.clearTimeout(fallback); window.clearTimeout(cap);
    if (activeVT !== t) return; // a newer transition owns the class now
    activeVT = null;
    root.classList.remove(VT_NAV_CLASS);
  };
  t.finished.then(end, end);
}

/* Chrome makes the page inert while a view transition runs (every click hits <html>, whatever the CSS). A click in
 * that window ends the transition and is replayed on the control under the pointer, so a quick second nav click works. */
const REPLAY = 'a[href], button, summary, label, [role="button"], [role="tab"]';
document.addEventListener('click', (e) => {
  const t = activeVT;
  if (!t || e.target !== document.documentElement || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const { clientX: x, clientY: y } = e;
  t.skipTransition?.();
  const replay = () => (document.elementFromPoint(x, y)?.closest<HTMLElement>(REPLAY))?.click();
  t.finished.then(replay, replay);
}, true);

/* ---------- Where a navigation came from ----------
 * The shell moves focus to the new page's h1 after a link was activated, and announces the title otherwise
 * (Back/Forward, a typed address). Link clicks (and Enter, which clicks) go through `navigate` below. */
let swappedFromLink = false;
/** True when the page now on screen was reached by activating a link (not Back/Forward or a typed address). */
export const navCameFromLink = () => swappedFromLink;

/* ---------- Navigation in flight (route-progress bar) ----------
 * True from a route change until the new page is on screen and its chunk has loaded. */
let navPending = false;
const pendingListeners = new Set<() => void>();
const setPending = (v: boolean) => {
  if (navPending === v) return;
  navPending = v;
  pendingListeners.forEach((l) => l());
};
const subscribePending = (cb: () => void) => { pendingListeners.add(cb); return () => { pendingListeners.delete(cb); }; };
/** `const busy = useNavPending()`: a route change is in flight (shell progress bar). */
export const useNavPending = () => useSyncExternalStore(subscribePending, () => navPending, () => false);

/* ---------- In-page fragments ----------
 * `/reproduce/#install` lands on #install: on load, after a route change, and when only the fragment changes (an
 * in-page link, an edited address). Back/Forward to an entry with a remembered position restores that instead. A page
 * that must prepare its target first (Reproduce unfolds sections on phones) registers a handler for its route. */
type FragmentHandler = (id: string, arrival: boolean) => void;
let fragmentHandler: { route: Route; fn: FragmentHandler } | null = null;
/** `useFragmentHandler('/reproduce', (id, arrival) => …)`: this page lands fragments itself (unknown ids included). */
export function useFragmentHandler(route: Route, fn: FragmentHandler) {
  // A layout effect: registered in the same commit that renders the targets, before the landing below looks.
  useLayoutEffect(() => {
    const entry = { route, fn };
    fragmentHandler = entry;
    return () => { if (fragmentHandler === entry) fragmentHandler = null; };
  }, [route, fn]);
}
/** Longest an arrival waits for fonts and images (they reflow the page above the target) before it lands. */
const FRAGMENT_SETTLE_CAP_MS = 1500;
/** Longest it waits for the target (or the page's handler) to render. */
const FRAGMENT_FIND_CAP_MS = 4000;
/** Off by more than this after the first frames (late layout), an arrival lands again. */
const FRAGMENT_DRIFT_PX = 8;
let fragmentToken = 0;
const pageSettled = () => {
  const loaded = document.readyState === 'complete' ? Promise.resolve() : new Promise<void>((r) => window.addEventListener('load', () => r(), { once: true }));
  return Promise.race([Promise.all([document.fonts?.ready ?? Promise.resolve(), loaded]), wait(FRAGMENT_SETTLE_CAP_MS)]);
};
/** Default landing: scroll, then once more if late layout moved the target away from under the header. */
function landOn(id: string, arrival: boolean) {
  scrollToId(id, arrival);
  if (!arrival) return;
  const el = document.getElementById(id);
  if (!el) return;
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (el.isConnected && Math.abs(el.getBoundingClientRect().top - margin) > FRAGMENT_DRIFT_PX) scrollToId(id, true);
  }));
}
/** Land the address bar's fragment once its target (or the page's handler) is there. `arrival`: an instant jump. */
function landFragment(arrival: boolean) {
  const id = currentFragment();
  if (!id) return;
  const token = ++fragmentToken;
  const nav = navToken;
  const live = () => token === fragmentToken && nav === navToken && currentFragment() === id;
  const t0 = performance.now();
  const find = () => {
    if (!live()) return;
    const handler = fragmentHandler?.route === current ? fragmentHandler.fn : null;
    if (handler) { handler(id, arrival); return; }
    if (document.getElementById(id)) { landOn(id, arrival); return; }
    if (performance.now() - t0 < FRAGMENT_FIND_CAP_MS) requestAnimationFrame(find);
  };
  void (arrival ? pageSettled() : Promise.resolve()).then(() => requestAnimationFrame(find));
}

/** Fired on window after a navigation is on screen (ScrollTrigger refreshes on it). */
export const ROUTE_EVENT = 'reach:route';

type NavKind = 'push' | 'pop';
/** The address bar changed (a link pushed an entry, or Back/Forward/an edited fragment popped one): show it. */
function onLocationChange(kind: NavKind, fromLink: boolean) {
  normaliseUrl(); // an old `#/path` or `?section=` typed into the address bar
  // Any navigation cancels a swap still waiting for its chunk, including a return to the page on screen.
  const token = ++navToken;
  const next = read();
  const key = entryKey();
  // Back/Forward to an entry with a remembered position restores it; anything else lands the fragment, if any.
  const restore = kind === 'pop' && scrollMemory.has(key);
  if (next === current) {
    shownKey = key;
    if (!restore) scrollMemory.set(key, window.scrollY);
    setPending(false);
    notify();
    window.dispatchEvent(new Event(ROUTE_EVENT));
    if (!restore) landFragment(false);
    return;
  }
  setPending(true);
  const chunk = preloadRoute(next);
  void Promise.race([chunk, wait(PRELOAD_CAP_MS)]).then(() => {
    if (token !== navToken) return; // a newer navigation won
    transition(() => { current = next; shownKey = key; swappedFromLink = fromLink; scrollForEntry(key); notify(); });
    window.dispatchEvent(new Event(ROUTE_EVENT));
    if (!restore) landFragment(true);
    void chunk.then(() => { if (token === navToken) setPending(false); });
  });
}

/** Go to an internal URL without a reload: a new history entry, or `replace` the current one. */
export function navigate(to: string, { replace = false, fromLink = false }: { replace?: boolean; fromLink?: boolean } = {}) {
  const url = new URL(to, window.location.href);
  const { pathname, search, hash } = window.location;
  const target = `${url.pathname}${url.search}${url.hash}`;
  if (url.pathname === pathname && url.search === search && url.hash) {
    // An in-page link: point the fragment at it (no history spam) and scroll there.
    if (url.hash !== hash) history.replaceState(history.state, '', target);
    landFragment(false);
    return;
  }
  if (target === `${pathname}${search}${hash}`) return; // already here
  if (replace) history.replaceState(history.state, '', target);
  else history.pushState(null, '', target);
  onLocationChange('push', fromLink);
}

/** Internal links: same origin, under the base, not a file (PDF, image, video), not a new tab or a download. */
function internalTarget(e: MouseEvent): string | null {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
  const a = e.target instanceof Element ? e.target.closest('a[href]') : null;
  if (!(a instanceof HTMLAnchorElement)) return null;
  if ((a.target && a.target !== '_self') || a.hasAttribute('download') || /\bexternal\b/.test(a.rel)) return null;
  const url = new URL(a.href);
  if (url.origin !== window.location.origin) return null;
  if (!url.pathname.startsWith(BASE) && url.pathname !== BASE.slice(0, -1)) return null;
  if (/\.[a-z0-9]+$/i.test(url.pathname) && !url.pathname.endsWith('/index.html')) return null; // a file under the base
  return `${url.pathname}${url.search}${url.hash}`;
}
document.addEventListener('click', (e) => {
  const to = internalTarget(e);
  if (to === null) return;
  e.preventDefault();
  navigate(to, { fromLink: true });
});
window.addEventListener('popstate', () => onLocationChange('pop', false));

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

export const useRoute = () => useSyncExternalStore(subscribe, () => current);

// First load: land the fragment (`/reproduce/#install`) once the page has rendered.
landFragment(true);
