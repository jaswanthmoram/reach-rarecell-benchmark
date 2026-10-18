import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { EmptyState, Icon, asset, useToast } from '../ui';
import { COMMANDS, GROUP_ORDER, score, type Command } from './commands';
import { MOD_KEY } from './theme';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
const MAX_PER_GROUP = 6;

function Kbd({ children }: { children: string }) {
  return <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-chip border border-line bg-sunk px-1 font-mono text-[10px] text-ink-3">{children}</kbd>;
}

function useResults(query: string) {
  return useMemo(() => {
    const scored = COMMANDS.map((c) => ({ c, s: score(c, query) })).filter((x) => x.s > 0);
    const empty = !query.trim();
    return GROUP_ORDER.map((g) => {
      const items = scored.filter((x) => x.c.group === g).sort((a, b) => b.s - a.s).map((x) => x.c);
      // Empty query: show the site map and actions, keep the long lists for search.
      if (empty && g !== 'Pages' && g !== 'Actions') return { group: g, items: [] as Command[] };
      return { group: g, items: items.slice(0, empty ? items.length : MAX_PER_GROUP) };
    }).filter((x) => x.items.length > 0);
  }, [query]);
}

/**
 * ⌘K / Ctrl+K / "/" palette. ARIA combobox (input) + listbox (results), keyboard first:
 * ↑↓ move, Home/End jump, Enter runs, Esc closes. Focus returns to whatever opened it.
 */
export function CommandPalette({ open, initialQuery = '', onClose }: { open: boolean; initialQuery?: string; onClose: () => void }) {
  if (!open) return null;
  return <PaletteDialog initialQuery={initialQuery} onClose={onClose} />;
}

function PaletteDialog({ initialQuery, onClose }: { initialQuery: string; onClose: () => void }) {
  const [query, setQuery] = useState(initialQuery);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const toast = useToast();
  const groups = useResults(query);
  const flat = groups.flatMap((g) => g.items);
  const current = flat[Math.min(active, flat.length - 1)];
  const optId = (c: Command) => `${listId}-${c.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; opener?.focus?.(); };
  }, []);

  useEffect(() => {
    if (!current) return;
    document.getElementById(optId(current))?.scrollIntoView({ block: 'nearest' });
  });

  const run = (c: Command) => {
    onClose();
    c.run({
      copy: (text, what) => {
        navigator.clipboard.writeText(text)
          .then(() => toast({ title: `${what} copied`, tone: 'ok' }))
          .catch(() => toast({ title: 'Copy failed', description: 'The browser blocked clipboard access.', tone: 'bad' }));
      },
    });
  };

  const onKey = (e: React.KeyboardEvent) => {
    const n = flat.length;
    if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
    if (e.key === 'Tab') { e.preventDefault(); return; } // focus stays in the dialog
    if (!n) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i + 1) % n); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i - 1 + n) % n); }
    else if (e.key === 'Home' && e.ctrlKey) { e.preventDefault(); setActive(0); }
    else if (e.key === 'End' && e.ctrlKey) { e.preventDefault(); setActive(n - 1); }
    else if (e.key === 'Enter' && current) { e.preventDefault(); run(current); }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center px-3 pt-3 sm:px-6 sm:pt-[12vh]" onKeyDown={onKey}>
      <div className="fade-in absolute inset-0 bg-ink/25 dark:bg-black/60" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label="Search the site"
        className="pop-in relative flex max-h-[min(78dvh,560px)] w-full max-w-[640px] flex-col overflow-hidden rounded-card border border-line-strong bg-surface shadow-pop">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Icon name="magnifying-glass" size={18} className="shrink-0 text-ink-3" />
          <input ref={inputRef} value={query} onChange={(e) => { setQuery(e.target.value); setActive(0); }}
            role="combobox" aria-expanded="true" aria-controls={listId} aria-autocomplete="list"
            aria-activedescendant={current ? optId(current) : undefined} aria-label="Search pages, methods, cohorts, tracks and docs"
            placeholder="Search pages, methods, cohorts…" spellCheck={false} autoComplete="off"
            className="h-14 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-3" />
          <button type="button" onClick={onClose} className="shrink-0 rounded-chip p-1 text-ink-3 hover:text-ink" aria-label="Close search">
            <span className="hidden sm:inline"><Kbd>esc</Kbd></span><Icon name="x" size={18} className="sm:hidden" />
          </button>
        </div>

        <div ref={listRef} id={listId} role="listbox" aria-label="Results" className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
          {groups.length === 0 && (
            <EmptyState compact title={`No match for “${query.trim()}”`} className="m-2 border-0">
              Try a method (FiRE, scCAD), a cohort id (luad_laughney), a track letter or a docs topic such as install.
            </EmptyState>
          )}
          {groups.map((g) => (
            <div key={g.group} role="group" aria-labelledby={`${listId}-${g.group}`} className="mb-1 last:mb-0">
              <p id={`${listId}-${g.group}`} className="label px-2.5 pb-1.5 pt-2.5">{g.group}</p>
              {g.items.map((c) => {
                const isActive = c === current;
                return (
                  <div key={c.id} id={optId(c)} role="option" aria-selected={isActive}
                    onPointerMove={() => { const i = flat.indexOf(c); if (i !== active) setActive(i); }}
                    onClick={() => run(c)}
                    className={cx('flex cursor-pointer items-center gap-3 rounded-chip px-2.5 py-2', isActive ? 'bg-sunk' : '')}>
                    <span className={cx('grid size-8 shrink-0 place-items-center rounded-chip border bg-surface transition-colors duration-150', isActive ? 'border-line-strong text-ink' : 'border-line text-ink-3')}>
                      {c.cohort
                        ? <svg width="18" height="18" aria-hidden="true"><use href={`${asset('icons-cohorts.svg')}#cohort-${c.cohort}`} /></svg>
                        : c.icon && <Icon name={c.icon} size={16} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cx('block truncate text-sm', c.group === 'Methods' || c.group === 'Cohorts' ? 'font-mono text-[13px]' : '', 'text-ink')}>{c.label}</span>
                      <span className="block truncate text-xs text-ink-3">{c.desc}</span>
                    </span>
                    {c.meta && <span className="hidden shrink-0 font-mono text-[11px] text-ink-3 sm:inline">{c.meta}</span>}
                    <Icon name="arrow-right" size={14} className={cx('shrink-0 text-ink-3 transition-opacity duration-150', isActive ? 'opacity-100' : 'opacity-0')} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="hidden items-center gap-4 border-t border-line px-4 py-2.5 text-[11px] text-ink-3 sm:flex">
          <span className="flex items-center gap-1.5"><Kbd>↑</Kbd><Kbd>↓</Kbd> move</span>
          <span className="flex items-center gap-1.5"><Kbd>↵</Kbd> open</span>
          <span className="flex items-center gap-1.5"><Kbd>esc</Kbd> close</span>
          <span className="ml-auto flex items-center gap-1.5"><Kbd>{MOD_KEY}</Kbd><Kbd>K</Kbd> anywhere</span>
        </div>
      </div>
    </div>
  );
}
