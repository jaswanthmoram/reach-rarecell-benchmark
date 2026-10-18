import { useEffect, useRef, useState } from 'react';
import type { GalleryItem } from './catalog';
import { MINIS, mulberry } from './miniShapes';

/** Seconds each figure stays "developed" before the sheet moves on. */
const HOLD = 3.6;
/** Seconds for a tile to shuffle and reassemble when it becomes active. */
const DEVELOP = 1.3;

type Particle = { tile: number; tx: number; ty: number; sx: number; sy: number; r: number; tone: 'cell' | 'signal' | 'accent'; delay: number; ph: number };

const ease = (u: number) => 1 - (1 - u) ** 3;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Live contact sheet: six tiles where dots assemble into miniatures of the published figures, one tile developing
 * at a time with a counter. Each tile is a real button that opens that figure's viewer; hover or focus holds the
 * sheet on that tile. One canvas draws all six. Paused off-screen and in hidden tabs; a still, fully assembled
 * sheet under reduced motion.
 */
export function ContactSheet({ items, onOpen }: { items: GalleryItem[]; onOpen: (index: number, el: HTMLButtonElement) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tileRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [held, setHeld] = useState<number | null>(null);
  const heldRef = useRef<number | null>(null);
  const shown = held ?? active;

  useEffect(() => { heldRef.current = held; }, [held]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rand = mulberry(11);
    const parts: Particle[] = MINIS.flatMap((m, tile) => m.dots.map((d) => ({
      tile, tx: d.x, ty: d.y, sx: rand(), sy: rand(), r: d.r, tone: d.tone, delay: rand() * 0.35, ph: rand() * Math.PI * 2,
    })));
    let rects: { x: number; y: number; w: number; h: number }[] = [];
    let w = 0, h = 0, raf = 0, visible = true;
    const t0 = performance.now();
    let cur = 0, since = 0;
    // Per-tile "activity" (0 resting, 1 developed) eased toward its target every frame.
    const act: number[] = MINIS.map((_, i) => (i === 0 || reduce ? 1 : 0));
    let colors = { cell: '#8a909c', signal: '#ff5a1f', accent: '#2f5bea', line: '#cdd1d8' };

    const readColors = () => {
      const cs = getComputedStyle(canvas);
      const v = (n: string, f: string) => cs.getPropertyValue(n).trim() || f;
      colors = { cell: v('--ink-2', colors.cell), signal: v('--signal', colors.signal), accent: v('--accent', colors.accent), line: v('--line-strong', colors.line) };
    };
    const measure = () => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      const box = canvas.getBoundingClientRect();
      w = box.width; h = box.height;
      canvas.width = Math.max(1, Math.round(w * dpr)); canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Minis sit in the top of each tile, clear of the "Fig. n" label along the bottom edge.
      rects = tileRefs.current.map((el) => {
        const r = el?.getBoundingClientRect();
        return r ? { x: r.left - box.left + r.width * 0.06, y: r.top - box.top + r.height * 0.06, w: r.width * 0.88, h: r.height * 0.74 } : { x: 0, y: 0, w: 0, h: 0 };
      });
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const focus = heldRef.current ?? cur;
      act.forEach((a, i) => { act[i] = reduce ? 1 : a + ((i === focus ? 1 : 0) - a) * 0.08; });
      MINIS.forEach((m, i) => {
        const b = rects[i];
        if (!b?.w) return;
        ctx.globalAlpha = 0.5 + 0.5 * act[i];
        for (const s of m.segs) {
          ctx.strokeStyle = s.tone === 'accent' ? colors.accent : colors.line;
          ctx.lineWidth = 1;
          ctx.setLineDash(s.dash ? [3, 3] : []);
          ctx.beginPath(); ctx.moveTo(b.x + s.x1 * b.w, b.y + s.y1 * b.h); ctx.lineTo(b.x + s.x2 * b.w, b.y + s.y2 * b.h); ctx.stroke();
        }
      });
      ctx.setLineDash([]);
      const scale = rects[0]?.w ? Math.min(2, Math.max(0.9, rects[0].w / 110)) : 1;
      for (const p of parts) {
        const b = rects[p.tile];
        if (!b?.w) continue;
        // First load: every tile assembles from scatter in turn. Afterwards the active tile shuffles out and back.
        const intro = reduce ? 1 : ease(clamp01((t - p.tile * 0.18 - p.delay) / DEVELOP));
        let k = 1 - intro;
        if (!reduce && p.tile === cur && t > 2) {
          const u = clamp01((since - p.delay * 0.6) / DEVELOP);
          k = Math.max(k, Math.sin(Math.PI * u) * 0.55);
        }
        const drift = reduce ? 0 : 0.004;
        const x = p.tx + (p.sx - p.tx) * k + Math.sin(t * 0.7 + p.ph) * drift;
        const y = p.ty + (p.sy - p.ty) * k + Math.cos(t * 0.6 + p.ph) * drift;
        const a = act[p.tile];
        ctx.globalAlpha = p.tone === 'cell' ? 0.45 + 0.5 * a : 0.6 + 0.4 * a;
        ctx.fillStyle = p.tone === 'signal' ? colors.signal : p.tone === 'accent' && a > 0.5 ? colors.accent : colors.cell;
        ctx.beginPath(); ctx.arc(b.x + x * b.w, b.y + y * b.h, p.r * scale, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    let last = t0;
    const loop = (now: number) => {
      const dt = (now - last) / 1000; last = now;
      if (visible && !document.hidden) {
        // A held tile freezes the cycle; on release the current figure gets a full hold again.
        if (heldRef.current !== null) since = 0;
        else {
          since += dt;
          if (since > HOLD) { cur = (cur + 1) % MINIS.length; since = 0; setActive(cur); }
        }
        draw((now - t0) / 1000);
      }
      raf = requestAnimationFrame(loop);
    };

    readColors(); measure();
    if (reduce) draw(10); else raf = requestAnimationFrame(loop);

    const ro = new ResizeObserver(() => { measure(); if (reduce) draw(10); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(canvas);
    const mo = new MutationObserver(() => { readColors(); if (reduce) draw(10); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onScheme = () => { readColors(); if (reduce) draw(10); };
    mq.addEventListener('change', onScheme);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); mo.disconnect(); mq.removeEventListener('change', onScheme); };
  }, []);

  const f = items[shown];
  return (
    <div className="rise overflow-hidden rounded-card border border-line bg-surface/90 shadow-[0_1px_0_var(--line)] [animation-delay:120ms]">
      <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
        <p className="min-w-0 truncate text-sm text-ink">
          <span className="mr-2 font-mono text-xs text-ink-2 tabular">Figure {f.n} / {items.length}</span>
          {f.title}
        </p>
        <div aria-hidden="true" className="flex shrink-0 gap-1">
          {items.map((it, i) => (
            <span key={it.id} className="h-1 w-4 overflow-hidden rounded-full bg-line">
              <span className={`block h-full origin-left rounded-full ${i === shown ? 'bg-accent' : i < shown ? 'bg-ink-3' : ''} ${i === shown && held === null ? 'motion-safe:[animation:cs-fill_3.6s_linear_both]' : ''}`} key={`${it.id}-${active}`} />
            </span>
          ))}
        </div>
      </div>
      <div className="relative">
        <ul className="relative grid grid-cols-3 gap-px bg-line" onMouseLeave={() => setHeld(null)}>
          {items.map((it, i) => (
            <li key={it.id} className="bg-surface/80">
              <button type="button" ref={(el) => { tileRefs.current[i] = el; }}
                onClick={(e) => onOpen(i, e.currentTarget)}
                onMouseEnter={() => setHeld(i)} onFocus={() => setHeld(i)} onBlur={() => setHeld(null)}
                aria-label={`Open Figure ${it.n}: ${it.title}`}
                className={`group relative block aspect-[4/3] w-full outline-none transition-colors duration-150 hover:bg-accent-tint/40 focus-visible:bg-accent-tint/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${i === shown ? 'bg-accent-tint/25' : ''}`}>
                <span className={`absolute bottom-1.5 left-2 font-mono text-[11px] tabular transition-colors duration-150 ${i === shown ? 'text-accent' : 'text-ink-3 group-hover:text-ink-2'}`}>
                  Fig. {it.n}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {/* Drawn over the tile backgrounds; pointer events pass through to the buttons. */}
        <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 block h-full w-full" />
      </div>
      <style>{'@keyframes cs-fill{from{transform:scaleX(0)}to{transform:scaleX(1)}}'}</style>
    </div>
  );
}
