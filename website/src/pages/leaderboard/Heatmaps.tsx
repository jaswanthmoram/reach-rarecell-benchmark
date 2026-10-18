import { Fragment, type ReactNode } from 'react';
import {
  CLIFF_DELTA_MATRIX, CLIFF_DELTA_METHODS, DATASETS_DATA, DATASET_METHOD_MATRIX, LEADERBOARD_DATA, PAIRWISE_COMPARISONS,
  type PairwiseComparison,
} from '../../data/benchmarkData';
import { Badge, MethodDot, fmt } from '../../ui';
import { BOARD_ORDER, accentMix, compactP, grayMix, isCeiling, isReference, signed } from './model';

/* ---------- shared ---------- */
const BY_NAME = new Map(LEADERBOARD_DATA.map((m) => [m.method.toLowerCase(), m]));
const methodOf = (name: string) => BY_NAME.get(name.toLowerCase());
/** Rule 2: ceiling, comparator and baselines are drawn with dashed marks. */
const isRefName = (name: string) => { const m = methodOf(name); return m ? isReference(m) : false; };

const vertical = 'h-40 px-0 pb-2 align-bottom font-normal';
const CELL = 'h-10 w-12 sm:w-14 lg:w-16';

/** Board bands: ceiling, ranked 1 to 6, references. A gap is drawn wherever the band changes. */
type Band = 'ceiling' | 'ranked' | 'reference';
const bandOfName = (name: string): Band => {
  const m = methodOf(name);
  if (!m) return 'reference';
  return isCeiling(m) ? 'ceiling' : isReference(m) ? 'reference' : 'ranked';
};
const BAND_LABEL: Record<Band, string> = { ceiling: 'Ceiling', ranked: 'Ranked 1 to 6', reference: 'References' };
const startsBand = (names: string[], i: number) => i > 0 && bandOfName(names[i]) !== bandOfName(names[i - 1]);
const Gap = ({ head }: { head?: boolean }) => (head ? <th aria-hidden="true" className="w-2 p-0" /> : <td aria-hidden="true" className="w-2 p-0" />);

/** One header cell per band, spanning its columns, so the three groups read before the names do. */
function BandHeads({ names }: { names: string[] }) {
  const runs = names.reduce<{ band: Band; n: number }[]>((acc, name) => {
    const band = bandOfName(name);
    const last = acc[acc.length - 1];
    return last && last.band === band ? [...acc.slice(0, -1), { band, n: last.n + 1 }] : [...acc, { band, n: 1 }];
  }, []);
  return (
    <tr aria-hidden="true">
      <th className="sticky left-0 z-10 bg-surface" />
      {runs.map((r, i) => (
        <Fragment key={r.band}>
          {i > 0 && <Gap head />}
          <th colSpan={r.n} className="border-b border-line-strong pb-1.5 text-left align-bottom font-normal">
            <span className={`block font-mono text-[11px] uppercase tracking-[0.06em] ${r.band === 'ranked' ? 'text-ink-2' : 'text-ink-3'}`}>
              {BAND_LABEL[r.band]}
            </span>
          </th>
        </Fragment>
      ))}
    </tr>
  );
}

/** Mobile only: the grids are wider than the screen, so say so before the reader misses seven columns. */
const ScrollHint = () => <p className="mb-2 font-mono text-[11px] text-ink-3 md:hidden">Scroll sideways for all 10 methods →</p>;
const magnitude = (d: number) => {
  const a = Math.abs(d);
  return a < 0.147 ? 'negligible' : a < 0.33 ? 'small' : a < 0.474 ? 'medium' : 'large';
};
const deltaFill = (d: number) => (d >= 0 ? accentMix(d) : grayMix(-d));
const pairKey = (a: string, b: string) => [a.toLowerCase(), b.toLowerCase()].sort().join('|');
const NS_PAIRS = new Set(PAIRWISE_COMPARISONS.filter((p) => !p.significant).map((p) => pairKey(p.methodA, p.methodB)));

/** Scrolls inside its own frame; the page never scrolls sideways. */
function Scroller({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="max-w-full overflow-x-auto overscroll-x-contain focus-visible:outline-2 focus-visible:outline-accent" role="region" aria-label={label} tabIndex={0}>
      {children}
    </div>
  );
}

function ColHead({ name }: { name: string }) {
  return (
    <th scope="col" className={vertical}>
      <span className="mx-auto flex w-max flex-col-reverse items-center gap-2">
        <MethodDot id={methodOf(name)?.id ?? name} dashed={isRefName(name)} size={7} />
        <span className="block whitespace-nowrap font-mono text-[11px] text-ink-2 [writing-mode:vertical-rl] rotate-180">{name}</span>
      </span>
    </th>
  );
}

function RowHead({ name, sub }: { name: string; sub?: ReactNode }) {
  return (
    <th scope="row" className="sticky left-0 z-10 whitespace-nowrap bg-surface pr-3 text-left font-normal shadow-[1px_0_0_var(--line)]">
      <span className="flex items-center gap-2 font-mono text-xs text-ink">
        <MethodDot id={methodOf(name)?.id ?? name} dashed={isRefName(name)} size={7} />{name}
      </span>
      {sub}
    </th>
  );
}

/* ---------- Cliff's delta grid ---------- */
/** Table 7 prints its own order; re-index rows and columns into board order (rule 1). */
const CLIFF_ORDER = BOARD_ORDER.map((m) => CLIFF_DELTA_METHODS.findIndex((n) => n.toLowerCase() === m.method.toLowerCase())).filter((i) => i >= 0);
const CLIFF_NAMES = CLIFF_ORDER.map((i) => CLIFF_DELTA_METHODS[i]);

export function CliffGrid() {
  return (
    <div className="min-w-0 rounded-card border border-line bg-surface p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <p className="label">Cliff&apos;s <span className="normal-case">δ</span> · Table 7</p>
        <p className="font-mono text-[11px] text-ink-3">45 pairs · leaderboard order · positive = row method higher AP</p>
      </div>
      <ScrollHint />
      <Scroller label="Pairwise Cliff's delta matrix, scrollable">
        <table className="mx-auto w-max border-separate border-spacing-0.5 text-[11px]">
          <caption className="sr-only">Cliff&apos;s delta, row method versus column method, Track A per-unit AP, in leaderboard order: supervised ceiling, ranks 1 to 6, then the reference rows. Positive means the row method scores higher.</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-surface pb-2 pr-3 text-left align-bottom font-normal"><span className="sr-only">Row method versus column method</span></th>
              {CLIFF_NAMES.map((n, i) => <Fragment key={n}>{startsBand(CLIFF_NAMES, i) && <Gap head />}<ColHead name={n} /></Fragment>)}
            </tr>
            <BandHeads names={CLIFF_NAMES} />
          </thead>
          <tbody>
            {CLIFF_ORDER.map((r, ri) => {
              const row = CLIFF_DELTA_METHODS[r];
              return (
              <Fragment key={row}>
              {startsBand(CLIFF_NAMES, ri) && <tr aria-hidden="true" className="h-2" />}
              <tr>
                <RowHead name={row} />
                {CLIFF_ORDER.map((c, ci) => {
                  const d = CLIFF_DELTA_MATRIX[r][c];
                  const col = CLIFF_DELTA_METHODS[c];
                  const gap = startsBand(CLIFF_NAMES, ci) && <Gap />;
                  if (r === c) return <Fragment key={col}>{gap}<td className={`${CELL} rounded-none bg-sunk text-center text-ink-3`} aria-label="same method">·</td></Fragment>;
                  const ns = NS_PAIRS.has(pairKey(row, col));
                  const text = `${row} vs ${col}: δ = ${signed(d)}, ${magnitude(d)}${ns ? ', not significant (BH-FDR)' : ''}`;
                  return (
                    <Fragment key={col}>{gap}
                    <td title={text} aria-label={text} style={{ background: deltaFill(d) }}
                      className={`relative ${CELL} rounded-none text-center font-mono text-ink tabular ${ns ? 'outline outline-1 -outline-offset-2 outline-dashed outline-ink' : ''}`}>
                      {ns && <span className="block text-[11px] leading-none text-ink-2" aria-hidden="true">ns</span>}
                      {signed(d)}
                    </td>
                    </Fragment>
                  );
                })}
              </tr>
              </Fragment>
              );
            })}
          </tbody>
        </table>
      </Scroller>
      <DeltaLegend />
    </div>
  );
}

function DeltaLegend() {
  const ticks = [-1, -0.474, 0, 0.474, 1];
  const pos = (t: number) => `${((t + 1) / 2) * 100}%`;
  return (
    <div className="mx-auto mt-6 max-w-xl">
      <div className="h-2.5 rounded-full border border-line"
        style={{ background: `linear-gradient(to right, ${grayMix(1)}, ${grayMix(0)} 50%, ${accentMix(1)})` }} aria-hidden="true" />
      <div className="relative mx-3 mt-1 h-4 font-mono text-[11px] text-ink-3" aria-hidden="true">
        {ticks.map((t) => (
          <span key={t} className="absolute -translate-x-1/2" style={{ left: pos(t) }}>{t === 0 ? '0' : signed(t, Math.abs(t) === 1 ? 0 : 3)}</span>
        ))}
      </div>
      <p className="mt-2 flex justify-between gap-4 text-xs text-ink-2">
        <span>Column method higher</span>
        <span>Row method higher</span>
      </p>
      <p className="mt-2 font-mono text-[11px] leading-relaxed text-ink-3">|<span className="normal-case">δ</span>| &lt; 0.147 negligible · &lt; 0.33 small · &lt; 0.474 medium · ≥ 0.474 large</p>
      <p className="mt-2 text-xs leading-relaxed text-ink-2"><span className="mr-1.5 inline-block h-3 w-4 align-middle outline outline-1 -outline-offset-1 outline-dashed outline-ink" aria-hidden="true" />Dashed cell: Wilcoxon test against FiRE not significant after BH-FDR correction (Table 6b).</p>
    </div>
  );
}

/* ---------- Pairwise list (proof Table 6b) ---------- */
/**
 * The badge already says significant or not, and the δ cell already gives size and magnitude.
 * These rewrites drop the interpretation sentences that only restate that, keeping what they add.
 * Text that matches no rule is shown as written.
 */
const RESTATED: [RegExp, string][] = [
  [/^FiRE significantly outperforms \S+ \(\w+ effect\)\.$/, ''],
  [/^FiRE significantly outperforms \S+ \(\w+ effect\), although they (?:still )?share (.+)$/, 'Both sit in $1'],
  [/^Key null finding: .*δ = ([\d.]+) in (Table \d+)\)\.$/, '$2 prints δ = $1 on all units.'],
  [/^FiRE’s advantage over \S+ is both significant and large\.$/, ''],
  [/^FiRE is far above the random floor \(\w+ effect\)\.$/, ''],
  [/^No significant difference; Cliff’s δ is \w+ \(([\d.]+) on all units in (Table \d+)\)\.$/, '$2 prints δ = $1 on all units.'],
  [/^Exploratory comparison: (\S+) scores higher than \S+ \(\w+ effect\)\. .+$/, 'Exploratory comparison; $1 is an unranked reference row.'],
  [/^The supervised ceiling dominates every unsupervised method by a large effect \(δ ∈ \[([\d.]+), ([\d.]+)\]\);.*$/, 'Against every unsupervised method δ runs from $1 to $2 (Table 7).'],
];
const pairNote = (text: string) => RESTATED.reduce((t, [re, to]) => t.replace(re, to), text);

function Pair({ a, b }: { a: string; b: string }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[13px] text-ink">
      <span className="inline-flex items-center gap-2"><MethodDot id={methodOf(a)?.id ?? a} dashed={isRefName(a)} />{a}</span>
      <span className="text-ink-3">vs</span>
      <span className="inline-flex items-center gap-2"><MethodDot id={methodOf(b)?.id ?? b} dashed={isRefName(b)} />{b}</span>
    </span>
  );
}

function PairRow({ p }: { p: PairwiseComparison }) {
  const unreported = p.pAdjusted === 'not reported';
  const note = pairNote(p.interpretation);
  return (
    <li className="grid gap-x-6 gap-y-3 py-4 md:grid-cols-[minmax(0,320px)_312px_minmax(0,1fr)] md:items-start">
      <div className="flex flex-col items-start gap-2">
        <Pair a={p.methodA} b={p.methodB} />
        {unreported ? <Badge>large effect · p not printed</Badge> : p.significant ? <Badge>significant</Badge> : <Badge tone="accent">not significant</Badge>}
      </div>
      <dl className="grid grid-cols-[80px_104px_minmax(96px,1fr)] gap-4 font-mono text-xs text-ink-2 tabular">
        <div><dt className="label">Δ mean AP</dt><dd className="text-ink">{signed(p.meanDiff)}</dd></div>
        <div><dt className="label whitespace-nowrap" title="Cliff's delta on the common units of Table 6b; Table 7 values use all units">Cliff&apos;s <span className="normal-case">δ</span> 6b</dt><dd className="text-ink">{signed(p.cliffsDelta)}<span className="block text-[11px] text-ink-3">{magnitude(p.cliffsDelta)}</span></dd></div>
        <div><dt className="label">BH-FDR</dt><dd className="whitespace-nowrap text-ink">{unreported ? 'n/a' : compactP(p.pAdjusted)}</dd></div>
      </dl>
      {note && <p className="text-sm leading-relaxed text-ink-2">{note}</p>}
    </li>
  );
}

export function PairwiseList() {
  const ns = PAIRWISE_COMPARISONS.filter((p) => !p.significant);
  const sig = PAIRWISE_COMPARISONS.filter((p) => p.significant);
  return (
    <div className="grid gap-10">
      <div>
        <h3 className="text-lg font-semibold tracking-[-0.01em] text-ink">Not significantly different <span className="font-mono text-sm font-normal text-ink-3">{ns.length} of {PAIRWISE_COMPARISONS.length} comparisons</span></h3>
        <p className="mt-1 max-w-[68ch] text-sm leading-relaxed text-ink-2">These pairs are not significantly different after BH-FDR correction; do not order them.</p>
        <ul className="mt-3 divide-y divide-line border-y border-line-strong">{ns.map((p) => <PairRow key={pairKey(p.methodA, p.methodB)} p={p} />)}</ul>
      </div>
      <div>
        <h3 className="text-lg font-semibold tracking-[-0.01em] text-ink">Significant or practically large <span className="font-mono text-sm font-normal text-ink-3">{sig.length} of {PAIRWISE_COMPARISONS.length} comparisons</span></h3>
        <p className="mt-1 max-w-[68ch] text-sm leading-relaxed text-ink-2">Positive values mean the first method has the higher AP. The ceiling row combines Table 7 (<span className="font-mono">δ</span>) with Table 4 means; the proof prints no p-value for it.</p>
        <ul className="mt-3 divide-y divide-line border-y border-line">{sig.map((p) => <PairRow key={pairKey(p.methodA, p.methodB)} p={p} />)}</ul>
      </div>
    </div>
  );
}

/* ---------- Dataset × method ---------- */
const TRACK_A_DATASETS = [...new Set(DATASET_METHOD_MATRIX.map((c) => c.dataset))]
  .map((id) => DATASETS_DATA.find((d) => d.id === id))
  .filter((d): d is NonNullable<typeof d> => Boolean(d));
const COLUMNS = BOARD_ORDER;
const COLUMN_NAMES = COLUMNS.map((m) => m.method);
const cellOf = (dataset: string, method: string) => DATASET_METHOD_MATRIX.find((c) => c.dataset === dataset && c.method === method);

export function DatasetHeatmap() {
  return (
    <div className="min-w-0 rounded-card border border-line bg-surface p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <p className="label">Mean AP · cohort × method · Track A</p>
        <p className="font-mono text-[11px] text-ink-3">ceiling in gray, off the colour scale · 20 units per cohort</p>
      </div>
      <ScrollHint />
      <Scroller label="Cohort by method mean AP heatmap, scrollable">
        <table className="mx-auto w-max border-separate border-spacing-0.5 text-[11px]">
          <caption className="sr-only">Mean AP per Track A cohort (rows) and method (columns), columns in leaderboard order: supervised ceiling, ranks 1 to 6, then the reference rows.</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-surface pb-2 pr-3 text-left align-bottom font-normal"><span className="label">Cohort · units</span></th>
              {COLUMNS.map((m, i) => <Fragment key={m.id}>{startsBand(COLUMN_NAMES, i) && <Gap head />}<ColHead name={m.method} /></Fragment>)}
            </tr>
            <BandHeads names={COLUMN_NAMES} />
          </thead>
          <tbody>
            {TRACK_A_DATASETS.map((d) => (
              <tr key={d.id}>
                <th scope="row" className="sticky left-0 z-10 whitespace-nowrap bg-surface pr-3 text-left font-normal shadow-[1px_0_0_var(--line)]">
                  <span className="block font-mono text-xs text-ink">{d.id}<span className="text-ink-3"> · {d.trackAUnits}</span></span>
                  <span className="hidden text-[11px] text-ink-2 sm:block">{d.cancerType.replace(/\s*\(.*\)$/, '')}</span>
                </th>
                {COLUMNS.map((m, i) => {
                  const c = cellOf(d.id, m.id);
                  const gap = startsBand(COLUMN_NAMES, i) && <Gap />;
                  if (!c || c.meanAP === null) {
                    return (
                      <Fragment key={m.id}>{gap}
                      <td title={`${d.id} × ${m.method}: fallback, no output`} aria-label={`${d.id}, ${m.method}: fallback, no output`}
                        className={`${CELL} rounded-none border border-line bg-sunk text-center font-mono text-ink-2`}>n/a</td>
                      </Fragment>
                    );
                  }
                  const deg = c.status === 'degenerate';
                  const text = `${d.id} × ${m.method}: mean AP ${fmt.ap(c.meanAP)}${c.stdAP !== null ? ` ± ${fmt.ap(c.stdAP)}` : ''}${deg ? ', degenerate (constant scores)' : ''}`;
                  return (
                    <Fragment key={m.id}>{gap}
                    <td title={text} aria-label={text} style={{ background: isCeiling(m) ? grayMix(c.meanAP * 0.5) : accentMix(c.meanAP) }}
                      className={`relative ${CELL} rounded-none text-center font-mono text-ink tabular ${deg ? 'outline outline-1 -outline-offset-2 outline-dashed outline-ink-2' : ''}`}>
                      {deg && <span className="block text-[11px] leading-none text-ink-2" aria-hidden="true">D</span>}
                      {fmt.ap(c.meanAP)}
                    </td>
                    </Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Scroller>
      <div className="mx-auto mt-6 flex max-w-xl flex-col gap-3">
        <div>
          <div className="h-2.5 rounded-full border border-line" style={{ background: `linear-gradient(to right, ${accentMix(0)}, ${accentMix(1)})` }} aria-hidden="true" />
          <div className="mt-1 flex justify-between font-mono text-[11px] text-ink-3" aria-hidden="true"><span>0.000</span><span>0.500</span><span>1.000 mean AP</span></div>
        </div>
        <p className="flex flex-wrap gap-x-5 gap-y-1 text-xs leading-relaxed text-ink-2">
          <span><span className="mr-1.5 inline-block h-3 w-4 align-middle outline outline-1 -outline-offset-1 outline-dashed outline-ink-2" aria-hidden="true" />D · degenerate: constant scores (AUROC 0.500)</span>
          <span><span className="mr-1.5 inline-block h-3 w-4 rounded-none border border-line bg-sunk align-middle" aria-hidden="true" />n/a · fallback: method returned no scores</span>
        </p>
      </div>
    </div>
  );
}
