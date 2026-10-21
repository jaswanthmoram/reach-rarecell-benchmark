import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cx, fmt } from '../../lib/format';
import { href } from '../../lib/router';
import { ArrowLeft, ArrowRight, ExternalLink, ICON_STROKE, X } from '../../ui/icons';
import { FIGURES, figCaption, figMeta, figSrc } from './catalog';

const MONO_LABEL = 'm-0 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-3';
const ICON_BTN = 'fig-press grid h-11 w-11 cursor-pointer place-items-center rounded-chip border border-line bg-surface text-ink-2 transition-colors duration-[var(--dur-1)] hover:bg-sunk hover:text-ink';
const SEG = 'h-11 cursor-pointer border-0 px-3 font-mono text-xs transition-colors duration-[var(--dur-1)]';
const KBD = 'rounded-[3px] border border-line bg-canvas px-1 py-px font-mono text-[11px] text-ink-2';
const ICON = { size: 16, strokeWidth: ICON_STROKE, 'aria-hidden': true } as const;
const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, [tabindex]:not([tabindex="-1"])';

interface Props {
  index: number;
  onStep: (dir: 1 | -1) => void;
  onClose: () => void;
  /** Opened through the shared-element morph: the View Transition animates it, so skip the CSS entrance. */
  morphing?: boolean;
}

/** Keep Tab inside the dialog (aria-modal), also when focus has fallen to <body> after a click on blank space. */
function trapTab(e: KeyboardEvent, root: HTMLElement) {
  const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
  if (!items.length) { e.preventDefault(); root.focus(); return; }
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  const inside = active instanceof Node && root.contains(active) && active !== root;
  if (!inside) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
  else if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
}

/** Figure viewer from the P06 board: Fit / 100% zoom, arrow keys step, Z toggles zoom, Esc closes. */
export function FigureViewer({ index, onStep, onClose, morphing = false }: Props) {
  const [zoom, setZoom] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const o = FIGURES[index];
  const n = o.n;

  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = 'hidden';
    dialogRef.current?.focus({ preventScroll: true });
    // Focus that leaves the dialog (a script, a stray click target) comes straight back.
    const onFocusIn = (e: FocusEvent) => {
      const root = dialogRef.current;
      if (root && e.target instanceof Node && !root.contains(e.target)) root.focus({ preventScroll: true });
    };
    document.addEventListener('focusin', onFocusIn);
    return () => {
      html.style.overflow = prev;
      document.removeEventListener('focusin', onFocusIn);
    };
  }, []);

  const step = (dir: 1 | -1) => { setZoom(false); onStep(dir); };

  // Keys are read on the document, so Esc, arrows and Tab still work after a click drops focus to <body>.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const root = dialogRef.current;
      if (!root || e.defaultPrevented || e.isComposing) return;
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key === 'Tab') { trapTab(e, root); return; }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'z' || e.key === 'Z') { e.preventDefault(); setZoom((z) => !z); return; }
      if (zoom) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); setZoom(false); onStep(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); setZoom(false); onStep(-1); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [zoom, onClose, onStep]);

  return createPortal(
    <div data-lenis-prevent className="fig-viewer fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div aria-hidden="true" onClick={onClose} className={cx('absolute inset-0 bg-canvas/95', !morphing && 'fig-lb-fade')} />
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lb-t"
        aria-describedby="lb-d"
        className={cx(
          !morphing && 'fig-lb-rise',
          'relative flex h-[calc(100dvh-16px)] outline-none w-full max-w-[1360px] flex-col overflow-hidden rounded-card border border-line bg-surface shadow-[0_12px_40px_rgb(14_17_22/0.14)] sm:h-[calc(100dvh-32px)]',
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-line px-4 py-2">
          <span className="flex min-w-0 items-center gap-3">
            <span aria-live="polite" className="font-mono text-xs text-ink-2">
              <span className="absolute h-px w-px overflow-hidden whitespace-nowrap [clip:rect(0_0_0_0)]">Figure {n}, </span>{n} / {FIGURES.length}
            </span>
            <span className={cx(MONO_LABEL, 'truncate')}>{figMeta(o)}</span>
          </span>
          <span className="flex items-center gap-2">
            <span role="group" aria-label="Zoom" className="flex overflow-hidden rounded-chip border border-line">
              <button type="button" aria-pressed={!zoom} onClick={() => setZoom(false)} className={cx(SEG, zoom ? 'bg-surface text-ink-2 hover:bg-sunk' : 'bg-ink text-canvas')}>Fit</button>
              <button type="button" aria-pressed={zoom} onClick={() => setZoom(true)} aria-label="Actual size, 100 percent" className={cx(SEG, zoom ? 'bg-ink text-canvas' : 'bg-surface text-ink-2 hover:bg-sunk')}>100%</button>
            </span>
            <button type="button" onClick={() => step(-1)} aria-label="Previous figure" className={ICON_BTN}><ArrowLeft {...ICON} /></button>
            <button type="button" onClick={() => step(1)} aria-label="Next figure" className={ICON_BTN}><ArrowRight {...ICON} /></button>
            <button type="button" onClick={onClose} aria-label="Close figure viewer" className={ICON_BTN}><X {...ICON} /></button>
          </span>
        </div>

        <div className="flex min-h-0 flex-auto flex-wrap overflow-auto">
          <div
            role="region"
            aria-label={zoom ? `Figure ${n} at actual size; scroll to pan` : `Figure ${n}`}
            tabIndex={zoom ? 0 : undefined}
            className={cx(
              'relative box-border max-h-full min-h-[320px] min-w-0 flex-[999_1_520px] bg-canvas',
              zoom ? 'block overflow-auto p-0' : 'flex items-center justify-center overflow-hidden p-4 sm:p-6',
            )}
          >
            <img
              key={n}
              data-fig-viewer-img
              src={figSrc(o)}
              alt={`Figure ${n}: ${o.title}`}
              width={o.w}
              height={o.h}
              onClick={() => setZoom((z) => !z)}
              className={zoom ? 'block h-auto max-w-none cursor-zoom-out' : 'block h-auto max-h-[calc(100dvh-160px)] w-auto max-w-full cursor-zoom-in object-contain'}
              style={{ viewTransitionName: 'fig-active', width: zoom ? o.w : undefined }}
            />
          </div>
          <aside className="box-border flex min-w-0 max-w-full flex-[1_1_320px] flex-col gap-3.5 border-t border-line p-5 min-[900px]:border-t-0 min-[900px]:border-l">
            <div>
              <p className={MONO_LABEL}>{figMeta(o)}</p>
              <h2 id="lb-t" className="mt-2 mb-0 text-lg font-semibold leading-[1.35]">{o.title}</h2>
            </div>
            <p id="lb-d" className="m-0 text-sm leading-relaxed text-ink">{figCaption(o)}</p>
            <div className="rounded-card border border-line bg-sunk px-3 py-2.5">
              <p className={cx(MONO_LABEL, 'mb-1')}>Reading</p>
              <p className="m-0 text-sm leading-relaxed text-ink-2">{o.take}</p>
              {o.link && (
                <a href={href('/leaderboard')} className="fig-link inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ink hover:text-accent-ink">See pairwise tests <ArrowRight {...ICON} className="fig-nudge" /></a>
              )}
            </div>
            <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono text-[11px] leading-relaxed text-ink-2">
              <dt className="text-ink-3">Source</dt><dd className="m-0">{o.source}</dd>
              <dt className="text-ink-3">File</dt><dd className="m-0">WebP · {fmt.int(o.w)} × {fmt.int(o.h)} px</dd>
            </dl>
            <p className="mt-auto mb-0 flex flex-wrap gap-2">
              <a href={figSrc(o)} target="_blank" rel="noopener noreferrer" className="fig-press inline-flex h-11 items-center gap-2 rounded-chip bg-ink px-4 text-sm font-medium text-canvas no-underline hover:text-canvas">Open full size in a new tab <ExternalLink {...ICON} /></a>
              <a href={figSrc(o)} download={`REACH-figure-${n}.webp`} className="fig-press inline-flex h-11 items-center rounded-chip border border-line-strong bg-surface px-4 text-sm font-medium text-ink no-underline hover:border-ink-3 hover:text-ink">Download WebP</a>
            </p>
            <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink-3">
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><kbd className={KBD}>Esc</kbd> close</span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><kbd className={KBD}>Z</kbd> zoom</span>
              <span className="inline-flex items-center gap-1 whitespace-nowrap">
                {zoom ? 'Scroll to pan' : <><kbd className={KBD}>←</kbd><kbd className={KBD}>→</kbd><span className="ml-0.5">previous or next</span></>}
              </span>
            </p>
          </aside>
        </div>
      </div>
    </div>,
    document.body,
  );
}
