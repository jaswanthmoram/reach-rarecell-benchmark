import { useEffect, useRef } from 'react';
import { createProgram, readTokens } from './shader';

/*
 * The WebGL half of ShaderBackdrop. Lazy chunk: only ShaderBackdrop imports it, through React.lazy.
 * Draws one frame on mount and on resize; animates at <= 30fps only while `running` (on screen, tab visible,
 * motion allowed, >= 768px). DPR capped at 2.
 */

export interface ShaderCanvasProps {
  running: boolean;
  intensity: number;
  hints: [number, number];
  dot: number;
  onReady: () => void;
  onFail: () => void;
}

/** 30fps cap (one draw, then a timer for most of the next frame budget). */
const FRAME_MS = 1000 / 30;
/** Wake this long before the frame is due, so the rAF that follows lands on the next vsync. */
const VSYNC_LEAD_MS = 8;
const MAX_DPR = 2;

interface GlState {
  gl: WebGLRenderingContext;
  u: Record<string, WebGLUniformLocation | null>;
  dpr: number;
}

const UNIFORMS = ['u_res', 'u_time', 'u_dpr', 'u_intensity', 'u_dot', 'u_hints', 'u_base', 'u_ink', 'u_cobalt', 'u_signal'];

export default function ShaderCanvas({ running, intensity, hints, dot, onReady, onFail }: ShaderCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef<GlState | null>(null);
  const time = useRef(0);
  const params = useRef({ intensity, hints, dot });
  const callbacks = useRef({ onReady, onFail });

  const draw = () => {
    const s = state.current;
    if (!s) return;
    const { gl, u } = s;
    const p = params.current;
    gl.uniform1f(u.u_time, time.current);
    gl.uniform1f(u.u_intensity, Math.min(1, Math.max(0, p.intensity)));
    gl.uniform1f(u.u_dot, p.dot);
    gl.uniform2f(u.u_hints, p.hints[0], p.hints[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
    const prog = gl ? createProgram(gl) : null;
    if (!gl || !prog) { callbacks.current.onFail(); return; }
    const u = Object.fromEntries(UNIFORMS.map((n) => [n, gl.getUniformLocation(prog, n)]));
    const tokens = readTokens();
    gl.uniform3fv(u.u_base, tokens.base);
    gl.uniform3fv(u.u_ink, tokens.ink);
    gl.uniform3fv(u.u_cobalt, tokens.cobalt);
    gl.uniform3fv(u.u_signal, tokens.signal);
    state.current = { gl, u, dpr: 1 };
    time.current = Math.random() * 40; // a different field on every page view

    const resize = () => {
      const s = state.current;
      if (!s) return;
      const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      s.dpr = dpr;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(u.u_res, w, h);
      gl.uniform1f(u.u_dpr, dpr);
      draw();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    callbacks.current.onReady();

    const lost = (e: Event) => { e.preventDefault(); state.current = null; callbacks.current.onFail(); };
    canvas.addEventListener('webglcontextlost', lost);
    return () => {
      ro.disconnect();
      canvas.removeEventListener('webglcontextlost', lost);
      state.current = null;
      // No loseContext() here: StrictMode re-runs this effect on the same canvas, and a lost context cannot be reused.
      // The context goes with the canvas element when it unmounts.
    };
  }, []); // draw reads refs only; the context is created once per mount

  // Keep the latest props for the loop; while still, repaint the one frame when they change.
  useEffect(() => {
    params.current = { intensity, hints, dot };
    callbacks.current = { onReady, onFail };
    if (!running) draw();
  });

  useEffect(() => {
    if (!running) return;
    // ~30 fps without 60 rAF callbacks a second: after a frame, wait out most of the budget, then take the next vsync.
    let raf = 0;
    let timer = 0;
    let last = performance.now();
    const tick = (now: number) => {
      // Timed from when this callback runs, not from the rAF timestamp: that is the frame's start, which can be most
      // of a frame earlier, and the timer would then always land in time for the very next frame (60 a second).
      const began = performance.now();
      time.current += Math.min(now - last, 100) / 1000; // resume where it stopped, no jump after a pause
      last = now;
      draw();
      const wait = Math.max(0, FRAME_MS - VSYNC_LEAD_MS - (performance.now() - began));
      timer = window.setTimeout(() => { raf = requestAnimationFrame(tick); }, wait);
    };
    raf = requestAnimationFrame(tick);
    return () => { window.clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [running]); // draw reads refs only

  return <canvas ref={canvasRef} className="fx-shader-canvas" aria-hidden="true" />;
}
