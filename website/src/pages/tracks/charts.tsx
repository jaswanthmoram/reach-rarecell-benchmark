import { Fragment, type ReactNode } from 'react';
import { LEADERBOARD_DATA, TRACK_E_NOISE_CONDITIONS, type MethodResult } from '../../data/benchmarkData';
import { CIBar, MethodName, fmt, methodColor } from '../../ui';
import { byRefOrder, isCeiling, isRef, roleShort } from './model';

/** Wrap Greek runs so uppercase `.label` text keeps ρ, χ, δ lower-case. */
export function Gk({ text }: { text: string }): ReactNode {
  return text.split(/([Ͱ-Ͽ]+)/).map((part, i) =>
    /[Ͱ-Ͽ]/.test(part) ? <span key={i} className="normal-case">{part}</span> : <Fragment key={i}>{part}</Fragment>);
}

const pct = (v: number, [lo, hi]: [number, number]) => Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100));
type Domain = [number, number];
const UNIT: Domain = [0, 1];
const ticksFor = (d: Domain) => (d[1] === 1 ? [0, 0.25, 0.5, 0.75, 1] : [0, 0.2, 0.4, 0.6].filter((t) => t <= d[1]));

/*
 * Row layout. Phones: [rank][name][value] on line 1, the mark spans line 2.
 * sm and up: one 32px line, [rank][name][mark][value], marks on a shared axis.
 */
const ROW = {
  /** Wide key column so references carry their role ("ceiling", "exploratory", ...). */
  group: 'grid grid-cols-[1.75rem_minmax(0,1fr)_auto] gap-x-2 gap-y-1 sm:grid-cols-[5.25rem_minmax(0,11rem)_minmax(0,1fr)_4.5rem] sm:gap-x-3',
  /** Track F: role key column plus a wider value column for "A → F". */
  groupWide: 'grid grid-cols-[1.75rem_minmax(0,1fr)_auto] gap-x-2 gap-y-1 sm:grid-cols-[5.25rem_minmax(0,11rem)_minmax(0,1fr)_7.5rem] sm:gap-x-3',
};
const MARK = 'col-span-2 col-start-2 row-start-2 sm:col-span-1 sm:col-start-3 sm:row-start-1';
const VALUE = 'col-start-3 row-start-1 sm:col-start-4';
const LINE = 'relative items-center rounded-chip py-1.5 transition-colors duration-150 hover:bg-sunk/70 sm:h-8 sm:py-0';

function Axis({ row, domain }: { row: string; domain: Domain }) {
  return (
    <div className={`${row} mt-1 hidden sm:grid`} aria-hidden="true">
      <span /><span />
      <div className="relative h-4">
        {ticksFor(domain).map((t) => (
          <span key={t} className="absolute top-0 -translate-x-1/2 font-mono text-[11px] text-ink-3 tabular" style={{ left: `${pct(t, domain)}%` }}>{t}</span>
        ))}
      </div>
      <span />
    </div>
  );
}

/** Faint vertical gridlines behind the mark column (sm and up). */
function Grid({ row, domain }: { row: string; domain: Domain }) {
  return (
    <div className={`${row} pointer-events-none absolute inset-0 hidden sm:grid`} aria-hidden="true">
      <span /><span />
      <div className="relative h-full">
        {ticksFor(domain).map((t) => <span key={t} className="absolute inset-y-0 w-px bg-line/70" style={{ left: `${pct(t, domain)}%` }} />)}
      </div>
      <span />
    </div>
  );
}

export interface DotRow { m: MethodResult; value: number; text: string }

/** Role word on sm and up; "ref" in the narrow phone key column. */
const RoleKey = ({ m }: { m: MethodResult }) => (
  <><span className="sm:hidden">ref</span><span className="hidden sm:inline">{roleShort(m)}</span></>
);

function Group({ title, first, children }: { title: string; first?: boolean; children: ReactNode }) {
  return (
    <>
      <p className={`label mb-1 px-1 ${first ? '' : 'mt-4'}`}>{title}</p>
      <div role="list" aria-label={title} className="relative">{children}</div>
    </>
  );
}

function DotLine({ row, rank, domain }: { row: DotRow; rank: ReactNode; domain: Domain }) {
  const { m, value, text } = row;
  return (
    <div role="listitem" title={`${m.method}: ${text}`} className={`${ROW.group} ${LINE}`}>
      <span className="pl-1 font-mono text-[11px] text-ink-3 tabular">{rank}</span>
      <MethodName id={m.id} name={m.method} reference={isRef(m)} className="min-w-0 truncate" />
      <div className={MARK}><CIBar value={value} domain={domain} color={methodColor(m.id)} dashed={isRef(m)} label={`${m.method}: ${text}`} /></div>
      <span className={`${VALUE} pr-1 text-right font-mono text-[13px] tabular ${isRef(m) ? 'text-ink-2' : 'text-ink'}`}>{text}</span>
    </div>
  );
}

/** Merge reference marks that sit close on the axis into one label so names never collide. */
function refLabels(refs: DotRow[]): { at: number; text: string }[] {
  const asc = [...refs].sort((a, b) => a.value - b.value);
  const out: { at: number; names: string[] }[] = [];
  asc.forEach(({ m, value }) => {
    const last = out[out.length - 1];
    if (last && value - last.at < 0.15) last.names.push(m.method);
    else out.push({ at: value, names: [m.method] });
  });
  return out.map((g) => ({ at: g.at, text: g.names.join(', ') }));
}

/** Thin dashed verticals for the reference methods, drawn across the ranked block on the shared axis (sm and up). */
function RefMarks({ refs, row, domain }: { refs: DotRow[]; row: string; domain: Domain }) {
  return (
    <div className={`${row} pointer-events-none absolute inset-0 hidden sm:grid`} aria-hidden="true">
      <span /><span />
      <div className="relative h-full">
        {refs.map(({ m, value }) => (
          <span key={m.id} className="absolute inset-y-0 border-l border-dashed opacity-60" style={{ left: `${pct(value, domain)}%`, borderColor: methodColor(m.id) }} />
        ))}
        {refLabels(refs).map((g) => (
          <span key={g.text} className="absolute top-0.5 hidden whitespace-nowrap pl-1 font-mono text-[11px] leading-none text-ink-3 lg:block" style={{ left: `${pct(g.at, domain)}%` }}>{g.text}</span>
        ))}
      </div>
      <span />
    </div>
  );
}

/**
 * DESIGN v2.2 layout for every per-method chart: the supervised ceiling pinned above, the six ranked detectors
 * as one contiguous block in Track A leaderboard order (1 to 6), then the other references in their own group.
 * References also appear as dashed marks (at `markValue`) across the ranked block.
 */
function Grouped({ label, row, markValue, line, domain = UNIT }: {
  label: string; row: string; markValue: (m: MethodResult) => number; domain?: Domain;
  line: (m: MethodResult, key: ReactNode) => ReactNode;
}) {
  const all = LEADERBOARD_DATA;
  const ceiling = all.filter((m) => isCeiling(m.id));
  const ranked = all.filter((m) => !isRef(m)).sort((a, b) => (a.publishedRankNum ?? 0) - (b.publishedRankNum ?? 0));
  const refs = all.filter((m) => isRef(m) && !isCeiling(m.id)).sort(byRefOrder);
  const marks: DotRow[] = refs.map((m) => ({ m, value: markValue(m), text: '' }));
  return (
    <div role="group" aria-label={label}>
      <div className="relative">
        <Grid row={row} domain={domain} />
        {ceiling.length > 0 && (
          <Group title="Supervised ceiling, not ranked" first>{ceiling.map((m) => line(m, <RoleKey m={m} />))}</Group>
        )}
        <Group title="Ranked detectors, 1 to 6">
          <div className="hidden lg:block lg:h-4" aria-hidden="true" />
          <RefMarks refs={marks} row={row} domain={domain} />
          {ranked.map((m) => line(m, <span className="text-ink">{m.publishedRankNum}</span>))}
        </Group>
        <Group title="Reference methods, not ranked">{refs.map((m) => line(m, <RoleKey m={m} />))}</Group>
      </div>
      <Axis row={row} domain={domain} />
    </div>
  );
}

/** One dot per method on a shared 0 to 1 axis, grouped by role (Tracks A, C, D). */
export function GroupedDotRows({ label, value, text, domain = UNIT }: {
  label: string; value: (m: MethodResult) => number; text: (m: MethodResult) => string;
  /** Values above the domain are pinned at the right edge; their printed value stays exact. */
  domain?: Domain;
}) {
  return (
    <Grouped label={label} row={ROW.group} markValue={value} domain={domain}
      line={(m, key) => <DotLine key={m.id} row={{ m, value: value(m), text: text(m) }} rank={key} domain={domain} />} />
  );
}

/** Track A median (hollow) to Track F median at 0.1% (filled), per method, grouped by role. Marks sit at the Track F value. */
export function Dumbbells({ label }: { label: string }) {
  const line = (m: MethodResult, key: ReactNode) => {
    const a = pct(m.medianAP, [0, 1]);
    const f = pct(m.trackF01AP, [0, 1]);
    const c = methodColor(m.id);
    const ref = isRef(m);
    const said = `${m.method}: Track A median AP ${fmt.ap(m.medianAP)}, Track F median AP at 0.1% ${fmt.ap(m.trackF01AP)}`;
    return (
      <div key={m.id} role="listitem" title={said} className={`${ROW.groupWide} ${LINE}`}>
        <span className="pl-1 font-mono text-[11px] text-ink-3 tabular">{key}</span>
        <MethodName id={m.id} name={m.method} reference={isRef(m)} className="min-w-0 truncate" />
        <div className={`${MARK} relative h-5`} role="img" aria-label={said}>
          <div className="absolute inset-x-0 top-1/2 h-px bg-line" />
          {ref
            ? <div className="absolute top-1/2 -translate-y-1/2 border-t-[1.5px] border-dashed opacity-60" style={{ left: `${Math.min(a, f)}%`, width: `${Math.abs(a - f)}%`, borderColor: c }} />
            : <div className="absolute top-1/2 h-[2px] -translate-y-1/2 rounded-full opacity-45" style={{ left: `${Math.min(a, f)}%`, width: `${Math.abs(a - f)}%`, background: c }} />}
          <div className={`absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] bg-surface ${ref ? 'border-dashed' : ''}`} style={{ left: `${a}%`, borderColor: c }} />
          {/* Track F value: filled for ranked detectors; references keep the fill but gain a dashed outline. */}
          <div className={`absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${ref ? 'outline-[1.5px] outline-offset-[1.5px] outline-dashed' : 'ring-2 ring-surface'}`} style={{ left: `${f}%`, background: c, outlineColor: c }} />
        </div>
        <span className={`${VALUE} whitespace-nowrap pr-1 text-right font-mono text-[12px] tabular ${isRef(m) ? 'text-ink-2' : 'text-ink'}`}>{fmt.ap(m.medianAP)} → {fmt.ap(m.trackF01AP)}</span>
      </div>
    );
  };
  return <Grouped label={label} row={ROW.groupWide} markValue={(m) => m.trackF01AP} line={line} />;
}

/** Track E: one supervised method under five label conditions. */
export function NoiseRows() {
  const c = methodColor('hvg_logreg');
  const row = 'grid grid-cols-[minmax(0,1fr)_3.25rem_3.25rem] gap-x-3 gap-y-1 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_4rem_4rem]';
  return (
    <div role="list" aria-label="hvg_logreg mean AP under each Track E label condition">
      <div className={`${row} px-1 pb-1`} aria-hidden="true">
        <span className="label">Condition</span>
        <span className="label hidden sm:block">Mean AP, 0 to 1</span>
        <span className="label text-right">AP</span>
        <span className="label text-right">RI</span>
      </div>
      {TRACK_E_NOISE_CONDITIONS.map((n) => (
        <div key={n.code} role="listitem" title={`${n.condition}: mean AP ${fmt.ap(n.meanAP)}, RI ${n.robustnessIndex.toFixed(3)}`}
          className={`${row} items-center rounded-chip px-1 py-2 transition-colors duration-150 hover:bg-sunk/70 sm:h-10 sm:py-0`}>
          <span className="min-w-0 text-[13px] text-ink">{n.condition.replace(/ \(.*\)$/, '')}</span>
          <div className="col-span-3 row-start-2 sm:col-span-1 sm:col-start-2 sm:row-start-1">
            <CIBar value={n.meanAP} color={c} dashed label={`${n.condition}: mean AP ${fmt.ap(n.meanAP)}`} />
          </div>
          <span className="col-start-2 row-start-1 text-right font-mono text-[13px] text-ink tabular sm:col-start-3">{fmt.ap(n.meanAP)}</span>
          <span className="col-start-3 row-start-1 text-right font-mono text-[13px] text-ink-2 tabular sm:col-start-4">{n.robustnessIndex.toFixed(3)}</span>
        </div>
      ))}
    </div>
  );
}

/** Track A vs Track B mean within-unit rank (1 = best, all 10 methods). Slope chart on sm+, rank list on phones. */
export function SlopeChart() {
  const rows = [...LEADERBOARD_DATA].sort((a, b) => a.trackARank - b.trackARank);
  const W = 462; const top = 30; const step = 24; const xL = 150; const xR = 290;
  const y = (r: number) => top + (r - 1) * step;
  const H = y(10) + 14;
  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} className="hidden h-auto w-full max-w-[540px] font-mono sm:block [&:hover>g]:opacity-25 [&>g:hover]:opacity-100" role="img"
        aria-label="Slope chart of mean within-unit rank on Track A versus Track B for all 10 methods">
        <text x={xL} y={12} textAnchor="middle" className="fill-ink-3 text-[11px] uppercase tracking-[0.06em]">Track A</text>
        <text x={xR} y={12} textAnchor="middle" className="fill-ink-3 text-[11px] uppercase tracking-[0.06em]">Track B</text>
        {rows.map((m) => {
          const c = methodColor(m.id);
          const ya = y(m.trackARank); const yb = y(m.trackBRank);
          const ref = isRef(m);
          return (
            <g key={m.id} className="transition-opacity duration-150">
              <title>{`${m.method}: rank ${m.trackARank} on Track A, ${m.trackBRank} on Track B`}</title>
              <text x={4} y={ya + 4} className="fill-ink-3 text-[11px]">{m.trackARank}</text>
              <text x={xL - 12} y={ya + 4} textAnchor="end" className="fill-ink text-[12px]">{m.method}</text>
              <line x1={xL} y1={ya} x2={xR} y2={yb} stroke={c} strokeWidth={2} strokeDasharray={ref ? '4 3' : undefined} strokeLinecap={ref ? 'butt' : 'round'} />
              {[[xL, ya], [xR, yb]].map(([cx, cy]) => ref
                ? <circle key={cx} cx={cx} cy={cy} r={4} fill="var(--surface)" stroke={c} strokeWidth={1.5} strokeDasharray="2 1.5" />
                : <circle key={cx} cx={cx} cy={cy} r={4} fill={c} stroke="var(--surface)" strokeWidth={2} />)}
              <text x={xR + 12} y={yb + 4} className="fill-ink-3 text-[11px]">{m.trackBRank}</text>
              <text x={xR + 30} y={yb + 4} className="fill-ink text-[12px]">{m.method}</text>
            </g>
          );
        })}
      </svg>
      <ol className="divide-y divide-line sm:hidden" aria-label="Mean within-unit rank, Track A to Track B">
        {rows.map((m) => {
          const d = m.trackBRank - m.trackARank;
          return (
            <li key={m.id} className="flex h-9 items-center justify-between gap-3">
              <MethodName id={m.id} name={m.method} reference={isRef(m)} className="min-w-0 truncate" />
              <span className="shrink-0 font-mono text-[13px] text-ink tabular">
                {m.trackARank} → {m.trackBRank}
                <span className="ml-2 inline-block w-7 text-right text-[11px] text-ink-3">{d === 0 ? '0' : d > 0 ? `+${d}` : `−${-d}`}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </>
  );
}
