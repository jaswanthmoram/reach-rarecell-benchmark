import { useEffect, useRef } from 'react';
import { PARTS, type PartId } from './components';

/**
 * The citation orbit: one found cell at the centre, five tilted orbits of cells around it, paper innermost.
 * Each orbit is a citable part. Lit orbits (`lit`) turn accent; `hover` previews one more. The paper orbit lights
 * with any archive because the paper is always cited. Canvas only (transform-free), theme-aware, DPR <= 2,
 * paused off-screen and in hidden tabs; under reduced motion it draws still frames, redrawn when the selection changes.
 * Pointer: hovering near an orbit reports it through `onHover`; clicking reports `onPick`. Keyboard users get the
 * same through the chips and list that own the state; the canvas itself is decorative.
 */
type Props = { lit: ReadonlySet<PartId>; hover: PartId | null; onHover?: (id: PartId | null) => void; onPick?: (id: PartId) => void; className?: string };

const RING_STEP = 0.175; // rx gap between neighbouring orbits, as a share of R
const RINGS = PARTS.map((p, k) => ({
  id: p.id, short: p.short,
  size: 0.3 + k * RING_STEP, // rx as a share of the orbit radius
  tilt: -0.34 + k * 0.05, // radians
  n: 7 + k * 6, // cells on the orbit
  speed: 0.2 / (1 + k * 0.55), // rad/s, outer orbits slower
}));
const FLAT = 0.42; // ry / rx: the orbits read as tilted circles
const EASE_MS = 220;
/* Orbit angle (radians, pi/2 = near bottom) for each label: inner left of bottom, then fanning to the right. */
const LABEL_AT = [2.12, 1.42, 1.07, 0.72, 0.37];

export function OrbitCanvas({ lit, hover, onHover, onPick, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const target = useRef<{ lit: ReadonlySet<PartId>; hover: PartId | null }>({ lit, hover });
  const redraw = useRef<() => void>(() => {});

  useEffect(() => { target.current = { lit, hover }; redraw.current(); }, [lit, hover]);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0, raf = 0, visible = true, last = performance.now(), t = 4;
    let c = { cell: '#8a909c', ink: '#4a5160', signal: '#ff5a1f', accent: '#2f5bea', canvas: '#fafafa' };
    const glow = RINGS.map(() => 0); // eased 0..1 per ring
    const seeds = RINGS.map((r, k) => Array.from({ length: r.n }, (_, i) => (i / r.n) * Math.PI * 2 + k * 0.7 + Math.sin(i * 12.9898 + k) * 0.18));

    const read = () => {
      const cs = getComputedStyle(canvas);
      const v = (n: string, f: string) => cs.getPropertyValue(n).trim() || f;
      c = { cell: v('--ink-3', c.cell), ink: v('--ink-2', c.ink), signal: v('--signal', c.signal), accent: v('--accent', c.accent), canvas: v('--canvas', c.canvas) };
    };
    const resize = () => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr)); canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const geom = () => {
      const R = Math.min(w * 0.47, (h * 0.47) / (FLAT + 0.2));
      return { cx: w / 2, cy: h / 2, R };
    };
    const want = (k: number) => {
      const { lit: L, hover: H } = target.current;
      const id = RINGS[k].id;
      const any = L.size > 0 || (H && H !== 'paper');
      if (H === id) return 1;
      if (L.has(id)) return 0.85;
      return id === 'paper' && any ? 0.55 : 0;
    };
    /** Point on orbit k at angle a; z > 0 is the near half. */
    const at = (k: number, a: number, g: ReturnType<typeof geom>) => {
      const r = RINGS[k], rx = g.R * r.size, ry = rx * FLAT, ct = Math.cos(r.tilt), st = Math.sin(r.tilt);
      const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
      return { x: g.cx + x * ct - y * st, y: g.cy + x * st + y * ct, z: Math.sin(a) };
    };
    const mix = (k: number) => glow[k] > 0.02;

    const ring = (k: number, g: ReturnType<typeof geom>) => {
      const r = RINGS[k], rx = g.R * r.size;
      ctx.save(); ctx.translate(g.cx, g.cy); ctx.rotate(r.tilt);
      ctx.beginPath(); ctx.ellipse(0, 0, rx, rx * FLAT, 0, 0, Math.PI * 2);
      ctx.strokeStyle = c.cell; ctx.globalAlpha = 0.22; ctx.lineWidth = 1; ctx.stroke();
      if (mix(k)) { ctx.strokeStyle = c.accent; ctx.globalAlpha = glow[k] * 0.9; ctx.lineWidth = 1 + glow[k] * 0.6; ctx.stroke(); }
      ctx.restore();
    };
    const cells = (k: number, g: ReturnType<typeof geom>, near: boolean) => {
      const r = RINGS[k];
      for (const s of seeds[k]) {
        const p = at(k, s + t * r.speed, g);
        if (p.z > 0 !== near) continue;
        const depth = 0.55 + 0.45 * (p.z + 1) / 2, size = (1.1 + k * 0.12) * depth * (1 + glow[k] * 0.45);
        ctx.globalAlpha = (0.35 + 0.45 * depth) * (1 - glow[k]); ctx.fillStyle = c.cell;
        ctx.beginPath(); ctx.arc(p.x, p.y, size, 0, Math.PI * 2); ctx.fill();
        if (mix(k)) { ctx.globalAlpha = glow[k] * (0.55 + 0.45 * depth); ctx.fillStyle = c.accent; ctx.beginPath(); ctx.arc(p.x, p.y, size, 0, Math.PI * 2); ctx.fill(); }
      }
    };
    /*
     * Each label sits on its own orbit, fanned from just left of the inner orbit's near point towards the outer
     * orbit's right edge, so the five read as one arc and never stack. A small canvas-coloured plate keeps passing cells off the text.
     */
    const label = (k: number, g: ReturnType<typeof geom>) => {
      const r = RINGS[k], p = at(k, LABEL_AT[k], g), text = r.short.toUpperCase();
      ctx.font = '500 11px "Geist Mono", ui-monospace, monospace'; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
      const tw = ctx.measureText(text).width + 8;
      p.x = Math.min(w - tw / 2 - 2, Math.max(tw / 2 + 2, p.x));
      ctx.globalAlpha = 0.9; ctx.fillStyle = c.canvas;
      ctx.beginPath(); ctx.roundRect(p.x - tw / 2, p.y - 8, tw, 16, 3); ctx.fill();
      ctx.globalAlpha = 0.75 + glow[k] * 0.25; ctx.fillStyle = mix(k) ? c.accent : c.ink;
      ctx.fillText(text, p.x, p.y + 0.5);
    };
    const centre = (g: ReturnType<typeof geom>) => {
      const pulse = reduce ? 1 : 1 + 0.16 * Math.sin(t * 2.6);
      ctx.globalAlpha = 1; ctx.fillStyle = c.signal;
      ctx.beginPath(); ctx.arc(g.cx, g.cy, 4.5 * pulse, 0, Math.PI * 2); ctx.fill();
      const k = reduce ? 0.7 : (t % 2.4) / 2.4; // the found ring closes on the cell
      ctx.strokeStyle = c.accent; ctx.lineWidth = 1.2; ctx.globalAlpha = reduce ? 0.8 : Math.min(1, (1 - k) * 2.2);
      ctx.beginPath(); ctx.arc(g.cx, g.cy, 26 - 15 * Math.min(1, k * 1.6), 0, Math.PI * 2); ctx.stroke();
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const g = geom();
      for (let k = RINGS.length - 1; k >= 0; k--) ring(k, g);
      for (let k = RINGS.length - 1; k >= 0; k--) cells(k, g, false);
      centre(g);
      for (let k = 0; k < RINGS.length; k++) cells(k, g, true);
      // Labels need room between neighbouring orbits; small canvases skip them (the chips name the parts).
      if (g.R >= 200) for (let k = 0; k < RINGS.length; k++) label(k, g);
      ctx.globalAlpha = 1;
    };
    const step = (dt: number) => {
      let moving = false;
      RINGS.forEach((_, k) => {
        const d = want(k) - glow[k];
        if (Math.abs(d) < 0.005) { glow[k] = want(k); return; }
        glow[k] += d * Math.min(1, dt / (EASE_MS / 4)); moving = true;
      });
      return moving;
    };
    const loop = (now: number) => {
      const dt = Math.min(64, now - last); last = now;
      if (visible && !document.hidden) { t += dt / 1000; step(dt); draw(); }
      raf = requestAnimationFrame(loop);
    };
    /* Reduced motion: no orbiting; selection changes snap in one still frame. */
    const still = () => { RINGS.forEach((_, k) => { glow[k] = want(k); }); draw(); };

    read(); resize();
    /* Always paint one frame up front, so an orbit that mounts off-screen is never an empty card. */
    if (reduce) { still(); redraw.current = still; } else { step(EASE_MS * 4); draw(); raf = requestAnimationFrame(loop); }

    const ro = new ResizeObserver(() => { resize(); if (reduce) still(); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(canvas);
    const mo = new MutationObserver(() => { read(); if (reduce) still(); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });

    /* Hit test: which orbit is the pointer nearest to, in the orbit's own unit space. */
    const nearest = (e: PointerEvent): PartId | null => {
      const rect = canvas.getBoundingClientRect(), g = geom();
      const dx = e.clientX - rect.left - g.cx, dy = e.clientY - rect.top - g.cy;
      let best: PartId | null = null, bestD = 14;
      RINGS.forEach((r) => {
        const ct = Math.cos(-r.tilt), st = Math.sin(-r.tilt), x = dx * ct - dy * st, y = dx * st + dy * ct;
        const rx = g.R * r.size, q = Math.hypot(x / rx, y / (rx * FLAT));
        const d = Math.abs(q - 1) * rx * FLAT; // ~pixels from the orbit along its short axis
        if (d < bestD) { bestD = d; best = r.id; }
      });
      return best;
    };
    let hovered: PartId | null = null;
    const move = (e: PointerEvent) => {
      const id = nearest(e);
      canvas.style.cursor = id ? 'pointer' : '';
      if (id !== hovered) { hovered = id; onHover?.(id); }
    };
    const leave = () => { canvas.style.cursor = ''; if (hovered) { hovered = null; onHover?.(null); } };
    const click = (e: PointerEvent) => { const id = nearest(e); if (id) onPick?.(id); };
    if (onHover || onPick) {
      canvas.addEventListener('pointermove', move);
      canvas.addEventListener('pointerleave', leave);
      canvas.addEventListener('pointerup', click);
    }
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); mo.disconnect();
      canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerleave', leave); canvas.removeEventListener('pointerup', click);
    };
    // Handlers are stable (useCallback in the owner); selection is read from `target` each frame.
  }, [onHover, onPick]);

  return <canvas ref={ref} aria-hidden="true" className={className} style={{ display: 'block', width: '100%', height: '100%', touchAction: 'manipulation' }} />;
}
