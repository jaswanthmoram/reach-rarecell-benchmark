import { useSyncExternalStore } from 'react';
import { GLOBAL_STATS as G, LEADERBOARD_DATA } from '../../data/benchmarkData';
import { Button, Container, ICON_NAMES, LAYOUTS, LiveField, type LiveLayout, type LivePoint } from '../../ui';

/**
 * System hero: the `grid` specimen board, alive. Eighteen tiles of rising cell density breathe in a slow wave
 * (an opacity veil per tile), four rare signal cells are found in turn by the cobalt ring, and a sparse far field
 * drifts behind the board. Desktop: the board is the right half of the hero, behind a canvas scrim that keeps the
 * text column calm. Phones: the board is its own 200px band under the text, so nothing sits behind the words.
 * Same layer order as LiveHero (field, then scrim, then content); composed here because LiveHero's scrim is
 * horizontal at every width, which would hide most of the board on a phone.
 */
type Tile = { x: number; y: number; w: number; h: number; col: number; row: number };
const COLS = 6, ROWS = 3;
const SIGNAL_TILES = [3, 8, 13, 16];

function boardTiles(narrow: boolean): Tile[] {
  const [x0, x1, y0, y1] = narrow ? [0.04, 0.96, 0.08, 0.78] : [0.535, 0.965, 0.14, 0.86];
  const gx = narrow ? 0.022 : 0.012, gy = 0.05;
  const w = (x1 - x0 - gx * (COLS - 1)) / COLS, h = (y1 - y0 - gy * (ROWS - 1)) / ROWS;
  return Array.from({ length: COLS * ROWS }, (_, i) => {
    const col = i % COLS, row = Math.floor(i / COLS);
    return { x: x0 + col * (w + gx), y: y0 + row * (h + gy), w, h, col, row };
  });
}

const boardLayout = (narrow: boolean): LiveLayout => (r) => {
  const out: LivePoint[] = [];
  boardTiles(narrow).forEach((t, i) => {
    // Density rises left to right (about 12 to 200 cells); lower rows carry larger cells.
    const n = Math.round(12 * 1.75 ** t.col * (narrow ? 0.5 : 1));
    for (let k = 0; k < n; k++) out.push({ x: t.x + r() * t.w, y: t.y + r() * t.h, r: 0.7 + t.row * 0.35 + r() * 0.5 });
    if (SIGNAL_TILES.includes(i)) out.push({ x: t.x + t.w * (0.3 + r() * 0.4), y: t.y + t.h * (0.3 + r() * 0.4), r: 2.8, signal: true });
  });
  // ponytail: far field only on wide screens; on a phone the band is the board alone.
  if (!narrow) for (let k = 0; k < 220; k++) out.push({ x: r(), y: r(), r: 0.5 + r() * 0.4, vx: 0.003 + r() * 0.004 });
  return out;
};

const WIDE = { tiles: boardTiles(false), layout: boardLayout(false) };
const NARROW = { tiles: boardTiles(true), layout: boardLayout(true) };

const NARROW_MQ = '(max-width: 767.98px)';
const subscribe = (cb: () => void) => { const mq = matchMedia(NARROW_MQ); mq.addEventListener('change', cb); return () => mq.removeEventListener('change', cb); };
const useNarrow = () => useSyncExternalStore(subscribe, () => matchMedia(NARROW_MQ).matches, () => false);

// Opacity-only breathing wave across the board. Hidden entirely under reduced motion.
const BREATHE = '@keyframes sys-breathe { 0%, 100% { opacity: 0 } 50% { opacity: .72 } }';

export function SystemHero({ onJump }: { onJump: (id: string) => void }) {
  const board = useNarrow() ? NARROW : WIDE;
  return (
    <section aria-labelledby="system-title" className="relative isolate overflow-hidden border-b border-line">
      <style>{BREATHE}</style>
      <Container className="relative py-8 md:py-14">
        <div className="rise min-w-0 max-w-[540px]">
          <p className="label mb-3">System · {G.version}</p>
          <h1 id="system-title" className="balance text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] text-ink md:text-[2.5rem]">The REACH design system</h1>
          <p className="mt-3 max-w-[54ch] text-base leading-relaxed text-ink-2">
            Brand, tokens, icons, live fields and every component, running, with the rules each page follows.
            Real data first, hairlines, one accent, one signal.
          </p>
          <p className="mt-4 font-mono text-xs text-ink-2 tabular">
            {ICON_NAMES.length} icons · {LEADERBOARD_DATA.length} method colours · {Object.keys(LAYOUTS).length} live fields
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" iconRight="caret-down" onClick={() => onJump('live-fields')}>See the live fields</Button>
            <Button size="sm" variant="ghost" onClick={() => onJump('components')}>Components</Button>
          </div>
        </div>
      </Container>

      <div aria-hidden="true" className="pointer-events-none relative -z-10 h-[200px] border-t border-line md:absolute md:inset-0 md:h-auto md:border-0">
        <LiveField layout={board.layout} seed={9} intensity={0.8} className="absolute inset-0" />
        {board.tiles.map((t, i) => (
          <span key={i} className="absolute bg-canvas opacity-0 motion-reduce:hidden"
            style={{
              // A feathered veil, larger than the tile, so no rectangle edge ever shows against the far field.
              left: `${(t.x - t.w * 0.2) * 100}%`, top: `${(t.y - t.h * 0.2) * 100}%`, width: `${t.w * 140}%`, height: `${t.h * 140}%`,
              maskImage: 'radial-gradient(closest-side, #000 45%, transparent)',
              animation: `sys-breathe 6.4s ease-in-out ${-(t.col * 0.55 + t.row * 1.3)}s infinite`,
            }} />
        ))}
        {/* Readability scrim, wide screens only: the text column sits on plain canvas. */}
        <span className="absolute inset-0 hidden bg-[linear-gradient(90deg,var(--canvas)_0%,var(--canvas)_42%,transparent_54%)] md:block" />
        {/* Caption on the container's right edge, in the free strip under the board, so it never sits on dots. */}
        <Container className="absolute inset-x-0 bottom-2.5 flex justify-end md:bottom-4">
          <span className="label">LiveField · grid · {board.tiles.length} specimens</span>
        </Container>
      </div>
    </section>
  );
}
