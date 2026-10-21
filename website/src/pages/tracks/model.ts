/* Tracks page model: every number below is read from benchmarkData.ts; the board's curated copy stays as written. */
import { CIRCULARITY_DATA, GLOBAL_STATS as G, LEADERBOARD_DATA, TRACK_E_NOISE_CONDITIONS, type MethodResult } from '../../data/benchmarkData';
import { fmt, methodColor } from '../../lib/format';

export const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
export type Letter = (typeof LETTERS)[number];

/** `?track=` value to a track letter; unknown or missing letters fall back to Track A (States board). */
export function parseLetter(q: string | null): Letter {
  const u = (q ?? '').trim().toUpperCase();
  return (LETTERS as readonly string[]).includes(u) ? (u as Letter) : 'A';
}

export const tabId = (l: Letter) => `track-tab-${l.toLowerCase()}`;
export const PANEL_ID = 'track-panel';

/* ---------- Methods, in the board ranking order ---------- */

export interface MethodRow { name: string; key: string; ref: boolean; color: string; head: string; r: MethodResult }

const byName = (name: string): MethodResult => {
  const m = LEADERBOARD_DATA.find((x) => x.method === name);
  if (!m) throw new Error(`benchmarkData: method ${name} is missing from LEADERBOARD_DATA`);
  return m;
};
const row = (name: string, key: string, ref: boolean, head = ''): MethodRow => ({ name, key, ref, color: methodColor(name), head, r: byName(name) });

const RANKED = LEADERBOARD_DATA.filter((m) => m.publishedRankNum != null).sort((a, b) => (a.publishedRankNum ?? 0) - (b.publishedRankNum ?? 0));

/** hvg_logreg (ceiling), ranks 1 to 6, then CaSee, expr_threshold, random_baseline. */
export const METHODS: MethodRow[] = [
  row('hvg_logreg', 'ceiling', true, 'Supervised ceiling, not ranked'),
  ...RANKED.map((m, i) => row(m.method, String(m.publishedRankNum), false, i === 0 ? `Ranked detectors, 1 to ${RANKED.length}` : '')),
  row('CaSee', 'exploratory', true, 'Reference methods, not ranked'),
  row('expr_threshold', 'naive', true),
  row('random_baseline', 'floor', true),
];

const CEILING = byName('hvg_logreg');
const UNSUPERVISED = METHODS.filter((m) => m.name !== 'hvg_logreg').map((m) => m.r);
const fpr = (v: number) => v.toFixed(4);
const signed = (v: number, d = 3) => `${v < 0 ? '−' : '+'}${Math.abs(v).toFixed(d)}`;
const list = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const byDesc = (f: (m: MethodResult) => number) => (a: MethodResult, b: MethodResult) => f(b) - f(a);

/* ---------- Charts ---------- */

export interface ChartMark { left: number; filled: boolean }
export interface ChartRow { id: string; head: string; key: string; name: string; color: string; ref: boolean; marks: ChartMark[]; seg: [number, number] | null; value: string; said: string }
export interface Chart { title: string; valueCol: string; legend: [string, string] | null; ticks: string[]; rows: ChartRow[]; caption: string }

const clamp = (v: number) => Math.max(0, Math.min(100, v));
const UNIT_TICKS = ['0', '0.25', '0.5', '0.75', '1'];

function dotRows(value: (m: MethodResult) => number, text: (m: MethodResult) => string, max: number): ChartRow[] {
  return METHODS.map((m) => ({
    id: m.name, head: m.head, key: m.key, name: m.name, color: m.color, ref: m.ref,
    marks: [{ left: clamp((value(m.r) / max) * 100), filled: !m.ref }], seg: null,
    value: text(m.r), said: `${m.name}: ${text(m.r)}`,
  }));
}

/** Hollow first value, filled second value, joined by a segment (Tracks B and F). */
function pairRows(a: (m: MethodResult) => number, b: (m: MethodResult) => number, pos: (v: number) => number, text: (m: MethodResult) => string): ChartRow[] {
  return METHODS.map((m) => {
    const pa = clamp(pos(a(m.r))), pb = clamp(pos(b(m.r)));
    return {
      id: m.name, head: m.head, key: m.key, name: m.name, color: m.color, ref: m.ref,
      marks: [{ left: pa, filled: false }, { left: pb, filled: true }], seg: Math.abs(pa - pb) > 0.5 ? [Math.min(pa, pb), Math.abs(pa - pb)] : null,
      value: text(m.r), said: `${m.name}: ${text(m.r)}`,
    };
  });
}

const NOISE_LABEL: Record<string, string> = { clean: 'Clean (0% noise)', fn_30: '30% Pos → Bg', fp_30: '30% Bg → Pos', sym_10: '10% symmetric flip', sym_20: '20% symmetric flip' };
const noise = (code: string) => {
  const n = TRACK_E_NOISE_CONDITIONS.find((x) => x.code === code);
  if (!n) throw new Error(`benchmarkData: Track E condition ${code} is missing`);
  return n;
};

const CHARTS: Record<Letter, () => Chart> = {
  A: () => ({
    title: 'Median AP per method, Track A', valueCol: '64px', legend: null, ticks: ['0', '0.2', '0.4', '0.6'],
    rows: dotRows((m) => m.medianAP, (m) => fmt.ap(m.medianAP), 0.6),
    caption: `Median AP over fallback-filtered Track A units (${G.trackAUnits}, or ${G.trackACommonUnits} for scCAD and DeepScena). Dashed marks are reference methods. The axis stops at 0.6, so the ceiling (${fmt.ap(CEILING.medianAP)}) is pinned at its right edge.`,
  }),
  B: () => ({
    title: `Within-unit rank, all ${METHODS.length} methods (Figure 4b)`, valueCol: '72px', legend: ['Track A rank', 'Track B rank'], ticks: ['1', '4', '7', '10'],
    rows: pairRows((m) => m.trackARank, (m) => m.trackBRank, (r) => ((r - 1) / (METHODS.length - 1)) * 100, (m) => `${m.trackARank} → ${m.trackBRank}`),
    caption: 'Mean within-unit rank (rank 1 at left), Track A real spike-ins against Track B Splatter units. The repository records no Track B AP per method, so ranks are the published view.',
  }),
  C: () => ({
    title: 'Mean false-positive rate on null units', valueCol: '64px', legend: null, ticks: UNIT_TICKS,
    rows: dotRows((m) => m.nullFPRate, (m) => fpr(m.nullFPRate), 1),
    caption: `Mean FPR over ${G.trackCUnits} background-only units (Table 8). Lower is better. Rows keep the Track A leaderboard order, since Track C ranks nothing.`,
  }),
  D: () => ({
    title: 'Mean AP on natural blood and CTC units', valueCol: '64px', legend: null, ticks: UNIT_TICKS,
    rows: dotRows((m) => m.trackDAP, (m) => fmt.ap(m.trackDAP), 1),
    caption: `Mean AP over ${G.trackDUnits} natural-prevalence units (mm_ledergor, breast_ctc_szczerba), from sens4_track_d_natural.csv. The paper prints no Track D numbers.`,
  }),
  E: () => ({
    title: 'hvg_logreg under label noise', valueCol: '132px', legend: null, ticks: UNIT_TICKS,
    rows: TRACK_E_NOISE_CONDITIONS.map((n, i) => {
      const name = NOISE_LABEL[n.code] ?? n.condition;
      const value = `${fmt.ap(n.meanAP)} · RI ${n.robustnessIndex.toFixed(3)}`;
      return {
        id: n.code, head: i === 0 ? 'hvg_logreg, supervised ceiling' : '', key: n.code === 'clean' ? 'clean' : 'noisy', name,
        color: methodColor('hvg_logreg'), ref: true, marks: [{ left: clamp(n.meanAP * 100), filled: false }], seg: null,
        value, said: `${name}: mean AP ${fmt.ap(n.meanAP)}, RI ${n.robustnessIndex.toFixed(3)}`,
      };
    }),
    caption: `Mean AP of the supervised ceiling over Track A units under each label condition (${G.trackEUnits} units in total). RI is the robustness index, noisy AP divided by clean AP.`,
  }),
  F: () => ({
    title: 'Track A median AP vs Track F median AP at 0.1%', valueCol: '120px', legend: ['Track A', 'Track F, 0.1%'], ticks: UNIT_TICKS,
    rows: pairRows((m) => m.medianAP, (m) => m.trackF01AP, (v) => v * 100, (m) => `${fmt.ap(m.medianAP)} → ${fmt.ap(m.trackF01AP)}`),
    caption: 'Hollow: Track A median AP. Filled: Track F median AP at 0.1% prevalence on crc_lee (Table 5, 5 replicates per tier).',
  }),
};
export const chartFor = (l: Letter): Chart => CHARTS[l]();

/* ---------- Track definitions ---------- */

export interface Stat { label: string; value: string; sub: string }
export interface TopItem { name: string; color: string; ref: boolean; value: string; note: string }
export interface Top { label: string; items: TopItem[]; note: string; link: boolean }
export interface TrackDef {
  letter: Letter; code: string; short: string; name: string; units: number; headline: string; reading: string;
  subtitle: string; note: string; finding: string; objective: string; methodology: string; stats: Stat[]; top: Top | null;
}

const topItem = (m: MethodRow | undefined, value: string, note: string): TopItem[] => (m ? [{ name: m.name, color: m.color, ref: m.ref, value, note }] : []);
const meth = (name: string) => METHODS.find((m) => m.name === name);

/* Track A */
const slopes = [...LEADERBOARD_DATA].sort(byDesc((m) => m.nAPSlope));
const firstRanked = RANKED[0];

/* Track B: rank moves from Track A to Track B (positive = rises). */
const moves = LEADERBOARD_DATA.map((m) => ({ name: m.method, d: m.trackARank - m.trackBRank }));
const maxRise = Math.max(...moves.map((m) => m.d));
const maxDrop = Math.min(...moves.map((m) => m.d));

/* Track C */
const fprs = UNSUPERVISED.map((m) => m.nullFPRate);
const lowestFpr = [...UNSUPERVISED].sort((a, b) => a.nullFPRate - b.nullFPRate).slice(0, 2);
const minBh = Math.min(...UNSUPERVISED.map((m) => m.nullFPBHFDR).filter((v): v is number => v != null));

/* Track D */
const dRanked = [...RANKED].sort(byDesc((m) => m.trackDAP));

/* Track E */
const [clean, fn30, fp30, sym10, sym20] = ['clean', 'fn_30', 'fp_30', 'sym_10', 'sym_20'].map(noise);

/* Track F */
const fCollapse = LEADERBOARD_DATA.filter((m) => m.trackF01AP <= 0.009).length;
const smf = byName('scMalignantFinder');

export const TRACKS: TrackDef[] = [
  {
    letter: 'A', code: 'Track A', short: 'Spike-ins', name: 'Controlled real-cell spike-ins', units: G.trackAUnits,
    headline: `${firstRanked.method} ${fmt.ap(firstRanked.medianAP)} median AP`, reading: 'Primary ranking',
    subtitle: '8 solid tumour cohorts × 4 prevalence tiers (T1: 5–10% → T4: 0.01–0.1%) × 5 replicates',
    note: 'Real malignant cells spiked into real tumour backgrounds, 5–10% down to 0.01–0.1%.',
    finding: 'Track A is the only track that produces leaderboard ranks. Gaps between neighbouring detectors are small, so read the order with the pairwise tests.',
    objective: 'Primary ranking track quantifying average precision as real P_HC malignant cells are spiked into real B_HC benign immune and stromal backgrounds.',
    methodology: `8 datasets × 4 prevalence tiers × 5 seeded replicates = ${G.trackAUnits} benchmark units. The leaderboard reports median AP after method-specific fallback filtering; global and pairwise rank tests use the ${G.trackACommonUnits}-unit common subset.`,
    stats: [
      { label: 'Units', value: String(G.trackAUnits), sub: 'per method' },
      { label: 'Friedman χ²', value: G.friedmanChi2.toFixed(2), sub: `p ${G.friedmanPAsPrinted} over ${G.friedmanN} common units, Iman–Davenport F = ${G.imanDavenportF.toFixed(2)}` },
      { label: 'Supervised ceiling', value: fmt.ap(CEILING.medianAP), sub: 'hvg_logreg median AP, reference' },
      { label: 'Steepest rarity slope', value: signed(slopes[0].nAPSlope), sub: `${slopes[0].method}, then ${slopes[1].method} (${signed(slopes[1].nAPSlope)}) and ${slopes[2].method} (${signed(slopes[2].nAPSlope)})` },
    ],
    top: null,
  },
  {
    letter: 'B', code: 'Track B', short: 'Synthetic', name: 'Synthetic Splatter stress test', units: G.trackBUnits,
    headline: `ρ = ${G.trackABSpearmanRho.toFixed(3)}, A vs B`, reading: 'Stress test',
    subtitle: 'Parametric synthetic rare-cell simulations with realism audits',
    note: 'Splatter-simulated cells: a fitted lattice with synthetic noise.',
    finding: 'Synthetic Splatter ranks do not predict real-data ranks: graph and clustering methods rise and marker-based methods fall.',
    objective: 'Test whether synthetic Splatter simulations reproduce empirical method rankings observed on real biological tissues (Track A).',
    methodology: `${G.trackBUnits} synthetic units (8 datasets × T1–T4 × 3–4 replicates) from Splatter simulations fitted to each real dataset and audited for library size, dropout and differential-expression overlap.`,
    stats: [
      { label: 'Units', value: String(G.trackBUnits), sub: 'per method' },
      { label: 'Spearman ρ, A vs B', value: G.trackABSpearmanRho.toFixed(3), sub: `p = ${G.trackABSpearmanP.toFixed(3)} over ${METHODS.length} methods: synthetic ranks do not predict real data` },
      { label: 'Largest rise', value: `${maxRise} places`, sub: `${list(moves.filter((m) => m.d === maxRise).map((m) => m.name))}, mean within-unit rank, Track A to Track B` },
      { label: 'Largest drop', value: `${-maxDrop} places`, sub: `${list(moves.filter((m) => m.d === maxDrop).map((m) => m.name))}, mean within-unit rank, Track A to Track B` },
    ],
    top: null,
  },
  {
    letter: 'C', code: 'Track C', short: 'Null', name: 'Background-dominated null controls', units: G.trackCUnits,
    headline: `max FPR ${fpr(Math.max(...fprs))}`, reading: 'Pass / fail',
    subtitle: 'Pure B_HC benign background units auditing false-positive calibration',
    note: 'Background only. There is nothing to find, so a pass is a miss.',
    finding: 'Every unsupervised method sits at the random floor on background-only units. The supervised ceiling is the one method that over-flags.',
    objective: 'Verify whether methods inflate false-positive alarms when rare malignant cells are absent.',
    methodology: `${G.trackCUnits} background-only null units; REACH measures the fraction of top-ranked cells incorrectly selected as positives, then runs a Friedman test (k = ${METHODS.length}, N = ${G.trackCFriedmanN}) and pairwise Wilcoxon tests against random_baseline with BH-FDR correction.`,
    stats: [
      { label: 'Units', value: String(G.trackCUnits), sub: 'per method' },
      { label: 'Unsupervised FPR range', value: `${fpr(Math.min(...fprs))}–${fpr(Math.max(...fprs))}`, sub: `All match the random floor (BH-FDR ≥ ${minBh.toFixed(3)})` },
      { label: 'Supervised null over-flag', value: fpr(CEILING.nullFPRate), sub: 'hvg_logreg FPR: fails the null specificity check' },
      { label: 'Omnibus Friedman χ²', value: G.trackCFriedmanChi2.toFixed(2), sub: `p ${G.trackCFriedmanP}, k = ${METHODS.length}, N = ${G.trackCFriedmanN} units` },
    ],
    top: { label: 'Lowest null FPR', items: lowestFpr.flatMap((m) => topItem(meth(m.method), fpr(m.nullFPRate), 'FPR')), note: '', link: false },
  },
  {
    letter: 'D', code: 'Track D', short: 'Blood', name: 'Natural blood / CTC prevalence', units: G.trackDUnits,
    headline: `${dRanked[0].method} ${fmt.ap(dRanked[0].trackDAP)} mean AP`, reading: 'Supplement',
    subtitle: 'Un-manipulated haematological and liquid-biopsy circulating tumour cell cohorts',
    note: 'Natural blood and CTC samples at their own prevalence.',
    finding: `On natural blood and CTC samples every unsupervised method stays low, with ${list(dRanked.slice(0, 3).map((m) => m.method))} highest among the ranked detectors.`,
    objective: 'Evaluate detectors on un-manipulated blood and circulating tumour cell (CTC) samples without artificial spike-ins.',
    methodology: `${G.trackDUnits} natural-prevalence evaluation units across multiple myeloma (mm_ledergor, 31,181 cells) and breast cancer CTCs (breast_ctc_szczerba, 357 cells).`,
    stats: [
      { label: 'Units', value: String(G.trackDUnits), sub: 'per method' },
      { label: 'Highest among ranked', value: fmt.ap(dRanked[0].trackDAP), sub: `${dRanked[0].method} mean AP, then ${dRanked[1].method} ${fmt.ap(dRanked[1].trackDAP)} and ${dRanked[2].method} ${fmt.ap(dRanked[2].trackDAP)}` },
      { label: 'Supervised ceiling', value: fmt.ap(CEILING.trackDAP), sub: 'hvg_logreg mean AP, reference' },
      { label: 'Cohorts', value: String(G.hematologicCohorts), sub: 'mm_ledergor (31,181 cells), breast_ctc_szczerba (357)' },
    ],
    top: null,
  },
  {
    letter: 'E', code: 'Track E', short: 'Noise', name: 'Supervised label-noise analysis', units: G.trackEUnits,
    headline: `RI ${fp30.robustnessIndex.toFixed(3)}, 30% Bg → Pos`, reading: 'Supervised only',
    subtitle: `4 label-corruption regimes across Track A units (${G.trackEUnits} units)`,
    note: 'Training labels flipped both ways: hidden positives, background marked positive.',
    finding: 'The supervised ceiling tolerates missed positives but loses much of its precision when background cells are labelled positive.',
    objective: 'Quantify how label corruption degrades the supervised ceiling (hvg_logreg) and measure evaluation metric sensitivity under noisy reference annotations.',
    methodology: `${G.trackEUnits} units applying 4 structured label-noise conditions to Track A partitions. Interpreted as algorithmic robustness only for supervised hvg_logreg.`,
    stats: [
      { label: 'Units', value: String(G.trackEUnits), sub: 'per method' },
      { label: '30% Pos → Bg, FN noise', value: fmt.ap(fn30.meanAP), sub: `mean AP, robustness index ${fn30.robustnessIndex.toFixed(3)} (clean ${fmt.ap(clean.meanAP)})` },
      { label: '30% Bg → Pos, FP noise', value: fmt.ap(fp30.meanAP), sub: `mean AP, robustness index ${fp30.robustnessIndex.toFixed(3)}` },
      { label: '10% / 20% symmetric', value: `${fmt.ap(sym10.meanAP)} / ${fmt.ap(sym20.meanAP)}`, sub: `mean AP, robustness index ${sym10.robustnessIndex.toFixed(3)} / ${sym20.robustnessIndex.toFixed(3)}` },
    ],
    top: { label: 'Supervised ceiling only', items: topItem(meth('hvg_logreg'), fmt.ap(fn30.meanAP), 'mean AP at 30% Pos → Bg'),
      note: 'Unsupervised detectors do not use labels, so Track E is read for hvg_logreg alone.', link: false },
  },
  {
    letter: 'F', code: 'Track F', short: 'Lineage', name: 'Intra-lineage diagnostic benchmark', units: G.trackFUnits,
    headline: `${fCollapse} of ${METHODS.length} at ≤ 0.009 AP`, reading: 'Diagnostic',
    subtitle: 'Malignant epithelial P_HC spiked into normal-diploid epithelial B_HC (crc_lee)',
    note: 'Malignant and normal cells from one lineage, nearly identical.',
    finding: 'Without the lineage contrast almost every method collapses. scMalignantFinder holds, on a single colorectal cohort.',
    objective: 'Remove the inter-lineage epithelial-versus-immune contrast to test whether rare-cell detectors can distinguish malignant from normal cells within the same epithelial lineage.',
    methodology: `${G.trackFUnits} units constructed from crc_lee (malignant epithelial P_HC spiked into normal-diploid epithelial B_HC at 0.1%, 0.5% and 1.0% prevalence).`,
    stats: [
      { label: 'Units', value: String(G.trackFUnits), sub: 'per method' },
      { label: 'scMalignantFinder', value: fmt.ap(smf.trackF01AP), sub: `median AP at 0.1%, crc_lee only (${fmt.ap(smf.trackF05AP)} at 0.5%, ${fmt.ap(smf.trackF10AP)} at 1.0%)` },
      { label: 'Ceiling change, Δ', value: signed(CEILING.trackF01AP - CEILING.medianAP), sub: `hvg_logreg ${fmt.ap(CEILING.medianAP)} on Track A → ${fmt.ap(CEILING.trackF01AP)} at 0.1%` },
      { label: 'At or below 0.009 AP', value: `${fCollapse} / ${METHODS.length}`, sub: 'methods at 0.1% prevalence (Table 5)' },
    ],
    top: { label: 'Track F, 0.1% prevalence', items: topItem(meth('scMalignantFinder'), fmt.ap(smf.trackF01AP), 'median AP'),
      note: 'A colorectal-specific result on one cohort. The paper says it must not be generalised. Track F never feeds the leaderboard.', link: true },
  },
];

export const trackOf = (l: Letter): TrackDef => TRACKS.find((t) => t.letter === l) ?? TRACKS[0];

/* ---------- Non-circularity check (proof Table 9a) ---------- */

export interface CnvRow { key: string; name: string; full: string; no: string; fullAP: number; noAP: number; color: string; ref: boolean }
export const CNV_ROWS: CnvRow[] = METHODS.flatMap((m) => {
  const c = CIRCULARITY_DATA.find((x) => x.method === m.name);
  return c ? [{ key: m.key, name: m.name, full: fmt.ap(c.fullAP), no: fmt.ap(c.noCnvAP), fullAP: c.fullAP, noAP: c.noCnvAP, color: m.color, ref: m.ref }] : [];
});
const noCnv = CIRCULARITY_DATA.map((c) => c.noCnvAP);
const fireCnv = CIRCULARITY_DATA.find((c) => c.method === 'FiRE');
export const CNV_STATS = {
  rho: G.circularitySpearmanRho.toFixed(3),
  p: G.circularityP.toFixed(3),
  band: `${fmt.ap(Math.min(...noCnv))}–${fmt.ap(Math.max(...noCnv))}`,
  fire: fireCnv ? `FiRE ${fmt.ap(fireCnv.fullAP)} to ${fmt.ap(fireCnv.noCnvAP)}` : '',
};

