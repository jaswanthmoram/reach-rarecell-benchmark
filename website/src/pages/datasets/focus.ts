import { useSyncExternalStore } from 'react';

/**
 * The cohort under the pointer (or keyboard focus) anywhere on the page: catalogue rows, specimen cards and the
 * compare picker write it; the hero's specimen plate reads it and lights that well. A tiny external store, so a
 * hover never re-renders the catalogue or the comparison.
 */
let current: string | null = null;
const subs = new Set<() => void>();

export function setFocusCohort(id: string | null) {
  if (id === current) return;
  current = id;
  subs.forEach((f) => f());
}
export const getFocusCohort = () => current;
export const subscribeFocus = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
export const useFocusCohort = () => useSyncExternalStore(subscribeFocus, getFocusCohort, getFocusCohort);

/** Spread on any element that stands for one cohort. */
export const focusHandlers = (id: string) => ({
  onMouseEnter: () => setFocusCohort(id),
  onMouseLeave: () => setFocusCohort(null),
  onFocus: () => setFocusCohort(id),
  onBlur: () => setFocusCohort(null),
});
