import { useRef, type FocusEvent, type PointerEvent } from 'react';
import { GLOBAL_STATS as G } from '../../data/benchmarkData';
import { cx, fmt } from '../../lib/format';
import { href, preloadRoute } from '../../lib/router';
import { ArrowRight, ICON_STROKE } from '../../ui/icons';
import { MOTION_OK, canAnimate, gsap, useGSAP } from '../../ui/motion';
import { CARD_NOTE, CEILING, RANKED, REFS, type RankRow } from './model';

export interface RowHandlers {
  hotId: string | null;
  pinnedId: string | null;
  onPreview: (id: string | null) => void;
  onPin: (id: string) => void;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const pct = (v: number) => fmt.pct(clamp01(v));
/** Seconds: the card rises after the hero (CSS delay 1040 ms), then its intervals draw. */
const DRAW_DELAY = 1.2;

function Mark({ row, size }: { row: RankRow; size: number }) {
  return (
    <span aria-hidden="true" className="box-border block shrink-0 rounded-full"
      style={{ width: size, height: size, ...(row.isRef ? { border: `1.5px dashed ${row.color}` } : { background: row.color }) }} />
  );
}

/** Interval bar grows out of the mean dot, so its transform origin sits at the dot. */
function Track({ row }: { row: RankRow }) {
  const span = Math.max(1e-6, row.hi - row.lo);
  const origin = `${(clamp01((row.mean - row.lo) / span) * 100).toFixed(1)}% 50%`;
  return (
    <span aria-hidden="true" className="relative h-3 max-[419px]:col-[2/4] max-[419px]:row-start-2 max-[419px]:-mt-0.5 min-[420px]:h-5">
      <span className="absolute inset-x-0 top-1/2 h-px bg-line" />
      <span className="rc-ci absolute rounded-[2px]"
        style={{ left: pct(row.lo), width: `calc(${pct(row.hi)} - ${pct(row.lo)})`, transformOrigin: origin,
          ...(row.isRef ? { borderTop: `1.5px dashed ${row.color}`, height: 0, top: '50%' } : { background: row.color, opacity: 0.35, height: 4, top: 'calc(50% - 2px)' }) }} />
      <span className="rc-dot absolute top-1/2 -ml-1 -mt-1 box-border size-2 rounded-full"
        style={{ left: pct(row.mean), ...(row.isRef ? { border: `1.5px dashed ${row.color}` } : { background: row.color }) }} />
    </span>
  );
}

function Row({ row, hotId, pinnedId, onPreview, onPin }: RowHandlers & { row: RankRow }) {
  const label = `${row.name}: ${row.isRef ? row.role : `rank ${row.rank}`}, median AP ${fmt.ap(row.median)}`;
  const enter = (e: PointerEvent) => { if (e.pointerType === 'mouse') onPreview(row.id); };
  const leave = (e: PointerEvent) => { if (e.pointerType === 'mouse') onPreview(null); };
  // Keyboard focus previews; a mouse or touch press focuses too, so only :focus-visible counts.
  const focus = (e: FocusEvent<HTMLButtonElement>) => { if (e.currentTarget.matches(':focus-visible')) onPreview(row.id); };
  return (
    <button type="button" aria-pressed={pinnedId === row.id} aria-label={label}
      onPointerEnter={enter} onPointerLeave={leave} onFocus={focus} onBlur={() => onPreview(null)} onClick={() => onPin(row.id)}
      className={cx(
        'grid min-h-11 w-full cursor-pointer grid-cols-[24px_minmax(0,1fr)_52px] items-center gap-x-2 border-0 border-t border-solid border-line px-4 py-[9px] text-left font-[inherit] text-inherit transition-colors duration-[var(--dur-1)]',
        'min-[420px]:grid-cols-[28px_minmax(0,1fr)_minmax(64px,96px)_56px] sm:grid-cols-[28px_minmax(0,1fr)_minmax(80px,160px)_56px]',
        hotId === row.id ? 'bg-sunk' : 'bg-transparent hover:bg-[var(--row-hover)]',
      )}>
      <span className="font-mono text-xs text-ink-3">{row.rank ?? ''}</span>
      <span className="flex min-w-0 flex-col">
        <span className="flex min-w-0 items-center gap-2">
          <Mark row={row} size={9} />
          <span className="truncate font-mono text-[13px] text-ink">{row.name}</span>
        </span>
        {row.role && <span className="pl-[17px] text-[11px] text-ink-3">{row.role}</span>}
      </span>
      <Track row={row} />
      <span className="text-right font-mono text-[13px] text-ink">{fmt.ap(row.median)}</span>
    </button>
  );
}

const groupHead = 'eyebrow border-t border-line bg-[var(--row-hover)] px-4 py-1.5';

/** Track A ranking card: ceiling, ranked published detectors 1 to 6, then unranked reference rows. */
export function RankCard(props: RowHandlers) {
  const ref = useRef<HTMLDivElement>(null);

  // Draw-in once (audit S-17): intervals grow out of their mean dot, dots fade in 30 ms apart. Values never move.
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      if (!canAnimate()) return;
      gsap.from('.rc-ci', { scaleX: 0.4, opacity: 0, duration: 0.6, ease: 'power3.out', stagger: 0.03, delay: DRAW_DELAY, clearProps: 'transform' });
      gsap.from('.rc-dot', { opacity: 0, duration: 0.3, ease: 'power2.out', stagger: 0.03, delay: DRAW_DELAY, clearProps: 'opacity' });
    });
    return () => mm.revert();
  }, { scope: ref });

  return (
    <div ref={ref} id="rank" className="card flex flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line px-4 py-3">
        <span className="eyebrow">Track A · median AP</span>
        <span className="ml-auto font-mono text-[11px] text-ink-3">
          <span className="[@media(hover:hover)]:hidden">tap</span><span className="hidden [@media(hover:hover)]:inline">point at</span> a row to see its cells
        </span>
        <span className="rounded-chip border border-line px-1.5 py-0.5 font-mono text-[11px] text-ink-2">ranked 1–{G.methodsRankedPublished}</span>
      </div>
      {CEILING.map((r) => <Row key={r.id} row={r} {...props} />)}
      <div className={groupHead}>Ranked published detectors</div>
      {RANKED.map((r) => <Row key={r.id} row={r} {...props} />)}
      <div className={groupHead}>Reference rows · not ranked</div>
      {REFS.map((r) => <Row key={r.id} row={r} {...props} />)}
      <div className="mt-auto flex flex-col gap-2 border-t border-line bg-sunk px-4 py-3.5 text-xs leading-relaxed text-ink-2">
        <p className="m-0">
          <span className="font-mono text-ink">FiRE</span> vs <span className="font-mono text-ink">expr_threshold</span>: not significantly different (BH-FDR {CARD_NOTE.fireExpr}). Nor is FiRE vs scMalignantFinder (BH-FDR {CARD_NOTE.fireSmf}).
        </p>
        <p className="m-0 text-ink-3">
          Ranked and printed by median AP. Dots and bars: bootstrap mean AP with 95% interval. n = {CARD_NOTE.units} units per method ({CARD_NOTE.commonUnits} for scCAD, DeepScena after fallback filtering). Inter-lineage contrast only; Track F tests same-lineage.
        </p>
        <a href={href('/leaderboard')} onPointerEnter={() => void preloadRoute('/leaderboard')}
          className="hm-link hm-ul group inline-flex min-h-8 items-center gap-1 self-end font-medium hover:text-ink">
          <span className="fx-underline">Full leaderboard</span><ArrowRight size={14} strokeWidth={ICON_STROKE} aria-hidden="true" className="hm-nudge" />
        </a>
      </div>
    </div>
  );
}
