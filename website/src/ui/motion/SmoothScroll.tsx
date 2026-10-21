import type { ReactNode } from 'react';

/**
 * Kept for existing imports only: the site scrolls natively (r10). Lenis put scrolling on the main thread and,
 * with ScrollTrigger, forced a layout every frame; native scrolling stays on the compositor. `scrollToId` (lib/router)
 * smooth-scrolls programmatic jumps unless the visitor asks for reduced motion.
 */
export function SmoothScroll({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}
