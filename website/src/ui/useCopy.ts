import { useCallback, useEffect, useRef, useState } from 'react';

export type CopyState = 'idle' | 'copied' | 'failed';

export interface CopyOptions {
  /** Milliseconds before 'copied' or 'failed' goes back to 'idle' (default 1500). */
  resetMs?: number;
  /** Milliseconds before 'failed' goes back to 'idle' (default `resetMs`). */
  failedMs?: number;
  /** Keep 'failed' until `reset()` (for a "copy it by hand" notice that must stay up): true for every key, or only these keys. */
  stickyFailures?: boolean | readonly string[];
}

/** Status line for an `aria-live="polite"` region next to the button. */
const STATUS: Record<CopyState, string> = { idle: '', copied: 'Copied to the clipboard', failed: 'Not copied: select the text and copy it by hand' };

/** Clipboard API first; the hidden-textarea fallback takes focus to select, so focus is handed back afterwards. */
export async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return true; }
  } catch { /* blocked by permissions or an insecure context: try the legacy path */ }
  const prev = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
  document.body.appendChild(ta);
  ta.select();
  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    ta.remove();
    prev?.focus({ preventScroll: true });
  }
}

/**
 * One copy-feedback slot: `const { copy, stateOf, status } = useCopy();
 * <button onClick={() => copy(cmd, 'install')}>{stateOf('install') === 'copied' ? 'Copied' : 'Copy'}</button>
 * <span aria-live="polite" className="sr-only">{status}</span>`. The last copy wins; the reset timer is cleared on unmount.
 */
export function useCopy({ resetMs = 1500, failedMs = resetMs, stickyFailures = false }: CopyOptions = {}) {
  const [slot, setSlot] = useState<{ state: CopyState; key: string | null }>({ state: 'idle', key: null });
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const reset = useCallback(() => { window.clearTimeout(timer.current); setSlot({ state: 'idle', key: null }); }, []);

  const copy = useCallback(async (text: string, key: string | null = null) => {
    const ok = await writeClipboard(text);
    window.clearTimeout(timer.current);
    setSlot({ state: ok ? 'copied' : 'failed', key });
    const sticky = Array.isArray(stickyFailures) ? key != null && stickyFailures.includes(key) : stickyFailures === true;
    if (ok || !sticky) timer.current = window.setTimeout(() => setSlot({ state: 'idle', key: null }), ok ? resetMs : failedMs);
    return ok;
  }, [resetMs, failedMs, stickyFailures]);

  const stateOf = useCallback((key: string | null = null): CopyState => (slot.key === key ? slot.state : 'idle'), [slot]);
  return { state: slot.state, key: slot.key, status: STATUS[slot.state], copy, stateOf, reset };
}
