import { GLOBAL_STATS, LEADERBOARD_DATA } from '../../data/benchmarkData';
import { asset, fmt } from '../../lib/format';

/** One published figure: captions follow the article proof, lightly shortened (P06 Figures board). */
export interface PaperFigure {
  n: number;
  title: string;
  /** Label in the section bar. */
  short: string;
  /** Panel note, as in "Figure 3 · panels a–c". */
  panels: string;
  panelCount: number;
  /** Caption shown on the card before "Read full caption". */
  lead: string;
  /** Rest of the caption, revealed by the expander. */
  rest: string;
  take: string;
  w: number;
  h: number;
  source: string;
  /** Viewer shows a link to the leaderboard's pairwise tests. */
  link?: boolean;
}

const run = (id: string) => fmt.secs(LEADERBOARD_DATA.find((m) => m.id === id)?.runtimeS);
/** Track C null-control false-positive rate, as a percentage like every other FPR on the site. */
const nullFpr = (id: string) => {
  const v = LEADERBOARD_DATA.find((m) => m.id === id)?.nullFPRate;
  return v == null ? 'n/a' : fmt.pct(v);
};

export const FIGURES: PaperFigure[] = [
  {
    n: 1,
    title: 'REACH benchmark pipeline',
    short: 'Pipeline',
    panels: 'single panel',
    panelCount: 1,
    lead: 'Ten curated scRNA-seq datasets are ingested, preprocessed, assigned confidence-tiered malignant and background labels, transformed into six evaluation tracks (A–F), evaluated through standardized wrappers for ten methods, and summarized by metrics, statistical tests and figures.',
    rest: 'Each method is evaluated on 1,125 benchmark units, giving 11,250 method–unit evaluations. The schematic mirrors the Phase 0–12 file contracts in docs/architecture.md.',
    take: 'Separates data preparation, multi-arm label validation, track construction, and standardised wrapper execution.',
    w: 1647, h: 1172,
    source: 'Proof Figure 1 (p. 3), Frontiers in Bioinformatics',
  },
  {
    n: 2,
    title: 'REACH evaluation tracks',
    short: 'Tracks',
    panels: 'single panel',
    panelCount: 1,
    lead: 'Tracks A–E are built on the inter-lineage malignant-versus-TME contrast.',
    rest: 'Track F is the intra-lineage diagnostic: its background is restricted to normal epithelial cells of the same tissue origin as the malignant positives, it is built from crc_lee only, and it is not blended into the primary leaderboard. The figure totals 1,110 primary units (A–E) and 15 Track F units, 1,125 per method; the ranked Track A common subset is 140 units.',
    take: 'Each track isolates a distinct failure mode: rarity cliff, synthetic-to-real gap, null specificity, natural CTCs, label noise, and intra-lineage subclone detection.',
    w: 1647, h: 1179,
    source: 'Proof Figure 2 (p. 4), Frontiers in Bioinformatics',
  },
  {
    n: 3,
    title: 'Method audit, leaderboard and multimetric summary',
    short: 'Audit and leaderboard',
    panels: 'panels a–c',
    panelCount: 3,
    lead: '(a) Method inclusion and QC audit: 17 candidates were considered; ten produced evaluable outputs under the standardized score contract and seven were excluded (integration constraints, score-contract mismatch, out-of-memory or timeout failures, degenerate outputs).',
    rest: '(b) Track A AP leaderboard: box-and-strip summaries of fallback-filtered Track A AP, separating the supervised ceiling, exploratory comparator, naive baseline, ranked published methods and random floor. (c) Phase 11 multimetric summary: min–max scaled AP, nAP, AUROC and MCC at top-k, Track E robustness where applicable, runtime and null-control behavior.',
    take: 'Only the six published detectors carry leaderboard ranks. The ceiling, CaSee and the two baselines are reference rows.',
    w: 1391, h: 1409,
    source: 'Proof Figure 3 (p. 5), Frontiers in Bioinformatics',
    link: true,
  },
  {
    n: 4,
    title: 'Rank uncertainty, critical difference and rarity sensitivity',
    short: 'Rank uncertainty',
    panels: 'panels a–c',
    panelCount: 3,
    lead: '(a) Bootstrap AP intervals: Track A AP over 2,000 unit-level bootstrap resamples (rank_ci.csv).',
    rest: '(b) Critical-difference rank view: mean within-unit ranks on the common Track A subset with the Nemenyi critical-difference bar (CD ≈ 1.14, k = 10, N = 140, α = 0.05). Lower is better. (c) Rarity sensitivity: AP across Track A prevalence tiers T1–T4 and the nAP slope against log10 prevalence.',
    take: 'expr_threshold, scMalignantFinder, CellSIUS, RareQ and scCAD form an overlapping rank band. The within-unit ranks in (b) include the reference methods and are not leaderboard ranks. Several methods degrade sharply in ultra-rare units, while the supervised ceiling stays near 1.',
    w: 1653, h: 1975,
    source: 'Proof Figure 4 (p. 14), Frontiers in Bioinformatics',
  },
  {
    n: 5,
    title: 'Track sensitivity, robustness and null behavior',
    short: 'Robustness and null',
    panels: 'panels a–b',
    panelCount: 2,
    lead: '(a) Left: Track A against Track B mean AP per method; the diagonal marks equal performance.',
    rest: 'Right: Track E robustness indices for the supervised ceiling under four label perturbations (Track E is not interpretable for unsupervised methods). (b) Track C null behavior and calibration on 160 background-dominated units; per-method FPR and pairwise statistics are in Table 8. Expected calibration error (ECE-15) is shown only for methods with probability-like outputs.',
    take: `Synthetic Track B does not reproduce the Track A ranking (Spearman ρ = ${GLOBAL_STATS.trackABSpearmanRho.toFixed(3)}, p = ${GLOBAL_STATS.trackABSpearmanP.toFixed(3)}). On null controls every unsupervised method sits at the random floor (${nullFpr('random_baseline')} FPR), and hvg_logreg is the sole outlier (${nullFpr('hvg_logreg')} FPR).`,
    w: 1386, h: 1254,
    source: 'Proof Figure 5 (p. 16), Frontiers in Bioinformatics',
  },
  {
    n: 6,
    title: 'Runtime and AP Pareto behavior',
    short: 'Runtime',
    panels: 'single panel',
    panelCount: 1,
    lead: 'Mean runtime per Track A unit (log scale) against median Track A AP; bubble size encodes unreliability (% fallback or degenerate).',
    rest: 'All methods ran on a CPU-only node (AMD EPYC 7B12, 16 vCPUs, 62 GiB RAM) except DeepScena, which ran on a Google Colab Tesla T4 GPU, so its runtime is not directly comparable. Runtimes are wall-clock times under the standardized wrapper contract. The proof caption also describes a runtime versus cells-per-unit panel, which this image does not include.',
    take: `Higher compute cost does not buy accuracy. CPU runtimes range from ${run('hvg_logreg')} (hvg_logreg) to ${run('CaSee')} (CaSee) per unit. Read them together with fallback and degenerate-output rates.`,
    w: 1152, h: 609,
    source: 'Proof Figure 6 (p. 17), Frontiers in Bioinformatics',
  },
];

export const PANEL_TOTAL = FIGURES.reduce((s, f) => s + f.panelCount, 0);

/** Section id of each figure card (SectionNav, contact-sheet jumps). */
export const figId = (f: PaperFigure) => `figure-${f.n}`;

export const figSrc = (f: PaperFigure) => asset(`figures/paper/fig-${f.n}.webp`);
export const figMeta = (f: PaperFigure) => `Figure ${f.n} · ${f.panels}`;
export const figCaption = (f: PaperFigure) => `${f.lead} ${f.rest}`;

const CITE_AUTHORS = 'Satya Jaswanth MV, Gavin A, Aakash P, Tejesh Kumar M and Dasgupta A';
const JOURNAL = GLOBAL_STATS.journalCitation.replace(/ \(\d{4}\)$/, '');

/** Figure citation in the journal's own style, with the published DOI. */
export const figCitation = (f: PaperFigure) =>
  `Figure ${f.n}, ${f.title}. In: ${CITE_AUTHORS} (${GLOBAL_STATS.year}) ${GLOBAL_STATS.paperTitle}. ${JOURNAL}. doi: ${GLOBAL_STATS.doi}`;
