import { useEffect, useState } from 'react';
import { PAGE_SECTIONS } from './shared';

export type SectionId = (typeof PAGE_SECTIONS)[number]['id'];

/** Gap between the bottom of the sticky chrome and the reading line. */
const LINE_GAP_PX = 24;

/**
 * Where the sticky chrome ends once it is stuck: the site header, plus the jump bar when it is shown. Read from the
 * sticky `top` and height, not the current position, because the jump bar sits lower until the hero scrolls away.
 */
function chromeBottom(): number {
  const bars = [document.querySelector('header.sticky'), document.querySelector('[data-jumpbar]')];
  return bars.reduce((max, el) => {
    if (!(el instanceof HTMLElement) || el.offsetParent === null) return max;
    const top = parseFloat(getComputedStyle(el).top) || 0;
    return Math.max(max, top + el.offsetHeight);
  }, 0);
}

/**
 * The section under a one-pixel reading line just below the sticky header and jump bar. Each section crosses the
 * line on the way in and on the way out, so scrolling in either direction reports the section actually under the
 * chrome. At the bottom of the page the last section wins even if its top never reaches the line.
 */
export function useActiveSection(): SectionId {
  const [active, setActive] = useState<SectionId>(PAGE_SECTIONS[0].id);
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const els = PAGE_SECTIONS.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => Boolean(e));
    if (els.length === 0) return;
    const last = PAGE_SECTIONS[PAGE_SECTIONS.length - 1].id;
    const atBottom = () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    let io: IntersectionObserver | null = null;

    const observe = () => {
      io?.disconnect();
      const top = Math.round(chromeBottom() + LINE_GAP_PX);
      const bottom = Math.max(0, window.innerHeight - top - 1);
      io = new IntersectionObserver((entries) => {
        if (atBottom()) { setActive(last); return; }
        const hit = entries.find((e) => e.isIntersecting);
        if (hit) setActive(hit.target.id as SectionId);
      }, { rootMargin: `-${top}px 0px -${bottom}px 0px`, threshold: 0 });
      els.forEach((e) => io?.observe(e));
    };
    const onScroll = () => { if (atBottom()) setActive(last); };

    observe();
    window.addEventListener('resize', observe);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      io?.disconnect();
      window.removeEventListener('resize', observe);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);
  return active;
}
