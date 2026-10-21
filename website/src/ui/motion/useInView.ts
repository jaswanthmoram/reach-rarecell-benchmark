import { useEffect, useRef, useState, type RefObject } from 'react';
import { reducedMotion } from './paused';

export interface InViewOptions {
  /**
   * true (default): flips to true the first time the element enters, then stops watching (entrances).
   * false: follows the element in and out of view (pause a loop while it is off-screen).
   */
  once?: boolean;
  /** IntersectionObserver threshold (default: 0.2 with `once`, 0 without). */
  threshold?: number;
  /** IntersectionObserver rootMargin (default: '0px 0px -8% 0px' with `once`, '0px' without). */
  rootMargin?: string;
  /** Value before the first observation (default: reduced motion with `once`, so nothing waits; true without). */
  initial?: boolean;
}

/** Observe an element you already hold a ref to (returned as is). */
export interface InViewRefOption<T extends Element> { ref?: RefObject<T | null> }

/**
 * `const [ref, inView] = useInView<HTMLDivElement>({ once: false })`. GSAP-free, so the shell and light pages can use it.
 * Without IntersectionObserver the element counts as in view.
 */
export function useInView<T extends Element>(opts: InViewOptions & InViewRefOption<T> = {}): readonly [RefObject<T | null>, boolean] {
  const { once = true } = opts;
  const threshold = opts.threshold ?? (once ? 0.2 : 0);
  const rootMargin = opts.rootMargin ?? (once ? '0px 0px -8% 0px' : '0px');
  const own = useRef<T>(null);
  const ref = opts.ref ?? own;
  // Without IntersectionObserver the element simply counts as in view.
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined' || (opts.initial ?? (once ? reducedMotion() : true)));
  const done = once && inView;
  useEffect(() => {
    const el = ref.current;
    if (!el || done) return;
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => {
      if (once) { if (e.isIntersecting) { setInView(true); io.disconnect(); } return; }
      setInView(e.isIntersecting);
    }, { threshold, rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, done, once, threshold, rootMargin]);
  return [ref, inView] as const;
}
