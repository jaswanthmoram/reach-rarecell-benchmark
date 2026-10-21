// Shared motion kit (GSAP 3.15 + ScrollTrigger; SplitText and DrawSVG on demand). Native scrolling. API: ./README.md
export { Reveal, type RevealProps } from './Reveal';
export { useReveal, type RevealOptions, type RevealVariant } from './useReveal';
export { SplitHeading, type SplitControl, type SplitHeadingProps, type SplitVariant } from './SplitHeading';
export { CountUp, type CountUpProps } from './CountUp';
export { DrawPath, type DrawPathProps } from './DrawPath';
export { useDrawIn, useDrawSvg, type DrawInOptions, type DrawInStep, type DrawOptions } from './useDrawSvg';
export { Scrolly, type ScrollyProps } from './Scrolly';
export { useScrollProgress, useScrollySteps, type ScrollProgressOptions } from './useScrolly';
export { SmoothScroll } from './SmoothScroll';
export { isMotionPaused, motionAllowed, reducedMotion, setMotionPaused, useMotionPaused } from './paused';
// GSAP-free hooks (each file imports only React and paused.ts; import the file directly to keep GSAP out of a chunk).
export { useGlide } from './useGlide';
export { useInView, type InViewOptions } from './useInView';
export { useLoopGate, type LoopGate, type LoopGateOptions } from './useLoopGate';
export { DUR, EASE, EASE_OUT, MOTION_OK, MOTION_REDUCE, ScrollTrigger, canAnimate, gsap, toEnd, useGSAP } from './gsap';
export { ENTER_AT, entranceState, onEnter, whenCued, type EntranceState } from './choreo';
export { LoopHost, type LoopHostProps } from './LoopHost';
