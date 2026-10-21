import { DATASET_METHOD_MATRIX, GLOBAL_STATS, LEADERBOARD_DATA, METHOD_AUDIT_DATA, type MethodResult } from '../../data/benchmarkData';
import { fmt, methodColor } from '../../lib/format';

/** Page order: ceiling, ranks 1 to 6, then the unranked references. */
const ORDER = ['hvg_logreg', 'FiRE', 'cellsius', 'scMalignantFinder', 'RareQ', 'scCAD', 'DeepScena', 'CaSee', 'expr_threshold', 'random_baseline'] as const;

/** Board copy that the data file does not hold in this short form (P05 board, matrix columns). */
const BOARD: Record<string, { role: string; paradigm: string; lang: string; hw: string; fails: string; cite: string; venue: string }> = {
  hvg_logreg: { role: 'ceiling', paradigm: 'Logistic regression, 2,000 HVGs', lang: 'Python', hw: 'per unit, CPU', fails: 'Needs labels, null-control FPR 0.788', cite: 'REACH', venue: 'reference method' },
  fire: { role: '', paradigm: 'Frequency rarity (sketching)', lang: 'R / C++', hw: 'per unit, CPU', fails: 'Not significantly ahead of expr_threshold in pairwise tests', cite: 'Jindal et al. 2018', venue: 'Nat Commun' },
  cellsius: { role: '', paradigm: 'Rarity statistic (bimodal genes)', lang: 'R', hw: 'per unit, CPU', fails: 'Collapses at T4 (mean AP 0.006)', cite: 'Wegmann et al. 2019', venue: 'Genome Biol' },
  scmalignantfinder: { role: '', paradigm: 'Pan-cancer malignancy classifier', lang: 'Python', hw: 'per unit, CPU', fails: 'Constant scores on hnscc_puram (20/160 units)', cite: 'Yu, Li & Chen 2025', venue: 'Commun Biol' },
  rareq: { role: '', paradigm: 'Neighbourhood topology (kNN)', lang: 'R', hw: 'per unit, CPU', fails: 'Below kNN size at T4 (mean AP 0.006)', cite: 'Fa et al. 2026', venue: 'Nat Commun (inferred)' },
  sccad: { role: '', paradigm: 'Cluster-decomposition anomaly', lang: 'Python', hw: 'per unit, CPU', fails: 'Falls back on ov_izar_tirosh (20/160 units)', cite: 'Xu et al. 2024', venue: 'Nat Commun' },
  deepscena: { role: '', paradigm: 'Deep clustering (NB autoencoder)', lang: 'Python · PyTorch', hw: 'per unit, T4 GPU', fails: 'Sub-random ranking (AUROC 0.471)', cite: 'Lei et al. 2023', venue: 'Brief Bioinform' },
  casee: { role: 'exploratory', paradigm: 'Autoencoder + isolation forest', lang: 'Python · PyTorch', hw: 'per unit, CPU', fails: 'Constant scores on ov_izar_tirosh (20/160 units)', cite: 'Yuan et al. 2022', venue: 'Oncogene' },
  expr_threshold: { role: 'naive', paradigm: 'Total UMI count rank', lang: 'Python', hw: 'per unit, CPU', fails: 'Near the floor on rcc_multi (mean AP 0.020)', cite: 'REACH', venue: 'reference method' },
  random_baseline: { role: 'floor', paradigm: 'Uniform random score', lang: 'Python', hw: 'per unit, CPU', fails: 'No biological signal by construction', cite: 'REACH', venue: 'reference method' },
};

/** Language as written in the detail panel (board LANG2). */
const LANG_FULL: Record<string, string> = { casee: 'Python', deepscena: 'Python · PyTorch' };

export interface Method {
  /** Lower-case key: colour token, DOM ids, picker ids. */
  key: string;
  name: string;
  rank: number | null;
  ref: boolean;
  role: string;
  hue: string;
  paradigm: string;
  lang: string;
  langFull: string;
  fidelity: 'Faithful' | 'Proxy';
  rt: string;
  hw: string;
  fails: string;
  cite: string;
  venue: string;
  auditParadigm: string;
  rccAP: number;
  /** Fallback plus degenerate units over all primary units, in percent (1 decimal). */
  unreliable: number;
  d: MethodResult;
}

const byId = new Map(LEADERBOARD_DATA.map((m) => [m.id, m]));
const lc = (s: string) => s.toLowerCase();

export const METHODS: Method[] = ORDER.map((id) => {
  const d = byId.get(id);
  if (!d) throw new Error(`Methods page: ${id} missing from LEADERBOARD_DATA`);
  const key = lc(id);
  const b = BOARD[key];
  const audit = METHOD_AUDIT_DATA.find((a) => lc(a.method) === key);
  const rcc = DATASET_METHOD_MATRIX.find((c) => c.dataset === 'rcc_multi' && lc(c.method) === key);
  return {
    key, name: d.method, rank: d.publishedRankNum, ref: d.publishedRankNum == null, role: b.role, hue: methodColor(key),
    paradigm: b.paradigm, lang: b.lang, langFull: LANG_FULL[key] ?? b.lang, fidelity: d.fidelity,
    rt: fmt.secs(d.runtimeS), hw: b.hw, fails: b.fails, cite: b.cite, venue: b.venue,
    auditParadigm: audit?.paradigm ?? d.paradigm, rccAP: rcc?.meanAP ?? 0,
    unreliable: Math.round((d.degeneratePct + d.fallbackPct) * 10) / 10, d,
  };
});

export const methodOf = (key: string) => METHODS.find((m) => m.key === key) as Method;
export const pct = (v: number) => `${v.toFixed(1)}%`;
export const unreliableLabel = (v: number) => (v === 0 ? '0%' : `${v}%`);

const M = (k: string) => methodOf(k).d;

export const READING: Record<string, string> = {
  hvg_logreg: 'Supervised in-sample ceiling (reference line, not ranked).',
  fire: `Highest median AP among the ranked published detectors (${fmt.ap(M('fire').medianAP)}). Whether that lead holds against the baselines is tested on the Leaderboard.`,
  scmalignantfinder: `Only method with Track F signal (AP ${fmt.ap(M('scmalignantfinder').trackF01AP)} at 0.1% and 0.5%; crc_lee only, not generalisable).`,
  rareq: 'Highest non-ceiling mean AP on synthetic Track B (Track B rank 2).',
  sccad: `Highest non-ceiling AP on natural blood and CTC Track D (${fmt.ap(M('sccad').trackDAP)}).`,
  deepscena: `Sub-random AUROC (${fmt.ap(M('deepscena').auroc)}) on Track A.`,
  casee: `Exploratory comparator: ${fmt.ap(M('casee').medianAP)} median AP (${fmt.ap(M('casee').exclDegenerateMedianAP)} excluding 20 degenerate units).`,
  random_baseline: 'Chance floor (expected AP close to prevalence).',
};

export const FIRE_FAILS = 'Its lead over the naive expr_threshold baseline and over scMalignantFinder is not significant in pairwise tests. It collapses on intra-lineage Track F (median AP 0.005 at 0.1%, 0.022 at 0.5%).';

export const NAV = [['matrix', 'Method matrix'], ['cost', 'Cost and accuracy'], ['audit', 'Inclusion audit'], ['guidance', 'Method picker']] as const;

export const CRITERIA = [
  { title: 'Scores each cell', body: 'One value per cell, so average precision can rank every cell in a unit.', failed: ['raceid3'] },
  { title: 'Finishes at benchmark scale', body: 'Completes the Track A units at their real cell counts.', failed: ['scAIDE'] },
  { title: 'Runs on scRNA-seq alone', body: 'Expression counts are the only input, with no paired modality.', failed: ['SCANER'] },
  { title: 'Returns non-constant scores', body: 'Scores must vary across cells, because a constant output carries no ranking.', failed: ['MACE'] },
  { title: 'Ranks cells by expression', body: 'A continuous expression-based score. CNV callers, tumour-only callers and label classifiers do not rank cells.', failed: ['CopyKAT', 'SCEVAN', 'scATOMIC'] },
];

/** The data file writes unknown fields as ", ". */
const known = (s: string) => (/^[\s,]*$/.test(s || '') ? '' : s);
const reasonOf = (s: string) => {
  const r = s.replace(/^Excluded:\s*/, '');
  const up = r.charAt(0).toUpperCase() + r.slice(1);
  return /\.$/.test(up) ? up : `${up}.`;
};

export const EXCLUDED = METHOD_AUDIT_DATA.filter((a) => a.status === 'Excluded').map((a) => ({
  m: a.method,
  par: known(a.paradigm) || 'Not reported',
  why: reasonOf(a.auditOutcome),
  meta: [known(a.language), known(a.venueYear)].filter(Boolean).join(' · ') || 'Language and venue not reported',
}));

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
/** Counts written as words in running copy ("ten of seventeen"); digits above twenty. */
export const word = (n: number) => WORDS[n] ?? fmt.int(n);
export const capFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const STATS = {
  audited: GLOBAL_STATS.methodsAudited,
  included: GLOBAL_STATS.methodsIncluded,
  ranked: GLOBAL_STATS.methodsRankedPublished,
  excluded: GLOBAL_STATS.methodsExcluded,
  coreUnits: fmt.int(GLOBAL_STATS.coreUnits),
};
