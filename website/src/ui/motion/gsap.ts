import './rafGuard'; // must run before gsap/ScrollTrigger evaluates
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ROUTE_EVENT } from '../../lib/router';
import { isMotionPaused, motionAllowed, onMotionPausedChange } from './paused';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** gsap.matchMedia() conditions. Every kit animation lives inside MOTION_OK. */
export const MOTION_OK = '(prefers-reduced-motion: no-preference)';
export const MOTION_REDUCE = '(prefers-reduced-motion: reduce)';

/** True when an entrance may animate now (no reduced motion, not paused by the visitor). Same as `motionAllowed`. */
export const canAnimate = motionAllowed;

/** Shared easing/duration (match --dur-* in app.css). Kit entrances stay <= 0.45s; `page`/`hero` are for pages' own moments. */
export const EASE = 'power2.out';
/** Strong ease-out for entrances (close to --ease-out, cubic-bezier(0.23, 1, 0.32, 1)). */
export const EASE_OUT = 'power3.out';
export const DUR = { fast: 0.15, base: 0.22, entry: 0.42, section: 0.5, hero: 0.6, page: 0.72 } as const;

/**
 * Jump an animation to its end, once. Use instead of `progress(1)` in safety nets and pause sweeps: setting the
 * playhead of a finished zero-duration tween (a delayedCall, a delayed set) puts it back on the global timeline,
 * where it never completes again and stops GSAP's ticker from sleeping, so rAF ran ~60 times a second for good.
 */
export function toEnd(t: gsap.core.Animation | null | undefined): void {
  if (t && (t.parent || t.totalProgress() < 1)) t.progress(1);
}

/* Keep ScrollTrigger positions true as the SPA changes under it (route swaps, lazy images, Suspense). */
const REFRESH_DEBOUNCE_MS = 180;
/** GSAP gives repeat: -1 a total duration near 1e8 s; anything this long is a loop. */
const LOOP_DURATION = 1e7;
/** While paused, new GSAP loops are caught this often. */
const HOLD_EVERY_MS = 150;
/** How often finished animations stranded on the global timeline are cleared (see `reap`). */
const REAP_EVERY_MS = 1000;
let timer = 0;
const refreshSoon = () => {
  window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    // Triggers whose element left the DOM (a page unmounted without reverting) are dead weight.
    ScrollTrigger.getAll().forEach((t) => { const el = t.trigger; if (el && !el.isConnected) t.kill(); });
    ScrollTrigger.refresh();
  }, REFRESH_DEBOUNCE_MS);
};
if (typeof window !== 'undefined') {
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(refreshSoon).observe(document.body);
  window.addEventListener(ROUTE_EVENT, refreshSoon);
  document.fonts?.ready.then(refreshSoon).catch(() => undefined);

  /*
   * Pause motion holds the loops only (repeat: -1, or a timeline that holds one). The global timeline keeps running,
   * so a tween created while paused (a chart re-tweening on a filter, a delayedCall used as a timer) still runs or
   * is jumped to its end by its owner's canAnimate() check; nothing is left frozen at time 0.
   */
  const held = new Set<gsap.core.Animation>();
  const isLoop = (t: gsap.core.Animation) => t.repeat() === -1 || t.totalDuration() >= LOOP_DURATION;
  /** delayedCall targets its callback; firing it early would run timers out of turn. */
  const isDelayedCall = (t: gsap.core.Animation) => t instanceof gsap.core.Tween && typeof t.targets()[0] === 'function';
  const holdLoops = () => {
    for (const t of gsap.globalTimeline.getChildren(false, true, true)) {
      if (held.has(t) || t.paused() || !isLoop(t)) continue;
      t.pause();
      held.add(t);
    }
  };
  /* Not a ticker listener: a listener keeps the GSAP ticker (rAF) awake for as long as motion is paused. A loop
   * started while paused moves for at most one interval before it is held. */
  let holdTimer = 0;
  const syncPause = () => {
    window.clearInterval(holdTimer);
    holdTimer = 0;
    if (isMotionPaused()) {
      // Finish scheduled entrances so nothing is left half-visible (scrubbed and not-yet-triggered tweens are paused
      // and stay with their ScrollTrigger), then hold every loop, and any loop started later.
      for (const t of gsap.globalTimeline.getChildren(false, true, true)) {
        if (!isLoop(t) && !isDelayedCall(t) && !t.paused()) toEnd(t);
      }
      holdLoops();
      holdTimer = window.setInterval(holdLoops, HOLD_EVERY_MS);
    } else {
      held.forEach((t) => t.resume());
      held.clear();
    }
  };
  syncPause();
  onMotionPausedChange(syncPause);

  /*
   * Ticker guard. GSAP's ticker (rAF) sleeps by itself once every child of the global timeline is paused or gone.
   * A finished animation still parented there (GSAP removes them as they finish; one re-added by a late
   * progress(1)/seek from page code is not) blocks that for the rest of the visit. Clear those; running, waiting,
   * paused, looping and ScrollTrigger-owned animations are untouched. A timer, not a ticker listener.
   */
  const stranded = (t: gsap.core.Animation) => !t.paused() && t.timeScale() > 0 && !t.scrollTrigger && !isLoop(t)
    && !t.isActive() && t.totalProgress() >= 1;
  const reap = () => {
    // Detach only (not kill): a later play() or restart() puts it back.
    for (const t of gsap.globalTimeline.getChildren(false, true, true)) if (stranded(t)) gsap.globalTimeline.remove(t);
  };
  window.setInterval(reap, REAP_EVERY_MS);
}

export { gsap, ScrollTrigger, useGSAP };
