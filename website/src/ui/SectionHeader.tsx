import { useRef, type ReactNode, type RefObject } from 'react';
import { cx } from '../lib/format';
import { ENTER_AT, armRule, claimCue, entranceState, fireCue, onEnter, releaseCue, safetyNet, sectionOf, RULE_MS } from './motion/choreo';
import { EASE_OUT, MOTION_OK, canAnimate, gsap, toEnd, useGSAP } from './motion/gsap';
import { SplitHeading, type SplitControl } from './motion/SplitHeading';

export interface SectionHeaderProps {
  title: string;
  /** Mono label: only for a source (Table 2, Figure 3, Track A), never a count. */
  eyebrow?: ReactNode;
  lede?: ReactNode;
  /** Right-aligned controls or a link ("Open the leaderboard"). */
  actions?: ReactNode;
  /** id of the heading, for aria-labelledby on the section. */
  id?: string;
  as?: 'h2' | 'h3';
  /** Title reveal through SplitHeading (default true, a whole-block rise). `false` fades the plain title with the rest. */
  split?: boolean;
  className?: string;
}

/** Seconds from the header's enter: rule and eyebrow at 0, title 0.04, lede 0.08, actions 0.1; groups follow 0.1s after the start. */
const T = { title: 0.04, lede: 0.08, actions: 0.1, groups: 0.1, rise: 10, dur: 0.38, fade: 0.3 } as const;

/**
 * Plays the section entrance once, when the header's top reaches 88% of the viewport: the top rule draws across,
 * eyebrow, title, lede and actions fade up together (each <= 0.4s, starts 40ms apart), and the section's `Reveal`
 * groups follow 0.1s after the header starts. On screen at mount or scrolled past: shown as is, nothing moves.
 */
function useSectionEntrance(root: RefObject<HTMLDivElement | null>, title: RefObject<SplitControl | null>, split: boolean) {
  useGSAP(() => {
    const el = root.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const section = sectionOf(el);
      const owns = section ? claimCue(section) : false;
      const release = () => { if (owns && section) releaseCue(section); };
      if (!canAnimate() || entranceState(el) !== 'below') {
        title.current?.finish();
        if (owns && section) fireCue(section, 0);
        return release;
      }
      const part = (name: string) => el.querySelector<HTMLElement>(`:scope [data-sh-part="${name}"]`);
      const eyebrow = part('eyebrow');
      const plainTitle = split ? null : part('title');
      const lede = part('lede');
      const actions = part('actions');
      const rises = [plainTitle, lede, actions].filter((x): x is HTMLElement => !!x);
      const rule = owns && section ? armRule(section) : null;
      if (eyebrow) gsap.set(eyebrow, { opacity: 0 });
      if (rises.length) gsap.set(rises, { opacity: 0, y: T.rise });

      let played = false;
      let cancelNet = () => {};
      const tweens: gsap.core.Animation[] = [];
      const reveal = (target: HTMLElement | null, delay: number) => {
        if (target) tweens.push(gsap.to(target, { opacity: 1, y: 0, duration: T.dur, ease: EASE_OUT, delay, clearProps: 'opacity,transform' }));
      };
      const finishAll = () => {
        title.current?.finish();
        gsap.set([eyebrow, ...rises].filter(Boolean), { clearProps: 'opacity,transform' });
        rule?.clear();
        if (owns && section) fireCue(section, 0);
      };
      /** Safety net: only ever touches this header's own tweens. */
      const forceEnd = () => { tweens.forEach(toEnd); title.current?.finish(); rule?.clear(); };
      const play = () => {
        if (played) return;
        played = true;
        if (!canAnimate()) { finishAll(); return; }
        if (rule) {
          rule.draw();
          tweens.push(gsap.delayedCall(RULE_MS / 1000 + 0.06, rule.clear));
        }
        if (eyebrow) tweens.push(gsap.to(eyebrow, { opacity: 1, duration: T.fade, ease: EASE_OUT, clearProps: 'opacity' }));
        title.current?.play(T.title);
        reveal(plainTitle, T.title);
        reveal(lede, T.lede);
        reveal(actions, T.actions);
        if (owns && section) fireCue(section, T.groups);
        cancelNet = safetyNet(Math.max(T.actions + T.dur, RULE_MS / 1000), forceEnd);
      };
      const cancelEnter = onEnter(el, play, ENTER_AT);
      return () => { cancelEnter(); cancelNet(); rule?.clear(); release(); };
    });
    return () => mm.revert();
  }, { scope: root, dependencies: [split] });
}

/** Section head: H2 clamp(26px, 2.6vw, 36px), optional eyebrow, lede and actions, one rhythm on every page. */
export function SectionHeader({ title, eyebrow, lede, actions, id, as = 'h2', split = true, className }: SectionHeaderProps) {
  const root = useRef<HTMLDivElement>(null);
  const control = useRef<SplitControl | null>(null);
  useSectionEntrance(root, control, split);
  const cls = cx(as === 'h2' ? 'section-title' : 'text-xl font-semibold tracking-[-0.015em]', 'm-0 text-balance');
  const plain = as === 'h2'
    ? <h2 id={id} className={cls} data-sh-part="title">{title}</h2>
    : <h3 id={id} className={cls} data-sh-part="title">{title}</h3>;
  return (
    <div ref={root} data-sh="" className={cx('mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="flex min-w-0 flex-col gap-3">
        {eyebrow && <p className="eyebrow m-0" data-sh-part="eyebrow">{eyebrow}</p>}
        {split ? <SplitHeading as={as} id={id} className={cls} control={control}>{title}</SplitHeading> : plain}
        {lede && <div className="m-0 max-w-[64ch] text-[15px] leading-relaxed text-ink-2" data-sh-part="lede">{lede}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2" data-sh-part="actions">{actions}</div>}
    </div>
  );
}
