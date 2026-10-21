import type { ReactNode } from 'react';
import { cx } from '../../lib/format';
import { href } from '../../lib/router';
import { ArrowRight, ICON_STROKE } from '../../ui/icons';
import type { Dest } from './personas';

/** Mono page chip with an arrow that nudges 2px on hover (board `.chip`). */
export function PageChip({ to, children, className }: { to: Dest; children: ReactNode; className?: string }) {
  return (
    <a href={href(to.path, to.query)} className={cx('uc-chip inline-flex items-center gap-1.5 rounded-chip border border-line bg-surface px-2 py-1 font-mono text-xs text-ink no-underline', className)}>
      {children} <ArrowRight className="uc-arr" size={12} strokeWidth={ICON_STROKE} aria-hidden="true" />
    </a>
  );
}

/** Branch glyph used for edge-case questions. */
export function BranchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--cell)" strokeWidth="1.6" aria-hidden="true" className="mt-0.5 flex-none">
      <circle cx="6" cy="5" r="2" /><circle cx="6" cy="19" r="2" /><circle cx="18" cy="8" r="2" /><path d="M6 7v10M18 10c0 4-6 3-12 7" />
    </svg>
  );
}

/** Small ringed dot: the page that answers the main question. */
export function KeyDot({ size = 18 }: { size?: number }) {
  const inner = Math.round(size * 0.44);
  return (
    <span className="grid shrink-0 place-items-center rounded-full border-[1.5px] border-accent" style={{ width: size, height: size }}>
      <span className="rounded-full bg-accent" style={{ width: inner, height: inner }} />
    </span>
  );
}
