import { useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';
const root = () => document.documentElement;
const read = (): Theme => (root().dataset.theme === 'dark' ? 'dark' : 'light');

const subscribe = (cb: () => void) => {
  const mo = new MutationObserver(cb);
  mo.observe(root(), { attributes: true, attributeFilter: ['data-theme'] });
  return () => mo.disconnect();
};

/** One source of truth for the nav toggle, the mobile sheet and the command palette. */
export const useTheme = () => useSyncExternalStore(subscribe, read);

export function setTheme(t: Theme) {
  root().dataset.theme = t;
  try { localStorage.setItem('reach-theme', t); } catch { /* storage blocked: theme still applies for this visit */ }
}
export const toggleTheme = () => setTheme(read() === 'dark' ? 'light' : 'dark');

/** Platform-correct shortcut label for the command palette. */
export const MOD_KEY = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘' : 'Ctrl';

/** Pages can open the palette without importing App: `openCommandPalette('FiRE')`. */
export const PALETTE_EVENT = 'reach:command-palette';
export const openCommandPalette = (query = '') => window.dispatchEvent(new CustomEvent(PALETTE_EVENT, { detail: query }));
