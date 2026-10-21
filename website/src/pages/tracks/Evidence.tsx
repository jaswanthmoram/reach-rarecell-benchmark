import { GLOBAL_STATS as G } from '../../data/benchmarkData';
import { asset, cx } from '../../lib/format';
import { ArrowUpRight, ICON_STROKE } from '../../ui/icons';
import { Reveal, useDrawSvg } from '../../ui/motion';
import { SectionHeader } from '../../ui/SectionHeader';
import { CNV_ROWS, CNV_STATS } from './model';
import { swatch } from './swatch';

const th = 'border-b border-line px-3 py-3 font-normal sm:px-4';
/** Topic changes get the long gap above (audit S-14). */
export const SECTION = 'mx-auto max-w-[1240px] px-4 sm:px-6';

/* Slope geometry, in viewBox units: AP 0 to 1 on both axes. */
const X1 = 40, X2 = 262, TOP = 22, BASE = 196;
const y = (ap: number) => BASE - ap * (BASE - TOP);
const LABELLED = new Set(['hvg_logreg']);

/** Each method's median AP with CNV labels (left) and without (right): every line falls to the same floor. */
/* SVG text scales with the chart: 11 units on phones (about 1:1) and 9 units on wide screens (the plot is ~1.4x). */
const TXT = 'text-[11px] lg:text-[9px]';

function CnvSlope() {
  const ref = useDrawSvg<SVGSVGElement>({ selector: '.slope', duration: 0.8, stagger: 0.05 });
  const floor = y(Math.max(...CNV_ROWS.map((c) => c.noAP)));
  return (
    <div className="m-0">
      <svg ref={ref} viewBox="0 0 360 222" className="block h-auto w-full" role="img"
        aria-label={`Slope chart: median Track A AP with CNV labels falls to ${CNV_STATS.band} without them, for every method`}>
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={X1} x2={X2} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth={1} />
            <text x={X1 - 8} y={y(t) + 3.5} textAnchor="end" className={`fill-[var(--ink-3)] font-mono ${TXT}`}>{t}</text>
          </g>
        ))}
        <line x1={X1} x2={X1} y1={TOP} y2={BASE} stroke="var(--line-strong)" strokeWidth={1} />
        <line x1={X2} x2={X2} y1={TOP} y2={BASE} stroke="var(--line-strong)" strokeWidth={1} />
        {CNV_ROWS.map((c) => (
          <line key={c.name} className="slope" x1={X1} y1={y(c.fullAP)} x2={X2} y2={y(c.noAP)} stroke={c.color}
            strokeWidth={c.name === 'FiRE' ? 2.25 : 1.5} strokeLinecap="round" strokeDasharray={c.ref ? '3 3' : undefined} />
        ))}
        {CNV_ROWS.filter((c) => LABELLED.has(c.name)).map((c) => (
          <text key={c.name} x={X1 + 8} y={y(c.fullAP) - 6} className={`fill-[var(--ink-2)] font-mono ${TXT}`}>{c.name} {c.full}</text>
        ))}
        <text x={X2 + 6} y={floor + 3.5} className={`fill-[var(--ink)] font-mono ${TXT}`}>{CNV_STATS.band}</text>
        <text x={X1} y={214} textAnchor="middle" className={`fill-[var(--ink-3)] ${TXT}`}>With CNV</text>
        <text x={X2} y={214} textAnchor="middle" className={`fill-[var(--ink-3)] ${TXT}`}>Without CNV</text>
      </svg>
    </div>
  );
}

/** Non-circularity check: proof Table 9a, median Track A AP with and without CNV labels. */
export function CnvCheck() {
  return (
    <section id="cnv" aria-labelledby="cnv-h" className="border-t border-line">
      <div className={cx(SECTION, 'py-16 lg:pb-24 lg:pt-32')}>
        <SectionHeader id="cnv-h" eyebrow="Table 9a" title="Do CNV-based labels favour CNV-sensitive methods?"
          lede="Median Track A AP for each method, scored with the CNV-based labels and again without them." />
        <figure className="m-0 grid items-start gap-x-14 gap-y-8 lg:grid-cols-12">
          <Reveal className="flex min-w-0 flex-col gap-6 lg:col-span-5">
            <CnvSlope />
            <dl className="m-0 grid grid-cols-2 gap-x-6 border-t border-line pt-4">
              <div className="row-span-3 grid min-w-0 grid-rows-subgrid gap-y-1">
                <dt className="self-end text-xs text-ink-3">Rank agreement, Spearman ρ</dt>
                <dd className="tabular m-0 text-2xl font-semibold tracking-[-0.02em]">{CNV_STATS.rho}</dd>
                <dd className="m-0 text-xs leading-[1.45] text-ink-2">Order with and without CNV labels, p = {CNV_STATS.p}</dd>
              </div>
              <div className="row-span-3 grid min-w-0 grid-rows-subgrid gap-y-1">
                <dt className="self-end text-xs text-ink-3">AP band without CNV</dt>
                <dd className="tabular m-0 text-2xl font-semibold tracking-[-0.02em]">{CNV_STATS.band}</dd>
                <dd className="m-0 text-xs leading-[1.45] text-ink-2">Every method falls to near chance ({CNV_STATS.fire}). Only the broad order is kept.</dd>
              </div>
            </dl>
          </Reveal>
          <div className="relative min-w-0 overflow-x-auto rounded-card border border-line bg-surface shadow-[var(--elev-1)] lg:col-span-7">
            <table className="w-full border-collapse text-sm sm:min-w-[480px]">
              <caption className="sr-only">Proof Table 9a: median Track A AP with and without CNV labels</caption>
              <thead>
                <tr className="text-left font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3">
                  <th scope="col" className={cx(th, 'max-sm:hidden')}>Key</th>
                  <th scope="col" className={th}>Method</th>
                  <th scope="col" className={cx(th, 'text-right')}>AP with CNV</th>
                  <th scope="col" className={cx(th, 'text-right')}>AP without CNV</th>
                </tr>
              </thead>
              <tbody>
                {CNV_ROWS.map((c) => (
                  <tr key={c.name} className={cx('border-t border-line transition-colors duration-[var(--dur-1)] hover:bg-[var(--row-hover)]', c.ref ? 'bg-canvas' : 'bg-surface')}>
                    <td className="px-4 py-[9px] font-mono text-[11px] text-ink-3 max-sm:hidden">{c.key}</td>
                    <th scope="row" className="px-3 py-[9px] text-left font-mono text-[13px] font-normal sm:px-4">
                      <span className="inline-flex items-center gap-2"><span style={swatch(c.color, c.ref)} />{c.name}</span>
                    </th>
                    <td className="tabular px-3 py-[9px] text-right font-mono text-[13px] sm:px-4">{c.full}</td>
                    <td className="tabular px-3 py-[9px] text-right font-mono text-[13px] text-ink-2 sm:px-4">{c.no}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <figcaption className="max-w-[78ch] text-xs leading-relaxed text-ink-2 lg:col-span-12">
            Chart: one line per method, from its median Track A AP with CNV labels to the value without them; the thick line is FiRE and dashed lines are reference methods. Table: the same values from proof Table 9a.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

const FIGS = [
  { n: 2, src: 'figures/paper/fig-2.webp', w: 1647, h: 1179, title: 'Design of the six evaluation tracks',
    alt: 'Paper Figure 2: the six REACH evaluation tracks, A to F, with their construction and unit counts.' },
  { n: 5, src: 'figures/paper/fig-5.webp', w: 1386, h: 1254, title: 'Track A vs B, label noise, null controls and calibration',
    alt: 'Paper Figure 5: Track A against Track B ranks, label-noise robustness, null-control false-positive rates and calibration.' },
];

export function PaperFigures() {
  return (
    <section id="figures" aria-labelledby="fig-h" className="border-t border-line">
      <div className={cx(SECTION, 'pb-20 pt-16 sm:pb-24 lg:pt-32')}>
        <SectionHeader id="fig-h" title="The tracks in the paper"
          lede={<>Figures 2 and 5 from the <a href={G.articleUrl} target="_blank" rel="noopener noreferrer" className="fx-underline text-accent-ink">Front. Bioinform. article</a>.</>} />
        <Reveal variant="mask" className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {FIGS.map((f) => (
            <figure key={f.n} className="m-0">
              <a href={asset(f.src)} target="_blank" rel="noopener noreferrer" aria-label={`Open Figure ${f.n} full size: ${f.title}`}
                className="fx-card group block">
                <span className="eyebrow flex items-center justify-between border-b border-line px-4 py-2.5 tracking-[0.06em]">
                  Figure {f.n} · Front. Bioinform. {G.year}
                  <ArrowUpRight size={14} strokeWidth={ICON_STROKE} aria-hidden="true" className="text-ink-3 transition-transform duration-[var(--dur-1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
                <span className="block aspect-[4/3] bg-canvas p-3">
                  <img src={asset(f.src)} width={f.w} height={f.h} alt={f.alt} loading="lazy" decoding="async" className="size-full object-contain" />
                </span>
                <span className="block rounded-b-card border-t border-line p-4 text-sm font-semibold text-ink">{f.title}</span>
              </a>
            </figure>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
