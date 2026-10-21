import type { CSSProperties } from 'react';
import { GLOBAL_STATS as G } from '../../data/benchmarkData';
import { cx } from '../../lib/format';
import { href, preloadRoute } from '../../lib/router';
import { ArrowRight, ICON_STROKE } from '../../ui/icons';
import { CountUp, useLoopGate } from '../../ui/motion';
import { PageHeader } from '../../ui/PageHeader';
import { LANE_ART, LANE_SPEEDS, type MaskLayer } from './lanes';
import { TRACKS, trackOf, type Letter } from './model';

interface HeroProps { active: Letter; onPick: (l: Letter) => void; onShowA: () => void }

const layerStyle = (l: MaskLayer): CSSProperties => ({ maskImage: l.mask, WebkitMaskImage: l.mask, animationDelay: l.delay ? `${l.delay}s` : undefined });
/** Null (C) and same-lineage (F) lanes have nothing a detector can find: the ring searches and misses. */
const SEARCHES_EMPTY = new Set<Letter>(['C', 'F']);

/** One lane per track inside the hero instrument: the whole lane is the button; the units count sits on the right. */
function Lane({ letter, index, on, onPick }: { letter: Letter; index: number; on: boolean; onPick: (l: Letter) => void }) {
  const t = trackOf(letter);
  const art = LANE_ART[index];
  const empty = SEARCHES_EMPTY.has(letter);
  return (
    <button type="button" onClick={() => onPick(letter)} aria-pressed={on} aria-label={`Show Track ${letter}: ${t.short}, ${t.units} units`}
      className={cx('tr-lane group relative block h-11 w-full cursor-pointer overflow-hidden border-0 bg-transparent p-0 text-left focus-visible:outline-offset-[-2px]',
        index > 0 && 'border-t border-line')}>
      <span aria-hidden="true" className="tr-band absolute inset-0 bg-[rgba(47,91,234,0.06)]" style={{ opacity: on ? 1 : 0 }} />
      <span aria-hidden="true" className={cx('tr-scene absolute inset-0', on ? 'opacity-100' : 'opacity-30 group-hover:opacity-60')}>
        <span className="tr-track loop" style={{ animationDuration: `${LANE_SPEEDS[index]}s` }}>
          {art.still.map((l, k) => <span key={`s${k}`} className={`tr-mask tr-tone-${l.tone}`} style={layerStyle(l)} />)}
          {art.jit.map((l, k) => <span key={`j${k}`} className={`tr-mask tr-jit tr-tone-${l.tone}`} style={layerStyle(l)} />)}
          {art.flip.map((l, k) => <span key={`f${k}`} className={`tr-mask tr-flip tr-tone-${l.tone}`} style={layerStyle(l)} />)}
          {on && !empty && art.rings.map((g, k) => <span key={`r${k}`} className="tr-ring loop" style={{ left: `${g.x}%`, top: `${g.y}%` }} />)}
        </span>
        {on && empty && (
          <>
            <span className="tr-miss loop" style={{ left: '38%', top: '50%' }} />
            <span className="tr-miss loop" style={{ left: '71%', top: '40%', animationDelay: '0.9s' }} />
          </>
        )}
      </span>
      <span aria-hidden="true" className="relative flex h-full items-center justify-between gap-3 px-3 sm:px-4">
        <span className={cx('inline-flex items-center gap-2 rounded-chip border bg-[rgba(255,255,255,0.92)] py-0.5 pl-1 pr-2.5 transition-[border-color] duration-[var(--dur-1)]',
          on ? 'border-[rgba(47,91,234,0.45)]' : 'border-line group-hover:border-line-strong')}>
          <span className={cx('inline-grid size-5 place-items-center rounded-[3px] font-mono text-[11px] font-semibold', on ? 'bg-accent text-white' : 'bg-canvas text-ink-2')}>{letter}</span>
          <span className={cx('text-[13px]', on ? 'font-medium text-ink' : 'text-ink-2 group-hover:text-ink')}>{t.short}</span>
        </span>
        <span className={cx('tabular rounded-chip bg-[rgba(255,255,255,0.92)] px-1.5 font-mono text-[11px]', on ? 'text-ink' : 'text-ink-3')}>{t.units}</span>
      </span>
    </button>
  );
}

/** Tracks hero: the shared PageHeader with the six lanes as its art, a contained instrument card that balances the headline. */
export function Hero({ active, onPick, onShowA }: HeroProps) {
  // One gate for all lane loops: off screen, hidden tab, Pause motion or reduced motion hold them (data-loop, app.css).
  const { ref, loopProps } = useLoopGate<HTMLElement>();
  const cur = trackOf(active);
  const lanes = (
    <figure ref={ref} {...loopProps} className="tr-strip card fx-hairline-gradient m-0 shadow-[var(--elev-1)]">
      <div aria-hidden="true" className="flex items-baseline justify-between gap-3 border-b border-line px-3 py-2.5 sm:px-4">
        <span className="text-[13px] font-medium text-ink">Pick a track</span>
        <span className="font-mono text-[11px] text-ink-3">units per method</span>
      </div>
      <div role="group" aria-label="Pick a track">
        {TRACKS.map((t, i) => <Lane key={t.letter} letter={t.letter} index={i} on={t.letter === active} onPick={onPick} />)}
      </div>
      <figcaption aria-live="polite" className="flex min-h-[64px] flex-col justify-center gap-0.5 rounded-b-card border-t border-line bg-canvas px-3 py-2.5 sm:px-4">
        <span className="text-[13px] font-medium text-ink">{cur.code}, {cur.short.toLowerCase()}</span>
        <span className="text-[13px] leading-snug text-ink-2">{cur.note}</span>
      </figcaption>
    </figure>
  );
  return (
    <section className="border-b border-line">
      <PageHeader
        title="Track A ranks. Tracks B to F stress-test it."
        lede={<p className="m-0">Real spike-ins first, then synthetic, null, blood, noisy-label and same-lineage units. Pick a lane to see how each one behaves.</p>}
        actions={(
          <>
            <button type="button" onClick={onShowA}
              className="group inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-chip border border-ink bg-ink px-4 text-sm font-medium text-white transition-transform duration-[var(--dur-1)] active:scale-[0.98]">
              See Track A results
              <ArrowRight size={15} strokeWidth={ICON_STROKE} aria-hidden="true" className="transition-transform duration-[var(--dur-1)] group-hover:translate-x-0.5" />
            </button>
            <a href={href('/leaderboard')} onPointerEnter={() => preloadRoute('/leaderboard')} onFocus={() => preloadRoute('/leaderboard')}
              className="inline-flex min-h-10 items-center rounded-chip border border-line-strong bg-surface px-4 text-sm text-ink transition-[border-color,transform] duration-[var(--dur-1)] hover:border-ink-3 active:scale-[0.98]">
              Open the leaderboard
            </a>
          </>
        )}
        art={lanes}
        className="pb-12 lg:pb-16"
      >
        <p className="rise m-0 text-sm text-ink-3 [animation-delay:220ms]">
          <span className="tabular text-ink">{G.tracksCount}</span> tracks, <CountUp value={G.totalUnits} className="text-ink" /> units per method
        </p>
      </PageHeader>
    </section>
  );
}
