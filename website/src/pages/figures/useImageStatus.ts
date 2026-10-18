import { useCallback, useEffect, useRef, useState } from 'react';

export type ImageStatus = 'loading' | 'loaded' | 'error';

/**
 * Tracks one image through loading, loaded and error. The result is keyed by URL, so switching `src` (the viewer
 * stepping to another figure) reads as loading until that file settles. `retry` bumps an attempt counter that is
 * appended to the URL, so the browser re-requests a failed file instead of reusing the failure. A cached image can
 * finish before React attaches onLoad, so mount also checks `complete`; failures always arrive through onError.
 */
export function useImageStatus(src: string) {
  const [attempt, setAttempt] = useState(0);
  const url = attempt === 0 ? src : `${src}${src.includes('?') ? '&' : '?'}retry=${attempt}`;
  const [settled, setSettled] = useState<{ url: string; status: Exclude<ImageStatus, 'loading'> } | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const status: ImageStatus = settled?.url === url ? settled.status : 'loading';

  useEffect(() => {
    const img = imgRef.current;
    // Only trust `complete` for success: a deferred lazy image can report complete with no pixels yet.
    if (img?.complete && img.naturalWidth > 0) setSettled({ url, status: 'loaded' });
  }, [url]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  return {
    status,
    retry,
    imgProps: {
      ref: imgRef,
      src: url,
      onLoad: () => setSettled({ url, status: 'loaded' }),
      onError: () => setSettled({ url, status: 'error' }),
    },
  };
}
