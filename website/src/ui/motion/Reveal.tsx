import { createElement, type HTMLAttributes, type ReactNode } from 'react';
import { useReveal, type RevealOptions } from './useReveal';

type RevealTag = 'div' | 'section' | 'ul' | 'ol' | 'article' | 'header' | 'footer' | 'aside' | 'figure' | 'dl';
export interface RevealProps extends RevealOptions, Omit<HTMLAttributes<HTMLElement>, 'children'> {
  as?: RevealTag;
  children: ReactNode;
}

/**
 * `<Reveal as="ul" className="grid gap-4">{cards}</Reveal>`: each child enters in turn, once, after the section's
 * header. `variant="mask"` for figures and image cards, `"fade"`, `"scale"`; default `"rise"`.
 */
export function Reveal({ as = 'div', selector, variant, y, stagger, duration, start, children, ...rest }: RevealProps) {
  const ref = useReveal<HTMLElement>({ selector, variant, y, stagger, duration, start });
  return createElement(as, { ...rest, ref }, children);
}
