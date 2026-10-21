import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { Icon3D } from '../../ui/Icon3D';
import { ArrowRight, Check, ICON_STROKE, Search } from '../../ui/icons';
import { cx } from '../../lib/format';
import { scrollToId, setQuery, useQuery } from '../../lib/router';
import {
  RANKED_COUNT, ROWS, TIERS, UNRANKED_COUNT, VIEWS, VIEW_ORDER, csvName, isTierId, isViewId, orderText, selectRows, toCsv,
  type Group, type Sort, type TierId, type ViewId,
} from './model';
import { MobileList } from './MobileList';
import { RankView } from './RankView';
import { RefKey } from './parts';
import { Table } from './Table';
import { useMedia } from '../../ui/useMedia';
import { fmt } from '../../lib/format';

const ALL_GROUPS: Record<Group, boolean> = { ranked: true, reference: true };
const GROUPS: { id: Group; label: string; noun: string; count: number }[] = [
  { id: 'ranked', label: 'Ranked', noun: 'detectors', count: RANKED_COUNT },
  { id: 'reference', label: 'Unranked', noun: 'rows', count: UNRANKED_COUNT },
];

/** Pill tablist with roving focus: arrows, Home and End move and select. */
function Pills<T extends string>({ items, value, onPick, label, className, controls }: {
  items: { id: T; label: string }[]; value: T; onPick: (id: T) => void; label: string; className?: string; controls: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    const n = items.length;
    const to = e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    onPick(items[to].id);
    refs.current[to]?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className={cx('flex max-w-full gap-0.5 overflow-x-auto rounded-full border border-line bg-surface p-1', className)}>
      {items.map((it, i) => {
        const on = it.id === value;
        return (
          <button key={it.id} ref={(el) => { refs.current[i] = el; }} type="button" role="tab" aria-selected={on} aria-controls={controls}
            tabIndex={on ? 0 : -1} onClick={() => onPick(it.id)} onKeyDown={(e) => onKey(e, i)}
            className={cx('lb-tab lb-press min-h-8 flex-none cursor-pointer whitespace-nowrap rounded-full border-0 px-3 text-[13px]', on ? 'bg-ink text-canvas' : 'bg-transparent text-ink-2')}>
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const isFramed = () => { try { return window.self !== window.top; } catch { return true; } };

export function Board() {
  const q = useQuery();
  const rawView = q.get('view');
  const rawTier = q.get('tier');
  const view: ViewId = isViewId(rawView) ? rawView : 'overall';
  const tier: TierId = isTierId(rawTier) ? rawTier : 't1';
  const [sort, setSort] = useState<Sort>(null);
  const [groups, setGroups] = useState(ALL_GROUPS);
  const [query, setSearch] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [exportNote, setExportNote] = useState(false);
  const panelId = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const exportRef = useRef<HTMLButtonElement>(null);
  /** One view at a time: the table from 768px, the list below it (Details then render once). */
  const wide = useMedia('(min-width: 768px)');
  /** The interval column draws in once per visit; switching back from the rank view does not replay it. */
  const drawn = useRef(false);

  const writeUrl = (v: ViewId, t: TierId) => {
    const p = new URLSearchParams();
    if (v !== 'overall') p.set('view', v);
    if (v === 'tier' && t !== 't1') p.set('tier', t);
    setQuery(p.toString());
  };
  const pickView = (v: ViewId) => { setSort(null); writeUrl(v, tier); };
  const pickTier = (t: TierId) => writeUrl(view, t);

  const rows = selectRows({ view, tier, sort, groups, query });
  const V = VIEWS[view];
  const isTable = view !== 'rank';
  const trimmed = query.trim();
  const anyOff = !groups.ranked || !groups.reference;
  const order = orderText(view, tier, sort);
  const note = V.note(tier);
  const cut = note.indexOf(' · ');
  const isDefault = view === 'overall' && tier === 't1' && sort === null && !anyOff && query === '';
  const tableLabel = `Track A leaderboard. ${order} within each group. The supervised ceiling is listed first, then ranks 1 to ${RANKED_COUNT} for the published detectors, then the unranked reference rows.`;

  const toggle = (id: string) => setOpen((o) => ({ ...o, [id]: !o[id] }));
  const clearFilters = () => { setGroups(ALL_GROUPS); setSearch(''); };
  // The pressed control unmounts (empty state, note) or goes inert (Reset), so focus lands somewhere useful.
  const clearFromEmpty = () => { clearFilters(); searchRef.current?.focus(); };
  const reset = () => {
    if (isDefault) return;
    setSort(null); clearFilters(); setExportNote(false); setQuery('');
    searchRef.current?.focus();
  };
  const dismissNote = () => { setExportNote(false); exportRef.current?.focus(); };
  const exportCsv = () => {
    if (isFramed()) { setExportNote(true); return; }
    try { download(csvName(view, tier), toCsv(rows, view, tier)); } catch { setExportNote(true); }
  };

  const btn = 'lb-btn lb-press inline-flex min-h-10 items-center gap-1.5 rounded-chip border-0 bg-transparent px-2 text-xs font-medium';
  return (
    <section id="board" aria-labelledby="board-h" className="mx-auto max-w-[1240px] px-4 pb-16 pt-8 sm:px-6">
      <h2 id="board-h" className="sr-only">Leaderboard table</h2>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2">
        <Pills items={VIEW_ORDER.map((id) => ({ id, label: VIEWS[id].label }))} value={view} onPick={pickView} label="Leaderboard metric" controls={panelId} />
        <div className="flex w-full min-w-0 flex-wrap items-center gap-2 md:w-auto">
          <div role="group" aria-label="Show rows" className="flex gap-2">
            {GROUPS.map((g) => {
              const on = groups[g.id];
              return (
                <button key={g.id} type="button" aria-pressed={on} onClick={() => setGroups((s) => ({ ...s, [g.id]: !s[g.id] }))}
                  className={cx('lb-chip lb-press inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-chip px-3 text-sm',
                    on ? 'border border-solid border-line-strong bg-surface text-ink' : 'border border-dashed border-line-strong bg-transparent text-ink-3')}>
                  <span aria-hidden="true" className={cx('box-border inline-grid h-3.5 w-3.5 place-items-center rounded-[3px] text-[10px] leading-none',
                    on ? 'border border-ink bg-ink text-canvas' : 'border border-cell text-transparent')}><Check size={11} strokeWidth={2.5} /></span>
                  {g.label}<span className="sr-only"> {g.noun}</span>
                  <span className="font-mono text-[11px] text-ink-3">{g.count}</span>
                </button>
              );
            })}
          </div>
          <label className="relative box-border inline-flex min-h-10 w-full items-center gap-2 rounded-chip border border-line-strong bg-surface px-3 transition-colors duration-[var(--dur-1)] focus-within:border-accent sm:w-[224px]">
            <span className="sr-only">Search methods</span>
            <Search size={14} strokeWidth={ICON_STROKE} aria-hidden="true" className="flex-none text-ink-3" />
            <input ref={searchRef} type="search" value={query} onChange={(e) => setSearch(e.target.value)} placeholder="Search methods" autoComplete="off"
              className="w-full min-w-0 border-0 bg-transparent font-sans text-sm text-ink outline-none placeholder:text-ink-3 focus-visible:outline-none" />
          </label>
        </div>
      </div>
      {view === 'tier' && (
        <Pills items={TIERS} value={tier} onPick={pickTier} label="Prevalence tier" controls={panelId} className="mt-2 w-max" />
      )}
      <p aria-live="polite" className="m-0 mt-3 font-mono text-xs leading-[1.6] text-ink-2">
        <span className="text-ink">{cut < 0 ? note : note.slice(0, cut)}</span>{cut < 0 ? '' : note.slice(cut)}
      </p>

      <div id={panelId} role="tabpanel" aria-label={V.label}>
        {rows.length > 0 && isTable && (
          <>
            {wide
              ? <Table rows={rows} view={view} tier={tier} sort={sort} onSort={setSort} open={open} onToggle={toggle} label={tableLabel} drawn={drawn} />
              : <MobileList rows={rows} view={view} tier={tier} open={open} onToggle={toggle} label={tableLabel} />}
            <RefKey lead="Dashed marks, bootstrap mean AP:" value={(r) => fmt.ap(r.m.bootstrapMeanAP)} className="mt-3 hidden md:flex" />
          </>
        )}
        {rows.length > 0 && !isTable && <RankView rows={rows} />}
        {rows.length === 0 && (
          <div role="status" className="fade-in mt-6 rounded-card border border-dashed border-line-strong bg-surface px-6 py-10 text-center">
            <Icon3D name="microscope" size={56} className="mx-auto block" />
            <p className="m-0 mt-3 text-base font-semibold text-ink">{trimmed ? `No method matches “${trimmed}”` : 'No rows to show'}</p>
            <p className="mx-auto mb-0 mt-1.5 max-w-[56ch] text-sm leading-[1.6] text-ink-2">
              {trimmed
                ? `Search looks at method names, paradigms, mechanisms and roles${anyOff ? ', inside the groups that are switched on' : ''}. Try a shorter term such as “graph” or “baseline”.`
                : 'Both row groups are switched off. Turn one back on to see the board.'}
            </p>
            <button type="button" onClick={clearFromEmpty}
              className="lb-btn lb-press mt-4 inline-flex min-h-11 cursor-pointer items-center rounded-chip border border-line-strong bg-surface px-4 text-[13px] font-medium text-ink">
              {trimmed ? 'Clear search and filters' : 'Clear filters'}
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-x-8 gap-y-2">
        <p aria-live="polite" className="m-0 min-w-0 font-mono text-xs leading-[1.6] text-ink-3">
          {rows.length} of {ROWS.length} methods shown · {order} within each group
        </p>
        <div className="flex flex-none items-center gap-1">
          <button ref={exportRef} type="button" onClick={exportCsv} disabled={rows.length === 0}
            className={cx(btn, rows.length === 0 ? 'cursor-default text-cell opacity-60' : 'cursor-pointer text-ink-2')}>
            <ArrowRight size={14} strokeWidth={ICON_STROKE} aria-hidden="true" className="rotate-90" />Export CSV
          </button>
          <button type="button" onClick={reset} aria-disabled={isDefault}
            className={cx(btn, isDefault ? 'cursor-default text-cell opacity-60' : 'cursor-pointer text-ink-2')}>
            Reset
          </button>
        </div>
      </div>
      {exportNote && (
        <div role="status" className="fade-in mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-md border border-[#e8c9bd] bg-[#fdf6f3] px-3 py-2.5">
          <p className="m-0 min-w-0 text-[13px] leading-normal text-ink-2">
            <span className="font-semibold text-ink">Export is unavailable in this preview.</span> Downloads are blocked here. Open the site in its own tab to save{' '}
            <span className="font-mono text-xs">{csvName(view, tier)}</span>.
          </p>
          <button type="button" onClick={dismissNote}
            className="lb-btn lb-press min-h-8 cursor-pointer rounded-chip border border-line-strong bg-surface px-2.5 text-xs font-medium text-ink">Dismiss</button>
        </div>
      )}
      {rows.length > 0 && isTable && (
        <p className="m-0 mt-6 max-w-[68ch] text-sm leading-[1.6] text-ink-2">
          Dots are bootstrap mean AP with 95% bootstrap intervals (2,000 resamples, Figure 4a), on the same axis as the chart above; dashed marks are the {UNRANKED_COUNT} unranked rows.
          Neighbouring rows stay unordered unless the{' '}
          <button type="button" onClick={() => scrollToId('pairwise')} className="cursor-pointer border-0 bg-transparent p-0 text-sm text-accent-ink underline hover:text-ink">pairwise tests</button>{' '}
          separate them, and every rank compares lineages, so it says nothing about intra-lineage performance (Track F).
        </p>
      )}
    </section>
  );
}
