import { cloneElement, useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { Container } from './Layout';
import { Icon, type IconName } from './Icon';
import { Mark } from './Logo';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

/* ---------- Loader ---------- */
/**
 * Branded loader: the mark's cells pulse in a wave, then the signal cell is found and the reticle closes.
 * CSS only. Reduced motion shows the complete mark, static. Always announces `label` to screen readers.
 */
export function Loader({ size = 32, label = 'Loading', showLabel, className }: { size?: number; label?: string; showLabel?: boolean; className?: string }) {
  return (
    <span role="status" className={cx('inline-flex items-center gap-3', className)}>
      <Mark size={size} animated variant={size >= 24 ? 'full' : 'compact'} />
      {showLabel ? <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-3">{label}</span> : <span className="sr-only">{label}</span>}
    </span>
  );
}

/* ---------- Skeletons ---------- */
/** One placeholder block. Size it with classes (`h-4 w-40`). Decorative: wrap groups in an element with aria-busy. */
export function Skeleton({ className, round }: { className?: string; round?: boolean }) {
  return <span aria-hidden="true" className={cx('skeleton block', round ? 'rounded-full' : 'rounded-chip', className ?? 'h-4 w-full')} />;
}

const LINE_W = ['w-full', 'w-[92%]', 'w-[78%]', 'w-[86%]', 'w-[64%]'];
/** Prose placeholder: `lines` bars, the last one short. */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <span aria-hidden="true" className={cx('flex flex-col gap-2.5', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cx('h-3', i === lines - 1 && lines > 1 ? 'w-[55%]' : LINE_W[i % LINE_W.length])} />
      ))}
    </span>
  );
}

/** Table placeholder with the system's 40px rows; first column wider, numbers right-aligned. */
export function SkeletonTable({ rows = 6, cols = 4, className }: { rows?: number; cols?: number; className?: string }) {
  const grid = { gridTemplateColumns: `minmax(0,2fr) repeat(${cols - 1}, minmax(0,1fr))` };
  return (
    <div aria-hidden="true" className={cx('overflow-hidden rounded-card border border-line bg-surface', className)}>
      <div className="grid h-10 items-center gap-6 border-b border-line px-4" style={grid}>
        {Array.from({ length: cols }, (_, c) => <Skeleton key={c} className={cx('h-2.5', c === 0 ? 'w-20' : 'ml-auto w-12')} />)}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="grid h-10 items-center gap-6 border-b border-line px-4 last:border-b-0" style={grid}>
          {Array.from({ length: cols }, (_, c) => (
            <span key={c} className={cx('flex items-center gap-2', c > 0 && 'justify-end')}>
              {c === 0 && <Skeleton round className="size-2.5 shrink-0" />}
              <Skeleton className={cx('h-3', c === 0 ? (r % 2 ? 'w-28' : 'w-36') : 'w-14')} />
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Card placeholder: label, value, two context lines. */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cx('flex flex-col gap-3 rounded-card border border-line bg-surface p-5', className)}>
      <Skeleton className="h-2.5 w-24" />
      <Skeleton className="h-8 w-28" />
      <SkeletonText lines={2} />
    </div>
  );
}

/** Route-level loading view: the compact PageHeader's shape with the loader in the art slot, then a table. */
export function PageSkeleton({ label = 'Loading page' }: { label?: string }) {
  return (
    <div aria-busy="true">
      <header className="relative border-b border-line">
        <Container className="flex items-start justify-between gap-8 pb-8 pt-12">
          <div className="flex w-full max-w-[640px] flex-col">
            <Skeleton className="mb-4 h-2.5 w-28" />
            <Skeleton className="h-9 w-[82%] md:h-10" />
            <Skeleton className="mt-2.5 h-9 w-[46%] md:h-10" />
            <SkeletonText lines={2} className="mt-5 max-w-[62ch]" />
          </div>
          <Loader size={40} label={label} className="hidden pr-4 pt-6 md:inline-flex" />
        </Container>
      </header>
      <Container className="py-10">
        <span className="md:hidden"><Loader size={28} label={label} showLabel className="mb-6" /></span>
        <div className="mb-5 flex gap-2">
          <Skeleton className="h-8 w-40 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
        <SkeletonTable rows={7} cols={4} />
      </Container>
    </div>
  );
}

/* ---------- Empty and error ---------- */
interface StateProps { title: ReactNode; children?: ReactNode; action?: ReactNode; className?: string; compact?: boolean }

/** Nothing to show (a filter with no match, an empty selection). The mark appears with no cell found. */
export function EmptyState({ title, children, action, className, compact, icon }: StateProps & { icon?: IconName }) {
  return (
    <div className={cx('flex flex-col items-center rounded-card border border-dashed border-line-strong text-center', compact ? 'gap-2 px-5 py-8' : 'gap-3 px-6 py-14', className)}>
      <span className="mb-1 grid size-14 place-items-center rounded-full border border-line bg-surface text-ink-3">
        {icon ? <Icon name={icon} size={22} /> : <Mark size={30} found={false} />}
      </span>
      <p className="text-base font-semibold tracking-[-0.01em] text-ink">{title}</p>
      {children && <div className="max-w-[46ch] text-sm leading-relaxed text-ink-2">{children}</div>}
      {action && <div className="mt-2 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

/**
 * Something failed. Names the problem, offers recovery. `onRetry` may return a promise: the button shows the
 * loader while it runs and is disabled so it can't be double-fired.
 */
export function ErrorState({ title = 'This part of the page did not load', children, detail, onRetry, retryLabel = 'Try again', action, className, compact }:
  Partial<StateProps> & { detail?: string; onRetry?: () => void | Promise<unknown>; retryLabel?: string }) {
  const [busy, setBusy] = useState(false);
  const retry = async () => {
    if (!onRetry || busy) return;
    setBusy(true);
    try { await onRetry(); } finally { setBusy(false); }
  };
  return (
    <div role="alert" className={cx('flex flex-col items-center rounded-card border border-line bg-surface text-center', compact ? 'gap-2 px-5 py-8' : 'gap-3 px-6 py-14', className)}>
      <span className="mb-1 grid size-14 place-items-center rounded-full border border-bad/30 text-bad">
        <Icon name="warning-circle" size={24} />
      </span>
      <p className="text-base font-semibold tracking-[-0.01em] text-ink">{title}</p>
      {children && <div className="max-w-[48ch] text-sm leading-relaxed text-ink-2">{children}</div>}
      {detail && <code className="max-w-full overflow-x-auto rounded-chip border border-line bg-sunk px-2.5 py-1.5 font-mono text-xs text-ink-2">{detail}</code>}
      {(onRetry || action) && (
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {onRetry && (
            <button type="button" onClick={retry} disabled={busy} aria-busy={busy}
              className="inline-flex h-10 items-center gap-2 rounded-chip bg-ink px-4 text-sm font-medium text-canvas transition-[background,transform] duration-150 hover:bg-ink/85 active:translate-y-px disabled:cursor-progress disabled:bg-ink/60">
              {busy ? <><Mark size={16} animated variant="compact" /><span>Retrying</span></> : retryLabel}
            </button>
          )}
          {action}
        </div>
      )}
    </div>
  );
}

/* ---------- Tooltip ---------- */
/**
 * Short, non-essential hint for an icon button or abbreviation. Opens on hover (after 250ms) and on keyboard
 * focus, closes on Escape, and wires `aria-describedby` onto the trigger. The child must be one focusable element.
 * Keep the content to a phrase: anything a reader needs belongs in visible text.
 */
export function Tooltip({ content, children, side = 'top' }: { content: ReactNode; children: ReactElement<Record<string, unknown>>; side?: 'top' | 'bottom' }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const show = (delay: number) => { window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setOpen(true), delay); };
  const hide = () => { window.clearTimeout(timer.current); setOpen(false); };
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') hide(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <span className="relative inline-flex"
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') show(250); }} onPointerLeave={hide}
      onFocus={() => show(0)} onBlur={hide}>
      {cloneElement(children, { 'aria-describedby': id })}
      <span id={id} role="tooltip" aria-hidden="true"
        className={cx('pointer-events-none absolute left-1/2 z-50 w-max max-w-[240px] -translate-x-1/2 rounded-chip bg-ink px-2 py-1 text-xs leading-snug text-canvas shadow-pop transition-[opacity,transform] duration-150',
          side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
          open ? 'translate-y-0 opacity-100' : cx('opacity-0', side === 'top' ? 'translate-y-1' : '-translate-y-1'))}>
        {content}
      </span>
    </span>
  );
}
