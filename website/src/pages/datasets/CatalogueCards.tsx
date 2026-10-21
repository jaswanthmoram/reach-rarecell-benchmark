/* Catalogue "Specimens" view (cards) and the 390 px phone list that stands in for the table. */
import { cx } from '../../lib/format';
import { cnvPct, int, logPos, tissueLabel, type Cohort } from './model';
import { StackDetails } from './CohortDetails';
import { Accessions } from './CatalogueTable';
import { CohortGlyph, LogBar, TrackChips, eyebrow } from './parts';
import { hoverProps } from './hover';
import { ChevronDown, ICON_STROKE } from '../../ui/icons';

/** "3.3% positive", or "No CNV set" for the one cohort without a CNV reference. */
const cnvLine = (c: Cohort) => (c.cc ? `${cnvPct(c)} positive` : cnvPct(c));

interface Props {
  rows: Cohort[];
  open: string | null;
  onOpen: (id: string) => void;
  lit: (id: string) => boolean;
  onHot: (id: string | null) => void;
  onCompare: (id: string) => void;
}

function DetailsToggle({ c, isOpen, onOpen, className }: { c: Cohort; isOpen: boolean; onOpen: (id: string) => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(c.id)}
      aria-expanded={isOpen}
      aria-label={`${isOpen ? 'Hide' : 'Show'} details for ${c.id}`}
      className={cx('-mx-2 inline-flex min-h-10 cursor-pointer items-center gap-1 self-start rounded-chip border-0 bg-transparent px-2 text-sm font-medium text-accent-ink transition-colors duration-[var(--dur-1)] hover:bg-accent-tint', className)}
    >
      {isOpen ? 'Hide details' : 'Details'}
      <ChevronDown size={14} strokeWidth={ICON_STROKE} aria-hidden="true" className="ds-chev" />
    </button>
  );
}

export function CatalogueCards({ rows, open, onOpen, onHot, onCompare }: Props) {
  return (
    <ul aria-label="Cohorts" className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(208px,1fr))] items-start gap-3 p-0">
      {rows.map((c) => {
        const isOpen = open === c.id;
        return (
          <li
            key={c.id}
            {...hoverProps(c.id, onHot)}
            className="flex min-w-0 flex-col rounded-card border border-line bg-surface p-4 transition-colors duration-150 hover:border-cell"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-10 place-items-center rounded-full border border-line bg-sunk"><CohortGlyph id={c.id} size={22} /></span>
              <span className={cx(eyebrow, 'pt-1')}>{tissueLabel(c)}</span>
            </div>
            <p className="m-0 mt-4 break-all font-mono text-[13px]">{c.id}</p>
            <p className="m-0 mt-0.5 min-h-10 text-sm leading-snug text-ink-2">{c.ct}</p>
            <p className="m-0 mt-4 text-2xl font-semibold tracking-[-0.02em] tabular-nums">{int(c.n)}{c.approx && <sup className="text-[11px] text-ink-3">a</sup>}</p>
            <p className={cx(eyebrow, 'm-0 mt-0.5')}>cells · {c.platform}</p>
            <LogBar w={logPos(c.n)} className="mt-3" />
            <span className="mt-3"><TrackChips tracks={c.tracks} /></span>
            <dl className="m-0 mt-4 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 border-t border-line pt-3 text-[13px]">
              <dt className={eyebrow}>CNV set</dt><dd className="m-0 font-mono">{cnvLine(c)}</dd>
              <dt className={eyebrow}>Source</dt><dd className="m-0 min-w-0 font-mono text-[12px]"><Accessions c={c} /></dd>
            </dl>
            <DetailsToggle c={c} isOpen={isOpen} onOpen={onOpen} className="mt-2" />
            {isOpen && <StackDetails c={c} onCompare={onCompare} />}
          </li>
        );
      })}
    </ul>
  );
}

/** Phone list (below 640 px), as on the States board's 390 px column. */
export function CataloguePhoneList({ rows, open, onOpen, lit, onCompare }: Props) {
  return (
    <ul aria-label="Cohorts" className="m-0 flex list-none flex-col gap-2.5 p-0">
      {rows.map((c) => {
        const isOpen = open === c.id;
        return (
          <li key={c.id} className={cx('rounded-card border bg-surface px-4 pb-1.5 pt-3.5 transition-colors duration-[var(--dur-1)]', lit(c.id) ? 'border-accent' : 'border-line')}>
            <div className="flex justify-between gap-3">
              <span className="min-w-0">
                <span className="block break-all font-mono text-[13px]">{c.id}</span>
                <span className="text-sm text-ink-2">{c.ct}</span>
              </span>
              <b className="font-mono text-sm tabular-nums">{int(c.n)}{c.approx && <sup className="text-[10px] font-normal text-ink-3">a</sup>}</b>
            </div>
            <dl className="m-0 mt-2.5 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 border-t border-line pt-2.5 font-mono text-[12px]">
              <dt className={eyebrow}>CNV set</dt><dd className="m-0 text-ink-2">{cnvLine(c)}</dd>
              <dt className={eyebrow}>Tracks</dt><dd className="m-0"><TrackChips tracks={c.tracks} /></dd>
              <dt className={eyebrow}>Source</dt><dd className="m-0 min-w-0"><Accessions c={c} /></dd>
            </dl>
            <DetailsToggle c={c} isOpen={isOpen} onOpen={onOpen} className="mt-1" />
            {isOpen && <StackDetails c={c} onCompare={onCompare} />}
          </li>
        );
      })}
    </ul>
  );
}
