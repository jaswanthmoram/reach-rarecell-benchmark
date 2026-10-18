import { Fragment, useState, type ReactNode } from 'react';
import { Badge, CIBar, Icon, MethodDot, fmt, methodColor } from '../../ui';
import { href } from '../../app/router';
import type { MethodResult } from '../../data/benchmarkData';
import { RefMarkKey } from './RefMarkKey';
import {
  AP_DOMAIN, AP_TICKS, REFERENCE_MARKS, VIEWS, apPos, bandsOf, defaultSort, isReference, nextSort, offScale, roleLabel, signed, bootCI,
  type Band, type SortKey, type SortState, type Tier, type ViewId,
} from './model';

interface TableProps {
  rows: MethodResult[];
  view: ViewId;
  tier: Tier;
  sort: SortState | null;
  onSort: (s: SortState | null) => void;
}

const BAND_BORDER: Record<Band, string> = {
  ceiling: 'border-b border-dashed border-line-strong',
  ranked: 'border-b border-line',
  reference: 'border-b border-line',
};

/** Gridlines on the shared AP axis plus one thin dashed mark per reference row at its bootstrap mean AP (DESIGN v2.2). */
function AxisMarks() {
  return (
    <span className="pointer-events-none absolute inset-0" aria-hidden="true">
      {AP_TICKS.map((t) => <span key={t} className="absolute inset-y-0 w-px bg-line" style={{ left: `${apPos(t) * 100}%` }} />)}
      {REFERENCE_MARKS.map((r) => (
        <span key={r.id} className="absolute inset-y-0 border-l border-dashed opacity-70" style={{ left: `${apPos(r.bootstrapMeanAP) * 100}%`, borderColor: methodColor(r.id) }} />
      ))}
    </span>
  );
}

const AP_MARKS = REFERENCE_MARKS.map((r) => ({ id: r.id, label: `${r.method} ${fmt.ap(r.bootstrapMeanAP)}`, x: apPos(r.bootstrapMeanAP) * 100 }));

function BandHeader({ label, note, cols }: { label: string; note: string; cols: number }) {
  return (
    <tr className="border-b border-line">
      <th scope="rowgroup" colSpan={cols} className="h-8 px-3 pt-3 text-left font-normal">
        <span className="label text-ink-2">{label}</span>
        <span className="ml-3 font-mono text-[11px] text-ink-3">{note}</span>
      </th>
    </tr>
  );
}

function SortHeader({ k, label, sort, onSort, view, align = 'right', title }: { k: SortKey; label: ReactNode; sort: SortState | null; onSort: TableProps['onSort']; view: ViewId; align?: 'left' | 'right'; title?: string }) {
  const active = sort?.key === k || (sort === null && k === 'view');
  const dir = sort?.dir ?? (VIEWS[view].better === 'higher' ? 'desc' : 'asc');
  const ariaSort = active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none';
  return (
    <th scope="col" aria-sort={ariaSort} className={`h-10 px-3 font-normal ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <button
        type="button"
        onClick={() => onSort(nextSort(sort ?? defaultSort(view), k, view))}
        title={title}
        className={`group inline-flex h-8 items-center gap-1 rounded-chip label transition-colors duration-150 hover:text-ink ${align === 'right' ? 'flex-row-reverse' : ''} ${active ? 'text-ink' : ''}`}
      >
        <span className="whitespace-nowrap">{label}</span>
        <Icon
          name={active ? 'caret-down' : 'caret-up-down'}
          size={12}
          className={`transition-transform duration-150 ${active && dir === 'asc' ? 'rotate-180' : ''} ${active ? 'text-accent' : 'opacity-50 group-hover:opacity-100'}`}
        />
      </button>
    </th>
  );
}

function MethodLabel({ m }: { m: MethodResult }) {
  const ref = isReference(m);
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <MethodDot id={m.id} dashed={isReference(m)} />
      <span className={`truncate font-mono text-[13px] ${ref ? 'text-ink-2' : 'font-semibold text-ink'}`}>{m.method}</span>
      {ref && <span className="hidden whitespace-nowrap font-mono text-[11px] text-ink-3 sm:inline">{roleLabel(m)}</span>}
      {m.paperRole === 'Published/proxy' && <Badge>proxy</Badge>}
    </span>
  );
}

function RankCell({ m }: { m: MethodResult }) {
  if (m.publishedRankNum === null) {
    return <span className="font-mono text-sm text-ink-3" title="Reference row: not assigned a leaderboard rank">–<span className="sr-only">not ranked (reference)</span></span>;
  }
  return <span className="font-mono text-sm font-semibold text-ink tabular">{m.publishedRankNum}</span>;
}

/** Bootstrap mean AP dot with its 95% bootstrap interval (Figure 4a), on a 0 to 1 axis. */
function BootInterval({ m, marks = true }: { m: MethodResult; marks?: boolean }) {
  const [lo, hi] = bootCI(m);
  return (
    <div className="relative w-full">
      {marks && <AxisMarks />}
      <CIBar value={m.bootstrapMeanAP} low={lo} high={hi} domain={AP_DOMAIN} color={methodColor(m.id)} dashed={isReference(m)}
        className={offScale(m.bootstrapMeanAP) ? 'opacity-0' : undefined}
        label={`${m.method}: bootstrap mean Track A AP ${fmt.ap(m.bootstrapMeanAP)}, 95% bootstrap interval ${fmt.ap(lo)} to ${fmt.ap(hi)}`} />
      {offScale(m.bootstrapMeanAP) && (
        <span className="absolute inset-y-0 right-0 flex items-center gap-1.5 font-mono text-[11px] text-ink-2 tabular" aria-hidden="true">
          <span className="w-16 border-t border-dashed" style={{ borderColor: methodColor(m.id) }} />{fmt.ap(m.bootstrapMeanAP)} →
        </span>
      )}
    </div>
  );
}

function Detail({ m }: { m: MethodResult }) {
  const facts: [string, string][] = [
    ['Paradigm', `${m.paradigm} · ${m.language}`],
    ['Degenerate units', `Track A ${m.trackADegenerate} · all tracks ${m.degenerateUnits} (${m.degeneratePct}%)`],
    ['Fallback units', `Track A ${m.trackAFallback} · all tracks ${m.fallbackUnits} (${m.fallbackPct}%)`],
    ['Track F Δ', `${signed(m.trackF01AP - m.medianAP)} (Track F 0.1% median ${fmt.ap(m.trackF01AP)} − Track A median ${fmt.ap(m.medianAP)})`],
    ['Excl. degenerate', `median AP ${fmt.ap(m.exclDegenerateMedianAP)} · mean ${fmt.ap(m.exclDegenerateMeanAP)}`],
    ['Within-unit rank', `${m.rankMean.toFixed(2)} [${m.rankCILow}–${m.rankCIHigh}] of 10 (Figure 4b, not the leaderboard rank)`],
    ['Track B vs A', `within-unit rank ${m.trackBRank} synthetic vs ${m.trackARank} real, of 10`],
  ];
  return (
    <div className="grid gap-6 py-5 md:grid-cols-[1.2fr_1fr]">
      <div className="space-y-4">
        <p className="label">{m.roleRankLabel}</p>
        <div>
          <p className="label mb-1.5">Mechanism</p>
          <p className="max-w-[68ch] text-sm leading-relaxed text-ink-2">{m.mechanism}</p>
        </div>
        <div>
          <p className="label mb-1.5">Failure mode</p>
          <p className="max-w-[68ch] text-sm leading-relaxed text-ink-2">{m.failureMode}</p>
        </div>
        <p className="text-xs leading-relaxed text-ink-2"><span className="label mr-2">Citation</span>{m.citation}</p>
      </div>
      <dl className="grid content-start gap-x-4 gap-y-2.5 text-sm sm:grid-cols-[auto_1fr]">
        {facts.map(([k, v]) => (
          <Fragment key={k}>
            <dt className="label pt-0.5">{k}</dt>
            <dd className="font-mono text-xs leading-relaxed text-ink tabular">{v}</dd>
          </Fragment>
        ))}
        <dt className="sr-only">More</dt>
        <dd className="sm:col-start-2">
          <a href={href('/methods')} className="inline-flex h-10 items-center gap-1 text-xs font-medium text-accent hover:underline">
            Method audit <Icon name="arrow-right" size={14} />
          </a>
        </dd>
      </dl>
    </div>
  );
}

function ExpandButton({ m, open, onToggle, controls }: { m: MethodResult; open: boolean; onToggle: () => void; controls: string }) {
  return (
    <button type="button" aria-expanded={open} aria-controls={controls} onClick={onToggle}
      className="flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-chip text-left">
      <Icon name="caret-down" size={14} className={`shrink-0 text-ink-3 transition-transform duration-300 ${open ? 'rotate-180 text-ink' : '-rotate-90'}`} />
      <MethodLabel m={m} />
      <span className="sr-only">{open ? 'Hide' : 'Show'} details</span>
    </button>
  );
}

function useOpenSet() {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setOpen((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  return [open, toggle] as const;
}

export function RankTable(props: TableProps) {
  const [open, toggle] = useOpenSet();
  return (
    <>
      <DesktopTable {...props} open={open} toggle={toggle} />
      <MobileCards {...props} open={open} toggle={toggle} />
    </>
  );
}

type Inner = TableProps & { open: Set<string>; toggle: (id: string) => void };

function DesktopTable({ rows, view, tier, sort, onSort, open, toggle }: Inner) {
  const def = VIEWS[view];
  const showView = view !== 'overall';
  const cols = showView ? 9 : 8;
  const h = { sort, onSort, view };

  const row = (m: MethodResult, band: Band) => {
    const ref = isReference(m);
    const isOpen = open.has(m.id);
    const detailId = `lb-detail-${m.id}`;
    const num = `font-mono tabular ${ref ? 'text-ink-2' : 'text-ink'}`;
    return (
      <Fragment key={m.id}>
        <tr id={`lb-row-${m.id}`} className={`group/row scroll-mt-24 transition-colors duration-150 hover:bg-sunk/60 focus-within:bg-sunk/60 ${BAND_BORDER[band]}`}>
          <td className="h-10 w-14 px-3"><RankCell m={m} /></td>
          <td className="h-10 max-w-[320px] px-3"><ExpandButton m={m} open={isOpen} onToggle={() => toggle(m.id)} controls={detailId} /></td>
          {showView && <td className={`h-10 px-3 text-right font-semibold ${num}`}>{def.format(def.get(m, tier))}</td>}
          <td className={`h-10 px-3 text-right ${num} ${showView ? '' : ref ? '' : 'font-semibold'}`}>{fmt.ap(m.medianAP)}</td>
          <td className={`h-10 whitespace-nowrap px-3 text-right ${num}`}>{fmt.ap(m.meanAP)}<span className="text-ink-3"> ± {fmt.ap(m.stdAP)}</span></td>
          <td className="h-10 w-[380px] p-0"><div className="relative mx-4 flex h-10 items-center"><AxisMarks /><BootInterval m={m} marks={false} /></div></td>
          <td className={`h-10 px-3 text-right ${num}`}>{fmt.ap(m.auroc)}</td>
          <td className={`h-10 px-3 text-right ${num}`}>{fmt.ap(m.topKF1)}</td>
          <td className={`h-10 whitespace-nowrap px-3 text-right ${num}`}>{fmt.secs(m.runtimeS)}</td>
        </tr>
        {isOpen && (
          <tr id={detailId} className="border-b border-line bg-surface">
            <td />
            <td colSpan={cols - 1} className="px-3"><Detail m={m} /></td>
          </tr>
        )}
      </Fragment>
    );
  };

  return (
    <div className="hidden overflow-x-auto md:block" role="region" aria-label="Leaderboard table, scrollable" tabIndex={0}>
      <table className="w-full min-w-[1080px] border-collapse text-sm">
        <caption className="sr-only">Track A leaderboard. {def.order(tier)} within each group. The supervised ceiling is listed first, then ranks 1 to 6 for the six published detectors, then the unranked reference rows. Dashed vertical marks in the interval column show each reference row&apos;s bootstrap mean AP.</caption>
        <thead>
          <tr className="border-b border-line-strong">
            <SortHeader k="rank" label="Rank" align="left" {...h} title="Leaderboard rank, 1 to 6, published detectors only (Track A median AP)" />
            <th scope="col" className="h-10 px-3 text-left font-normal"><span className="label">Method</span></th>
            {showView && <SortHeader k="view" label={def.column(tier)} {...h} />}
            <SortHeader k={showView ? 'medianAP' : 'view'} label="Median AP" {...h} />
            <SortHeader k="meanAP" label="Mean ± SD" {...h} />
            <th scope="col" className="h-10 px-4 text-left font-normal">
              <span className="label block leading-tight" title="95% bootstrap interval of Track A AP (Figure 4a)">95% bootstrap interval</span>
              <span className="label block leading-tight">Track A AP (Figure 4a)</span>
            </th>
            <SortHeader k="auroc" label="AUROC" {...h} />
            <SortHeader k="topKF1" label="Top-k F1" {...h} />
            <SortHeader k="runtimeS" label="Runtime" {...h} />
          </tr>
        </thead>
        {bandsOf(rows).map((b) => (
          <tbody key={b.value}>
            <BandHeader label={b.label} note={b.note} cols={cols} />
            {b.rows.map((m) => row(m, b.value))}
          </tbody>
        ))}
        <tfoot>
          <tr>
            <td colSpan={showView ? 5 : 4} />
            <td className="px-4 pt-2">
              <div className="relative h-4 font-mono text-[11px] text-ink-3" aria-hidden="true">
                {AP_TICKS.map((t, k) => (
                  <span key={t} className={`absolute ${k === 0 ? '' : k === AP_TICKS.length - 1 ? '-translate-x-full' : '-translate-x-1/2'}`} style={{ left: `${apPos(t) * 100}%` }}>{t.toFixed(1)}</span>
                ))}
              </div>
              <p className="label mt-1 whitespace-nowrap text-center">Track A AP · same axis as above</p>
              <p className="mt-3 font-mono text-[11px] text-ink-3">Dashed marks, bootstrap mean AP:</p>
              {/* The three empty metric columns to the right give right-running labels room, so none needs to flip. */}
              <RefMarkKey marks={AP_MARKS} flipAt={101} />
            </td>
            <td colSpan={3} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function MobileCards({ rows, view, tier, open, toggle }: Inner) {
  const def = VIEWS[view];
  const showView = view !== 'overall';
  return (
    <div className="md:hidden">
      {bandsOf(rows).map((b) => (
        <section key={b.value} aria-label={b.label} className="mt-4 first:mt-0">
          <p className="flex items-baseline justify-between gap-3 border-b border-line-strong pb-2 pt-2">
            <span className="label text-ink-2">{b.label}</span>
            <span className="font-mono text-[11px] text-ink-3">{b.note}</span>
          </p>
          <ol>
            {b.rows.map((m) => {
              const ref = isReference(m);
              const isOpen = open.has(m.id);
              const detailId = `lb-card-${m.id}`;
              const [lo, hi] = bootCI(m);
              const cells: [string, string][] = [
                ...(showView ? [['Median AP', fmt.ap(m.medianAP)] as [string, string]] : []),
                ['AUROC', fmt.ap(m.auroc)],
                ['Top-k F1', fmt.ap(m.topKF1)],
                ['Runtime', fmt.secs(m.runtimeS)],
              ];
              return (
                <li key={m.id} id={`lb-mrow-${m.id}`} className={`scroll-mt-24 py-4 ${BAND_BORDER[b.value]}`}>
                  <div className="flex items-center gap-3">
                    <span className="w-5 shrink-0"><RankCell m={m} /></span>
                    <ExpandButton m={m} open={isOpen} onToggle={() => toggle(m.id)} controls={detailId} />
                    <span className="flex shrink-0 flex-col items-end">
                      <span className={`font-mono text-lg font-semibold leading-tight tabular ${ref ? 'text-ink-2' : 'text-ink'}`}>{def.format(def.get(m, tier))}</span>
                      <span className="label">{def.column(tier)}</span>
                    </span>
                  </div>
                  {ref && <p className="ml-8 mt-1 font-mono text-[11px] text-ink-3">{roleLabel(m)} · not ranked</p>}
                  <div className="ml-8 mt-3">
                    <p className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 font-mono text-[11px] text-ink-2 tabular">
                      <span className="label">Bootstrap AP</span>
                      <span>mean <span className="text-ink">{fmt.ap(m.bootstrapMeanAP)}</span> · 95% CI <span className="text-ink">{fmt.ap(lo)}–{fmt.ap(hi)}</span></span>
                    </p>
                    <BootInterval m={m} />
                  </div>
                  <dl className="ml-8 mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5">
                    {cells.map(([k, v]) => (
                      <div key={k} className="flex items-baseline justify-between gap-2">
                        <dt className="label">{k}</dt>
                        <dd className="whitespace-nowrap font-mono text-xs text-ink tabular">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  {isOpen && <div id={detailId} className="ml-8 mt-3 border-t border-line"><Detail m={m} /></div>}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] leading-relaxed text-ink-3">
        <span>Dashed marks, bootstrap mean AP:</span>
        {REFERENCE_MARKS.map((r) => (
          <span key={r.id} className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <span aria-hidden="true" className="h-3 border-l border-dashed" style={{ borderColor: methodColor(r.id) }} />{r.method} {fmt.ap(r.bootstrapMeanAP)}
          </span>
        ))}
      </p>
    </div>
  );
}
