import { useCallback, useEffect, type MouseEvent } from 'react';
import { scrollToId, setFragment } from '../lib/router';
import { cx } from '../lib/format';
import { reducedMotion } from './motion/paused';
import { useScrollSpy } from './useScrollSpy';
import { useSlidingPill } from './useSlidingPill';

export interface SectionNavItem { id: string; label: string }
export interface SectionNavProps {
  items: SectionNavItem[];
  /** Accessible name, e.g. "Leaderboard sections". */
  label: string;
  className?: string;
}

/** Height of the strip; also published as --section-nav-h so scroll targets clear it. */
const NAV_H = 44;
/** Spy band: from just under the header (and this bar) to 45% down the viewport. */
const SPY = { top: 120, bottomPct: 55 } as const;

/** Centre the active item in the strip when the strip overflows (phones). */
const keepInView = (box: { x: number; w: number }, c: HTMLElement, fits: boolean, clientWidth: number) => {
  if (fits) return;
  c.scrollTo({ left: box.x - (clientWidth - box.w) / 2, behavior: reducedMotion() ? 'auto' : 'smooth' });
};

/**
 * One sticky in-page section bar (audit S-1): sits under the header, scroll-spies the sections with
 * IntersectionObserver, slides one pill to the active item, scrolls horizontally on phones. Buttons call
 * scrollToId and record the section in the URL fragment (replaceState); `/page/#id` lands on it. Use one per page, on long pages only. Tabs that switch a view are not this.
 */
export function SectionNav({ items, label, className }: SectionNavProps) {
  const { active, jumpTo } = useScrollSpy(items.map((i) => i.id), SPY);
  // Keep the active item visible in the phone strip, from the pill's cached boxes (no layout read here).
  const { containerRef, pillRef } = useSlidingPill<HTMLDivElement>(active, { onPlace: keepInView });

  useEffect(() => {
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty('--section-nav-h', `${NAV_H}px`);
    return () => { rootStyle.removeProperty('--section-nav-h'); };
  }, []);

  const go = useCallback((id: string, e: MouseEvent<HTMLButtonElement>) => {
    jumpTo(id);
    setFragment(id); // the address names the section, so a copied URL opens on it (no history entry)
    scrollToId(id);
    // A pointer click (detail > 0) must not leave focus on the pill: the next key press (Space, arrows to scroll)
    // would turn it into a :focus-visible ring. Keyboard activation (detail 0) keeps focus where it is.
    if (e.detail > 0) e.currentTarget.blur();
  }, [jumpTo]);

  return (
    <nav aria-label={label} className={cx('section-nav', className)}>
      <div ref={containerRef} className="section-nav-track relative mx-auto flex max-w-[1240px] items-center gap-1 overflow-x-auto px-4 sm:px-6">
        <span ref={pillRef} aria-hidden="true" className="slide-pill" />
        {items.map((it) => (
          <button key={it.id} type="button" data-pill-key={it.id} aria-current={active === it.id ? 'true' : undefined} onClick={(e) => go(it.id, e)}
            className={cx('relative z-[1] inline-flex min-h-8 shrink-0 items-center whitespace-nowrap rounded-full px-3 text-[13px] transition-colors duration-[var(--dur-1)]',
              active === it.id ? 'font-medium text-ink' : 'text-ink-2 hover:text-ink')}>{it.label}</button>
        ))}
      </div>
    </nav>
  );
}
