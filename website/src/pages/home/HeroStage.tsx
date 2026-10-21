import { asset, cx } from '../../lib/format';
import { useLoopGate } from '../../ui/motion';
import { HeroCards } from './HeroCards';
import { HeroLegend } from './HeroLegend';
import { HERO_ART } from './heroArt';

/**
 * Desktop hero stage (>= 1024px), in two layers that share one box (`.hm-stage-box`) so the full-width HeroField
 * canvas can run between them: the artwork underneath (no frame, faded into the page at its edges, a slight pointer
 * parallax through `--hx`/`--hy` set on an ancestor), and the callouts on top (three cards pinned to the art's
 * features by leader lines, plus the colour key). Two boxes, because each size container is its own stacking context.
 */
export function HeroArt({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cx('hm-stage-box hm-stage-in overflow-hidden', className)}>
      <div className="hm-artbox hm-bg-fade">
        <img src={asset(HERO_ART.wide.src)} alt="" width={HERO_ART.wide.width} height={HERO_ART.wide.height}
          fetchPriority="high" decoding="async" className="hm-bg-art absolute inset-0 size-full" />
      </div>
    </div>
  );
}

export function HeroCallouts({ className }: { className?: string }) {
  const { ref, running, loopProps } = useLoopGate<HTMLDivElement>();
  return (
    <div ref={ref} {...loopProps} className={cx('hm-stage-box pointer-events-none', className)}>
      <div className="hm-artbox"><HeroCards running={running} /></div>
      <HeroLegend className="rise pointer-events-auto absolute right-[var(--edge)] top-3 w-[220px] [animation-delay:480ms]" />
    </div>
  );
}

/**
 * Phone and tablet (< 1024px): the portrait artwork as a faded background behind the top-right of the hero, masked
 * so the text over it keeps AA contrast. No cards here. Decorative.
 */
export function HeroBackdrop({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cx('hm-backdrop pointer-events-none', className)}>
      <img src={asset(HERO_ART.portrait.src)} alt="" width={HERO_ART.portrait.width} height={HERO_ART.portrait.height}
        fetchPriority="high" decoding="async" className="size-full object-cover" />
    </div>
  );
}
