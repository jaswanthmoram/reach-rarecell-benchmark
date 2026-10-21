import { useEffect, useRef, useState } from 'react';
import { navCameFromLink, type Route } from '../lib/router';

/** How long to wait for the new page's h1 (chunk download, Suspense, the line split showing it). */
const HEADING_WAIT_MS = 3000;

const mainHeading = () => document.querySelector<HTMLElement>('#main h1');
const focusable = (el: HTMLElement) => !el.closest('[data-split="pending"]') && getComputedStyle(el).visibility !== 'hidden';

/** Focus an element that is not in the tab order (headings, main) without scrolling. True if focus landed. */
function focusQuietly(el: HTMLElement): boolean {
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
  return document.activeElement === el;
}

/**
 * Skip link target: the page's h1, or <main> while the page is still loading. Scrolls it into view like a jump.
 * Returns false if nothing could take focus.
 */
export function focusMain(): boolean {
  const target = mainHeading() ?? document.getElementById('main');
  if (!target || !focusQuietly(target)) return false;
  target.scrollIntoView({ block: 'start' });
  return true;
}

/**
 * After each route change (never the first load): a link activation moves focus to the new page's h1 (tabIndex -1,
 * preventScroll; the router has already scrolled); Back/Forward or a typed address announces the page title in the
 * shell's polite live region instead. Focus is never taken back if the visitor moved it while the page loaded.
 * Returns the live-region text.
 */
export function useRouteFocus(route: Route, title: string): string {
  const [message, setMessage] = useState('');
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    let frame = 0;
    let timer = 0;
    const announce = () => {
      setMessage('');
      timer = window.setTimeout(() => setMessage(title), 60); // a repeat of the same text must still be read
    };
    if (!navCameFromLink()) { announce(); return () => window.clearTimeout(timer); }
    const startedOn = document.activeElement;
    const deadline = performance.now() + HEADING_WAIT_MS;
    const tryFocus = () => {
      const moved = document.activeElement !== startedOn && document.activeElement !== document.body;
      if (moved) return; // the visitor is already somewhere else
      const h = mainHeading();
      if (h && focusable(h) && focusQuietly(h)) return;
      if (performance.now() > deadline) { announce(); return; }
      frame = requestAnimationFrame(tryFocus);
    };
    tryFocus();
    return () => { cancelAnimationFrame(frame); window.clearTimeout(timer); };
  }, [route, title]);
  return message;
}
