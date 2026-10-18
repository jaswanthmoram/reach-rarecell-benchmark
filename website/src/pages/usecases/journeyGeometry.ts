// Shared geometry for the hero's live journeys: the canvas and the DOM destination chips both read it.
import type { RoutePath } from '../../app/router';
import type { LiveLayout, LivePoint } from '../../ui';
import { DEST_PAGES, PERSONAS } from './personas';

/** Destination x sits this far from the right edge so the page chips fit beside the node. */
export const DEST_INSET = 150;
/** Vertical position (0..1) of each destination page node, shared with the DOM chips. */
export const destY = (page: RoutePath) => 0.16 + (DEST_PAGES.indexOf(page) / Math.max(1, DEST_PAGES.length - 1)) * 0.68;
export const originY = (i: number) => 0.1 + (i / (PERSONAS.length - 1)) * 0.8;

/**
 * Far layer for the shared LiveField: a sparse cell field, denser to the right. The few rare (signal) cells sit in the
 * lower middle, clear of the destination nodes on the right and of the copy when the hero stacks on phones.
 */
export const FAR_FIELD: LiveLayout = (r) => {
  const out: LivePoint[] = [];
  for (let i = 0; i < 720; i++) out.push({ x: Math.pow(r(), 0.7), y: r(), r: 0.5 + r() * 0.9 });
  for (let i = 0; i < 5; i++) out.push({ x: 0.42 + r() * 0.18, y: 0.66 + r() * 0.28, r: 2.4, signal: true });
  return out;
};

