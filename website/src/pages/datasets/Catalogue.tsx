import { Fragment, useState, type ReactNode } from 'react';
import { DATASETS_DATA, GLOBAL_STATS, type DatasetInfo } from '../../data/benchmarkData';
import { Badge, Button, Icon, MethodName, Tabs, fmt } from '../../ui';
import { ACCESSION_PENDING, APPROX_CELLS, CNV_COHORTS, CNV_OVERFLOW, NOTE, NO_CNV, TOTALS, bestRanked, isRanked, methodInfo, methodLabel, methodOrder, pct, sum, tissueLabel } from './model';
import { AccessionLinks, Cells, CnvShare, CohortGlyph, Hang, LogAxis, LogBar, Mark, TrackSlots } from './parts';

/* ---------- Filter, search, sort ---------- */
type Filter = 'all' | 'solid' | 'heme';
type View = 'table' | 'grid';
type SortKey = 'cohort' | 'cells' | 'cnv';
interface Sort { key: SortKey; dir: 'asc' | 'desc' }

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: `All · ${DATASETS_DATA.length}` },
  { value: 'solid', label: `Solid · ${GLOBAL_STATS.solidCohorts}` },
  { value: 'heme', label: `Blood / CTC · ${GLOBAL_STATS.hematologicCohorts}` },
];
const TRACK_A_COHORTS = DATASETS_DATA.filter((d) => d.trackAUnits > 0).length;
const UNITS_PER_COHORT = DATASETS_DATA.find((d) => d.trackAUnits > 0)?.trackAUnits ?? 0;
const VIEWS: { value: View; label: string }[] = [{ value: 'table', label: 'Table' }, { value: 'grid', label: 'Specimens' }];
const SORT_LABEL: Record<SortKey, string> = { cohort: 'cohort name', cells: 'cell count', cnv: 'CNV-set positive share' };

const matches = (d: DatasetInfo, f: Filter, q: string) => {
  if (f === 'solid' && d.tissueCategory !== 'Solid Tumor') return false;
  if (f === 'heme' && d.tissueCategory === 'Solid Tumor') return false;
  if (!q) return true;
  return [d.id, d.cancerType, d.accession, d.platform, d.tissueCategory].join(' ').toLowerCase().includes(q.toLowerCase());
};
const cnvShare = (d: DatasetInfo) => (d.cnvCells && d.cnvPos !== undefined ? d.cnvPos / d.cnvCells : -1);
const sortValue = (d: DatasetInfo, k: SortKey) => (k === 'cells' ? d.cellsNum : k === 'cnv' ? cnvShare(d) : 0);
const sortRows = (rows: DatasetInfo[], s: Sort) => [...rows].sort((a, b) => {
  const c = s.key === 'cohort' ? a.id.localeCompare(b.id) : sortValue(a, s.key) - sortValue(b, s.key);
  return s.dir === 'asc' ? c : -c;
});

/* ---------- Per-cohort detail ---------- */
const ROLE_NOTE: Record<string, string> = {
  'Supervised ceiling': 'supervised ceiling', Exploratory: 'exploratory comparator',
  'Naive baseline': 'naive baseline', 'Floor baseline': 'floor baseline',
};

/** One per-cohort result. A reference method says so inline, so a cohort's top score is never read as a rank. */
function ResultLine({ label, method, ap, lead }: { label: string; method: string; ap: number; lead?: boolean }) {
  const ranked = isRanked(method);
  const rank = methodInfo(method)?.publishedRankNum;
  const role = ROLE_NOTE[methodInfo(method)?.paperRole ?? ''];
  return (
    <div className={`flex flex-col gap-1 ${lead ? 'rounded-chip border border-line bg-surface px-3 py-2.5' : ''}`}>
      <dt className="label">{label}</dt>
      <dd className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <MethodName id={method} name={methodLabel(method)} reference={!ranked} />
        <span className={`font-mono tabular text-ink ${lead ? 'text-sm font-semibold' : 'text-[13px]'}`}>{fmt.ap(ap)}</span>
        <span className="text-xs text-ink-3">
          {ranked ? `(ranked detector, leaderboard ${rank} of 6)` : `(reference, not ranked${role ? `: ${role}` : ''})`}
        </span>
      </dd>
    </div>
  );
}

function DatasetDetail({ d, stacked, onCompare }: { d: DatasetInfo; stacked?: boolean; onCompare: (id: string) => void }) {
  const trackD = d.trackAUnits === 0;
  const ranked = bestRanked(d);
  const topIsRanked = ranked !== null && methodLabel(d.bestOverallMethod) === ranked.method;
  const unsupDiffers = methodLabel(d.bestUnsupMethod) !== methodLabel(d.bestOverallMethod) && (ranked === null || methodLabel(d.bestUnsupMethod) !== ranked.method);
  /** Results listed in site method order: ceiling, ranked 1 to 6, references. */
  const results: { method: string; node: ReactNode }[] = [];
  if (ranked) results.push({ method: ranked.method, node: <ResultLine key="ranked" lead label={trackD ? 'Best ranked detector · Track D AP' : 'Best ranked detector · mean AP'} method={ranked.method} ap={ranked.ap} /> });
  if (!topIsRanked) results.push({ method: d.bestOverallMethod, node: <ResultLine key="top" label="Top score in this cohort" method={d.bestOverallMethod} ap={d.bestOverallAP} /> });
  if (unsupDiffers) results.push({ method: d.bestUnsupMethod, node: <ResultLine key="unsup" label="Top score without supervision" method={d.bestUnsupMethod} ap={d.bestUnsupAP} /> });
  const ordered = [...results].sort((x, y) => methodOrder(x.method) - methodOrder(y.method));
  return (
    <div className={`grid gap-6 text-sm ${stacked ? '' : 'md:grid-cols-[minmax(0,1.15fr)_minmax(0,1.35fr)_minmax(0,0.9fr)]'}`}>
      <div className="flex flex-col items-start gap-3">
        <p className="max-w-[60ch] leading-relaxed text-ink-2">{d.description}</p>
        <p className="font-mono text-xs text-ink-3">
          {trackD ? 'Not in Track A · natural prevalence (Track D)' : `${d.trackAUnits} Track A units`}
        </p>
        <Button variant="secondary" size="sm" icon="scales" onClick={() => onCompare(d.id)}>Compare this cohort</Button>
      </div>
      <dl className="grid content-start gap-3">
        {!ranked && <div><dt className="label">Best ranked detector</dt><dd className="mt-1 text-xs text-ink-3">n/a: no per-method result for this cohort</dd></div>}
        {ordered.map((r) => r.node)}
        <p className="text-xs leading-snug text-ink-3">
          {trackD
            ? 'Repository value; the paper prints no per-cohort Track D numbers.'
            : 'Mean AP over 20 Track A units; top scores as in Table 6a. A cohort best is not a leaderboard rank.'}
        </p>
      </dl>
      <dl className="grid content-start grid-cols-[auto_1fr] gap-x-4 gap-y-2">
        <dt className="label pt-0.5">Donors</dt><dd className="text-ink">{d.donors}</dd>
        <dt className="label pt-0.5">Genes</dt><dd className="font-mono text-ink tabular">{fmt.int(d.genes)}</dd>
        <dt className="label pt-0.5">Purity</dt><dd><Badge>{d.purityTier}</Badge></dd>
        <dd className="col-span-2 text-xs text-ink-3"><Hang n={NOTE.meta}>Repository metadata, not reported in the paper</Hang></dd>
      </dl>
    </div>
  );
}

const ExpandIcon = ({ open }: { open: boolean }) => (
  <Icon name="caret-down" size={16} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
);

/* ---------- Table view (md and up) ---------- */
function SortHeader({ k, sort, onSort, children, align = 'left', sub }: { k: SortKey; sort: Sort; onSort: (k: SortKey) => void; children: string; align?: 'left' | 'right'; sub?: ReactNode }) {
  const active = sort.key === k;
  return (
    <th scope="col" aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'} className={`font-normal ${sub ? 'align-bottom' : 'px-3'} ${align === 'right' ? 'text-right' : ''}`}>
      <button type="button" onClick={() => onSort(k)}
        className={`label inline-flex h-10 items-center gap-1 transition-colors duration-150 hover:text-ink ${sub ? 'px-3' : ''} ${active ? 'text-ink' : ''} ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        {children}
        <Icon name={active ? (sort.dir === 'asc' ? 'caret-up' : 'caret-down') : 'caret-up-down'} size={12} className={active ? 'text-accent' : 'text-ink-3'} />
      </button>
      {sub}
    </th>
  );
}

function CatalogueTable({ rows, sort, onSort, open, toggle, onCompare }: { rows: DatasetInfo[]; sort: Sort; onSort: (k: SortKey) => void; open: string | null; toggle: (id: string) => void; onCompare: (id: string) => void }) {
  const cnvRows = rows.filter((d) => d.cnvCells !== undefined);
  const shownCnvPos = sum(cnvRows.map((d) => d.cnvPos ?? 0));
  const shownCnvCells = sum(cnvRows.map((d) => d.cnvCells ?? 0));
  const all = rows.length === DATASETS_DATA.length;
  return (
    <div className="relative hidden overflow-x-auto rounded-card border border-line bg-surface md:block">
      <table className="w-full min-w-[1040px] table-fixed text-left text-sm">
        <caption className="sr-only">REACH cohorts, sorted by {SORT_LABEL[sort.key]} ({sort.dir === 'asc' ? 'ascending' : 'descending'}), with totals</caption>
        <colgroup>
          <col className="w-[25%]" /><col className="w-[13%]" /><col className="w-[15%]" /><col className="w-[11%]" />
          <col /><col className="w-[172px]" /><col className="w-[56px]" />
        </colgroup>
        <thead className="border-b border-line bg-sunk">
          <tr>
            <SortHeader k="cohort" sort={sort} onSort={onSort}>Cohort</SortHeader>
            <th scope="col" className="label px-3 font-normal">Tissue · platform</th>
            <SortHeader k="cells" sort={sort} onSort={onSort} align="right" sub={<LogAxis className="mx-3 -mt-1 mb-1.5" />}>Cells · log</SortHeader>
            <SortHeader k="cnv" sort={sort} onSort={onSort}>CNV set +</SortHeader>
            <th scope="col" className="label px-3 font-normal">Source</th>
            <th scope="col" className="label px-3 font-normal">Tracks A to F</th>
            <th scope="col" className="px-2"><span className="sr-only">Details</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d) => {
            const isOpen = open === d.id;
            return (
              <Fragment key={d.id}>
                <tr className={`h-14 border-b border-line transition-colors duration-150 ${isOpen ? 'bg-sunk/70' : 'hover:bg-sunk/45'}`}>
                  <th scope="row" className="px-3 font-normal">
                    <span className="flex min-w-0 items-center gap-3">
                      <CohortGlyph id={d.id} size={18} framed />
                      <span className="min-w-0">
                        <span className="block truncate font-mono text-[13px] text-ink">{d.id}</span>
                        <span className="block truncate text-xs text-ink-2" title={d.cancerType}>{d.cancerType}</span>
                      </span>
                    </span>
                  </th>
                  <td className="px-3">
                    <span className="block truncate text-ink-2">{tissueLabel(d)}</span>
                    <span className="block truncate text-xs text-ink-3">{d.platform}</span>
                  </td>
                  <td className="px-3">
                    <span className="block whitespace-nowrap text-right font-mono text-ink tabular"><Cells d={d} /></span>
                    <LogBar value={d.cellsNum} className="mt-1.5" />
                  </td>
                  <td className="px-3"><CnvShare d={d} /></td>
                  <td className="px-3"><AccessionLinks d={d} /></td>
                  <td className="px-3"><TrackSlots d={d} /></td>
                  <td className="px-1.5">
                    <button type="button" onClick={() => toggle(d.id)} aria-expanded={isOpen} aria-controls={`detail-${d.id}`}
                      className={`grid size-11 place-items-center rounded-chip transition-colors duration-150 hover:bg-sunk hover:text-ink active:bg-line ${isOpen ? 'text-ink' : 'text-ink-3'}`}>
                      <ExpandIcon open={isOpen} />
                      <span className="sr-only">{isOpen ? 'Hide' : 'Show'} details for {d.id}</span>
                    </button>
                  </td>
                </tr>
                {isOpen && (
                  <tr id={`detail-${d.id}`} className="border-b border-line bg-sunk/70">
                    <td colSpan={7} className="px-4 pb-6 pt-2 pl-[60px]"><DatasetDetail d={d} onCompare={onCompare} /></td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
        <tfoot className="bg-sunk">
          <tr className="h-14">
            <th scope="row" className="px-3 font-normal">
              <span className="block font-mono text-[13px] font-semibold text-ink">{all ? `All ${rows.length} cohorts` : `${rows.length} of ${DATASETS_DATA.length} shown`}</span>
              <span className="block text-xs text-ink-2">{all ? `Matches the paper total, ${GLOBAL_STATS.totalCells} cells` : `of ${fmt.int(TOTALS.cells)} cells in all cohorts`}</span>
            </th>
            <td className="px-3" />
            <td className="whitespace-nowrap px-3 text-right font-mono font-semibold text-ink tabular">{fmt.int(sum(rows.map((d) => d.cellsNum)))}</td>
            <td className="px-3">
              {shownCnvCells > 0 ? (
                <span className="block font-mono leading-tight tabular">
                  <span className="block text-[13px] font-semibold text-ink">{pct(shownCnvPos, shownCnvCells)}</span>
                  <span className="block whitespace-nowrap text-[11px] text-ink-2">{fmt.int(shownCnvPos)} / {fmt.int(shownCnvCells)}</span>
                </span>
              ) : <span className="text-xs text-ink-3">n/a</span>}
            </td>
            <td colSpan={3} className="px-3 text-xs text-ink-2">{all && `${TOTALS.trackAUnits} Track A units (${TRACK_A_COHORTS} cohorts × ${UNITS_PER_COHORT})`}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/* ---------- Cards: compact rows under md, specimen grid at md+ ---------- */
function DetailsButton({ d, open, toggle, id }: { d: DatasetInfo; open: boolean; toggle: (id: string) => void; id: string }) {
  return (
    <button type="button" onClick={() => toggle(d.id)} aria-expanded={open} aria-controls={id}
      className="-mx-2 inline-flex min-h-11 shrink-0 items-center gap-1.5 self-start rounded-chip px-2 text-sm font-medium text-accent transition-colors duration-150 hover:bg-accent-tint">
      {open ? 'Hide details' : 'Details'}<ExpandIcon open={open} />
      <span className="sr-only"> for {d.id}</span>
    </button>
  );
}

/** Under md: one row per cohort in a single hairline list, cells bar on the shared log scale of the header row. */
function CompactRow({ d, open, toggle, onCompare }: { d: DatasetInfo; open: boolean; toggle: (id: string) => void; onCompare: (id: string) => void }) {
  return (
    <li className={`px-4 pb-1.5 pt-3.5 transition-colors duration-150 ${open ? 'bg-sunk/60' : ''}`}>
      <div className="flex items-start gap-3">
        <CohortGlyph id={d.id} size={16} framed />
        <div className="min-w-0 flex-1">
          <p className="break-all font-mono text-[13px] leading-tight text-ink">{d.id}</p>
          <p className="mt-0.5 text-xs leading-snug text-ink-2">{d.cancerType}</p>
        </div>
        <p className="shrink-0 pt-px text-right font-mono text-sm font-semibold leading-tight text-ink tabular"><Cells d={d} /></p>
      </div>
      <LogBar value={d.cellsNum} className="mt-3" />
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2.5"><span className="label">CNV +</span><CnvShare d={d} /></span>
        <TrackSlots d={d} />
      </div>
      <div className="mt-0.5 flex items-center justify-between gap-3">
        <AccessionLinks d={d} touch />
        <DetailsButton d={d} open={open} toggle={toggle} id={`card-${d.id}`} />
      </div>
      {open && <div id={`card-${d.id}`} className="mb-2 border-t border-line pt-4 pb-2"><DatasetDetail d={d} stacked onCompare={onCompare} /></div>}
    </li>
  );
}

function SpecimenCard({ d, open, toggle, onCompare }: { d: DatasetInfo; open: boolean; toggle: (id: string) => void; onCompare: (id: string) => void }) {
  return (
    <li className={`group flex flex-col rounded-card border bg-surface p-4 transition-colors duration-150 ${open ? 'border-line-strong' : 'border-line hover:border-line-strong'}`}>
      <div className="flex items-start justify-between gap-3">
        <CohortGlyph id={d.id} size={22} framed className="transition-colors duration-150 group-hover:text-ink" />
        <span className="label pt-1">{tissueLabel(d)}</span>
      </div>
      <p className="mt-4 break-words font-mono text-[13px] text-ink">{d.id}</p>
      <p className="mt-0.5 min-h-[2.5rem] text-sm leading-snug text-ink-2">{d.cancerType}</p>
      <p className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-ink tabular"><Cells d={d} /></p>
      <p className="label mt-1">cells · {d.platform}</p>
      <LogBar value={d.cellsNum} className="mt-3" />
      <LogAxis className="mt-1" />
      <div className="mt-2"><TrackSlots d={d} /></div>
      <dl className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 border-t border-line pt-3 text-sm">
        <dt className="label">CNV +</dt><dd><CnvShare d={d} /></dd>
        <dt className="label">Source</dt><dd><AccessionLinks d={d} /></dd>
      </dl>
      <div className="mt-auto pt-2"><DetailsButton d={d} open={open} toggle={toggle} id={`spec-${d.id}`} /></div>
      {open && <div id={`spec-${d.id}`} className="mt-2 border-t border-line pt-4"><DatasetDetail d={d} stacked onCompare={onCompare} /></div>}
    </li>
  );
}

/* ---------- Notes (every reconciliation caveat is shown, not hidden) ---------- */
function Notes() {
  return (
    <ol className="mt-5 grid max-w-[92ch] gap-1.5 text-xs leading-relaxed text-ink-2">
      <li><Mark n={NOTE.approx} /> {APPROX_CELLS.join(', ')}: the paper (Table 2a) prints “~47,000”. The exact {fmt.int(DATASETS_DATA.find((d) => d.id === APPROX_CELLS[0])?.cellsNum ?? 0)} is the count implied by the abstract total ({GLOBAL_STATS.totalCells} minus the nine exact counts), so the column sums to the published total.</li>
      <li><Mark n={NOTE.cnv} /> CNV set +: share of the cohort’s CNV validation subset labelled positive (Table 9b), not the cohort’s malignant fraction. The nine subsets sum to {fmt.int(TOTALS.cnvPos)} positive and {fmt.int(TOTALS.cnvNeg)} background cells ({fmt.int(TOTALS.cnvCells)} in all). {NO_CNV.join(', ')} has no CNV reference in the release.{CNV_OVERFLOW.length > 0 && ` ${CNV_OVERFLOW.join(', ')}: the CNV subset is larger than the listed cohort size; both values are printed as given.`}</li>
      <li><Mark n={NOTE.accession} /> {ACCESSION_PENDING.join(' and ')}: the second accession differs from the repository docs and awaits author confirmation.</li>
      <li><Mark n={NOTE.meta} /> Donors, gene counts and purity tiers come from repository metadata and are not reported in the paper.</li>
    </ol>
  );
}

/* ---------- Toolbar facts: the page totals, one line beside the heading ---------- */
function Fact({ label, value, context }: { label: string; value: string; context: string }) {
  return (
    <div className="min-w-0">
      <dt className="label">{label}</dt>
      <dd className="mt-0.5 font-mono tabular sm:whitespace-nowrap">
        <span className="text-base font-semibold tracking-[-0.01em] text-ink">{value}</span>
        <span className="block text-[11px] text-ink-3 sm:ml-1.5 sm:inline">{context}</span>
      </dd>
    </div>
  );
}

function Facts() {
  return (
    <dl className="grid grid-cols-3 gap-x-5 sm:flex sm:gap-x-8">
      <Fact label="Cells" value={fmt.int(TOTALS.cells)} context={`${DATASETS_DATA.length} cohorts`} />
      <Fact label="CNV set" value={fmt.int(TOTALS.cnvCells)} context={`${CNV_COHORTS.length} cohorts`} />
      <Fact label="Track A units" value={String(TOTALS.trackAUnits)} context={`${TRACK_A_COHORTS} × ${UNITS_PER_COHORT}`} />
    </dl>
  );
}

/* ---------- Catalogue ---------- */
export default function Catalogue({ onCompare }: { onCompare: (id: string) => void }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [view, setView] = useState<View>('table');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>({ key: 'cells', dir: 'desc' });
  const [open, setOpen] = useState<string | null>(null);
  const rows = sortRows(DATASETS_DATA.filter((d) => matches(d, filter, query.trim())), sort);
  const toggle = (id: string) => setOpen((o) => (o === id ? null : id));
  const onSort = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'cohort' ? 'asc' : 'desc' }));
  const reset = () => { setQuery(''); setFilter('all'); };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 border-b border-line pb-4 md:flex-row md:items-center md:justify-between md:gap-8">
        <h2 id="catalogue-h" className="text-xl font-semibold tracking-[-0.02em] text-ink md:text-2xl">Cohort catalogue</h2>
        <Facts />
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={filter} onChange={setFilter} options={FILTERS} label="Filter cohorts by tissue" />
          <div className="hidden md:block"><Tabs value={view} onChange={setView} options={VIEWS} label="Catalogue view" /></div>
        </div>
        <label className="relative block md:w-72">
          <span className="sr-only">Search cohorts</span>
          <Icon name="magnifying-glass" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cancer type, accession, platform"
            className="h-11 w-full rounded-chip border border-line-strong bg-surface pl-9 pr-3 text-base text-ink transition-colors duration-150 placeholder:text-ink-3 hover:border-ink/30 focus:border-accent focus:outline-none md:h-10 md:text-sm" />
        </label>
      </div>
      <p className="mb-3 mt-4 text-xs text-ink-2" aria-live="polite">
        {rows.length} of {DATASETS_DATA.length} cohorts · sorted by {SORT_LABEL[sort.key]}, {sort.dir === 'asc' ? 'ascending' : 'descending'} · open a row for per-cohort results
      </p>

      {rows.length === 0 ? (
        <div className="rounded-card border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
          <Icon name="magnifying-glass" size={20} className="mx-auto text-ink-3" />
          <p className="mt-3 text-base text-ink">No cohort matches “{query}”.</p>
          <p className="mt-1 text-sm text-ink-2">Try an accession (GSE…), a tissue or a platform.</p>
          <div className="mt-5 flex justify-center"><Button variant="secondary" size="sm" onClick={reset}>Clear filters</Button></div>
        </div>
      ) : (
        <>
          {view === 'table' && <CatalogueTable rows={rows} sort={sort} onSort={onSort} open={open} toggle={toggle} onCompare={onCompare} />}
          {view === 'grid' && (
            <ul className="hidden items-start gap-3 md:grid md:grid-cols-3 xl:grid-cols-5">
              {rows.map((d) => <SpecimenCard key={d.id} d={d} open={open === d.id} toggle={toggle} onCompare={onCompare} />)}
            </ul>
          )}
          <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface md:hidden" aria-label="Cohorts">
            <li aria-hidden="true" className="bg-sunk px-4 pb-1 pt-2.5">
              <span className="label">Cells · log scale</span>
              <LogAxis className="mt-1.5" />
            </li>
            {rows.map((d) => <CompactRow key={d.id} d={d} open={open === d.id} toggle={toggle} onCompare={onCompare} />)}
          </ul>
          {view === 'grid' && (
            <p className="mt-3 hidden font-mono text-xs text-ink-2 md:block tabular">
              Total {fmt.int(sum(rows.map((d) => d.cellsNum)))} cells across {rows.length} cohorts{rows.length === DATASETS_DATA.length && `, matching the paper total of ${GLOBAL_STATS.totalCells}`}.
            </p>
          )}
          <p className="mt-3 font-mono text-xs text-ink-2 md:hidden tabular">
            Total {fmt.int(sum(rows.map((d) => d.cellsNum)))} cells across {rows.length} cohorts.
          </p>
        </>
      )}
      <Notes />
    </div>
  );
}
