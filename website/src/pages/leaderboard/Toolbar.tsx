import { Icon, Tabs } from '../../ui';
import { GROUPS, TIERS, VIEWS, VIEW_OPTIONS, type Group, type Tier, type ViewId } from './model';

interface ToolbarProps {
  view: ViewId;
  onView: (v: ViewId) => void;
  tier: Tier;
  onTier: (t: Tier) => void;
  groups: Set<Group>;
  onToggleGroup: (g: Group) => void;
  query: string;
  onQuery: (q: string) => void;
}

interface TableFootProps {
  view: ViewId;
  tier: Tier;
  shown: number;
  total: number;
  onExport: () => void;
  onReset: () => void;
  canReset: boolean;
  canExport: boolean;
}

const scrollTabs = '-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 [&_[role=tablist]]:flex-nowrap [&_[role=tab]]:shrink-0 [&_[role=tab]]:whitespace-nowrap';
const textBtn = 'inline-flex h-10 items-center gap-1.5 rounded-chip px-2 text-xs font-medium text-ink-2 transition-colors duration-150 hover:bg-sunk hover:text-ink active:translate-y-px disabled:pointer-events-none disabled:text-ink-3 disabled:opacity-60';

function GroupChips({ groups, onToggleGroup }: Pick<ToolbarProps, 'groups' | 'onToggleGroup'>) {
  return (
    <fieldset className="flex items-center gap-1.5">
      <legend className="sr-only">Show rows</legend>
      {GROUPS.map((g) => {
        const on = groups.has(g.value);
        return (
          <button
            key={g.value}
            type="button"
            aria-pressed={on}
            onClick={() => onToggleGroup(g.value)}
            className={`inline-flex h-10 items-center gap-2 rounded-chip border px-3 text-xs font-medium transition-colors duration-150 active:translate-y-px ${on ? 'border-line-strong bg-surface text-ink hover:border-ink/40' : 'border-dashed border-line bg-transparent text-ink-3 hover:text-ink-2'}`}
          >
            <span aria-hidden="true" className={`grid size-3.5 place-items-center rounded-chip border ${on ? 'border-ink bg-ink text-canvas' : 'border-line-strong'}`}>
              {on && <Icon name="check" size={10} />}
            </span>
            {g.label}<span className="sr-only"> {g.noun}</span>
            <span className="font-mono text-[11px] text-ink-3">{g.count}</span>
          </button>
        );
      })}
    </fieldset>
  );
}

/** One row at xl: metric tabs, row-group chips, search. The metric note and actions sit under the table. */
export function Toolbar(p: ToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-line pb-2">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between xl:gap-6">
        <div className={scrollTabs}>
          <Tabs label="Leaderboard metric" value={p.view} onChange={p.onView} options={VIEW_OPTIONS} />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:shrink-0">
          <GroupChips groups={p.groups} onToggleGroup={p.onToggleGroup} />
          <label className="relative flex h-10 w-full items-center sm:w-56">
            <span className="sr-only">Search methods</span>
            <Icon name="magnifying-glass" size={16} className="pointer-events-none absolute left-3 text-ink-3" />
            <input
              type="search"
              value={p.query}
              onChange={(e) => p.onQuery(e.target.value)}
              placeholder="Search methods"
              className="h-10 w-full rounded-chip border border-line-strong bg-surface pl-9 pr-3 text-base text-ink placeholder:text-ink-3 transition-colors duration-150 hover:border-ink/30 focus:border-accent focus:outline-none sm:text-sm"
            />
          </label>
        </div>
      </div>

      {p.view === 'tier' && (
        <div className={scrollTabs}>
          <Tabs label="Prevalence tier" value={p.tier} onChange={p.onTier} options={TIERS.map((t) => ({ value: t.value, label: t.label }))} />
        </div>
      )}
    </div>
  );
}

/** Under the table: what the view measures (metric · population · n), the row count, and the two text actions. */
export function TableFoot(p: TableFootProps) {
  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
      <div className="min-w-0 font-mono text-xs leading-relaxed text-ink-2" aria-live="polite">
        <p>
          {VIEWS[p.view].note(p.tier).split(' · ').map((part, i) => (
            <span key={part} className={i === 0 ? 'text-ink' : undefined}>{i > 0 && <span className="text-ink-3"> · </span>}{part}</span>
          ))}
        </p>
        <p className="text-ink-3">{p.shown} of {p.total} methods shown · ordered within each group</p>
      </div>
      <div className="-ml-2 flex shrink-0 items-center gap-1 sm:-mr-2 sm:ml-0">
        <button type="button" onClick={p.onExport} disabled={!p.canExport} className={textBtn}>
          <Icon name="download-simple" size={14} />Export CSV
        </button>
        <button type="button" onClick={p.onReset} disabled={!p.canReset} className={textBtn}>Reset</button>
      </div>
    </div>
  );
}
