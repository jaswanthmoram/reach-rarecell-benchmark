import { DATASET_METHOD_MATRIX, LEADERBOARD_DATA, PRACTITIONER_SCENARIOS, type MethodResult } from '../../data/benchmarkData';
import { fmt } from '../../ui';
import { unreliablePct } from './shared';

/**
 * Method picker: three answers -> an ordered shortlist with reasons. Every number is read from the data file and
 * every recommendation traces to one of the paper's four practitioner scenarios (pp. 18 to 19). The order is a
 * reading order for this situation, never a leaderboard rank.
 */

export type Lineage = 'inter' | 'intra';
export type Compute = 'cpu' | 'gpu';
export type Stability = 'required' | 'tolerant';
export interface Answers { lineage?: Lineage; compute?: Compute; stability?: Stability }

export type Fit = 'start' | 'consider' | 'care';
export interface Pick {
  m: MethodResult;
  fit: Fit;
  /** When this pick applies (prevalence or cohort regime). */
  regime: string;
  reasons: string[];
  caveats: string[];
  /** Scenario numbers (1 to 4) the pick is drawn from. */
  scenarios: number[];
  /** Show a link to the Leaderboard pairwise tests (the headline statistic is not restated here). */
  pairwise?: boolean;
}
export interface Avoid { text: string; scenario: number }
export interface Outcome { picks: Pick[]; avoid: Avoid[]; notes: string[]; scenarios: number[] }

/**
 * Preset answers: the common case the benchmark covers (inter-lineage Tracks A to E, a CPU workstation, every sample
 * must return usable scores), so the shortlist is visible on first view and every answer stays one click away.
 */
export const DEFAULT_ANSWERS: Required<Answers> = { lineage: 'inter', compute: 'cpu', stability: 'required' };
export const isDefault = (a: Answers) => a.lineage === DEFAULT_ANSWERS.lineage && a.compute === DEFAULT_ANSWERS.compute && a.stability === DEFAULT_ANSWERS.stability;

/** Units with fallback or constant scores above this share are flagged when stable output is required. */
export const UNSTABLE_PCT = 5;

const method = (id: string): MethodResult => {
  const m = LEADERBOARD_DATA.find((x) => x.id === id);
  if (!m) throw new Error(`picker: unknown method ${id}`);
  return m;
};
const scenarioNo = (id: string) => PRACTITIONER_SCENARIOS.findIndex((s) => s.id === id) + 1;
const scenario = (id: string) => PRACTITIONER_SCENARIOS[scenarioNo(id) - 1];
const cohortAP = (dataset: string, id: string) => DATASET_METHOD_MATRIX.find((c) => c.dataset === dataset && c.method === id)?.meanAP ?? null;
const pct = (v: number) => `${v.toFixed(1)}%`;
const units = (m: MethodResult) => (m.degeneratePct >= m.fallbackPct ? `${m.degenerateUnits} constant-score` : `${m.fallbackUnits} fallback`);

/** "AP = 0.917 – 1.000 on crc_lee only …" -> "0.917 to 1.000" (scenario 1 expected AP). */
const trackFRange = (expected: string) => {
  const hit = /(\d\.\d{3})\s*[–-]\s*(\d\.\d{3})/.exec(expected);
  return hit ? `${hit[1]} to ${hit[2]}` : expected;
};

const isComplete = (a: Answers): a is Required<Answers> => Boolean(a.lineage && a.compute && a.stability);
export const answeredCount = (a: Answers) => [a.lineage, a.compute, a.stability].filter(Boolean).length;

function interPicks(): Pick[] {
  const fire = method('FiRE');
  const cellsius = method('cellsius');
  const rareq = method('RareQ');
  const sccad = method('scCAD');
  const casee = method('CaSee');
  const expr = method('expr_threshold');
  const rcc = (id: string) => fmt.ap(cohortAP('rcc_multi', id) ?? 0);
  const ultra = scenarioNo('ultra-rare');
  const moderate = scenarioNo('moderate-rare');
  const mesen = scenarioNo('mesenchymal-rcc');
  return [
    {
      m: fire, fit: 'start', regime: 'Any prevalence, strongest below 0.1%', scenarios: [ultra, moderate],
      reasons: [
        `Highest median AP among the ranked published detectors (${fmt.ap(fire.medianAP)}, Track A).`,
        `Keeps the highest non-ceiling mean AP at T4, below 0.1% prevalence (${fmt.ap(fire.t4AP)}).`,
      ],
      caveats: [`Its lead over expr_threshold (median AP ${fmt.ap(expr.medianAP)}) is not significant in pairwise tests.`],
      pairwise: true,
    },
    {
      m: cellsius, fit: 'start', regime: '1% to 10% prevalence, non-epithelial tumours', scenarios: [moderate, mesen],
      reasons: [
        `At T2 (1% to 5%) reaches mean AP ${fmt.ap(cellsius.t2AP)} with a ${(cellsius.nullFPRate * 100).toFixed(2)}% false-positive rate on background-only controls (Track C).`,
        `Best non-ceiling method on rcc_multi, a mesenchymal ccRCC cohort (mean AP ${rcc('cellsius')}).`,
      ],
      caveats: [`Collapses at T4, below 0.1% prevalence (mean AP ${fmt.ap(cellsius.t4AP)}).`],
    },
    {
      m: rareq, fit: 'consider', regime: 'rcc_multi and similar non-epithelial cohorts', scenarios: [mesen],
      reasons: [`Recommended with CellSIUS for rcc_multi (mean AP ${rcc('RareQ')}).`],
      caveats: [`Collapses at T4, below its kNN neighbourhood size (mean AP ${fmt.ap(rareq.t4AP)}).`],
    },
    {
      m: sccad, fit: 'consider', regime: 'Natural blood and CTC samples (Track D)', scenarios: [mesen],
      reasons: [`Highest non-ceiling AP on the natural blood and CTC cohorts of Track D (${fmt.ap(sccad.trackDAP)}).`],
      caveats: [`Falls back on ${pct(unreliablePct(sccad))} of primary units (${units(sccad)}, ov_izar_tirosh).`],
    },
    {
      m: casee, fit: 'consider', regime: 'Below 0.1% prevalence, as a second opinion', scenarios: [ultra],
      reasons: [`Exploratory comparator, not ranked: T4 mean AP ${fmt.ap(casee.t4AP)}, close to FiRE.`],
      caveats: [
        `Slowest method in the panel: ${fmt.secs(casee.runtimeS)} per Track A unit on CPU.`,
        `Constant scores on ${pct(unreliablePct(casee))} of primary units (${units(casee)}).`,
      ],
    },
  ];
}

function intraPicks(): Pick[] {
  const smf = method('scMalignantFinder');
  const s1 = scenario('intra-lineage');
  return [{
    m: smf, fit: 'start', regime: 'crc_lee only (Track F)', scenarios: [scenarioNo('intra-lineage')],
    reasons: [
      'The only method in the panel that keeps precision when the malignant-versus-TME contrast is removed: a supervised pan-cancer classifier.',
      `Track F AP ${trackFRange(s1.expectedAP)} on crc_lee (${fmt.ap(smf.trackF01AP)} at 0.1% prevalence).`,
    ],
    caveats: [
      'Colorectal-specific: Track A AP 0.015 on hnscc_puram against 0.943 on crc_lee. The paper says it must not be generalized.',
      'Proxy: REACH runs its own wrapper of the published model.',
    ],
  }];
}

/** Moves picks whose fallback or constant-score share is at or above UNSTABLE_PCT into "use with care", last. */
function applyStability(picks: Pick[]): Pick[] {
  const flagged = (p: Pick) => unreliablePct(p.m) >= UNSTABLE_PCT;
  const stable = picks.filter((p) => !flagged(p)).map((p) => ({
    ...p, reasons: [...p.reasons, `Stable: ${pct(unreliablePct(p.m))} of primary units fell back or returned constant scores.`],
  }));
  const careful = picks.filter(flagged).map((p) => ({
    ...p, fit: 'care' as const,
    caveats: [`Unstable by your criterion: ${pct(unreliablePct(p.m))} of primary units fell back or returned constant scores (threshold ${UNSTABLE_PCT}%).`, ...p.caveats.filter((c) => !/^(Falls back|Constant scores)/.test(c))],
  }));
  return [...stable, ...careful];
}

export function recommend(a: Answers): Outcome | null {
  if (!isComplete(a)) return null;
  const base = a.lineage === 'inter' ? interPicks() : intraPicks();
  const picks = a.stability === 'required' ? applyStability(base) : base;
  const deep = method('DeepScena');
  const ids = a.lineage === 'inter' ? ['ultra-rare', 'moderate-rare', 'mesenchymal-rcc'] : ['intra-lineage'];
  const avoid = ids.map((id) => ({ text: scenario(id).avoidMethods, scenario: scenarioNo(id) }));
  const notes: string[] = [];
  if (a.compute === 'gpu') {
    notes.push(`A GPU does not change this list. The one GPU method in the panel, DeepScena, ranks ${deep.publishedRankNum} of 6 with AUROC ${fmt.ap(deep.auroc)}, below random.`);
  } else {
    notes.push(`Every pick runs on CPU. Times are the mean per Track A unit; DeepScena, the one GPU method, is not recommended (AUROC ${fmt.ap(deep.auroc)}).`);
  }
  if (a.lineage === 'intra' && a.stability === 'required') {
    notes.push('No method in the panel meets both needs. scMalignantFinder is the only one with intra-lineage signal, and it is also the least stable.');
  }
  if (a.lineage === 'inter') notes.push('Absolute AP stays low and the best method varies by cohort (proof Table 6a). Run two picks and compare.');
  notes.push('Confirm top-ranked candidate cells with orthogonal copy-number evidence before any clinical interpretation.');
  return { picks, avoid, notes, scenarios: ids.map(scenarioNo) };
}
