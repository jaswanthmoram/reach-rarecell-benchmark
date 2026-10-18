import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { Icon, Tabs, useToast } from '../../ui';
import { GLOBAL_STATS as G } from '../../data/benchmarkData';
import { FORMATS, hangOf, type CitationFormat, type FormatId } from './citations';
import { BreakAtSlash } from './BreakAtSlash';

type CopyState = 'idle' | 'done' | 'failed';
const COPIED_MS = 1800;

/* Secondary button at 36px, with the hit area padded to 44px for touch. */
const BTN = 'relative inline-flex h-9 items-center gap-2 rounded-chip text-sm font-medium transition-[background,border-color,color,transform] duration-150 active:translate-y-px before:absolute before:inset-x-0 before:-inset-y-1 before:content-[""]';
const COPY_BTN = `${BTN} min-w-[6.5rem] justify-center bg-ink px-3.5 text-canvas hover:bg-ink/85`;
const GHOST_BTN = `${BTN} px-2.5 text-ink-2 hover:bg-sunk hover:text-ink`;

const isFramed = () => { try { return window.self !== window.top; } catch { return true; } };
const isApple = () => /Mac|iPhone|iPad/.test(navigator.userAgent);
const isTouch = () => window.matchMedia?.('(pointer: coarse)').matches ?? false;

/** Select the visible citation so the reader can copy it by hand. */
function selectNode(el: HTMLElement | null) {
  const sel = window.getSelection();
  if (!el || !sel) return false;
  const range = document.createRange();
  range.selectNodeContents(el);
  sel.removeAllRanges();
  sel.addRange(range);
  return true;
}

/** Clipboard API first; then the legacy copy command on the selected preview (works in some sandboxed frames). */
async function writeClipboard(text: string, el: HTMLElement | null): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('no clipboard');
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      if (!selectNode(el)) return false;
      const ok = document.execCommand('copy');
      if (ok) window.getSelection()?.removeAllRanges();
      return ok;
    } catch { return false; }
  }
}

/** Mono formats keep their line structure; wrapped lines hang under the field value. URLs break only after "/". */
function Preview({ f, nodeRef }: { f: CitationFormat; nodeRef: RefObject<HTMLDivElement | null> }) {
  if (!f.mono) {
    return (
      <div ref={nodeRef} className="text-base leading-[1.7] text-ink [overflow-wrap:break-word]" style={f.hanging ? { paddingLeft: '2rem', textIndent: '-2rem' } : undefined}>
        <BreakAtSlash text={f.text} />
      </div>
    );
  }
  return (
    <div ref={nodeRef}>
      <pre className="whitespace-pre-wrap font-mono text-[12px] leading-[1.75] text-ink [overflow-wrap:break-word] sm:text-[13px]">
        <code>
          {f.text.split('\n').map((line, i) => {
            const hang = hangOf(line);
            // Narrow screens hang every wrap at 4ch; from sm up, wraps align under the field value.
            return (
              <span key={i} className="block [padding-left:4ch] [text-indent:-4ch] sm:[padding-left:var(--hang)] sm:[text-indent:calc(var(--hang)*-1)]" style={{ '--hang': `${hang}ch` } as CSSProperties}>
                {line ? <BreakAtSlash text={line} /> : ' '}
              </span>
            );
          })}
        </code>
      </pre>
    </div>
  );
}

/** Shown when both clipboard routes fail: the text is already selected, so one keystroke finishes the job. */
function CopyFailed({ label, onRetry }: { label: string; onRetry: () => void }) {
  const hint = isTouch() ? 'Tap Copy in the selection menu.' : `Press ${isApple() ? '⌘C' : 'Ctrl+C'} to copy it.`;
  return (
    <div role="alert" className="flex flex-wrap items-start gap-x-3 gap-y-2 border-t border-bad/30 px-4 py-3 md:px-6">
      <Icon name="warning-circle" size={16} className="mt-0.5 shrink-0 text-bad" />
      <div className="min-w-0 flex-1 basis-[14rem]">
        <p className="text-sm font-medium text-ink">This browser blocked the clipboard</p>
        <p className="mt-0.5 text-sm leading-relaxed text-ink-2">The {label} citation above is selected. {hint}</p>
      </div>
      <button type="button" onClick={onRetry} className={`${GHOST_BTN} -my-1 border border-line`}>
        <Icon name="copy" size={14} />Try again
      </button>
    </div>
  );
}

/** Format chooser above one preview; Copy is the primary job and follows the active format. */
export function CitationPanel() {
  const [id, setId] = useState<FormatId>('bibtex');
  const [copy, setCopy] = useState<CopyState>('idle');
  const nodeRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const toast = useToast();
  const f = FORMATS.find((x) => x.id === id) ?? FORMATS[0];
  const ext = f.file.slice(f.file.lastIndexOf('.'));

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const choose = (next: FormatId) => { window.clearTimeout(timer.current); setCopy('idle'); setId(next); };

  const handleCopy = async () => {
    window.clearTimeout(timer.current);
    const ok = await writeClipboard(f.text, nodeRef.current);
    if (ok) {
      setCopy('done');
      toast({ title: `${f.label} citation copied`, description: G.doiConfirmed ? undefined : 'The DOI is pending; check it before you submit.', tone: 'ok' });
      timer.current = window.setTimeout(() => setCopy('idle'), COPIED_MS);
      return;
    }
    setCopy('failed');
    selectNode(nodeRef.current);
    toast({ title: 'Copy failed', description: 'The citation is selected; copy it with the keyboard.', tone: 'bad' });
  };

  const handleDownload = () => {
    const blocked = () => toast({ title: 'Download is unavailable here; use Copy', description: `This preview blocks file downloads, so ${f.file} was not saved.`, tone: 'bad' });
    if (isFramed()) { blocked(); return; }
    try {
      const url = URL.createObjectURL(new Blob([f.text], { type: 'text/plain;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url; a.download = f.file; a.rel = 'noopener';
      document.body.appendChild(a); a.click(); a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast({ title: `Downloading ${f.file}`, tone: 'ok' });
    } catch { blocked(); }
  };

  const done = copy === 'done';
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex"><Tabs label="Citation format" value={id} onChange={choose} options={FORMATS.map((x) => ({ value: x.id, label: x.label }))} /></div>
      <figure role="tabpanel" aria-label={`${f.label} citation`} className="min-w-0 overflow-hidden rounded-card border border-line bg-surface">
        <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line bg-sunk/60 py-2 pl-4 pr-2">
          <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 text-sm text-ink-2">
            For {f.use}
            {!G.doiConfirmed && <span className="text-xs text-ink-2">· DOI pending</span>}
          </span>
          <span className="flex items-center gap-1">
            <button type="button" onClick={handleDownload} className={GHOST_BTN} aria-label={`Download ${f.file}`}>
              <Icon name="download-simple" size={15} /><span className="font-mono text-[13px]">{ext}</span>
            </button>
            <button type="button" onClick={handleCopy} className={COPY_BTN} aria-label={done ? `${f.label} citation copied` : `Copy ${f.label} citation`} aria-live="polite">
              <Icon name={done ? 'check' : 'copy'} size={15} className={done ? 'pop-in' : ''} />
              {done ? 'Copied' : 'Copy'}
            </button>
          </span>
        </figcaption>
        <div key={f.id} className="rise px-4 py-5 md:px-6 md:py-6 [animation-duration:240ms]">
          <Preview f={f} nodeRef={nodeRef} />
        </div>
        {copy === 'failed' && <CopyFailed label={f.label} onRetry={handleCopy} />}
      </figure>
    </div>
  );
}
