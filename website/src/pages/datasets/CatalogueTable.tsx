/* Catalogue table view (tablet and desktop). Sortable headers, expandable rows, totals footer. */
import { Fragment } from 'react';
import { cx } from '../../lib/format';
import { accLinks, cnvFrac, cnvPct, int, logPos, tissueLabel, type Cohort } from './model';
import { RowDetails } from './CohortDetails';
import { ChevronDown, ICON_STROKE } from '../../ui/icons';
import { CohortGlyph, LogBar, TrackChips, srOnly } from './parts';
import { hoverProps } from './hover';

export type SortKey = 'cohort' | 'cells' | 'cnv';
export type SortDir = 'asc' | 'desc';

export interface Totals { title: string; sub: string; cells: string; cnvPct: string; cnvFrac: string; units: string }


/**
 * GEO or GSA accession links. `stacked` puts one per line (table); otherwise they wrap inline with a comma
 * between them, so two accessions never run together ("GSE117156, GSE161801").
 */
export function Accessions({ c, stacked = false, className }: { c: Cohort; stacked?: boolean; className?: string }) {
  const links = accLinks(c);
  return (
    <span className={cx(stacked ? 'flex flex-col' : 'inline-flex flex-wrap gap-x-1.5', className)}>
      {links.map((x, i) => (
        <span key={x.acc} className="whitespace-nowrap">
          <a href={x.url} target="_blank" rel="noopener noreferrer" aria-label={`${x.acc} (opens the repository in a new tab)`}>{x.acc}</a>
          {!stacked && i < links.length - 1 && <span aria-hidden="true" className="text-ink-3">,</span>}
        </span>
      ))}
    </span>
  );
}

/** Sort direction mark: one chevron, flipped for ascending; faint when the column is not the sort key. */
function SortMark({ on, dir }: { on: boolean; dir: SortDir }) {
  return (
    <ChevronDown
      size={13}
      strokeWidth={ICON_STROKE}
      aria-hidden="true"
      className={cx('ds-chev', on ? 'text-accent' : 'text-cell opacity-60', on && dir === 'asc' && 'rotate-180')}
    />
  );
}

interface HeadProps { k: SortKey; label: string; suffix?: string; sortKey: SortKey; sortDir: SortDir; onSort: (k: SortKey) => void; right?: boolean }

function SortHead({ k, label, suffix, sortKey, sortDir, onSort, right }: HeadProps) {
  const on = sortKey === k;
  return (
    <th scope="col" aria-sort={on ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'} className={cx('px-1 font-normal', right && 'text-right')}>
      <button
        type="button"
        onClick={() => onSort(k)}
        aria-label={`Sort by ${label.toLowerCase()}`}
        className={cx('inline-flex min-h-9 cursor-pointer items-center gap-1 border-0 bg-transparent px-2 font-[inherit] uppercase tracking-[inherit] transition-colors hover:text-ink', on ? 'text-ink' : 'text-ink-3')}
      >
        {label}{suffix} <SortMark on={on} dir={sortDir} />
      </button>
    </th>
  );
}

interface Props {
  rows: Cohort[];
  caption: string;
  totals: Totals;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
  open: string | null;
  onOpen: (id: string) => void;
  lit: (id: string) => boolean;
  onHot: (id: string | null) => void;
  onCompare: (id: string) => void;
}

export function CatalogueTable({ rows, caption, totals, sortKey, sortDir, onSort, open, onOpen, lit, onHot, onCompare }: Props) {
  const head = { sortKey, sortDir, onSort };
  return (
    <div className="relative overflow-x-auto rounded-card border border-line bg-surface">
      <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
        <caption className={srOnly}>{caption}</caption>
        <thead className="bg-sunk font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3">
          <tr className="h-10">
            <SortHead k="cohort" label="Cohort" {...head} />
            <th scope="col" className="px-3 font-normal">Tissue · platform</th>
            <SortHead k="cells" label="Cells" suffix=" · log" right {...head} />
            <SortHead k="cnv" label="CNV set +" {...head} />
            <th scope="col" className="px-3 font-normal">Source</th>
            <th scope="col" className="px-3 font-normal">Tracks A to F</th>
            <th scope="col" className="w-14 px-2"><span className={srOnly}>Details</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => {
            const isOpen = open === c.id;
            return (
              <Fragment key={c.id}>
                <tr
                  {...hoverProps(c.id, onHot)}
                  className={cx('h-14 border-t border-line transition-colors duration-150', isOpen ? 'bg-(--row-hover)' : lit(c.id) ? 'bg-accent-tint' : 'hover:bg-(--row-hover)')}
                >
                  <th scope="row" className="px-3 font-normal">
                    <span className="flex items-center gap-3">
                      <span className="grid size-[34px] flex-none place-items-center rounded-full border border-line bg-sunk"><CohortGlyph id={c.id} size={18} /></span>
                      <span className="min-w-0"><span className="block font-mono text-[13px]">{c.id}</span><span className="block text-[12px] text-ink-2">{c.ct}</span></span>
                    </span>
                  </th>
                  <td className="px-3"><span className="block text-ink-2">{tissueLabel(c)}</span><span className="block text-[12px] text-ink-3">{c.platform}</span></td>
                  <td className="px-3 text-right font-mono tabular-nums">
                    {int(c.n)}{c.approx && <sup className="text-[10px] text-ink-3">a</sup>}
                    <LogBar w={logPos(c.n)} className="mt-1.5" />
                  </td>
                  <td className="px-3 font-mono tabular-nums"><span className="block text-[13px]">{cnvPct(c)}</span><span className="block text-[11px] text-ink-2">{cnvFrac(c)}</span></td>
                  <td className="px-3 font-mono text-[13px] leading-5"><Accessions c={c} stacked /></td>
                  <td className="px-3"><TrackChips tracks={c.tracks} /></td>
                  <td className="px-1.5">
                    <button
                      type="button"
                      onClick={() => onOpen(c.id)}
                      aria-expanded={isOpen}
                      aria-label={`${isOpen ? 'Hide' : 'Show'} details for ${c.id}`}
                      className="grid size-11 cursor-pointer place-items-center rounded-chip border-0 bg-transparent text-sm text-ink-2 transition-colors hover:bg-(--chip-active) hover:text-ink"
                    >
                      <ChevronDown size={16} strokeWidth={ICON_STROKE} aria-hidden="true" className="ds-chev" />
                    </button>
                  </td>
                </tr>
                {isOpen && (
                  <tr className="border-t border-line bg-(--row-hover)">
                    <td colSpan={7} className="pb-6 pl-[60px] pr-4 pt-2"><RowDetails c={c} onCompare={onCompare} /></td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
        <tfoot className="bg-sunk">
          <tr className="h-14 border-t border-line">
            <th scope="row" className="px-3 font-normal"><span className="block font-mono text-[13px] font-semibold">{totals.title}</span><span className="block text-[12px] text-ink-2">{totals.sub}</span></th>
            <td />
            <td className="px-3 text-right font-mono font-semibold tabular-nums">{totals.cells}</td>
            <td className="px-3 font-mono tabular-nums"><span className="block text-[13px] font-semibold">{totals.cnvPct}</span><span className="block text-[11px] text-ink-2">{totals.cnvFrac}</span></td>
            <td colSpan={3} className="px-3 text-[12px] text-ink-2">{totals.units}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
