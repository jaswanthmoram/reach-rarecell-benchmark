import { PRACTITIONER_SCENARIOS } from '../../data/benchmarkData';
import { fmt } from '../../lib/format';
import { methodOf, pct } from './model';

/** Method picker model: the paper's four practitioner scenarios, filtered by the reader's three answers. */
export const UNSTABLE_PCT = 5;
export interface Answers { lineage: 'inter' | 'intra'; compute: 'cpu' | 'gpu'; stability: 'required' | 'tolerant' }
export const PRESET: Answers = { lineage: 'inter', compute: 'cpu', stability: 'required' };

export const SUMMARY: Record<string, string> = { inter: 'Inter-lineage', intra: 'Intra-lineage', cpu: 'CPU only', gpu: 'GPU available', required: 'Stable output', tolerant: 'Failures tolerated' };

export const QUESTIONS = [
  { key: 'lineage', n: '01', ask: 'What separates your malignant cells from the rest?', opts: [
    { value: 'inter', title: 'Other lineages', hint: 'Malignant cells against immune, stromal and normal-epithelial background (Tracks A to E).' },
    { value: 'intra', title: 'The same lineage', hint: 'Malignant against normal cells of the same epithelial lineage (Track F).' }] },
  { key: 'compute', n: '02', ask: 'What will you run it on?', opts: [
    { value: 'cpu', title: 'CPU only', hint: 'A workstation or a CPU cluster node.' },
    { value: 'gpu', title: 'A GPU is available', hint: 'For example a Colab T4, as used for DeepScena.' }] },
  { key: 'stability', n: '03', ask: 'Must every sample return usable scores?', opts: [
    { value: 'required', title: 'Yes, stable output', hint: 'Flag methods that fall back or return constant scores on 5% or more of units.' },
    { value: 'tolerant', title: 'No, I can rerun failures', hint: 'Keep methods that fail on some cohorts.' }] },
] as const;

export type Fit = 'start' | 'consider' | 'care';
interface Caveat { t: string; pw?: boolean; unstable?: boolean }
export interface Pick { id: string; fit: Fit; regime: string; scen: number[]; reasons: string[]; caveats: Caveat[] }

/** "Avoid" lines come from the data file (PRACTITIONER_SCENARIOS, in scenario order 1 to 4). */
const avoidOf = (n: number) => PRACTITIONER_SCENARIOS[n - 1].avoidMethods;

const D = (k: string) => methodOf(k).d;
const unreliable = (k: string) => methodOf(k).unreliable;
const unitsOf = (k: string) => {
  const d = D(k);
  return d.degeneratePct >= d.fallbackPct ? `${d.degenerateUnits} constant-score` : `${d.fallbackUnits} fallback`;
};

function interPicks(): Pick[] {
  const f = D('fire'), c = D('cellsius'), r = D('rareq'), s = D('sccad'), k = D('casee'), e = D('expr_threshold');
  return [
    { id: 'fire', fit: 'start', regime: 'Any prevalence, strongest below 0.1%', scen: [2, 3],
      reasons: [`Highest median AP among the ranked published detectors (${fmt.ap(f.medianAP)}, Track A).`, `Keeps the highest non-ceiling mean AP at T4, below 0.1% prevalence (${fmt.ap(f.t4AP)}).`],
      caveats: [{ t: `Its lead over expr_threshold (median AP ${fmt.ap(e.medianAP)}) is not significant in pairwise tests.`, pw: true }] },
    { id: 'cellsius', fit: 'start', regime: '1% to 10% prevalence, non-epithelial tumours', scen: [3, 4],
      reasons: [`At T2 (1% to 5%) reaches mean AP ${fmt.ap(c.t2AP)} with a ${(c.nullFPRate * 100).toFixed(2)}% false-positive rate on background-only controls (Track C).`, `Highest non-ceiling mean AP on rcc_multi, a mesenchymal ccRCC cohort (mean AP ${fmt.ap(methodOf('cellsius').rccAP)}).`],
      caveats: [{ t: `Collapses at T4, below 0.1% prevalence (mean AP ${fmt.ap(c.t4AP)}).` }] },
    { id: 'rareq', fit: 'consider', regime: 'rcc_multi and similar non-epithelial cohorts', scen: [4],
      reasons: [`Recommended with CellSIUS for rcc_multi (mean AP ${fmt.ap(methodOf('rareq').rccAP)}).`],
      caveats: [{ t: `Collapses at T4, below its kNN neighbourhood size (mean AP ${fmt.ap(r.t4AP)}).` }] },
    { id: 'sccad', fit: 'consider', regime: 'Natural blood and CTC samples (Track D)', scen: [4],
      reasons: [`Highest non-ceiling AP on the natural blood and CTC cohorts of Track D (${fmt.ap(s.trackDAP)}).`],
      caveats: [{ t: `Falls back on ${pct(unreliable('sccad'))} of primary units (${unitsOf('sccad')}, ov_izar_tirosh).`, unstable: true }] },
    { id: 'casee', fit: 'consider', regime: 'Below 0.1% prevalence, as a second opinion', scen: [2],
      reasons: [`Exploratory comparator, not ranked: T4 mean AP ${fmt.ap(k.t4AP)}, close to FiRE.`],
      caveats: [{ t: `Slowest method in the panel: ${fmt.secs(k.runtimeS)} per Track A unit on CPU.` }, { t: `Constant scores on ${pct(unreliable('casee'))} of primary units (${unitsOf('casee')}).`, unstable: true }] },
  ];
}

function intraPicks(): Pick[] {
  return [{ id: 'scmalignantfinder', fit: 'start', regime: 'crc_lee only (Track F)', scen: [1],
    reasons: ['The only method in the panel that keeps precision when the malignant-versus-TME contrast is removed: a supervised pan-cancer classifier.', `Track F AP 0.917 to 1.000 on crc_lee (${fmt.ap(D('scmalignantfinder').trackF01AP)} at 0.1% prevalence).`],
    caveats: [{ t: 'Colorectal-specific: Track A AP 0.015 on hnscc_puram against 0.943 on crc_lee. The paper says it must not be generalised.' }, { t: 'Proxy: REACH runs its own wrapper of the published model.' }] }];
}

function applyStability(picks: Pick[]): Pick[] {
  const stable: Pick[] = [];
  const careful: Pick[] = [];
  picks.forEach((p) => {
    const u = unreliable(p.id);
    if (u >= UNSTABLE_PCT) {
      careful.push({ ...p, fit: 'care', caveats: [{ t: `Unstable by your criterion: ${pct(u)} of primary units fell back or returned constant scores (threshold ${UNSTABLE_PCT}%).` }, ...p.caveats.filter((c) => !c.unstable)] });
    } else {
      stable.push({ ...p, reasons: [...p.reasons, `Stable: ${pct(u)} of primary units fell back or returned constant scores.`] });
    }
  });
  return [...stable, ...careful];
}

export function recommend(a: Answers) {
  const base = a.lineage === 'inter' ? interPicks() : intraPicks();
  const picks = a.stability === 'required' ? applyStability(base) : base;
  const ids = a.lineage === 'inter' ? [2, 3, 4] : [1];
  const dp = D('deepscena');
  const notes = [
    a.compute === 'gpu'
      ? `A GPU does not change this list. The one GPU method in the panel, DeepScena, ranks 6 of 6 with AUROC ${fmt.ap(dp.auroc)}, below random.`
      : `Every pick runs on CPU. Times are the mean per Track A unit; DeepScena, the one GPU method, is not recommended (AUROC ${fmt.ap(dp.auroc)}).`,
    ...(a.lineage === 'intra' && a.stability === 'required' ? ['No method in the panel meets both needs. scMalignantFinder is the only one with intra-lineage signal, and it is also the least stable.'] : []),
    ...(a.lineage === 'inter' ? ['Absolute AP stays low and the highest-scoring method varies by cohort (proof Table 6a). Run two picks and compare.'] : []),
    'Confirm top-ranked candidate cells with orthogonal copy-number evidence before any clinical interpretation.',
  ];
  return { picks, avoid: ids.map((n) => ({ text: avoidOf(n), scenario: n })), notes };
}
