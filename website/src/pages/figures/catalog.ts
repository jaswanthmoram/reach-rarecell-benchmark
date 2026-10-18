import { fmt } from '../../ui';
import { FIGURES_DATA, GLOBAL_STATS as G, LEADERBOARD_DATA } from '../../data/benchmarkData';
import { href } from '../../app/router';
import { FORMATS } from '../cite/citations';

/** One published figure, as shown in the gallery and the viewer. */
export interface GalleryItem {
  id: string;
  /** Figure number in the article. */
  n: number;
  /** Mono metadata line, e.g. "Figure 3 · panels a–c". The journal and year sit once, in the page header. */
  meta: string;
  /** Short label for the viewer toolbar, e.g. "Figure 3". */
  short: string;
  title: string;
  caption: string;
  /** Opening sentence(s) of the caption, cut at a sentence boundary for the gallery card. */
  captionLead: string;
  /** The remaining sentences, shown behind "Read full caption". Empty when the lead is the whole caption. */
  captionRest: string;
  takeaway: string;
  /** Optional link after the takeaway, used where the full result lives on another page. */
  link?: { label: string; to: string };
  /** Plain-text citation for this figure: figure number plus the article citation (Frontiers style). */
  citation: string;
  source: string;
  src: string;
  size: [number, number];
  format: 'WebP' | 'PNG';
  downloadName: string;
}

const method = (id: string) => LEADERBOARD_DATA.find((m) => m.id === id);
const hvg = method('hvg_logreg');
const rnd = method('random_baseline');
const cpuRuntimes = LEADERBOARD_DATA.filter((m) => m.id !== 'DeepScena').map((m) => m.runtimeS);
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
/** Small counts as words (prose style of the proof captions). */
const word = (n: number) => WORDS[n] ?? String(n);
const secs = (v: number) => `${v.toFixed(1)} s`;
const proofFig = (id: string) => FIGURES_DATA.find((f) => f.id === id);

/* ---------- Published figures (canonical exports of the proof figures) ---------- */

interface PublishedSpec { n: number; panels: string; page: string; size: [number, number]; title: string; caption: string; takeaway: string; link?: GalleryItem['link'] }

/**
 * Captions follow the proof's own figure captions (pp. 3–17), lightly shortened. Counts come from GLOBAL_STATS /
 * LEADERBOARD_DATA. The proof's Figure 2 caption sentence ("1,125 units per method total across Tracks A–E, plus
 * 15 Track F units") contradicts its own figure; the figure's totals (1,110 + 15 = 1,125) are used here.
 */
const PUBLISHED_SPECS: PublishedSpec[] = [
  {
    n: 1, panels: 'single panel', page: 'p. 3', size: [1647, 1172],
    title: 'REACH benchmark pipeline',
    caption: `Ten curated scRNA-seq datasets are ingested, preprocessed, assigned confidence-tiered malignant and background labels, transformed into ${word(G.tracksCount)} evaluation tracks (A–F), evaluated through standardized wrappers for ${word(G.methodsIncluded)} methods, and summarized by metrics, statistical tests and figures. Each method is evaluated on ${fmt.int(G.totalUnits)} benchmark units, giving ${fmt.int(G.totalEvaluations)} method–unit evaluations. The schematic mirrors the Phase 0–12 file contracts in docs/architecture.md.`,
    takeaway: proofFig('fig-proof-1')?.keyTakeaway ?? '',
  },
  {
    n: 2, panels: 'single panel', page: 'p. 4', size: [1647, 1179],
    title: 'REACH evaluation tracks',
    caption: `Tracks A–E are built on the inter-lineage malignant-versus-TME contrast. Track F is the intra-lineage diagnostic: its background is restricted to normal epithelial cells of the same tissue origin as the malignant positives, it is built from crc_lee only, and it is not blended into the primary leaderboard. The figure totals ${fmt.int(G.coreUnits)} primary units (A–E) and ${G.trackFUnits} Track F units, ${fmt.int(G.totalUnits)} per method; the ranked Track A common subset is ${G.trackACommonUnits} units.`,
    takeaway: proofFig('fig-proof-2')?.keyTakeaway ?? '',
  },
  {
    n: 3, panels: 'panels a–c', page: 'p. 5', size: [1391, 1409],
    title: 'Method audit, leaderboard and multimetric summary',
    caption: `(a) Method inclusion and QC audit: ${G.methodsAudited} candidates were considered; ${word(G.methodsIncluded)} produced evaluable outputs under the standardized score contract and ${word(G.methodsExcluded)} were excluded (integration constraints, score-contract mismatch, out-of-memory or timeout failures, degenerate outputs). (b) Track A AP leaderboard: box-and-strip summaries of fallback-filtered Track A AP, separating the supervised ceiling, exploratory comparator, naive baseline, ranked published methods and random floor. (c) Phase 11 multimetric summary: min–max scaled AP, nAP, AUROC and MCC at top-k, Track E robustness where applicable, runtime and null-control behavior.`,
    takeaway: `Only the ${word(G.methodsRankedPublished)} published detectors carry leaderboard ranks. The ceiling, CaSee and the two baselines are reference rows.`,
    link: { label: 'See pairwise tests', to: href('/leaderboard') },
  },
  {
    n: 4, panels: 'panels a–c', page: 'p. 14', size: [1653, 1975],
    title: 'Rank uncertainty, critical difference and rarity sensitivity',
    // 2,000 unit-level resamples: proof Figure 4 caption (also FIGURES_DATA 'fig7').
    caption: `(a) Bootstrap AP intervals: Track A AP over 2,000 unit-level bootstrap resamples (rank_ci.csv). (b) Critical-difference rank view: mean within-unit ranks on the common Track A subset with the Nemenyi critical-difference bar (CD ≈ ${G.nemenyiCD}, k = ${G.methodsIncluded}, N = ${G.trackACommonUnits}, α = 0.05). Lower is better. (c) Rarity sensitivity: AP across Track A prevalence tiers T1–T4 and the nAP slope against log10 prevalence.`,
    takeaway: 'expr_threshold, scMalignantFinder, CellSIUS, RareQ and scCAD form an overlapping rank band. The within-unit ranks in (b) include the reference methods and are not leaderboard ranks. Several methods degrade sharply in ultra-rare units, while the supervised ceiling stays near 1.',
  },
  {
    n: 5, panels: 'panels a–b', page: 'p. 16', size: [1386, 1254],
    title: 'Track sensitivity, robustness and null behavior',
    caption: `(a) Left: Track A against Track B mean AP per method; the diagonal marks equal performance. Right: Track E robustness indices for the supervised ceiling under four label perturbations (Track E is not interpretable for unsupervised methods). (b) Track C null behavior and calibration on ${G.trackCUnits} background-dominated units; per-method FPR and pairwise statistics are in Table 8. Expected calibration error (ECE-15) is shown only for methods with probability-like outputs.`,
    takeaway: `Synthetic Track B does not reproduce the Track A ranking (Spearman ρ = ${G.trackABSpearmanRho}, p = ${G.trackABSpearmanP}). On null controls every unsupervised method sits at the random floor (${rnd ? `${(rnd.nullFPRate * 100).toFixed(1)}%` : '3%'} FPR), and hvg_logreg is the sole outlier (FPR ${hvg ? fmt.ap(hvg.nullFPRate) : '0.788'}).`,
  },
  {
    n: 6, panels: 'single panel', page: 'p. 17', size: [1152, 609],
    title: 'Runtime and AP Pareto behavior',
    caption: 'Mean runtime per Track A unit (log scale) against median Track A AP; bubble size encodes unreliability (% fallback or degenerate). All methods ran on a CPU-only node (AMD EPYC 7B12, 16 vCPUs, 62 GiB RAM) except DeepScena, which ran on a Google Colab Tesla T4 GPU, so its runtime is not directly comparable. Runtimes are wall-clock times under the standardized wrapper contract. The proof caption also describes a runtime versus cells-per-unit panel, which this image does not include.',
    takeaway: `Higher compute cost does not buy accuracy. CPU runtimes range from ${secs(Math.min(...cpuRuntimes))} (hvg_logreg) to ${secs(Math.max(...cpuRuntimes))} (CaSee) per unit. Read them together with fallback and degenerate-output rates.`,
  },
];

/** Character budget for the card caption. At least one full sentence is always shown, never a cut word. */
const LEAD_BUDGET = 210;

/** Split at sentence ends (". " before a capital or an opening panel letter), keeping each sentence whole. */
export function splitCaption(text: string, budget = LEAD_BUDGET): [string, string] {
  const sentences = text.split(/(?<=\.)\s+(?=[A-Z(])/);
  let lead = sentences[0];
  let i = 1;
  while (i < sentences.length && lead.length + 1 + sentences[i].length <= budget) { lead += ` ${sentences[i]}`; i += 1; }
  return [lead, sentences.slice(i).join(' ')];
}

const ARTICLE_CITATION = FORMATS.find((f) => f.id === 'frontiers')?.text ?? `${G.paperTitle}. ${G.journalCitation}. doi: ${G.doi}`;
const DOI_NOTE = G.doiConfirmed ? '' : ' (DOI pending final publication)';

export const PUBLISHED: GalleryItem[] = PUBLISHED_SPECS.map((s) => {
  const [captionLead, captionRest] = splitCaption(s.caption);
  return {
    id: `paper-fig-${s.n}`,
    n: s.n,
    meta: `Figure ${s.n} · ${s.panels}`,
    short: `Figure ${s.n}`,
    title: s.title,
    caption: s.caption,
    captionLead,
    captionRest,
    takeaway: s.takeaway,
    link: s.link,
    citation: `Figure ${s.n}, ${s.title}. In: ${ARTICLE_CITATION}${DOI_NOTE}`,
    source: `Proof Figure ${s.n} (${s.page}), ${G.journalName}`,
    src: `figures/paper/fig-${s.n}.webp`,
    size: s.size,
    format: 'WebP',
    downloadName: `REACH-Figure-${s.n}.webp`,
  };
});
