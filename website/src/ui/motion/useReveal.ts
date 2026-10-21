import { useRef, type RefObject } from 'react';
import { ENTER_AT, onEnter, safetyNet, whenCued } from './choreo';
import { EASE_OUT, MOTION_OK, canAnimate, gsap, toEnd, useGSAP } from './gsap';

export type RevealVariant = 'rise' | 'mask' | 'fade' | 'scale';

export interface RevealOptions {
  /** Which descendants enter. Default: the direct children of the element. */
  selector?: string;
  /** 'rise' (default): 12px up + fade. 'mask': clip-path wipe top to bottom (images, figures, cards). 'fade'. 'scale': 0.97 to 1 + fade. */
  variant?: RevealVariant;
  /** Rise distance in px for 'rise' (default 12). */
  y?: number;
  /** Seconds between items (default 0.04, capped at 0.05); items after the 4th share the 4th delay. */
  stagger?: number;
  /** Seconds per item (default: rise 0.34, fade 0.3, scale 0.38, mask 0.42; capped at 0.45). */
  duration?: number;
  /** Start line, 'top N%' (default 'top 88%'). Content jumped past counts as entered. */
  start?: string;
}

interface Look { from: gsap.TweenVars; to: gsap.TweenVars; clear: string; duration: number }
const look = (variant: RevealVariant, y: number): Look => {
  switch (variant) {
    case 'mask': return { from: { clipPath: 'inset(0% 0% 100% 0%)' }, to: { clipPath: 'inset(0% 0% 0% 0%)' }, clear: 'clipPath', duration: 0.42 };
    case 'fade': return { from: { opacity: 0 }, to: { opacity: 1 }, clear: 'opacity', duration: 0.3 };
    case 'scale': return { from: { opacity: 0, scale: 0.97 }, to: { opacity: 1, scale: 1 }, clear: 'opacity,transform', duration: 0.38 };
    default: return { from: { opacity: 0, y }, to: { opacity: 1, y: 0 }, clear: 'opacity,transform', duration: 0.34 };
  }
};

/** Items after the 4th share the 4th delay, so a long list is fully in within ~0.5s of entering. */
const MAX_STAGGERED = 3;
const MAX_STAGGER = 0.05;
const MAX_DURATION = 0.45;

/**
 * Section-level entrance: children below the fold at mount enter once, in batches, as their top reaches 88% of the
 * viewport (one shared IntersectionObserver, no ScrollTrigger). In a section with a SectionHeader they start at most
 * 0.1s after the header. Items on screen at mount, or scrolled past, are shown as is (nothing hides at first paint).
 * Children that hold a SectionHeader are skipped. Reduced or paused motion: nothing is hidden and nothing moves.
 * `const ref = useReveal<HTMLDivElement>(); <div ref={ref}>...</div>`
 */
export function useReveal<T extends HTMLElement>(opts: RevealOptions = {}): RefObject<T | null> {
  const ref = useRef<T>(null);
  const { selector, variant = 'rise', y = 12, stagger = 0.04, duration, start = ENTER_AT } = opts;
  useGSAP(() => {
    const root = ref.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      if (!canAnimate()) return;
      const all = selector ? gsap.utils.toArray<HTMLElement>(selector, root) : (Array.from(root.children) as HTMLElement[]);
      const items = all.filter((el) => !el.matches('[data-sh]') && !el.querySelector('[data-sh]'));
      if (!items.length) return;
      const vh = window.innerHeight;
      const later = items.filter((el) => el.getBoundingClientRect().top >= vh); // on screen or scrolled past: shown as is
      if (!later.length) return;
      const v = look(variant, y);
      const dur = Math.min(MAX_DURATION, duration ?? v.duration);
      const gap = Math.min(MAX_STAGGER, Math.max(0, stagger));
      gsap.set(later, v.from);

      const cancels: (() => void)[] = [];
      let pending: HTMLElement[] = [];
      let queued = false;
      const show = () => {
        queued = false;
        const fresh = pending;
        pending = [];
        if (!fresh.length) return;
        if (!canAnimate()) { gsap.set(fresh, { clearProps: v.clear }); return; }
        cancels.push(whenCued(root, (delay) => {
          const tween = gsap.to(fresh, { ...v.to, duration: dur, ease: EASE_OUT, delay, overwrite: true, clearProps: v.clear,
            stagger: (i: number) => Math.min(i, MAX_STAGGERED) * gap });
          cancels.push(safetyNet(delay + dur + MAX_STAGGERED * gap, () => toEnd(tween)));
        }));
      };
      // Items that enter in the same observer callback play as one batch.
      const enter = (el: HTMLElement) => {
        pending.push(el);
        if (!queued) { queued = true; queueMicrotask(show); }
      };
      later.forEach((el) => cancels.push(onEnter(el, () => enter(el), start)));
      return () => cancels.forEach((c) => c());
    });
    return () => mm.revert();
  }, { scope: ref, dependencies: [selector, variant, y, stagger, duration, start] });
  return ref;
}
