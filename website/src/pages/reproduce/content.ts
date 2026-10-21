// Reproduce page content (canvas board P07-Docs). Commands are taken from README.md, the Makefile, Snakefile,
// dvc.yaml and the rcb CLI source, exactly as the board lists them.
import { GLOBAL_STATS as G } from '../../data/benchmarkData';

export type Group = 'Get started' | 'Use' | 'Reference';
export type SubDef = { id: string; title: string; keywords: string };
export type SectionDef = {
  id: string; group: Group; title: string; num: string; gates: readonly number[]; note: string; keywords: string; subs: readonly SubDef[];
};

export const GROUPS: readonly Group[] = ['Get started', 'Use', 'Reference'];
const ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export const SECTIONS: readonly SectionDef[] = [
  { id: 'install', group: 'Get started', title: 'Install', num: '01', gates: [], note: 'Setup before phase 1', keywords: 'pip conda docker venv python environment setup',
    subs: [{ id: 'install-package', title: 'Package', keywords: 'pip conda docker venv windows environment.yml' }, { id: 'install-verify', title: 'Verify the install', keywords: 'smoke-test pytest ruff help' }, { id: 'install-extras', title: 'Extras and R methods', keywords: 'gpu torch rpy2 rscript cnv infercnvpy fire cellsius rareq' }] },
  { id: 'quickstart', group: 'Get started', title: 'Quickstart', num: '02', gates: [4, 10], note: 'A toy track unit and one prediction run', keywords: 'toy first run',
    subs: [{ id: 'quickstart-toy-unit', title: 'Make a toy unit', keywords: 'create-toy-data seed h5ad' }, { id: 'quickstart-run-method', title: 'Run one method', keywords: 'run-method method ids expr_threshold list_methods' }, { id: 'quickstart-output', title: 'Read the output', keywords: 'predictions csv runmeta score' }] },
  { id: 'reproduce', group: 'Use', title: 'Reproduce the paper', num: '03', gates: [11, 12], note: 'Phases 11 and 12 rebuild from Git snapshots', keywords: 'phases snapshots tables figures phase 11 12',
    subs: [{ id: 'reproduce-modes', title: 'Reproduction modes', keywords: 'toy snapshot full dry-run run_all' }, { id: 'reproduce-from-snapshots', title: 'From frozen snapshots', keywords: 'from-snapshots phase11_statistics reproduce_from_snapshots csv' }, { id: 'reproduce-workflows', title: 'Snakemake, DVC, Make', keywords: 'snakefile dvc.yaml makefile workflow rules stages' }, { id: 'reproduce-full-data', title: 'Full-data rerun', keywords: 'zenodo download aria2c archives run_phase' }, { id: 'reproduce-seeds', title: 'Seeds and checksums', keywords: 'seed checksum sha-256 freeze' }] },
  { id: 'add-method', group: 'Use', title: 'Add your own method', num: '04', gates: [9, 10, 11], note: 'A wrapper, its prediction runs, then evaluation', keywords: 'wrapper extend new method template',
    subs: [{ id: 'add-method-template', title: 'Copy the template', keywords: 'template_new_method yaml cp' }, { id: 'add-method-contract', title: 'The wrapper contract', keywords: 'basemethodwrapper _compute_scores load_blind_adata validate_predictions labels yaml' }, { id: 'add-method-register', title: 'Register it', keywords: 'registry register' }, { id: 'add-method-test', title: 'Test it', keywords: 'pytest test_method_interface' }, { id: 'add-method-run-units', title: 'Run it across units', keywords: 'run_methods units-dir evaluate' }] },
  { id: 'data', group: 'Reference', title: 'Data and archives', num: '', gates: [2, 4, 5, 6, 7, 8, 10], note: 'Outputs archived on Zenodo', keywords: 'zenodo doi archives geo download',
    subs: [{ id: 'data-where', title: 'What lives where', keywords: 'git github zenodo geo h5ad' }, { id: 'data-archives', title: 'Zenodo archives', keywords: 'doi record processed units predictions' }, { id: 'data-download', title: 'Download script', keywords: 'download_zenodo_data aria2c tarball' }] },
  { id: 'layout', group: 'Reference', title: 'Repository layout', num: '', gates: ALL, note: 'One source folder group per phase', keywords: 'tree directory folders src',
    subs: [{ id: 'layout-tree', title: 'Directory tree', keywords: 'src configs scripts tests' }, { id: 'layout-results', title: 'Result paths', keywords: 'data/results snapshots tables figures' }] },
  { id: 'cli', group: 'Reference', title: 'CLI reference', num: '', gates: ALL, note: 'run_phase.py takes phases 1 to 12', keywords: 'rcb commands flags options',
    subs: [{ id: 'cli-commands', title: 'rcb commands', keywords: 'init run-method run-track evaluate figures run-phase verify-checksums freeze-leaderboard' }, { id: 'cli-scripts', title: 'Scripts', keywords: 'run_all run_phase run_methods phase11_statistics download_zenodo_data' }] },
  { id: 'troubleshooting', group: 'Reference', title: 'Troubleshooting', num: '', gates: [], note: 'Fixes for setup and runs', keywords: 'error problem fails faq',
    subs: [{ id: 'troubleshooting-setup', title: 'Setup', keywords: 'rscript deepscena docker permission cuda' }, { id: 'troubleshooting-runs', title: 'Runs and results', keywords: 'run-phase evaluate sha-256 checksum fonts matplotlib track e' }] },
];

export const sectionOf = (id: string) => SECTIONS.find((s) => s.id === id || s.subs.some((b) => b.id === id));
/** Ids before the readable slugs, so old `?section=` and `#` links still land on their step. */
const LEGACY_IDS: Readonly<Record<string, string>> = {
  'qs-toy': 'quickstart-toy-unit', 'qs-run': 'quickstart-run-method', 'qs-output': 'quickstart-output',
  'rep-modes': 'reproduce-modes', 'rep-snapshot': 'reproduce-from-snapshots', 'rep-workflows': 'reproduce-workflows',
  'rep-full': 'reproduce-full-data', 'rep-seeds': 'reproduce-seeds',
  'am-template': 'add-method-template', 'am-contract': 'add-method-contract', 'am-register': 'add-method-register',
  'am-test': 'add-method-test', 'am-full': 'add-method-run-units',
  faq: 'troubleshooting', 'faq-setup': 'troubleshooting-setup', 'faq-runs': 'troubleshooting-runs',
};
/** The current id of a section or step (old ids map to their slug). */
export const currentId = (id: string) => LEGACY_IDS[id] ?? id;
export const isKnownId = (id: string) => sectionOf(id) !== undefined;

const L = (lines: string[]) => lines.join('\n');
const BS = '\\';
export const REPO = G.githubUrl;
export const docUrl = (path: string) => `${REPO}/blob/main/${path}`;
const CLONE = [`git clone ${REPO}.git`, 'cd reach-rarecell-benchmark'];

export const CODE = {
  verify: L(['rcb --help', 'rcb smoke-test', 'pytest -q', 'ruff check src tests scripts']),
  extras: L(["python -m pip install -e '.[gpu]'   # torch", "python -m pip install -e '.[r]'     # rpy2 bridge for R methods", "python -m pip install -e '.[cnv]'   # infercnvpy"]),
  toy: 'rcb create-toy-data',
  run: L(['# List the registered method IDs', 'python -c "from rarecellbenchmark.methods.registry import list_methods; print(list_methods())"', '', '# Run a baseline on the toy unit', `rcb run-method --method expr_threshold --unit-id toy_test ${BS}`, '    --input data/toy/toy_expression.h5ad']),
  output: 'cat data/predictions/expr_threshold/toy_test_predictions.csv | head -5',
  snapshot: L(['python scripts/phase11_statistics.py --from-snapshots', 'python scripts/reproduce_from_snapshots.py', '', '# Or both steps through the orchestrator', 'python scripts/run_all.py --from-snapshots']),
  full: L(['# 1. Download and extract every archive into the repository root', 'python scripts/download_zenodo_data.py', '', '# 2. Evaluate predictions, then redraw the figures', 'python scripts/run_phase.py --phase 11', 'python scripts/run_phase.py --phase 12', '', '# Or run the full-data checks through the orchestrator', 'python scripts/run_all.py --full-data']),
  freeze: 'python -m pip freeze > setup/frozen-requirements.txt',
  template: L([`cp src/rarecellbenchmark/methods/TEMPLATE_new_method.py ${BS}`, '   src/rarecellbenchmark/methods/ranked/my_method.py', `cp configs/methods/TEMPLATE_new_method.yaml ${BS}`, '   configs/methods/my_method.yaml']),
  wrapper: L(['from rarecellbenchmark.methods.base import BaseMethodWrapper, MethodRunResult, validate_predictions', 'from rarecellbenchmark.methods.common import load_blind_adata, write_predictions, write_runmeta', '', 'class MyMethodWrapper(BaseMethodWrapper):', '    method_id = "my_method"', '    category = "ranked"  # naive, ranked, exploratory, or ensemble', '    supports_gpu = False', '    consumes_labels = False', '', '    # run() is already written in the template: it loads the blind AnnData,', '    # tracks time and memory, validates and writes predictions + runmeta.', '', '    def _compute_scores(self, adata: AnnData, config: dict[str, Any]) -> pd.Series:', '        """REPLACE WITH ACTUAL METHOD."""', '        import numpy as np', '        rng = np.random.default_rng(config.get("seed", 42))', '        return pd.Series(rng.random(adata.n_obs), index=adata.obs_names)']),
  yaml: L(['method_id: my_method', 'name: "My Method"', 'category: ranked', 'language: python', 'wrapper: rarecellbenchmark.methods.ranked.my_method.MyMethodWrapper', 'consumes_labels: false', 'supports_gpu: false', 'requires_raw_counts: false', 'requires_gene_positions: false', 'score_direction: higher_is_positive', 'citation: "Author et al., Journal Year"', 'license: "MIT"', 'expected_runtime: "~1min"']),
  registry: L(['# src/rarecellbenchmark/methods/registry.py', 'from rarecellbenchmark.methods.ranked.my_method import MyMethodWrapper  # noqa: E402', '', 'for _wrapper_cls in [', '    RandomBaselineWrapper,', '    # ... the ten built-in wrappers ...', '    CaSeeWrapper,', '    MyMethodWrapper,', ']:', '    register(_wrapper_cls)  # type: ignore[type-abstract]']),
  amtest: L(['pytest tests/test_method_interface.py -q', '', 'rcb create-toy-data', `rcb run-method --method my_method --unit-id test01 ${BS}`, '    --input data/toy/toy_expression.h5ad']),
  amfull: L([`python scripts/run_methods.py --methods my_method ${BS}`, '    --units-dir data/tracks --output-dir data/predictions --dry-run']),
  download: 'python scripts/download_zenodo_data.py',
  tree: L(['reach-rarecell-benchmark/', '├── .github/          # CI, smoke, docs, and release workflows', '├── configs/          # Dataset, method, metric, signature, and track configs', '├── data/             # Directory skeleton, snapshot CSVs, small public result bundle', '├── docs/             # Architecture, installation, reproducibility, extension guides', '├── figures/          # Manuscript and schematic figures', '├── requirements/     # Split dependency lists', '├── scripts/          # Toy data, validation, orchestration, snapshot utilities', '├── setup/            # Optional environment setup (R packages, external methods)', '├── src/rarecellbenchmark/', '│   ├── ingest/       # Phase 1–2 data ingestion', '│   ├── preprocess/   # Phase 2 preprocessing', '│   ├── validate/     # Phase 3 validation and tier assignment', '│   ├── tracks/       # Phases 4–8 track generation', '│   ├── methods/      # Phase 9 wrappers', '│   ├── evaluate/     # Phase 11 evaluation', '│   ├── figures/      # Phase 12 figure generation', '│   └── execute/ io/ reports/ shared/', '├── tests/            # Unit and smoke tests', '├── Snakefile         # Toy, snapshot and full-data entry points', '├── dvc.yaml          # DVC stages for public and full-data outputs', '├── Makefile          # Common development tasks', '├── Dockerfile        # Container image (Dockerfile.r adds R)', '├── environment.yml   # Conda environment', '└── pyproject.toml    # Package metadata and extras']),
  faqr: L(['Rscript setup/install_r_packages.R', '# or, with the external method repositories too', 'bash setup/setup_external_methods.sh']),
  cuda: 'python -c "import torch; print(torch.cuda.is_available())"',
  dockerperm: L(['sudo usermod -aG docker $USER', 'newgrp docker', 'docker compose up']),
  phase2: 'python scripts/run_phase.py --phase 2',
  font: L(['import matplotlib', "matplotlib.rcParams['font.family'] = 'DejaVu Sans'"]),
} as const;

export type Tab = {
  value: string; label: string; title: string; code: string; note: string;
  rowsCaption?: string; rowsHead?: string; rows?: readonly { a: string; b: string; archives?: boolean }[];
};
export type TabSet = { label: string; tabs: readonly Tab[] };

export const TABSETS: Record<'install' | 'rmethods' | 'workflow', TabSet> = {
  install: { label: 'Install route', tabs: [
    { value: 'pip-unix', label: 'pip · Unix', title: 'terminal', code: L([...CLONE, 'python -m venv .venv', 'source .venv/bin/activate', 'python -m pip install --upgrade pip', "python -m pip install -e '.[dev]'"]), note: 'The dev extra adds pytest, pytest-cov, ruff, mypy, Snakemake, DVC and pre-commit. The reproduction workflows below use Snakemake and DVC.' },
    { value: 'pip-win', label: 'pip · Windows', title: 'terminal', code: L([...CLONE, 'python -m venv .venv', `.venv${BS}Scripts${BS}activate`, 'python -m pip install --upgrade pip', "python -m pip install -e '.[dev]'"]), note: 'Only the activation line differs from macOS and Linux.' },
    { value: 'conda', label: 'conda', title: 'terminal', code: L([...CLONE, 'conda env create -f environment.yml', 'conda activate rarecellbenchmark', "python -m pip install -e '.[dev]'"]), note: 'environment.yml pins Python 3.11 and conda-forge builds of numpy, pandas, scipy and scikit-learn; anndata, scanpy and infercnvpy come from pip.' },
    { value: 'docker', label: 'Docker', title: 'terminal', code: L(['# Pre-built image', 'docker pull ghcr.io/jaswanthmoram/reach-rarecell-benchmark:latest', 'docker run --rm ghcr.io/jaswanthmoram/reach-rarecell-benchmark:latest rcb smoke-test', '', '# Or build locally', 'docker build -t reach-rarecell-benchmark:local .', 'docker run --rm reach-rarecell-benchmark:local rcb smoke-test', '', '# Or let compose build the image and run the smoke test', 'docker compose up --build']), note: 'The image is python:3.11-slim with the package installed; its default command is rcb --help. Compose mounts ./data and ./results into /app.' },
  ] },
  rmethods: { label: 'R methods', tabs: [
    { value: 'script', label: 'Setup script', title: 'terminal', code: 'bash setup/setup_external_methods.sh', note: '' },
    { value: 'rscript', label: 'R packages only', title: 'terminal', code: 'Rscript setup/install_r_packages.R', note: '' },
    { value: 'docker-r', label: 'Docker with R', title: 'terminal', code: 'docker compose --profile r-methods up --build', note: 'Starts the reach-rarecell-benchmark-r service, built from Dockerfile.r (R, the system headers, and the R packages).' },
  ] },
  workflow: { label: 'Workflow engine', tabs: [
    { value: 'snakemake', label: 'Snakemake', title: 'Snakefile', code: 'snakemake -n --cores 1', note: '', rowsCaption: 'Rules in Snakefile', rowsHead: 'Rule', rows: [
      { a: 'all', b: 'Default target: snapshots, Phase 11 tables, Phase 12 figures' },
      { a: 'public_phase11', b: 'python scripts/phase11_statistics.py --from-snapshots --output-dir data/results/tables/phase11' },
      { a: 'public_phase12', b: 'python scripts/reproduce_from_snapshots.py' },
      { a: 'toy_data', b: 'python scripts/create_toy_data.py --out-dir data/toy' },
      { a: 'toy_smoke', b: 'rcb smoke-test && touch data/results/toy_smoke.ok' },
      { a: 'full_data_phase11', b: 'python scripts/run_phase.py --phase 11', archives: true }] },
    { value: 'dvc', label: 'DVC', title: 'dvc.yaml', code: 'dvc repro --dry', note: '', rowsCaption: 'Stages in dvc.yaml', rowsHead: 'Stage', rows: [
      { a: 'public_phase11', b: 'python scripts/phase11_statistics.py --from-snapshots --output-dir data/results/tables/phase11' },
      { a: 'public_phase12', b: 'python scripts/reproduce_from_snapshots.py' },
      { a: 'toy_smoke', b: 'python scripts/run_all.py --toy' },
      { a: 'full_data_phase11', b: 'python scripts/run_phase.py --phase 11', archives: true }] },
    { value: 'make', label: 'Make', title: 'Makefile', code: L(["make install   # pip install -e '.[dev]'", 'make toy       # rcb create-toy-data', 'make smoke     # rcb smoke-test', 'make test      # pytest -q', 'make lint      # ruff check src tests scripts', 'make figures   # schematic figures into data/results/figures']), note: 'make figures draws the pipeline, track-design and method-audit schematics, which need no data.' },
  ] },
};

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
/** Counts up to twelve are written as words in prose. */
export const numberWord = (n: number) => WORDS[n] ?? String(n);
