import { Component, Suspense, createElement, lazy, useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { NOT_FOUND, ROUTES, preloadRoute, registerRouteLoader, routeLabel as labelOf, useRoute, type Route, type RoutePath } from '../lib/router';
import { Footer } from './Footer';
import { Header } from './Header';
import { useRouteFocus } from './routeFocus';
import { NotFound, PageError, PageLoading, RouteProgress } from './states';

type PageModule = { default: ComponentType };
const IMPORTS: Record<RoutePath, () => Promise<PageModule>> = {
  '/': () => import('../pages/Home'),
  '/leaderboard': () => import('../pages/Leaderboard'),
  '/tracks': () => import('../pages/Tracks'),
  '/datasets': () => import('../pages/Datasets'),
  '/methods': () => import('../pages/Methods'),
  '/reproduce': () => import('../pages/Reproduce'),
  '/figures': () => import('../pages/Figures'),
  '/cite': () => import('../pages/Cite'),
  '/use-cases': () => import('../pages/UseCases'),
};
/** One promise per chunk: hover-preload, the router's pre-transition wait and React.lazy all share it. */
const loaded = new Map<RoutePath, Promise<PageModule>>();
/* Chrome caches a failed dynamic import for the page's lifetime, so a retry asks for the same module under a fresh
 * query string. Chrome and Firefox name the module in the error; elsewhere the retry uses the plain import again.
 * Only a .js module is ever retried that way. When Vite's preload of the page's CSS fails ("Unable to preload CSS for
 * …css"), the plain import runs again, but Vite never requests a stylesheet twice, so the shell fetches it afresh. */
const retryUrls = new Map<RoutePath, string>();
/** Failed attempts per page. After a retry also fails, "Try again" reloads the document (a failed static dependency
 * of the page chunk stays cached by the browser, so no fresh import can recover it). */
const failures = new Map<RoutePath, number>();
const MAX_SOFT_RETRIES = 1;
const RETRY_QUERY = /[?&]retry=\d+$/;
const JS_MODULE = /\.m?js$/;
const CSS_FILE = /\.css$/;
const urlIn = (err: unknown) => /\bhttps?:\/\/[^\s'"]+/.exec(err instanceof Error ? err.message : String(err))?.[0] ?? null;
const withRetryQuery = (url: string) => `${url}${url.includes('?') ? '&' : '?'}retry=${Date.now()}`;
const freshImport = (url: string) => import(/* @vite-ignore */ withRetryQuery(url)) as Promise<PageModule>;
/** Swap the failed <link> for a fresh request of the same stylesheet; a second failure counts against the page. */
const refetchStylesheet = (path: RoutePath, url: string) => {
  const file = url.split('/').pop();
  if (!file) return;
  document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]').forEach((l) => { if (l.href.includes(file)) l.remove(); });
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = withRetryQuery(url);
  link.addEventListener('error', () => { failures.set(path, (failures.get(path) ?? 0) + 1); }, { once: true });
  document.head.appendChild(link);
};
const recordFailure = (path: RoutePath, err: unknown) => {
  failures.set(path, (failures.get(path) ?? 0) + 1);
  const url = urlIn(err)?.replace(RETRY_QUERY, '');
  const bare = url?.split('?')[0] ?? '';
  if (url && JS_MODULE.test(bare)) { retryUrls.set(path, url); return; }
  retryUrls.delete(path);
  if (url && CSS_FILE.test(bare)) refetchStylesheet(path, url);
};
/** "Try again" after a soft retry has already failed: only a reload can recover. */
const needsReload = (route: Route) => route !== NOT_FOUND && (failures.get(route) ?? 0) > MAX_SOFT_RETRIES;
const load = (path: RoutePath) => {
  let p = loaded.get(path);
  if (!p) {
    const retry = retryUrls.get(path);
    p = retry ? freshImport(retry) : IMPORTS[path]();
    p.then(() => { retryUrls.delete(path); failures.delete(path); }, (err: unknown) => { // the boundary shows the error
      loaded.delete(path);
      recordFailure(path, err);
    });
    loaded.set(path, p);
  }
  return p;
};
registerRouteLoader((path) => (path === NOT_FOUND ? Promise.resolve() : load(path)));

/* React.lazy caches a rejected import for good, so a failed page gets a fresh lazy component: navigating away and
 * back, or "Try again", fetches the chunk again without a full reload. */
const pages = new Map<RoutePath, ComponentType>();
/** Called during render: idempotent (one cached lazy per route until its import fails). */
function pageFor(route: Route): ComponentType {
  if (route === NOT_FOUND) return NotFound;
  let Page = pages.get(route);
  if (!Page) {
    Page = lazy(() => load(route).catch((err: unknown) => { pages.delete(route); throw err; }));
    pages.set(route, Page);
  }
  return Page;
}

/** Warm the main nav chunks when the browser is idle (skipped on Save-Data). */
function useIdlePreload() {
  useEffect(() => {
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    if (nav.connection?.saveData) return;
    const run = () => ROUTES.slice(0, 6).forEach((r) => { void preloadRoute(r.path); });
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    if (w.requestIdleCallback) { const id = w.requestIdleCallback(run, { timeout: 4000 }); return () => w.cancelIdleCallback?.(id); }
    const t = window.setTimeout(run, 2500);
    return () => window.clearTimeout(t);
  }, []);
}

/** Error boundary around the page: the chunk failed. "Try again" refetches it (a fresh lazy import). */
class PageBoundary extends Component<{ children: ReactNode; route: Route; onRetry: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <PageError route={this.props.route} onRetry={this.props.onRetry} />;
  }
}

const HOME_TITLE = 'REACH Benchmark: Rare-cell Evaluation Across Cancer Heterogeneity';

export function App() {
  const route = useRoute();
  const [attempt, setAttempt] = useState(0);
  useIdlePreload();
  useEffect(() => {
    document.title = route === '/' ? HOME_TITLE : `${labelOf(route)} · REACH Benchmark`;
  }, [route]); // the router scrolls to the top inside the transition, before the new page paints
  const announcement = useRouteFocus(route, `${labelOf(route)} page`);
  return (
    <>
      <RouteProgress />
      <Header route={route} />
      <main id="main" className="vt-main min-h-[60vh] outline-none">
        <PageBoundary key={`${route}#${attempt}`} route={route} onRetry={() => (needsReload(route) ? location.reload() : setAttempt((n) => n + 1))}>
          <div className="route-in">
            <Suspense fallback={<PageLoading route={route} />}>{createElement(pageFor(route))}</Suspense>
          </div>
        </PageBoundary>
      </main>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{announcement}</div>
      <Footer />
    </>
  );
}
