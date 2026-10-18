/*
 * Data behind the live hero. Ten cohorts become ten cell clouds (size from QC-filtered cell count, log scale),
 * each holding three rare malignant cells. When a method is highlighted, the number of rare cells it rings in a
 * cohort is round(3 × that method's mean AP on that cohort) (DATASET_METHOD_MATRIX). Illustrative, not per-cell output.
 */
import { DATASETS_DATA, DATASET_METHOD_MATRIX } from '../../data/benchmarkData';
import type { LiveLayout } from '../../ui';

export const RARE_PER_COHORT = 3;

export type Cell = { x: number; y: number; r: number; ph: number; cohort: number };
export type Rare = { x: number; y: number; cohort: number; slot: number };
export type Cohort = { id: string; x: number; y: number; sx: number; sy: number; n: number };

const rng = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r());

/* Hand-placed cloud centres in scene space (0..1); the field maps the scene into whatever area its canvas gives it. */
const SPOTS: [number, number][] = [
  [0.14, 0.14], [0.42, 0.04], [0.74, 0.10], [0.95, 0.42], [0.64, 0.42],
  [0.32, 0.50], [0.05, 0.68], [0.52, 0.80], [0.88, 0.80], [0.22, 0.96],
];

function build() {
  const r = rng(11);
  const max = Math.log10(Math.max(...DATASETS_DATA.map((d) => d.cellsNum)));
  const cohorts: Cohort[] = DATASETS_DATA.slice(0, SPOTS.length).map((d, i) => {
    const size = (Math.log10(d.cellsNum) / max) ** 4;
    const s = 0.035 + 0.05 * size;
    return { id: d.id, x: SPOTS[i][0], y: SPOTS[i][1], sx: s * (1 + r() * 0.4), sy: s * (0.75 + r() * 0.35), n: Math.round(110 + 520 * size) };
  });
  const cells: Cell[] = [];
  const rare: Rare[] = [];
  cohorts.forEach((c, k) => {
    const tilt = (r() - 0.5) * 1.2;
    for (let i = 0; i < c.n; i++) {
      const u = gauss(r) * c.sx, v = gauss(r) * c.sy;
      cells.push({ x: c.x + u * Math.cos(tilt) - v * Math.sin(tilt), y: c.y + u * Math.sin(tilt) + v * Math.cos(tilt), r: 0.6 + r() * 1.1, ph: r() * Math.PI * 2, cohort: k });
    }
    for (let s = 0; s < RARE_PER_COHORT; s++) rare.push({ x: c.x + gauss(r) * c.sx * 0.55, y: c.y + gauss(r) * c.sy * 0.55, cohort: k, slot: s });
  });
  return { cohorts, cells, rare };
}

export const SCENE = build();

/** Rare cells a method rings: per cohort, round(3 × mean AP), taking that cohort's slots in a method-specific order. */
export function foundBy(method: string): Set<number> {
  const out = new Set<number>();
  const seed = [...method].reduce((a, ch) => a + ch.charCodeAt(0), 0);
  SCENE.cohorts.forEach((c, k) => {
    const row = DATASET_METHOD_MATRIX.find((m) => m.dataset === c.id && m.method.toLowerCase() === method.toLowerCase());
    const n = Math.round(RARE_PER_COHORT * (row?.meanAP ?? 0));
    for (let j = 0; j < n; j++) out.add(k * RARE_PER_COHORT + ((seed + k + j) % RARE_PER_COHORT));
  });
  return out;
}

/** Far layer for the shared LiveField: a sparse, slow haze of cells across the whole stage, no signal cells. */
export const FAR_FIELD: LiveLayout = (r) => Array.from({ length: 520 }, () => ({ x: r(), y: r(), r: 0.5 + r() * 0.7 }));
