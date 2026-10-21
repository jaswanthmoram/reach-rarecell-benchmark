import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollTrigger } from '../../ui/motion';
import { SECTIONS } from './content';

/*
 * Phones (audit r8, Reproduce P2): the four Reference sections start folded so the page is not 15,000 px of
 * tables. Their bodies stay in the DOM as `hidden="until-found"`, so find-in-page still reaches them; a jump,
 * a deep link or a find match unfolds the section first.
 */
const PHONE = '(max-width: 639px)';
const FOLDABLE = SECTIONS.filter((s) => s.group === 'Reference').map((s) => s.id);
const isPhone = () => typeof window !== 'undefined' && window.matchMedia(PHONE).matches;

/** `unfold(id, then)`: `then(wasFolded)` runs once the unfolded body has rendered (at once if it was open). */
export type FoldApi = { folded: (id: string) => boolean; unfold: (id: string, then?: (wasFolded: boolean) => void) => void };
export const FoldCtx = createContext<FoldApi>({ folded: () => false, unfold: () => {} });

export function useFolds(): FoldApi {
  const [folded, setFolded] = useState<ReadonlySet<string>>(() => new Set(isPhone() ? FOLDABLE : []));
  useEffect(() => {
    const mq = window.matchMedia(PHONE);
    const onChange = () => { if (!mq.matches) { setFolded(new Set()); requestAnimationFrame(() => ScrollTrigger.refresh()); } };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  const current = useRef(folded);
  useEffect(() => { current.current = folded; }, [folded]);
  const unfold = useCallback((id: string, then?: (wasFolded: boolean) => void) => {
    if (!current.current.has(id)) { then?.(false); return; }
    const next = new Set(current.current);
    next.delete(id);
    current.current = next;
    setFolded(next);
    // The page grew, so the reveal triggers below must re-measure. A ScrollTrigger refresh scrolls to 0 and back
    // to measure, which cancels any smooth scroll in flight: callers jump instantly after an unfold.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!then) { ScrollTrigger.refresh(); return; }
      then(true);
      ScrollTrigger.refresh();
    }));
  }, []);
  return useMemo(() => ({ folded: (id: string) => folded.has(id), unfold }), [folded, unfold]);
}
