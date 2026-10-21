import { useLayoutEffect, useRef } from 'react';
import { motionAllowed } from './paused';

/** Same glide as the leaderboard rows and the methods shortlist (audit P2). */
const GLIDE_MS = 360;

/**
 * FLIP glide for re-ordered lists: when `dep` changes, every `[data-glide="<stable key>"]` item that stays slides from
 * its old place to its new one; items that join simply appear. Positions are measured with getBoundingClientRect
 * relative to the container, and a nested `[data-glide]` group only adds its own move. Transform only; reduced or
 * paused motion moves instantly. GSAP-free.
 * `const ref = useGlide<HTMLUListElement>(sortKey); <ul ref={ref}>{rows.map((r) => <li data-glide={r.id}>...)}</ul>`
 */
export function useGlide<T extends HTMLElement>(dep: string) {
  const ref = useRef<T>(null);
  const last = useRef(new Map<string, number>());

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const top0 = root.getBoundingClientRect().top;
    const els = Array.from(root.querySelectorAll<HTMLElement>('[data-glide]'));
    const next = new Map(els.map((el) => [el.dataset.glide ?? '', el.getBoundingClientRect().top - top0]));
    const prev = last.current;
    last.current = next;
    if (prev.size === 0 || !motionAllowed()) return;

    const delta = (el: HTMLElement | null) => {
      const k = el?.dataset.glide ?? '';
      const before = prev.get(k);
      const after = next.get(k);
      return before == null || after == null ? 0 : before - after;
    };
    const moved = els.flatMap((el) => {
      const parent = el.parentElement?.closest<HTMLElement>('[data-glide]');
      const dy = delta(el) - (parent && root.contains(parent) ? delta(parent) : 0);
      if (!prev.has(el.dataset.glide ?? '') || Math.abs(dy) < 1) return [];
      el.style.transition = 'none';
      el.style.transform = `translateY(${dy}px)`;
      return [el];
    });
    if (moved.length === 0) return;
    const frame = requestAnimationFrame(() => {
      moved.forEach((el) => { el.style.transition = `transform ${GLIDE_MS}ms var(--ease-out)`; el.style.transform = ''; });
    });
    const done = window.setTimeout(() => moved.forEach((el) => { el.style.transition = ''; }), GLIDE_MS + 40);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(done);
      moved.forEach((el) => { el.style.transition = ''; el.style.transform = ''; });
    };
  }, [dep]);

  return ref;
}
