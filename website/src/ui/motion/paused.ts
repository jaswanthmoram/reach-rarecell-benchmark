import { useSyncExternalStore } from 'react';

/*
 * Global "Pause motion" switch (WCAG 2.2.2). Sets `data-motion="paused"` on <html> and remembers it.
 * CSS pauses `.loop` and the shell loops (the loop gates hold the rest); this module pauses infinite WAAPI
 * animations, and gsap.ts pauses the infinite GSAP loops (finite tweens still finish). Canvas and rAF loops use `useLoopGate()`.
 * Kept free of GSAP so the shell (main chunk) can import it.
 */
const KEY = 'reach-motion';
const root = () => document.documentElement;
const listeners = new Set<() => void>();

export const isMotionPaused = () => typeof document !== 'undefined' && root().dataset.motion === 'paused';

/** The OS asks for reduced motion. The one definition the site uses (router, kit, shell, pages). */
export const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** May something move now: no reduced motion and not paused by the visitor. `canAnimate` (gsap.ts) is this. */
export const motionAllowed = () => !reducedMotion() && !isMotionPaused();

/**
 * Pause every running infinite script animation (WAAPI `el.animate`). Finite entrances are left alone. CSS animations
 * and transitions are skipped on purpose: calling pause()/play() on one overrides `animation-play-state` for good, so
 * after one Pause/Resume the loop gates (`data-loop="hold"`, `html[data-hidden]`) would no longer hold it. CSS loops
 * are held by `[data-motion="paused"]` and the gates instead (app.css).
 */
const isCssDriven = (a: Animation) => (typeof CSSAnimation !== 'undefined' && a instanceof CSSAnimation)
  || (typeof CSSTransition !== 'undefined' && a instanceof CSSTransition);
function sweep(paused: boolean) {
  if (typeof document.getAnimations !== 'function') return;
  for (const a of document.getAnimations()) {
    if (isCssDriven(a)) continue;
    const iterations = a.effect?.getTiming().iterations;
    if (iterations !== Infinity) continue;
    if (paused) a.pause(); else if (a.playState === 'paused') a.play();
  }
}

let observer: MutationObserver | null = null;
let queued = false;
/** While paused, newly mounted loops (route changes) are caught on the next frame. */
function watch(on: boolean) {
  observer?.disconnect();
  observer = null;
  if (!on || typeof MutationObserver === 'undefined') return;
  observer = new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; sweep(true); });
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
}

export function setMotionPaused(paused: boolean) {
  if (paused) root().dataset.motion = 'paused';
  else delete root().dataset.motion;
  try { localStorage.setItem(KEY, paused ? 'paused' : 'on'); } catch { /* storage blocked: the switch still works for this visit */ }
  sweep(paused);
  watch(paused);
  listeners.forEach((l) => l());
}

export function onMotionPausedChange(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

/** `const paused = useMotionPaused()`: stop canvas/rAF loops when true (draw one static frame instead). */
export const useMotionPaused = () => useSyncExternalStore(onMotionPausedChange, isMotionPaused, () => false);

// index.html sets the attribute before paint; start watching if the visitor paused on an earlier visit.
if (typeof document !== 'undefined' && isMotionPaused()) {
  if (document.body) watch(true);
  else document.addEventListener('DOMContentLoaded', () => watch(true), { once: true });
}

/* Hidden tab: `data-hidden` on <html> holds every CSS animation (app.css), so nothing ticks in a background tab. */
if (typeof document !== 'undefined') {
  const syncHidden = () => {
    if (document.visibilityState === 'hidden') root().dataset.hidden = '';
    else delete root().dataset.hidden;
  };
  document.addEventListener('visibilitychange', syncHidden);
  syncHidden();
}
