import { useRef, type HTMLAttributes, type ReactNode, type RefObject } from 'react';
import { entranceState, onEnter, safetyNet, ENTER_AT } from './choreo';
import { EASE_OUT, MOTION_OK, MOTION_REDUCE, canAnimate, gsap, toEnd, useGSAP } from './gsap';

/** 'block' (default): the whole heading rises 12px and fades in, no split. 'lines' | 'words' | 'chars': mask split (SplitText, loaded on demand). */
export type SplitVariant = 'block' | 'lines' | 'words' | 'chars';

/** Handle a composed header (SectionHeader, PageHeader) uses to run the reveal inside its own sequence. */
export interface SplitControl {
  /** Start the reveal `delay` seconds from now (once). */
  play: (delay?: number) => void;
  /** Show the final state now (content scrolled past, motion paused). */
  finish: () => void;
  /** Number of pieces (1 for 'block'; lines, words or chars once split). */
  count: () => number;
  /** Seconds from play() until the last piece starts moving (0 for 'block'). */
  span: () => number;
}

/** Tags that may carry the text as `aria-label` (ARIA 1.2 prohibits naming generic p/span/div). */
const HEADINGS = new Set(['h1', 'h2', 'h3', 'h4']);

export interface SplitHeadingProps extends Omit<HTMLAttributes<HTMLHeadingElement>, 'children'> {
  /** h1-h4 keep the text as their aria-label when split. p, span and div keep an sr-only copy and split an aria-hidden twin. */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
  children: ReactNode;
  /** Above-the-fold title: shown as is at first paint (no hiding, no motion). */
  immediate?: boolean;
  /** Seconds before the reveal starts. */
  delay?: number;
  /** 'block' (default, cheapest). 'lines', 'words', 'chars' only where the split itself carries meaning. */
  variant?: SplitVariant;
  /** Seconds per piece (default: block 0.38, lines 0.45, words 0.4, chars 0.36; capped at 0.45). */
  duration?: number;
  /** Seconds between pieces (default 0.04, capped at 0.05; long texts are compressed). */
  stagger?: number;
  /** Composed headers drive the reveal through this handle instead of the heading's own trigger. */
  control?: RefObject<SplitControl | null>;
}

interface SplitSpec { type: string; mask: 'lines' | 'words' | 'chars'; duration: number; spread: number }
const SPLIT: Record<Exclude<SplitVariant, 'block'>, SplitSpec> = {
  lines: { type: 'lines', mask: 'lines', duration: 0.45, spread: 0.2 },
  words: { type: 'words', mask: 'words', duration: 0.4, spread: 0.24 },
  chars: { type: 'words,chars', mask: 'chars', duration: 0.36, spread: 0.24 },
};
const BLOCK = { duration: 0.38, y: 12 } as const;
const MAX_DURATION = 0.45;
const MAX_STAGGER = 0.05;
const DEFAULT_STAGGER = 0.04;
/** Room for descenders inside each mask. */
const DESCENDER = '0.12em';

type Phase = 'idle' | 'queued' | 'playing' | 'done';

/**
 * Heading reveal, once. Default `'block'`: one element, opacity 0 to 1 and 12px up, 0.38s, power3.out, no SplitText.
 * The text is never hidden at first paint: on screen at mount (or `immediate`) it is shown as is; scrolled past, as
 * is; below the fold it is hidden from JS and revealed when its top reaches 88% of the viewport. Explicit
 * `'lines' | 'words' | 'chars'` load SplitText on demand and mask-split the text (headings keep the full text as
 * aria-label; p, span and div split an aria-hidden twin). Reduced or paused motion: plain text, nothing moves.
 */
export function SplitHeading({ as = 'h2', children, immediate = false, delay = 0, variant = 'block', duration, stagger, control, ...rest }: SplitHeadingProps) {
  const ref = useRef<HTMLElement>(null);
  const twin = useRef<HTMLSpanElement>(null);
  const heading = HEADINGS.has(as);
  const split = variant !== 'block';
  useGSAP(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const noop: SplitControl = { play: () => undefined, finish: () => undefined, count: () => 1, span: () => 0 };
      if (immediate || !canAnimate() || entranceState(el) !== 'below') {
        if (control) control.current = noop;
        return () => { if (control) control.current = null; };
      }
      const target = twin.current ?? el;
      const dur = Math.min(MAX_DURATION, duration ?? (split ? SPLIT[variant as keyof typeof SPLIT].duration : BLOCK.duration));
      let phase: Phase = 'idle';
      let tween: gsap.core.Tween | null = null;
      let pieces: Element[] = [];
      let revert = () => {};
      let cancelNet = () => {};
      let alive = true;
      const each = () => {
        if (!split || pieces.length < 2) return 0;
        const spread = SPLIT[variant as keyof typeof SPLIT].spread;
        return Math.min(MAX_STAGGER, stagger ?? DEFAULT_STAGGER, spread / (pieces.length - 1));
      };

      // Below the fold: hide now (never painted), reveal on enter.
      gsap.set(target, split ? { opacity: 0 } : { opacity: 0, y: BLOCK.y });
      const finish = () => {
        if (phase === 'done') return;
        phase = 'done';
        if (tween) toEnd(tween);
        else gsap.set(target, { clearProps: 'opacity,transform' });
      };
      const start = () => {
        if (phase !== 'queued' || !alive) return;
        if (!canAnimate()) { finish(); return; } // paused while queued: show the final state
        phase = 'playing';
        if (!split) {
          tween = gsap.to(target, { opacity: 1, y: 0, duration: dur, ease: EASE_OUT, clearProps: 'opacity,transform', onComplete: () => { phase = 'done'; } });
          return;
        }
        tween?.play();
      };
      const prepareSplit = () => import('gsap/SplitText').then(({ SplitText }) => {
        if (!alive) return;
        gsap.registerPlugin(SplitText);
        const s = SplitText.create(target, {
          type: SPLIT[variant as keyof typeof SPLIT].type, mask: SPLIT[variant as keyof typeof SPLIT].mask,
          linesClass: 'split-line', wordsClass: 'split-word', charsClass: 'split-char',
          autoSplit: variant === 'lines', aria: twin.current ? 'none' : 'auto',
          onSplit(self) {
            self.masks.forEach((m) => { const st = (m as HTMLElement).style; st.paddingBottom = DESCENDER; st.marginBottom = `-${DESCENDER}`; });
            pieces = variant === 'lines' ? self.lines : variant === 'words' ? self.words : self.chars;
            gsap.set(target, { clearProps: 'opacity' });
            if (phase === 'done' || !canAnimate()) { tween = null; return undefined; }
            tween = gsap.fromTo(pieces, { yPercent: 100 }, {
              yPercent: 0, duration: dur, ease: EASE_OUT, stagger: each(), paused: phase !== 'playing',
              clearProps: 'transform', onComplete: () => { phase = 'done'; },
            });
            return tween;
          },
        });
        revert = () => s.revert();
      }, () => { finish(); }); // chunk failed: show the plain text
      const ready = split ? prepareSplit() : Promise.resolve();

      const play = (wait = 0) => {
        if (phase !== 'idle') return;
        if (!canAnimate()) { finish(); return; }
        phase = 'queued';
        const at = Math.max(0, wait + delay);
        cancelNet = safetyNet(at + dur + MAX_STAGGER * 4, finish);
        void ready.then(() => { gsap.delayedCall(at, start); });
      };

      let cancelEnter = () => {};
      if (control) {
        control.current = { play, finish, count: () => (split ? Math.max(1, pieces.length) : 1), span: () => each() * Math.max(0, pieces.length - 1) };
      } else {
        cancelEnter = onEnter(el, () => play(0), ENTER_AT);
      }
      return () => {
        alive = false;
        cancelEnter();
        cancelNet();
        if (control) control.current = null;
        revert();
        gsap.set(target, { clearProps: 'opacity,transform' });
      };
    });
    mm.add(MOTION_REDUCE, () => undefined);
    return () => mm.revert();
  }, { scope: ref, dependencies: [immediate, delay, variant, duration, stagger, heading] });
  // One element type for JSX typing; `as` picks the real tag at runtime.
  const Tag = as as 'h2';
  if (heading || !split) return <Tag {...rest} ref={ref as RefObject<HTMLHeadingElement>}>{children}</Tag>;
  return (
    <Tag {...rest} ref={ref as RefObject<HTMLHeadingElement>}>
      <span className="sr-only">{children}</span>
      <span ref={twin} aria-hidden="true" className={as === 'span' ? 'inline-block' : 'block'}>{children}</span>
    </Tag>
  );
}
