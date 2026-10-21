import { useMemo, useRef } from 'react';
import { cx } from '../../lib/format';
import { DUR, MOTION_OK, ScrollTrigger, canAnimate, gsap, useGSAP } from './gsap';

export interface CountUpProps {
  value: number;
  /** Fixed decimals (default 0). */
  decimals?: number;
  /** Seconds (default 0.6, --dur-4). */
  duration?: number;
  prefix?: string;
  suffix?: string;
  /** Count from here (default 0). */
  from?: number;
  /** Override the number format (receives the in-between values too). */
  format?: (n: number) => string;
  className?: string;
}

/**
 * Number ticker for COUNTS (cohorts, cells, units). It counts once when it scrolls into view, with tabular digits
 * and a locked width (no layout shift). The final value is in the DOM from the first render (screen readers,
 * reduced or paused motion). Audit S-18: never tick AP, CIs, p, delta or rho; an in-between "0.412" is a false value.
 */
export function CountUp({ value, decimals = 0, duration = DUR.hero, prefix = '', suffix = '', from = 0, format, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const fmt = useMemo(() => {
    if (format) return format;
    const nf = new Intl.NumberFormat('en-GB', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return (n: number) => nf.format(n);
  }, [format, decimals]);
  const final = `${prefix}${fmt(value)}${suffix}`;

  useGSAP(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      if (!canAnimate() || el.getBoundingClientRect().bottom < 0) return;
      // Write into React's own text node, so a later re-render still updates the number.
      const setText = (s: string) => { if (el.firstChild) el.firstChild.nodeValue = s; else el.textContent = s; };
      el.style.minWidth = `${el.getBoundingClientRect().width}px`; // width of the final value
      const state = { n: from };
      const paint = () => setText(`${prefix}${fmt(decimals ? state.n : Math.round(state.n))}${suffix}`);
      paint();
      const st = ScrollTrigger.create({
        trigger: el, start: 'top 92%', once: true,
        onEnter: () => {
          if (!canAnimate()) { setText(final); return; }
          gsap.to(state, { n: value, duration, ease: 'power2.out', onUpdate: paint, onComplete: () => setText(final) });
        },
      });
      return () => { st.kill(); setText(final); el.style.minWidth = ''; };
    });
    return () => mm.revert();
  }, { dependencies: [value, decimals, duration, from, final] });

  return (
    <span className={cx('countup tabular', className)}>
      <span ref={ref} aria-hidden="true" className="inline-block">{final}</span>
      <span className="sr-only">{final}</span>
    </span>
  );
}
