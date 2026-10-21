import { useRef, type HTMLAttributes, type ReactNode, type RefObject } from 'react';
import { useLoopGate, type LoopGateOptions } from './useLoopGate';

type LoopTag = 'div' | 'span' | 'figure' | 'section' | 'aside';
export interface LoopHostProps extends LoopGateOptions, Omit<HTMLAttributes<HTMLElement>, 'children'> {
  as?: LoopTag;
  children: ReactNode;
}

/**
 * Gated container for CSS loops: `<LoopHost className="relative"><svg>{animated dots}</svg></LoopHost>`.
 * Every infinite CSS animation inside holds while the host is off-screen, the tab is hidden, or motion is reduced
 * or paused (`data-loop="hold"`, app.css). Budget: <= 20 animated elements per host; animate a parent `<g>` or
 * wrapper, never 100+ leaves. GSAP-free.
 */
export function LoopHost({ as = 'div', rootMargin, children, ...rest }: LoopHostProps) {
  const ref = useRef<HTMLElement>(null);
  const { loopProps } = useLoopGate(ref, { rootMargin });
  // One element type for JSX typing; `as` picks the real tag at runtime.
  const Tag = as as 'div';
  return <Tag {...rest} {...loopProps} ref={ref as RefObject<HTMLDivElement>}>{children}</Tag>;
}
