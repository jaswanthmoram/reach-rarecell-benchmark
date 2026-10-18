import { useSyncExternalStore } from 'react';

/**
 * Which method's lens the hero focuses. Two channels: a transient hover (hero chips, matrix rows) over a pinned
 * choice (a clicked chip, the picker's first pick). The canvas reads `getFocusedLens()` every frame.
 * ponytail: module-level store; one page, one hero. Move to context if the hero ever renders twice.
 */
let hover: string | null = null;
let pinned: string | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export const hoverLens = (id: string | null) => { if (id !== hover) { hover = id; emit(); } };
export const pinLens = (id: string | null) => { if (id !== pinned) { pinned = id; emit(); } };
export const getFocusedLens = () => hover ?? pinned;
export const getPinnedLens = () => pinned;
export const subscribeLens = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
export const useFocusedLens = () => useSyncExternalStore(subscribeLens, getFocusedLens, () => null);
export const usePinnedLens = () => useSyncExternalStore(subscribeLens, getPinnedLens, () => null);
