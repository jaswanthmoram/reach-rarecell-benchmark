import { useEffect, useRef, type CSSProperties } from 'react';

/**
 * Live dot-field: the rare-cell motif in motion. Thousands of graphite cells drift; a few signal cells pulse and a
 * cobalt ring "finds" them in turn. One canvas, theme-aware (reads CSS tokens), DPR-capped at 2, paused off-screen
 * and in hidden tabs, and a single static frame under prefers-reduced-motion.
 *
 * A layout returns points in unit space (0..1). Built-ins cover each page; a page may pass its own function.
 * ponytail: plain 2D canvas, no WebGL. Ceiling ~6k points at 60fps on a laptop; move to WebGL if a page needs more.
 */
import { LAYOUTS, mulberry, type LiveFieldKind, type LiveLayout } from './liveLayouts';

/** `still` draws the reduced-motion frame on any device (System page previews both). */
type Props = { kind?: LiveFieldKind; layout?: LiveLayout; seed?: number; className?: string; style?: CSSProperties; label?: string; intensity?: number; still?: boolean };

export function LiveField({ kind = 'embedding', layout, seed = 7, className, style, label, intensity = 1, still = false }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const pts = (layout ?? LAYOUTS[kind])(mulberry(seed)).map((p, i) => ({ ...p, ph: (i * 2.399) % (Math.PI * 2) }));
    const signals = pts.filter((p) => p.signal);
    const reduce = still || matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0, raf = 0, visible = true, t0 = performance.now();
    let colors = { cell: '#8a909c', signal: '#ff5a1f', accent: '#2f5bea' };

    const readColors = () => {
      const cs = getComputedStyle(canvas);
      colors = { cell: cs.getPropertyValue('--ink-3').trim() || colors.cell, signal: cs.getPropertyValue('--signal').trim() || colors.signal, accent: cs.getPropertyValue('--accent-ink').trim() || cs.getPropertyValue('--accent').trim() || colors.accent };
    };
    const resize = () => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr)); canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now: number) => {
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);
      const amp = reduce ? 0 : 0.004 * intensity;
      if (kind === 'forest') { ctx.strokeStyle = colors.accent; ctx.globalAlpha = 0.6; ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.moveTo(w * 0.12, h * 0.1); ctx.lineTo(w * 0.97, h * 0.1); ctx.stroke(); ctx.setLineDash([]); }
      ctx.fillStyle = colors.cell;
      for (const p of pts) {
        if (p.signal) continue;
        let x = p.x + Math.sin(t * 0.6 + p.ph) * amp;
        const y = p.y + Math.cos(t * 0.5 + p.ph * 1.3) * amp;
        if (p.vx && !reduce) x = (p.x + t * p.vx) % 1;
        ctx.globalAlpha = 0.35 + 0.35 * ((p.ph % 1) + 0.2);
        ctx.beginPath(); ctx.arc(x * w, y * h, p.r ?? 1, 0, Math.PI * 2); ctx.fill();
      }
      // Signal cells pulse; one at a time is "found" by a closing cobalt ring.
      const found = signals.length ? Math.floor(t / 1.6) % signals.length : -1;
      signals.forEach((p, i) => {
        let x = p.x; if (p.vx && !reduce) x = (p.x + t * p.vx) % 1;
        const px = x * w, py = p.y * h, pulse = reduce ? 1 : 1 + 0.18 * Math.sin(t * 3 + i);
        ctx.globalAlpha = 1; ctx.fillStyle = colors.signal;
        ctx.beginPath(); ctx.arc(px, py, (p.r ?? 2.6) * pulse, 0, Math.PI * 2); ctx.fill();
        // Skip the ring for cells too close to an edge, where it would be clipped.
        const inside = px > 22 && px < w - 22 && py > 22 && py < h - 22;
        if ((i === found || reduce) && inside) {
          const k = reduce ? 1 : Math.min(1, ((t % 1.6) / 1.6) * 2.2);
          ctx.strokeStyle = colors.accent; ctx.lineWidth = 1.6; ctx.globalAlpha = reduce ? 0.9 : 1 - Math.max(0, k - 0.85) * 4;
          ctx.beginPath(); ctx.arc(px, py, 22 - 13 * k, 0, Math.PI * 2); ctx.stroke();
        }
      });
      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => { if (visible && !document.hidden) draw(now); raf = requestAnimationFrame(loop); };
    readColors(); resize();
    if (reduce) draw(performance.now() + 900); else raf = requestAnimationFrame(loop);

    const ro = new ResizeObserver(() => { resize(); if (reduce) draw(performance.now()); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(canvas);
    const mo = new MutationObserver(() => { readColors(); if (reduce) draw(performance.now()); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); mo.disconnect(); };
  }, [kind, layout, seed, intensity, still]);

  return <canvas ref={ref} className={className} style={{ display: 'block', width: '100%', height: '100%', ...style }} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} />;
}
