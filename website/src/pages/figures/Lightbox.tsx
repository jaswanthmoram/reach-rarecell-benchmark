import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type RefObject } from 'react';
import { ErrorState, Icon, Loader, asset, useToast } from '../../ui';
import type { GalleryItem } from './catalog';
import { useImageStatus } from './useImageStatus';

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface LightboxProps {
  items: GalleryItem[];
  index: number;
  onStep: (dir: number) => void;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
}

const navBtn = 'grid size-11 place-items-center rounded-chip border border-line bg-surface text-ink-2 transition-colors duration-150 hover:border-line-strong hover:text-ink active:translate-y-px disabled:opacity-40';
const segBtn = 'h-9 px-3 font-mono text-[12px] tabular transition-colors duration-150 first:rounded-l-chip last:rounded-r-chip active:translate-y-px';

/**
 * Downloads are blocked inside sandboxed frames (the artifact viewer) without any error the page can observe, so a
 * framed page reports the block up front instead of failing silently. Elsewhere the file is fetched and saved.
 */
const isFramed = () => { try { return window.self !== window.top; } catch { return true; } };

async function saveFile(url: string, name: string) {
  if (isFramed()) throw new Error('framed');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blobUrl = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}

/** Full-size viewer: fit-to-screen by default, 1:1 pixels on demand (button, Z key, or click on the figure). */
export function Lightbox({ items, index, onStep, onClose, returnFocusRef }: LightboxProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const paneRef = useRef<HTMLDivElement>(null);
  const focusPoint = useRef<[number, number] | null>(null);
  // Zoom is stored per figure id, so stepping to another figure always starts at "fit".
  const [zoomedId, setZoomedId] = useState<string | null>(null);
  const f = items[index];
  const [w, h] = f.size;
  const total = items.length;
  const actual = zoomedId === f.id;
  const setActual = (on: boolean) => setZoomedId(on ? f.id : null);
  const src = asset(f.src);
  const { status, retry, imgProps } = useImageStatus(src);
  const toast = useToast();
  const newTabRef = useRef<HTMLAnchorElement>(null);
  const [saving, setSaving] = useState(false);
  // The "open in new tab" fallback is highlighted for the figure whose download failed, not for the next one.
  const [hintFor, setHintFor] = useState<string | null>(null);
  const hintNewTab = hintFor === f.id;

  const download = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await saveFile(src, f.downloadName);
      toast({ title: `${f.short} downloaded`, description: f.downloadName, tone: 'ok' });
    } catch {
      toast({ title: 'Download is unavailable here', description: 'Open the figure in a new tab and save it from there.', tone: 'bad' });
      setHintFor(f.id);
      newTabRef.current?.focus();
    } finally {
      setSaving(false);
    }
  };

  // Move focus in on open and lock body scroll; on close, release the scroll and return focus to the opener.
  useEffect(() => {
    const opener = returnFocusRef.current;
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; opener?.focus(); };
  }, [returnFocusRef]);

  // Keyboard works wherever focus sits. At actual size the arrows scroll the figure instead of stepping.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      else if (e.key === 'z' || e.key === 'Z') { e.preventDefault(); setZoomedId((z) => (z === f.id ? null : f.id)); }
      else if (actual) return;
      else if (e.key === 'ArrowRight') { e.preventDefault(); onStep(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); onStep(-1); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onStep, onClose, actual, f.id]);

  // After switching to 1:1, scroll so the clicked point (or the centre) is in view, and focus the pane for arrow scrolling.
  useLayoutEffect(() => {
    const pane = paneRef.current;
    if (!actual || !pane) return;
    const [fx, fy] = focusPoint.current ?? [0.5, 0.3];
    pane.scrollLeft = Math.max(0, fx * pane.scrollWidth - pane.clientWidth / 2);
    pane.scrollTop = Math.max(0, fy * pane.scrollHeight - pane.clientHeight / 2);
    focusPoint.current = null;
    pane.focus({ preventScroll: true });
  }, [actual]);

  const onImageClick = (e: ReactMouseEvent<HTMLImageElement>) => {
    if (!actual) {
      const r = e.currentTarget.getBoundingClientRect();
      focusPoint.current = [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
    }
    setActual(!actual);
  };

  const trapTab = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  const seg = (on: boolean) => `${segBtn} ${on ? 'bg-ink text-canvas' : 'text-ink-2 hover:bg-sunk hover:text-ink'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" onKeyDown={trapTab}>
      <div aria-hidden="true" className="absolute inset-0 bg-canvas/95 [animation:lb-fade_200ms_var(--ease-out)_both]" onClick={onClose} />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="lb-title" aria-describedby="lb-desc"
        className="relative flex h-[calc(100dvh-1rem)] w-full max-w-[1360px] flex-col overflow-hidden rounded-card border border-line bg-surface shadow-pop [animation:lb-rise_240ms_var(--ease-out)_both] sm:h-[calc(100dvh-2rem)]">
        <style>{'@keyframes lb-fade{from{opacity:0}}@keyframes lb-rise{from{opacity:0;transform:translateY(8px) scale(.99)}}'}</style>

        <header className="flex items-center justify-between gap-3 border-b border-line px-3 py-2 sm:px-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="font-mono text-xs text-ink-2 tabular" aria-live="polite">
              <span className="sr-only">{f.short}, </span>{index + 1} / {total}
            </span>
            <span className="label hidden truncate md:inline">{f.meta}</span>
          </div>
          <div className="flex items-center gap-2">
            <div role="group" aria-label="Zoom" className="flex rounded-chip border border-line bg-surface">
              <button type="button" aria-pressed={!actual} onClick={() => setActual(false)} className={seg(!actual)}>Fit</button>
              <button type="button" aria-pressed={actual} onClick={() => setActual(true)} className={seg(actual)}
                aria-label="Actual size, 100 percent">100%</button>
            </div>
            <button type="button" onClick={() => onStep(-1)} className={navBtn} aria-label="Previous figure" disabled={total < 2}>
              <Icon name="arrow-left" size={16} />
            </button>
            <button type="button" onClick={() => onStep(1)} className={navBtn} aria-label="Next figure" disabled={total < 2}>
              <Icon name="arrow-right" size={16} />
            </button>
            <button ref={closeRef} type="button" onClick={onClose} className={navBtn} aria-label="Close figure viewer">
              <Icon name="x" size={16} />
            </button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-1">
          <div ref={paneRef} tabIndex={actual ? 0 : -1} role="region" aria-label={actual ? `${f.short} at actual size; use arrow keys to scroll` : `${f.short}`}
            aria-busy={status === 'loading'}
            className={`relative min-h-0 ${status === 'error' ? 'bg-sunk' : 'bg-[#fafafa]'} ${actual && status === 'loaded' ? 'overflow-auto overscroll-contain' : 'overflow-hidden'}`}>
            {status === 'error' ? (
              <div className="absolute inset-0 grid place-items-center p-4">
                <ErrorState compact title={`${f.short} did not load`} onRetry={retry} retryLabel="Retry" className="w-full max-w-[420px]">
                  The file did not arrive. Try again, or open it in a new tab.
                </ErrorState>
              </div>
            ) : actual ? (
              <img key={`${f.id}-1x`} {...imgProps} width={w} height={h} alt={`${f.short}: ${f.title}`} onClick={onImageClick}
                style={{ width: w, maxWidth: 'none', height: 'auto' }} className="block cursor-zoom-out select-none" />
            ) : (
              // Absolute inset gives the frame a definite size, so max-h-full fits tall figures (Fig. 4) without clipping.
              <div className="absolute inset-3 flex items-center justify-center sm:inset-6">
                <img key={f.id} {...imgProps} width={w} height={h} alt={`${f.short}: ${f.title}`} onClick={onImageClick}
                  className={`h-auto max-h-full w-auto max-w-full cursor-zoom-in object-contain transition-opacity duration-200 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`} />
              </div>
            )}
            {status === 'loading' && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <Loader size={36} label={`Loading ${f.short}`} showLabel />
              </div>
            )}
          </div>

          <aside className="flex max-h-[38dvh] flex-col gap-4 overflow-y-auto border-t border-line p-5 lg:max-h-none lg:border-l lg:border-t-0">
            <div>
              <p className="label">{f.meta}</p>
              <h2 id="lb-title" className="mt-2 text-lg font-semibold leading-snug tracking-[-0.01em] text-ink">{f.title}</h2>
            </div>
            <p id="lb-desc" className="text-sm leading-relaxed text-ink">{f.caption}</p>
            <div className="rounded-card border border-line bg-sunk px-3 py-2.5">
              <p className="label mb-1">Reading</p>
              <p className="text-sm leading-relaxed text-ink-2">{f.takeaway}</p>
              {f.link && (
                <a href={f.link.to} onClick={onClose}
                  className="-ml-1 mt-1 inline-flex h-11 items-center gap-1.5 rounded-chip px-1 text-sm font-medium text-ink underline decoration-line-strong underline-offset-4 transition-colors duration-150 hover:decoration-ink active:translate-y-px">
                  {f.link.label} <Icon name="arrow-right" size={14} />
                </a>
              )}
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono text-[11px] leading-relaxed text-ink-2">
              <dt className="text-ink-3">Source</dt><dd>{f.source}</dd>
              <dt className="text-ink-3">File</dt><dd className="tabular">{f.format} · {w} × {h} px</dd>
            </dl>
            <div className="mt-auto flex flex-wrap gap-2 pt-1">
              <button type="button" onClick={download} disabled={saving} aria-busy={saving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-chip bg-ink px-4 text-sm font-medium text-canvas transition-colors duration-150 hover:bg-ink/85 active:translate-y-px disabled:cursor-progress disabled:bg-ink/60">
                <Icon name="download-simple" size={16} /> {saving ? 'Preparing' : `Download ${f.format}`}
              </button>
              <a ref={newTabRef} href={src} target="_blank" rel="noopener noreferrer"
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-chip border px-4 text-sm font-medium text-ink transition-colors duration-150 hover:border-ink/40 active:translate-y-px ${hintNewTab ? 'border-accent bg-accent-tint' : 'border-line-strong bg-surface'}`}>
                Open in new tab <Icon name="arrow-up-right" size={14} />
              </a>
              {hintNewTab && <p className="w-full text-xs leading-relaxed text-ink-2">Downloads are blocked in this viewer. Save the full-resolution file from the new tab.</p>}
            </div>
            <p className="hidden font-mono text-[11px] text-ink-3 lg:block">
              Esc close · Z zoom · {actual ? 'arrows scroll' : '← → previous / next'}
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
