/* Hero: the specimen plate. Ten wells to scale (1 dot ≈ 250 cells); signal dots are the CNV-set positive share. */
import { memo, useEffect, useRef, type RefObject } from 'react';
import { cx, fmt } from '../../lib/format';
import { scrollToId } from '../../lib/router';
import { PageHeader } from '../../ui/PageHeader';
import { ArrowRight, ICON_STROKE } from '../../ui/icons';
import { MOTION_OK, canAnimate, gsap, useGSAP, useLoopGate } from '../../ui/motion';
import { COHORTS, TOTAL_CELLS, SOLID_N, compact, int, logPos, type Cohort } from './model';
import { FAR_LAYERS, PER_DOT, PLATE_NARROW, PLATE_WIDE, SIGNAL_ORDER, type Well } from './plate';
import { CohortGlyph, SlotMark } from './parts';
import { hoverProps } from './hover';
import { useNarrow } from './useNarrow';

interface WellProps {
  c: Cohort;
  well: Well;
  lit: boolean;
  dim: boolean;
  slot: number;
  onToggle: (id: string) => void;
  onHot: (id: string | null) => void;
}

/** Seconds a well takes to fill on first view: bigger cohorts take longer, so the plate reads as "to scale". */
const fillTime = (c: Cohort) => 0.25 + logPos(c.n) * 0.7;
const WELL_GAP_S = 0.05;

/** First view: each well's cell layer fills in (one tween per well), then its signal layer appears. Once. */
function usePlateFill(narrow: boolean) {
  const ref = useRef<HTMLUListElement>(null);
  useGSAP(() => {
    const root = ref.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      if (!canAnimate()) return;
      const wells = Array.from(root.querySelectorAll<HTMLElement>('[data-well]'));
      const tl = gsap.timeline({ delay: 0.25 });
      wells.forEach((w, i) => {
        const c = COHORTS[i];
        const fill = w.querySelector('.ds-fill');
        const sigs = w.querySelector('.ds-sigs');
        const at = i * WELL_GAP_S;
        if (fill) tl.from(fill, { opacity: 0, scale: 0.55, duration: fillTime(c), ease: 'power2.out', clearProps: 'opacity,transform' }, at);
        if (sigs) tl.from(sigs, { opacity: 0, duration: 0.45, ease: 'power1.out', clearProps: 'opacity' }, at + fillTime(c) * 0.8);
      });
      return () => { tl.progress(1).kill(); };
    });
    return () => mm.revert();
  }, { scope: ref, dependencies: [narrow], revertOnUpdate: true });
  return ref;
}

/** Seconds between two wells in the cobalt "found" ring's tour of the plate. */
const RING_STEP_MS = 1400;

/** The ring visits the CNV-set wells in turn, one short finite animation at a time (data-found, datasets.css), instead
 * of an infinite, mostly invisible loop per well. Stops whenever the hero's loop gate holds. */
function useRingTour(plateRef: RefObject<HTMLUListElement | null>, running: boolean) {
  useEffect(() => {
    const root = plateRef.current;
    if (!running || !root) return;
    const wells = root.querySelectorAll('[data-well]');
    let step = 0;
    let last: Element | null = null;
    const visit = () => {
      last?.removeAttribute('data-found');
      last = wells[SIGNAL_ORDER[step % SIGNAL_ORDER.length]]?.querySelector('.ds-ring') ?? null;
      last?.setAttribute('data-found', '');
      step += 1;
    };
    const id = window.setInterval(visit, RING_STEP_MS);
    return () => { window.clearInterval(id); last?.removeAttribute('data-found'); };
  }, [plateRef, running]);
}

/** A well's cells and signal dots: two mask layers, rasterised once. Hover and selection never re-render them;
 * lit and dim reach them through data attributes on the well (datasets.css). The outer spans are the entrance targets. */
const WellDots = memo(function WellDots({ well }: { well: Well }) {
  return (
    <>
      <span className="ds-fill absolute inset-0"><span className="ds-dots ds-mask" style={{ maskImage: well.dotsMask, WebkitMaskImage: well.dotsMask }} /></span>
      {well.sigsMask && (
        <span className="ds-sigs absolute inset-0"><span className="ds-sig-dots ds-mask" style={{ maskImage: well.sigsMask, WebkitMaskImage: well.sigsMask }} /></span>
      )}
    </>
  );
});

const PlateWell = memo(function PlateWell({ c, well, lit, dim, slot, onToggle, onHot }: WellProps) {
  const on = slot >= 0;
  const label = `${c.id}, ${c.ct}, ${int(c.n)} cells, ${c.cc && c.pos != null ? `CNV set ${fmt.pct(c.pos / c.cc)} positive` : 'no CNV set'}. ${on ? `Cohort ${slot === 0 ? 'A' : 'B'} in the comparison` : 'Add to the comparison'}`;
  return (
    <li className="min-w-0" data-well>
      <button
        type="button"
        className="ds-well-btn flex w-full cursor-pointer flex-col items-center gap-1 border-0 bg-transparent px-0.5 py-1 text-inherit"
        aria-pressed={on}
        aria-label={label}
        onClick={() => onToggle(c.id)}
        {...hoverProps(c.id, onHot)}
        onFocus={() => onHot(c.id)}
        onBlur={() => onHot(null)}
      >
        <span
          className={cx('ds-well relative block aspect-square w-full max-w-[52px] rounded-full border bg-sunk sm:max-w-[72px] lg:max-w-[96px]', c.cc ? 'border-solid' : 'border-dashed')}
          data-lit={lit || undefined}
          data-dim={dim || undefined}
        >
          <span className={cx('loop absolute inset-0 rounded-full', lit ? 'ds-spin-fast' : 'ds-spin')}>
            <WellDots well={well} />
            {well.nSig > 0 && (
              <span
                className={cx('absolute -ml-[9px] -mt-[9px] size-[18px] rounded-full border-[1.2px] border-accent', lit ? 'ds-ring-hot loop' : 'ds-ring')}
                style={{ left: `${well.rx}%`, top: `${well.ry}%` }}
              />
            )}
          </span>
          {on && (
            <span className="pop-in absolute -right-1.5 -top-1.5 inline-flex items-center gap-1 rounded-chip border border-line bg-surface px-1 font-mono text-[11px] leading-4 text-ink">
              <SlotMark slot={slot} />{slot === 0 ? 'A' : 'B'}
            </span>
          )}
        </span>
        <span className={cx('flex max-w-full items-center gap-1 font-mono text-[11px] leading-4', lit ? 'text-ink' : 'text-ink-2')}>
          <CohortGlyph id={c.id} size={12} className="hidden opacity-80 sm:block" />
          <span className="truncate">{c.id.split('_')[0]}</span>
        </span>
        <span className="font-mono text-[11px] leading-4 text-ink-3">{compact(c.n)}</span>
      </button>
    </li>
  );
});

interface Props {
  pair: string[];
  hot: string | null;
  onToggle: (id: string) => void;
  onHot: (id: string | null) => void;
}

export function SpecimenHero({ pair, hot, onToggle, onHot }: Props) {
  const narrow = useNarrow();
  // One gate holds every hero loop (spin, ring, far drift) off screen, in a hidden tab, or under Pause / reduced motion.
  const { ref: heroRef, running, loopProps } = useLoopGate<HTMLElement>();
  const plateRef = usePlateFill(narrow);
  useRingTour(plateRef, running);
  const plate = narrow ? PLATE_NARROW : PLATE_WIDE;
  const anyLit = hot !== null || pair.length > 0;
  const art = (
    <figure className="fx-hairline-gradient m-0 min-w-0 rounded-card border border-line bg-[rgb(255_255_255/0.86)] p-3 shadow-[var(--elev-1)] sm:p-4 lg:p-5">
      <figcaption className="m-0 mb-2 flex justify-between gap-3 font-mono text-[11px] text-ink-2">
        <span className="uppercase tracking-[0.06em]">Specimen plate</span>
        <span>1 dot ≈ {narrow ? PER_DOT.narrow : PER_DOT.wide} cells · to scale</span>
      </figcaption>
      <ul ref={plateRef} aria-label="Cohorts, largest first. Select up to two to compare." className="m-0 grid list-none grid-cols-5 gap-x-1.5 gap-y-2 p-0 sm:gap-x-3 sm:gap-y-1.5 lg:gap-y-3">
        {COHORTS.map((c, i) => {
          const slot = pair.indexOf(c.id);
          const lit = slot >= 0 || hot === c.id;
          return (
            <PlateWell
              key={c.id}
              c={c}
              well={plate[i]}
              lit={lit}
              dim={anyLit && !lit}
              slot={slot}
              onToggle={onToggle}
              onHot={onHot}
            />
          );
        })}
      </ul>
      <p className="m-0 mt-1 flex flex-wrap justify-between gap-x-4 gap-y-1 border-t border-line pt-2 font-mono text-[11px] text-ink-2">
        <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="size-1.5 rounded-full bg-signal" />CNV-set positive share</span>
        <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="size-2 rounded-full border border-dashed border-ink-3" />no CNV set</span>
        <span className="hidden sm:inline">Select a well to compare</span>
      </p>
    </figure>
  );
  return (
    <section ref={heroRef} {...loopProps} aria-label="Datasets overview" className="relative overflow-hidden border-b border-line">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {FAR_LAYERS.map((layer, i) => (
          <span
            key={i}
            className="ds-far ds-far-dots ds-mask loop"
            style={{ maskImage: layer.mask, WebkitMaskImage: layer.mask, animationDuration: `${layer.dur}s`, animationDelay: `-${layer.delay}s` }}
          />
        ))}
        <div className="ds-veil absolute inset-0" />
      </div>
      <PageHeader
        className="relative"
        eyebrow="Table 2a · GEO and GSA accessions"
        title="Ten public cohorts, one labelling rule"
        lede={<p className="m-0">{SOLID_N} solid tumours and {COHORTS.length - SOLID_N} blood or circulating-tumour-cell cohorts, {int(TOTAL_CELLS)} cells in all. A cell is labelled malignant only when four independent evidence arms agree.</p>}
        actions={(
          <>
            <button type="button" onClick={() => scrollToId('compare')} className="ds-press inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-chip border-0 bg-ink px-4 text-[13px] font-medium text-canvas transition-[background-color,transform] duration-[var(--dur-1)] hover:bg-ink-2">
              Compare two cohorts
            </button>
            <button type="button" onClick={() => scrollToId('evidence')} className="ds-press ds-nudge group inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-chip border border-line-strong bg-surface px-4 text-[13px] font-medium text-ink transition-[border-color,transform] duration-[var(--dur-1)] hover:border-cell">
              How labels are built <ArrowRight size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
            </button>
          </>
        )}
        art={art}
      />
    </section>
  );
}
