// The twelve pipeline phases (docs/architecture.md, "Phase dependency DAG") and which of them each docs
// section touches. The live gate band and the phase map in "Reproduce the paper" both read this list.
import type { EntryId } from './nav';

export type PhaseMark = 'snapshot' | 'archived' | null;

export const PHASES: readonly { n: number; name: string; mark: PhaseMark }[] = [
  { n: 1, name: 'Dataset ingestion', mark: null },
  { n: 2, name: 'Preprocessing', mark: 'archived' },
  { n: 3, name: 'Validation, tiers', mark: null },
  { n: 4, name: 'Track A units', mark: 'archived' },
  { n: 5, name: 'Track B units', mark: 'archived' },
  { n: 6, name: 'Track C units', mark: 'archived' },
  { n: 7, name: 'Track D units', mark: 'archived' },
  { n: 8, name: 'Track E units', mark: 'archived' },
  { n: 9, name: 'Method wrappers', mark: null },
  { n: 10, name: 'Prediction runs', mark: 'archived' },
  { n: 11, name: 'Evaluation', mark: 'snapshot' },
  { n: 12, name: 'Figures', mark: 'snapshot' },
];

const ALL = PHASES.map((p) => p.n);

/**
 * Phases a section works on, read from its content. An empty list means the section sits outside the
 * pipeline (setup, troubleshooting): the band then runs a slow scan across all twelve gates instead.
 */
export const SECTION_PHASES: Record<EntryId, { gates: readonly number[]; note: string }> = {
  install: { gates: [], note: 'Setup before phase 1' },
  quickstart: { gates: [4, 10], note: 'A toy track unit and one prediction run' },
  reproduce: { gates: [11, 12], note: 'Phases 11 and 12 rebuild from Git snapshots' },
  'add-method': { gates: [9, 10, 11], note: 'A wrapper, its prediction runs, then evaluation' },
  data: { gates: [2, 4, 5, 6, 7, 8, 10], note: 'Outputs archived on Zenodo' },
  layout: { gates: ALL, note: 'One source folder group per phase' },
  cli: { gates: ALL, note: 'run_phase.py takes phases 1 to 12' },
  faq: { gates: [], note: 'Fixes for setup and runs' },
};
