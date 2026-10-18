import { lazy, Suspense, useEffect, useState } from 'react';
import { ROUTES, NOT_FOUND, useRoute, type Route } from './router';
import { PageSkeleton, ToastProvider } from '../ui';
import { GLOBAL_STATS } from '../data/benchmarkData';
import { Header } from './Header';
import { Footer } from './Footer';
import { CommandPalette } from './CommandPalette';
import { RouteBoundary } from './RouteBoundary';
import { PALETTE_EVENT } from './theme';

const PAGES: Record<Route, React.LazyExoticComponent<() => React.JSX.Element>> = {
  '/': lazy(() => import('../pages/Home')),
  '/leaderboard': lazy(() => import('../pages/Leaderboard')),
  '/tracks': lazy(() => import('../pages/Tracks')),
  '/datasets': lazy(() => import('../pages/Datasets')),
  '/methods': lazy(() => import('../pages/Methods')),
  '/figures': lazy(() => import('../pages/Figures')),
  '/docs': lazy(() => import('../pages/Docs')),
  '/cite': lazy(() => import('../pages/Cite')),
  '/use-cases': lazy(() => import('../pages/UseCases')),
  '/system': lazy(() => import('../pages/System')),
  [NOT_FOUND]: lazy(() => import('./NotFound')),
};

export const GITHUB_URL = GLOBAL_STATS.githubUrl;

const isTyping = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

/** ⌘K / Ctrl+K anywhere, "/" when not typing, or `openCommandPalette()` from any page. */
function usePalette() {
  const [state, setState] = useState<{ open: boolean; query: string }>({ open: false, query: '' });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setState((s) => ({ open: !s.open, query: '' })); }
      else if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !isTyping(e.target)) { e.preventDefault(); setState({ open: true, query: '' }); }
    };
    const onOpen = (e: Event) => setState({ open: true, query: typeof (e as CustomEvent).detail === 'string' ? (e as CustomEvent<string>).detail : '' });
    window.addEventListener('keydown', onKey);
    window.addEventListener(PALETTE_EVENT, onOpen);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener(PALETTE_EVENT, onOpen); };
  }, []);
  return { ...state, close: () => setState((s) => ({ ...s, open: false })) };
}

export function App() {
  const route = useRoute();
  const Page = PAGES[route];
  const palette = usePalette();
  useEffect(() => {
    const r = ROUTES.find((x) => x.path === route);
    document.title = route === '/' ? 'REACH Benchmark: Rare-cell Evaluation Across Cancer Heterogeneity'
      : r ? `${r.label} · REACH Benchmark` : 'Not found · REACH Benchmark';
    window.scrollTo({ top: 0 });
  }, [route]);

  return (
    <ToastProvider>
      {/* Not href="#main": a hash link would be read as a route. */}
      <button type="button" onClick={() => document.getElementById('main')?.focus()}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-chip focus:bg-ink focus:px-3 focus:py-2 focus:text-canvas">
        Skip to content
      </button>
      <Header route={route} />
      <main id="main" tabIndex={-1} className="outline-none">
        <RouteBoundary key={route}>
          <Suspense fallback={<PageSkeleton />}>
            <Page />
          </Suspense>
        </RouteBoundary>
      </main>
      <Footer />
      <CommandPalette key={palette.open ? `open-${palette.query}` : 'closed'} open={palette.open} initialQuery={palette.query} onClose={palette.close} />
    </ToastProvider>
  );
}
