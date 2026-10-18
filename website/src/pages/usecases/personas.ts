// Personas for the Use cases page. Assumption-based: drawn from the audience the paper names (practitioners
// choosing a detector, method developers, reviewers, translational groups, students reproducing the study), not
// from interviews. Every number is read from benchmarkData.ts so it cannot drift from the leaderboard.
import { GLOBAL_STATS as G, LEADERBOARD_DATA, PAIRWISE_COMPARISONS, PRACTITIONER_SCENARIOS, TRACKS_DATA, TRACK_E_NOISE_CONDITIONS } from '../../data/benchmarkData';
import type { RoutePath } from '../../app/router';
import type { IconName } from '../../ui';

const m = (id: string) => {
  const r = LEADERBOARD_DATA.find((x) => x.id.toLowerCase() === id.toLowerCase());
  if (!r) throw new Error(`usecases: unknown method ${id}`);
  return r;
};
const ap = (v: number) => v.toFixed(3);
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const pair = (a: string, b: string) => PAIRWISE_COMPARISONS.find((p) => p.methodA === a && p.methodB === b);
const bh = (a: string, b: string) => (pair(a, b)?.pAdjusted ?? '').replace(/\s*\(NS\)/, '');
const track = (code: string) => TRACKS_DATA.find((t) => t.code === code)!;
const noise = (code: string) => TRACK_E_NOISE_CONDITIONS.find((n) => n.code === code)!;
const scenario = (id: string) => PRACTITIONER_SCENARIOS.find((s) => s.id === id)!;

export interface Dest { path: RoutePath; query?: string; anchor?: string; label: string }
export interface Step { dest: Dest; does: string; learns: string }
export interface EdgeCase { id: string; step: number; q: string; a: string; dest: Dest }
export interface Persona {
  id: string;
  role: string;
  icon: IconName;
  goal: string;
  context: string;
  questions: string[];
  steps: Step[];
  edges: EdgeCase[];
  leaves: string;
}

const FIRE = m('FiRE');
const EXPR = m('expr_threshold');
const CELLSIUS = m('cellsius');
const SCMF = m('scMalignantFinder');
const SCCAD = m('scCAD');
const HVG = m('hvg_logreg');
const CASEE = m('CaSee');

const D = {
  leaderboard: { path: '/leaderboard', label: 'Leaderboard' },
  trackA: { path: '/tracks', query: 'track=a', label: 'Track A' },
  trackC: { path: '/tracks', query: 'track=c', label: 'Track C' },
  trackD: { path: '/tracks', query: 'track=d', label: 'Track D' },
  trackE: { path: '/tracks', query: 'track=e', label: 'Track E' },
  trackF: { path: '/tracks', query: 'track=f', label: 'Track F' },
  tracks: { path: '/tracks', label: 'Tracks' },
  datasets: { path: '/datasets', label: 'Datasets' },
  methods: { path: '/methods', label: 'Methods' },
  figures: { path: '/figures', label: 'Figures' },
  overview: { path: '/', label: 'Overview' },
  cite: { path: '/cite', label: 'Cite' },
  install: { path: '/docs', anchor: 'install', label: 'Docs · Install' },
  quickstart: { path: '/docs', anchor: 'quickstart', label: 'Docs · Quickstart' },
  reproduce: { path: '/docs', anchor: 'reproduce', label: 'Docs · Reproduce' },
  addMethod: { path: '/docs', anchor: 'add-method', label: 'Docs · Add a method' },
  data: { path: '/docs', anchor: 'data', label: 'Docs · Data and archives' },
} satisfies Record<string, Dest>;

const intraLineage = scenario('intra-lineage');
// 'FiRE, CellSIUS, RareQ, scCAD (all collapse to AP ≤ 0.041)' -> 'FiRE, CellSIUS, RareQ and scCAD all collapse to AP ≤ 0.041'
const intraAvoid = intraLineage.avoidMethods.replace(/, ([^,(]+?) \(all collapse to ([^)]+)\)/i, ' and $1 all collapse to $2');
// 'AP = 0.917 – 1.000 on crc_lee only (…)' -> 'AP 0.917 to 1.000'
const intraAP = intraLineage.expectedAP.replace(/ on crc_lee only.*$/, '').replace(/\s*=\s*/, ' ').replace(/\s*–\s*/, ' to ');

export const PERSONAS: Persona[] = [
  {
    id: 'analyst',
    role: 'Computational biologist',
    icon: 'microscope',
    goal: 'Choose an unsupervised detector for a new tumour scRNA-seq dataset where malignant cells may be rare.',
    context: 'Has a fresh solid-tumour cohort, no labels and an unknown malignant fraction that could be under 1%. Needs a defensible choice for a methods section.',
    questions: [
      'Which detector finds rare malignant cells best, and by how much?',
      'Does that hold below 0.1% prevalence?',
      'Will it flag cells in tissue that has no tumour at all?',
      'How long does it take per sample?',
    ],
    steps: [
      { dest: D.leaderboard, does: 'Reads the six ranked published detectors and their bootstrap intervals.', learns: `FiRE has the highest median AP among the ranked published detectors (${ap(FIRE.medianAP)}, Track A). The naive expr_threshold baseline sits at ${ap(EXPR.medianAP)}, and the pairwise test finds no significant difference between the two (BH-FDR ${bh('FiRE', 'expr_threshold')}).` },
      { dest: D.trackA, does: 'Opens Track A and compares the four prevalence tiers.', learns: `At T4 (0.01 to 0.1%) CellSIUS falls to ${ap(CELLSIUS.t4AP)} mean AP; FiRE keeps ${ap(FIRE.t4AP)}.` },
      { dest: D.trackC, does: 'Checks the background-only null controls.', learns: `Across the ${track('Track C').units} tumour-free units, FiRE flags ${pct(FIRE.nullFPRate)} of cells. The supervised ceiling flags ${pct(HVG.nullFPRate)}.` },
      { dest: D.methods, does: 'Weighs cost against accuracy.', learns: `FiRE takes about ${FIRE.runtimeS.toFixed(0)} s per unit; scMalignantFinder about ${SCMF.runtimeS.toFixed(0)} s.` },
      { dest: D.quickstart, does: 'Runs one method on the toy unit before touching real data.', learns: 'The toy unit has the same file layout as a real track unit, so the wrapper call carries over.' },
    ],
    edges: [
      { id: 'intra', step: 1, q: 'My malignant cells sit inside normal cells of the same lineage.', a: `That is the intra-lineage regime (Track F). ${intraAvoid}. scMalignantFinder holds (${intraAP}, crc_lee only), and the paper says this result does not generalise.`, dest: D.trackF },
      { id: 'mesen', step: 1, q: 'My tumour is mesenchymal, like clear-cell RCC.', a: `The expression-burden baseline fails on rcc_multi (mean AP 0.020) and no non-ceiling method passes 0.193 there (CellSIUS). Absolute values stay low.`, dest: D.datasets },
      { id: 'cpu', step: 3, q: 'I only have a CPU.', a: `DeepScena is the only method whose paper runs used a GPU (Colab T4), so its runtime is not comparable. Per-unit runtimes for the other nine are on the Methods page.`, dest: D.methods },
    ],
    leaves: 'A shortlist of two detectors, the prevalence range where each holds, and the null-control false-positive rate to quote.',
  },
  {
    id: 'developer',
    role: 'Method developer',
    icon: 'brackets-curly',
    goal: 'Benchmark a new rare-cell detector against the panel and report the result on the same footing.',
    context: 'Has a working detector in Python or R and a paper deadline. Wants the same units, seeds and metrics as the published run.',
    questions: [
      'What does my method have to read and return?',
      'Which units and tracks should I run?',
      'How are failures and constant outputs counted?',
      'Where would my method sit next to the ranked six?',
    ],
    steps: [
      { dest: D.addMethod, does: 'Copies the wrapper template and reads the contract.', learns: 'A method is one wrapper class: it reads a blind unit and returns one score per cell. Nothing else in the pipeline changes.' },
      { dest: D.tracks, does: 'Picks the tracks to run.', learns: `Track A (${track('Track A').units} units) is the ranked endpoint; ${G.totalUnits.toLocaleString('en-US')} units across six tracks in total.` },
      { dest: D.data, does: 'Downloads the frozen track units from Zenodo.', learns: 'Processed data, track units and predictions are archived. Raw counts stay on GEO.' },
      { dest: D.leaderboard, does: 'Places the new median AP against the ranked block and the reference lines.', learns: `Compare against the bootstrap intervals: the middle band overlaps, and expr_threshold (${ap(EXPR.medianAP)}) is the bar any detector should clear.` },
      { dest: D.cite, does: 'Cites the benchmark and the archive version.', learns: `Cite the paper (${G.journalCitation}) and the Zenodo concept DOI.` },
    ],
    edges: [
      { id: 'const', step: 3, q: 'My method returns constant scores on some units.', a: `REACH logs constant-score outputs as degenerate and reports a median that excludes them alongside the raw one. scMalignantFinder is degenerate on ${SCMF.degeneratePct}% of units; CaSee on ${CASEE.degeneratePct}%.`, dest: D.leaderboard },
      { id: 'fails', step: 2, q: 'My method crashes on a few units.', a: `Failed runs are counted and reported as fallback units: ${G.fallbackUnitsTotal} across the panel, with scCAD falling back on ${SCCAD.fallbackPct}% of its units.`, dest: D.methods },
      { id: 'labels', step: 3, q: 'My method needs labels to train.', a: `The panel's only supervised model, hvg_logreg, is reported as an in-sample ceiling (median AP ${ap(HVG.medianAP)}) and is not ranked. Track E shows supervised scores dropping from ${ap(noise('clean').meanAP)} to ${ap(noise('fp_30').meanAP)} mean AP when 30% of background cells are mislabelled positive.`, dest: D.trackE },
    ],
    leaves: 'A result table on the same units and seeds as the paper, with degenerate and fallback counts reported the same way.',
  },
  {
    id: 'reviewer',
    role: 'Peer reviewer',
    icon: 'seal-check',
    goal: 'Check the paper’s claims against the evidence in one sitting.',
    context: 'Reviewing a manuscript that cites REACH, or the REACH paper itself. Sceptical of single-winner rankings and circular labels.',
    questions: [
      'Is the ranking statistically supported, or is it noise?',
      'How was ground truth built, and is it circular with the methods?',
      'Do false positives stay at chance on tumour-free tissue?',
      'Can the tables be rebuilt from what is published?',
    ],
    steps: [
      { dest: D.leaderboard, does: 'Reads the omnibus test and the pairwise results.', learns: `Friedman χ² ${G.friedmanChi2} (p ${G.friedmanPAsPrinted}, ${G.friedmanN} common units), yet FiRE vs scMalignantFinder is not significant (BH-FDR ${bh('FiRE', 'scMalignantFinder')}).` },
      { dest: D.datasets, does: 'Inspects the four-arm label evidence.', learns: `CNV calls agree with published annotations at AUROC ${G.cnvOverallAUROC} on ${G.cnvValidatedCells.toLocaleString('en-US')} cells (range ${G.cnvRangeAUROC}).` },
      { dest: D.trackC, does: 'Checks the null controls.', learns: `On the ${track('Track C').units} background-only units, unsupervised detectors stay near the random floor (${pct(m('random_baseline').nullFPRate)}).` },
      { dest: D.figures, does: 'Compares the published figures at full size.', learns: 'The six published figures are shown as printed, labelled with their figure number.' },
      { dest: D.reproduce, does: 'Rebuilds the tables from frozen snapshots.', learns: 'Phase 11 tables and Phase 12 figures regenerate from CSV snapshots tracked in Git.' },
    ],
    edges: [
      { id: 'circ', step: 1, q: 'The labels use CNV. Is the ranking circular?', a: `REACH rebuilt the labels without the CNV criterion: the method order is broadly preserved (Spearman ρ = ${G.circularitySpearmanRho}, p = ${G.circularityP}), though the CNV-free APs sit near chance.`, dest: D.datasets },
      { id: 'winner', step: 0, q: 'The abstract names a best method. Is there one?', a: `No single method is universally best. FiRE has the highest median AP among the ranked published detectors on Track A, with no significant difference from scMalignantFinder (BH-FDR ${bh('FiRE', 'scMalignantFinder')}).`, dest: D.leaderboard },
      { id: 'doi', step: 4, q: 'The DOI does not resolve yet.', a: G.doiConfirmed ? 'The DOI is confirmed.' : 'The proof prints no DOI yet. The site shows the expected DOI marked pending. The Zenodo archive DOI already resolves.', dest: D.cite },
    ],
    leaves: 'A short list of verified claims with figure and table numbers, and the one caveat to raise: inter-lineage scope.',
  },
  {
    id: 'lead',
    role: 'PI or translational lead',
    icon: 'target',
    goal: 'Decide whether rare-cell detection is reliable enough to plan a study around it.',
    context: 'Planning a cohort study (residual disease, circulating tumour cells) and deciding where to spend sequencing budget. Reads summaries and figures.',
    questions: [
      'How low a prevalence can current methods reach?',
      'Does it work in blood and circulating tumour cells?',
      'Which tumour types are covered?',
      'What should we not promise from these results?',
    ],
    steps: [
      { dest: D.overview, does: 'Reads the headline findings.', learns: `${G.datasetsCount} cohorts (${G.solidCohorts} solid, ${G.hematologicCohorts} haematologic), ${G.totalCells} cells, ${G.methodsIncluded} methods.` },
      { dest: D.trackA, does: 'Looks at the lowest prevalence tier.', learns: `Below 0.1%, median AP is low for every unsupervised method; FiRE keeps the highest mean (${ap(FIRE.t4AP)}).` },
      { dest: D.trackD, does: 'Checks natural blood and CTC samples.', learns: `On ${track('Track D').units} natural-prevalence units, scCAD scores highest at 0.115 mean AP, and every unsupervised method stays below 0.12.` },
      { dest: D.datasets, does: 'Checks tissue coverage against the planned cohort.', learns: 'Each cohort lists its platform, accession, cell count and the tracks it feeds.' },
      { dest: D.cite, does: 'Takes the citation for the grant text.', learns: `${G.journalCitation}, ${G.license}.` },
    ],
    edges: [
      { id: 'liquid', step: 2, q: 'Our samples are liquid biopsies.', a: 'Track D is the closest match: natural prevalence, no spike-ins. Absolute APs are low, so plan for orthogonal confirmation of any cell a detector flags.', dest: D.trackD },
      { id: 'intra2', step: 1, q: 'We need to separate tumour from normal epithelium.', a: 'That is intra-lineage detection. No general-purpose unsupervised method in the panel does it at a practically useful level (Track F).', dest: D.trackF },
      { id: 'clinic', step: 1, q: 'Can we use this for clinical decisions?', a: 'REACH is a research benchmark of detection accuracy. It makes no clinical-validity claim, and its leaderboard covers inter-lineage contrasts only.', dest: D.overview },
    ],
    leaves: 'A realistic prevalence floor for study design and a clear statement of what the methods cannot do yet.',
  },
  {
    id: 'student',
    role: 'Student reproducing the paper',
    icon: 'terminal-window',
    goal: 'Rebuild the paper’s tables and figures on a laptop and understand every step.',
    context: 'A graduate student in a journal club or a methods course. One laptop, limited disk, no cluster.',
    questions: [
      'What do I install, and which Python?',
      'Do I need the full raw data?',
      'How long will it take?',
      'How do I know my numbers match?',
    ],
    steps: [
      { dest: D.install, does: 'Installs the package and verifies it.', learns: 'Python 3.11 or newer. The paper’s runs used Python 3.13.5. One CLI entry point, rcb.' },
      { dest: D.quickstart, does: 'Runs one method on the toy unit.', learns: 'End to end in minutes, without downloading anything.' },
      { dest: D.reproduce, does: 'Rebuilds the Phase 11 tables from snapshots.', learns: `No rerun of the ${G.totalEvaluations.toLocaleString('en-US')} method-unit predictions is needed for the tables and figures.` },
      { dest: D.figures, does: 'Puts the regenerated figures next to the published ones.', learns: 'Each published figure is labelled with its number for a side-by-side check.' },
      { dest: D.cite, does: 'Cites the archive version used.', learns: 'Cite the paper and the Zenodo version the snapshots came from.' },
    ],
    edges: [
      { id: 'laptop', step: 2, q: 'I only have a laptop CPU.', a: 'Snapshot mode needs no GPU and no full data. A full-data rerun of every prediction is the only path that needs the Zenodo archives and serious compute.', dest: D.reproduce },
      { id: 'rpkgs', step: 0, q: 'The R methods will not install.', a: 'R methods are an optional extra with their own install notes. The snapshot rebuild does not need them.', dest: D.install },
      { id: 'differs', step: 3, q: 'My numbers differ from the paper.', a: 'Check seeds and checksums first: every unit is built from fixed seeds and the snapshots ship with checksums.', dest: D.reproduce },
    ],
    leaves: 'Rebuilt tables that match the paper, and a clear map from each figure to the phase that produced it.',
  },
];

/** For the matrix: which pages each persona touches, and the one page that answers their main question. */
export const PAGE_COLUMNS: { path: RoutePath; label: string }[] = [
  { path: '/', label: 'Overview' }, { path: '/leaderboard', label: 'Leaderboard' }, { path: '/tracks', label: 'Tracks' },
  { path: '/datasets', label: 'Datasets' }, { path: '/methods', label: 'Methods' }, { path: '/figures', label: 'Figures' },
  { path: '/docs', label: 'Docs' }, { path: '/cite', label: 'Cite' },
];
export const KEY_PAGE: Record<string, RoutePath> = { analyst: '/tracks', developer: '/docs', reviewer: '/leaderboard', lead: '/tracks', student: '/docs' };
/** Pages that answer at least one reader, in site order (the hero's journey destinations). */
export const DEST_PAGES: RoutePath[] = PAGE_COLUMNS.map((c) => c.path).filter((p) => Object.values(KEY_PAGE).includes(p));
/** 1-based stop where a reader's route reaches the page that answers the main question, and that stop's link. */
export const keyStop = (p: Persona) => p.steps.findIndex((s) => s.dest.path === KEY_PAGE[p.id]) + 1;
export const keyDest = (p: Persona) => p.steps[keyStop(p) - 1].dest;
