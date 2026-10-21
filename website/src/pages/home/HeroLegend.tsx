import { useId, useState } from 'react';
import { ChevronDown, ICON_STROKE } from '../../ui/icons';
import { HERO_VIOLET } from './heroArt';

const ROWS = [
  { label: 'Tumour cohorts', dot: 'var(--accent)' },
  { label: 'Blood / CTC cohorts', dot: HERO_VIOLET },
  { label: 'Spike-in rare cells (0.01%)', dot: 'var(--signal)' },
] as const;

/** Key for the artwork, top-right of the stage: what the colours stand for. One toggle collapses it to its title. */
export function HeroLegend({ className }: { className?: string }) {
  const [open, setOpen] = useState(true);
  const id = useId();
  return (
    <div className={`hm-card rounded-[14px] border border-line bg-white/90 ${className ?? ''}`}>
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}
        className="flex min-h-9 w-full items-center justify-between gap-6 rounded-[14px] px-3 text-left text-[12.5px] font-semibold text-ink">
        UMAP projection
        <ChevronDown size={15} strokeWidth={ICON_STROKE} aria-hidden="true" className={`text-ink-3 transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
      </button>
      <ul id={id} hidden={!open} className="m-0 list-none space-y-1.5 px-3 pb-3 pt-0.5">
        {ROWS.map((r) => (
          <li key={r.label} className="flex items-center gap-2 text-[12px] leading-tight text-ink-2">
            <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ background: r.dot }} />{r.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
