import { cx } from '../../lib/format';

/** Mono label used across the board: 11px, uppercase, tracked. */
export const label = 'font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3';
export const ghostBtn = 'inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-chip border border-line bg-surface px-3 text-xs font-medium text-ink-2 transition-[background-color,color,transform] duration-[var(--dur-1)] hover:bg-sunk hover:text-ink active:scale-[0.97]';
/** Section rhythm (audit S-14): each topic change gets its own spacing instead of four equal blocks. */
export type Rhythm = 'first' | 'wide' | 'tight' | 'last';
const RHYTHM: Record<Rhythm, string> = {
  first: 'pb-20 pt-14 sm:pb-28 sm:pt-16',
  wide: 'border-t border-line py-20 sm:py-32',
  tight: 'border-t border-line py-16 sm:py-28',
  last: 'border-t border-line pb-24 pt-20 sm:pb-32 sm:pt-32',
};
export const sectionCls = (r: Rhythm) => cx('relative', RHYTHM[r]);
/** Inline link arrow that nudges 2px on hover (put `group` on the link). */
export const nudge = 'inline-block flex-none transition-transform duration-[var(--dur-1)] group-hover:translate-x-0.5';
/** Inline text link: words carry fx-underline (put the label in a span with `fx-underline`). */
export const textLink = 'm-ul group inline-flex items-center gap-1 font-medium';
/** Non-negative modulo, so a wrapped index never goes below zero. */
export const wrap = (i: number, n: number) => ((i % n) + n) % n;
/** Hover only from a real mouse: a tap fires pointerenter too and would otherwise leave the hover stuck on. */
export const isMouse = (e: { pointerType: string }) => e.pointerType === 'mouse';
/** Focus counts as hover only when it is keyboard focus; a tap or click focuses the button as well. */
export const isFocusVisible = (el: Element) => { try { return el.matches(':focus-visible'); } catch { return true; } };
