/* Cohort catalogue: tissue filter, view toggle, search, sortable table or specimen cards, row details, empty state. */
import { useState } from 'react';
import { GLOBAL_STATS } from '../../data/benchmarkData';
import { cx, fmt } from '../../lib/format';
import { COHORTS, CNV_POOLED, SOLID_N, TOTAL_CELLS, cnvShare, int, type Cohort } from './model';
import { CatalogueTable, type SortDir, type SortKey, type Totals } from './CatalogueTable';
import { CatalogueCards, CataloguePhoneList } from './CatalogueCards';
import { srOnly, btn } from './parts';
import { SectionHeader } from '../../ui/SectionHeader';
import { Icon3D } from '../../ui/Icon3D';
import { Search, ICON_STROKE } from '../../ui/icons';
import { CountUp } from '../../ui/motion';
import { useNarrow } from './useNarrow';

type Filter = 'all' | 'solid' | 'heme';
type View = 'table' | 'grid';
const MAX_QUERY = 80;
const SORT_LABEL: Record<SortKey, string> = { cohort: 'cohort name', cells: 'cell count', cnv: 'CNV-set positive share' };

function matches(c: Cohort, filter: Filter, q: string) {
  if (filter === 'solid' && !c.solid) return false;
  if (filter === 'heme' && c.solid) return false;
  if (!q) return true;
  return [c.id, c.ct, c.acc, c.platform, c.solid ? 'solid tumour tumor' : 'hematologic haematological blood ctc'].join(' ').toLowerCase().includes(q);
}

function sortRows(list: Cohort[], key: SortKey, dir: SortDir) {
  const val = (c: Cohort) => (key === 'cells' ? c.n : cnvShare(c));
  return [...list].sort((a, b) => {
    const d = key === 'cohort' ? a.id.localeCompare(b.id) : val(a) - val(b);
    return dir === 'asc' ? d : -d;
  });
}

function totalsFor(list: Cohort[]): Totals {
  const all = list.length === COHORTS.length;
  const cnv = list.filter((c) => c.cc && c.pos != null);
  const cPos = cnv.reduce((a, c) => a + (c.pos ?? 0), 0), cCells = cnv.reduce((a, c) => a + (c.cc ?? 0), 0);
  const units = list.reduce((a, c) => a + c.units, 0);
  return {
    title: all ? `All ${list.length} cohorts` : `${list.length} of ${COHORTS.length} shown`,
    sub: all ? `Matches the paper total, ${GLOBAL_STATS.totalCells} cells` : `of ${int(TOTAL_CELLS)} cells in all cohorts`,
    cells: int(list.reduce((a, c) => a + c.n, 0)),
    cnvPct: cCells ? fmt.pct(cPos / cCells) : 'n/a',
    cnvFrac: cCells ? `${int(cPos)} / ${int(cCells)}` : '',
    units: all ? `${units} Track A units (8 cohorts × 20)` : `${units} Track A units in view`,
  };
}

function Seg<T extends string>({ label, items, value, onPick }: { label: string; items: [T, string][]; value: T; onPick: (v: T) => void }) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-[6px] border border-line bg-surface p-[3px]">
      {items.map(([v, text]) => {
        const on = v === value;
        return (
          <button
            key={v}
            type="button"
            aria-pressed={on}
            onClick={() => onPick(v)}
            className={cx('min-h-8 cursor-pointer rounded-chip border px-3 font-mono text-[12px] transition-colors duration-150', on ? 'border-ink bg-ink text-canvas' : 'border-line-strong bg-surface text-ink hover:border-cell')}
          >
            {text}
          </button>
        );
      })}
    </div>
  );
}

interface Props { pair: string[]; hot: string | null; onHot: (id: string | null) => void; onCompare: (id: string) => void }

export function Catalogue({ pair, hot, onHot, onCompare }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [view, setView] = useState<View>('table');
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('cells');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [open, setOpen] = useState<string | null>(null);
  const narrow = useNarrow();

  const q = query.trim().toLowerCase();
  const rows = sortRows(COHORTS.filter((c) => matches(c, filter, q)), sortKey, sortDir);
  const totals = totalsFor(rows);
  const dirWord = sortDir === 'asc' ? 'ascending' : 'descending';
  const lit = (id: string) => hot === id || pair.includes(id);
  const onOpen = (id: string) => setOpen((o) => (o === id ? null : id));
  const onSort = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(k); setSortDir(k === 'cohort' ? 'asc' : 'desc'); }
  };
  const clear = () => { setQuery(''); setFilter('all'); };
  const shared = { rows, open, onOpen, lit, onHot, onCompare };
  const cnvCohorts = COHORTS.filter((c) => c.cc).length;

  return (
    <section id="catalogue" aria-labelledby="cat-h" className="pb-14 pt-14 sm:pb-20 sm:pt-16">
      <SectionHeader
        id="cat-h"
        title="Cohort catalogue"
        className="mb-6 border-b border-line pb-6"
        lede="Every cohort with its size, CNV validation subset, source accession and the tracks that use it. Open a row for per-cohort results."
        actions={(
          <dl className="m-0 flex flex-wrap gap-x-8 gap-y-3 font-mono">
            <div><dt className="eyebrow">Cells</dt><dd className="m-0 mt-1"><b className="text-lg font-semibold"><CountUp value={TOTAL_CELLS} /></b> <span className="text-[11px] text-ink-3">{COHORTS.length} cohorts</span></dd></div>
            <div><dt className="eyebrow">CNV set</dt><dd className="m-0 mt-1"><b className="text-lg font-semibold"><CountUp value={CNV_POOLED.cells} /></b> <span className="text-[11px] text-ink-3">{cnvCohorts} cohorts</span></dd></div>
            <div><dt className="eyebrow">Track A units</dt><dd className="m-0 mt-1"><b className="text-lg font-semibold"><CountUp value={GLOBAL_STATS.trackAUnits} /></b> <span className="text-[11px] text-ink-3">8 × 20</span></dd></div>
          </dl>
        )}
      />

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Seg label="Filter cohorts by tissue" value={filter} onPick={setFilter} items={[['all', `All · ${COHORTS.length}`], ['solid', `Solid · ${SOLID_N}`], ['heme', `Blood / CTC · ${COHORTS.length - SOLID_N}`]]} />
          {!narrow && <Seg label="Catalogue view" value={view} onPick={setView} items={[['table', 'Table'], ['grid', 'Specimens']]} />}
        </div>
        <label className="relative block min-w-[220px] flex-[1_1_300px] sm:flex-[0_1_300px]">
          <span className={srOnly}>Search cohorts</span>
          <Search size={15} strokeWidth={ICON_STROKE} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-cell" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value.slice(0, MAX_QUERY))}
            placeholder="Cancer type, accession, platform"
            autoComplete="off"
            className="box-border h-10 w-full rounded-chip border border-line-strong bg-surface pl-8 pr-3 text-sm text-ink transition-colors duration-150 hover:border-cell focus:border-accent focus:outline-none"
          />
        </label>
      </div>
      <p aria-live="polite" className="m-0 mb-3 mt-4 text-[12px] text-ink-2">
        {rows.length} of {COHORTS.length} cohorts · sorted by {SORT_LABEL[sortKey]}, {dirWord}
      </p>

      {rows.length === 0 && (
        <div className="fade-in rounded-card border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
          <Icon3D name="card-file-box" size={64} className="mx-auto block" />
          <p className="m-0 mt-3 text-base font-semibold">{q ? `No cohort matches “${query.trim()}”.` : 'No cohort matches these filters.'}</p>
          <p className="m-0 mb-5 mt-1.5 text-sm text-ink-2">Try an accession (GSE…), a tissue or a platform.</p>
          <button type="button" className={btn} onClick={clear}>Clear filters</button>
        </div>
      )}

      {rows.length > 0 && narrow && <CataloguePhoneList {...shared} />}
      {rows.length > 0 && !narrow && view === 'table' && (
        <CatalogueTable {...shared} caption={`REACH cohorts, sorted by ${SORT_LABEL[sortKey]} (${dirWord}), with totals`} totals={totals} sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
      )}
      {rows.length > 0 && (narrow || view === 'grid') && (
        <>
          {!narrow && <CatalogueCards {...shared} />}
          <p className="m-0 mt-3 font-mono text-[12px] text-ink-2">Total {totals.cells} cells across {totals.title}.</p>
        </>
      )}

      <ol className="m-0 mt-5 grid max-w-[92ch] list-none gap-1.5 p-0 text-[12px] leading-relaxed text-ink-2">
        <li><sup>a</sup> bcc_yost: the paper (Table 2a) prints “~47,000”. The exact 47,040 is the count implied by the abstract total ({GLOBAL_STATS.totalCells} minus the nine exact counts), so the column sums to the published total.</li>
        <li><sup>b</sup> CNV set +: share of the cohort’s CNV validation subset labelled positive (Table 9b), not the cohort’s malignant fraction. The nine subsets sum to {int(CNV_POOLED.pos)} positive and {int(CNV_POOLED.bg)} background cells ({int(CNV_POOLED.cells)} in all). mm_ledergor has no CNV reference in the release.</li>
        <li><sup>c</sup> pdac_peng and mm_ledergor: the second accession differs from the repository docs and awaits author confirmation.</li>
        <li><sup>d</sup> Donors, gene counts and purity tiers come from repository metadata and are not reported in the paper.</li>
      </ol>
    </section>
  );
}
