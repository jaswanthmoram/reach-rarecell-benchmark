import { createContext, useCallback, useMemo } from 'react';
import { useCopy } from '../../ui/useCopy';

const COPY_OPTS = { resetMs: 1500 } as const;

/** One "Copied" at a time; a blocked clipboard raises an alert and selects the text (see Reproduce.tsx). */
export type CopyApi = { copied: string | null; copy: (key: string, text: string, pre: HTMLElement | null) => void };
export const CopyCtx = createContext<CopyApi>({ copied: null, copy: () => {} });

/** Select the block's text so a blocked clipboard still leaves one keystroke to copy. */
function selectText(el: HTMLElement | null) {
  const sel = window.getSelection();
  if (!el || !sel) return;
  const range = document.createRange();
  range.selectNodeContents(el);
  sel.removeAllRanges();
  sel.addRange(range);
}

/** The page's copy slot over the shared `useCopy`: a failure shows no "Copied", selects the block and calls `onBlocked`. */
export function usePageCopy(onBlocked: () => void): CopyApi {
  const { copy, reset, state, key } = useCopy(COPY_OPTS);
  const run = useCallback((k: string, text: string, pre: HTMLElement | null) => {
    void copy(text, k).then((ok) => { if (!ok) { reset(); selectText(pre); onBlocked(); } });
  }, [copy, reset, onBlocked]);
  const copied = state === 'copied' ? key : null;
  return useMemo(() => ({ copied, copy: run }), [copied, run]);
}
