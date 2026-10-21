import type { CSSProperties } from 'react';

/** Method swatch: filled for ranked detectors, dashed ring for reference methods. */
export const swatch = (color: string, ref: boolean): CSSProperties => ({
  flex: 'none', width: 9, height: 9, borderRadius: '50%', boxSizing: 'border-box',
  background: ref ? 'var(--surface)' : color, border: `1.5px ${ref ? 'dashed' : 'solid'} ${color}`,
});
