// The twelve pipeline phases (docs/architecture.md). Counts, archive sizes and the Phase 11 and 12 commands come
// from the data file; the short names and the archive mapping are the board's.
import { GLOBAL_STATS as G, PIPELINE_PHASES, ZENODO_ARCHIVES } from '../../data/benchmarkData';
import { fmt } from '../../lib/format';
import { SECTIONS, type SectionDef } from './content';

export type PhaseMark = 'snapshot' | 'archived' | null;
export type Phase = { n: number; name: string; mark: PhaseMark; folder: string; body: string; paper: string; cmd: string };

/** Board archive labels, sizes from ZENODO_ARCHIVES (same order: archives 1 to 5). */
export const ARCHIVES = [
  { label: '1 · Code and snapshots', contents: 'Code, configs, frozen paper_v1 snapshots, Track F results' },
  { label: '2 · Processed data', contents: `QC-filtered AnnData for ${G.datasetsCount} cohorts, ${G.totalCells} cells` },
  { label: '3 · Units A to C', contents: `${fmt.int(G.trackAUnits + G.trackBUnits + G.trackCUnits)} units: Track A (${G.trackAUnits}), B (${G.trackBUnits}), C (${G.trackCUnits})` },
  { label: '4 · Units D and E', contents: `${fmt.int(G.trackDUnits + G.trackEUnits)} units: Track D (${G.trackDUnits}), E (${G.trackEUnits})` },
  { label: '5 · Predictions', contents: `Predictions and run metadata, ${G.methodsIncluded} methods by ${fmt.int(G.totalUnits)} units` },
].map((a, i) => ({ ...a, size: ZENODO_ARCHIVES[i]?.sizeEstimate ?? '' }));

const arch = (i: number, what: string) => `Output archived on Zenodo in archive ${i} (${ARCHIVES[i - 1].label.split(' · ')[1]}): ${what}.`;
const paperOf = (key: string) => PIPELINE_PHASES.find((p) => p.phase === key)?.desc ?? '';
const cmdOf = (key: string) => PIPELINE_PHASES.find((p) => p.phase === key)?.cmd;
const TRACKS = 'src/rarecellbenchmark/tracks/';

const RAW: Omit<Phase, 'cmd'>[] = [
  { n: 1, name: 'Dataset ingestion', mark: null, folder: 'src/rarecellbenchmark/ingest/', paper: paperOf('Phase 01'), body: 'No archived output; it runs from the source in Git. Raw counts are public on GEO.' },
  { n: 2, name: 'Preprocessing', mark: 'archived', folder: 'src/rarecellbenchmark/preprocess/', paper: paperOf('Phase 02'), body: arch(2, ARCHIVES[1].contents) },
  { n: 3, name: 'Validation, tiers', mark: null, folder: 'src/rarecellbenchmark/validate/', paper: paperOf('Phase 03'), body: 'No archived output; it runs from the source in Git.' },
  { n: 4, name: 'Track A units', mark: 'archived', folder: TRACKS, paper: paperOf('Phase 04–08'), body: arch(3, `${G.trackAUnits} Track A units`) },
  { n: 5, name: 'Track B units', mark: 'archived', folder: TRACKS, paper: paperOf('Phase 04–08'), body: arch(3, `${G.trackBUnits} Track B units`) },
  { n: 6, name: 'Track C units', mark: 'archived', folder: TRACKS, paper: paperOf('Phase 04–08'), body: arch(3, `${G.trackCUnits} Track C units`) },
  { n: 7, name: 'Track D units', mark: 'archived', folder: TRACKS, paper: paperOf('Phase 04–08'), body: arch(4, `${G.trackDUnits} Track D units`) },
  { n: 8, name: 'Track E units', mark: 'archived', folder: TRACKS, paper: paperOf('Phase 04–08'), body: arch(4, `${G.trackEUnits} Track E units`) },
  { n: 9, name: 'Method wrappers', mark: null, folder: 'src/rarecellbenchmark/methods/', paper: paperOf('Phase 09'), body: `The ${G.methodsIncluded} wrappers are code in Git; there is no archived output.` },
  { n: 10, name: 'Prediction runs', mark: 'archived', folder: 'scripts/run_methods.py', paper: paperOf('Phase 10'), body: arch(5, ARCHIVES[4].contents.replace(/^P/, 'p')) },
  { n: 11, name: 'Evaluation', mark: 'snapshot', folder: 'src/rarecellbenchmark/evaluate/', paper: paperOf('Phase 11'), body: 'Reruns from the frozen CSV snapshots in Git, with no download.' },
  { n: 12, name: 'Figures', mark: 'snapshot', folder: 'src/rarecellbenchmark/figures/', paper: paperOf('Phase 12'), body: 'Reruns from the frozen CSV snapshots in Git, with no download.' },
];

const SNAPSHOT_CMD: Record<number, string | undefined> = { 11: cmdOf('Phase 11'), 12: cmdOf('Phase 12') };
export const PHASES: readonly Phase[] = RAW.map((p) => ({ ...p, cmd: SNAPSHOT_CMD[p.n] ?? `python scripts/run_phase.py --phase ${p.n}` }));

/** x of gate i (0 to 11) in the 1000-wide band viewBox. */
export const gateX = (i: number) => 100 + i * 72.7;

export const pad2 = (n: number) => String(n).padStart(2, '0');

/** Sections that cover a phase: the ones that light it specifically, else the all-phase references. */
export function sectionsForPhase(n: number): readonly SectionDef[] {
  const specific = SECTIONS.filter((s) => s.gates.length > 0 && s.gates.length < 12 && s.gates.includes(n));
  return specific.length ? specific : SECTIONS.filter((s) => s.gates.length === 12);
}
