import { useEffect, useRef, useState } from 'react';
import { fmt, methodColor } from '../../ui';
import type { MethodResult } from '../../data/benchmarkData';
import { isReference, unreliablePct } from './shared';

/**
 * Native cost scatter: mean runtime per Track A unit (log, 1 s to 1,000 s) against Track A median AP, the same
 * axes as proof Figure 6, drawn from the data file. The halo area is the share of fallback or degenerate units.
 * Drawn at the container's pixel width (no viewBox scaling) so every label stays at 11px.
 */

const PAD = { l: 52, r: 18, t: 18, b: 44 };
const CHAR_W = 6.7; // Geist Mono at 11px
const LABEL_H = 14;
const X_TICKS = [1, 10, 100, 1000];
const Y_TICKS = [0, 0.25, 0.5, 0.75, 1];
const DOT_R = 4.5;
/** Clear margin around every other method's dot that a label may not enter. */
const DOT_CLEAR = 7;

const haloR = (m: MethodResult) => {
  const u = unreliablePct(m);
  return u > 0 ? DOT_R + 2.6 * Math.sqrt(u) : 0;
};

interface Box { x: number; y: number; w: number; h: number }
const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

interface Placed { m: MethodResult; cx: number; cy: number; label: Box | null; anchor: 'start' | 'end' }

/**
 * Greedy label placement around each dot; a label that fits nowhere is dropped (the table names it). The active
 * method is placed first, so a hovered or tapped row always gets its label.
 */
function layout(rows: MethodResult[], w: number, h: number, active: string | null): Placed[] {
  const x = (s: number) => PAD.l + (Math.log10(Math.max(1, Math.min(1000, s))) / 3) * (w - PAD.l - PAD.r);
  const y = (ap: number) => PAD.t + (1 - ap) * (h - PAD.t - PAD.b);
  const pts = rows.map((m) => ({ m, cx: x(m.runtimeS), cy: y(m.medianAP) }));
  // Dots keep a clear margin, so a label never sits next to a method it does not name.
  const dots: Box[] = pts.map((p) => ({ x: p.cx - DOT_R - DOT_CLEAR, y: p.cy - DOT_R - DOT_CLEAR, w: (DOT_R + DOT_CLEAR) * 2, h: (DOT_R + DOT_CLEAR) * 2 }));
  const labels: Box[] = [];
  const inside = (b: Box) => b.x >= PAD.l + 2 && b.x + b.w <= w - 2 && b.y >= 0 && b.y + b.h <= h - PAD.b;
  const order = pts.map((_, i) => i).sort((a, b) => Number(pts[b].m.id === active) - Number(pts[a].m.id === active));
  const out: Placed[] = [];
  for (const i of order) {
    const p = pts[i];
    const tw = p.m.method.length * CHAR_W;
    const gap = DOT_R + 5;
    const mid = p.cy - LABEL_H / 2;
    const up = p.cy - gap - LABEL_H;
    const down = p.cy + gap;
    const tries: [Box, 'start' | 'end'][] = [
      [{ x: p.cx + gap, y: mid, w: tw, h: LABEL_H }, 'start'],
      [{ x: p.cx - gap - tw, y: mid, w: tw, h: LABEL_H }, 'end'],
      [{ x: p.cx - tw / 2, y: up, w: tw, h: LABEL_H }, 'start'],
      [{ x: p.cx - tw / 2, y: down, w: tw, h: LABEL_H }, 'start'],
      [{ x: p.cx + 2, y: up, w: tw, h: LABEL_H }, 'start'],
      [{ x: p.cx - 2 - tw, y: up, w: tw, h: LABEL_H }, 'end'],
      [{ x: p.cx + 2, y: down, w: tw, h: LABEL_H }, 'start'],
      [{ x: p.cx - 2 - tw, y: down, w: tw, h: LABEL_H }, 'end'],
    ];
    const free = (b: Box) => inside(b) && !labels.some((t) => overlaps(t, b)) && !dots.some((d, j) => j !== i && overlaps(d, b));
    const hit = tries.find(([b]) => free(b));
    if (hit) labels.push(hit[0]);
    out[i] = { ...p, label: hit ? hit[0] : null, anchor: hit ? hit[1] : 'start' };
  }
  return out;
}

function useWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

export function CostScatter({ rows, active, onActive }: { rows: MethodResult[]; active: string | null; onActive: (id: string | null) => void }) {
  const [ref, w] = useWidth<HTMLDivElement>(640);
  const h = w < 520 ? 340 : 380;
  // Labels stay put on hover; only a method whose label was dropped re-runs placement with itself first.
  const base = layout(rows, w, h, null);
  const placed = active && !base.find((p) => p.m.id === active)?.label ? layout(rows, w, h, active) : base;
  const plotW = w - PAD.l - PAD.r;
  const plotH = h - PAD.t - PAD.b;
  const xAt = (s: number) => PAD.l + (Math.log10(s) / 3) * plotW;
  const yAt = (ap: number) => PAD.t + (1 - ap) * plotH;
  const summary = rows.map((m) => `${m.method} ${fmt.ap(m.medianAP)} at ${fmt.secs(m.runtimeS)}`).join('; ');

  return (
    <div ref={ref} className="relative w-full">
      <svg width={w} height={h} role="img" aria-label={`Median Track A AP against mean runtime per unit, log scale. ${summary}.`} className="block overflow-visible">
        {/* Grid and axes */}
        {Y_TICKS.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={w - PAD.r} y1={yAt(t)} y2={yAt(t)} stroke="var(--line)" strokeWidth={1} />
            <text x={PAD.l - 8} y={yAt(t)} dy="0.32em" textAnchor="end" className="fill-ink-3 font-mono text-[11px] tabular">{fmt.ap(t)}</text>
          </g>
        ))}
        {X_TICKS.map((t) => (
          <g key={t}>
            <line x1={xAt(t)} x2={xAt(t)} y1={PAD.t} y2={h - PAD.b} stroke="var(--line)" strokeWidth={1} />
            <text x={xAt(t)} y={h - PAD.b + 16} textAnchor={t === 1 ? 'start' : t === 1000 ? 'end' : 'middle'} className="fill-ink-3 font-mono text-[11px] tabular">{fmt.int(t)} s</text>
          </g>
        ))}
        <line x1={PAD.l} x2={w - PAD.r} y1={h - PAD.b} y2={h - PAD.b} stroke="var(--line-strong)" strokeWidth={1} />
        <text x={PAD.l} y={h - 6} className="fill-ink-2 text-[11px]">Mean runtime per Track A unit, log scale</text>

        {/* Halos first, so no halo covers another method's dot */}
        {placed.map(({ m, cx, cy }) => {
          const r = haloR(m);
          const dim = active !== null && active !== m.id;
          return r > 0 && (
            <circle key={`h-${m.id}`} cx={cx} cy={cy} r={r} fill={methodColor(m.id)} fillOpacity={0.12} stroke={methodColor(m.id)} strokeOpacity={0.45}
              className="transition-opacity duration-150" style={{ opacity: dim ? 0.25 : 1 }} />
          );
        })}
        {placed.map(({ m, cx, cy, label, anchor }) => {
          const ref_ = isReference(m);
          const dim = active !== null && active !== m.id;
          const on = active === m.id;
          return (
            <g key={m.id} className="cursor-default transition-opacity duration-150" style={{ opacity: dim ? 0.25 : 1 }}
              onMouseEnter={() => onActive(m.id)} onMouseLeave={() => onActive(null)}>
              <circle cx={cx} cy={cy} r={14} fill="transparent" />
              {ref_
                ? <circle cx={cx} cy={cy} r={DOT_R} fill="var(--surface)" stroke={methodColor(m.id)} strokeWidth={1.6} strokeDasharray="2.4 1.8" />
                : <circle cx={cx} cy={cy} r={DOT_R} fill={methodColor(m.id)} stroke="var(--surface)" strokeWidth={1.5} />}
              {label && (
                <text x={anchor === 'end' ? label.x + label.w : label.x} y={label.y + LABEL_H / 2} dy="0.32em" textAnchor={anchor}
                  className={`font-mono text-[11px] ${on ? 'fill-ink' : 'fill-ink-2'}`}>{m.method}</text>
              )}
            </g>
          );
        })}
      </svg>
      <p className="pointer-events-none absolute left-[52px] top-0 -translate-y-full pb-1 font-mono text-[11px] text-ink-2">Median AP, Track A</p>
    </div>
  );
}
