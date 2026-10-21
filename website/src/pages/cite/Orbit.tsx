import { useEffect, useRef, useState } from 'react';
import { cx } from '../../lib/format';
import { PARTS } from './data';
import { useInView } from '../../ui/motion/useInView';

/* The citation orbit: one ring per citable part, the article innermost. A picked part lights its ring. */

const ACC = 'var(--accent)';
const GREY = 'var(--cell)';
const INK2 = 'var(--ink-2)';
const STEP_DEG = 40.1;

const RINGS = PARTS.map((_, k) => {
  const r = 77.3 + 45.1 * k;
  const n = 7 + 6 * k;
  const dots = Array.from({ length: n }, (_d, i) => {
    const a = ((k * STEP_DEG + (i * 360) / n) * Math.PI) / 180;
    return { x: +(r * Math.cos(a)).toFixed(1), y: +(r * Math.sin(a)).toFixed(1) };
  });
  return { r, dots, dotR: 2.1 + 0.15 * k, dur: 38 + 21 * k };
});

const LABELS = [
  { x: 265.4, y: 193.5, w: 45 },
  { x: 273.4, y: 211.9, w: 38 },
  { x: 278.0, y: 230.3, w: 38 },
  { x: 279.1, y: 248.7, w: 45 },
  { x: 262.7, y: 267.0, w: 87 },
];

interface OrbitProps { lit: readonly boolean[]; anyArchive: boolean; className?: string }

/** Count of times each ring has been switched on since mount; a new count remounts that ring's one-shot flash. */
function useLitFlashes(lit: readonly boolean[]) {
  const prev = useRef(lit);
  const [flashes, setFlashes] = useState(() => lit.map(() => 0));
  useEffect(() => {
    const before = prev.current;
    prev.current = lit;
    if (lit.some((on, k) => on && !before[k])) setFlashes((f) => f.map((n, k) => (lit[k] && !before[k] ? n + 1 : n)));
  }, [lit]);
  return flashes;
}

/**
 * Hero art. A picked part's ring brightens over 240 ms (a cobalt ring fades in over the grey one) and flashes once,
 * so the reader sees the citation set grow (audit Cite P1). Spin, pulse and reticle are `.loop`s: they stop
 * off-screen, under reduced motion and under "Pause motion".
 */
export function Orbit({ lit, anyArchive, className }: OrbitProps) {
  const [ref, on] = useInView<SVGSVGElement>({ once: false, rootMargin: '80px' });
  const flashes = useLitFlashes(lit);
  const width = (k: number) => ((k === 0 ? anyArchive : lit[k]) ? 1.8 : 1.3);
  return (
    <svg ref={ref} viewBox="0 0 560 340" width="100%" height="100%" aria-hidden="true" className={cx('block overflow-visible', !on && 'cite-paused', className)}>
      <g transform="rotate(-14 280 170)">
        {RINGS.map((_, i) => {
          const k = RINGS.length - 1 - i; // outermost first so the article ring draws on top
          const g = RINGS[k];
          const isLit = lit[k];
          return (
            <g key={k} transform="translate(280 170) scale(1 0.42)">
              <circle r={g.r} fill="none" stroke={GREY} strokeWidth={1} strokeOpacity={0.9} vectorEffect="non-scaling-stroke" />
              <circle className="cite-ring" data-on={isLit || undefined} r={g.r} fill="none" stroke={ACC} strokeWidth={width(k)} vectorEffect="non-scaling-stroke" />
              {isLit && flashes[k] > 0 && (
                <circle key={flashes[k]} className="cite-flash" r={g.r} fill="none" stroke={ACC} strokeWidth={5} vectorEffect="non-scaling-stroke" />
              )}
              <g className="cite-spin loop" style={{ animationDuration: `${g.dur}s`, fill: isLit ? ACC : GREY }}>
                <circle r={g.r} fill="none" stroke="none" />
                {g.dots.map((d, j) => <circle key={j} cx={d.x} cy={d.y} r={g.dotR} />)}
              </g>
            </g>
          );
        })}
      </g>
      <circle className="cite-pulse loop" cx={280} cy={170} r={5} fill="var(--signal)" />
      <circle className="cite-found loop" cx={280} cy={170} r={13} fill="none" stroke={ACC} strokeWidth={1.3} />
      {LABELS.map((l, k) => (
        <g key={k}>
          <rect x={l.x} y={l.y} width={l.w} height={16} rx={3} fill="var(--canvas)" fillOpacity={0.92} />
          <text className="cite-label" x={l.x + l.w / 2} y={l.y + 12} textAnchor="middle" fontFamily="Geist Mono, ui-monospace, monospace" fontSize={11} fontWeight={500} letterSpacing="0.06em" style={{ fill: lit[k] ? ACC : INK2 }}>{PARTS[k].orbit}</text>
        </g>
      ))}
    </svg>
  );
}

/* Far field behind the hero: a fixed, seeded scatter of faint cells. */
function seeded(seed: number) {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = seeded(1878538);
const FIELD = Array.from({ length: 110 }, () => ({
  cx: Math.round(rnd() * 1440), cy: Math.round(rnd() * 420), r: +(0.6 + rnd() * 0.8).toFixed(1), o: +(0.26 + rnd() * 0.34).toFixed(2),
}));

export function DotField({ paused }: { paused: boolean }) {
  return (
    <svg viewBox="0 0 1440 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className={cx('cite-drift loop absolute inset-0 h-full w-full', paused && 'cite-paused')}>
      <g fill="var(--cell)">
        {FIELD.map((d, i) => <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fillOpacity={d.o} />)}
      </g>
    </svg>
  );
}
