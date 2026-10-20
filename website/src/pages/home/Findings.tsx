import type { ReactNode } from 'react';
import { href } from '../../app/router';
import type { MethodResult } from '../../data/benchmarkData';
import { Container, Icon, MethodDot, fmt, methodColor, type IconName } from '../../ui';
import {
  BASELINE, CEILING, CEILING_VS_FIRE, EXPLORATORY, FIRE, FIRE_VS_EXPR, G, METHOD_COUNT, ORDERED, RAREQ, SMF,
  TRACK_F_COLLAPSED, TRACK_F_LOW, bootCI, fdr, isRef, signed, trackLink,
} from './facts';

interface Finding { n: string; icon: IconName; figure: string; unit: ReactNode; title: string; body: ReactNode; to: string; cta: string; wide: boolean; viz?: ReactNode }

const places = (n: number) => `${n} ${n === 1 ? 'place' : 'places'}`;
const pos = (v: number) => `${Math.max(0, Math.min(1, v)) * 100}%`;

/** Two methods on one 0 to 1 AP axis, then a zoom on their 95% bootstrap intervals: the overlap is the finding. */
function OverlapAxis({ a, b }: { a: MethodResult; b: MethodResult }) {
  const rows = [{ m: a, ci: bootCI(a), dashed: false }, { m: b, ci: bootCI(b), dashed: true }];
  const lo = Math.floor((Math.min(...rows.map((r) => r.ci[0])) - 0.02) * 20) / 20;
  const hi = Math.ceil((Math.max(...rows.map((r) => r.ci[1])) + 0.02) * 20) / 20;
  const z = (v: number) => pos((v - lo) / (hi - lo));
  const ticks = Array.from({ length: Math.round((hi - lo) / 0.05) + 1 }, (_, i) => lo + i * 0.05);
  const ov: [number, number] = [Math.max(rows[0].ci[0], rows[1].ci[0]), Math.min(rows[0].ci[1], rows[1].ci[1])];
  return (
    <div className="mt-8 grid gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <div role="img" aria-label={`${a.method} median AP ${fmt.ap(a.medianAP)} and ${b.method} median AP ${fmt.ap(b.medianAP)} on a 0 to 1 axis`}>
        <p className="mb-3 font-mono text-[11px] text-ink-3">median AP, 0 to 1</p>
        <div className="relative h-14">
          <span className="absolute top-0 -translate-x-full whitespace-nowrap pr-2 font-mono text-[11px] text-ink tabular" style={{ left: pos(a.medianAP) }}>
            {a.method} {fmt.ap(a.medianAP)}
          </span>
          <div className="absolute inset-x-0 top-1/2 h-px bg-line-strong" />
          {[0, 0.5, 1].map((t) => (
            <span key={t} className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-line-strong" style={{ left: pos(t) }} />
          ))}
          {ov[0] < ov[1] && <span className="absolute top-1/2 h-3 -translate-y-1/2 rounded-[2px] bg-ink/10" style={{ left: pos(lo), width: `calc(${pos(hi)} - ${pos(lo)})` }} />}
          <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-canvas" style={{ left: pos(a.medianAP), background: methodColor(a.id) }} />
          <span className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-dashed bg-canvas/60" style={{ left: pos(b.medianAP), borderColor: methodColor(b.id) }} />
          <span className="absolute bottom-0 whitespace-nowrap pl-2 font-mono text-[11px] text-ink-2 tabular" style={{ left: pos(b.medianAP) }}>
            {b.method} {fmt.ap(b.medianAP)}
          </span>
        </div>
        <div className="mt-1 flex justify-between font-mono text-[11px] text-ink-3 tabular"><span>0</span><span>0.5</span><span>1.0</span></div>
      </div>

      <figure className="min-w-0">
        <figcaption className="mb-3 font-mono text-[11px] text-ink-3">zoom {lo.toFixed(2)} to {hi.toFixed(2)} · bootstrap mean AP, 95% interval</figcaption>
        <div className="relative">
          {ov[0] < ov[1] && (
            <span aria-hidden="true" className="absolute inset-y-0 rounded-[2px] bg-ink/[0.06] dark:bg-ink/10" style={{ left: `calc(8.5rem + (100% - 8.5rem) * ${(ov[0] - lo) / (hi - lo)})`, width: `calc((100% - 8.5rem) * ${(ov[1] - ov[0]) / (hi - lo)})` }} />
          )}
          <ul className="relative space-y-1">
            {rows.map(({ m, ci, dashed }) => (
              <li key={m.id} className="grid h-8 grid-cols-[8.5rem_minmax(0,1fr)] items-center">
                <span className="flex min-w-0 items-center gap-2 font-mono text-xs text-ink"><MethodDot id={m.id} dashed={dashed} /><span className="truncate">{m.method}</span></span>
                <span className="relative h-full" role="img" aria-label={`${m.method}: bootstrap mean AP ${fmt.ap(m.bootstrapMeanAP)}, 95% interval ${fmt.ap(ci[0])} to ${fmt.ap(ci[1])}`}>
                  <span className={`absolute top-1/2 -translate-y-1/2 ${dashed ? 'border-t-[1.5px] border-dashed' : 'h-[1.5px]'}`}
                    style={{ left: z(ci[0]), width: `calc(${z(ci[1])} - ${z(ci[0])})`, ...(dashed ? { borderColor: methodColor(m.id) } : { background: methodColor(m.id) }) }} />
                  {ci.map((v) => <span key={v} className="absolute top-1/2 h-2.5 w-[1.5px] -translate-x-1/2 -translate-y-1/2" style={{ left: z(v), background: methodColor(m.id) }} />)}
                  <span className={`absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${dashed ? 'border-[1.5px] border-dashed bg-canvas' : 'ring-2 ring-canvas'}`}
                    style={{ left: z(m.bootstrapMeanAP), ...(dashed ? { borderColor: methodColor(m.id) } : { background: methodColor(m.id) }) }} />
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative ml-[8.5rem] mt-1 h-4 font-mono text-[11px] text-ink-3 tabular" aria-hidden="true">
          {ticks.map((t) => <span key={t} className="absolute top-0 -translate-x-1/2" style={{ left: z(t) }}>{t.toFixed(2)}</span>)}
        </div>
        {ov[0] < ov[1] && <p className="mt-2 font-mono text-[11px] text-ink-2 tabular">intervals overlap {fmt.ap(ov[0])} to {fmt.ap(ov[1])}</p>}
      </figure>
    </div>
  );
}

/** Track A median AP to Track F (0.1% tier) median AP, one line per method. */
function DropLines({ rows }: { rows: MethodResult[] }) {
  return (
    <div className="mt-8">
      <ul className="space-y-2.5">
        {rows.map((m) => {
          const [lo, hi] = [Math.min(m.medianAP, m.trackF01AP), Math.max(m.medianAP, m.trackF01AP)];
          const ref = isRef(m);
          const c = methodColor(m.id);
          return (
            <li key={m.id} className="grid grid-cols-[9.5rem_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
              <span className="flex min-w-0 items-center gap-2 font-mono text-xs text-ink">
                <MethodDot id={m.id} dashed={ref} /><span className="truncate">{m.method}</span>
              </span>
              <span className="relative h-5" role="img" aria-label={`${m.method}: Track A ${fmt.ap(m.medianAP)}, Track F at 0.1% ${fmt.ap(m.trackF01AP)}`}>
                <span className="absolute inset-x-0 top-1/2 h-px bg-line" />
                {ref
                  ? <span className="absolute top-1/2 -translate-y-1/2 border-t-[1.5px] border-dashed opacity-70" style={{ left: pos(lo), width: `calc(${pos(hi)} - ${pos(lo)})`, borderColor: c }} />
                  : <span className="absolute top-1/2 h-0.5 -translate-y-1/2 rounded-full opacity-50" style={{ left: pos(lo), width: `calc(${pos(hi)} - ${pos(lo)})`, background: c }} />}
                <span className={`absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] bg-canvas ${ref ? 'border-dashed' : ''}`} style={{ left: pos(m.medianAP), borderColor: c }} />
                {/* Reference rows: a dashed ring around the filled Track F dot keeps the reference identity. */}
                <span className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${ref ? 'size-3.5 border-[1.5px] border-dashed bg-clip-content p-[2px]' : 'size-2.5 ring-2 ring-canvas'}`}
                  style={{ left: pos(m.trackF01AP), backgroundColor: c, ...(ref ? { borderColor: c } : {}) }} />
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-ink-3">
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full border-[1.5px] border-ink-3" />Track A median</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-ink-3" />Track F, 0.1% tier</span>
        <span>axis 0 to 1 AP</span>
      </p>
    </div>
  );
}

/**
 * Places gained or lost from Track A to Track B, for all methods, in the site-wide order (ceiling, ranked 1 to 6, references). Shifts only: no 1 to 10 positions are printed
 * (DESIGN v2.2). Two highlighted bars carry the finding; references keep their dashed identity.
 */
function RankShift({ focus }: { focus: string[] }) {
  const rows = ORDERED.map((m) => ({ m, shift: m.trackARank - m.trackBRank }));
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.shift)));
  const w = (s: number) => `${(Math.abs(s) / max) * 50}%`;
  return (
    <figure className="mt-8">
      <figcaption className="mb-3 font-mono text-[11px] leading-relaxed text-ink-2">
        Within-unit rank, all {rows.length} methods (Figure 4b, Table 1b)
      </figcaption>
      <ul className="space-y-0.5">
        {rows.map(({ m, shift }) => {
          const on = focus.includes(m.id);
          const ref = isRef(m);
          const fill = ref
            ? { border: `1.5px dashed ${methodColor(m.id)}` }
            : { background: methodColor(m.id) };
          return (
            <li key={m.id} className="grid grid-cols-[8.5rem_minmax(0,1fr)_2rem] items-center gap-3">
              <span className={`flex min-w-0 items-center gap-2 font-mono text-[11px] ${on ? 'text-ink' : 'text-ink-2'}`}>
                <MethodDot id={m.id} size={7} dashed={ref} /><span className="truncate">{m.method}</span>
                <span className="sr-only">{shift === 0 ? ': no change' : `: ${shift > 0 ? 'gains' : 'loses'} ${places(Math.abs(shift))}`}</span>
              </span>
              <span aria-hidden="true" className="relative h-3">
                <span className="absolute inset-y-0 left-1/2 w-px bg-line-strong" />
                {shift !== 0 && (
                  <span className={`absolute inset-y-0.5 rounded-[2px] transition-opacity duration-150 ${on ? 'opacity-100' : 'opacity-40 dark:opacity-55'}`}
                    style={{ ...fill, width: w(shift), ...(shift > 0 ? { left: '50%' } : { right: '50%' }) }} />
                )}
              </span>
              <span aria-hidden="true" className={`text-right font-mono text-[11px] tabular ${on ? 'font-medium text-ink' : 'text-ink-3'}`}>{signed(shift, 0)}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 grid grid-cols-[8.5rem_minmax(0,1fr)_2rem] gap-3 font-mono text-[11px] text-ink-3" aria-hidden="true">
        <span />
        <span className="flex justify-between gap-2"><span>lost</span><span className="hidden whitespace-nowrap sm:inline">places, A to B</span><span>gained</span></span>
        <span />
      </p>
    </figure>
  );
}

/** Mean Track A AP of the supervised ceiling against FiRE; the gap is the finding. */
function GapBars({ ceiling, fire }: { ceiling: MethodResult; fire: MethodResult }) {
  return (
    <div className="mt-8 max-w-sm space-y-3">
      {[{ m: ceiling, dashed: true }, { m: fire, dashed: false }].map(({ m, dashed }) => (
        <div key={m.id} className="grid grid-cols-[6.5rem_minmax(0,1fr)_3rem] items-center gap-3">
          <span className="flex min-w-0 items-center gap-2 font-mono text-xs text-ink"><MethodDot id={m.id} dashed={dashed} /><span className="truncate">{m.method}</span></span>
          <span className="relative h-2.5 rounded-full bg-sunk" role="img" aria-label={`${m.method}: mean AP ${fmt.ap(m.meanAP)}`}>
            <span className={`absolute inset-y-0 left-0 rounded-full ${dashed ? 'border-[1.5px] border-dashed' : ''}`}
              style={{ width: pos(m.meanAP), ...(dashed ? { borderColor: methodColor(m.id) } : { background: methodColor(m.id) }) }} />
          </span>
          <span className="text-right font-mono text-xs text-ink-2 tabular">{fmt.ap(m.meanAP)}</span>
        </div>
      ))}
      <p className="font-mono text-[11px] text-ink-3">mean AP, Track A · axis 0 to 1</p>
    </div>
  );
}

function buildFindings(): Finding[] {
  const out: Finding[] = [];
  if (FIRE_VS_EXPR && FIRE && BASELINE) out.push({
    n: '01', icon: 'scales', wide: true, figure: fdr(FIRE_VS_EXPR.pAdjusted), unit: 'BH-FDR · FiRE vs expr_threshold',
    title: 'The highest-ranked published detector is not significantly better than a naive baseline.',
    body: <>FiRE reaches {fmt.ap(FIRE.medianAP)} median AP on Track A; the total-UMI expression baseline reaches {fmt.ap(BASELINE.medianAP)}. Wilcoxon p = {FIRE_VS_EXPR.pRaw}, Cliff’s δ {signed(FIRE_VS_EXPR.cliffsDelta)}: a negligible difference.</>,
    to: href('/leaderboard'), cta: 'See the pairwise tests',
    viz: <OverlapAxis a={FIRE} b={BASELINE} />,
  });
  if (RAREQ && BASELINE) out.push({
    n: '02', icon: 'chart-scatter', wide: false, figure: `ρ = ${G.trackABSpearmanRho.toFixed(3)}`,
    unit: <>Spearman · Track A vs B ranks · p = {G.trackABSpearmanP}</>,
    title: 'Synthetic benchmarks do not predict real rankings.',
    body: <>Across all {METHOD_COUNT} methods, RareQ gains {places(RAREQ.trackARank - RAREQ.trackBRank)} on simulated Track B while the expression baseline loses {places(BASELINE.trackBRank - BASELINE.trackARank)}. A near-zero correlation means a synthetic score says little about patient-derived performance.</>,
    to: trackLink('B'), cta: 'Open Track B',
    viz: <RankShift focus={[RAREQ.id, BASELINE.id]} />,
  });
  if (CEILING_VS_FIRE && CEILING) out.push({
    n: '03', icon: 'target', wide: false, figure: signed(CEILING_VS_FIRE.meanDiff), unit: 'mean AP gap · supervised ceiling vs FiRE',
    title: 'Unsupervised detectors sit far below the supervised ceiling.',
    body: <>A logistic regression trained on the labels reaches {fmt.ap(CEILING.medianAP)} median AP (Cliff’s δ {signed(CEILING_VS_FIRE.cliffsDelta)} vs FiRE). It needs ground truth, and it over-flags pure background (Track C null FPR {fmt.ap(CEILING.nullFPRate)}).</>,
    to: href('/leaderboard'), cta: 'See the reference rows',
    viz: FIRE && <GapBars ceiling={CEILING} fire={FIRE} />,
  });
  if (SMF && FIRE) out.push({
    n: '04', icon: 'dna', wide: true, figure: `${TRACK_F_COLLAPSED} of ${METHOD_COUNT}`,
    unit: <>methods at median AP ≤ {TRACK_F_LOW} · Track F, 0.1% tier</>,
    title: 'Remove lineage contrast and most detectors fail.',
    body: <>Track F spikes malignant epithelium into normal epithelium. At 0.1% prevalence only scMalignantFinder holds up ({fmt.ap(SMF.trackF01AP)}, on crc_lee only, so not to be generalised); FiRE drops to {fmt.ap(FIRE.trackF01AP)}. Track A partly measures epithelial-vs-immune contrast.</>,
    to: trackLink('F'), cta: 'Inspect Track F',
    viz: <DropLines rows={ORDERED.filter((m) => [FIRE, EXPLORATORY, CEILING, SMF].includes(m))} />,
  });
  return out;
}

const SPAN = ['md:col-span-7', 'md:col-span-5', 'md:col-span-5', 'md:col-span-7'];

export default function Findings() {
  const findings = buildFindings();
  return (
    <section id="findings" aria-labelledby="findings-h" className="pb-20 pt-16 md:pb-28 md:pt-20">
      <Container>
        <div className="reveal mb-12 grid gap-6 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <p className="label mb-3">Findings · {findings.length}</p>
            <h2 id="findings-h" className="balance text-3xl font-semibold tracking-[-0.025em] text-ink md:text-[2.75rem] md:leading-[1.08]">What the benchmark shows</h2>
          </div>
          <p className="text-base leading-relaxed text-ink-2 md:col-span-5">
            When a pairwise test is not significant, the order between those methods is reported as unsettled.
            “Rare” here means few malignant cells among immune, stromal and normal cells.
          </p>
        </div>

        <ol className="grid gap-px overflow-hidden rounded-card border border-line bg-line md:grid-cols-12">
          {findings.map((f, i) => (
            <li key={f.n} className={`reveal flex flex-col bg-canvas p-6 sm:p-8 lg:p-10 ${SPAN[i] ?? 'md:col-span-6'}`}>
              <div className="flex items-start justify-between gap-4">
                <span className="inline-flex items-center gap-2.5">
                  <Icon name={f.icon} size={18} className="text-ink-3" />
                  <span className="font-mono text-xs text-ink-3">{f.n}</span>
                </span>
                <span className="label max-w-[30ch] text-right">{f.unit}</span>
              </div>
              <p className={`mt-8 font-semibold tracking-[-0.04em] text-ink tabular ${f.wide ? 'text-5xl md:text-[4.25rem] md:leading-none' : 'text-4xl md:text-5xl'}`}>{f.figure}</p>
              {f.viz}
              <h3 className="balance mt-8 max-w-[34ch] text-lg font-semibold leading-snug tracking-[-0.015em] text-ink md:text-xl">{f.title}</h3>
              <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-ink-2">{f.body}</p>
              <a href={f.to} className="group mt-auto inline-flex min-h-11 items-center gap-1.5 self-start pt-6 text-sm font-medium text-accent hover:underline">
                {f.cta}<Icon name="arrow-right" size={14} className="transition-transform duration-150 group-hover:translate-x-0.5" />
              </a>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
