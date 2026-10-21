import { useEffect, useRef, type ReactNode } from 'react';
import { cx } from '../../lib/format';
import { useScrollySteps } from './useScrolly';

export interface ScrollyProps {
  /** The sticky visual. Receives the active step index. */
  graphic: (active: number) => ReactNode;
  /** The narration steps (text blocks). */
  steps: ReactNode[];
  /** Optional per-step visual shown inline under 1024px, where nothing pins. */
  mobileGraphic?: (step: number) => ReactNode;
  /** Put the graphic on the right (default) or left. */
  side?: 'left' | 'right';
  onStepChange?: (step: number) => void;
  className?: string;
}

/**
 * Sticky scrollytelling (no scroll-jacking): at >= 1024px the graphic sticks under the header while the steps
 * scroll past it; the step crossing mid-screen is active. Under 1024px nothing pins: steps stack, each with its
 * own `mobileGraphic` if given.
 */
export function Scrolly({ graphic, steps, mobileGraphic, side = 'right', onStepChange, className }: ScrollyProps) {
  const { active, stepRef } = useScrollySteps(steps.length);
  const report = useRef(onStepChange);
  useEffect(() => { report.current = onStepChange; });
  useEffect(() => { report.current?.(active); }, [active]);
  return (
    <div className={cx('grid gap-8 lg:grid-cols-2 lg:gap-14', className)}>
      <div className={cx('scrolly-pin hidden lg:block', side === 'left' ? 'lg:order-first' : 'lg:order-last')}>{graphic(active)}</div>
      <ol className="m-0 flex list-none flex-col gap-6 p-0 lg:gap-0">
        {steps.map((s, i) => (
          <li key={i} ref={stepRef(i)} data-active={i === active || undefined} className="scrolly-step">
            <div className="scrolly-step-body">{s}</div>
            {mobileGraphic && <div className="mt-4 lg:hidden">{mobileGraphic(i)}</div>}
          </li>
        ))}
      </ol>
    </div>
  );
}

