import { useEffect, useState } from 'react';

/**
 * Top of the spy band, just past where a jumped-to block lands
 * (sticky header 56px + scroll-margin; below 1024px the jump menu adds ~64px).
 */
const BAND_TOP_WIDE = 96;
const BAND_TOP_NARROW = 160;
const WIDE_QUERY = '(min-width: 1024px)';

function useIsWide(): boolean {
  const [wide, setWide] = useState(() => window.matchMedia(WIDE_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(WIDE_QUERY);
    const onChange = () => setWide(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return wide;
}

/**
 * Scroll-spy. Observes the blocks with the given ids and returns the first one
 * (in document order) that crosses a band just under the sticky chrome.
 * Keeps the last match while the band sits in a gap between blocks.
 */
export function useActiveId(ids: readonly string[], fallback: string): string {
  const [active, setActive] = useState(fallback);
  const wide = useIsWide();
  const key = ids.join('|');

  useEffect(() => {
    const list = key.split('|');
    const elements = list.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0 || typeof IntersectionObserver === 'undefined') return;

    const bandTop = wide ? BAND_TOP_WIDE : BAND_TOP_NARROW;
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        });
        const first = list.find((id) => visible.has(id));
        if (first) setActive(first);
        // Above the first block (page header in view): the first entry is current.
        else if (elements[0].getBoundingClientRect().top > bandTop) setActive(list[0]);
      },
      // Band: from just below the sticky chrome to 30% down the viewport.
      { rootMargin: `-${bandTop}px 0px -70% 0px`, threshold: 0 },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [key, wide]);

  return active;
}
