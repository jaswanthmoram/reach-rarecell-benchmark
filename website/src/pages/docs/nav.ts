// Docs navigation model. Section and sub-section ids are typed from this list,
// so the sidebar, the "On this page" rail and the rendered headings cannot drift.
// `keywords` feed the sidebar filter: commands and file names a reader might type.
import { GLOBAL_STATS } from '../../data/benchmarkData';
import { href, navigate } from '../../app/router';

export const REPO_URL = GLOBAL_STATS.githubUrl;
export const repoFile = (path: string) => `${REPO_URL}/blob/main/${path}`;

export const GROUPS = [
  {
    label: 'Get started',
    items: [
      {
        id: 'install', icon: 'package', title: 'Install', keywords: 'pip conda docker venv python environment setup',
        subs: [
          { id: 'install-package', title: 'Package', keywords: 'pip conda docker venv windows environment.yml' },
          { id: 'install-verify', title: 'Verify the install', keywords: 'smoke-test pytest ruff help' },
          { id: 'install-extras', title: 'Extras and R methods', keywords: 'gpu torch rpy2 rscript cnv infercnvpy fire cellsius rareq' },
        ],
      },
      {
        id: 'quickstart', icon: 'lightning', title: 'Quickstart', keywords: 'toy first run',
        subs: [
          { id: 'qs-toy', title: 'Make a toy unit', keywords: 'create-toy-data seed h5ad' },
          { id: 'qs-run', title: 'Run one method', keywords: 'run-method method ids expr_threshold list_methods' },
          { id: 'qs-output', title: 'Read the output', keywords: 'predictions csv runmeta score' },
        ],
      },
    ],
  },
  {
    label: 'Use',
    items: [
      {
        id: 'reproduce', icon: 'flow-arrow', title: 'Reproduce the paper', keywords: 'phases snapshots tables figures phase 11 12',
        subs: [
          { id: 'rep-modes', title: 'Reproduction modes', keywords: 'toy snapshot full dry-run run_all' },
          { id: 'rep-snapshot', title: 'From frozen snapshots', keywords: 'from-snapshots phase11_statistics reproduce_from_snapshots csv' },
          { id: 'rep-workflows', title: 'Snakemake, DVC, Make', keywords: 'snakefile dvc.yaml makefile workflow rules stages' },
          { id: 'rep-full', title: 'Full-data rerun', keywords: 'zenodo download aria2c archives run_phase' },
          { id: 'rep-seeds', title: 'Seeds and checksums', keywords: 'seed checksum sha-256 freeze' },
        ],
      },
      {
        id: 'add-method', icon: 'brackets-curly', title: 'Add your own method', keywords: 'wrapper extend new method template',
        subs: [
          { id: 'am-template', title: 'Copy the template', keywords: 'template_new_method yaml cp' },
          { id: 'am-contract', title: 'The wrapper contract', keywords: 'basemethodwrapper _compute_scores load_blind_adata validate_predictions labels yaml' },
          { id: 'am-register', title: 'Register it', keywords: 'registry register' },
          { id: 'am-test', title: 'Test it', keywords: 'pytest test_method_interface' },
          { id: 'am-full', title: 'Run it across units', keywords: 'run_methods units-dir evaluate' },
        ],
      },
    ],
  },
  {
    label: 'Reference',
    items: [
      {
        id: 'data', icon: 'database', title: 'Data and archives', keywords: 'zenodo doi archives geo download',
        subs: [
          { id: 'data-where', title: 'What lives where', keywords: 'git github zenodo geo h5ad' },
          { id: 'data-archives', title: 'Zenodo archives', keywords: 'doi record processed units predictions' },
          { id: 'data-download', title: 'Download script', keywords: 'download_zenodo_data aria2c tarball' },
        ],
      },
      {
        id: 'layout', icon: 'tree-structure', title: 'Repository layout', keywords: 'tree directory folders src',
        subs: [
          { id: 'layout-tree', title: 'Directory tree', keywords: 'src configs scripts tests' },
          { id: 'layout-results', title: 'Result paths', keywords: 'data/results snapshots tables figures' },
        ],
      },
      {
        id: 'cli', icon: 'terminal-window', title: 'CLI reference', keywords: 'rcb commands flags options',
        subs: [
          { id: 'cli-commands', title: 'rcb commands', keywords: 'init run-method run-track evaluate figures run-phase verify-checksums freeze-leaderboard' },
          { id: 'cli-scripts', title: 'Scripts', keywords: 'run_all run_phase run_methods phase11_statistics download_zenodo_data' },
        ],
      },
      {
        id: 'faq', icon: 'magnifying-glass', title: 'Troubleshooting', keywords: 'error problem fails faq',
        subs: [
          { id: 'faq-setup', title: 'Setup', keywords: 'rscript deepscena docker permission cuda' },
          { id: 'faq-runs', title: 'Runs and results', keywords: 'run-phase evaluate sha-256 checksum fonts matplotlib track e' },
        ],
      },
    ],
  },
] as const;

type Group = (typeof GROUPS)[number];
export type Entry = Group['items'][number];
export type EntryId = Entry['id'];
export type SubId = Entry['subs'][number]['id'];

export const ENTRIES: readonly Entry[] = GROUPS.flatMap((g) => g.items as readonly Entry[]);
export const ENTRY_IDS: readonly EntryId[] = ENTRIES.map((e) => e.id);

const TITLES = new Map<string, string>(
  ENTRIES.flatMap((e) => [[e.id, e.title] as const, ...e.subs.map((s) => [s.id, s.title] as const)]),
);
export const titleOf = (id: EntryId | SubId): string => TITLES.get(id) ?? id;

/** 1-based position of a section in the docs, for the numbered sidebar and eyebrows. */
export const entryNumber = (id: EntryId): number => ENTRY_IDS.indexOf(id) + 1;

/**
 * Only the sections a reader works through in order carry numbers (sidebar, rail, step circles).
 * The Reference group is parallel lookup material: it gets its icon instead of a number.
 */
const SEQUENCE: ReadonlySet<string> = new Set<EntryId>(['install', 'quickstart', 'reproduce', 'add-method']);
export const isNumbered = (id: EntryId): boolean => SEQUENCE.has(id);

const STEP = new Map<string, { n: number; total: number; numbered: boolean }>(
  ENTRIES.flatMap((e) => e.subs.map((s, i) => [s.id, { n: i + 1, total: e.subs.length, numbered: SEQUENCE.has(e.id) }] as const)),
);
/** Step number of a sub-section inside its section (rail steps and h3 markers share it). */
export const stepOf = (id: SubId): { n: number; total: number; numbered: boolean } => STEP.get(id) ?? { n: 1, total: 1, numbered: false };

export const pad2 = (n: number): string => String(n).padStart(2, '0');

const reducedMotion = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Shareable address of a docs section or step: `#/docs?section=<id>`. */
export const sectionHref = (id: string): string => href('/docs', `section=${id}`);
export const sectionUrl = (id: string): string => `${window.location.origin}${window.location.pathname}${sectionHref(id)}`;

/** Every id the docs can deep-link to (sections and their steps). */
export const isDocsId = (id: string): id is EntryId | SubId => TITLES.has(id);

/** The `section` query of the current hash, if any. */
export const sectionFromHash = (): string | null =>
  new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('section');

/**
 * Jump to a docs section or step through the router, so the address bar always holds a link other
 * pages (and readers) can reuse. Hash routing owns `#`, so anchors are buttons that call this.
 * Reduced motion: the router is given no anchor and the page jumps without smooth scrolling.
 */
export function goToSection(id: string): void {
  const reduce = reducedMotion();
  navigate('/docs', { query: `section=${id}`, anchor: reduce ? undefined : id });
  const el = document.getElementById(id);
  if (!el) return;
  if (reduce) el.scrollIntoView({ behavior: 'auto', block: 'start' });
  el.querySelector<HTMLElement>('h2, h3')?.focus({ preventScroll: true });
}
