import { useInView as useInViewShared } from '../ui/motion/useInView';
import { reducedMotion } from '../ui/motion/paused';

/** Kept for existing imports; the one definition is `reducedMotion` in `ui/motion/paused.ts`. */
export const prefersReducedMotion = reducedMotion;

/** True once the element has entered the viewport (fires once). Reduced motion: true from the start.
 * Kept for existing imports; new code uses `useInView({ once, threshold, rootMargin })` from `ui/motion`. */
export const useInView = <T extends Element>(threshold = 0.2) => useInViewShared<T>({ once: true, threshold });
