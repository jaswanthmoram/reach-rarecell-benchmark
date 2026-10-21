import { useEffect, useState, type ReactNode } from 'react';
import { useLoopGate } from '../../ui/motion/useLoopGate';
import { CLOUDS, FAR, RARE } from './fieldGeometry';
import { RARE_TOTAL, type RankRow } from './model';

const range = (n: number, step: number) => Array.from({ length: Math.floor(n / step) }, (_, i) => i * step);
const VIEW_W = 640;
const VIEW_H = 520;
const VIEWBOX = `0 0 ${VIEW_W} ${VIEW_H}`;
const FAR_IDX = range(FAR.length, 3);
const RARE_IDX = range(RARE.length, 4);
/** Clouds that share a drift timing share one layer, so each timing is a single composited transform. */
const SWAYS = [...new Set(CLOUDS.map((c) => c.sway))].sort((a, b) => a - b);
/** The cobalt finder steps to the next rare cell this often (one ring at a time). */
const FINDER_STEP_MS = 1600;
/** Visit order: the same permutation the old staggered rings used (cell n was ringed at slot (7n mod total)). */
const FINDER_ORDER = Array.from({ length: RARE_TOTAL }, (_, s) => (s * 13) % RARE_TOTAL);
const FINDER_DIAMETER = `${(18 / VIEW_W) * 100}%`;

const pct = (v: number, of: number) => `${(v / of) * 100}%`;
const SVG_LAYER = 'absolute inset-0 block h-full w-full';

interface LiveFieldProps {
  hot: RankRow | null;
  className?: string;
}

/** Static SVG drawn once; the wrapping div carries the motion (transform/opacity only, so it runs off the main thread). */
function Layer({ className, children }: { className: string; children: ReactNode }) {
  return (
    <div aria-hidden="true" className={`absolute inset-0 ${className}`}>
      <svg viewBox={VIEWBOX} className={SVG_LAYER}>{children}</svg>
    </div>
  );
}

/**
 * One cobalt ring that visits the rare cells in turn: a timer moves it every 1.6 s and a one-shot CSS animation
 * (transform and opacity on an HTML element) draws it in. Only this component re-renders on a step.
 */
function Finder({ running }: { running: boolean }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setStep((s) => (s + 1) % RARE_TOTAL), FINDER_STEP_MS);
    return () => window.clearInterval(id);
  }, [running]);
  const i = FINDER_ORDER[step] * 4;
  return (
    <span aria-hidden="true" className="hm-finder-pos absolute block aspect-square"
      style={{ left: pct(RARE[i], VIEW_W), top: pct(RARE[i + 1], VIEW_H), width: FINDER_DIAMETER }}>
      <span key={step} className="hm-finder block size-full rounded-full border-solid border-accent" />
    </span>
  );
}

/**
 * The hero field: ten cohort clouds sized by cell count, three vermilion rare cells in each.
 * Idle, a cobalt finder rings the cells in turn; with a method highlighted, the cells it recovers are ringed in its colour.
 * Motion budget: 6 composited layers (haze, four cloud timings, rare-cell breathe) and one finder ring; no per-cell loops.
 */
export function LiveField({ hot, className }: LiveFieldProps) {
  // The footer "Pause motion" switch holds the field on its current frame (WCAG 2.2.2), as does scrolling it away.
  const { ref, running, loopProps } = useLoopGate<HTMLDivElement>();
  return (
    <div ref={ref} {...loopProps} className={`hm-field loop relative max-w-full ${className ?? ''}`}>
      <Layer className="hm-far">
        <g fill="var(--cell)" opacity={0.35}>
          {FAR_IDX.map((i) => <circle key={i} cx={FAR[i]} cy={FAR[i + 1]} r={FAR[i + 2]} />)}
        </g>
      </Layer>
      <div aria-hidden="true" className="absolute inset-0" style={{ opacity: hot ? 0.45 : 1, transition: 'opacity 250ms' }}>
        {SWAYS.map((s) => (
          <Layer key={s} className={`hm-cloud hm-cloud-${s}`}>
            <g fill="var(--cell)">
              {CLOUDS.filter((c) => c.sway === s).map((c, k) => (
                <g key={k}>
                  {range(c.pts.length, 4).map((i) => <circle key={i} cx={c.pts[i]} cy={c.pts[i + 1]} r={c.pts[i + 2]} opacity={c.pts[i + 3]} />)}
                </g>
              ))}
            </g>
          </Layer>
        ))}
      </div>
      <div className={`relative ${hot ? '' : 'hm-breathe'}`}>
        <svg viewBox={VIEWBOX} aria-hidden="true" className="block h-auto w-full">
          {RARE_IDX.map((i) => {
            const [x, y, k, j] = [RARE[i], RARE[i + 1], RARE[i + 2], RARE[i + 3]];
            const f = hot ? hot.found[k] : null;
            const ringed = f != null && j < f;
            // With a method highlighted: unscored cohorts (no Track A row) fade further than cells it misses.
            const dim = !hot || ringed ? 1 : f == null ? 0.15 : 0.35;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r={2.6} fill="var(--signal)" opacity={dim} style={{ transition: 'opacity 200ms' }} />
                <circle cx={x} cy={y} r={7} fill="none" strokeWidth={1.4} opacity={ringed ? 1 : 0}
                  style={{ stroke: hot ? hot.color : 'var(--accent)', strokeDasharray: hot?.isRef ? '2.5 2.5' : 'none', transition: 'opacity 200ms' }} />
              </g>
            );
          })}
        </svg>
      </div>
      {!hot && <Finder running={running} />}
    </div>
  );
}
