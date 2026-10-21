import { useEffect, useRef, useState } from 'react';
import { cx } from '../../lib/format';
import { href, scrollToId } from '../../lib/router';
import { PageHeader } from '../../ui/PageHeader';
import { ArrowRight, ICON_STROKE } from '../../ui/icons';
import { useLoopGate } from '../../ui/motion/useLoopGate';
import { drawLens, getField, paintField, type Field, type Palette, type Rect } from './lensDraw';
import { METHODS, STATS, type Method } from './model';
import { Dot } from './parts';
import { isFocusVisible, isMouse, wrap } from './ui';

const PATHS = [[0.11, 0.17, 0.3, 1.1], [0.07, 0.13, 2.4, 0.2], [0.09, 0.11, 4.1, 2.6]];
const FOCUS_MS = 300;
/** ~30 fps, like ShaderCanvas: the lenses drift slowly, so half the frames buy nothing. */
const FRAME_MS = 33;
const MAX_DPR = 2;
/** At >= 1024px the field runs behind the header; lenses keep to the right of the copy. */
const WIDE = '(min-width: 1024px)';
const LENS_X0 = 0.58;
/** The page container (max-w-[1240px] px-6): on wide screens the lenses stay inside it, clear of the header above. */
const CONTAINER = 1240, GUTTER = 24, LENS_TOP = 36;
const lensBand = (w: number) => {
  const inner = Math.min(w, CONTAINER), left = (w - inner) / 2 + GUTTER, right = (w + inner) / 2 - GUTTER;
  return { x0: Math.max(w * LENS_X0, left + (right - left) * 0.56), x1: right };
};

function readPalette(): Palette {
  const css = getComputedStyle(document.documentElement);
  const hex = (k: string) => css.getPropertyValue(`--m-${k}`).trim() || '#8a909c';
  return {
    hues: new Map(METHODS.map((m) => [m.key, hex(m.key)])),
    signal: css.getPropertyValue('--signal').trim() || '#ff5a1f',
    bg: css.getPropertyValue('--canvas').trim() || '#fafafa',
  };
}

/** Run once the browser is idle (after first paint), with a short deadline. */
function whenIdle(cb: () => void): () => void {
  if (typeof requestIdleCallback === 'function') { const id = requestIdleCallback(cb, { timeout: 300 }); return () => cancelIdleCallback(id); }
  const id = window.setTimeout(cb, 60);
  return () => window.clearTimeout(id);
}

interface Scene { w: number; h: number; reserve: number; wide: boolean; t: number; focus: number; shown: Method | null }

/** The three drifting lenses; the lead one grows and shows the pinned method. Returns the painted areas. */
function drawLenses(ctx: CanvasRenderingContext2D, field: Field, pal: Palette, s: Scene, hold: boolean): Rect[] {
  const { w, h, wide, t, shown } = s;
  const band = wide ? lensBand(w) : { x0: 0, x1: w };
  const x0 = band.x0, bw = band.x1 - x0, top = wide ? LENS_TOP : 0;
  const fh = Math.max(160, h - (wide ? s.reserve + 8 : 0));
  const fy = fh - top;
  const ease = 1 - (1 - s.focus) ** 3;
  const base = Math.max(34, Math.min(fy * 0.27, bw * 0.17));
  const painted: Rect[] = [];
  for (let k = 2; k >= 0; k--) {
    const P = PATHS[k], lead = k === 0 && shown !== null, R = base * (lead ? 1 + 0.3 * ease : 1);
    const cx = x0 + R + 10 + Math.max(0, bw - 2 * R - 20) * (0.5 + 0.5 * Math.sin(t * P[0] + P[2]));
    const cy = top + R + 10 + Math.max(0, fy - 2 * R - 44) * (0.5 + 0.5 * Math.sin(t * P[1] + P[3]));
    const ph = (t + k * 3) / 9, kk = wrap(ph, 1), env = hold ? 1 : Math.min(1, kk / 0.08, (1 - kk) / 0.08);
    const cycled = METHODS[wrap(Math.floor(ph) * 3 + k, METHODS.length)];
    const alpha = lead ? Math.max(env, ease) : env * (1 - 0.8 * ease);
    painted.push(...drawLens(ctx, field, pal, { m: lead && shown ? shown : cycled, cx, cy, R, w, h, fh, alpha, xMax: band.x1 }));
  }
  return painted;
}

/** ~30 fps without 60 rAF callbacks a second: wait out most of the frame budget, then take the next vsync. */
function makeTicker(frame: (now: number) => void) {
  let raf = 0, timer = 0;
  const tick = (now: number) => {
    // The rAF timestamp can be most of a frame old; time the gap from when this callback actually runs.
    const began = performance.now();
    frame(now);
    timer = window.setTimeout(() => { raf = requestAnimationFrame(tick); }, Math.max(0, FRAME_MS - 8 - (performance.now() - began)));
  };
  return {
    start: () => { window.clearTimeout(timer); cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); },
    stop: () => { window.clearTimeout(timer); cancelAnimationFrame(raf); },
  };
}

/**
 * The static field is painted once per size into its own canvas; each frame clears and draws only the lenses,
 * at ~30 fps, and only while the shared loop gate runs (on screen, tab visible, motion allowed). Held: one still frame,
 * repainted on hover, pin and resize.
 */
function useLensCanvas(active: string | null) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /** The static field, under the lens canvas; repainted only on resize. */
  const fieldRef = useRef<HTMLCanvasElement>(null);
  /** The chip row under the copy: on wide screens the lenses stay above it. */
  const reserveRef = useRef<HTMLDivElement>(null);
  const { running } = useLoopGate(canvasRef);
  const activeRef = useRef(active);
  const runningRef = useRef(running);
  const api = useRef({ redraw: () => {}, start: () => {}, stop: () => {} });

  useEffect(() => {
    const el = canvasRef.current, fieldEl = fieldRef.current;
    const ctx = el?.getContext('2d');
    if (!el || !fieldEl || !ctx) return; // No 2D context: the stage stays empty and the chips still work.
    const wide = matchMedia(WIDE);
    const scene: Scene = { w: 0, h: 0, reserve: 0, wide: false, t: 4.2, focus: 0, shown: null };
    let field: Field | null = null, pal: Palette | null = null, fieldKey = '', last = 0, dirty: Rect[] = [];
    const measure = () => { scene.w = el.clientWidth; scene.h = el.clientHeight; scene.reserve = reserveRef.current?.offsetHeight ?? 0; };

    const draw = (now: number, hold: boolean) => {
      if (!field || !pal) return;
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
      if (!hold) scene.t += dt;
      const pinKey = activeRef.current;
      if (pinKey) scene.shown = METHODS.find((m) => m.key === pinKey) ?? null;
      scene.focus = hold ? (pinKey ? 1 : 0) : Math.max(0, Math.min(1, scene.focus + (pinKey ? 1 : -1) * (dt * 1000) / FOCUS_MS));
      if (!pinKey && scene.focus === 0) scene.shown = null;
      const { w, h } = scene;
      if (!w || !h) return;
      const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1), pw = Math.round(w * dpr), ph = Math.round(h * dpr);
      scene.wide = wide.matches;
      const key = `${pw}x${ph}:${scene.wide}`;
      if (key !== fieldKey) { fieldKey = key; paintField(fieldEl, field, w, h, dpr, scene.wide, pal.signal); el.width = pw; el.height = ph; dirty = []; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const r of dirty) ctx.clearRect(r[0], r[1], r[2], r[3]);
      dirty = drawLenses(ctx, field, pal, scene, hold);
    };
    const ticker = makeTicker((now) => draw(now, false));
    const start = () => { if (!field) return; last = performance.now() - FRAME_MS; ticker.start(); };
    const redraw = () => { ticker.stop(); draw(performance.now(), true); };
    api.current = { redraw, start, stop: redraw };

    const ro = new ResizeObserver(() => { measure(); if (!runningRef.current) redraw(); });
    ro.observe(el);
    if (reserveRef.current) ro.observe(reserveRef.current);
    // Dot generation and the field paint wait for an idle slot after first paint (the stage fades in at 160 ms).
    const cancelIdle = whenIdle(() => {
      field = getField(); pal = readPalette(); measure();
      if (runningRef.current) start(); else redraw();
    });
    return () => { cancelIdle(); ticker.stop(); ro.disconnect(); api.current = { redraw: () => {}, start: () => {}, stop: () => {} }; };
  }, []);
  // While held, hover and pin repaint one frame; while running, the loop picks them up.
  useEffect(() => { activeRef.current = active; if (!runningRef.current) api.current.redraw(); }, [active]);
  useEffect(() => { runningRef.current = running; if (running) api.current.start(); else api.current.stop(); }, [running]);
  return { canvasRef, fieldRef, reserveRef };
}

function LensChips({ pinned, setPinned, setHover }: { pinned: string | null; setPinned: (k: string | null) => void; setHover: (k: string | null) => void }) {
  return (
    <ul aria-label="Method lenses" className="m-lens-chips m-0 -mx-4 flex list-none gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
      {METHODS.map((m) => {
        const on = pinned === m.key;
        return (
          <li key={m.key} className="flex-none">
            <button type="button" aria-pressed={on} onClick={() => setPinned(on ? null : m.key)}
              onPointerEnter={(e) => { if (isMouse(e)) setHover(m.key); }} onPointerLeave={() => setHover(null)}
              onFocus={(e) => { if (isFocusVisible(e.currentTarget)) setHover(m.key); }} onBlur={() => setHover(null)}
              className={cx('inline-flex h-8 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-chip border px-2 font-mono text-[11px] backdrop-blur-[2px] transition-[border-color,background-color,transform] duration-[var(--dur-1)] active:scale-[0.97]',
                on ? 'border-accent bg-accent-tint text-ink' : 'border-line bg-[rgb(255_255_255/0.85)] text-ink-2 hover:border-line-strong hover:text-ink')}>
              <Dot hue={m.hue} dashed={m.ref} size={7} />
              {m.rank != null && <span className="text-ink-3">{m.rank}</span>}
              {m.name}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function LensHero() {
  const [pinned, setPinned] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const { canvasRef, fieldRef, reserveRef } = useLensCanvas(hover ?? pinned);
  const pm = pinned ? METHODS.find((m) => m.key === pinned) : null;
  const caption = pm
    ? `${pm.name} lens pinned, median AP ${pm.d.medianAP.toFixed(3)}. Select it again to release.`
    : 'Each lens lights the cells its method ranks highest. Illustration: precision among lit cells is set to the median AP.';
  return (
    <section aria-label="Methods overview" className="relative overflow-hidden border-b border-line">
      {/* Phones and tablets: the field is a stage under the copy. Desktop: it runs full-bleed behind the header. */}
      <PageHeader
        className="relative z-[1] pb-6! lg:pb-8! lg:pt-20!"
        title={`${STATS.included} of ${STATS.audited} candidates passed the audit. ${STATS.ranked} are ranked.`}
        lede={<p className="m-0">What each method does, where it fails, why {STATS.excluded} were left out, and a picker for the detector that fits your data.</p>}
        actions={(
          <>
            <button type="button" onClick={() => scrollToId('guidance')}
              className="group inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-chip border-0 bg-ink px-4 text-[13px] font-medium text-canvas transition-transform duration-[var(--dur-1)] active:scale-[0.97]">
              Pick a detector<ArrowRight size={14} strokeWidth={ICON_STROKE} aria-hidden="true" className="transition-transform duration-[var(--dur-1)] group-hover:translate-x-0.5" />
            </button>
            <a href={href('/leaderboard')} className="inline-flex min-h-10 items-center rounded-chip border border-line-strong bg-surface px-4 text-[13px] font-medium text-ink no-underline transition-[border-color,transform] duration-[var(--dur-1)] hover:border-ink-3 active:scale-[0.97]">Leaderboard</a>
          </>
        )}
      />
      <div className="fade-in relative h-[240px] border-t border-line [animation-delay:160ms] sm:h-[300px] lg:absolute lg:inset-0 lg:z-0 lg:h-auto lg:border-t-0">
        <canvas ref={fieldRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />
      </div>
      <div ref={reserveRef} className="relative z-[1] mx-auto max-w-[1240px] px-4 pb-4 pt-3 sm:px-6 lg:pb-8 lg:pt-0">
        <p className="m-0 mb-2 hidden max-w-[62ch] font-mono text-[11px] leading-relaxed text-ink-2 sm:block">{caption}</p>
        <LensChips pinned={pinned} setPinned={setPinned} setHover={setHover} />
        <p aria-live="polite" className="sr-only">{pm ? caption : ''}</p>
      </div>
    </section>
  );
}
