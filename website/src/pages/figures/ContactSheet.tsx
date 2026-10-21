import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { cx } from '../../lib/format';
import { useLoopGate } from '../../ui/motion/useLoopGate';
import { FIGURES } from './catalog';
import { FIELD, FIELD_SIGNALS, MINIS, type Dot } from './heroData';

/** The sheet steps to the next figure every 3.6 s, unless a tile is hovered with a mouse or focused, or the viewer is open. */
const CYCLE_MS = 3600;
const DOT_FILL = ['var(--ink-2)', 'var(--signal)', 'var(--accent)'] as const;
/** Every field layer shares one box, wider than the hero by the drift amplitude, so the SVG slice maps alike. */
const FIELD_BOX = 'absolute inset-y-0 -left-[32px] -right-[32px]';
const FIELD_A = FIELD.filter((_, i) => i % 2 === 0);
const FIELD_B = FIELD.filter((_, i) => i % 2 === 1);

type DotStyle = CSSProperties & { '--dx': string; '--dy': string };
const dotStyle = (d: Dot): DotStyle => ({ '--dx': `${d[4]}px`, '--dy': `${d[5]}px`, animationDelay: `${d[6]}ms` });

/** A static SVG in the shared box; the wrapping div carries the motion (transform/opacity, off the main thread). */
function FieldLayer({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cx(FIELD_BOX, className)}>
      <svg viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid slice" className="block h-full w-full">{children}</svg>
    </div>
  );
}

const dots = (pts: typeof FIELD) => pts.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />);

/**
 * Far field behind the hero: drifting cells, two signal cells and one "found" reticle. The 160 cells sit in two
 * layers that drift against each other (two composited transforms, not 160 loops), gated by useLoopGate: held
 * off-screen, in a hidden tab, under reduced motion and under "Pause motion".
 */
export function Field() {
  const { ref, loopProps } = useLoopGate<HTMLDivElement>();
  return (
    <div ref={ref} {...loopProps} aria-hidden="true" className="loop pointer-events-none absolute inset-0">
      <FieldLayer className="fig-drift-a"><g opacity="0.55" fill="var(--cell)">{dots(FIELD_A)}</g></FieldLayer>
      <FieldLayer className="fig-drift-b"><g opacity="0.55" fill="var(--cell)">{dots(FIELD_B)}</g></FieldLayer>
      <FieldLayer>
        <circle cx={FIELD_SIGNALS[0][0]} cy={FIELD_SIGNALS[0][1]} r="3" fill="var(--signal)" />
        <circle cx={FIELD_SIGNALS[1][0]} cy={FIELD_SIGNALS[1][1]} r="3" fill="var(--signal)" />
      </FieldLayer>
      <FieldLayer className="fig-ring">
        <circle cx={FIELD_SIGNALS[0][0]} cy={FIELD_SIGNALS[0][1]} r="9" fill="none" stroke="var(--accent)" strokeWidth="1" />
      </FieldLayer>
    </div>
  );
}

/**
 * One figure drawn as a mini of cells. When the cycle turns a tile on, the whole mini settles in (one compositor
 * transform); when a visitor points at or focuses a tile, its dots assemble one by one.
 */
function Mini({ k }: { k: number }) {
  const { guides, dots } = MINIS[k];
  return (
    <span aria-hidden="true" className="fig-mini absolute inset-0 block">
      <svg viewBox="0 0 160 120" className="block h-full w-full">
        {guides.map(([x1, y1, x2, y2, dashed], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={dashed ? 'var(--accent)' : 'var(--line-strong)'} strokeWidth="1" strokeDasharray={dashed ? '3 3' : undefined} />
        ))}
        {dots.map((d, i) => <circle key={i} className="fig-d" cx={d[0]} cy={d[1]} r={d[2]} fill={DOT_FILL[d[3]]} style={dotStyle(d)} />)}
      </svg>
    </span>
  );
}

/** One timer for the highlighted tile; it only runs while the sheet is on screen, the tab is visible and motion is allowed. */
function useCycle(held: number | null, paused: boolean) {
  const [active, setActive] = useState(0);
  const { ref, running } = useLoopGate<HTMLDivElement>(undefined, { rootMargin: '0px' });

  useEffect(() => {
    if (paused || held !== null || !running) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % FIGURES.length), CYCLE_MS);
    return () => window.clearInterval(id);
  }, [paused, held, running]);

  return { ref, shown: held ?? active };
}

/**
 * Hero art: the six figures as minis on one contact sheet. It steps through them every 3.6 s (stopped while a tile
 * is hovered with a mouse or focused (a touch tap must not freeze the cycle), while the viewer is open, under reduced motion and under "Pause motion"). A tile jumps to
 * its figure card below.
 */
export function ContactSheet({ onPick, paused }: { onPick: (k: number) => void; paused: boolean }) {
  const [held, setHeld] = useState<number | null>(null);
  const { ref, shown } = useCycle(held, paused);
  const release = () => setHeld(null);
  return (
    <div ref={ref} className="overflow-hidden rounded-card border border-line bg-surface/90 shadow-[0_1px_2px_rgb(14_17_22/0.04),0_8px_24px_-12px_rgb(14_17_22/0.12)]">
      <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
        <p className="m-0 min-w-0 truncate text-sm" aria-live="off">
          <span className="mr-2 font-mono text-xs tabular-nums text-ink-2">Figure {shown + 1} / {FIGURES.length}</span>
          {FIGURES[shown].title}
        </p>
        <span aria-hidden="true" className="flex shrink-0 gap-1">
          {FIGURES.map((f, k) => (
            <span key={f.n} className={cx('fig-tick block h-1 w-4 rounded-full', k === shown ? 'bg-accent' : k < shown ? 'bg-cell' : 'bg-line')} />
          ))}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-px bg-line">
        {FIGURES.map((f, k) => (
          <button
            key={f.n}
            type="button"
            className={cx('fig-tile relative block aspect-[4/3] w-full cursor-pointer border-0 bg-surface p-0', k === shown && 'on', k === held && 'held')}
            aria-label={`Go to Figure ${f.n}: ${f.title}`}
            onClick={() => onPick(k)}
            onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHeld(k); }}
            onPointerLeave={(e) => { if (e.pointerType === 'mouse') release(); }}
            onFocus={() => setHeld(k)}
            onBlur={release}
          >
            <Mini k={k} />
            <span className="fig-fl absolute bottom-1.5 left-2 font-mono text-[11px] text-ink-3">Fig. {f.n}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
