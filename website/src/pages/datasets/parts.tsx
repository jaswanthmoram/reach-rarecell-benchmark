/* Small shared pieces for the Datasets page. */
import { asset, cx, methodColor } from '../../lib/format';

/** Cohort organ glyph from the cohort sprite (public/icons-cohorts.svg). */
export function CohortGlyph({ id, size, className }: { id: string; size: number; className?: string }) {
  return (
    <svg width={size} height={size} aria-hidden="true" className={cx('flex-none text-ink-2', className)}>
      <use href={`${asset('icons-cohorts.svg')}#cohort-${id}`} />
    </svg>
  );
}

/** Method swatch: solid for ranked detectors, dashed hollow for references. */
export function Swatch({ method, ranked }: { method: string; ranked: boolean }) {
  const c = methodColor(method);
  return (
    <span
      aria-hidden="true"
      className="box-border size-[9px] flex-none rounded-full"
      style={{ background: ranked ? c : 'var(--surface)', border: `1.5px ${ranked ? 'solid' : 'dashed'} ${c}` }}
    />
  );
}

/** Track letters A to F; used tracks solid, unused dashed and faint. */
export function TrackChips({ tracks }: { tracks: string }) {
  return (
    <span role="img" className="inline-flex gap-1" aria-label={`Tracks ${tracks.split('').join(', ')}`}>
      {['A', 'B', 'C', 'D', 'E', 'F'].map((l) => {
        const used = tracks.includes(l);
        return (
          <span
            key={l}
            aria-hidden="true"
            className={cx(
              'grid size-5 place-items-center rounded-chip border border-line-strong font-mono text-[11px]',
              used ? 'border-solid bg-surface text-ink' : 'border-dashed bg-transparent text-[#c4c8d0]',
            )}
          >
            {l}
          </span>
        );
      })}
    </span>
  );
}

/** Thin log-scale bar under a cell count. */
export function LogBar({ w, className }: { w: number; className?: string }) {
  return (
    <span aria-hidden="true" className={cx('relative block h-[3px] rounded-[2px] bg-(--chip-active)', className)}>
      <span className="absolute inset-y-0 left-0 rounded-[2px] bg-cell" style={{ width: `${(w * 100).toFixed(1)}%` }} />
    </span>
  );
}

/** Cohort A is a filled dot, cohort B an outlined one (the same marks as the compare panels). */
export function SlotMark({ slot }: { slot: number }) {
  return <span aria-hidden="true" className={cx('box-border inline-block size-[7px] flex-none rounded-full', slot === 0 ? 'bg-ink' : 'border-[1.5px] border-ink')} />;
}

export const srOnly = 'absolute h-px w-px overflow-hidden [clip:rect(0_0_0_0)]';
export const btn = 'inline-flex min-h-8 cursor-pointer items-center rounded-chip border border-line-strong bg-surface px-3 text-[12px] font-medium text-ink no-underline transition-colors duration-150 hover:border-cell';
export const eyebrow = 'font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3';
