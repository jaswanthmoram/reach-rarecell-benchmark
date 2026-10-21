import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cx } from '../../lib/format';
import { ArrowRight, ICON_STROKE } from '../../ui/icons';
import { REFERENCE_ROWS, type Row } from './model';

/** Method identity dot: solid for ranked detectors, dashed ring for the unranked references. */
export function Dot({ row, size = 10 }: { row: Row; size?: number }) {
  return (
    <span aria-hidden="true" className="box-border inline-block flex-none rounded-full"
      style={row.isRef ? { width: size, height: size, border: `1.5px dashed ${row.color}` } : { width: size, height: size, background: row.color }} />
  );
}

/** "Dashed marks, …: CaSee 0.501 · expr_threshold 0.331 · random_baseline 0.039" */
export function RefKey({ lead, value, className }: { lead: string; value: (r: Row) => string; className?: string }) {
  return (
    <p className={cx('m-0 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] text-ink-3', className)}>
      <span>{lead}</span>
      {REFERENCE_ROWS.map((r) => (
        <span key={r.id} className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 border-l border-dashed" style={{ borderColor: r.color }} />
          {r.name} <span className="text-ink-2">{value(r)}</span>
        </span>
      ))}
    </p>
  );
}

/**
 * Horizontally scrollable region for the wide matrices: a "Scroll sideways" hint while the content overflows,
 * and a right-edge fade that disappears once the reader reaches the last column.
 */
export function ScrollRegion({ label, hint, children, className }: { label: string; hint: string; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ overflows: false, more: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const overflows = el.scrollWidth > el.clientWidth + 2;
      const more = overflows && el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
      setState((s) => (s.overflows === overflows && s.more === more ? s : { overflows, more }));
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', update); ro.disconnect(); };
  }, []);
  return (
    <div className={className}>
      {state.overflows && (
        <p className="m-0 mb-3 inline-flex items-center gap-1.5 font-mono text-[11px] text-ink-3">
          {hint}<ArrowRight size={12} strokeWidth={ICON_STROKE} aria-hidden="true" />
        </p>
      )}
      <div className="relative">
        <div ref={ref} role="region" aria-label={label} tabIndex={0} className="max-w-full overflow-x-auto">{children}</div>
        <div aria-hidden="true"
          className={cx('pointer-events-none absolute inset-y-0 right-0 w-12 transition-opacity duration-[var(--dur-2)]', state.more ? 'opacity-100' : 'opacity-0')}
          style={{ background: 'linear-gradient(90deg, transparent, var(--canvas))' }} />
      </div>
    </div>
  );
}

export const MONO_LABEL = 'font-mono text-[11px] uppercase tracking-[0.06em]';
/** Section rhythm: topic changes get generous space above (audit S-14). */
export const SECTION = 'border-t border-line';
export const INNER = 'mx-auto max-w-[1240px] px-4 pb-16 pt-16 sm:px-6 sm:pb-24 sm:pt-24';
