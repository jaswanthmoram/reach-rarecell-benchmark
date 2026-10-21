import { DATASETS_DATA, DATASET_METHOD_MATRIX } from '../../data/benchmarkData';
import { cx, fmt } from '../../lib/format';
import { SectionHeader } from '../../ui/SectionHeader';
import { Reveal, useReveal } from '../../ui/motion';
import { BOARD_ORDER, tint, type Row } from './model';
import { Dot, INNER, SECTION, ScrollRegion } from './parts';

/* Per-cohort mean AP: 8 solid-tumour cohorts (20 Track A units each) by 10 methods, board order. */
const COHORTS = DATASETS_DATA.filter((d) => d.trackAUnits > 0);
const CELL = new Map(DATASET_METHOD_MATRIX.map((c) => [`${c.dataset}|${c.method.toLowerCase()}`, c]));
const cellOf = (ds: string, method: string) => CELL.get(`${ds}|${method.toLowerCase()}`);
/** Accent ramp for detectors; the ceiling stays gray, off the colour scale. */
const AP_FULL = 0.8;
const fill = (ap: number, ceiling: boolean) => (ceiling ? tint('var(--cell)', ap, 40) : tint('var(--accent)', ap / AP_FULL));
const STATUS = { fallback: 'f', degenerate: 'd' } as const;

/*
 * Rank swaps: within each cohort, the six ranked detectors are ordered by the mean AP shown in the heatmap and compared
 * with their board rank. The three largest moves (one per method) go in the side panel.
 */
const RANKED = BOARD_ORDER.filter((r) => r.band === 'ranked');
const ORDINAL = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
interface Swap { row: Row; cohort: string; rank: number; of: number; ap: number; move: number }
const SWAPS: Swap[] = (() => {
  const all = COHORTS.flatMap((d) => {
    const scored = RANKED.map((r) => ({ r, ap: cellOf(d.id, r.name)?.meanAP ?? null }))
      .filter((x): x is { r: Row; ap: number } => x.ap != null)
      .sort((a, b) => b.ap - a.ap);
    return scored.map((x, i) => ({ row: x.r, cohort: d.name, rank: i + 1, of: scored.length, ap: x.ap, move: (x.r.rank ?? 0) - (i + 1) }));
  });
  const picked: Swap[] = [];
  [...all].sort((a, b) => Math.abs(b.move) - Math.abs(a.move) || b.ap - a.ap).forEach((s) => {
    if (picked.length < 3 && !picked.some((p) => p.row.id === s.row.id)) picked.push(s);
  });
  return picked;
})();

function SwapPanel() {
  return (
    <div className="xl:sticky xl:top-[calc(var(--header-h,64px)+var(--section-nav-h,0px)+16px)]"><Reveal variant="mask"><aside aria-label="Largest rank moves by cohort" className="card fx-hairline-gradient flex flex-col p-5">
      <p className="m-0 text-sm font-medium text-ink">Largest rank moves</p>
      <p className="m-0 mt-1 text-xs leading-[1.55] text-ink-2">The six ranked detectors re-ordered by mean AP within one cohort, against their board rank.</p>
      <ol className="m-0 mt-4 flex list-none flex-col p-0">
        {SWAPS.map((s) => (
          <li key={s.row.id} className="border-t border-line py-3.5 first:border-t-0 first:pt-0 last:pb-0">
            <p className="m-0 flex items-center gap-2 font-mono text-[13px] text-ink"><Dot row={s.row} size={8} />{s.row.name}</p>
            <p className="m-0 mt-1.5 flex items-baseline gap-2 font-mono text-xs text-ink-2">
              <span>board {ORDINAL[(s.row.rank ?? 1) - 1]}</span>
              <span aria-hidden="true" className="text-ink-3">{s.move > 0 ? '↑' : '↓'}</span>
              <span className="text-ink">{ORDINAL[s.rank - 1]} of {s.of}</span>
              <span>on {s.cohort}</span>
            </p>
            <p className="m-0 mt-1 font-mono text-[11px] text-ink-3">mean AP <span className="text-ink-2 tabular-nums">{fmt.ap(s.ap)}</span> · {Math.abs(s.move)} {Math.abs(s.move) === 1 ? 'place' : 'places'} {s.move > 0 ? 'up' : 'down'}</p>
          </li>
        ))}
      </ol>
    </aside></Reveal></div>
  );
}

export function Cohorts() {
  /* Heatmap rows fade in 30 ms apart, once (audit S-17); the values themselves never tick. */
  const rowsRef = useReveal<HTMLTableSectionElement>({ y: 0, stagger: 0.03, duration: 0.3, start: 'top 90%' });
  return (
    <section id="cohorts" aria-labelledby="pc-h" className={SECTION}>
      <div className={INNER}>
        <SectionHeader id="pc-h" title="The order moves by cancer type"
          lede={<>Mean AP for each of the {COHORTS.length} solid-tumour cohorts, 20 units each. Accent ramp for detectors; the ceiling column in gray, off the colour scale.</>} />
        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_280px] xl:gap-10">
        <div className="min-w-0">
        <ScrollRegion label="Cohort by method heatmap, scrollable" hint={`Scroll sideways for all ${BOARD_ORDER.length} methods`}>
          <table className="w-max border-separate border-spacing-0.5 font-mono text-[11px]">
            <caption className="sr-only">Mean Track A AP per cohort and method, methods in board order: supervised ceiling, ranks 1 to 6, then the reference rows.</caption>
            <thead>
              <tr>
                <th scope="col" className="sticky left-0 z-10 bg-canvas pb-2 text-left align-bottom font-normal text-ink-3">Cohort</th>
                {BOARD_ORDER.map((m) => (
                  <th key={m.id} scope="col" className="h-36 px-0 pb-2 align-bottom font-normal">
                    <span className="mx-auto flex w-max flex-col-reverse items-center gap-2">
                      <Dot row={m} size={8} />
                      <span className="block rotate-180 whitespace-nowrap text-ink-2 [writing-mode:vertical-rl]">{m.name}</span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody ref={rowsRef}>
              {COHORTS.map((d) => (
                <tr key={d.id}>
                  <th scope="row" className="sticky left-0 z-10 bg-canvas pr-4 text-left font-normal">
                    <span className="block text-xs text-ink">{d.name}</span>
                    <span className="block max-w-[168px] truncate font-sans text-[11px] text-ink-3">{d.cancerType}</span>
                  </th>
                  {BOARD_ORDER.map((m) => {
                    const c = cellOf(d.id, m.name);
                    const ap = c?.meanAP ?? null;
                    const flag = c && c.status !== 'ok' ? STATUS[c.status] : null;
                    const text = `${d.name}, ${m.name}: ${ap == null ? 'no score' : `mean AP ${fmt.ap(ap)}`}${c && c.status !== 'ok' ? `, ${c.status} units` : ''}`;
                    return (
                      <td key={m.id} title={text} aria-label={text}
                        style={{ background: ap == null ? undefined : fill(ap, m.band === 'ceiling') }}
                        className={cx('relative h-11 w-16 text-center tabular-nums', ap == null ? 'bg-sunk text-ink-3' : 'text-ink')}>
                        <span aria-hidden="true">{ap == null ? 'n/a' : fmt.ap(ap)}</span>
                        {flag && <sup aria-hidden="true" className="absolute right-1 top-1 text-[11px] leading-none text-ink-2">{flag}</sup>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>
        <p className="m-0 mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-ink-3">
          <span className="inline-flex items-center gap-2">0.0
            <span aria-hidden="true" className="inline-block h-2.5 w-24 rounded-sm" style={{ background: `linear-gradient(90deg, ${fill(0, false)}, ${fill(AP_FULL, false)})` }} />
            {AP_FULL.toFixed(1)}+ mean AP
          </span>
          <span><span className="text-ink-2">f</span> fallback units (no score)</span>
          <span><span className="text-ink-2">d</span> degenerate units (constant scores)</span>
        </p>
        </div>
        <div className="xl:self-stretch xl:pt-36"><SwapPanel /></div>
        </div>
      </div>
    </section>
  );
}
