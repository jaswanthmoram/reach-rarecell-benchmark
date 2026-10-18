// Three-zone docs shell: numbered, filterable sidebar (>=1024px), jump menu with the same filter (<1024px),
// "On this page" step rail (>=1280px). All items are buttons that go through the router (goToSection).
import { useEffect, useId, useRef, useState } from 'react';
import { Icon } from '../../ui';
import { FilterInput, FilterResults } from './filter';
import { GateStrip } from './GateBand';
import { ENTRIES, GROUPS, entryNumber, isNumbered, pad2, goToSection, type Entry, type EntryId } from './nav';
import { SECTION_PHASES } from './phases';

/** The pipeline phases the section in view touches, as a twelve-segment strip with a one-line reading. */
function PhaseReading({ active, className = '' }: { active: EntryId; className?: string }) {
  const { gates, note } = SECTION_PHASES[active];
  return (
    <div className={className}>
      <GateStrip gates={gates} />
      <p className="mt-1.5 text-[11px] leading-snug text-ink-2">{note}</p>
    </div>
  );
}

export function Sidebar({ active }: { active: EntryId }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <nav aria-label="Docs sections" className="sticky top-20 hidden max-h-[calc(100dvh-6rem)] overflow-y-auto pb-10 lg:block">
      <div className="sticky top-0 z-10 mb-5 bg-canvas pb-1">
        <FilterInput value={query} onChange={setQuery} inputRef={inputRef} onEscapeEmpty={() => inputRef.current?.blur()} />
        <PhaseReading active={active} className="mt-3 px-1" />
      </div>
      <FilterResults query={query} setQuery={setQuery} active={active} />
    </nav>
  );
}

/**
 * Below 1024px: a sticky native select (works with every screen reader and phone picker) plus a filter
 * button that opens the same section filter the desktop sidebar has.
 */
export function MobileJump({ active }: { active: EntryId }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const panelId = useId();
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  const close = () => { setOpen(false); setQuery(''); };
  return (
    <div className="sticky top-14 z-30 -mx-4 border-b border-line bg-canvas/90 px-4 py-2.5 backdrop-blur-md sm:-mx-6 sm:px-6 lg:hidden">
      <div className="flex items-center gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-3">
          <span className="label shrink-0">Section</span>
          <span className="relative min-w-0 flex-1">
            <select
              value={active}
              onChange={(e) => goToSection(e.target.value)}
              className="h-11 w-full appearance-none rounded-chip border border-line-strong bg-surface pl-3 pr-9 text-sm text-ink transition-colors duration-150 hover:border-ink/40"
            >
              {GROUPS.map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.items.map((item) => <option key={item.id} value={item.id}>{isNumbered(item.id) ? `${pad2(entryNumber(item.id))}  ` : ''}{item.title}</option>)}
                </optgroup>
              ))}
            </select>
            <Icon name="caret-up-down" size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-2" />
          </span>
        </label>
        <button type="button" onClick={() => (open ? close() : setOpen(true))} aria-expanded={open} aria-controls={panelId}
          aria-label={open ? 'Close the section filter' : 'Filter docs sections'}
          className={`grid size-11 shrink-0 place-items-center rounded-chip border transition-colors duration-150 active:translate-y-px ${
            open ? 'border-ink bg-ink text-canvas' : 'border-line-strong bg-surface text-ink-2 hover:text-ink'}`}>
          <Icon name={open ? 'x' : 'funnel-simple'} size={16} />
        </button>
      </div>
      <GateStrip gates={SECTION_PHASES[active].gates} className="mt-2.5" />
      {open && (
        <div id={panelId} className="pop-in mt-2.5 flex max-h-[min(64dvh,520px)] flex-col gap-4 overflow-y-auto overscroll-contain rounded-card border border-line bg-surface p-3 shadow-pop">
          <FilterInput value={query} onChange={setQuery} inputRef={inputRef} onEscapeEmpty={close} />
          <FilterResults query={query} setQuery={setQuery} active={active} onPick={close} />
        </div>
      )}
    </div>
  );
}

/** Appwrite-style step list: numbered circles on one hairline; done, current, upcoming read at a glance. */
export function Rail({ entry, activeSub }: { entry: Entry; activeSub: string }) {
  const at = Math.max(0, entry.subs.findIndex((s) => s.id === activeSub));
  const idx = ENTRIES.findIndex((e) => e.id === entry.id);
  const next = ENTRIES[idx + 1];
  const numbered = isNumbered(entry.id);
  return (
    <nav aria-label="On this page" className="sticky top-20 hidden max-h-[calc(100dvh-6rem)] overflow-y-auto pb-10 xl:block">
      <p className="label mb-3">On this page</p>
      <p className="mb-4 flex items-baseline gap-2 text-xs font-medium text-ink">
        {isNumbered(entry.id) && <span className="font-mono text-[11px] text-accent tabular-nums">{pad2(idx + 1)}</span>}
        {entry.title}
      </p>
      <ol className="relative flex flex-col">
        <span aria-hidden="true" className="absolute bottom-[22px] left-[9.5px] top-[22px] w-px bg-line" />
        {entry.subs.map((s, i) => {
          const on = i === at;
          const done = numbered && i < at;
          const dot = on
            ? 'border-accent bg-accent text-canvas'
            : done ? 'border-line-strong bg-surface text-ink-2' : 'border-line bg-canvas text-ink-3';
          return (
            <li key={s.id} className="relative">
              <button type="button" onClick={() => goToSection(s.id)} aria-current={on ? 'step' : undefined}
                className={`group flex min-h-11 w-full items-center gap-3 text-left text-xs leading-snug transition-colors duration-150 ${on ? 'font-medium text-ink' : 'text-ink-2 hover:text-ink'}`}>
                <span aria-hidden="true" className={`relative z-10 flex size-5 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] tabular-nums transition-colors duration-150 group-hover:border-line-strong ${dot}`}>
                  {done ? <Icon name="check" size={10} /> : numbered ? i + 1 : <span className="size-1.5 rounded-full bg-current" />}
                </span>
                <span className="min-w-0">{s.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
      {next && (
        <button type="button" onClick={() => goToSection(next.id)}
          className="group mt-6 flex min-h-11 w-full items-center justify-between gap-2 rounded-chip border border-line bg-surface px-3 text-left text-xs text-ink-2 transition-colors duration-150 hover:border-line-strong hover:text-ink">
          <span className="flex min-w-0 flex-col py-2">
            <span className="label">Next</span>
            <span className="truncate font-medium text-ink">{next.title}</span>
          </span>
          <Icon name="arrow-right" size={14} className="shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" />
        </button>
      )}
    </nav>
  );
}
