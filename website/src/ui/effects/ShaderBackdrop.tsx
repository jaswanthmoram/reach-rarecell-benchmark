import { Suspense, lazy, useCallback, useRef, useState, type CSSProperties } from 'react';
import { cx } from '../../lib/format';
import { useLoopGate } from '../motion/useLoopGate';
import { useMotionPaused } from '../motion/paused';
import { useMedia } from '../useMedia';

// The WebGL code is its own chunk: it loads only once the backdrop is on screen and motion is allowed.
const ShaderCanvas = lazy(() => import('./ShaderCanvas'));
/** Below this width (phones) the backdrop is the static CSS field only. */
const WIDE = '(min-width: 768px)';

/** Which soft hints drift through the graphite field. Vermilion stays a trace: it is the rare-cell signal. */
export type ShaderPalette = 'graphite' | 'cobalt' | 'lab';

const HINTS: Record<ShaderPalette, [number, number]> = {
  graphite: [0, 0],
  cobalt: [1, 0],
  lab: [1, 0.6],
};

export interface ShaderBackdropProps {
  /** 0..1, default 0.3. AA budget (design/DESIGN-r9.md): <= 0.25 behind ink-3 small text, <= 0.35 behind ink-2. */
  intensity?: number;
  palette?: ShaderPalette;
  /** Fade the band into the canvas at an edge (mask-image). */
  fade?: 'none' | 'top' | 'bottom' | 'both';
  /** Dot pitch in CSS px (default 14, the dot-field grid). */
  dot?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * A quiet drifting dot-grain field behind a band of content:
 * `<section className="relative isolate"><ShaderBackdrop intensity={0.25} fade="top" className="absolute inset-0 -z-10" />...</section>`.
 * Static CSS fallback on phones (< 768px), under reduced motion, Pause motion, no WebGL, or before the chunk arrives;
 * the loop runs at most 30fps, only on screen with the tab visible. Decorative (aria-hidden, no pointer events).
 */
export function ShaderBackdrop({ intensity = 0.3, palette = 'lab', fade = 'none', dot = 14, className, style }: ShaderBackdropProps) {
  const ref = useRef<HTMLDivElement>(null);
  const gate = useLoopGate(ref, { rootMargin: '120px' });
  const paused = useMotionPaused();
  const reduced = useMedia('(prefers-reduced-motion: reduce)');
  const wide = useMedia(WIDE);
  const [wanted, setWanted] = useState(false);
  const [status, setStatus] = useState<'idle' | 'ready' | 'failed'>('idle');
  const running = gate.running && wide; // phones keep the static CSS field: no WebGL, no chunk
  if (running && !wanted) setWanted(true); // first time on screen with motion allowed: fetch the chunk
  const onReady = useCallback(() => setStatus('ready'), []);
  const onFail = useCallback(() => setStatus('failed'), []);
  const live = status === 'ready' && !paused && !reduced && wide;
  const level = Math.min(1, Math.max(0, intensity));

  return (
    <div ref={ref} aria-hidden="true" data-fade={fade} data-live={live || undefined}
      className={cx('fx-shader', className)} style={{ ...style, ['--fx-intensity' as string]: level, ['--fx-dot' as string]: `${dot}px` }}>
      <div className={cx('fx-shader-fallback', palette !== 'graphite' && 'fx-shader-fallback--tint')} />
      {wanted && status !== 'failed' && (
        <Suspense fallback={null}>
          <ShaderCanvas running={running} intensity={level} hints={HINTS[palette]} dot={dot} onReady={onReady} onFail={onFail} />
        </Suspense>
      )}
    </div>
  );
}
