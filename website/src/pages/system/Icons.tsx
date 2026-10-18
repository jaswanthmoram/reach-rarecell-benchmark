import { useMemo, useState } from 'react';
import { DATASETS_DATA } from '../../data/benchmarkData';
import { EmptyState, Icon, ICON_NAMES, asset, useToast } from '../../ui';
import { Sub, SysSection } from './kit';

export function Icons() {
  const [q, setQ] = useState('');
  const toast = useToast();
  const term = q.trim().toLowerCase();
  const icons = useMemo(() => ICON_NAMES.filter((n) => n.includes(term.replace(/\s+/g, '-'))), [term]);
  const cohorts = useMemo(() => DATASETS_DATA.filter((d) => !term || `${d.id} ${d.cancerType}`.toLowerCase().includes(term)), [term]);
  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast({ title: 'Copied', description: text, tone: 'ok' }))
      .catch(() => toast({ title: 'Copy failed', description: 'The browser blocked clipboard access.', tone: 'bad' }));
  };

  return (
    <SysSection id="icons" title="Icons"
      lead={`One UI family: Phosphor regular, ${ICON_NAMES.length} symbols in one sprite, 16 to 20px in ink-3 as quiet markers. Cohorts get their own organ-glyph family. Select any icon to copy its usage.`}>
      <div className="sticky top-14 z-20 -mx-1 bg-canvas/90 px-1 py-2 backdrop-blur-md">
        <label className="flex h-11 items-center gap-2.5 rounded-card border border-line bg-surface px-3 focus-within:border-accent">
          <Icon name="magnifying-glass" size={16} className="text-ink-3" />
          <span className="sr-only">Filter icons</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter icons and cohort glyphs, e.g. chart, lung" className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-3" />
          <span className="font-mono text-[11px] text-ink-3 tabular">{icons.length + cohorts.length} matches</span>
          {q && <button type="button" onClick={() => setQ('')} aria-label="Clear filter" className="grid size-7 place-items-center rounded-chip text-ink-3 hover:bg-sunk hover:text-ink"><Icon name="x" size={14} /></button>}
        </label>
      </div>

      <Sub title={`UI sprite · ${icons.length} of ${ICON_NAMES.length}`} note={<code className="font-mono">{'<Icon name="…" size={18} />'}</code>}>
        {icons.length ? (
          <ul className="grid grid-cols-5 overflow-hidden rounded-card border border-line bg-surface sm:grid-cols-5 lg:grid-cols-8">
            {icons.map((n) => (
              <li key={n} className="[box-shadow:1px_0_0_var(--line),0_1px_0_var(--line)]">
                <button type="button" onClick={() => copy(`<Icon name="${n}" />`)} title={`Copy <Icon name="${n}" />`} aria-label={`${n}: copy usage`}
                  className="group flex h-16 w-full flex-col items-center justify-center gap-2.5 px-1 sm:h-24 text-ink-2 transition-colors duration-150 hover:bg-sunk hover:text-ink focus-visible:bg-sunk">
                  <Icon name={n} size={22} className="transition-transform duration-150 group-hover:scale-110" />
                  <span className="hidden max-w-full truncate font-mono text-[11px] text-ink-3 group-hover:text-ink-2 sm:block">{n}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState compact title={`No UI icon matches “${q.trim()}”`}>
            The sprite holds {ICON_NAMES.length} Phosphor icons. Need one that is not here? Ask before adding a second family.
          </EmptyState>
        )}
      </Sub>

      <Sub title={`Cohort glyphs · ${cohorts.length} of ${DATASETS_DATA.length}`} note="Health Icons outline set, one per cohort, sprite icons-cohorts.svg">
        {cohorts.length ? (
          <ul className="grid overflow-hidden rounded-card border border-line bg-surface sm:grid-cols-2 lg:grid-cols-3">
            {cohorts.map((d) => (
              <li key={d.id} className="[box-shadow:1px_0_0_var(--line),0_1px_0_var(--line)]">
                <button type="button" onClick={() => copy(`<use href={asset('icons-cohorts.svg') + '#cohort-${d.id}'} />`)}
                  className="group flex h-full w-full items-center gap-3 px-4 py-4 text-left transition-colors duration-150 hover:bg-sunk">
                  <svg width="28" height="28" aria-hidden="true" className="shrink-0 text-ink-2 group-hover:text-ink"><use href={`${asset('icons-cohorts.svg')}#cohort-${d.id}`} /></svg>
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-[12px] text-ink">{d.id}</span>
                    <span className="block truncate text-xs text-ink-3">{d.cancerType}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : <EmptyState compact title="No cohort glyph matches" />}
      </Sub>
    </SysSection>
  );
}
