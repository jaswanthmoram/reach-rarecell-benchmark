import { useRef, type CSSProperties, type RefObject } from 'react';
import { ChevronDown, ICON_STROKE } from '../../ui/icons';
import { cx, fmt } from '../../lib/format';
import { useDrawIn } from '../../ui/motion';
import { useGlide } from '../../ui/motion/useGlide';
import { AP_MAX, AP_TICKS, BANDS, REFERENCE_ROWS, VIEWS, nextSort, defaultSort, type Row, type Sort, type SortKey, type TierId, type ViewId, INTERVAL_DRAW_IN } from './model';
import { Details } from './Details';
import { Dot } from './parts';

const VIEW_BG = 'bg-[#f1f4fb]';
const MONO_HEAD = 'font-mono text-[11px] uppercase leading-[1.25] tracking-[0.04em]';

/* Interval box: 340 wide, AP 0 to 0.6 maps to x 4 to 336, drawn at 300 px. */
const BOX_W = 340;
const BOX_PX = 300;
const ax = (v: number) => 4 + Math.max(0, Math.min(1, v / AP_MAX)) * 332;

export interface TableProps {
  rows: Row[];
  view: ViewId;
  tier: TierId;
  sort: Sort;
  onSort: (s: Sort) => void;
  open: Record<string, boolean>;
  onToggle: (id: string) => void;
  label: string;
  /** Set once the interval column has drawn in, so remounts (tab switches) show it static. */
  drawn?: RefObject<boolean>;
}

const gridOf = (showView: boolean): CSSProperties => ({
  display: 'grid',
  alignItems: 'center',
  gridTemplateColumns: ['48px', 'minmax(212px, 1fr)', ...(showView ? ['120px'] : []), '96px', '120px', '332px', '76px', '84px', '84px'].join(' '),
});

function SortHead({ k, label, align, view, sort, onSort, highlight }: {
  k: SortKey; label: string; align: 'left' | 'right'; view: ViewId; sort: Sort; onSort: (s: Sort) => void; highlight?: boolean;
}) {
  const active = sort ? sort.key === k : k === 'view';
  const current = sort ?? defaultSort(view);
  const dir = active ? current.dir : null;
  const ariaSort = dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none';
  return (
    <div role="columnheader" aria-sort={ariaSort}
      className={cx('flex min-h-11 items-center border-b border-line-strong px-1', align === 'left' ? 'justify-start' : 'justify-end', highlight && `${VIEW_BG} self-stretch`)}>
      <button type="button" onClick={() => onSort(nextSort(current, k, view))}
        aria-label={`Sort by ${label}${dir ? `, currently ${ariaSort}` : ''}`}
        className={cx('lb-sort lb-press inline-flex min-h-9 cursor-pointer items-center gap-1 rounded-chip border-0 bg-transparent px-1', MONO_HEAD,
          align === 'right' ? 'flex-row-reverse text-right' : 'text-left', active ? 'text-ink' : 'text-ink-3')}>
        <span>{label}</span>
        <ChevronDown size={12} strokeWidth={2} aria-hidden="true"
          className={cx('flex-none', active ? 'text-accent-ink' : 'opacity-40', dir === 'asc' && 'rotate-180')} />
      </button>
    </div>
  );
}

function PlainHead({ label, align }: { label: string; align: 'left' | 'right' }) {
  return (
    <div role="columnheader" className={cx('flex min-h-11 items-center border-b border-line-strong px-2', align === 'right' && 'justify-end')}>
      <span className={cx(MONO_HEAD, 'text-ink-3')}>{label}</span>
    </div>
  );
}

function Interval({ row }: { row: Row }) {
  const { bootstrapMeanAP: bm, bootAPLow, bootAPHigh } = row.m;
  const lo = ax(bootAPLow ?? bm);
  const hi = ax(bootAPHigh ?? bm);
  const off = bm > AP_MAX;
  return (
    <div role="cell" className="flex min-w-0 items-center px-4">
      <svg viewBox={`0 0 ${BOX_W} 24`} width={BOX_PX} height="24" aria-hidden="true" className="block flex-none">
        {AP_TICKS.map((t) => <line key={t} x1={ax(t)} y1="0" x2={ax(t)} y2="24" stroke="var(--line)" />)}
        <g data-ci-ref>
          {REFERENCE_ROWS.map((r) => <line key={r.id} x1={ax(r.m.bootstrapMeanAP)} y1="0" x2={ax(r.m.bootstrapMeanAP)} y2="24" stroke={r.color} strokeDasharray="2 3" opacity="0.7" />)}
        </g>
        {off ? (
          <>
            <line x1="220" y1="12.5" x2="278" y2="12.5" stroke={row.color} strokeDasharray="3 3" />
            <text x="336" y="16" textAnchor="end" fill="var(--ink-2)" className="font-mono text-[11px]">{fmt.ap(bm)} →</text>
          </>
        ) : (
          <>
            <g data-ci data-ox={ax(bm).toFixed(1)} data-oy="12">
              <rect x={lo} y="10" width={Math.max(hi - lo, 1)} height="4" rx="2" fill={row.color} opacity="0.35" />
              <line x1={lo} y1="7" x2={lo} y2="17" stroke={row.color} />
              <line x1={hi} y1="7" x2={hi} y2="17" stroke={row.color} />
            </g>
            <circle data-ci-dot cx={ax(bm)} cy="12" r={row.isRef ? 4.5 : 5} fill={row.isRef ? 'var(--surface)' : row.color}
              stroke={row.isRef ? row.color : 'var(--surface)'} strokeWidth={row.isRef ? 1.5 : 2} strokeDasharray={row.isRef ? '2 2' : undefined} />
          </>
        )}
      </svg>
      <span className="sr-only">Bootstrap mean Track A AP {fmt.ap(bm)}, 95% bootstrap interval {fmt.ap(bootAPLow ?? bm)} to {fmt.ap(bootAPHigh ?? bm)}</span>
    </div>
  );
}

function BodyRow({ row, view, tier, open, onToggle, grid }: {
  row: Row; view: ViewId; tier: TierId; open: boolean; onToggle: (id: string) => void; grid: CSSProperties;
}) {
  const V = VIEWS[view];
  const showView = view !== 'overall';
  const ink = row.isRef ? 'text-ink-2' : 'text-ink';
  const num = cx('px-2 text-right font-mono text-[13px] tabular-nums whitespace-nowrap', ink);
  const detailId = `lb-detail-${row.id}`;
  const hasSub = row.isRef || row.role !== 'Published';
  return (
    <>
      <div role="row" data-glide={row.id} style={grid}
        className={cx('lb-row relative min-h-12 bg-canvas', row.band === 'ceiling' ? 'border-b border-dashed border-line-strong' : 'border-b border-line')}>
        <div role="cell" className="px-2 font-mono text-[13px] font-semibold tabular-nums">
          {row.rank == null ? <><span aria-hidden="true" className="font-normal text-ink-3">–</span><span className="sr-only">not ranked (reference)</span></> : <span className="text-ink">{row.rank}</span>}
        </div>
        <div role="cell" className="min-w-0 px-1">
          <button type="button" aria-expanded={open} aria-controls={detailId} onClick={() => onToggle(row.id)}
            className="lb-press flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-chip border-0 bg-transparent px-1 text-left text-inherit">
            <ChevronDown size={14} strokeWidth={ICON_STROKE} aria-hidden="true" className={cx('lb-caret flex-none', open ? 'rotate-180 text-ink' : '-rotate-90 text-cell')} />
            <Dot row={row} />
            <span className="flex min-w-0 flex-col">
              <span className={cx('truncate font-mono text-[13px] leading-[1.3]', ink, row.isRef ? 'font-normal' : 'font-semibold')}>{row.name}</span>
              {hasSub && <span className="truncate font-mono text-[11px] leading-[1.3] text-ink-3">{row.role}</span>}
            </span>
            <span className="sr-only">{open ? 'Hide' : 'Show'} details</span>
          </button>
        </div>
        {showView && <div role="cell" className={cx(num, VIEW_BG, 'flex items-center justify-end self-stretch font-semibold')}>{V.fmt(V.get(row.m, tier))}</div>}
        <div role="cell" className={cx(num, !showView && !row.isRef && 'font-semibold')}>{fmt.ap(row.m.medianAP)}</div>
        <div role="cell" className={num}>{fmt.ap(row.m.meanAP)}<span className="text-ink-3"> ± {fmt.ap(row.m.stdAP)}</span></div>
        <Interval row={row} />
        <div role="cell" className={num}>{fmt.ap(row.m.auroc)}</div>
        <div role="cell" className={num}>{fmt.ap(row.m.topKF1)}</div>
        <div role="cell" className={num}>{fmt.secs(row.m.runtimeS)}</div>
      </div>
      {open && (
        <div role="row" id={detailId} data-glide={`${row.id}-detail`} style={{ ...grid, alignItems: 'start' }} className="relative border-b border-line bg-surface">
          <div role="cell" className="px-2 pb-6 pt-5" style={{ gridColumn: '2 / -1' }}><Details row={row} /></div>
        </div>
      )}
    </>
  );
}

export function Table({ rows, view, tier, sort, onSort, open, onToggle, label, drawn }: TableProps) {
  const showView = view !== 'overall';
  const grid = gridOf(showView);
  const glideRef = useGlide<HTMLDivElement>(`${view}|${rows.map((r) => r.id + (open[r.id] ? '+' : '')).join(',')}`);
  const drawRef = useRef<HTMLDivElement>(null);
  useDrawIn(drawRef, { ...INTERVAL_DRAW_IN, once: drawn });
  const V = VIEWS[view];
  const head = { view, sort, onSort };
  const bands = BANDS.map((b) => ({ ...b, rows: rows.filter((r) => r.band === b.id) })).filter((b) => b.rows.length > 0);
  return (
    <div ref={drawRef} role="region" aria-label="Leaderboard table, scrollable" tabIndex={0} className="relative mt-4 overflow-x-auto">
      <div ref={glideRef} role="table" aria-label={label} className="relative" style={{ minWidth: showView ? 1172 : 1052 }}>
        <div role="rowgroup">
          <div role="row" style={grid}>
            <SortHead k="rank" label="Rank" align="left" {...head} />
            <PlainHead label="Method" align="left" />
            {showView && <SortHead k="view" label={V.col(tier)} align="right" highlight {...head} />}
            <SortHead k={showView ? 'medianAP' : 'view'} label="Median AP" align="right" {...head} />
            <SortHead k="meanAP" label="Mean ± SD" align="right" {...head} />
            <PlainHead label="95% bootstrap interval · Figure 4a" align="left" />
            <SortHead k="auroc" label="AUROC" align="right" {...head} />
            <SortHead k="topKF1" label="Top-k F1" align="right" {...head} />
            <SortHead k="runtimeS" label="Runtime" align="right" {...head} />
          </div>
        </div>
        {bands.map((b) => (
          <div role="rowgroup" aria-label={`${b.label}, ${b.rows.length}`} key={b.id}>
            <div role="row" data-glide={`band-${b.id}`} className="relative block border-b border-line">
              <div role="rowheader" className="px-2 pb-1.5 pt-3.5">
                <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-2">{b.label} · {b.rows.length}</span>
                <span className="ml-3 font-mono text-[11px] text-ink-3">{b.note}</span>
              </div>
            </div>
            {b.rows.map((r) => <BodyRow key={r.id} row={r} view={view} tier={tier} open={!!open[r.id]} onToggle={onToggle} grid={grid} />)}
          </div>
        ))}
        <div aria-hidden="true" data-glide="ticks" className="relative" style={grid}>
          <div className="px-4 pt-2" style={{ gridColumn: showView ? 6 : 5 }}>
            <div className="relative h-4 font-mono text-[11px] text-ink-3" style={{ width: BOX_PX }}>
              {AP_TICKS.map((t, i) => (
                <span key={t} className="absolute" style={{ left: (ax(t) * BOX_PX) / BOX_W, transform: i === 0 ? undefined : `translateX(${i === AP_TICKS.length - 1 ? -100 : -50}%)` }}>{t.toFixed(1)}</span>
              ))}
            </div>
            <p className="m-0 mt-1 text-center font-mono text-[11px] tracking-[0.06em] text-ink-3" style={{ width: BOX_PX }}>TRACK A AP · SAME AXIS AS THE CHART ABOVE</p>
          </div>
        </div>
      </div>
    </div>
  );
}
