import { useRef, type ReactNode, type RefObject } from 'react';
import { cx } from '../lib/format';
import { ENTER_AT, entranceState, onEnter, safetyNet } from './motion/choreo';
import { EASE_OUT, MOTION_OK, canAnimate, gsap, toEnd, useGSAP } from './motion/gsap';
import { SplitHeading, type SplitControl } from './motion/SplitHeading';

export interface PageHeaderProps {
  /** Short mono label above the title. Only when it carries a source (audit S-13); never a counter. */
  eyebrow?: ReactNode;
  /** Plain text title (it is line-split for the reveal). */
  title: string;
  /** One or two sentences under the title. */
  lede?: ReactNode;
  /** Buttons or links under the lede. */
  actions?: ReactNode;
  /** Right-hand art (hero image, live card). Stacks under the text below 1024px. */
  art?: ReactNode;
  /** Extra content under the actions (chips, meta line). */
  children?: ReactNode;
  className?: string;
}

/** Seconds (below-the-fold headers only): eyebrow, title, lede, actions and art start within 0.12s, each <= 0.4s. */
const T = { title: 0.04, lede: 0.08, actions: 0.1, art: 0.06, rise: 12, dur: 0.38, fade: 0.3 } as const;

function usePageEntrance(root: RefObject<HTMLElement | null>, title: RefObject<SplitControl | null>) {
  useGSAP(() => {
    const el = root.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      // On screen at mount (every normal page load) or scrolled past: the hero is painted as is, nothing hides.
      if (!canAnimate() || entranceState(el) !== 'below') { title.current?.finish(); return; }
      const part = (name: string) => el.querySelector<HTMLElement>(`[data-ph-part="${name}"]`);
      const eyebrow = part('eyebrow');
      const lede = part('lede');
      const actions = part('actions');
      const art = part('art');
      if (eyebrow) gsap.set(eyebrow, { opacity: 0 });
      const rises = [lede, actions].filter((x): x is HTMLElement => !!x);
      if (rises.length) gsap.set(rises, { opacity: 0, y: T.rise });
      if (art) gsap.set(art, { opacity: 0 });

      let played = false;
      let cancelNet = () => {};
      const tweens: gsap.core.Animation[] = [];
      /** Safety net: only ever touches this header's own tweens. */
      const forceEnd = () => { tweens.forEach(toEnd); title.current?.finish(); };
      const rise = (target: HTMLElement | null, delay: number) => {
        if (target) tweens.push(gsap.to(target, { opacity: 1, y: 0, duration: T.dur, ease: EASE_OUT, delay, clearProps: 'opacity,transform' }));
      };
      const play = () => {
        if (played) return;
        played = true;
        if (eyebrow) tweens.push(gsap.to(eyebrow, { opacity: 1, duration: T.fade, ease: EASE_OUT, clearProps: 'opacity' }));
        title.current?.play(T.title);
        rise(lede, T.lede);
        rise(actions, T.actions);
        if (art) tweens.push(gsap.to(art, { opacity: 1, duration: T.dur, ease: EASE_OUT, delay: T.art, clearProps: 'opacity' }));
        cancelNet = safetyNet(T.actions + T.dur, forceEnd);
      };
      const cancelEnter = onEnter(el, play, ENTER_AT);
      return () => { cancelEnter(); cancelNet(); };
    });
    return () => mm.revert();
  }, { scope: root });
}

/**
 * The one interior-page hero: eyebrow, H1 (clamp(36px, 4.2vw, 56px), tracking -0.03em), lede, actions, optional art.
 * The hero is painted as is at first paint (the route View Transition carries the page change); only a header that
 * mounts below the fold fades up (<= 0.4s). On desktop the art drifts up 6% as the header leaves (CSS scroll-driven animation on the compositor; no
 * ScrollTrigger; browsers without scroll timelines simply keep it still). The H1 carries
 * `view-transition-name: page-title`, so it morphs between pages: use one PageHeader per page. Home keeps its own hero.
 */
export function PageHeader({ eyebrow, title, lede, actions, art, children, className }: PageHeaderProps) {
  const root = useRef<HTMLElement>(null);
  const control = useRef<SplitControl | null>(null);
  usePageEntrance(root, control);
  return (
    <header ref={root} className={cx('ph-view mx-auto w-full max-w-[1240px] px-4 pb-10 pt-12 sm:px-6 lg:pb-14 lg:pt-16', className)}>
      <div className={cx('grid items-center gap-10', art ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] lg:gap-14' : false)}>
        <div className="flex min-w-0 flex-col items-start gap-5">
          {eyebrow && <p className="eyebrow m-0" data-ph-part="eyebrow">{eyebrow}</p>}
          <SplitHeading as="h1" control={control} className="page-title m-0 max-w-[18ch] text-balance">{title}</SplitHeading>
          {lede && <div className="m-0 max-w-[60ch] text-[17px] leading-relaxed text-ink-2" data-ph-part="lede">{lede}</div>}
          {actions && <div className="flex flex-wrap items-center gap-2.5" data-ph-part="actions">{actions}</div>}
          {children}
        </div>
        {art && (
          <div className="min-w-0" data-ph-part="art">
            <div data-ph-part="parallax" className="ph-parallax">{art}</div>
          </div>
        )}
      </div>
    </header>
  );
}
