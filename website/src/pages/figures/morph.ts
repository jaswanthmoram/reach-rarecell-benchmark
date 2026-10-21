import { flushSync } from 'react-dom';
import { canAnimate } from '../../ui/motion';
import { scrollToId } from '../../lib/router';

/** Shared-element name: the card image grows into the viewer image and shrinks back (audit Figures P1). */
const MORPH_NAME = 'fig-active';
/** Never hold the old frame longer than this while the viewer image decodes. */
const DECODE_CAP_MS = 300;
/** Longest wait for a smooth scroll to settle before the target card rings. */
const SETTLE_CAP_MS = 1400;
const SETTLE_FRAMES = 4;

type StartVT = (cb: () => Promise<void> | void) => { ready: Promise<void>; finished: Promise<void> };

const noop = () => {};
/** The transition now running. A newer one skips it (ready rejects with AbortError), and only the newest cleans up. */
let current: { card: HTMLElement } | null = null;

export const cardImage = (id: string) => document.querySelector<HTMLElement>(`#${id} [data-fig-img]`);
const viewerImage = () => document.querySelector<HTMLImageElement>('[data-fig-viewer-img]');

const inViewport = (el: HTMLElement) => {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < window.innerHeight && r.width > 0;
};

const decoded = (img: HTMLImageElement | null) =>
  Promise.race([img?.decode().catch(() => undefined) ?? Promise.resolve(), new Promise<void>((r) => { window.setTimeout(r, DECODE_CAP_MS); })]);

/**
 * Run a viewer open/close inside a View Transition so `card` and the viewer image share one element.
 * Falls back to a plain state change when the browser has no View Transitions, under reduced or paused motion,
 * or when the card is off screen (stepping in the viewer can leave the open figure far from where it started).
 * `update(true)` runs inside the transition; `update(false)` is the plain fallback.
 */
export function morph(update: (viaTransition: boolean) => void, card: HTMLElement | null, dir: 'open' | 'close') {
  const start = (document as Document & { startViewTransition?: StartVT }).startViewTransition?.bind(document);
  if (!start || !card || !canAnimate() || !inViewport(card)) { update(false); return; }
  const html = document.documentElement;
  // Esc during the open morph starts a close morph that skips this one; drop the old card's name so only one element holds it.
  if (current && current.card !== card) current.card.style.viewTransitionName = '';
  const mine = { card };
  current = mine;
  html.classList.add('fig-vt');
  if (dir === 'open') card.style.viewTransitionName = MORPH_NAME;
  const vt = start(async () => {
    if (dir === 'open') card.style.viewTransitionName = '';
    flushSync(() => update(true));
    if (dir === 'close') card.style.viewTransitionName = MORPH_NAME;
    else await decoded(viewerImage());
  });
  vt.ready.catch(noop);
  vt.finished.catch(noop).finally(() => {
    if (current !== mine) return; // a newer transition owns the classes now
    current = null;
    card.style.viewTransitionName = '';
    html.classList.remove('fig-vt');
  });
}

/** Resolve once the page has stopped scrolling (or after a cap), so the ring plays where the reader looks. */
function settled() {
  return new Promise<void>((resolve) => {
    const t0 = performance.now();
    let last = window.scrollY;
    let still = 0;
    const tick = () => {
      const y = window.scrollY;
      still = y === last ? still + 1 : 0;
      last = y;
      if (still >= SETTLE_FRAMES || performance.now() - t0 > SETTLE_CAP_MS) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/** Contact-sheet jump: scroll to the card, ring it once, and move focus to its title for keyboard readers. */
export async function jumpTo(id: string) {
  scrollToId(id);
  await settled();
  const card = document.getElementById(id);
  if (!card) return;
  card.querySelector<HTMLElement>('[data-fig-title]')?.focus({ preventScroll: true });
  delete card.dataset.flash;
  void card.offsetWidth; // restart the ring if the same figure is picked twice
  card.dataset.flash = 'on';
}
