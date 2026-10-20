import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { LEADERBOARD_DATA, type TrackInfo } from '../../data/benchmarkData';
import { href } from '../../app/router';
import { Badge, Button, CopyButton, Icon, MethodName, TrackChip, fmt, type IconName } from '../../ui';
import { Dumbbells, GroupedDotRows, NoiseRows, SlopeChart, Gk } from './charts';
import { FINDING, HEADLINE, LETTERS, METRICS, READING, SHORT, TOP, TRACKS, isRef, letterOf, nb, type Metric } from './model';

/* ---------- Selector: six segmented tabs above a full-width panel (3x2 on phones, one row from md) ---------- */
export function TrackSelector({ active, onSelect }: { active: string; onSelect: (l: string) => void }) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const go = (l: string) => { onSelect(l); refs.current[l]?.focus(); };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = LETTERS.indexOf(active);
    const step: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    if (e.key in step) { e.preventDefault(); go(LETTERS[(i + step[e.key] + LETTERS.length) % LETTERS.length]); }
    if (e.key === 'Home') { e.preventDefault(); go(LETTERS[0]); }
    if (e.key === 'End') { e.preventDefault(); go(LETTERS[LETTERS.length - 1]); }
  };
  return (
    <div role="tablist" aria-label="Evaluation tracks" aria-orientation="horizontal" onKeyDown={onKey}
      className="grid grid-cols-3 gap-1.5 md:grid-cols-6 md:gap-2">
      {TRACKS.map((t) => {
        const l = letterOf(t);
        const on = l === active;
        return (
          <button key={t.id} ref={(el) => { refs.current[l] = el; }} id={`tab-${l}`} role="tab" type="button"
            aria-selected={on} aria-controls={`panel-${l}`} tabIndex={on ? 0 : -1} onClick={() => onSelect(l)}
            className={[
              'group relative flex min-h-12 items-center gap-2.5 overflow-hidden rounded-card border px-2.5 py-2 text-left transition-[background,border-color] duration-150',
              'lg:min-h-[76px] lg:flex-col lg:items-start lg:gap-2 lg:px-4 lg:py-3',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              on ? 'border-accent/40 bg-accent-tint' : 'border-line bg-surface hover:border-line-strong',
            ].join(' ')}>
            <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-0.5 origin-left bg-accent transition-transform duration-200 ${on ? 'scale-x-100' : 'scale-x-0'}`} />
            <span className="flex items-center gap-2.5">
              <TrackChip letter={l} className={on ? 'border-accent text-accent' : 'group-hover:border-ink/40'} />
              <span className={`block truncate text-[13px] font-medium lg:hidden ${on ? 'text-ink' : 'text-ink-2'}`}>{SHORT[l]}</span>
              <span className="hidden font-mono text-[11px] text-ink-3 tabular lg:inline">{fmt.int(t.units)} units</span>
            </span>
            <span className="hidden min-w-0 lg:block">
              <span className={`block text-[13px] font-medium leading-snug ${on ? 'text-ink' : 'text-ink-2 group-hover:text-ink'}`}>{nb(t.name)}</span>
              <span className={`mt-1 block font-mono text-[11px] tabular ${on ? 'text-ink' : 'text-ink-2'}`}>{HEADLINE[l]}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Panel pieces ---------- */
function StatRow({ t, metrics }: { t: TrackInfo; metrics: Metric[] }) {
  const cells: Metric[] = [{ label: 'Units', value: fmt.int(t.units), sub: 'per method' }, ...metrics];
  return (
    <dl className="grid grid-cols-2 border-t border-line md:grid-cols-[minmax(0,0.7fr)_repeat(3,minmax(0,1fr))]">
      {cells.map((c, i) => (
        <div key={c.label} className={[
          'flex min-w-0 flex-col gap-1 py-4',
          i % 2 === 1 ? 'border-l border-line pl-4' : 'pr-4',
          i >= 2 ? 'border-t border-line md:border-t-0' : '',
          'md:px-4 md:first:pl-0',
          i > 0 ? 'md:border-l md:border-line' : '',
        ].join(' ')}>
          {/* Two-line label slot on phones so values in a row share a baseline. */}
          <dt className="label min-h-[2lh] md:min-h-0"><Gk text={c.label} /></dt>
          <dd className="text-base font-semibold tracking-[-0.01em] text-ink tabular md:text-lg">{c.value.replace(/ – /g, '–')}</dd>
          <dd className="text-xs leading-snug text-ink-2">{c.sub}</dd>
        </div>
      ))}
    </dl>
  );
}

interface Visual { icon: IconName; title: string; caption: string; legend?: ReactNode; body: ReactNode }

function visualFor(l: string): Visual {
  switch (l) {
    case 'A': return {
      icon: 'chart-scatter', title: 'Median AP per method, Track A',
      caption: 'Median AP over fallback-filtered Track A units (160, or 140 for scCAD and DeepScena). Dashed lines mark reference methods. The axis stops at 0.6, so the ceiling (1.000) is pinned at its right edge.',
      body: <GroupedDotRows label="Track A median AP per method" value={(m) => m.medianAP} text={(m) => fmt.ap(m.medianAP)} domain={[0, 0.6]} />,
    };
    case 'B': return {
      icon: 'flow-arrow', title: 'Within-unit rank, all 10 methods (Figure 4b, Table 1b)',
      caption: 'Mean within-unit rank (1 = best), Track A real spike-ins against Track B Splatter units. The repository records no Track B AP per method, so ranks are the published view. Hover a line to isolate it.',
      body: <SlopeChart />,
    };
    case 'C': return {
      icon: 'chart-bar', title: 'Mean false-positive rate on null units',
      caption: 'Mean FPR over 160 background-only units (Table 8). Lower is better. Rows keep the Track A leaderboard order, since Track C ranks nothing.',
      body: <GroupedDotRows label="Track C mean false-positive rate per method" value={(m) => m.nullFPRate} text={(m) => m.nullFPRate.toFixed(4)} />,
    };
    case 'D': return {
      icon: 'chart-scatter', title: 'Mean AP on natural blood and CTC units',
      caption: 'Mean AP over 30 natural-prevalence units (mm_ledergor, breast_ctc_szczerba), from sens4_track_d_natural.csv. The paper prints no Track D numbers.',
      body: <GroupedDotRows label="Track D mean AP per method" value={(m) => m.trackDAP} text={(m) => fmt.ap(m.trackDAP)} />,
    };
    case 'E': return {
      icon: 'sliders-horizontal', title: 'hvg_logreg under label noise',
      caption: 'Mean AP of the supervised ceiling over Track A units under each label condition (640 units in total). RI is the robustness index, noisy AP divided by clean AP.',
      body: <NoiseRows />,
    };
    default: return {
      icon: 'chart-line-up', title: 'Track A median AP vs Track F median AP at 0.1%',
      caption: 'Hollow: Track A median AP. Filled: Track F median AP at 0.1% prevalence on crc_lee (Table 5, 5 replicates per tier).',
      legend: (
        <span className="flex items-center gap-4 font-mono text-[11px] text-ink-3">
          <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full border-[1.5px] border-ink-2 bg-surface" />Track A</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-ink-2" />Track F, 0.1%</span>
        </span>
      ),
      body: <Dumbbells label="Track A median AP versus Track F median AP at 0.1% prevalence, per method" />,
    };
  }
}

function TopPerformers({ l }: { l: string }) {
  const top = TOP[l];
  if (!top) return null;
  const find = (id: string) => LEADERBOARD_DATA.find((m) => m.id === id);
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-4">
      <span className="label shrink-0 sm:w-40">{top.label}</span>
      <div className="min-w-0">
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {top.items.map((p) => { const m = find(p.id); return (
            <li key={p.id} className="inline-flex items-baseline gap-2">
              <MethodName id={p.id} name={m?.method ?? p.id} reference={m ? isRef(m) : false} />
              <span className="font-mono text-[13px] font-semibold text-ink tabular">{p.value}</span>
              <span className="text-xs text-ink-3">{p.note}</span>
            </li>
          ); })}
        </ul>
        {top.note && <p className="mt-1.5 text-xs leading-snug text-ink-2">{top.note}</p>}
      </div>
    </div>
  );
}

const trackLink = (l: string) => `${window.location.origin}${window.location.pathname}${href('/tracks', `track=${l.toLowerCase()}`)}`;

/* ---------- Panel ---------- */
export function TrackPanel({ t }: { t: TrackInfo }) {
  const l = letterOf(t);
  const v = visualFor(l);
  const metrics = METRICS[l] ?? t.metricsSummary;
  return (
    <article id={`panel-${l}`} role="tabpanel" aria-labelledby={`tab-${l}`} tabIndex={0}
      className="min-w-0 rounded-card border border-line bg-surface [animation:rise_240ms_cubic-bezier(.16,1,.3,1)_both]">
      <header className="flex flex-col gap-3 px-5 pt-5 md:px-7 md:pt-7">
        <div className="flex flex-wrap items-center gap-2">
          <TrackChip letter={l} className="size-7 border-ink text-sm" />
          <Badge tone={l === 'A' ? 'accent' : 'neutral'}>{READING[l]}</Badge>
          <span className="ml-auto"><CopyButton text={trackLink(l)} label="Copy link" /></span>
        </div>
        <h3 className="text-2xl font-semibold tracking-[-0.02em] text-ink md:text-[1.75rem]">{t.code}: {nb(t.name)}</h3>
        <p className="max-w-[72ch] text-sm leading-relaxed text-ink-2">{t.subtitle}</p>
      </header>

      <p className="mx-5 mt-4 max-w-[72ch] text-base leading-relaxed text-ink md:mx-7">
        {FINDING[l]}
        {l === 'A' && (
          <>{' '}<a href={href('/leaderboard')} className="whitespace-nowrap text-accent underline decoration-accent/30 underline-offset-2 transition-colors hover:decoration-accent">See pairwise tests</a></>
        )}
      </p>

      {TOP[l] && <div className="mx-5 mt-6 md:mx-7"><TopPerformers l={l} /></div>}

      <figure className="mx-5 mt-6 md:mx-7">
        <figcaption className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-sm font-medium text-ink"><Icon name={v.icon} size={16} className="text-ink-3" />{v.title}</span>
          {v.legend}
        </figcaption>
        <div className="-mx-1.5 overflow-x-auto px-1.5">{v.body}</div>
        <p className="mt-3 max-w-[78ch] text-xs leading-relaxed text-ink-2">{v.caption}</p>
      </figure>

      {/* Supporting numbers follow the chart: the chart is the panel's one dominant element. */}
      <div className="mx-5 mt-6 md:mx-7"><StatRow t={t} metrics={metrics} /></div>

      <dl className="mt-6 grid gap-x-8 gap-y-5 border-t border-line bg-sunk/40 px-5 py-5 md:grid-cols-2 md:px-7">
        <div><dt className="label mb-1.5">Objective</dt><dd className="text-sm leading-relaxed text-ink-2">{t.objective}</dd></div>
        <div><dt className="label mb-1.5">Construction</dt><dd className="text-sm leading-relaxed text-ink-2">{t.methodology}</dd></div>
      </dl>

      {l === 'F' && (
        <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-4 md:px-7">
          <Button size="sm" variant="secondary" href={href('/methods')} iconRight="arrow-right">Read the method notes</Button>
          <span className="text-xs text-ink-2">Track F is kept out of the leaderboard.</span>
        </div>
      )}
    </article>
  );
}
