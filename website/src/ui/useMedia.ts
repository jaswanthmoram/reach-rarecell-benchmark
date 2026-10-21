import { useCallback, useSyncExternalStore } from 'react';

/**
 * Live `matchMedia(query).matches`: `const wide = useMedia('(min-width: 1024px)')`. Re-renders only when the
 * answer changes; false on the server, before hydration and where `matchMedia` is missing.
 */
export function useMedia(query: string): boolean {
  const subscribe = useCallback((cb: () => void) => {
    if (typeof matchMedia === 'undefined') return () => undefined;
    const m = matchMedia(query);
    m.addEventListener('change', cb);
    return () => m.removeEventListener('change', cb);
  }, [query]);
  const read = useCallback(() => typeof matchMedia !== 'undefined' && matchMedia(query).matches, [query]);
  return useSyncExternalStore(subscribe, read, () => false);
}
