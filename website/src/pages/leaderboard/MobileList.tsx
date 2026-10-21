import { cx } from '../../lib/format';
import { ChevronDown, ICON_STROKE } from '../../ui/icons';
import { useGlide } from '../../ui/motion/useGlide';
import { BANDS, VIEWS, type Row, type TierId, type ViewId } from './model';
import { Details } from './Details';
import { Dot } from './parts';

/** Phone layout (390 px board): one line per method with the active metric; tap for details. */
export function MobileList({ rows, view, tier, open, onToggle, label }: {
  rows: Row[]; view: ViewId; tier: TierId; open: Record<string, boolean>; onToggle: (id: string) => void; label: string;
}) {
  const V = VIEWS[view];
  const ref = useGlide<HTMLDivElement>(`${view}|${rows.map((r) => r.id + (open[r.id] ? '+' : '')).join(',')}`);
  const bands = BANDS.map((b) => ({ ...b, rows: rows.filter((r) => r.band === b.id) })).filter((b) => b.rows.length > 0);
  return (
    <div ref={ref} className="relative mt-4" aria-label={label} role="group">
      <p aria-hidden="true" className="m-0 flex justify-between border-b border-line-strong pb-2 font-mono text-[11px] uppercase tracking-[0.04em] text-ink-3">
        <span>Rank · method</span><span>{V.col(tier)}</span>
      </p>
      {bands.map((b) => (
        <div key={b.id}>
          <p data-glide={`band-${b.id}`} className="relative m-0 flex flex-wrap items-baseline gap-x-3 border-b border-line bg-canvas pb-1.5 pt-3.5">
            <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-2">{b.label} · {b.rows.length}</span>
            <span className="font-mono text-[11px] text-ink-3">{b.note}</span>
          </p>
          <ul className="m-0 list-none p-0">
            {b.rows.map((r) => {
              const isOpen = !!open[r.id];
              const ink = r.isRef ? 'text-ink-2' : 'text-ink';
              return (
                <li key={r.id} data-glide={r.id} className="relative bg-canvas">
                  <button type="button" aria-expanded={isOpen} aria-controls={`lb-mdetail-${r.id}`} onClick={() => onToggle(r.id)}
                    className={cx('lb-row lb-press relative flex min-h-12 w-full cursor-pointer items-center gap-2.5 border-0 border-b bg-canvas px-0 py-2.5 text-left font-mono text-[13px]',
                      r.band === 'ceiling' ? 'border-dashed border-line-strong' : 'border-solid border-line')}>
                    <span className={cx('w-4 flex-none tabular-nums', r.rank == null ? 'text-ink-3' : 'font-semibold text-ink')}>
                      {r.rank ?? '–'}{r.rank == null && <span className="sr-only">, not ranked</span>}
                    </span>
                    <Dot row={r} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className={cx('truncate', ink, !r.isRef && 'font-semibold')}>{r.name}</span>
                      {(r.isRef || r.role !== 'Published') && <span className="truncate text-[11px] text-ink-3">{r.role}</span>}
                    </span>
                    <span className={cx('tabular-nums', ink)}>{V.fmt(V.get(r.m, tier))}</span>
                    <ChevronDown size={14} strokeWidth={ICON_STROKE} aria-hidden="true" className={cx('lb-caret flex-none', isOpen ? 'rotate-180 text-ink' : 'text-cell')} />
                    <span className="sr-only">{isOpen ? 'Hide' : 'Show'} details</span>
                  </button>
                  {isOpen && (
                    <div id={`lb-mdetail-${r.id}`} className="border-b border-line bg-surface px-3 pb-5 pt-4">
                      <Details row={r} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
