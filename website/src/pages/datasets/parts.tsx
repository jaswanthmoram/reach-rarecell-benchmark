import type { ReactNode } from 'react';
import type { DatasetInfo } from '../../data/benchmarkData';
import { Icon, asset, fmt } from '../../ui';
import { ACCESSION_PENDING, APPROX_CELLS, LOG_TICKS, NOTE, accessionUrl, accessions, logPos, pct, tickLabel } from './model';

/** Inline footnote marker: for the notes list and running text only. */
export function Mark({ n }: { n: string }) {
  return <sup className="ml-0.5 font-mono text-[10px] font-normal text-ink-3">{n}</sup>;
}

/**
 * Footnote marker that hangs past the right edge of its content (absolutely positioned), so a marked value
 * keeps the same text edge as unmarked ones: "47,040" lines up with "55,551" in a right-aligned column.
 */
export function Hang({ n, children, className = 'top-[-0.15em]' }: { n: string; children: ReactNode; className?: string }) {
  return (
    <span className="relative inline-flex">
      {children}
      <sup className={`pointer-events-none absolute left-full ml-0.5 font-mono text-[10px] font-normal leading-none text-ink-3 ${className}`}>
        <span className="sr-only">, note </span>{n}
      </sup>
    </span>
  );
}

/* ---------- Cohort organ glyph ---------- */
export function CohortGlyph({ id, size = 20, framed, className = '' }: { id: string; size?: number; framed?: boolean; className?: string }) {
  const svg = (
    <svg width={size} height={size} aria-hidden="true" className="shrink-0">
      <use href={`${asset('icons-cohorts.svg')}#cohort-${id}`} />
    </svg>
  );
  if (!framed) return <span className={`inline-flex text-ink-3 ${className}`}>{svg}</span>;
  return (
    <span className={`inline-grid shrink-0 place-items-center rounded-full border border-line bg-sunk text-ink-2 ${className}`}
      style={{ width: size + 16, height: size + 16 }}>
      {svg}
    </span>
  );
}

export function AccessionLinks({ d, touch }: { d: DatasetInfo; touch?: boolean }) {
  const list = accessions(d);
  const pending = ACCESSION_PENDING.includes(d.id);
  return (
    <span className="inline-flex flex-wrap items-center gap-x-3">
      {list.map((a, i) => {
        const url = accessionUrl(a);
        const cls = `inline-flex items-center gap-0.5 whitespace-nowrap font-mono text-[13px] ${touch ? 'min-h-11' : 'min-h-6'}`;
        const link = url ? (
          <a href={url} target="_blank" rel="noreferrer"
            className={`${cls} rounded-[2px] text-accent underline decoration-accent/30 underline-offset-2 transition-colors duration-150 hover:decoration-accent`}>
            {a}<Icon name="arrow-up-right" size={12} />
            <span className="sr-only"> (opens {a.startsWith('GSE') ? 'NCBI GEO' : 'NGDC GSA'} in a new tab)</span>
          </a>
        ) : <span className={`${cls} text-ink-2`}>{a}</span>;
        const last = i === list.length - 1;
        return pending && last
          ? <Hang key={a} n={NOTE.accession} className={touch ? 'top-3' : 'top-0.5'}>{link}</Hang>
          : <span key={a} className="inline-flex">{link}</span>;
      })}
    </span>
  );
}

const TRACK_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * All six track slots, A to F, in fixed positions so a column of cohorts reads like a matrix. Used tracks are
 * solid letter chips; unused ones are dashed outlines. Letters and outlines, never colours (DESIGN.md).
 */
export function TrackSlots({ d, size = 'sm' }: { d: DatasetInfo; size?: 'sm' | 'md' }) {
  const used = new Set(d.tracks.map((t) => t.replace('Track ', '')));
  const box = size === 'md' ? 'size-5 sm:size-6' : 'size-5';
  return (
    <span className="inline-flex flex-nowrap gap-1" role="img" aria-label={`Used in ${d.tracks.join(', ')}`}>
      {TRACK_LETTERS.map((l) => used.has(l)
        ? <span key={l} aria-hidden="true" className={`grid ${box} place-items-center rounded-chip border border-line-strong bg-sunk font-mono text-[11px] font-semibold text-ink`}>{l}</span>
        : <span key={l} aria-hidden="true" className={`grid ${box} place-items-center rounded-chip border border-dashed border-line-strong font-mono text-[11px] text-ink-3`}>{l}</span>)}
    </span>
  );
}

/* ---------- Cell counts on a log scale (357 to 123,488 spans three orders of magnitude) ---------- */
/** Thin log-scale bar under a cell count. Ticks at 1k, 10k and 100k; decorative, the number beside it is the value. */
export function LogBar({ value, className = '' }: { value: number; className?: string }) {
  return (
    <span aria-hidden="true" className={`relative block h-1 w-full rounded-full bg-line ${className}`}>
      {LOG_TICKS.map((t) => <span key={t} className="absolute -top-0.5 h-2 w-px bg-line-strong" style={{ left: `${logPos(t) * 100}%` }} />)}
      <span className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-ink-3 transition-transform duration-300 [transition-timing-function:var(--ease-out)]"
        style={{ transform: `scaleX(${logPos(value)})` }} />
    </span>
  );
}

/** Tick labels for a LogBar column header or footer. */
export function LogAxis({ className = '' }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`relative block h-4 font-mono text-[11px] leading-none text-ink-3 tabular ${className}`}>
      {LOG_TICKS.map((t) => <span key={t} className="absolute top-0 -translate-x-1/2" style={{ left: `${logPos(t) * 100}%` }}>{tickLabel(t)}</span>)}
    </span>
  );
}

/** Cell count as displayed: exact value, with a footnote marker where the paper prints an approximation. */
export function Cells({ d }: { d: DatasetInfo }) {
  const v = fmt.int(d.cellsNum);
  return APPROX_CELLS.includes(d.id) ? <Hang n={NOTE.approx}>{v}</Hang> : <>{v}</>;
}

export function CnvShare({ d, inline }: { d: DatasetInfo; inline?: boolean }) {
  if (d.cnvCells === undefined || d.cnvPos === undefined) {
    return <span className="text-xs text-ink-3"><Hang n={NOTE.cnv}>No CNV set</Hang></span>;
  }
  const frac = `${fmt.int(d.cnvPos)} / ${fmt.int(d.cnvCells)}`;
  return inline ? (
    <span className="font-mono text-[13px] text-ink tabular">{pct(d.cnvPos, d.cnvCells)} <span className="text-ink-2">· {frac}</span></span>
  ) : (
    <span className="block font-mono leading-tight tabular">
      <span className="block text-[13px] text-ink">{pct(d.cnvPos, d.cnvCells)}</span>
      <span className="block text-[11px] text-ink-2">{frac}</span>
    </span>
  );
}
