import './motion.css';

/*
 * Section choreography plumbing shared by PageHeader, SectionHeader, SplitHeading and Reveal.
 * - `entranceState`: where an element sits at mount, so only below-the-fold content is ever hidden.
 * - enter triggers: one shared IntersectionObserver per start line (no ScrollTrigger per header or group).
 * - section cues: a SectionHeader announces when its section's Reveal groups may follow it (<= 0.1s later).
 * - top rules: the section's hairline (its border-top) draws across from the left (motion.css).
 */

export type EntranceState = 'above' | 'inview' | 'below';

/** 'above': scrolled past (show at once). 'inview': on screen at mount (animate now). 'below': wait for the scroll. */
export function entranceState(el: Element): EntranceState {
  const r = el.getBoundingClientRect();
  if (r.bottom <= 0) return 'above';
  return r.top < window.innerHeight ? 'inview' : 'below';
}

/** ScrollTrigger start, clamped so content near the end of a short page still reaches it. */
export const clampStart = (start: string) => (start.startsWith('clamp(') ? start : `clamp(${start})`);

/* ---------- Page slots: mount-time entrances cascade ---------- */
let nextSlot = 0;
const nowSec = () => performance.now() / 1000;
/** Longest hold one mount-time entrance may put on the next (r10: no long cascades on load). */
const MAX_LEAD = 0.1;

/** Seconds to wait so this entrance starts after the ones already queued at mount. */
export function slotDelay(): number {
  return Math.max(0, nextSlot - nowSec());
}

const slots = new WeakMap<Element, number>();

/**
 * Claim the next mount-time slot for `el`: returns how many seconds to wait, and holds the page for `lead` seconds
 * (capped at 0.1s) after that. Idempotent per element, so an effect that re-runs (StrictMode, a breakpoint) keeps
 * its first slot. The kit itself no longer animates content that is on screen at mount; this stays for pages.
 */
export function takeSlot(el: Element, lead: number): number {
  const hold = Math.min(MAX_LEAD, Math.max(0, lead));
  const now = nowSec();
  const prev = slots.get(el);
  if (prev !== undefined && prev + hold > now) return Math.max(0, prev - now);
  const start = Math.max(now, nextSlot);
  nextSlot = start + hold;
  slots.set(el, start);
  return start - now;
}

/* ---------- Enter triggers: one shared IntersectionObserver per start line ----------
 * Replaces one ScrollTrigger per header/group: no scroll listener, no refresh, no layout read per frame.
 * The root is stretched far above the viewport, so content jumped past (deep link, End key) counts as entered too
 * (ScrollTrigger's onLeave). */
const FAR_ABOVE_PX = 1_000_000;
/** Kit default start line: the element's top reaches 88% of the viewport. */
export const ENTER_AT = 'top 88%';
const observers = new Map<string, { io: IntersectionObserver; cbs: Map<Element, () => void> }>();

/** Percent of the viewport for a ScrollTrigger-style start ('top 88%', 'clamp(top 90%)'); null when not that shape. */
export function startPercent(start: string): number | null {
  const m = /^(?:clamp\()?\s*top\s+(\d+(?:\.\d+)?)%\s*\)?$/.exec(start.trim());
  return m ? Math.min(100, Math.max(0, Number(m[1]))) : null;
}

/**
 * Run `cb` once when `el`'s top reaches `start` (a 'top N%' line; default 'top 88%') or `el` is already above it.
 * Without IntersectionObserver it runs now. Returns a cancel function.
 */
export function onEnter(el: Element, cb: () => void, start: string = ENTER_AT): () => void {
  const pct = startPercent(start) ?? 88;
  if (typeof IntersectionObserver === 'undefined') { cb(); return () => undefined; }
  const key = String(pct);
  let entry = observers.get(key);
  if (!entry) {
    const cbs = new Map<Element, () => void>();
    const io = new IntersectionObserver((records) => {
      for (const r of records) {
        if (!r.isIntersecting) continue;
        const run = cbs.get(r.target);
        cbs.delete(r.target);
        io.unobserve(r.target);
        run?.();
      }
    }, { rootMargin: `${FAR_ABOVE_PX}px 0px ${-(100 - pct)}% 0px`, threshold: 0 });
    entry = { io, cbs };
    observers.set(key, entry);
  }
  const { io, cbs } = entry;
  cbs.set(el, cb);
  io.observe(el);
  return () => { if (cbs.get(el) === cb) { cbs.delete(el); io.unobserve(el); } };
}

/* ---------- Section cues: header first, then the section's Reveal groups ---------- */
interface Cue { readyAt: number | null; waiters: Set<() => void> }
const cues = new WeakMap<Element, Cue>();
/** If a header never plays (removed, not reached yet), its section's groups are not held longer than this. */
const CUE_SAFETY_MS = 200;

export const sectionOf = (el: Element): Element | null => el.closest('section');

/** The first SectionHeader in a section owns its cue. Returns false if another header already does. */
export function claimCue(section: Element): boolean {
  if (cues.has(section)) return false;
  cues.set(section, { readyAt: null, waiters: new Set() });
  return true;
}

/** The header has started: its section's groups may begin `lead` seconds from now. */
export function fireCue(section: Element, lead: number): void {
  const cue = cues.get(section);
  if (!cue || cue.readyAt !== null) return;
  cue.readyAt = nowSec() + lead;
  cue.waiters.forEach((w) => w());
  cue.waiters.clear();
}

export function releaseCue(section: Element): void {
  const cue = cues.get(section);
  cue?.waiters.forEach((w) => w());
  cues.delete(section);
}

/**
 * Call `run(delaySeconds)` when the element's section header has had its turn. No header in the section:
 * runs now (after any mount-time slot). Returns a cancel function.
 */
export function whenCued(el: Element, run: (delay: number) => void): () => void {
  const section = sectionOf(el);
  const cue = section ? cues.get(section) : undefined;
  if (!cue) { run(slotDelay()); return () => undefined; }
  if (cue.readyAt !== null) { run(Math.max(0, cue.readyAt - nowSec())); return () => undefined; }
  let done = false;
  const go = () => {
    if (done) return;
    done = true;
    window.clearTimeout(timer);
    cue.waiters.delete(go);
    run(cue.readyAt === null ? 0 : Math.max(0, cue.readyAt - nowSec()));
  };
  const timer = window.setTimeout(go, CUE_SAFETY_MS);
  cue.waiters.add(go);
  return () => { done = true; window.clearTimeout(timer); cue.waiters.delete(go); };
}

/* ---------- Top rules ---------- */
/** Matches the transition in motion.css, plus a frame of slack before the real border comes back. */
export const RULE_MS = 420;

/**
 * Can the section's border-top be drawn by a pseudo-element? Needs a visible top border, no overflow clip, and no
 * absolutely positioned descendant that would change containing block when the section becomes `position: relative`.
 */
function ruleFits(section: HTMLElement): boolean {
  const cs = getComputedStyle(section);
  if (!(parseFloat(cs.borderTopWidth) > 0) || cs.borderTopStyle === 'none') return false;
  if (cs.overflowY !== 'visible' || cs.overflowX !== 'visible') return false;
  if (cs.position !== 'static') return true;
  for (const el of Array.from(section.querySelectorAll<HTMLElement>('[class*="absolute"]'))) {
    const r = el.getBoundingClientRect();
    if (r.width <= 1 && r.height <= 1) continue; // sr-only and similar
    if (getComputedStyle(el).position !== 'absolute') continue;
    let p = el.parentElement;
    let anchored = false;
    while (p && p !== section) {
      if (getComputedStyle(p).position !== 'static') { anchored = true; break; }
      p = p.parentElement;
    }
    if (!anchored) return false;
  }
  return true;
}

export interface RuleHandle { draw: () => void; clear: () => void }

/** Hide the section's top border and stand a scaleX(0) rule in its place. Returns null when it cannot. */
export function armRule(section: Element): RuleHandle | null {
  if (!(section instanceof HTMLElement) || section.dataset.rule || !ruleFits(section)) return null;
  const cs = getComputedStyle(section);
  const madeRelative = cs.position === 'static';
  section.style.setProperty('--rule-c', cs.borderTopColor);
  section.style.setProperty('--rule-w', cs.borderTopWidth);
  if (madeRelative) section.style.position = 'relative';
  section.dataset.rule = 'pending';
  let cleared = false;
  return {
    draw: () => { if (!cleared) section.dataset.rule = 'draw'; },
    clear: () => {
      if (cleared) return;
      cleared = true;
      delete section.dataset.rule;
      section.style.removeProperty('--rule-c');
      section.style.removeProperty('--rule-w');
      if (madeRelative) section.style.position = '';
    },
  };
}

/* ---------- Safety net ---------- */
/** Slack after an entrance should have ended before it is forced to its final state. */
const SAFETY_SLACK_MS = 400;

/**
 * If the GSAP ticker stalls (throttled tab, frozen frame), timers still run: force the final state once the
 * entrance should long be over, so nothing is left hidden. Returns a cancel function.
 */
export function safetyNet(afterSec: number, force: () => void): () => void {
  const t = window.setTimeout(force, afterSec * 1000 + SAFETY_SLACK_MS);
  return () => window.clearTimeout(t);
}
