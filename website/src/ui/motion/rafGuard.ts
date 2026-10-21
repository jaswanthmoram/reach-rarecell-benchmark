/*
 * ScrollTrigger starts a requestAnimationFrame loop that never ends (`_rafBugFix`, gsap/ScrollTrigger.js:61) to work
 * around a Firefox repaint bug. Everywhere else it only wakes the main thread 60 times a second forever (PERF-r10).
 * Imported by gsap.ts before ScrollTrigger: outside Firefox, the first rAF request whose callback is exactly that
 * loop (`function e(){return x&&requestAnimationFrame(e)}`) is dropped, then the native rAF is restored. Anything else
 * passes through untouched; if the loop is not seen within 10s the guard removes itself.
 */
const LOOP = /^function\s*[\w$]*\s*\(\)\s*\{\s*return\s+[\w$]+\s*&&\s*requestAnimationFrame\(\s*[\w$]+\s*\)\s*;?\s*\}$/;
const GIVE_UP_MS = 10_000;

if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && !/firefox/i.test(navigator.userAgent)) {
  const native = window.requestAnimationFrame;
  let armed = true;
  const disarm = () => {
    if (!armed) return;
    armed = false;
    if (window.requestAnimationFrame === guarded) window.requestAnimationFrame = native;
  };
  const guarded = function requestAnimationFrame(cb: FrameRequestCallback): number {
    if (armed && LOOP.test(Function.prototype.toString.call(cb))) { disarm(); return 0; }
    return native.call(window, cb);
  };
  window.requestAnimationFrame = guarded;
  window.setTimeout(disarm, GIVE_UP_MS);
}

export {};
