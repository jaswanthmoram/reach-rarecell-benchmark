import type { HTMLAttributes } from 'react';
import { href } from '../../app/router';
import type { MethodResult } from '../../data/benchmarkData';
import { Badge, CIBar, Icon, MethodDot, fmt, methodColor } from '../../ui';
import {
  BASELINE, CEILING, EXPLORATORY, FILTERED, FIRE_VS_EXPR, FIRE_VS_SMF, FLOOR, G, RANKED,
  bootCI, fdr, unitsAfterFallback,
} from './facts';
import type { Hot } from './CohortField';

type Link = { hot: Hot; onHot: (h: Hot) => void };

/** Row props that drive the hero field: hover or focus previews a method, click or Enter pins it (touch), Escape clears. */
function linkProps(id: string, dashed: boolean, { hot, onHot }: Link): HTMLAttributes<HTMLTableRowElement> {
  const me = { id, dashed };
  const on = hot?.id === id;
  return {
    tabIndex: 0,
    'aria-pressed': on,
    onMouseEnter: () => onHot(me),
    onMouseLeave: () => onHot(null),
    onFocus: () => onHot(me),
    onBlur: () => onHot(null),
    onClick: () => onHot(on ? null : me),
    onKeyDown: (e) => { if (e.key === 'Escape') onHot(null); if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onHot(on ? null : me); } },
    className: `cursor-pointer border-t border-line outline-none transition-colors duration-150 hover:bg-sunk/70 focus-visible:bg-accent-tint ${on ? 'bg-sunk/70' : ''}`,
  };
}

interface Ref { m: MethodResult; role: string }

/** v2.2: ceiling pinned above, ranked 1–6 contiguous, then the reference group (each also a mark on the axis). */
const CEILING_REF: Ref | null = CEILING ? { m: CEILING, role: 'supervised ceiling' } : null;
const REFS: Ref[] = [
  EXPLORATORY && { m: EXPLORATORY, role: 'exploratory comparator' },
  BASELINE && { m: BASELINE, role: 'naive baseline, total UMI' },
  FLOOR && { m: FLOOR, role: 'floor' },
].filter((r): r is Ref => Boolean(r));

const pct = (v: number) => `${Math.max(0, Math.min(1, v)) * 100}%`;

/** Bootstrap mean + 95% interval on the shared 0–1 axis; `marks` draws the reference rows as thin verticals. */
function Bar({ m, dashed, marks }: { m: MethodResult; dashed?: boolean; marks?: boolean }) {
  const [lo, hi] = bootCI(m);
  return (
    <div className="relative [&_[role=img]]:min-w-0">
      {marks && REFS.map((r) => (
        <span key={r.m.id} aria-hidden="true" className="absolute -inset-y-2.5 border-l border-dashed opacity-80"
          style={{ left: pct(r.m.bootstrapMeanAP), borderColor: methodColor(r.m.id) }} />
      ))}
      <CIBar value={m.bootstrapMeanAP} low={lo} high={hi} color={methodColor(m.id)} dashed={dashed}
        label={`${m.method}: bootstrap mean Track A AP ${fmt.ap(m.bootstrapMeanAP)}, 95% bootstrap interval ${fmt.ap(lo)} to ${fmt.ap(hi)}`} />
    </div>
  );
}

function ReferenceRow({ r, link }: { r: Ref; link: Link }) {
  return (
    <tr {...linkProps(r.m.id, true, link)}>
      <td className="w-7 pl-4"><span className="sr-only">not ranked</span></td>
      <th scope="row" className="min-w-0 py-2 pr-2 text-left align-middle font-normal">
        <span className="flex min-w-0 items-center gap-2">
          <MethodDot id={r.m.id} dashed />
          <span className="truncate font-mono text-xs text-ink xl:text-[13px]">{r.m.method}</span>
        </span>
        <span className="mt-0.5 block truncate pl-[18px] text-[11px] leading-4 text-ink-3">{r.role}</span>
      </th>
      <td className="py-2 pr-3 align-middle max-[359px]:pr-0 max-[359px]:[&>*]:hidden"><Bar m={r.m} dashed /></td>
      <td className="py-2 pr-4 text-right align-middle font-mono text-[13px] text-ink-2 tabular">{fmt.ap(r.m.medianAP)}</td>
    </tr>
  );
}

function RankedRow({ m, link }: { m: MethodResult & { publishedRankNum: number }; link: Link }) {
  return (
    <tr {...linkProps(m.id, false, link)}>
      <td className="w-7 pl-4 align-middle font-mono text-xs text-ink-3 tabular">{m.publishedRankNum}</td>
      <th scope="row" className="min-w-0 py-2.5 pr-2 text-left align-middle font-normal">
        <span className="flex min-w-0 items-center gap-2">
          <MethodDot id={m.id} />
          <span className="truncate font-mono text-xs text-ink xl:text-[13px]">{m.method}</span>
          {m.paperRole === 'Published/proxy' && <span className="hidden font-mono text-[11px] text-ink-3 sm:inline">proxy</span>}
        </span>
      </th>
      <td className="py-2.5 pr-3 align-middle max-[359px]:pr-0 max-[359px]:[&>*]:hidden"><Bar m={m} marks /></td>
      <td className="py-2.5 pr-4 text-right align-middle font-mono text-[13px] font-medium text-ink tabular">{fmt.ap(m.medianAP)}</td>
    </tr>
  );
}

function GroupHead({ children }: { children: string }) {
  return (
    <tr className="border-t border-line bg-sunk/60">
      <th scope="rowgroup" colSpan={4} className="px-4 py-1.5 text-left font-normal"><span className="label">{children}</span></th>
    </tr>
  );
}

export default function RankCard(link: Link) {
  const filteredNames = FILTERED.map((m) => m.method).join(', ');
  const filteredN = FILTERED[0] ? unitsAfterFallback(FILTERED[0]) : G.trackAUnits;
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <p className="label">Track A · median AP</p>
        <span className="ml-auto hidden font-mono text-[11px] text-ink-3 lg:inline">point at a row to see its cells</span>
        <Badge>ranked 1–{RANKED.length}</Badge>
      </div>

      <table className="w-full table-fixed text-sm">
        <caption className="sr-only">
          Supervised ceiling (not ranked), then the {RANKED.length} ranked published detectors ordered by Track A median average precision, then three unranked reference rows.
        </caption>
        <colgroup>
          <col className="w-7" />
          <col />
          <col className="w-2 min-[360px]:w-28 sm:w-40 lg:w-32 xl:w-44" />
          <col className="w-14" />
        </colgroup>
        <thead className="sr-only">
          <tr><th scope="col">Rank</th><th scope="col">Method</th><th scope="col">Bootstrap mean AP and 95% interval</th><th scope="col">Median AP</th></tr>
        </thead>
        {CEILING_REF && <tbody className="[&>tr]:border-t-0"><ReferenceRow r={CEILING_REF} link={link} /></tbody>}
        <tbody>
          <GroupHead>Ranked published detectors</GroupHead>
          {RANKED.map((m) => <RankedRow key={m.id} m={m} link={link} />)}
        </tbody>
        <tbody>
          <GroupHead>Reference rows · not ranked</GroupHead>
          {REFS.map((r) => <ReferenceRow key={r.m.id} r={r} link={link} />)}
        </tbody>
      </table>

      <div className="space-y-2.5 border-t border-line bg-sunk px-4 py-3.5 text-xs leading-relaxed text-ink-2">
        {FIRE_VS_EXPR && (
          <p>
            <span className="font-mono text-ink">FiRE</span> vs <span className="font-mono text-ink">expr_threshold</span>: not significantly different (BH-FDR {fdr(FIRE_VS_EXPR.pAdjusted)}).
            {FIRE_VS_SMF && !FIRE_VS_SMF.significant && <> Nor is FiRE vs scMalignantFinder (BH-FDR {fdr(FIRE_VS_SMF.pAdjusted)}).</>}
          </p>
        )}
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-ink-3">
          <span className="inline-flex items-center gap-1.5"><span className="relative h-1 w-5 rounded-full bg-ink-3/40"><span className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink-2" /></span>bootstrap mean, 95% interval</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-3 border-l border-dashed border-ink-3" />reference row on the axis</span>
        </p>
        <p className="text-ink-3">
          Ordered and printed by median AP · n = {G.trackAUnits} units per method{FILTERED.length > 0 && <> ({filteredN} for {filteredNames} after fallback filtering)</>}. Inter-lineage contrast only. Track F tests same-lineage.
        </p>
        <div className="flex justify-end border-t border-line pt-2">
          <a href={href('/leaderboard')} className="group inline-flex min-h-8 items-center gap-1 font-medium text-accent hover:underline">
            Full leaderboard<Icon name="arrow-right" size={13} className="transition-transform duration-150 group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
