import { useCallback, useState, type MouseEvent } from 'react';
import { cx } from '../../lib/format';
import { Icon3D } from '../../ui/Icon3D';
import { useLoopGate } from '../../ui/motion/useLoopGate';
import { ArrowUpRight, Check, ChevronDown, Copy, ExternalLink, ICON_STROKE } from '../../ui/icons';
import { useCopy } from '../../ui/useCopy';
import { figCitation, figId, figMeta, figSrc, type PaperFigure } from './catalog';

/** One copy slot per card; a failure stays up (sticky) so the selected fallback textarea does not vanish. */
const CITE_KEY = 'figure-citation';
const COPY_OPTS = { resetMs: 1600, stickyFailures: true } as const;
const SR_ONLY = 'absolute h-px w-px overflow-hidden whitespace-nowrap [clip:rect(0_0_0_0)]';
const MONO_LABEL = 'm-0 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-3';

type LoadState = 'loading' | 'ok' | 'error';

/** Figure image with the States board's skeleton (own aspect ratio) and "did not load" recovery. */
function useImageLoad() {
  const [state, setState] = useState<LoadState>('loading');
  const [attempt, setAttempt] = useState(0);
  const imgRef = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete) setState(img.naturalWidth > 0 ? 'ok' : 'error');
  }, []);
  const retry = () => { setState('loading'); setAttempt((a) => a + 1); };
  return { state, attempt, imgRef, retry, onLoad: () => setState('ok'), onError: () => setState('error') };
}

/** Loading shimmer; held (data-loop="hold") while off-screen so lazy cards below the fold do not repaint every frame. */
function Skeleton() {
  const { ref, loopProps } = useLoopGate<HTMLSpanElement>();
  return <span ref={ref} {...loopProps} aria-hidden="true" className="fig-skel loop absolute inset-0" />;
}

function FailedSheet({ f, onRetry }: { f: PaperFigure; onRetry: () => void }) {
  return (
    <div role="alert" className="mt-4 flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-card border border-line bg-sunk p-6 text-center">
      <Icon3D name="bar-chart" size={56} />
      <p className="m-0 text-[15px] font-semibold">Figure {f.n} did not load</p>
      <p className="m-0 text-[13px] text-ink-2">The file did not arrive. Try again, or open it in a new tab.</p>
      <p className="m-0 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={onRetry} className="fig-press h-11 cursor-pointer rounded-chip border-0 bg-ink px-4 text-sm text-canvas">Retry</button>
        <a href={figSrc(f)} target="_blank" rel="noopener noreferrer" className="fig-press inline-flex h-11 items-center gap-1.5 rounded-chip border border-line-strong bg-surface px-4 text-sm text-ink no-underline">
          Open file <ExternalLink size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
        </a>
      </p>
    </div>
  );
}

interface CardProps {
  f: PaperFigure;
  /** Gets the pressed control, so the page can hand focus back to it when the viewer closes. */
  onOpen: (from: HTMLElement) => void;
}

export function FigureCard({ f, onOpen }: CardProps) {
  const [capOpen, setCapOpen] = useState(false);
  const { state: load, attempt, imgRef, retry, onLoad, onError } = useImageLoad();
  const copier = useCopy(COPY_OPTS);
  const open = (e: MouseEvent<HTMLElement>) => onOpen(e.currentTarget);
  const selectRef = useCallback((el: HTMLTextAreaElement | null) => { if (el) { el.focus(); el.select(); } }, []);
  const restId = `cap-rest-${f.n}`;
  const copied = copier.stateOf(CITE_KEY) === 'copied';
  const manual = copier.stateOf(CITE_KEY) === 'failed';
  const src = attempt ? `${figSrc(f)}?retry=${attempt}` : figSrc(f);

  return (
    <article id={figId(f)} aria-labelledby={`${figId(f)}-t`} className="fig-card fx-card fx-hairline-gradient flex min-w-0 flex-col p-4 sm:p-6">
      <span aria-hidden="true" className="fig-flash" />
      <div className="flex justify-between gap-3">
        <p className={MONO_LABEL}>{figMeta(f)}</p>
        <span aria-hidden="true" className={cx(MONO_LABEL, 'fig-open-hint inline-flex items-center gap-1')}>
          Open <ArrowUpRight className="fig-nudge" size={14} strokeWidth={ICON_STROKE} />
        </span>
      </div>
      <h3 id={`${figId(f)}-t`} className="mt-2 mb-0 text-xl font-semibold leading-[1.3] tracking-[-0.015em]">
        <button type="button" data-fig-title onClick={open} className="fig-title cursor-pointer rounded-chip border-0 bg-transparent p-0 text-left font-[inherit] tracking-[inherit] text-inherit">
          {f.title}<span className={SR_ONLY}>. Open in the figure viewer</span>
        </button>
      </h3>

      {load === 'error' ? (
        <FailedSheet f={f} onRetry={retry} />
      ) : (
        <button
          type="button"
          onClick={open}
          aria-label={`Open Figure ${f.n} in the figure viewer`}
          aria-busy={load === 'loading'}
          className="fig-sheet relative mt-4 flex aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-card border border-line bg-canvas p-0"
        >
          {load === 'loading' && <Skeleton />}
          <img
            key={attempt}
            ref={imgRef}
            data-fig-img
            src={src}
            alt={`Figure ${f.n}: ${f.title}`}
            width={f.w}
            height={f.h}
            loading="lazy"
            decoding="async"
            onLoad={onLoad}
            onError={onError}
            className={cx('box-border h-full w-full object-contain p-4 transition-opacity duration-[var(--dur-3)]', load === 'loading' ? 'opacity-0' : 'opacity-100')}
          />
          {load === 'loading' && <span className="absolute bottom-2 left-3 font-mono text-[11px] text-ink-3">Loading Figure {f.n}</span>}
        </button>
      )}

      <p className="mt-5 mb-0 min-h-[4.875em] max-w-[64ch] border-l border-line-strong pl-4 text-[15px] leading-relaxed text-ink">{f.take}</p>
      <p className={cx('mt-4 mb-0 min-h-[4.875em] max-w-[68ch] text-sm leading-relaxed text-ink-2', !capOpen && 'line-clamp-3')}>
        {f.lead}
        <span id={restId} hidden={!capOpen}> {f.rest}</span>
      </p>
      <p className="mt-auto mb-0 -ml-2 flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
        <button
          type="button"
          onClick={() => setCapOpen((o) => !o)}
          aria-expanded={capOpen}
          aria-controls={restId}
          className="fig-act inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-chip border-0 bg-transparent px-2 text-sm font-medium text-ink"
        >
          {capOpen ? 'Show less' : 'Read full caption'}
          <span className="fig-caret text-ink-3" data-open={capOpen || undefined}><ChevronDown size={16} strokeWidth={ICON_STROKE} aria-hidden="true" /></span>
        </button>
        <button
          type="button"
          onClick={() => { void copier.copy(figCitation(f), CITE_KEY); }}
          className={cx('fig-act inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-chip border-0 bg-transparent px-2 text-sm font-medium', copied ? 'text-ok' : 'text-ink-2 hover:text-ink')}
        >
          {copied ? <Check size={16} strokeWidth={ICON_STROKE} aria-hidden="true" /> : <Copy size={16} strokeWidth={ICON_STROKE} aria-hidden="true" />}
          {copied ? 'Copied' : 'Cite this figure'}
        </button>
        <span aria-live="polite" className={SR_ONLY}>
          {copied ? `Figure ${f.n} citation copied` : manual ? 'Copy blocked; the citation is selected below' : ''}
        </span>
      </p>
      {manual && (
        <label className="mt-2 block text-xs text-ink-2">
          Copying is blocked here. The citation is selected; press Ctrl+C or ⌘C.
          <textarea
            readOnly
            rows={4}
            ref={selectRef}
            value={figCitation(f)}
            className="mt-1.5 box-border block w-full resize-y rounded-chip border border-line-strong px-2.5 py-2 font-mono text-xs leading-normal text-ink"
          />
        </label>
      )}
    </article>
  );
}
