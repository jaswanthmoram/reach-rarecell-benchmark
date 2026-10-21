/*
 * GLSL and palette helpers for ShaderCanvas (lazy chunk only: nothing in the main chunk imports this file).
 * The field: a slow fbm noise drift in the canvas colour, graphite dots whose size follows the noise (the
 * site's dot-field identity), and two optional soft hints (cobalt, vermilion). Every mix is capped by
 * u_intensity so text on top stays AA (see design/DESIGN-r9.md, "Shader contrast budget").
 */

export const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

export const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 u_res;
uniform float u_time;
uniform float u_dpr;
uniform float u_intensity;
uniform float u_dot;
uniform vec2 u_hints;
uniform vec3 u_base;
uniform vec3 u_ink;
uniform vec3 u_cobalt;
uniform vec3 u_signal;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) { float v = 0.0; float a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }

void main() {
  vec2 px = gl_FragCoord.xy / u_dpr;
  vec2 uv = px / 380.0;
  float t = u_time * 0.035;
  float n = fbm(uv + vec2(t, -t * 0.6));
  float m = fbm(uv * 0.65 - vec2(t * 0.45, t * 0.25) + 7.3);
  vec3 col = u_base;
  col = mix(col, u_ink, u_intensity * 0.05 * smoothstep(0.35, 0.85, n));
  col = mix(col, u_cobalt, u_hints.x * u_intensity * 0.12 * smoothstep(0.55, 0.9, m));
  col = mix(col, u_signal, u_hints.y * u_intensity * 0.08 * smoothstep(0.66, 0.95, 1.0 - m));
  vec2 g = (fract(px / u_dot) - 0.5) * u_dot;
  float r = mix(0.35, 1.25, n);
  float dotA = (1.0 - smoothstep(r - 0.6, r + 0.6, length(g))) * smoothstep(0.3, 0.8, n);
  col = mix(col, u_ink, dotA * u_intensity * 0.2);
  gl_FragColor = vec4(col, 1.0);
}
`;

export type Rgb = [number, number, number];

/** '#4a5160' or '#fff' to 0..1 floats; anything else returns the fallback. */
export function hexToRgb(value: string, fallback: Rgb): Rgb {
  const hex = value.trim().replace('#', '');
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  if (!/^[0-9a-f]{6}$/i.test(full)) return fallback;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255) as Rgb;
}

/** The token colours the field is drawn in, read once from :root. */
export function readTokens() {
  const css = getComputedStyle(document.documentElement);
  const get = (name: string, fallback: Rgb) => hexToRgb(css.getPropertyValue(name), fallback);
  return {
    base: get('--canvas', [0.98, 0.98, 0.98]),
    ink: get('--ink-2', [0.29, 0.318, 0.376]),
    cobalt: get('--accent', [0.184, 0.357, 0.918]),
    signal: get('--signal', [1, 0.353, 0.122]),
  };
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return sh;
  gl.deleteShader(sh);
  return null;
}

/** Link the full-screen-triangle program; null when the driver refuses it (the caller falls back to CSS). */
export function createProgram(gl: WebGLRenderingContext) {
  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  const prog = gl.createProgram();
  if (!vs || !fs || !prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  return prog;
}
