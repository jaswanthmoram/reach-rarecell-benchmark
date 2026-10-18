// Docs section filter. Narrows the sidebar (and the mobile jump panel) to sections and steps whose title or
// keywords contain every typed word. Site-wide search stays in the global palette ("/" or Cmd/Ctrl+K).
import { useId, type ReactNode, type RefObject } from 'react';
import { EmptyState, Icon } from '../../ui';
import { openCommandPalette } from '../../app/theme';
import { entryNumber, goToSection, isNumbered, pad2, type EntryId } from './nav';
import { useDocsFilter, words } from './useDocsFilter';

/** Bold the first occurrence of each typed word in a title. */
function Highlight({ text, query }: { text: string; query: string }) {
  const ws = words(query).filter((w) => w.length > 1);
  if (ws.length === 0) return <>{text}</>;
  const lower = text.toLowerCase();
  const spans: [number, number][] = [];
  ws.forEach((w) => { const i = lower.indexOf(w); if (i >= 0) spans.push([i, i + w.length]); });
  if (spans.length === 0) return <>{text}</>;
  spans.sort((a, b) => a[0] - b[0]);
  const out: ReactNode[] = [];
  let at = 0;
  spans.forEach(([s, e], k) => {
    if (s < at) return;
    out.push(text.slice(at, s), <mark key={k} className="rounded-[2px] bg-accent-tint text-ink">{text.slice(s, e)}</mark>);
    at = e;
  });
  out.push(text.slice(at));
  return <>{out}</>;
}

export function FilterInput({ value, onChange, inputRef, onEscapeEmpty }: {
  value: string; onChange: (v: string) => void; inputRef?: RefObject<HTMLInputElement | null>; onEscapeEmpty?: () => void;
}) {
  const hintId = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label className="relative block">
        <span className="sr-only">Filter docs sections</span>
        <Icon name="funnel-simple" size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
        <input ref={inputRef} type="search" value={value} onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Escape') return;
            if (value) { e.preventDefault(); e.stopPropagation(); onChange(''); } else onEscapeEmpty?.();
          }}
          placeholder="Filter sections" spellCheck={false} autoComplete="off" aria-describedby={hintId}
          className="h-11 w-full rounded-chip border border-line bg-surface pl-9 pr-10 text-sm text-ink transition-colors duration-150 placeholder:text-ink-3 hover:border-line-strong focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 [&::-webkit-search-cancel-button]:hidden" />
        {value && (
          <button type="button" onClick={() => { onChange(''); inputRef?.current?.focus(); }} aria-label="Clear filter"
            className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-chip text-ink-3 transition-colors duration-150 hover:bg-sunk hover:text-ink">
            <Icon name="x" size={14} />
          </button>
        )}
      </label>
      <p id={hintId} className="px-1 text-[11px] leading-snug text-ink-2 [@media(hover:none)]:hidden">
        Press <kbd className="rounded-[3px] border border-line bg-sunk px-1 font-mono text-[11px] text-ink-2">/</kbd> to search the whole site
      </p>
    </div>
  );
}

function SiteSearchButton({ query }: { query: string }) {
  return (
    <button type="button" onClick={() => openCommandPalette(query.trim())}
      className="inline-flex h-9 items-center gap-2 rounded-chip border border-line-strong bg-surface px-3 text-xs font-medium text-ink transition-colors duration-150 hover:bg-sunk active:translate-y-px">
      <Icon name="magnifying-glass" size={14} />
      Search the whole site
    </button>
  );
}

/**
 * The filtered list. Entry rows keep the sidebar's numbered look; matched steps hang under them.
 * `onPick` runs after the jump (the mobile panel closes itself).
 */
export function FilterResults({ query, setQuery, active, onPick }: { query: string; setQuery: (v: string) => void; active: EntryId; onPick?: () => void }) {
  const { groups, count, active: filtering } = useDocsFilter(query);
  const pick = (id: string) => { goToSection(id); onPick?.(); };
  return (
    <div className="flex flex-col">
      <p aria-live="polite" className="sr-only">{filtering ? (count === 0 ? 'No section matches' : `${count} ${count === 1 ? 'match' : 'matches'}`) : ''}</p>
      {filtering && count === 0 && (
        <EmptyState compact icon="funnel-simple" title="No section matches" className="mt-1"
          action={<>
            <button type="button" onClick={() => setQuery('')}
              className="inline-flex h-9 items-center rounded-chip px-3 text-xs font-medium text-ink-2 transition-colors duration-150 hover:bg-sunk hover:text-ink">Clear filter</button>
            <SiteSearchButton query={query} />
          </>}>
          <span className="[overflow-wrap:anywhere]">Nothing in the docs titles matches “{query.trim()}”. Try a tool such as snakemake, zenodo or pytest.</span>
        </EmptyState>
      )}
      {groups.map((g) => (
        <div key={g.label} className="mb-5 last:mb-0">
          <p className="label mb-2 px-3">{g.label}</p>
          <ul className="flex flex-col gap-0.5">
            {g.items.map(({ entry, subs }) => {
              const on = entry.id === active;
              return (
                <li key={entry.id}>
                  <button type="button" onClick={() => pick(entry.id)} aria-current={on ? 'location' : undefined}
                    className={`group relative flex min-h-11 w-full items-center gap-3 rounded-chip px-3 text-left text-sm transition-colors duration-150 ${
                      on ? 'bg-sunk font-medium text-ink' : 'text-ink-2 hover:bg-sunk/60 hover:text-ink'}`}>
                    <span aria-hidden="true" className={`flex w-5 shrink-0 font-mono text-[11px] tabular-nums transition-colors duration-150 ${on ? 'text-accent' : 'text-ink-3 group-hover:text-ink-2'}`}>
                      {isNumbered(entry.id) ? pad2(entryNumber(entry.id)) : <Icon name={entry.icon} size={14} />}
                    </span>
                    <span className="min-w-0"><Highlight text={entry.title} query={query} /></span>
                  </button>
                  {subs.length > 0 && (
                    <ul className="mb-1 ml-[1.375rem] flex flex-col border-l border-line pl-3">
                      {subs.map((s) => (
                        <li key={s.id}>
                          <button type="button" onClick={() => pick(s.id)}
                            className="flex min-h-11 w-full items-center rounded-chip px-2 text-left text-[13px] text-ink-2 transition-colors duration-150 hover:bg-sunk/60 hover:text-ink">
                            <span className="min-w-0"><Highlight text={s.title} query={query} /></span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {filtering && count > 0 && (
        <div className="mt-4 border-t border-line pt-4"><SiteSearchButton query={query} /></div>
      )}
    </div>
  );
}
