import { useCallback, useEffect, useRef, useState } from 'react';
import { useMedia } from './useMedia';

/** At 1024 px and up the phone section bars are gone, so the spy band can start higher. */
const WIDE = '(min-width: 1024px)';
/** After a jump, ignore the spy while the smooth scroll passes other sections. */
const CLICK_LOCK_MS = 900;
/** With `scrollLockCapMs`: the lock lasts until scroll events stop for this long. */
const SCROLL_IDLE_MS = 150;

export interface ScrollSpyOptions {
  /** Px from the viewport top where the spy band starts (under the sticky chrome); a function gets `wide` (>= 1024 px). Default 120. */
  top?: number | ((wide: boolean) => number);
  /** Bottom of the band as % of the viewport height cut from the bottom (default 55: the band ends 45% down). */
  bottomPct?: number;
  /** Which section wins when several cross the band: 'first' (default) or 'last' in document order. */
  pick?: 'first' | 'last';
  /** Milliseconds `jumpTo` holds the spy off (default 900). */
  lockMs?: number;
  /**
   * A long smooth jump outlasts `lockMs`: hold the lock while scroll events keep coming (150 ms idle), up to this
   * many milliseconds after the jump (default 0: off). Reproduce uses 3000.
   */
  scrollLockCapMs?: number;
}

/**
 * IntersectionObserver scroll-spy over element ids: `const { active, jumpTo } = useScrollSpy(['board', 'tests']);`
 * `jumpTo(id)` sets the target at once and holds the spy off while the smooth scroll passes other sections
 * (`scrollLockCapMs` keeps holding while scroll events continue). Above
 * the first section the first id is active; in a gap between sections the last match is kept. The observer is
 * rebuilt when the layout crosses 1024 px (the band moves).
 */
export function useScrollSpy(ids: readonly string[], opts: ScrollSpyOptions = {}) {
  const { top = 120, bottomPct = 55, pick = 'first', lockMs = CLICK_LOCK_MS, scrollLockCapMs = 0 } = opts;
  const [active, setActive] = useState<string | null>(ids[0] ?? null);
  const lockUntil = useRef(0);
  const stopFollow = useRef<() => void>(() => {});
  useEffect(() => () => stopFollow.current(), []);
  const wide = useMedia(WIDE);
  const key = ids.join('|');
  const bandTop = typeof top === 'function' ? top(wide) : top;

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || !key) return;
    const order = key.split('|');
    const visible = new Set<string>();
    const choose = () => {
      const list = pick === 'last' ? [...order].reverse() : order;
      const hit = list.find((id) => visible.has(id));
      if (hit) { setActive(hit); return; }
      const first = document.getElementById(order[0]);
      if (first && first.getBoundingClientRect().top > bandTop) setActive(order[0]);
    };
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target.id); else visible.delete(e.target.id);
      }
      if (Date.now() < lockUntil.current) return;
      choose();
    }, { rootMargin: `-${bandTop}px 0px -${bottomPct}% 0px`, threshold: 0 });
    order.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [key, bandTop, bottomPct, pick]);

  const jumpTo = useCallback((id: string) => {
    stopFollow.current();
    lockUntil.current = Date.now() + lockMs;
    if (scrollLockCapMs > 0) {
      const onScroll = () => { lockUntil.current = Math.max(lockUntil.current, Date.now() + SCROLL_IDLE_MS); };
      const timer = window.setTimeout(() => stopFollow.current(), scrollLockCapMs);
      window.addEventListener('scroll', onScroll, { passive: true });
      stopFollow.current = () => { window.removeEventListener('scroll', onScroll); window.clearTimeout(timer); stopFollow.current = () => {}; };
    }
    setActive(id);
  }, [lockMs, scrollLockCapMs]);

  return { active, jumpTo };
}
