import { useLayoutEffect, useRef, useState } from 'react';

/**
 * Reads token values live from two hidden probes (one per theme), so the tables can never drift from tokens.css.
 * Returns `null` until measured.
 */
export function useLiveTokens(names: readonly string[]) {
  const light = useRef<HTMLDivElement>(null);
  const dark = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<{ light: Record<string, string>; dark: Record<string, string> } | null>(null);
  const key = names.join('|');
  useLayoutEffect(() => {
    const read = (el: HTMLElement | null) => {
      const cs = el ? getComputedStyle(el) : null;
      return Object.fromEntries(key.split('|').map((n) => [n, cs?.getPropertyValue(`--${n}`).trim().toLowerCase() ?? '']));
    };
    setValues({ light: read(light.current), dark: read(dark.current) });
  }, [key]);
  const probes = (
    <>
      <div ref={light} data-theme="light" hidden />
      <div ref={dark} data-theme="dark" hidden />
    </>
  );
  return { values, probes };
}

