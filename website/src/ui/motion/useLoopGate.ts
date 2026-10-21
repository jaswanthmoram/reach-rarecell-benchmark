import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import { reducedMotion, useMotionPaused } from './paused';

const REDUCE = '(prefers-reduced-motion: reduce)';
const subscribeReduced = (cb: () => void) => {
  if (typeof matchMedia === 'undefined') return () => undefined;
  const mq = matchMedia(REDUCE);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const subscribeVisibility = (cb: () => void) => {
  document.addEventListener('visibilitychange', cb);
  return () => document.removeEventListener('visibilitychange', cb);
};
const tabVisible = () => typeof document === 'undefined' || document.visibilityState === 'visible';

/* One IntersectionObserver per rootMargin for every gate on the page (not one per gate). */
type Watch = (onScreen: boolean) => void;
const shared = new Map<string, { io: IntersectionObserver; watchers: Map<Element, Set<Watch>>; last: WeakMap<Element, boolean> }>();
function watchOnScreen(el: Element, rootMargin: string, cb: Watch): () => void {
  let entry = shared.get(rootMargin);
  if (!entry) {
    const watchers = new Map<Element, Set<Watch>>();
    const last = new WeakMap<Element, boolean>();
    const io = new IntersectionObserver((records) => {
      for (const r of records) {
        last.set(r.target, r.isIntersecting);
        watchers.get(r.target)?.forEach((w) => w(r.isIntersecting));
      }
    }, { rootMargin, threshold: 0 });
    entry = { io, watchers, last };
    shared.set(rootMargin, entry);
  }
  const { io, watchers, last } = entry;
  const set = watchers.get(el);
  if (set) {
    set.add(cb);
    const known = last.get(el);
    if (known !== undefined) cb(known); // already observed: no new initial record will come
  } else {
    watchers.set(el, new Set([cb]));
    io.observe(el);
  }
  return () => {
    const s = watchers.get(el);
    s?.delete(cb);
    if (s && !s.size) { watchers.delete(el); io.unobserve(el); last.delete(el); }
  };
}

export interface LoopGateOptions {
  /** How far outside the viewport the loop keeps running (default '80px', so it is live as it scrolls in). */
  rootMargin?: string;
}

export interface LoopGate<T extends Element> {
  /** Put on the looping element (or pass your own ref to `useLoopGate`). */
  ref: RefObject<T | null>;
  /** Run the loop now: on screen, tab visible, no reduced motion, not paused by the visitor. Otherwise draw one still frame. */
  running: boolean;
  /** Spread on the element: `data-loop="hold"` pauses every CSS animation inside it (app.css). */
  loopProps: { 'data-loop': 'run' | 'hold' };
}

/**
 * The one gate for every rAF, canvas, video or CSS loop (WCAG 2.2.2 in one code path):
 * `const { ref, running, loopProps } = useLoopGate<SVGSVGElement>(); <svg ref={ref} {...loopProps}>`. GSAP-free.
 * Every infinite CSS animation on the site must sit inside a gated element (this hook or `<LoopHost>`): off-screen,
 * hidden tab, reduced or paused motion, it holds (`data-loop="hold"`). Starts held until the first observation, so
 * a loop never runs off-screen at mount.
 */
export function useLoopGate<T extends Element>(external?: RefObject<T | null>, opts: LoopGateOptions = {}): LoopGate<T> {
  const own = useRef<T>(null);
  const ref = external ?? own;
  const rootMargin = opts.rootMargin ?? '80px';
  const [onScreen, setOnScreen] = useState(() => typeof IntersectionObserver === 'undefined');
  // The element can mount (or be swapped) after the first render, so each commit checks what the ref holds now and
  // re-subscribes only when that (or the margin) changed: a cheap comparison, no extra render.
  const report = useCallback((v: boolean) => setOnScreen(v), []);
  const watched = useRef<{ el: Element | null; margin: string; stop: () => void }>({ el: null, margin: rootMargin, stop: () => undefined });
  useEffect(() => {
    const el = ref.current;
    const w = watched.current;
    if (el === w.el && rootMargin === w.margin) return;
    w.stop();
    const stop = el && typeof IntersectionObserver !== 'undefined' ? watchOnScreen(el, rootMargin, report) : () => undefined;
    watched.current = { el, margin: rootMargin, stop };
  });
  useEffect(() => () => { watched.current.stop(); watched.current = { el: null, margin: '', stop: () => undefined }; }, []);
  const paused = useMotionPaused();
  const reduced = useSyncExternalStore(subscribeReduced, reducedMotion, () => false);
  const visible = useSyncExternalStore(subscribeVisibility, tabVisible, () => true);
  const running = onScreen && visible && !paused && !reduced;
  return { ref, running, loopProps: { 'data-loop': running ? 'run' : 'hold' } };
}
