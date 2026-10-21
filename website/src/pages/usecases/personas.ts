import { DATASET_METHOD_MATRIX, GLOBAL_STATS as G, LEADERBOARD_DATA, PAIRWISE_COMPARISONS, TRACK_E_NOISE_CONDITIONS } from '../../data/benchmarkData';
import { fmt } from '../../lib/format';
import type { RoutePath } from '../../lib/router';

/* Reader journeys from the Use cases canvas board (P10). Numbers come from benchmarkData.ts wherever it has them. */

export interface Dest { path: RoutePath; query?: string }
export interface Step { l: string; to: Dest; does: string; learns: string }
export interface Edge { step: number; q: string; a: string; l: string; to: Dest }
export interface Persona {
  id: string;
  role: string;
  goal: string;
  context: string;
  questions: string[];
  leaves: string;
  /** Page that answers the main question (a hero destination). */
  key: RoutePath;
  keyStop: number;
  keyLabel: string;
  steps: Step[];
  edges: Edge[];
}

const m = (id: string) => {
  const r = LEADERBOARD_DATA.find((x) => x.method === id);
  if (!r) throw new Error(`Use cases: method ${id} missing from LEADERBOARD_DATA`);
  return r;
};
const pair = (a: string, b: string) => {
  const p = PAIRWISE_COMPARISONS.find((x) => x.methodA === a && x.methodB === b);
  return p ? p.pAdjusted.replace(/\s*\(NS\)/, '') : 'n/a';
};
const cohort = (dataset: string) => DATASET_METHOD_MATRIX.filter((c) => c.dataset === dataset);
const pct = (v: number) => fmt.pct(v);
const secs = (v: number) => `${Math.round(v)} s`;
const noise = (code: string) => TRACK_E_NOISE_CONDITIONS.find((c) => c.code === code)?.meanAP ?? 0;

const fire = m('FiRE');
const cellsius = m('CellSIUS');
const scmf = m('scMalignantFinder');
const sccad = m('scCAD');
const casee = m('CaSee');
const expr = m('expr_threshold');
const hvg = m('hvg_logreg');
const random = m('random_baseline');

/** Intra-lineage collapse (Track F): the largest AP any of these four reaches at any prevalence. */
const collapse = Math.max(...['FiRE', 'CellSIUS', 'RareQ', 'scCAD'].map((id) => { const r = m(id); return Math.max(r.trackF01AP, r.trackF05AP, r.trackF10AP); }));
const scmfF = [scmf.trackF01AP, scmf.trackF05AP, scmf.trackF10AP];

const rcc = cohort('rcc_multi');
const rccExpr = rcc.find((c) => c.method === 'expr_threshold')?.meanAP ?? 0;
const rccBest = rcc.filter((c) => c.method !== 'hvg_logreg').reduce((a, b) => ((b.meanAP ?? 0) > (a.meanAP ?? 0) ? b : a));
const rccBestName = LEADERBOARD_DATA.find((r) => r.id.toLowerCase() === rccBest.method.toLowerCase())?.method ?? rccBest.method;

const unsupervised = LEADERBOARD_DATA.filter((r) => r.category !== 'Supervised Ceiling');
const trackDTop = unsupervised.reduce((a, b) => (b.trackDAP > a.trackDAP ? b : a));
const cnvRange = G.cnvRangeAUROC.replace(/\s*–\s*/, ' to ');
const runs = fmt.int(G.totalEvaluations);

const TRACK = (t: string): Dest => ({ path: '/tracks', query: `track=${t}` });
const P = (path: RoutePath): Dest => ({ path });

export const PERSONAS: Persona[] = [
  {
    id: 'analyst',
    role: 'Computational biologist',
    goal: 'Choose an unsupervised detector for a new tumour scRNA-seq dataset where malignant cells may be rare.',
    context: 'Has a fresh solid-tumour cohort, no labels and an unknown malignant fraction that could be under 1%. Needs a defensible choice for a methods section.',
    questions: ['Which detector scores highest on rare-cell AP, and by how much?', 'Does that hold below 0.1% prevalence?', 'Will it flag cells in tissue that has no tumour at all?', 'How long does it take per sample?'],
    leaves: 'A shortlist of two detectors, the prevalence range where each holds, and the null-control false-positive rate to quote.',
    key: '/tracks', keyStop: 2, keyLabel: 'Track A',
    steps: [
      { l: 'Leaderboard', to: P('/leaderboard'), does: 'Reads the six ranked published detectors and their bootstrap intervals.', learns: `FiRE has the highest median AP among the ranked published detectors (${fmt.ap(fire.medianAP)}, Track A). The naive expr_threshold baseline sits at ${fmt.ap(expr.medianAP)}, and the pairwise test finds no significant difference between the two (BH-FDR ${pair('FiRE', 'expr_threshold')}).` },
      { l: 'Track A', to: TRACK('a'), does: 'Opens Track A and compares the four prevalence tiers.', learns: `At T4 (0.01 to 0.1%) CellSIUS falls to ${fmt.ap(cellsius.t4AP)} mean AP; FiRE keeps ${fmt.ap(fire.t4AP)}.` },
      { l: 'Track C', to: TRACK('c'), does: 'Checks the background-only null controls.', learns: `Across the ${G.trackCUnits} tumour-free units, FiRE flags ${pct(fire.nullFPRate)} of cells. The supervised ceiling flags ${pct(hvg.nullFPRate)}.` },
      { l: 'Methods', to: P('/methods'), does: 'Weighs cost against accuracy.', learns: `FiRE takes about ${secs(fire.runtimeS)} per unit; scMalignantFinder about ${secs(scmf.runtimeS)}.` },
      { l: 'Reproduce · Quickstart', to: P('/reproduce'), does: 'Runs one method on the toy unit before touching real data.', learns: 'The toy unit has the same file layout as a real track unit, so the wrapper call carries over.' },
    ],
    edges: [
      { step: 1, q: 'My malignant cells sit inside normal cells of the same lineage.', a: `That is the intra-lineage regime (Track F). FiRE, CellSIUS, RareQ and scCAD all collapse to AP ≤ ${fmt.ap(collapse)}. scMalignantFinder holds (AP ${fmt.ap(Math.min(...scmfF))} to ${fmt.ap(Math.max(...scmfF))}, crc_lee only), and the paper says this result does not generalise.`, l: 'Track F', to: TRACK('f') },
      { step: 1, q: 'My tumour is mesenchymal, like clear-cell RCC.', a: `The expression-burden baseline fails on rcc_multi (mean AP ${fmt.ap(rccExpr)}) and no non-ceiling method passes ${fmt.ap(rccBest.meanAP)} there (${rccBestName}). Absolute values stay low.`, l: 'Datasets', to: P('/datasets') },
      { step: 3, q: 'I only have a CPU.', a: 'DeepScena is the only method whose paper runs used a GPU (Colab T4), so its runtime is not comparable. Per-unit runtimes for the other nine are on the Methods page.', l: 'Methods', to: P('/methods') },
    ],
  },
  {
    id: 'developer',
    role: 'Method developer',
    goal: 'Benchmark a new rare-cell detector against the panel and report the result on the same footing.',
    context: 'Has a working detector in Python or R and a paper deadline. Wants the same units, seeds and metrics as the published run.',
    questions: ['What does my method have to read and return?', 'Which units and tracks should I run?', 'How are failures and constant outputs counted?', 'Where would my method sit next to the ranked six?'],
    leaves: 'A result table on the same units and seeds as the paper, with degenerate and fallback counts reported the same way.',
    key: '/reproduce', keyStop: 1, keyLabel: 'Reproduce · Add a method',
    steps: [
      { l: 'Reproduce · Add a method', to: P('/reproduce'), does: 'Copies the wrapper template and reads the contract.', learns: 'A method is one wrapper class: it reads a blind unit and returns one score per cell. Nothing else in the pipeline changes.' },
      { l: 'Tracks', to: P('/tracks'), does: 'Picks the tracks to run.', learns: `Track A (${G.trackAUnits} units) is the ranked endpoint; ${fmt.int(G.totalUnits)} units across ${G.tracksCount === 6 ? 'six' : G.tracksCount} tracks in total.` },
      { l: 'Reproduce · Data and archives', to: P('/reproduce'), does: 'Downloads the frozen track units from Zenodo.', learns: 'Processed data, track units and predictions are archived. Raw counts stay on GEO.' },
      { l: 'Leaderboard', to: P('/leaderboard'), does: 'Places the new median AP against the ranked block and the reference lines.', learns: `Compare against the bootstrap intervals: the middle band overlaps, and expr_threshold (${fmt.ap(expr.medianAP)}) is the bar any detector should clear.` },
      { l: 'Cite', to: P('/cite'), does: 'Cites the benchmark and the archive version.', learns: `Cite the paper (${G.journalCitation}) and the Zenodo concept DOI.` },
    ],
    edges: [
      { step: 3, q: 'My method returns constant scores on some units.', a: `REACH logs constant-score outputs as degenerate and reports a median that excludes them alongside the raw one. scMalignantFinder is degenerate on ${scmf.degeneratePct}% of units; CaSee on ${casee.degeneratePct}%.`, l: 'Leaderboard', to: P('/leaderboard') },
      { step: 2, q: 'My method crashes on a few units.', a: `Failed runs are counted and reported as fallback units: ${G.fallbackUnitsTotal} across the panel, with scCAD falling back on ${sccad.fallbackPct}% of its units.`, l: 'Methods', to: P('/methods') },
      { step: 3, q: 'My method needs labels to train.', a: `The panel’s only supervised model, hvg_logreg, is reported as an in-sample ceiling (median AP ${fmt.ap(hvg.medianAP)}) and is not ranked. Track E shows supervised scores dropping from ${fmt.ap(noise('clean'))} to ${fmt.ap(noise('fp_30'))} mean AP when 30% of background cells are mislabelled positive.`, l: 'Track E', to: TRACK('e') },
    ],
  },
  {
    id: 'reviewer',
    role: 'Peer reviewer',
    goal: 'Check the paper’s claims against the evidence in one sitting.',
    context: 'Reviewing a manuscript that cites REACH, or the REACH paper itself. Sceptical of rankings that put one method ahead everywhere, and of circular labels.',
    questions: ['Is the ranking statistically supported, or is it noise?', 'How was ground truth built, and is it circular with the methods?', 'Do false positives stay at chance on tumour-free tissue?', 'Can the tables be rebuilt from what is published?'],
    leaves: 'A short list of verified claims with figure and table numbers, and the one caveat to raise: inter-lineage scope.',
    key: '/leaderboard', keyStop: 1, keyLabel: 'Leaderboard',
    steps: [
      { l: 'Leaderboard', to: P('/leaderboard'), does: 'Reads the omnibus test and the pairwise results.', learns: `Friedman χ² ${G.friedmanChi2} (p ${G.friedmanPAsPrinted}, ${G.friedmanN} common units), yet FiRE vs scMalignantFinder is not significant (BH-FDR ${pair('FiRE', 'scMalignantFinder')}).` },
      { l: 'Datasets', to: P('/datasets'), does: 'Inspects the four-arm label evidence.', learns: `CNV calls agree with published annotations at AUROC ${fmt.ap(G.cnvOverallAUROC)} on ${fmt.int(G.cnvValidatedCells)} cells (range ${cnvRange}).` },
      { l: 'Track C', to: TRACK('c'), does: 'Checks the null controls.', learns: `On the ${G.trackCUnits} background-only units, unsupervised detectors stay near the random floor (${pct(random.nullFPRate)}).` },
      { l: 'Figures', to: P('/figures'), does: 'Compares the published figures at full size.', learns: 'The published figures are shown as printed, each labelled with its figure number.' },
      { l: 'Reproduce · The paper', to: P('/reproduce'), does: 'Rebuilds the tables from frozen snapshots.', learns: 'Phase 11 tables and Phase 12 figures regenerate from CSV snapshots tracked in Git.' },
    ],
    edges: [
      { step: 1, q: 'The labels use CNV. Is the ranking circular?', a: `REACH rebuilt the labels without the CNV criterion: the method order is broadly preserved (Spearman ρ = ${fmt.ap(G.circularitySpearmanRho)}, p = ${fmt.ap(G.circularityP)}), though the CNV-free APs sit near chance.`, l: 'Datasets', to: P('/datasets') },
      { step: 0, q: 'The abstract names a strong method. Does one method lead everywhere?', a: `No single method leads on every track. FiRE has the highest median AP among the ranked published detectors on Track A, with no significant difference from scMalignantFinder (BH-FDR ${pair('FiRE', 'scMalignantFinder')}).`, l: 'Leaderboard', to: P('/leaderboard') },
      { step: 4, q: 'Which DOI do I cite, the article or the archive?', a: `Both resolve. Cite the article (DOI ${G.doi}, published ${G.publishedDate}) for the claims, and the Zenodo concept DOI (${G.zenodoConceptDoi}) for the data and code version.`, l: 'Cite', to: P('/cite') },
    ],
  },
  {
    id: 'lead',
    role: 'PI or translational lead',
    goal: 'Decide whether rare-cell detection is reliable enough to plan a study around it.',
    context: 'Planning a cohort study (residual disease, circulating tumour cells) and deciding where to spend sequencing budget. Reads summaries and figures.',
    questions: ['How low a prevalence can current methods reach?', 'Does it work in blood and circulating tumour cells?', 'Which tumour types are covered?', 'What should we not promise from these results?'],
    leaves: 'A realistic prevalence floor for study design and a clear statement of what the methods cannot do yet.',
    key: '/tracks', keyStop: 2, keyLabel: 'Track A',
    steps: [
      { l: 'Overview', to: P('/'), does: 'Reads the headline findings.', learns: `${G.datasetsCount} cohorts (${G.solidCohorts} solid, ${G.hematologicCohorts} haematologic), ${G.totalCells} cells, ${G.methodsIncluded} methods.` },
      { l: 'Track A', to: TRACK('a'), does: 'Looks at the lowest prevalence tier.', learns: `Below 0.1%, median AP is low for every unsupervised method; FiRE keeps the highest mean (${fmt.ap(fire.t4AP)}).` },
      { l: 'Track D', to: TRACK('d'), does: 'Checks natural blood and CTC samples.', learns: `On ${G.trackDUnits} natural-prevalence units, every unsupervised method stays at or below ${fmt.ap(trackDTop.trackDAP)} mean AP (${trackDTop.method} scores highest).` },
      { l: 'Datasets', to: P('/datasets'), does: 'Checks tissue coverage against the planned cohort.', learns: 'Each cohort lists its platform, accession, cell count and the tracks it feeds.' },
      { l: 'Cite', to: P('/cite'), does: 'Takes the citation for the grant text.', learns: `${G.journalCitation}, ${G.license}.` },
    ],
    edges: [
      { step: 2, q: 'Our samples are liquid biopsies.', a: 'Track D is the closest match: natural prevalence, no spike-ins. Absolute APs are low, so plan for orthogonal confirmation of any cell a detector flags.', l: 'Track D', to: TRACK('d') },
      { step: 1, q: 'We need to separate tumour from normal epithelium.', a: 'That is intra-lineage detection. No general-purpose unsupervised method in the panel does it at a practically useful level (Track F).', l: 'Track F', to: TRACK('f') },
      { step: 1, q: 'Can we use this for clinical decisions?', a: 'REACH is a research benchmark of detection accuracy. It makes no clinical-validity claim, and its leaderboard covers inter-lineage contrasts only.', l: 'Overview', to: P('/') },
    ],
  },
  {
    id: 'student',
    role: 'Student reproducing the paper',
    goal: 'Rebuild the paper’s tables and figures on a laptop and understand every step.',
    context: 'A graduate student in a journal club or a methods course. One laptop, limited disk, no cluster.',
    questions: ['What do I install, and which Python?', 'Do I need the full raw data?', 'How long will it take?', 'How do I know my numbers match?'],
    leaves: 'Rebuilt tables that match the paper, and a clear map from each figure to the phase that produced it.',
    key: '/reproduce', keyStop: 1, keyLabel: 'Reproduce · Install',
    steps: [
      { l: 'Reproduce · Install', to: P('/reproduce'), does: 'Installs the package and verifies it.', learns: 'Python 3.11 or newer. The paper’s runs used Python 3.13.5. One CLI entry point, rcb.' },
      { l: 'Reproduce · Quickstart', to: P('/reproduce'), does: 'Runs one method on the toy unit.', learns: 'End to end in minutes, without downloading anything.' },
      { l: 'Reproduce · The paper', to: P('/reproduce'), does: 'Rebuilds the Phase 11 tables from snapshots.', learns: `No rerun of the ${runs} method-unit predictions is needed for the tables and figures.` },
      { l: 'Figures', to: P('/figures'), does: 'Puts the regenerated figures next to the published ones.', learns: 'Each published figure is labelled with its number for a side-by-side check.' },
      { l: 'Cite', to: P('/cite'), does: 'Cites the archive version used.', learns: 'Cite the paper and the Zenodo version the snapshots came from.' },
    ],
    edges: [
      { step: 2, q: 'I only have a laptop CPU.', a: 'Snapshot mode needs no GPU and no full data. A full-data rerun of every prediction is the only path that needs the Zenodo archives and serious compute.', l: 'Reproduce · The paper', to: P('/reproduce') },
      { step: 0, q: 'The R methods will not install.', a: 'R methods are an optional extra with their own install notes. The snapshot rebuild does not need them.', l: 'Reproduce · Install', to: P('/reproduce') },
      { step: 3, q: 'My numbers differ from the paper.', a: 'Check seeds and checksums first: every unit is built from fixed seeds and the snapshots ship with checksums.', l: 'Reproduce · The paper', to: P('/reproduce') },
    ],
  },
];

/** The eight pages every route is mapped onto (matrix columns). */
export const COLS: { path: RoutePath; label: string }[] = [
  { path: '/', label: 'Overview' },
  { path: '/leaderboard', label: 'Leaderboard' },
  { path: '/tracks', label: 'Tracks' },
  { path: '/datasets', label: 'Datasets' },
  { path: '/methods', label: 'Methods' },
  { path: '/figures', label: 'Figures' },
  { path: '/reproduce', label: 'Reproduce' },
  { path: '/cite', label: 'Cite' },
];
export const labelOf = (path: RoutePath) => COLS.find((c) => c.path === path)?.label ?? 'Overview';

/** Hero destinations: vertical position (% of the field) of each page that answers a main question. */
export const DEST: { path: RoutePath; y: number }[] = [
  { path: '/leaderboard', y: 16 },
  { path: '/tracks', y: 50 },
  { path: '/reproduce', y: 84 },
];

export const DEFAULT_ID = PERSONAS[0].id;
export const personaOf = (id: string | null) => PERSONAS.find((p) => p.id === id) ?? PERSONAS[0];
export const edgeKey = (p: Persona, i: number) => `${p.id}-${i}`;
export const EDGE_KEYS = PERSONAS.flatMap((p) => p.edges.map((_, i) => edgeKey(p, i)));
/** Pages a reader visits, as steps or edge cases. */
export const pagesOf = (p: Persona) => new Set<RoutePath>([...p.steps, ...p.edges].map((x) => x.to.path));
