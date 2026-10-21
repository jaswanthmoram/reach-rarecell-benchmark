import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { asset, cx, fmt } from '../../lib/format';
import { SectionHeader } from '../../ui/SectionHeader';
import { useMedia } from '../../ui/useMedia';
import { MOTION_OK, Reveal, ScrollTrigger, canAnimate, gsap, useGSAP } from '../../ui/motion';
import { ArrowUpRight, ICON_STROKE } from '../../ui/icons';
import { METHODS, STATS, methodOf, unreliableLabel, type Method } from './model';
import { Dot } from './parts';
import { isFocusVisible, isMouse, sectionCls } from './ui';

/* Native scatter: median Track A AP against mean runtime (log axis). Measured width keeps 11px labels on phones. */
const PAD = { l: 52, r: 18, t: 18, b: 44 }, CHAR_W = 6.7, LABEL_H = 14, DOT_R = 4.5, DOT_CLEAR = 7;
interface Box { x: number; y: number; w: number; h: number }
interface Placed { m: Method; cx: number; cy: number; label: Box | null; anchor: 'start' | 'end' }

const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const haloR = (m: Method) => (m.unreliable > 0 ? DOT_R + 2.6 * Math.sqrt(m.unreliable) : 0);

function geometry(W: number, H: number) {
  const xAt = (s: number) => PAD.l + (Math.log10(Math.max(1, Math.min(1000, s))) / 3) * (W - PAD.l - PAD.r);
  const yAt = (v: number) => PAD.t + (1 - v) * (H - PAD.t - PAD.b);
  /** Greedy label placement: the active method first, then try eight slots around each dot. */
  const layout = (active: string | null): Placed[] => {
    const pts = METHODS.map((m) => ({ m, cx: xAt(m.d.runtimeS), cy: yAt(m.d.medianAP) }));
    const dots = pts.map((p) => ({ x: p.cx - DOT_R - DOT_CLEAR, y: p.cy - DOT_R - DOT_CLEAR, w: (DOT_R + DOT_CLEAR) * 2, h: (DOT_R + DOT_CLEAR) * 2 }));
    const labels: Box[] = [];
    const out: Placed[] = [];
    const inside = (b: Box) => b.x >= PAD.l + 2 && b.x + b.w <= W - 2 && b.y >= 0 && b.y + b.h <= H - PAD.b;
    const order = pts.map((_, i) => i).sort((a, b) => Number(pts[b].m.key === active) - Number(pts[a].m.key === active));
    for (const i of order) {
      const p = pts[i], tw = p.m.name.length * CHAR_W, gap = DOT_R + 5, mid = p.cy - LABEL_H / 2, up = p.cy - gap - LABEL_H, down = p.cy + gap;
      const tries: [Box, 'start' | 'end'][] = [
        [{ x: p.cx + gap, y: mid, w: tw, h: LABEL_H }, 'start'], [{ x: p.cx - gap - tw, y: mid, w: tw, h: LABEL_H }, 'end'],
        [{ x: p.cx - tw / 2, y: up, w: tw, h: LABEL_H }, 'start'], [{ x: p.cx - tw / 2, y: down, w: tw, h: LABEL_H }, 'start'],
        [{ x: p.cx + 2, y: up, w: tw, h: LABEL_H }, 'start'], [{ x: p.cx - 2 - tw, y: up, w: tw, h: LABEL_H }, 'end'],
        [{ x: p.cx + 2, y: down, w: tw, h: LABEL_H }, 'start'], [{ x: p.cx - 2 - tw, y: down, w: tw, h: LABEL_H }, 'end'],
      ];
      const hit = tries.find(([b]) => inside(b) && !labels.some((l) => overlaps(l, b)) && !dots.some((d, j) => j !== i && overlaps(d, b)));
      if (hit) labels.push(hit[0]);
      out[i] = { m: p.m, cx: p.cx, cy: p.cy, label: hit ? hit[0] : null, anchor: hit ? hit[1] : 'start' };
    }
    return out;
  };
  return { xAt, yAt, layout };
}

function useWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

const mono11 = { font: "11px 'Geist Mono', ui-monospace, monospace" };

/**
 * Draw-in, once on first view (audit S-17): each dot travels up from the x-axis to its AP, 30 ms apart, then the
 * fallback halos grow out of their dots. Reduced or paused motion: the chart is simply there.
 */
/** Only the props the entrance set; React owns the inline fill, stroke and font. */
const clear = (dots: Element[], halos: Element[], labels: Element[]) => {
  gsap.set(dots, { clearProps: 'transform,opacity' });
  gsap.set(halos, { clearProps: 'transform' });
  gsap.set(labels, { clearProps: 'opacity' });
};

function useScatterEntrance(svgRef: RefObject<SVGSVGElement | null>) {
  useGSAP(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      if (!canAnimate() || svg.getBoundingClientRect().bottom < 0) return;
      const dots = gsap.utils.toArray<SVGGElement>('[data-rise]', svg);
      const halos = gsap.utils.toArray<SVGCircleElement>('[data-halo]', svg);
      const labels = gsap.utils.toArray<SVGTextElement>('[data-label]', svg);
      gsap.set(dots, { y: (_: number, el: SVGGElement) => Number(el.dataset.rise), opacity: 0 });
      gsap.set(halos, { scale: 0, transformOrigin: '50% 50%' });
      gsap.set(labels, { opacity: 0 });
      const st = ScrollTrigger.create({
        trigger: svg, start: 'top 82%', once: true,
        onEnter: () => {
          if (!canAnimate()) { clear(dots, halos, labels); return; }
          gsap.timeline()
            .to(dots, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.03, clearProps: 'transform,opacity' })
            .to(halos, { scale: 1, duration: 0.42, ease: 'power2.out', stagger: 0.03, clearProps: 'transform' }, '-=0.2')
            .to(labels, { opacity: 1, duration: 0.24, ease: 'power1.out', clearProps: 'opacity' }, '<');
        },
      });
      return () => { st.kill(); clear(dots, halos, labels); };
    });
    return () => mm.revert();
  }, { dependencies: [] });
}

/**
 * At >= 1024px the table sits beside the chart: its first row lines up with the plot top (the 1.000 gridline), so the
 * two read as one artefact. Measured, because the chart header and axis label set that offset.
 */
const TABLE_HEAD = 41;
function usePlotAlign(figRef: RefObject<HTMLElement | null>, svgRef: RefObject<SVGSVGElement | null>, on: boolean) {
  const [offset, setOffset] = useState(0);
  useLayoutEffect(() => {
    const fig = figRef.current, svg = svgRef.current;
    if (!on || !fig || !svg) { setOffset(0); return; }
    const measure = () => {
      const scale = svg.getBoundingClientRect().height / (svg.viewBox.baseVal.height || 1);
      const plotTop = svg.getBoundingClientRect().top + PAD.t * scale - fig.getBoundingClientRect().top;
      setOffset(Math.max(0, Math.round(plotTop - TABLE_HEAD)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(fig);
    return () => ro.disconnect();
  }, [figRef, svgRef, on]);
  return offset;
}

export function CostScatter() {
  const [hover, setHover] = useState<string | null>(null);
  const [pin, setPin] = useState<string | null>(null);
  const [boxRef, W] = useWidth<HTMLDivElement>(640);
  const svgRef = useRef<SVGSVGElement>(null);
  const figRef = useRef<HTMLElement>(null);
  const wide = useMedia('(min-width: 1024px)');
  const tableTop = usePlotAlign(figRef, svgRef, wide);
  useScatterEntrance(svgRef);
  const H = W < 480 ? 320 : 380;
  const geo = useMemo(() => geometry(W, H), [W, H]);
  const base = useMemo(() => geo.layout(null), [geo]);
  const active = hover ?? pin;
  const placed = active && !base.find((p) => p.m.key === active)?.label ? geo.layout(active) : base;
  const dim = (k: string) => active !== null && active !== k;
  const click = (k: string) => () => setPin((p) => (p === k ? null : k));
  const fire = methodOf('fire'), expr = methodOf('expr_threshold');

  let readout = 'Point at a dot or a row to pick out one method.';
  if (active) {
    const m = methodOf(active);
    readout = `${m.name}: median AP ${fmt.ap(m.d.medianAP)} at ${m.rt} ${m.hw}, ${m.unreliable}% fallback or degenerate units${pin === active ? ' (kept)' : ''}`;
  }
  const scatterLabel = `Median Track A AP against mean runtime per unit, log scale. ${METHODS.map((m) => `${m.name} ${fmt.ap(m.d.medianAP)} at ${m.rt}`).join('; ')}.`;
  const right = W - PAD.r, bottom = H - PAD.b;

  return (
    <section id="cost" aria-labelledby="cost-h" className={sectionCls('wide')}>
      <SectionHeader id="cost-h" title="Runtime does not buy precision"
        lede={<>FiRE, rank 1, takes {fire.rt} per Track A unit. expr_threshold, not significantly different from it, takes {expr.rt}. Read runtime together with how often a method falls back or returns constant scores.</>} />
      <Reveal variant="mask" className="grid items-start gap-8 lg:grid-cols-12">
        <figure ref={figRef} className="m-0 min-w-0 overflow-hidden rounded-card border border-line bg-surface shadow-[var(--elev-1)] lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-line py-1 pl-4 pr-3">
            <figcaption className="py-2 text-sm font-semibold">Median AP against runtime, Track A</figcaption>
            <a href={asset('figures/paper/fig-6.webp')} target="_blank" rel="noopener noreferrer" className="m-ul group inline-flex min-h-10 items-center gap-1 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-2 hover:text-ink"><span className="fx-underline">Proof Figure 6</span><ArrowUpRight size={13} strokeWidth={ICON_STROKE} aria-hidden="true" className="transition-transform duration-[var(--dur-1)] group-hover:-translate-y-px group-hover:translate-x-px" /></a>
          </div>
          <div className="px-3 pb-1 pt-3">
            <p className="m-0 mb-1 pl-2 font-mono text-[11px] text-ink-2">Median AP, Track A</p>
            <div ref={boxRef}>
              <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={scatterLabel} className="block h-auto w-full overflow-visible">
                {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                  <g key={t}>
                    <line x1={PAD.l} x2={right} y1={geo.yAt(t)} y2={geo.yAt(t)} style={{ stroke: 'var(--line)' }} />
                    <text x={PAD.l - 8} y={geo.yAt(t)} dy="0.32em" textAnchor="end" style={{ ...mono11, fill: 'var(--ink-3)' }}>{t.toFixed(3)}</text>
                  </g>
                ))}
                {[1, 10, 100, 1000].map((t) => (
                  <g key={t}>
                    <line x1={geo.xAt(t)} x2={geo.xAt(t)} y1={PAD.t} y2={bottom} style={{ stroke: 'var(--line)' }} />
                    <text x={geo.xAt(t)} y={bottom + 16} textAnchor={t === 1 ? 'start' : t === 1000 ? 'end' : 'middle'} style={{ ...mono11, fill: 'var(--ink-3)' }}>{fmt.int(t)} s</text>
                  </g>
                ))}
                <line x1={PAD.l} x2={right} y1={bottom} y2={bottom} style={{ stroke: 'var(--line-strong)' }} />
                <text x={PAD.l} y={H - 6} style={{ font: '11px Geist, ui-sans-serif, system-ui, sans-serif', fill: 'var(--ink-2)' }}>Mean runtime per Track A unit, log scale</text>
                {placed.filter((p) => haloR(p.m) > 0).map((p) => (
                  <circle key={`h-${p.m.key}`} data-halo="" className="m-pt pointer-events-none" cx={p.cx} cy={p.cy} r={haloR(p.m)} fillOpacity={0.12} strokeOpacity={0.45} style={{ fill: p.m.hue, stroke: p.m.hue, opacity: dim(p.m.key) ? 0.25 : 1 }} />
                ))}
                {placed.map((p) => {
                  const k = p.m.key, l = p.label;
                  return (
                    <g key={k} className="m-pt cursor-pointer" style={{ opacity: dim(k) ? 0.25 : 1 }} onPointerEnter={(e) => { if (isMouse(e)) setHover(k); }} onPointerLeave={() => setHover(null)} onClick={click(k)}>
                      <circle cx={p.cx} cy={p.cy} r={14} fill="transparent" />
                      <g data-rise={bottom - p.cy}>
                        <circle cx={p.cx} cy={p.cy} r={DOT_R} style={{ fill: p.m.ref ? '#ffffff' : p.m.hue, stroke: p.m.ref ? p.m.hue : '#ffffff' }} strokeWidth={p.m.ref ? 1.6 : 1.5} strokeDasharray={p.m.ref ? '2.4 1.8' : undefined} />
                      </g>
                      {l && <text data-label="" x={p.anchor === 'end' ? l.x + l.w : l.x} y={l.y + LABEL_H / 2} dy="0.32em" textAnchor={p.anchor} style={{ ...mono11, fill: active === k ? 'var(--ink)' : 'var(--ink-2)' }}>{p.m.name}</text>}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
          <p aria-live="polite" className="m-0 min-h-[18px] border-t border-line px-4 py-2.5 font-mono text-xs text-ink">{readout}</p>
          <ul aria-label="Chart legend" className="m-0 flex list-none flex-wrap gap-x-5 gap-y-1.5 border-t border-line px-4 pb-3 pt-2.5 text-xs text-ink-2">
            <li className="inline-flex items-center gap-2"><span aria-hidden="true" className="inline-block size-2.5 rounded-full bg-ink-2" />Ranked published detector</li>
            <li className="inline-flex items-center gap-2"><Dot hue="var(--ink-2)" dashed />Reference, not ranked</li>
            <li className="inline-flex items-center gap-2"><span aria-hidden="true" className="box-border inline-block size-4 rounded-full border border-[rgba(98,105,119,0.6)] bg-[rgba(98,105,119,0.15)]" />Halo area: share of fallback or degenerate units</li>
          </ul>
        </figure>
        <div className="min-w-0 overflow-hidden rounded-card border border-line bg-surface shadow-[var(--elev-1)] lg:col-span-5" style={{ marginTop: tableTop }}>
          <div className="flex h-10 items-center gap-1.5 bg-sunk px-3 sm:gap-3 sm:px-4 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3">
            <span className="flex-1">Method</span><span className="w-11 text-right sm:w-12">AP</span><span className="w-14 text-right sm:w-16">Runtime</span><span className="w-[72px] text-right">Unreliable</span>
          </div>
          {METHODS.map((m) => (
            <div key={m.key} onPointerEnter={(e) => { if (isMouse(e)) setHover(m.key); }} onPointerLeave={() => setHover(null)}
              className={cx('flex items-center gap-1.5 border-t border-line px-3 text-[13px] sm:gap-3 sm:px-4 transition-colors duration-150', active === m.key && 'bg-sunk')}>
              <button type="button" onClick={click(m.key)} aria-pressed={pin === m.key} onFocus={(e) => { if (isFocusVisible(e.currentTarget)) setHover(m.key); }} onBlur={() => setHover(null)}
                className="inline-flex min-h-10 min-w-0 flex-1 cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-left font-mono text-[11px] text-ink sm:text-[13px]">
                <Dot hue={m.hue} dashed={m.ref} /><span className="truncate">{m.name}</span>
              </button>
              <span className="w-11 text-right font-mono sm:w-12">{fmt.ap(m.d.medianAP)}</span>
              <span className="w-14 whitespace-nowrap text-right font-mono sm:w-16">{m.rt}</span>
              <span className={cx('w-[72px] text-right font-mono text-xs', m.unreliable >= 10 ? 'text-warn' : 'text-ink-3')}>{unreliableLabel(m.unreliable)}</span>
            </div>
          ))}
          <p className="m-0 border-t border-line px-4 py-3 text-xs leading-normal text-ink-2">Unreliable: fallback plus degenerate units over all {STATS.coreUnits} primary units (proof Figure 3c). Runtime is the mean per Track A unit on CPU, except DeepScena on a Colab T4 GPU. Point at a row or a dot to pick out one method; select a row to keep it.</p>
        </div>
      </Reveal>
    </section>
  );
}
