import { useSyncExternalStore } from 'react';

// ponytail: hash routing: GitHub Pages has no SPA rewrite, so #/path avoids 404s on reload.
// Order matters: the first six are the primary nav, the rest live in "More".
export const ROUTES = [
  { path: '/', label: 'Overview', icon: 'house', desc: 'The question, the headline result and how the benchmark is built' },
  { path: '/leaderboard', label: 'Leaderboard', icon: 'ranking', desc: 'Six ranked published detectors by median Track A AP, with references' },
  { path: '/tracks', label: 'Tracks', icon: 'stack', desc: 'Six evaluation tracks, A to F, and how to read each one' },
  { path: '/datasets', label: 'Datasets', icon: 'database', desc: 'Ten oncology cohorts and the four-arm label evidence' },
  { path: '/methods', label: 'Methods', icon: 'flask', desc: 'Ten methods, the inclusion audit and cost against accuracy' },
  { path: '/docs', label: 'Reproduce', icon: 'book-open-text', desc: 'Install, run one unit, reproduce the paper, add a method' },
  { path: '/figures', label: 'Figures', icon: 'images-square', desc: 'The six published figures, full size' },
  { path: '/cite', label: 'Cite', icon: 'quotes', desc: 'Citation formats, archives and licences' },
  { path: '/use-cases', label: 'Use cases', icon: 'users', desc: 'Five readers, the questions they bring and their route through the site' },
  { path: '/system', label: 'System', icon: 'squares-four', desc: 'Brand, tokens, components and the page rules behind this site' },
] as const;

export type RoutePath = (typeof ROUTES)[number]['path'];
/** Any hash that matches no route renders the not-found view. */
export const NOT_FOUND = '*' as const;
export type Route = RoutePath | typeof NOT_FOUND;

const pathOf = () => window.location.hash.replace(/^#/, '').split('?')[0] || '/';

const read = (): Route => {
  const p = pathOf();
  return ROUTES.some((r) => r.path === p) ? (p as RoutePath) : NOT_FOUND;
};

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
};

export const useRoute = () => useSyncExternalStore(subscribe, read);

/** The raw path the reader asked for (used by the not-found view). */
export const requestedPath = pathOf;

/** `href('/tracks', 'track=f')` → `#/tracks?track=f`. */
export const href = (path: RoutePath, query?: string) => `#${path}${query ? `?${query}` : ''}`;

/**
 * Go to a route and, optionally, scroll to an element id on that page once it has rendered.
 * Use this instead of `href="#id"`: the hash belongs to the router.
 */
export function navigate(path: RoutePath, opts: { query?: string; anchor?: string } = {}) {
  const target = href(path, opts.query);
  if (window.location.hash !== target) window.location.hash = target;
  const { anchor } = opts;
  if (!anchor) return;
  const started = performance.now();
  const tick = () => {
    const el = document.getElementById(anchor);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    if (performance.now() - started < 3000) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
