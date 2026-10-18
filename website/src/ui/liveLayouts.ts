/** Built-in LiveField layouts: points in unit space (0..1). Seeded, so a seed always draws the same field. */
export type LivePoint = { x: number; y: number; r?: number; signal?: boolean; group?: number; vx?: number };
export type LiveLayout = (rand: () => number) => LivePoint[];
export type LiveFieldKind = 'embedding' | 'lanes' | 'forest' | 'specimens' | 'flow' | 'rings' | 'grid' | 'paths';

export const mulberry = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r());

export const LAYOUTS: Record<LiveFieldKind, LiveLayout> = {
  // UMAP-like clusters (ten cohorts), a handful of rare signal cells inside two clusters.
  embedding: (r) => {
    const out: LivePoint[] = [];
    const centres = Array.from({ length: 10 }, (_, i) => ({ x: 0.5 + 0.42 * Math.cos(i * 0.71 + 0.4) * (0.55 + r() * 0.45), y: 0.5 + 0.38 * Math.sin(i * 0.93 + 1.1) * (0.6 + r() * 0.4), s: 0.03 + r() * 0.05 }));
    centres.forEach((c, g) => { for (let i = 0; i < 260; i++) out.push({ x: c.x + gauss(r) * c.s * 1.4, y: c.y + gauss(r) * c.s, r: 0.7 + r() * 1.1, group: g }); });
    for (let i = 0; i < 9; i++) { const c = centres[i % 3]; out.push({ x: c.x + gauss(r) * c.s * 0.6, y: c.y + gauss(r) * c.s * 0.6, r: 2.6, signal: true }); }
    return out;
  },
  // Six experimental lanes; cells stream left to right at lane-specific speeds.
  lanes: (r) => {
    const out: LivePoint[] = [];
    for (let l = 0; l < 6; l++) for (let i = 0; i < 180; i++) out.push({ x: r(), y: (l + 0.5) / 6 + gauss(r) * 0.02, r: 0.8 + r(), group: l, vx: 0.012 + l * 0.004 });
    for (let l = 0; l < 6; l++) if (l !== 2) out.push({ x: r(), y: (l + 0.5) / 6, r: 2.6, signal: true, group: l, vx: 0.012 + l * 0.004 });
    return out;
  },
  // Forest plot: six interval clouds under a dashed ceiling line (drawn by the renderer for this kind).
  forest: (r) => {
    const out: LivePoint[] = []; const means = [0.36, 0.26, 0.32, 0.25, 0.23, 0.03];
    means.forEach((m, k) => { for (let i = 0; i < 160; i++) out.push({ x: 0.15 + (m + gauss(r) * 0.045) * 0.8, y: 0.22 + k * 0.12 + gauss(r) * 0.012, r: 0.8 + r() * 0.8, group: k }); });
    out.push({ x: 0.15 + 0.999 * 0.8, y: 0.1, r: 2.8, signal: true });
    return out;
  },
  // Ten specimen wells, each with its own density and one or two rare cells.
  specimens: (r) => {
    const out: LivePoint[] = [];
    for (let w = 0; w < 10; w++) {
      const cx = 0.14 + (w % 5) * 0.18, cy = w < 5 ? 0.3 : 0.72, n = 40 + Math.floor(r() * 160);
      for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.075; out.push({ x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d * 1.6, r: 0.7 + r() * 0.9, group: w }); }
      out.push({ x: cx + gauss(r) * 0.02, y: cy + gauss(r) * 0.03, r: 2.6, signal: true, group: w });
    }
    return out;
  },
  // Pipeline: cells flow through twelve stages; density thins as cells are filtered.
  flow: (r) => {
    const out: LivePoint[] = [];
    for (let i = 0; i < 900; i++) { const x = r(); out.push({ x, y: 0.5 + gauss(r) * 0.16 * (1 - x * 0.6), r: 0.7 + r(), vx: 0.02 + r() * 0.01 }); }
    for (let i = 0; i < 6; i++) out.push({ x: r(), y: 0.5 + gauss(r) * 0.05, r: 2.6, signal: true, vx: 0.022 });
    return out;
  },
  // One found cell, cited by concentric rings of orbiting cells.
  rings: (r) => {
    const out: LivePoint[] = [{ x: 0.5, y: 0.5, r: 4, signal: true }];
    for (let k = 1; k <= 6; k++) for (let i = 0; i < 26 + k * 14; i++) { const a = (i / (26 + k * 14)) * Math.PI * 2 + r() * 0.05; out.push({ x: 0.5 + Math.cos(a) * k * 0.065, y: 0.5 + Math.sin(a) * k * 0.115, r: 0.7 + r() * 0.6, group: k }); }
    return out;
  },
  // Specimen board of densities (design system).
  grid: (r) => {
    const out: LivePoint[] = [];
    for (let c = 0; c < 6; c++) for (let row = 0; row < 3; row++) { const n = 8 + (c + row * 6) * 7; for (let i = 0; i < n; i++) out.push({ x: 0.08 + c * 0.155 + r() * 0.12, y: 0.1 + row * 0.3 + r() * 0.22, r: 0.8 + r() * 0.8, group: c }); }
    out.push({ x: 0.7, y: 0.45, r: 2.8, signal: true });
    return out;
  },
  // Three journeys diverging through a field.
  paths: (r) => {
    const out: LivePoint[] = [];
    for (let i = 0; i < 700; i++) out.push({ x: r(), y: r(), r: 0.6 + r() * 0.8 });
    for (let p = 0; p < 3; p++) for (let i = 0; i < 60; i++) { const t = i / 60; out.push({ x: 0.08 + t * 0.85, y: 0.5 + (p - 1) * t * t * 0.38 + gauss(r) * 0.01, r: 1.4, group: 100 + p }); }
    for (let p = 0; p < 3; p++) out.push({ x: 0.93, y: 0.5 + (p - 1) * 0.38, r: 2.8, signal: true });
    return out;
  },
};

