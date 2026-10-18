import { useEffect, useRef } from 'react';
import { LiveField, ThemedArt } from '../../ui';
import CohortField, { type Hot } from './CohortField';
import { FAR_FIELD } from './heroModel';

/*
 * The Home stage, three depths back to front:
 *   far  - the generated embedding art, defocused, drifting on a 40 s loop (Web Animations, transform only)
 *   mid  - the shared LiveField with a sparse haze of cells
 *   near - CohortField: ten cohort clouds, rare cells found by the cobalt ring, method highlight from the card
 * Pointer parallax moves each depth a different distance (CSS vars, eased by a transform transition).
 * Reduced motion: no drift, no parallax, both canvases draw one still frame.
 */
const FADE_LG = '[mask-image:linear-gradient(to_right,transparent,black_18%),linear-gradient(to_bottom,black_72%,transparent)] [mask-composite:intersect]';
const FADE_BAND = '[mask-image:linear-gradient(to_bottom,transparent,black_12%,black_82%,transparent)]';
const depth = (px: number) => ({ transform: `translate3d(calc(var(--px, 0) * ${px}px), calc(var(--py, 0) * ${px}px), 0)`, transition: 'transform 900ms cubic-bezier(.16,1,.3,1)' });

function useStageMotion() {
  const stage = useRef<HTMLDivElement>(null);
  const art = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const drift = art.current?.animate(
      [{ transform: 'scale(1.06) translate3d(-1.2%, 0.6%, 0)' }, { transform: 'scale(1.1) translate3d(1.2%, -0.8%, 0)' }],
      { duration: 40000, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' },
    );
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = stage.current;
        if (!el) return;
        el.style.setProperty('--px', ((e.clientX / innerWidth) * 2 - 1).toFixed(3));
        el.style.setProperty('--py', ((e.clientY / innerHeight) * 2 - 1).toFixed(3));
      });
    };
    addEventListener('pointermove', onMove, { passive: true });
    return () => { drift?.cancel(); cancelAnimationFrame(raf); removeEventListener('pointermove', onMove); };
  }, []);
  return { stage, art };
}

function Layers({ hot, area, artBase }: { hot: Hot; area: [number, number, number, number]; artBase: string }) {
  const { stage, art } = useStageMotion();
  return (
    <div ref={stage} className="absolute inset-0">
      <div className="absolute inset-0" style={depth(-4)}>
        <div ref={art} className="absolute inset-0 opacity-[0.14] blur-[2px] dark:opacity-[0.1]">
          <ThemedArt base={artBase} size={[1600, 900]} eager alt="" className="h-full w-full object-cover" />
        </div>
      </div>
      <div className="absolute inset-0 opacity-50" style={depth(6)}>
        <LiveField layout={FAR_FIELD} seed={3} intensity={2.4} />
      </div>
      <div className="absolute inset-0" style={depth(14)}>
        <CohortField hot={hot} area={area} />
      </div>
    </div>
  );
}

/** lg and up: the stage fills the right of the hero, beside the headline and the ranking card, and stops at the container edge. */
export function HeroStageWide({ hot }: { hot: Hot }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 hidden h-[860px] lg:block xl:h-[900px]">
      <div className={`relative mx-auto h-full max-w-[1400px] ${FADE_LG}`}>
        <div className="absolute inset-y-0 left-[50%] right-0">
          <Layers hot={hot} area={[0.08, 0.07, 0.94, 0.86]} artBase="images/home-hero" />
        </div>
      </div>
    </div>
  );
}

/** Below lg: a band between the headline block and the ranking card. */
export function HeroStageBand({ hot }: { hot: Hot }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none relative -mx-4 -mt-2 h-[300px] sm:-mx-6 sm:h-[340px] lg:hidden ${FADE_BAND}`}>
      <Layers hot={hot} area={[0.08, 0.1, 0.92, 0.86]} artBase="images/home-hero-portrait" />
    </div>
  );
}
