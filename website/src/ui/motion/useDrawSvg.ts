import { useRef, type RefObject } from 'react';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { clampStart, entranceState, safetyNet, whenCued } from './choreo';
import { EASE, MOTION_OK, ScrollTrigger, canAnimate, gsap, toEnd, useGSAP } from './gsap';

export interface DrawOptions {
  /** Shapes to draw inside the container (default 'path, line, polyline'). */
  selector?: string;
  /** Seconds per stroke (default 0.9). */
  duration?: number;
  /** Seconds between strokes (default 0.08). */
  stagger?: number;
  delay?: number;
  /** ScrollTrigger start (default 'top 85%'). */
  start?: string;
}

/** Dashed strokes (references such as hvg_logreg) keep their dashes: they fade in instead of drawing. */
const isDashed = (el: Element) => { const d = getComputedStyle(el).strokeDasharray; return !!d && d !== 'none' && d !== '0'; };
const clearDash = (els: Element[]) => els.forEach((el) => { (el as SVGElement).style.strokeDasharray = ''; (el as SVGElement).style.strokeDashoffset = ''; });

export function useDraw(getTargets: () => Element[], trigger: () => Element | null, opts: DrawOptions, deps: unknown[]) {
  const { duration = 0.9, stagger = 0.08, delay = 0, start = 'top 85%' } = opts;
  useGSAP(() => {
    const host = trigger();
    if (!host) return;
    gsap.registerPlugin(DrawSVGPlugin);
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      if (!canAnimate() || host.getBoundingClientRect().bottom < 0) return;
      const all = getTargets();
      const solid = all.filter((el) => !isDashed(el));
      const dashed = all.filter(isDashed);
      if (!all.length) return;
      if (solid.length) gsap.set(solid, { drawSVG: '0%' });
      if (dashed.length) gsap.set(dashed, { opacity: 0 });
      const st = ScrollTrigger.create({
        trigger: host, start, once: true,
        onEnter: () => {
          if (!canAnimate()) { clearDash(solid); if (dashed.length) gsap.set(dashed, { clearProps: 'opacity' }); return; }
          if (solid.length) gsap.to(solid, { drawSVG: '100%', duration, stagger, delay, ease: 'power2.inOut', onComplete: () => clearDash(solid) });
          if (dashed.length) gsap.to(dashed, { opacity: 1, duration: duration * 0.6, delay: delay + duration * 0.4, clearProps: 'opacity' });
        },
      });
      return () => { st.kill(); clearDash(solid); };
    });
    return () => mm.revert();
  }, { dependencies: [duration, stagger, delay, start, ...deps] });
}

/**
 * Draw every stroke inside an SVG (or any container) once, on first view.
 * `const ref = useDrawSvg<SVGSVGElement>(); <svg ref={ref}>...</svg>`
 */
export function useDrawSvg<T extends Element>(opts: DrawOptions = {}): RefObject<T | null> {
  const ref = useRef<T>(null);
  const selector = opts.selector ?? 'path, line, polyline';
  useDraw(() => (ref.current ? Array.from(ref.current.querySelectorAll(selector)) : []), () => ref.current, opts, [selector]);
  return ref;
}

/* ---------- Draw-in for chart marks (dots, intervals, CD bars) ---------- */

/** One group of marks: hidden at `from`, then tweened back to its natural state. */
export interface DrawInStep {
  /** Marks inside the container (CSS selector). */
  selector: string;
  /** Start state (default `{ opacity: 0 }`). Function values work: `x: (i, el) => -el.offsetLeft`. */
  from?: gsap.TweenVars;
  /** End state (default: the natural value of every animatable key in `from`: opacity 1, x 0, scaleX 1, ...). */
  to?: gsap.TweenVars;
  /** Seconds after the previous steps start (timeline position; default 0 for the first step, then '<'). */
  at?: number | string;
  /** Seconds per mark (default 0.5). */
  duration?: number;
  /** Seconds between marks (default 0.03: the 20-40 ms band). */
  stagger?: number;
}

export interface DrawInOptions extends DrawInStep {
  /** Groups that follow on the same timeline (whiskers after their dots, a CD bar after the markers). */
  then?: DrawInStep[];
  /** Seconds before the first mark moves (default 0). */
  delay?: number;
  /** ScrollTrigger start (default 'top 85%', clamped). */
  start?: string;
  /** Shared "already drawn" flag: a remounted chart (tab switch) is shown at once instead of drawing again. */
  once?: RefObject<boolean>;
  /** Re-run when these change (default none). */
  deps?: unknown[];
}

/** Natural values for the keys a draw-in may start from. */
const NATURAL: Record<string, string | number> = {
  opacity: 1, autoAlpha: 1, x: 0, y: 0, xPercent: 0, yPercent: 0, scale: 1, scaleX: 1, scaleY: 1, rotation: 0, drawSVG: '100%',
};
/** Keys that only position the transform; they are set, never tweened. */
const SETUP_KEYS = new Set(['svgOrigin', 'transformOrigin']);
const naturalOf = (from: gsap.TweenVars): gsap.TweenVars => {
  const to: gsap.TweenVars = {};
  for (const k of Object.keys(from)) if (k in NATURAL) to[k] = NATURAL[k];
  return to;
};
const clearOf = (from: gsap.TweenVars) => {
  const props = new Set<string>();
  for (const k of Object.keys(from)) {
    if (SETUP_KEYS.has(k)) continue;
    props.add(k === 'opacity' || k === 'autoAlpha' ? 'opacity' : k === 'drawSVG' ? 'strokeDasharray,strokeDashoffset' : 'transform');
    if (k === 'autoAlpha') props.add('visibility');
  }
  return [...props].join(',');
};

/**
 * Chart marks arrive once, on first view: hide the marks, then stagger them back in when the chart reaches
 * `start`. Follows its SectionHeader (`whenCued`) like `useReveal`, and a timer-based safety net forces the final
 * state, so marks can never stay hidden (throttled tab, Pause motion). Charts scrolled past at mount, reduced motion
 * and paused motion: nothing is hidden. Values (AP text) are never animated.
 * `useDrawIn(ref, { selector: '.mc-dot', from: { opacity: 0, x: (_i, el) => Number(el.dataset.fromX ?? 0) }, delay: 0.3 })`
 */
export function useDrawIn(ref: RefObject<Element | null>, opts: DrawInOptions) {
  const { delay = 0, start = 'top 85%', once, deps = [] } = opts;
  const steps: DrawInStep[] = [opts, ...(opts.then ?? [])];
  const sig = steps.map((s) => `${s.selector}@${s.at ?? ''}`).join('|');
  useGSAP(() => {
    const host = ref.current;
    if (!host || once?.current) return;
    if (steps.some((s) => s.from && Object.keys(s.from).includes('drawSVG'))) gsap.registerPlugin(DrawSVGPlugin);
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      if (!canAnimate() || host.getBoundingClientRect().bottom < 0) return;
      const groups = steps.map((step) => {
        const from = step.from ?? { opacity: 0 };
        return { step, from, marks: gsap.utils.toArray<Element>(step.selector, host), clear: clearOf(from) };
      }).filter((g) => g.marks.length);
      if (!groups.length) return;
      const showAll = () => groups.forEach((g) => gsap.set(g.marks, { clearProps: g.clear }));
      groups.forEach((g) => gsap.set(g.marks, g.from));

      const cancels: (() => void)[] = [];
      let tl: gsap.core.Timeline | null = null;
      let started = false;
      const play = () => {
        if (started) return;
        started = true;
        if (once) once.current = true;
        if (!canAnimate()) { showAll(); return; }
        cancels.push(whenCued(host, (cue) => {
          if (!canAnimate()) { showAll(); return; }
          tl = gsap.timeline({ delay: cue + delay, defaults: { ease: EASE }, onComplete: showAll });
          groups.forEach(({ step, from }, i) => {
            const vars = { ...(step.to ?? naturalOf(from)), duration: step.duration ?? 0.5, stagger: step.stagger ?? 0.03 };
            tl?.to(groups[i].marks, vars, step.at ?? (i === 0 ? 0 : '<'));
          });
          const timeline = tl;
          cancels.push(safetyNet(cue + delay + timeline.duration(), () => { toEnd(timeline); showAll(); }));
        }));
      };
      const st = ScrollTrigger.create({ trigger: host, start: clampStart(start), once: true, onEnter: play, onLeave: play });
      // Already past the start at mount (a hero chart): clamp() can pin the start to scroll 0, where onEnter only
      // fires after the first scroll, so play now.
      if (entranceState(host) === 'inview' && st.scroll() >= st.start) play();
      return () => { st.kill(); cancels.forEach((c) => c()); tl?.kill(); showAll(); };
    });
    return () => mm.revert();
  }, { dependencies: [sig, delay, start, ...deps] });
}
