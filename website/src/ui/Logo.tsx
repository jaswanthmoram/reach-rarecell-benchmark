import { href } from '../app/router';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

/*
 * The REACH mark: a plate of graphite cells (a 4×4 well grid) with one signal cell, found by an open cobalt
 * reticle. Cells fade with distance from the found cell, so the eye lands on it first. Below 28px the grid
 * drops to 3×3 so every cell stays at least one device pixel apart.
 * Rules (System page): signal = the found cell only; never recolour, rotate, outline or box the mark.
 */
type Cell = { x: number; y: number; d: number };
const FULL = { pitch: 8, start: 4, n: 4, signal: [2, 2], r: 2.1, sr: 2.6, ring: 4.75, stroke: 1.3 } as const;
const COMPACT = { pitch: 10, start: 6, n: 3, signal: [2, 2], r: 2.8, sr: 3.2, ring: 5.2, stroke: 1.7 } as const;

function cells(g: typeof FULL | typeof COMPACT): Cell[] {
  const out: Cell[] = [];
  for (let row = 0; row < g.n; row++) {
    for (let col = 0; col < g.n; col++) {
      if (col === g.signal[0] && row === g.signal[1]) continue;
      out.push({ x: g.start + col * g.pitch, y: g.start + row * g.pitch, d: Math.hypot(col - g.signal[0], row - g.signal[1]) });
    }
  }
  return out;
}
const tone = (d: number) => (d < 1.5 ? 1 : d < 2.5 ? 0.66 : 0.42);

/** Open reticle: a circle with a 56° gap toward the upper right ("reach"). */
function arc(cx0: number, cy0: number, r: number) {
  const a0 = (-28 * Math.PI) / 180; // gap from -28° to -84° (screen coords, y down)
  const a1 = (-84 * Math.PI) / 180;
  const p = (a: number) => `${(cx0 + r * Math.cos(a)).toFixed(3)} ${(cy0 + r * Math.sin(a)).toFixed(3)}`;
  return `M ${p(a0)} A ${r} ${r} 0 1 1 ${p(a1)}`;
}

export interface MarkProps {
  size?: number;
  /** false: an empty field (nothing found). Used by empty and not-found states. */
  found?: boolean;
  /** Loader motion: cells pulse in sequence, then the signal cell is found. */
  animated?: boolean;
  /** Force the grid density; defaults to compact below 28px. */
  variant?: 'full' | 'compact';
  title?: string;
  className?: string;
}

export function Mark({ size = 24, found = true, animated = false, variant, title, className }: MarkProps) {
  const g = (variant ?? (size < 28 ? 'compact' : 'full')) === 'full' ? FULL : COMPACT;
  const sx = g.start + g.signal[0] * g.pitch;
  const sy = g.start + g.signal[1] * g.pitch;
  const list = cells(g);
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={cx('shrink-0', className)} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {list.map((c) => (
        <circle key={`${c.x}-${c.y}`} cx={c.x} cy={c.y} r={g.r} className={cx('fill-ink-2', animated && 'loader-cell')}
          style={{ opacity: found ? tone(c.d) : 0.5, ...(animated ? { animationDelay: `${(c.x + c.y) * 10}ms` } : {}) }} />
      ))}
      {found ? (
        <>
          <circle cx={sx} cy={sy} r={g.sr} className={cx('fill-signal', animated && 'loader-signal')} />
          <path d={arc(sx, sy, g.ring)} fill="none" strokeWidth={g.stroke} strokeLinecap="round" className={cx('stroke-accent', animated && 'loader-ring')} />
        </>
      ) : (
        <circle cx={sx} cy={sy} r={g.ring} fill="none" strokeWidth={g.stroke * 0.8} strokeDasharray="1.6 2.2" className="stroke-line-strong" />
      )}
    </svg>
  );
}

/** "REACH" in Geist 600 with the found cell set inside the C's counter: the mark's idea, at type size. */
export function Wordmark({ size = 17, className }: { size?: number; className?: string }) {
  return (
    <span className={cx('inline-flex items-baseline font-semibold leading-none text-ink', className)}
      style={{ fontSize: size, letterSpacing: '0.012em', fontFeatureSettings: '"ss01" 0' }}>
      REA
      <span className="relative inline-block">
        C
        <span aria-hidden="true" className="absolute rounded-full bg-signal"
          style={{ width: '0.2em', height: '0.2em', left: '0.33em', top: '50%', transform: 'translateY(-50%)' }} />
      </span>
      H
    </span>
  );
}

export interface LockupProps {
  /** Mark size in px; the wordmark scales with it. */
  size?: number;
  descriptor?: boolean;
  /** Render as a home link (nav, footer). */
  link?: boolean;
  className?: string;
}

/** Horizontal lockup: mark + wordmark + a mono "benchmark" descriptor after a hairline. */
export function Lockup({ size = 22, descriptor = true, link, className }: LockupProps) {
  const inner = (
    <>
      <Mark size={size} />
      <Wordmark size={Math.round(size * 0.78)} />
      {descriptor && (
        <span className="flex items-center gap-2 self-center" aria-hidden="true">
          <span className="h-3 w-px bg-line-strong" />
          <span className="font-mono uppercase text-ink-3" style={{ fontSize: Math.max(10, Math.round(size * 0.48)), letterSpacing: '0.1em' }}>benchmark</span>
        </span>
      )}
    </>
  );
  const cls = cx('inline-flex shrink-0 items-center', className);
  const style = { gap: Math.round(size * 0.42) };
  if (link) {
    return <a href={href('/')} className={cx(cls, 'rounded-chip')} style={style} aria-label="REACH Benchmark, home">{inner}</a>;
  }
  return <span className={cls} style={style} role="img" aria-label="REACH Benchmark">{inner}</span>;
}
