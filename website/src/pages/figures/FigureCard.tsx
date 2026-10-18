import { useId, useState } from 'react';
import { CopyButton, ErrorState, Icon, Skeleton, asset } from '../../ui';
import type { GalleryItem } from './catalog';
import { useImageStatus } from './useImageStatus';

/** Ring on the figure sheet while the card's open button has keyboard focus (other buttons in the card don't count). */
const FOCUS_RING = 'group-has-[.fig-open:focus-visible]:border-accent group-has-[.fig-open:focus-visible]:outline-2 group-has-[.fig-open:focus-visible]:outline-offset-2 group-has-[.fig-open:focus-visible]:outline-accent';

/**
 * Sheet at the figure's own aspect ratio, so nothing is letterboxed. Paired sheets match in height because the row
 * sizes its columns by the same ratios. Loading shows a skeleton, a failed request shows a retry.
 */
function FigureFrame({ f }: { f: GalleryItem }) {
  const src = asset(f.src);
  const { status, retry, imgProps } = useImageStatus(src);
  const [w, h] = f.size;
  const sheet = status === 'loaded' ? 'bg-[#fafafa]' : 'bg-sunk';
  return (
    <div aria-busy={status === 'loading'} style={{ aspectRatio: `${w} / ${h}` }}
      className={`relative mt-4 overflow-hidden rounded-card border border-line transition-colors duration-150 group-hover:border-line-strong ${sheet} ${FOCUS_RING}`}>
      {status !== 'error' && (
        <img {...imgProps} width={w} height={h} loading="lazy" decoding="async" alt={`${f.short}: ${f.title}`}
          className={`absolute inset-0 h-full w-full object-contain p-3 transition-[opacity,transform] duration-300 ease-[var(--ease-out)] group-hover:scale-[1.01] sm:p-5 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`} />
      )}
      {status === 'loading' && (
        <span className="absolute inset-0">
          <Skeleton className="h-full w-full rounded-none" />
          <span className="sr-only">Loading {f.short}</span>
        </span>
      )}
      {status === 'error' && (
        <ErrorState compact title={`${f.short} did not load`} onRetry={retry} retryLabel="Retry"
          className="absolute inset-2 z-20 justify-center"
          action={
            <a href={src} target="_blank" rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-chip border border-line-strong bg-surface px-4 text-sm font-medium text-ink transition-colors duration-150 hover:border-ink/40 active:translate-y-px">
              Open file <Icon name="arrow-up-right" size={14} />
            </a>
          } />
      )}
    </div>
  );
}

/**
 * One published figure. Rows (label, title, sheet, text) sit on the parent grid's subgrid, so the two cards in a
 * pair line up row by row: a two-line title on one side never pushes its sheet below its neighbour's.
 */
export function FigureCard({ f, onOpen }: { f: GalleryItem; onOpen: (el: HTMLButtonElement) => void }) {
  const [expanded, setExpanded] = useState(false);
  const restId = useId();
  return (
    <article className="reveal group relative row-span-4 grid grid-rows-subgrid max-md:not-first:mt-16">
      <div className="flex items-baseline justify-between gap-3 border-t border-line-strong pt-3">
        <p className="label">{f.meta}</p>
        <span aria-hidden="true" className="label hidden text-ink-3 transition-colors duration-150 group-hover:text-accent sm:inline-flex sm:items-center sm:gap-1">
          Open <Icon name="arrows-out-simple" size={12} />
        </span>
      </div>

      <h3 className="mt-2 text-lg font-semibold leading-snug tracking-[-0.015em] text-ink md:text-xl">
        <button type="button" onClick={(e) => onOpen(e.currentTarget)}
          className="fig-open text-left after:absolute after:inset-0 after:z-10 after:rounded-card focus-visible:outline-none">
          {f.title}
          <span className="sr-only">. Open in the figure viewer</span>
        </button>
      </h3>

      <FigureFrame f={f} />

      {/* Above the card-wide open target, so the text is selectable and its controls are reachable. The reading
          (what the figure shows) leads in ink; the proof caption follows as secondary evidence. */}
      <div className="relative z-20 mt-5 flex flex-col items-start">
        <div className="max-w-[64ch] border-l border-line-strong pl-4">
          <p className="label mb-1.5">Reading</p>
          <p className="text-[15px] leading-relaxed text-ink">{f.takeaway}</p>
        </div>
        <p className="mt-4 max-w-[68ch] text-sm leading-relaxed text-ink-2">
          {f.captionLead}
          {f.captionRest && <span id={restId} hidden={!expanded}> {f.captionRest}</span>}
        </p>
        <div className="-ml-2 mt-2 flex flex-wrap items-center gap-x-3">
          {f.captionRest && (
            <button type="button" aria-expanded={expanded} aria-controls={restId} onClick={() => setExpanded((x) => !x)}
              className="inline-flex h-11 items-center gap-1.5 rounded-chip px-2 text-sm font-medium text-ink transition-colors duration-150 hover:bg-sunk active:translate-y-px">
              {expanded ? 'Show less' : 'Read full caption'}
              <Icon name="caret-down" size={14} className={`text-ink-3 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
            </button>
          )}
          {f.link && (
            <a href={f.link.to}
              className="inline-flex h-11 items-center gap-1.5 rounded-chip px-2 text-sm font-medium text-ink underline decoration-line-strong underline-offset-4 transition-colors duration-150 hover:decoration-ink active:translate-y-px">
              {f.link.label} <Icon name="arrow-right" size={14} />
            </a>
          )}
          {/* The shared CopyButton is 28px tall; its own ::before extends the hit area to the 44px minimum. */}
          <CopyButton text={f.citation} label="Cite this figure" toast={`${f.short} citation copied`} />
        </div>
      </div>
    </article>
  );
}
