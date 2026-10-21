import { useEffect, useLayoutEffect, useRef } from 'react';

/** Box of an item in the container's content coordinates (scrolls with the content, like the pill). */
interface Box { x: number; y: number; w: number; h: number }

export interface SlidingPillOptions {
  /** Called after the pill moves to an item, with its box and the container (e.g. keep it visible in a scrolled strip). */
  onPlace?: (box: Box, container: HTMLElement, fits: boolean, clientWidth: number) => void;
}

/** Offsets of `el` up to `container`, through any positioned ancestors in between (no layout forced in a RO callback). */
function boxOf(el: HTMLElement, container: HTMLElement): Box | null {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== container) {
    x += node.offsetLeft;
    y += node.offsetTop;
    const parent = node.offsetParent as HTMLElement | null;
    if (!parent) return null;
    if (parent !== container && !container.contains(parent)) {
      // offsetParent skipped past the container (it is not positioned): measure relative to it instead.
      return { x: x - container.offsetLeft, y: y - container.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
    }
    node = parent;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

/**
 * One shared pill that slides between items (navbar, SectionNav). It moves with `transform` only (FLIP: the new
 * width is set once, the slide is a translate + scaleX that settles to scale 1). Item boxes are measured only in a
 * ResizeObserver callback, after layout, so mounting and every active change force no synchronous layout.
 * Mark items with `data-pill-key="<key>"`; render `<span ref={pillRef} className="slide-pill" aria-hidden />` inside
 * the (position: relative) container.
 */
export function useSlidingPill<C extends HTMLElement>(activeKey: string | null, opts: SlidingPillOptions = {}) {
  const containerRef = useRef<C>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const boxes = useRef(new Map<string, Box>());
  const fits = useRef(true);
  const width = useRef(0);
  const key = useRef(activeKey);
  const shown = useRef<Box | null>(null);
  const onPlace = useRef(opts.onPlace);
  const place = useRef<() => void>(() => undefined);
  const ro = useRef<ResizeObserver | null>(null);

  useLayoutEffect(() => { onPlace.current = opts.onPlace; });

  useEffect(() => {
    const c = containerRef.current;
    const pill = pillRef.current;
    if (!c || !pill) return;
    place.current = () => {
      const k = key.current;
      const box = k ? boxes.current.get(k) : undefined;
      if (!box || !box.w) { pill.style.opacity = '0'; return; }
      const prev = shown.current;
      const slide = !!prev && pill.dataset.ready === '1' && (prev.x !== box.x || prev.y !== box.y || prev.w !== box.w);
      shown.current = box;
      pill.style.width = `${box.w}px`;
      pill.style.height = `${box.h}px`;
      if (slide && prev) {
        // FLIP: start where the old item was (scaled to its width), then settle on the new one.
        pill.dataset.ready = '0';
        pill.style.transform = `translate(${prev.x}px, ${prev.y}px) scaleX(${prev.w / box.w})`;
        // Two frames: the start state must be painted once before the transition target is set.
        requestAnimationFrame(() => requestAnimationFrame(() => {
          if (shown.current !== box) return; // a newer placement won
          pill.dataset.ready = '1';
          pill.style.transform = `translate(${box.x}px, ${box.y}px)`;
        }));
      } else {
        pill.style.transform = `translate(${box.x}px, ${box.y}px)`;
        if (pill.dataset.ready !== '1') requestAnimationFrame(() => { pill.dataset.ready = '1'; }); // no slide on first placement
      }
      pill.style.opacity = '1';
      onPlace.current?.(box, c, fits.current, width.current);
    };
    const observer = new ResizeObserver(() => {
      // Runs after layout: these reads are free.
      const next = new Map<string, Box>();
      c.querySelectorAll<HTMLElement>('[data-pill-key]').forEach((el) => {
        const b = boxOf(el, c);
        if (b && el.dataset.pillKey) next.set(el.dataset.pillKey, b);
      });
      boxes.current = next;
      width.current = c.clientWidth;
      fits.current = c.scrollWidth <= width.current;
      shown.current = null; // a resize re-places without sliding
      place.current();
    });
    observer.observe(c);
    c.querySelectorAll('[data-pill-key]').forEach((el) => observer.observe(el));
    ro.current = observer;
    return () => { observer.disconnect(); ro.current = null; place.current = () => undefined; };
  }, []);

  // Active item changed: use the cached boxes (writes only). New items are observed (their first callback measures).
  useEffect(() => {
    key.current = activeKey;
    const c = containerRef.current;
    c?.querySelectorAll('[data-pill-key]').forEach((el) => ro.current?.observe(el));
    place.current();
  }, [activeKey]);

  return { containerRef, pillRef };
}
