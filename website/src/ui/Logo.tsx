import { href } from '../app/router';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

/*
 * The REACH mark: a 3×3 plate of graphite cells with the signal cell at its centre, found by an open cobalt
 * reticle (gap toward the upper right: "reach"). Edge cells sit closer to the found cell, so they read darker
 * than the corners and the eye lands in the middle. One geometry at every size, legible from 16px.
 * Rules (System page): signal = the found cell only; never recolour, rotate, outline or box the mark.
 */
type Cell = { x: number; y: number; d: number };
const G = { pitch: 12, start: 4, r: 2.3, sr: 3.1, ring: 6.6, stroke: 1.6 } as const;
const CENTRE = G.start + G.pitch;
const CELLS: Cell[] = [0, 1, 2].flatMap((row) => [0, 1, 2]
  .filter((col) => !(row === 1 && col === 1))
  .map((col) => ({ x: G.start + col * G.pitch, y: G.start + row * G.pitch, d: Math.hypot(col - 1, row - 1) })));
const tone = (d: number) => (d < 1.2 ? 0.78 : 0.42);

/** Open reticle: a circle with a 60° gap toward the upper right. */
function arc(cx0: number, cy0: number, r: number) {
  const a0 = (-20 * Math.PI) / 180; // gap from -20° to -80° (screen coords, y down)
  const a1 = (-80 * Math.PI) / 180;
  const p = (a: number) => `${(cx0 + r * Math.cos(a)).toFixed(3)} ${(cy0 + r * Math.sin(a)).toFixed(3)}`;
  return `M ${p(a0)} A ${r} ${r} 0 1 1 ${p(a1)}`;
}
const MARK_RETICLE = arc(CENTRE, CENTRE, G.ring);

export interface MarkProps {
  size?: number;
  /** false: an empty field (nothing found). Used by empty and not-found states. */
  found?: boolean;
  /** Loader motion: cells pulse in sequence, then the signal cell is found. */
  animated?: boolean;
  /** Brand motion for the header: the ring re-finds the signal cell every few seconds and tightens on hover. */
  live?: boolean;
  /** Kept for older call sites; the mark now has one geometry at every size. */
  variant?: 'full' | 'compact';
  title?: string;
  className?: string;
}

export function Mark({ size = 24, found = true, animated = false, live = false, title, className }: MarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={cx('shrink-0 overflow-visible', className)} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {CELLS.map((c) => (
        <circle key={`${c.x}-${c.y}`} cx={c.x} cy={c.y} r={G.r} className={cx('fill-ink-2', animated && 'loader-cell', live && 'mark-cell')}
          style={{ opacity: found ? tone(c.d) : 0.5, ...(animated || live ? { animationDelay: `${Math.round(c.d * 90)}ms` } : {}) }} />
      ))}
      {found ? (
        <>
          <circle cx={CENTRE} cy={CENTRE} r={G.sr} className={cx('fill-signal', animated && 'loader-signal', live && 'mark-signal')} />
          <g className={live ? 'mark-ring-hover' : undefined}>
            <path d={MARK_RETICLE} fill="none" strokeWidth={G.stroke} strokeLinecap="round" className={cx('stroke-accent', animated && 'loader-ring', live && 'mark-ring')} />
          </g>
        </>
      ) : (
        <circle cx={CENTRE} cy={CENTRE} r={G.ring} fill="none" strokeWidth={G.stroke * 0.8} strokeDasharray="1.6 2.2" className="stroke-line-strong" />
      )}
    </svg>
  );
}

/** "REACH" in Geist 600 at +1.2% tracking. The found cell lives in the mark, not in the letters. */
export function Wordmark({ size = 17, className }: { size?: number; className?: string }) {
  return (
    <span className={cx('inline-flex items-baseline font-semibold leading-none text-ink', className)}
      style={{ fontSize: size, letterSpacing: '0.012em' }}>
      REACH
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
  /** Live brand motion on the mark (header only). */
  animated?: boolean;
}

/** Horizontal lockup: mark + wordmark + a mono "benchmark" descriptor. */
export function Lockup({ size = 22, descriptor = true, link, animated = false, className }: LockupProps) {
  const inner = (
    <>
      <Mark size={size} live={animated} />
      <Wordmark size={Math.round(size * 0.78)} />
      {descriptor && (
        <span className="flex items-center self-center" aria-hidden="true">
          <span className="font-mono uppercase text-ink-3" style={{ fontSize: Math.max(10, Math.round(size * 0.48)), letterSpacing: '0.1em' }}>benchmark</span>
        </span>
      )}
    </>
  );
  const cls = cx('inline-flex shrink-0 items-center', className);
  const style = { gap: Math.round(size * 0.42) };
  if (link) {
    return <a href={href('/')} className={cx(cls, 'mark-host rounded-chip')} style={style} aria-label="REACH Benchmark, home">{inner}</a>;
  }
  return <span className={cls} style={style} role="img" aria-label="REACH Benchmark">{inner}</span>;
}
