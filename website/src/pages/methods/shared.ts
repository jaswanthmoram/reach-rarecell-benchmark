import { LEADERBOARD_DATA, METHOD_AUDIT_DATA, type MethodResult } from '../../data/benchmarkData';

export const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

/** Only the six published detectors carry a leaderboard rank (proof Table 4). */
export const isRanked = (m: MethodResult) => m.publishedRankNum !== null;
export const isCeiling = (m: MethodResult) => m.id === 'hvg_logreg';
/**
 * Reference methods (ceiling, exploratory comparator, baselines) are unranked and always drawn with the dashed
 * mark (DESIGN v2.2), so a reference can never be mistaken for a ranked detector even where hues are close
 * (CaSee brown vs scMalignantFinder ochre).
 */
export const isReference = (m: MethodResult) => !isRanked(m);
export const isReferenceId = (id: string) => {
  const m = LEADERBOARD_DATA.find((x) => x.id.toLowerCase() === id.toLowerCase());
  return m ? isReference(m) : false;
};

/** Share of the primary units that fell back or returned constant scores (proof Figure 3c). */
export const unreliablePct = (m: MethodResult) => Math.round((m.degeneratePct + m.fallbackPct) * 10) / 10;

/** Page sections, in order, for the "On this page" rail and the compact jump bar. */
export const PAGE_SECTIONS = [
  { id: 'matrix', label: 'Method matrix' },
  { id: 'cost', label: 'Cost and accuracy' },
  { id: 'audit', label: 'Inclusion audit' },
  { id: 'guidance', label: 'Method picker' },
] as const;

/** Width from which the "On this page" rail sits in the left gutter and the jump bar is hidden. */
export const RAIL_MIN_PX = 1600;
/** Scroll offset for sections: header (56px) plus the jump bar below 1600px, header only above. */
export const SECTION_SCROLL = 'scroll-mt-28 min-[1600px]:scroll-mt-20';

const byMedian = (a: MethodResult, b: MethodResult) => b.medianAP - a.medianAP;
const byPublished = (a: MethodResult, b: MethodResult) => (a.publishedRankNum ?? 99) - (b.publishedRankNum ?? 99);

export interface RoleGroup { key: string; title: string; note: string; methods: MethodResult[] }

/** Page order (DESIGN rule 1): ceiling above, ranked 1 to 6 contiguous, then comparator and baselines. */
export const ROLE_GROUPS: RoleGroup[] = [
  {
    key: 'ceiling',
    title: 'Supervised ceiling',
    note: 'In-sample logistic regression on the REACH labels. It bounds what is linearly recoverable from expression.',
    methods: LEADERBOARD_DATA.filter((m) => m.category === 'Supervised Ceiling'),
  },
  {
    key: 'ranked',
    title: 'Ranked published detectors',
    note: 'Role ranks 1 to 6 by Track A median AP. The only rows with a leaderboard rank.',
    methods: LEADERBOARD_DATA.filter(isRanked).sort(byPublished),
  },
  {
    key: 'exploratory',
    title: 'Exploratory comparator',
    note: 'Cancer/normal scorer (Yuan et al., 2022, Oncogene). Reported for reference and not assigned a leaderboard rank.',
    methods: LEADERBOARD_DATA.filter((m) => m.category === 'Exploratory (Preprint)'),
  },
  {
    key: 'baselines',
    title: 'Baselines',
    note: 'No learned model. expr_threshold ranks cells by total UMI count, and random_baseline is the chance floor.',
    methods: LEADERBOARD_DATA.filter((m) => m.category === 'Naive Baseline').sort(byMedian),
  },
];

/** Every method in page order; any list or chart of methods on this page follows it. */
export const PAGE_ORDER: string[] = ROLE_GROUPS.flatMap((g) => g.methods.map((m) => m.id.toLowerCase()));
export const pageOrderIndex = (id: string) => {
  const i = PAGE_ORDER.indexOf(id.toLowerCase());
  return i === -1 ? PAGE_ORDER.length : i;
};
export const inPageOrder = <T,>(items: readonly T[], idOf: (t: T) => string): T[] =>
  [...items].sort((a, b) => pageOrderIndex(idOf(a)) - pageOrderIndex(idOf(b)));

/** Short role word shown where a reference method has no rank. */
export const ROLE_WORD: Record<string, string> = {
  'Supervised ceiling': 'ceiling',
  Exploratory: 'exploratory',
  'Naive baseline': 'naive',
  'Floor baseline': 'floor',
};

export const auditFor = (id: string) => METHOD_AUDIT_DATA.find((a) => a.method.toLowerCase() === id.toLowerCase());

const pct = (s: string) => s.split(' (')[0].replace(' / ', '/');

/**
 * Compact matrix text per method. Paradigm words follow proof Figure 3a; every number is read
 * from LEADERBOARD_DATA so the short line always reconciles with the full failure mode.
 */
export interface MatrixNote { paradigm: string; fails: string; cite: [string, string]; citeNote?: string }

export function matrixNotes(m: MethodResult): MatrixNote {
  switch (m.id) {
    case 'FiRE': return { paradigm: 'Frequency rarity (sketching)', fails: 'Not significantly ahead of expr_threshold in pairwise tests', cite: ['Jindal et al. 2018', 'Nat Commun'] };
    case 'cellsius': return { paradigm: 'Rarity statistic (bimodal genes)', fails: `Collapses at T4 (mean AP ${m.t4AP.toFixed(3)})`, cite: ['Wegmann et al. 2019', 'Genome Biol'] };
    case 'scMalignantFinder': return { paradigm: 'Pan-cancer malignancy classifier', fails: `Constant scores on hnscc_puram (${pct(m.trackADegenerate)} units)`, cite: ['Yu, Li & Chen 2025', 'Commun Biol'] };
    case 'RareQ': return { paradigm: 'Neighbourhood topology (kNN)', fails: `Below kNN size at T4 (mean AP ${m.t4AP.toFixed(3)})`, cite: ['Fa et al. 2026', 'Nat Commun (inferred)'], citeNote: 'RareQ citation inferred from the reference list; the proof does not name it at the RareQ mention.' };
    case 'scCAD': return { paradigm: 'Cluster-decomposition anomaly', fails: `Falls back on ov_izar_tirosh (${pct(m.trackAFallback)} units)`, cite: ['Xu et al. 2024', 'Nat Commun'] };
    case 'DeepScena': return { paradigm: 'Deep clustering (NB autoencoder)', fails: `Sub-random ranking (AUROC ${m.auroc.toFixed(3)})`, cite: ['Lei et al. 2023', 'Brief Bioinform'] };
    case 'hvg_logreg': return { paradigm: 'Logistic regression, 2,000 HVGs', fails: `Needs labels, null-control FPR ${m.nullFPRate.toFixed(3)}`, cite: ['REACH', 'reference method'] };
    case 'CaSee': return { paradigm: 'Autoencoder + isolation forest', fails: `Constant scores on ov_izar_tirosh (${pct(m.trackADegenerate)} units)`, cite: ['Yuan et al. 2022', 'Oncogene'] };
    case 'expr_threshold': return { paradigm: 'Total UMI count rank', fails: 'Near the floor on rcc_multi (mean AP 0.020)', cite: ['REACH', 'reference method'] };
    case 'random_baseline': return { paradigm: 'Uniform random score', fails: 'No biological signal by construction', cite: ['REACH', 'reference method'] };
    default: return { paradigm: m.paradigm, fails: m.failureMode, cite: [m.citation, ''] };
  }
}

/**
 * Long failure text for the expanded detail. The FiRE versus expr_threshold statistics are stated in full only on
 * Home and the Leaderboard (round-4 rule 7), so here they are named and linked.
 */
export function detailFails(m: MethodResult): { text: string; pairwise: boolean } {
  if (m.id === 'FiRE') {
    return { text: 'Its lead over the naive expr_threshold baseline and over scMalignantFinder is not significant in pairwise tests. It collapses on intra-lineage Track F (median AP 0.005 at 0.1%, 0.022 at 0.5%).', pairwise: true };
  }
  return { text: m.failureMode, pairwise: false };
}
/** Reading line under the failure text; drops lines that restate the pairwise statistics. */
export const detailReading = (m: MethodResult) => (m.highlight && !m.highlight.includes('#') && !m.highlight.includes('BH-FDR') ? m.highlight : null);

/** Language split into runtime and framework: "Python (PyTorch)" → ["Python", "PyTorch"]. Package names are dropped. */
export const languageParts = (m: MethodResult): [string, string] => {
  const lang = auditFor(m.id)?.language ?? m.language;
  const hit = /^(.*?)\s*\((.+)\)$/.exec(lang);
  return hit ? [hit[1], hit[2]] : [lang, ''];
};
export const shortLanguage = (m: MethodResult) => languageParts(m).filter(Boolean).join(' · ');

/** Runtime per Track A unit; DeepScena ran on a Colab T4 GPU and is not comparable with the CPU methods. */
export const isGpu = (m: MethodResult) => m.id === 'DeepScena';
