import type { ReactNode } from 'react';
import { cx } from './util';

/* ---------- Layout pieces ---------- */
export function SysSection({ id, title, lead, children }: { id: string; title: string; lead: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-20 border-t border-line pb-6 pt-14 first:border-t-0 first:pt-2">
      <h2 id={`${id}-h`} className="text-2xl font-semibold tracking-[-0.02em] text-ink md:text-[1.75rem]">{title}</h2>
      <p className="mt-2 max-w-[66ch] text-base leading-relaxed text-ink-2">{lead}</p>
      <div className="mt-8 flex flex-col gap-10">{children}</div>
    </section>
  );
}

export function Sub({ title, note, children, id }: { title: string; note?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <div id={id} className="scroll-mt-20">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
        <h3 className="text-base font-semibold tracking-[-0.01em] text-ink">{title}</h3>
        {note && <p className="text-xs text-ink-3 sm:text-right">{note}</p>}
      </div>
      {children}
    </div>
  );
}

/**
 * A preview well: flat surface so the specimen carries the contrast. `dots` adds the dot texture where the dots mean
 * something (clear space). With a label, the label sits on a 32px strip above a hairline.
 */
export function Well({ children, className, label, dense, dots }: { children: ReactNode; className?: string; label?: string; dense?: boolean; dots?: boolean }) {
  return (
    <div className={cx('relative overflow-hidden rounded-card border border-line bg-surface', className)}>
      {(dots || label) && <span aria-hidden="true" className={cx('absolute inset-x-0 bottom-0', dots && 'dotfield bg-canvas [background-position:6px_6px]', label ? 'top-8 border-t border-line' : 'top-0')} />}
      {label && <span className="label absolute left-3 top-2 z-10 leading-4">{label}</span>}
      <div className={cx('relative flex min-w-0 flex-wrap items-center gap-3', dense ? 'p-4' : 'p-6 sm:p-8', label && (dense ? 'pt-12' : 'pt-14 sm:pt-16'))}>
        {children}
      </div>
    </div>
  );
}

/** Renders children once per theme, side by side, by scoping the token variables with data-theme. */
export function ThemePair({ children, className }: { children: (theme: 'light' | 'dark') => ReactNode; className?: string }) {
  return (
    <div className={cx('grid gap-3 sm:grid-cols-2', className)}>
      {(['light', 'dark'] as const).map((t) => (
        <div key={t} data-theme={t} className="relative overflow-hidden rounded-card border border-line bg-canvas">
          <span className="label absolute left-3 top-2.5">{t}</span>
          <div className="flex min-h-[132px] flex-wrap items-center justify-center gap-4 px-6 pb-6 pt-10">{children(t)}</div>
        </div>
      ))}
    </div>
  );
}

/** Usage line under a component specimen. */
export function Usage({ children }: { children: string }) {
  // Phones scroll the line sideways (wrapped code with trailing comments is unreadable); wide screens wrap.
  return <code tabIndex={0} className="block overflow-x-auto whitespace-pre md:whitespace-pre-wrap md:[overflow-wrap:anywhere] rounded-chip border border-line bg-sunk px-3 py-2 font-mono text-[12px] leading-relaxed text-ink-2">{children}</code>;
}

export function Ratio({ value, min }: { value: number | null; min: number }) {
  if (value === null) return <span className="font-mono text-xs text-ink-3">n/a</span>;
  const ok = value >= min;
  return (
    <span className={cx('inline-flex items-center gap-1 font-mono text-xs tabular', ok ? 'text-ink-2' : 'text-bad')}>
      {value.toFixed(2)}
      <span className={cx('rounded-chip px-1 text-[11px]', ok ? 'bg-sunk text-ink-3' : 'bg-sunk text-bad')}>{ok ? (value >= 4.5 ? 'AA' : `≥${min}`) : 'fail'}</span>
    </span>
  );
}
