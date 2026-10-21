import { useRef, type SVGProps } from 'react';
import { useDraw, type DrawOptions } from './useDrawSvg';

export type DrawPathProps = SVGProps<SVGPathElement> & Omit<DrawOptions, 'selector'>;

/** `<DrawPath d={line} stroke="var(--m-fire)" fill="none" />`: one path that draws itself on first view. */
export function DrawPath({ duration, stagger, delay, start, ...rest }: DrawPathProps) {
  const ref = useRef<SVGPathElement>(null);
  useDraw(() => (ref.current ? [ref.current] : []), () => ref.current, { duration, stagger, delay, start }, [rest.d]);
  return <path ref={ref} {...rest} />;
}
