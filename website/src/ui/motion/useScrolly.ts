import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { ScrollTrigger, useGSAP } from './gsap';
import { reducedMotion } from './paused';

export interface ScrollProgressOptions {
  /** ScrollTrigger start/end (default: element enters the bottom until it leaves the top). */
  start?: string;
  end?: string;
  /** Under reduced motion: 'final' reports 1 once (default), 'track' keeps following the scroll. */
  reduced?: 'final' | 'track';
}

/**
 * Scroll-linked progress 0..1 for one element, delivered to a callback (no re-render per frame).
 * Use it to scrub a chart: `const ref = useScrollProgress<HTMLDivElement>((p) => line.style.transform = ...)`.
 * The page is never hijacked: it scrolls normally, the chart follows.
 */
export function useScrollProgress<T extends Element>(onProgress: (p: number) => void, opts: ScrollProgressOptions = {}): RefObject<T | null> {
  const ref = useRef<T>(null);
  const cb = useRef(onProgress);
  useEffect(() => { cb.current = onProgress; });
  const { start = 'top bottom', end = 'bottom top', reduced = 'final' } = opts;
  useGSAP(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced === 'final' && reducedMotion()) { cb.current(1); return; }
    const st = ScrollTrigger.create({ trigger: el, start, end, onUpdate: (self) => cb.current(self.progress), onRefresh: (self) => cb.current(self.progress) });
    return () => st.kill();
  }, { dependencies: [start, end, reduced] });
  return ref;
}

/**
 * Which step of a scrollytelling column is active: the step crossing the middle of the viewport.
 * State, not motion, so it also runs under reduced motion.
 * `const { active, stepRef } = useScrollySteps(steps.length); <li ref={stepRef(i)}>`
 */
export function useScrollySteps(count: number, { line = 0.5 }: { line?: number } = {}) {
  const [active, setActive] = useState(0);
  const els = useRef<(Element | null)[]>([]);
  const refs = useMemo(() => Array.from({ length: count }, (_, i) => (el: Element | null) => { els.current[i] = el; }), [count]);
  useEffect(() => {
    const pct = Math.round(line * 100);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) setActive(els.current.indexOf(e.target));
    }, { rootMargin: `-${pct}% 0px -${100 - pct}% 0px` });
    els.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [count, line]);
  return { active, stepRef: (i: number) => refs[i] };
}
