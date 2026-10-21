/* Deterministic hero lane scenes (ported from the P03 board's laneDots), one per track.
 * The strip runs full-bleed, so each scene is denser than the board's card version. */

export interface LaneDot { x: number; y: number; r: number; kind: '' | 'sig' | 'faint' | 'jit' | 'flip'; delay: number }
export interface LaneScene { dots: LaneDot[]; rings: LaneDot[] }

const lcg = (seed: number) => {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
};

function laneScene(i: number): LaneScene {
  const r = lcg(7 + i * 101);
  const g = () => (r() + r() + r() - 1.5) * 0.9;
  const half: LaneDot[] = [];
  const add = (x: number, y: number, rad: number, kind: LaneDot['kind'] = '', delay = 0) =>
    half.push({ x, y: Math.max(12, Math.min(88, y)), r: rad, kind, delay });
  const scatter = (n: number) => { for (let k = 0; k < n; k++) add(r() * 50, 50 + g() * 40, 2 + r() * 1.5); };

  if (i === 0) { scatter(56); add(11, 42, 5, 'sig'); add(12, 60, 5, 'sig'); add(36, 52, 5, 'sig'); }
  if (i === 1) { for (let c = 0; c < 28; c++) for (let row = 0; row < 3; row++) add(c * 1.78 + 0.5, 26 + row * 24, 2.4, 'jit', ((c * 3 + row) % 7) * 0.13); add(21, 50, 5, 'sig'); }
  if (i === 2) scatter(56);
  if (i === 3) {
    for (let k = 0; k < 8; k++) { const cx = k * 6.2 + 2 + r() * 2, cy = 50 + g() * 25; for (let j = 0; j < 6; j++) add(cx + g() * 2, cy + g() * 18, 2 + r() * 1.8); }
    add(17, 72, 5, 'sig'); add(41, 30, 5, 'sig');
  }
  if (i === 4) { scatter(46); add(8, 46, 5, 'sig'); add(31, 58, 5, 'sig'); for (let k = 0; k < 6; k++) add(4 + k * 8 + r() * 2, 50 + g() * 30, 4, 'flip', k * 0.6); }
  if (i === 5) { for (let k = 0; k < 64; k++) { const x = k * 0.78; add(x, 50 + Math.sin((x / 50) * Math.PI * 2.4) * 28 + g() * 6, 2.4, k % 17 === 5 ? 'faint' : ''); } }

  // The track is 200% wide and slides by half, so the second copy makes the loop seamless.
  const dots = [...half, ...half.map((d) => ({ ...d, x: d.x + 50 }))];
  const first = half.find((d) => d.kind === 'sig');
  return { dots, rings: first ? [first, { ...first, x: first.x + 50 }] : [] };
}

export const LANE_SCENES: LaneScene[] = Array.from({ length: 6 }, (_, i) => laneScene(i));
/** Seconds per loop; the full-bleed strip is about twice the board card, so loops are slower to keep the pace. */
export const LANE_SPEEDS = [42, 54, 60, 80, 48, 70];


/* Lanes are drawn as CSS mask images on colour layers: rasterised once, no element and no per-frame style work per dot
 * while the stream, jitter and flip layers move. The track box is 200% x 44 px, so the viewBox stretches; zero-length
 * round-capped segments with a non-scaling stroke keep every dot round at its own pixel size. */
const dotSvg = (ds: readonly LaneDot[], opacity = 1) => ds.map((d) =>
  `<path d='M${+d.x.toFixed(2)} ${+d.y.toFixed(2)}h0' fill='none' stroke='#000' stroke-linecap='round' stroke-width='${d.r}' stroke-opacity='${opacity}' vector-effect='non-scaling-stroke'/>`).join('');
const maskUrl = (inner: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'>${inner}</svg>`)}")`;
/** Faint dots: signal colour at half strength, carried by the mask's alpha. */
const FAINT_ALPHA = 0.5;

/** A mask layer: one colour, one `url(...)` mask, and (for moving layers) its animation delay in seconds. */
export interface MaskLayer { tone: 'cell' | 'sig'; mask: string; delay: number }
/** One lane, pre-drawn: two still layers plus a few moving ones, instead of one element (and loop) per dot. */
export interface LaneArt { still: MaskLayer[]; jit: MaskLayer[]; flip: MaskLayer[]; rings: LaneDot[] }

const JIT_PHASES = 3;
const JIT_STEP_S = 0.3;
/** Lane B's dots had seven phase offsets 0.13 s apart; they are folded into three jitter layers. */
const JIT_PHASE_S = 0.13;

function laneArt(scene: LaneScene): LaneArt {
  const of = (k: LaneDot['kind']) => scene.dots.filter((d) => d.kind === k);
  const jitDots = of('jit');
  const jit = jitDots.length === 0 ? [] : Array.from({ length: JIT_PHASES }, (_, p) => ({
    tone: 'cell' as const,
    mask: maskUrl(dotSvg(jitDots.filter((d) => Math.round(d.delay / JIT_PHASE_S) % JIT_PHASES === p))),
    delay: p * JIT_STEP_S,
  }));
  const flips = of('flip');
  const flip = [...new Set(flips.map((d) => d.delay))]
    .map((delay) => ({ tone: 'sig' as const, mask: maskUrl(dotSvg(flips.filter((d) => d.delay === delay))), delay }));
  const sigInner = dotSvg(of('faint'), FAINT_ALPHA) + dotSvg(of('sig'));
  return {
    // Flip dots rest grey (their layer flips signal in on top); signal and faint dots draw over the cells.
    still: [
      { tone: 'cell', mask: maskUrl(dotSvg([...of(''), ...flips])), delay: 0 },
      ...(sigInner ? [{ tone: 'sig' as const, mask: maskUrl(sigInner), delay: 0 }] : []),
    ],
    jit, flip, rings: scene.rings,
  };
}

export const LANE_ART: LaneArt[] = LANE_SCENES.map(laneArt);
