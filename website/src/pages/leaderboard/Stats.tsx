import { GLOBAL_STATS, PAIRWISE_COMPARISONS, type PairwiseComparison } from '../../data/benchmarkData';
import { cx, fmt } from '../../lib/format';
import { SectionHeader } from '../../ui/SectionHeader';
import { Reveal, useReveal } from '../../ui/motion';
import { BOARD_ORDER, cliffOf, magnitude, pairOf, rowOf, signed, tint } from './model';
import { CdStrip } from './CdStrip';
import { Dot, INNER, MONO_LABEL, SECTION, ScrollRegion } from './parts';

const G = GLOBAL_STATS;
const K = G.methodsIncluded;
const N = G.trackACommonUnits;

/* ---------- Global tests: the CD strip carries the picture, the statistics stay static text ---------- */
export function Omnibus() {
  const stats = [
    { k: <>Friedman <span className="normal-case">χ²</span></>, v: G.friedmanChi2.toFixed(2), note: `df ${K - 1} · p ${G.friedmanPAsPrinted} as printed · N = ${N} units, k = ${K} methods. Ranks differ.` },
    { k: 'Iman–Davenport F', v: G.imanDavenportF.toFixed(2), note: `df ${K - 1} and ${fmt.int((K - 1) * (N - 1))} · p ${G.imanDavenportPAsPrinted}. Agrees with Friedman.` },
    { k: 'Nemenyi critical difference', v: G.nemenyiCD.toFixed(2), note: 'Mean ranks closer than this cannot be separated (the bar in the strip).' },
    { k: <>Spearman <span className="normal-case">ρ</span>, Track B vs A</>, v: G.trackABSpearmanRho.toFixed(3), note: `p = ${G.trackABSpearmanP.toFixed(3)}. The synthetic rank does not predict the patient rank.` },
  ];
  return (
    <section id="tests" aria-labelledby="omni-h" className={SECTION}>
      <div className={INNER}>
        <SectionHeader id="omni-h" title="Do the methods differ at all?"
          lede={<>Before any pairwise claim: do within-unit ranks differ across the {N} common Track A units, and does the synthetic track predict the patient track?</>} />
        <Reveal className="grid gap-x-12 gap-y-10 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-7"><CdStrip /></div>
          <dl className="m-0 grid content-start gap-x-8 border-t border-line-strong sm:grid-cols-2 lg:col-span-5">
            {stats.map((st, i) => (
              <div key={i} className="flex flex-col gap-1 border-b border-line py-3.5">
                <dt className={`${MONO_LABEL} text-ink-2`}>{st.k}</dt>
                <dd className="m-0 font-mono text-xl font-semibold leading-tight tracking-[-0.01em] text-ink tabular-nums">{st.v}</dd>
                <dd className="m-0 text-xs leading-[1.5] text-ink-2">{st.note}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Pairwise ---------- */
const Badge = ({ ns }: { ns: boolean }) => (
  <span className={cx('rounded-chip px-1.5 py-0.5 font-mono text-[11px]', ns ? 'bg-accent-tint text-accent-ink' : 'bg-sunk text-ink-2')}>
    {ns ? 'not significant' : 'significant'}
  </span>
);

/** δ on a −1 to +1 axis: zero tick in the middle, faint |δ| 0.147 negligible band, the dot in the compared method's colour. */
function DeltaAxis({ d, row }: { d: number; row: NonNullable<ReturnType<typeof rowOf>> }) {
  const pos = (v: number) => `${(((v + 1) / 2) * 100).toFixed(2)}%`;
  return (
    <span aria-hidden="true" className="relative hidden h-4 lg:block">
      <span className="absolute inset-y-[5px] bg-sunk" style={{ left: pos(-0.147), right: `calc(100% - ${pos(0.147)})` }} />
      <span className="absolute inset-x-0 top-1/2 h-px bg-line-strong" />
      <span className="absolute inset-y-0.5 w-px bg-ink-3" style={{ left: '50%' }} />
      <span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: pos(d) }}><Dot row={row} size={row.isRef ? 10 : 9} /></span>
    </span>
  );
}

function PairLine({ p }: { p: PairwiseComparison }) {
  const a = rowOf(p.methodA);
  const b = rowOf(p.methodB);
  const d = cliffOf(p.methodA, p.methodB);
  const fdr = p.pAdjusted.replace(/\s*\(NS\)\s*/, '');
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-b border-line py-3.5 lg:grid-cols-[minmax(0,1fr)_280px_80px_150px] lg:gap-x-6">
      <span className="col-span-2 flex flex-wrap items-center gap-2.5 font-mono text-[13px] lg:col-span-1">
        {a && <Dot row={a} size={a.isRef ? 10 : 8} />}{p.methodA} <span className="text-ink-3">vs</span> {b && <Dot row={b} size={b.isRef ? 10 : 8} />}{p.methodB} <Badge ns={!p.significant} />
      </span>
      {d != null && b ? <DeltaAxis d={d} row={b} /> : <span className="hidden lg:block" />}
      <span className="font-mono text-xs text-ink-2 lg:text-right">δ <span className="text-ink tabular-nums">{d == null ? 'n/a' : signed(d)}</span></span>
      <span className="text-right font-mono text-xs text-ink-2 lg:text-left">BH-FDR <span className="text-ink">{fdr}</span></span>
    </li>
  );
}

/* Table 6b rows that print a BH-FDR value, ordered least to most separated. */
const TESTED = PAIRWISE_COMPARISONS.filter((p) => /\d/.test(p.pAdjusted));
const NOT_SIG = TESTED.filter((p) => !p.significant).sort((x, y) => Number.parseFloat(y.pAdjusted) - Number.parseFloat(x.pAdjusted));
const SIG = TESTED.filter((p) => p.significant).sort((x, y) => Math.abs(cliffOf(y.methodA, y.methodB) ?? 0) - Math.abs(cliffOf(x.methodA, x.methodB) ?? 0));

/* Cliff's δ matrix, upper triangle in board order: row method versus a method listed after it. */
const ORDER = BOARD_ORDER;
/** Pairs shown in the matrix that are not significant after BH-FDR (Table 6b), in board order. */
const NS_PAIRS: [string, string][] = ORDER.flatMap((r, i) => ORDER.slice(i + 1)
  .filter((c) => cliffOf(r.name, c.name) != null && pairOf(r.name, c.name)?.significant === false)
  .map((c): [string, string] => [r.name, c.name]));
const fill = (d: number) => tint(d >= 0 ? 'var(--accent)' : 'var(--cell)', Math.abs(d));

function CliffMatrix() {
  const rowsRef = useReveal<HTMLTableSectionElement>({ y: 0, stagger: 0.03, duration: 0.3, start: 'top 90%' });
  const counts = { negligible: 0, small: 0, medium: 0, large: 0 };
  ORDER.forEach((r, i) => ORDER.slice(i + 1).forEach((c) => { const d = cliffOf(r.name, c.name); if (d != null) counts[magnitude(d)] += 1; }));
  return (
    <div className="mt-16">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="m-0 text-xl font-semibold tracking-[-0.015em]">Cliff&apos;s δ, every pair (Table 7)</h3>
        <p className="m-0 font-mono text-[11px] text-ink-3">
          {Object.values(counts).reduce((s, n) => s + n, 0)} pairs · board order · positive means the row method scores higher
        </p>
      </div>
      <div className="mt-3 grid items-start gap-8 xl:grid-cols-12 xl:gap-12">
      <ScrollRegion className="min-w-0 xl:col-span-8" label="Cliff's delta matrix, scrollable" hint={`Scroll sideways for all ${K} methods`}>
        <table className="w-full min-w-[700px] table-fixed border-separate border-spacing-0.5 font-mono text-[12px]">
          <caption className="sr-only">Cliff&apos;s delta of Track A per-unit AP for each pair, row method versus column method, in board order. Dashed cells are not significant after BH-FDR correction (Table 6b).</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-canvas"><span className="sr-only">Row method</span></th>
              {ORDER.slice(1).map((c) => (
                <th key={c.id} scope="col" className="h-36 w-14 px-0 pb-2 align-bottom font-normal">
                  <span className="mx-auto flex w-max flex-col-reverse items-center gap-2">
                    <Dot row={c} size={8} />
                    <span className="block rotate-180 whitespace-nowrap text-ink-2 [writing-mode:vertical-rl]">{c.name}</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody ref={rowsRef}>
            {ORDER.slice(0, -1).map((r, i) => (
              <tr key={r.id}>
                <th scope="row" className="sticky left-0 z-10 whitespace-nowrap bg-canvas pr-3 text-right font-normal">
                  <span className="flex items-center justify-end gap-2 text-xs text-ink">{r.name}<Dot row={r} size={8} /></span>
                </th>
                {ORDER.slice(1).map((c, j) => {
                  if (j < i) return <td key={c.id} className="relative h-12"><span className="sr-only">not shown</span></td>;
                  const d = cliffOf(r.name, c.name);
                  if (d == null) return <td key={c.id} className="h-12 text-center text-ink-3">n/a</td>;
                  const ns = pairOf(r.name, c.name)?.significant === false;
                  const text = `${r.name} vs ${c.name}: δ ${signed(d)}, ${magnitude(d)}${ns ? ', not significant' : ''}`;
                  return (
                    <td key={c.id} title={text} aria-label={text} style={{ background: fill(d) }}
                      className={cx('h-12 text-center text-ink tabular-nums', ns && 'outline outline-1 -outline-offset-2 outline-dashed outline-ink')}>
                      {ns && <span aria-hidden="true" className="block text-[11px] leading-none text-ink-2">ns</span>}
                      <span aria-hidden="true">{signed(d)}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollRegion>
      <div className="xl:col-span-4 xl:self-stretch xl:pt-[146px]">
      <div className="xl:sticky xl:top-[calc(var(--header-h,64px)+var(--section-nav-h,0px)+16px)]"><Reveal variant="mask"><aside aria-label="How to read the matrix" className="card fx-hairline-gradient flex flex-col gap-5 p-5">
        <div>
          <p className="eyebrow m-0">Reading the matrix</p>
          <p className="m-0 mt-2 text-sm leading-relaxed text-ink-2">Each cell compares the row method with the column method on per-unit Track A AP. Positive δ means the row method scores higher.</p>
        </div>
        <div>
          <div aria-hidden="true" className="h-2.5 rounded-full" style={{ background: `linear-gradient(90deg, ${[-1, -0.5, 0, 0.5, 1].map((v) => fill(v)).join(', ')})` }} />
          <div className="mt-1.5 flex justify-between font-mono text-[11px] text-ink-3"><span>−1</span><span>0</span><span>+1</span></div>
        </div>
        <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-[11px]">
          {(Object.keys(counts) as (keyof typeof counts)[]).map((k) => (
            <div key={k} className="flex justify-between gap-2"><dt className="text-ink-3">{k}</dt><dd className="m-0 text-ink tabular-nums">{counts[k]}</dd></div>
          ))}
        </dl>
        <p className="m-0 font-mono text-[11px] text-ink-3">|δ| thresholds 0.147, 0.33, 0.474</p>
        {NS_PAIRS.length > 0 && (
          <div className="border-t border-line pt-4">
            <p className="m-0 flex items-center gap-2 text-sm font-medium text-ink"><span aria-hidden="true" className="inline-block size-3 rounded-[2px] outline outline-1 -outline-offset-1 outline-dashed outline-ink" />Not significant (BH-FDR)</p>
            <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0 font-mono text-[12px] text-ink-2">
              {NS_PAIRS.map(([a, b]) => <li key={`${a}-${b}`}>{a} vs {b}</li>)}
            </ul>
          </div>
        )}
      </aside></Reveal></div>
      </div>
      </div>
    </div>
  );
}

export function Pairwise() {
  return (
    <section id="pairwise" aria-labelledby="pw-h" className={SECTION}>
      <div className={INNER}>
        <SectionHeader id="pw-h" eyebrow="Tables 6b and 7" title="Which differences hold up"
          lede={<>Cliff&apos;s δ for every pair of methods (Table 7), and Wilcoxon signed-rank tests of every method against FiRE on the {N} common units (Table 6b), including FiRE against the naive expression-burden baseline.</>} />
        <p className="m-0 hidden justify-end font-mono text-[11px] text-ink-3 lg:flex lg:pr-[278px]">
          <span className="flex w-[280px] justify-between"><span>δ −1</span><span>0</span><span>+1</span></span>
        </p>
        <Reveal className="grid gap-y-10">
          <div>
            <h3 className="m-0 text-base font-semibold">Not significantly different</h3>
            <ul className="m-0 mt-2 list-none border-t border-line-strong p-0">{NOT_SIG.map((p) => <PairLine key={p.methodB} p={p} />)}</ul>
          </div>
          <div>
            <h3 className="m-0 text-base font-semibold">Significantly different from FiRE</h3>
            <ul className="m-0 mt-2 list-none border-t border-line-strong p-0">{SIG.map((p) => <PairLine key={p.methodB} p={p} />)}</ul>
          </div>
        </Reveal>
        <p className="m-0 mt-3 max-w-[80ch] text-xs leading-[1.6] text-ink-2">
          δ is the all-unit effect size from Table 7; BH-FDR is from the Wilcoxon tests in Table 6b. A significant test with a negligible δ means the difference is consistent but small.
        </p>
        <CliffMatrix />
      </div>
    </section>
  );
}

