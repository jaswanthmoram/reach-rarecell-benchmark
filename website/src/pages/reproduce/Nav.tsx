// Section navigation, styled like the shared SectionNav (pills, one sliding active pill, 150 ms colour states):
// the filterable sidebar (desktop), the "On this page" rail (wide screens) and the sticky section picker for
// phones. A long docs page keeps a vertical sidebar: eight sections, 25 steps and a filter do not fit a strip.
// All jumps are buttons; the hash is the router.
import { useEffect, useId, useRef, useState, type RefObject } from 'react';
import { cx } from '../../lib/format';
import { ChevronDown, ICON_STROKE, Search, X } from '../../ui/icons';
import { Icon3D } from '../../ui/Icon3D';
import { useSlidingPill } from '../../ui/useSlidingPill';
import { SECTIONS, type SectionDef } from './content';
import { filterSections, filterStatus, type Highlight } from './filter';
import { GateStrip } from './GateBand';

/** Jump to a section or step by id (not TS's Pick). */
export type OnPick = (id: string) => void;
const MONO_NUM = 'w-5 flex-none font-mono text-[11px] tabular-nums';
/** Pill items: transparent, so the shared sliding pill shows through behind the active one. */
const ITEM = 'relative z-[1] flex w-full cursor-pointer items-center rounded-full border-0 bg-transparent text-left transition-colors duration-[var(--dur-1)]';

function Hl({ h }: { h: Highlight }) {
  return <span>{h.t0}{h.t1 && <mark className="rounded-[2px] bg-accent-tint text-ink">{h.t1}</mark>}{h.t2}</span>;
}

/** The clear button sits beside the input, not inside a label, so the input's name stays "Filter sections". */
function FilterInput({ query, onQuery, autoFocus }: { query: string; onQuery: (q: string) => void; autoFocus?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  // Clearing removes the clear button, so focus goes back to the input rather than to the body.
  const clear = () => { onQuery(''); input.current?.focus(); };
  return (
    <div className="relative">
      {/* oxlint-disable-next-line jsx-a11y/no-autofocus -- opened on request from the phone bar's filter button */}
      <input ref={input} type="search" aria-label="Filter sections" value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Filter sections" spellCheck={false} autoComplete="off" autoFocus={autoFocus}
        className="box-border h-11 w-full rounded-full border border-line bg-surface pl-10 pr-10 text-sm text-ink transition-colors duration-[var(--dur-1)] placeholder:text-ink-3 hover:border-line-strong focus:border-accent [&::-webkit-search-cancel-button]:hidden" />
      <Search size={15} strokeWidth={ICON_STROKE} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-3.5 text-ink-3" />
      {query.trim() && (
        <button type="button" aria-label="Clear filter" onClick={clear}
          className="absolute right-1 top-1 grid size-9 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-ink-3 transition-colors duration-[var(--dur-1)] hover:bg-sunk hover:text-ink">
          <X size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function NoMatch({ query, onClear, centred = false }: { query: string; onClear: () => void; centred?: boolean }) {
  return (
    <div className={cx('flex flex-col gap-2 rounded-card border border-dashed border-line-strong p-4', centred ? 'items-center text-center' : 'items-start')}>
      {centred && <Icon3D name="card-file-box" size={56} className="mb-1" />}
      <p className="m-0 text-sm font-medium">No section matches</p>
      <p className="m-0 text-[13px] leading-[1.5] text-ink-2 [overflow-wrap:anywhere]">Nothing in the section titles matches “{query.trim()}”. Try a tool such as snakemake, zenodo or pytest.</p>
      <button type="button" onClick={onClear}
        className="min-h-9 cursor-pointer rounded-full border border-line-strong bg-surface px-3.5 text-[13px] font-medium text-ink transition-colors duration-[var(--dur-1)] hover:bg-sunk">Clear filter</button>
    </div>
  );
}

/** Filtered section list, shared by the sidebar and the phone filter panel. One pill slides to the active section. */
function SectionList({ query, active, onPick }: { query: string; active: SectionDef; onPick: OnPick }) {
  const r = filterSections(query);
  const { containerRef, pillRef } = useSlidingPill<HTMLDivElement>(active.id);
  return (
    <div ref={containerRef} className="relative flex flex-col gap-5">
      <span ref={pillRef} aria-hidden="true" className="slide-pill" />
      {r.groups.map((g) => (
        <div key={g.label} className="flex flex-col gap-0.5">
          <p className="eyebrow m-0 mb-1.5 px-3">{g.label}</p>
          {g.items.map(({ section: s, title, subs }) => {
            const on = s.id === active.id;
            return (
              <div key={s.id}>
                <button type="button" data-pill-key={s.id} aria-current={on ? 'location' : undefined} onClick={() => onPick(s.id)}
                  className={cx(ITEM, 'min-h-11 gap-3 px-3 text-sm', on ? 'font-medium text-ink' : 'text-ink-2 hover:text-ink')}>
                  <span aria-hidden="true" className={cx(MONO_NUM, 'transition-colors duration-[var(--dur-1)]', on ? 'text-accent' : 'text-ink-3')}>{s.num}</span>
                  <Hl h={title} />
                </button>
                {subs.length > 0 && (
                  <div className="mb-1 ml-[22px] flex flex-col border-l border-line pl-3">
                    {subs.map(({ sub, title: t }) => (
                      <button key={sub.id} type="button" onClick={() => onPick(sub.id)}
                        className={cx(ITEM, 'min-h-10 px-2.5 text-[13px] text-ink-2 hover:bg-sunk hover:text-ink')}>
                        <Hl h={t} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function SideNav({ query, onQuery, active, onPick }: { query: string; onQuery: (q: string) => void; active: SectionDef; onPick: OnPick }) {
  const r = filterSections(query);
  return (
    <nav aria-label="Reproduce sections"
      className="hidden flex-col gap-5 self-start pt-2 lg:sticky lg:top-[calc(var(--header-h)+20px)] lg:flex lg:max-h-[calc(100dvh-var(--header-h)-20px)] lg:overflow-y-auto lg:pb-6 [scrollbar-width:thin]">
      <div className="flex flex-col gap-2.5">
        <FilterInput query={query} onQuery={onQuery} />
        <p aria-live="polite" className="sr-only">{filterStatus(r)}</p>
        <GateStrip lit={active.gates} className="mt-1 px-1" />
        <p className="m-0 px-1 text-xs leading-[1.45] text-ink-2"><span className="text-ink">{active.title}</span>: {active.note}</p>
      </div>
      {r.filtering && r.count === 0 && <NoMatch query={query} onClear={() => onQuery('')} />}
      <SectionList query={query} active={active} onPick={onPick} />
    </nav>
  );
}

/** "On this page": the section in view and its steps, nested and unnumbered (the body numbers the steps). */
export function Rail({ active, activeSub, onPick, onTop }: { active: SectionDef; activeSub: string; onPick: OnPick; onTop: () => void }) {
  const { containerRef, pillRef } = useSlidingPill<HTMLDivElement>(activeSub);
  return (
    <nav aria-label="On this page" className="sticky top-[calc(var(--header-h)+20px)] hidden flex-col gap-2 self-start pt-2 xl:flex">
      <p className="eyebrow m-0 mb-1">On this page</p>
      <button type="button" onClick={() => onPick(active.id)}
        className="flex min-h-9 cursor-pointer items-center border-0 bg-transparent p-0 text-left text-[13px] font-medium text-ink transition-colors duration-[var(--dur-1)] hover:text-accent-ink">
        {active.title}
      </button>
      <div ref={containerRef} className="relative ml-1 flex flex-col border-l border-line pl-2">
        <span ref={pillRef} aria-hidden="true" className="slide-pill" />
        {active.subs.map((b) => {
          const on = b.id === activeSub;
          return (
            <button key={b.id} type="button" data-pill-key={b.id} aria-current={on ? 'location' : undefined} onClick={() => onPick(b.id)}
              className={cx(ITEM, 'min-h-9 px-2.5 text-xs', on ? 'font-medium text-ink' : 'text-ink-2 hover:text-ink')}>
              {b.title}
            </button>
          );
        })}
      </div>
      <BackToTop onTop={onTop} className="mt-3" />
    </nav>
  );
}

function BackToTop({ onTop, className, compact = false }: { onTop: () => void; className?: string; compact?: boolean }) {
  return (
    <button type="button" onClick={onTop} aria-label={compact ? 'Back to top' : undefined}
      className={cx(compact
        ? 'grid size-11 flex-none cursor-pointer place-items-center rounded-full border border-line-strong bg-surface text-ink-2 transition-colors duration-[var(--dur-1)] active:bg-sunk'
        : 'inline-flex min-h-9 cursor-pointer items-center gap-1.5 self-start border-0 bg-transparent p-0 text-xs text-ink-2 transition-colors duration-[var(--dur-1)] hover:text-ink', className)}>
      <ChevronDown size={compact ? 16 : 13} strokeWidth={ICON_STROKE} aria-hidden="true" className="rotate-180" />
      {!compact && 'Back to top'}
    </button>
  );
}

/** Escape (focus back to the toggle) or a press outside the panel and its toggle closes the phone panel. */
function useDismiss(open: boolean, inside: RefObject<HTMLElement | null>[], close: (refocus: boolean) => void) {
  const closeRef = useRef(close);
  useEffect(() => { closeRef.current = close; });
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); closeRef.current(true); } };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node | null;
      if (t && !inside.some((r) => r.current?.contains(t))) closeRef.current(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onDown); };
  }, [open, inside]);
}

/** Phones and tablets: sticky section picker, filter toggle, back to top and the twelve-segment strip. */
export function MobileBar({ query, onQuery, active, onPick, onTop, showTop }: {
  query: string; onQuery: (q: string) => void; active: SectionDef; onPick: OnPick; onTop: () => void; showTop: boolean;
}) {
  const [open, setOpen] = useState(false);
  const panel = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [insideRefs] = useState<RefObject<HTMLElement | null>[]>(() => [panelRef, toggleRef]);
  const r = filterSections(query);
  /** Close the panel; `refocus` returns focus to the toggle, because the focused item inside unmounts. */
  const close = (refocus: boolean) => { setOpen(false); if (refocus) toggleRef.current?.focus({ preventScroll: true }); };
  const pickFromSelect = (id: string) => { setOpen(false); onPick(id); };
  const pickFromPanel = (id: string) => { close(true); onPick(id); };
  useDismiss(open, insideRefs, close);
  return (
    <div className="sticky top-[var(--header-h)] z-20 border-b border-line bg-[var(--header-glass)] px-4 py-2.5 backdrop-blur-md backdrop-saturate-150 sm:px-6 lg:hidden">
      <div className="flex items-center gap-2">
        <label className="relative flex min-w-0 flex-auto items-center">
          <span className="sr-only">Section</span>
          <select value={active.id} onChange={(e) => pickFromSelect(e.target.value)}
            className="h-11 min-w-0 flex-auto cursor-pointer appearance-none rounded-full border border-line-strong bg-surface pl-4 pr-10 text-sm font-medium text-ink">
            {SECTIONS.map((s) => <option key={s.id} value={s.id}>{s.num ? `${s.num}  ${s.title}` : s.title}</option>)}
          </select>
          <ChevronDown size={16} strokeWidth={ICON_STROKE} aria-hidden="true" className="pointer-events-none absolute right-3.5 text-ink-2" />
        </label>
        <button ref={toggleRef} type="button" aria-label="Filter sections" aria-expanded={open} aria-controls={panel} onClick={() => setOpen((o) => !o)}
          className={cx('grid size-11 flex-none cursor-pointer place-items-center rounded-full border bg-surface text-ink-2 transition-colors duration-[var(--dur-1)]', open ? 'border-accent text-accent' : 'border-line-strong')}>
          <Search size={16} strokeWidth={ICON_STROKE} aria-hidden="true" />
        </button>
        {showTop && <BackToTop onTop={onTop} compact />}
      </div>
      <GateStrip lit={active.gates} className="mt-2.5" />
      {open && (
        <div ref={panelRef} id={panel} className="pop-in absolute inset-x-4 top-full z-30 mt-1 flex max-h-[min(70dvh,520px)] flex-col gap-4 overflow-y-auto rounded-card border border-line bg-surface p-4 shadow-pop">
          <FilterInput query={query} onQuery={onQuery} autoFocus />
          <p aria-live="polite" className="sr-only">{filterStatus(r)}</p>
          {r.filtering && r.count === 0 ? <NoMatch query={query} onClear={() => onQuery('')} centred /> : <SectionList query={query} active={active} onPick={pickFromPanel} />}
        </div>
      )}
    </div>
  );
}
