// Install, Quickstart, Reproduce. Every command is copied from README.md,
// docs/installation.md, docs/reproducibility.md, Makefile, Snakefile, dvc.yaml or the CLI source.
import { CodeBlock } from '../../ui';
import { GLOBAL_STATS } from '../../data/benchmarkData';
import { BareSub, C, Callout, Cmd, DefTable, Disclosure, DocSection, ExtLink, Needs, P, Sub, TabbedCode } from './kit';
import { PhaseMap } from './PhaseMap';
import { REPO_URL, repoFile, goToSection } from './nav';

const REPO_DIR = GLOBAL_STATS.githubRepo.split('/')[1];
const CLONE = `git clone ${REPO_URL}.git
cd ${REPO_DIR}`;

export function Install() {
  return (
    <DocSection id="install" lead={<>Install the <C>rarecellbenchmark</C> package (the <C>rcb</C> command) on Python 3.11 or newer.</>}>
      <BareSub id="install-package">
        <TabbedCode label="Install route" tabs={[
          {
            value: 'pip-unix', label: 'pip · Unix', title: 'terminal',
            code: `${CLONE}
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e '.[dev]'`,
            note: <>The <C>dev</C> extra adds pytest, pytest-cov, ruff, mypy, Snakemake, DVC and pre-commit. The reproduction workflows below use Snakemake and DVC.</>,
          },
          {
            value: 'pip-win', label: 'pip · Windows', title: 'terminal',
            code: `${CLONE}
python -m venv .venv
.venv\\Scripts\\activate
python -m pip install --upgrade pip
python -m pip install -e '.[dev]'`,
            note: <>Only the activation line differs from macOS and Linux.</>,
          },
          {
            value: 'conda', label: 'conda', title: 'terminal',
            code: `${CLONE}
conda env create -f environment.yml
conda activate rarecellbenchmark
python -m pip install -e '.[dev]'`,
            note: <><C>environment.yml</C> pins Python 3.11 and conda-forge builds of numpy, pandas, scipy and scikit-learn; anndata, scanpy and infercnvpy come from pip.</>,
          },
          {
            value: 'docker', label: 'Docker', title: 'terminal',
            code: `# Pre-built image
docker pull ghcr.io/jaswanthmoram/reach-rarecell-benchmark:latest
docker run --rm ghcr.io/jaswanthmoram/reach-rarecell-benchmark:latest rcb smoke-test

# Or build locally
docker build -t reach-rarecell-benchmark:local .
docker run --rm reach-rarecell-benchmark:local rcb smoke-test

# Or let compose build the image and run the smoke test
docker compose up --build`,
            note: <>The image is <C>python:3.11-slim</C> with the package installed; its default command is <C>rcb --help</C>. Compose mounts <C>./data</C> and <C>./results</C> into <C>/app</C>.</>,
          },
        ]} />
        <Disclosure summary="Python and R versions">
          <DefTable label="Python and R versions" head={['Where', 'Version', 'Source']} rows={[
            { a: 'Supported range', b: <>Python 3.11 or newer; classifiers list 3.11 and 3.12</>, c: <><C>pyproject.toml</C> <C>{'requires-python = ">=3.11"'}</C></> },
            { a: 'Pinned environments', b: 'Python 3.11', c: <><C>environment.yml</C>, <C>Dockerfile</C>, <C>Dockerfile.r</C></> },
            { a: 'Paper benchmark runs', b: 'Python 3.13.5, R 4.5.0', c: <><C>README.md</C> (revision environment)</> },
          ]} />
        </Disclosure>
      </BareSub>

      <Sub id="install-verify">
        <CodeBlock title="terminal" code={`rcb --help
rcb smoke-test
pytest -q
ruff check src tests scripts`} />
        <P><C>rcb smoke-test</C> checks imports, configs, toy-data creation and the metric and schema basics. It should exit with code 0. CI runs the same three checks: ruff, pytest and the smoke test.</P>
      </Sub>

      <Sub id="install-extras">
        <P>Extras are declared in <C>pyproject.toml</C>. Install only what the methods you run need; wrappers report a missing optional dependency at runtime.</P>
        <CodeBlock title="terminal" code={`python -m pip install -e '.[gpu]'   # torch
python -m pip install -e '.[r]'     # rpy2 bridge for R methods
python -m pip install -e '.[cnv]'   # infercnvpy`} />
        <P>FiRE, CellSIUS and RareQ run in R. The setup script clones the upstream repositories for scCAD, DeepScena, scMalignantFinder and CaSee, then installs the R packages if <C>Rscript</C> is on the PATH. The R script installs the R packages only.</P>
        <TabbedCode label="R methods" tabs={[
          { value: 'script', label: 'Setup script', title: 'terminal', code: 'bash setup/setup_external_methods.sh' },
          { value: 'rscript', label: 'R packages only', title: 'terminal', code: 'Rscript setup/install_r_packages.R' },
          {
            value: 'docker-r', label: 'Docker with R', title: 'terminal', code: 'docker compose --profile r-methods up --build',
            note: <>Starts the <C>reach-rarecell-benchmark-r</C> service, built from <C>Dockerfile.r</C> (R, the system headers, and the R packages).</>,
          },
        ]} />
      </Sub>
    </DocSection>
  );
}

export function Quickstart() {
  return (
    <DocSection id="quickstart" lead="Run one method on one benchmark unit, end to end, without downloading anything. The toy unit has the same file layout as a real track unit.">
      <Sub id="qs-toy">
        <CodeBlock title="terminal" code="rcb create-toy-data" />
        <P>This writes 300 cells by 200 genes, 50 of them malignant, with seed 42, into <C>data/toy/</C>:</P>
        <DefTable label="Files written by create-toy-data" head={['File', 'Contents']} rows={[
          { a: <C>toy_expression.h5ad</C>, b: 'Expression matrix with counts and log1p layers and a 10-component PCA. No labels.' },
          { a: <C>toy_labels.parquet</C>, b: <>Hidden ground truth: <C>cell_id</C>, <C>y_true</C>, tier, positive and background class.</> },
          { a: <C>toy_manifest.json</C>, b: 'Unit metadata: dataset, track, tier, prevalence, seed, cell and gene counts.' },
        ]} />
        <P>Change the size with <C>--n-cells</C>, <C>--n-genes</C>, <C>--n-positive</C>, <C>--seed</C> and <C>--out-dir</C>.</P>
      </Sub>

      <Sub id="qs-run">
        <CodeBlock title="terminal" code={`# List the registered method IDs
python -c "from rarecellbenchmark.methods.registry import list_methods; print(list_methods())"

# Run a baseline on the toy unit
rcb run-method --method expr_threshold --unit-id toy_test \\
    --input data/toy/toy_expression.h5ad`} />
        <P>The ten IDs are <C>hvg_logreg</C> (supervised ceiling); the six ranked detectors <C>FiRE</C>, <C>cellsius</C>, <C>scMalignantFinder</C>, <C>RareQ</C>, <C>scCAD</C> and <C>DeepScena</C>; and the references <C>CaSee</C>, <C>expr_threshold</C> and <C>random_baseline</C>. IDs are case-sensitive. The R methods need the extras above.</P>
      </Sub>

      <Sub id="qs-output">
        <CodeBlock title="terminal" code="cat data/predictions/expr_threshold/toy_test_predictions.csv | head -5" />
        <P>Each run writes two files to <C>data/predictions/&lt;method&gt;/</C> (change it with <C>--output-dir</C>):</P>
        <DefTable label="Files written by run-method" head={['File', 'Contents']} rows={[
          { a: <C>&lt;unit&gt;_predictions.csv</C>, b: <>One row per cell, in the input order: <C>cell_id</C>, <C>score</C>. Higher score means more likely malignant.</> },
          { a: <C>&lt;unit&gt;_runmeta.json</C>, b: 'Method and unit IDs, runtime, peak memory, seed, SHA-256 of input and output, status.' },
        ]} />
        <Callout title="Only the cell ranking is scored">
          <p>The primary metric is Average Precision on the score ranking, so a method only has to order cells. No threshold is needed.</p>
        </Callout>
      </Sub>
    </DocSection>
  );
}

const SNAPSHOT = `python scripts/phase11_statistics.py --from-snapshots
python scripts/reproduce_from_snapshots.py

# Or both steps through the orchestrator
python scripts/run_all.py --from-snapshots`;

export function Reproduce() {
  return (
    <DocSection id="reproduce" lead="The Phase 11 tables and Phase 12 figures in the paper rebuild from CSV snapshots tracked in Git. Rerunning all 11,250 method-unit predictions needs the Zenodo archives.">
      <PhaseMap />
      <Sub id="rep-modes">
        <DefTable caption="Source · docs/reproducibility.md" head={['Mode', 'Command', 'Needs']} codeCol={1} aside={2} rows={[
          { a: 'Toy smoke', b: <Cmd>python scripts/run_all.py --toy</Cmd>, c: <Needs archives={false} /> },
          { a: 'Snapshot tables and figures', b: <Cmd>python scripts/run_all.py --from-snapshots</Cmd>, c: <Needs archives={false} /> },
          { a: 'Snakemake dry-run', b: <Cmd>snakemake -n --cores 1</Cmd>, c: <Needs archives={false} /> },
          { a: 'DVC dry-run', b: <Cmd>dvc repro --dry</Cmd>, c: <Needs archives={false} /> },
          { a: 'Full prediction evaluation', b: <Cmd>python scripts/run_phase.py --phase 11</Cmd>, c: <Needs archives /> },
          { a: 'Full figure regeneration', b: <Cmd>python scripts/run_phase.py --phase 12</Cmd>, c: <Needs archives /> },
        ]} />
      </Sub>

      <Sub id="rep-snapshot">
        <CodeBlock title="terminal" code={SNAPSHOT} />
        <P>Input: four CSVs in <C>data/results/snapshots/paper_v1/</C> (per unit, per method, per dataset, and the degenerate-prediction report).</P>
        <DefTable label="Outputs of the snapshot rebuild" head={['Path', 'Contents']} rows={[
          { a: <C>data/results/tables/phase11/</C>, b: <>Leaderboard, rank CIs, global and pairwise tests, per-dataset summary, unit metrics sample.</> },
          { a: <C>data/results/figures/phase12/</C>, b: <>12 PNG figures, from <C>Fig0_Phase11_Summary_Heatmap.png</C> to <C>Fig11_Track_F_vs_Track_A.png</C>.</> },
        ]} />
      </Sub>

      <Sub id="rep-workflows">
        <P>The same snapshot steps are wired into Snakemake and DVC. Dry-runs check the workflow structure without running the data pipeline.</P>
        <TabbedCode label="Workflow engine" tabs={[
          {
            value: 'snakemake', label: 'Snakemake', title: 'Snakefile', code: 'snakemake -n --cores 1',
            note: (
              <DefTable caption="Rules in Snakefile" head={['Rule', 'Runs']} codeCol={1} rows={[
                { a: <C>all</C>, b: 'Default target: snapshots, Phase 11 tables, Phase 12 figures' },
                { a: <C>public_phase11</C>, b: <Cmd>python scripts/phase11_statistics.py --from-snapshots --output-dir data/results/tables/phase11</Cmd> },
                { a: <C>public_phase12</C>, b: <Cmd>python scripts/reproduce_from_snapshots.py</Cmd> },
                { a: <C>toy_data</C>, b: <Cmd>python scripts/create_toy_data.py --out-dir data/toy</Cmd> },
                { a: <C>toy_smoke</C>, b: <Cmd>rcb smoke-test && touch data/results/toy_smoke.ok</Cmd> },
                { a: <C>full_data_phase11</C>, b: <Cmd needsArchives>python scripts/run_phase.py --phase 11</Cmd> },
              ]} />
            ),
          },
          {
            value: 'dvc', label: 'DVC', title: 'dvc.yaml', code: 'dvc repro --dry',
            note: (
              <DefTable caption="Stages in dvc.yaml" head={['Stage', 'Command']} codeCol={1} rows={[
                { a: <C>public_phase11</C>, b: <Cmd>python scripts/phase11_statistics.py --from-snapshots --output-dir data/results/tables/phase11</Cmd> },
                { a: <C>public_phase12</C>, b: <Cmd>python scripts/reproduce_from_snapshots.py</Cmd> },
                { a: <C>toy_smoke</C>, b: <Cmd>python scripts/run_all.py --toy</Cmd> },
                { a: <C>full_data_phase11</C>, b: <Cmd needsArchives>python scripts/run_phase.py --phase 11</Cmd> },
              ]} />
            ),
          },
          {
            value: 'make', label: 'Make', title: 'Makefile', code: `make install   # pip install -e '.[dev]'
make toy       # rcb create-toy-data
make smoke     # rcb smoke-test
make test      # pytest -q
make lint      # ruff check src tests scripts
make figures   # schematic figures into data/results/figures`,
            note: <><C>make figures</C> draws the pipeline, track-design and method-audit schematics, which need no data.</>,
          },
        ]} />
      </Sub>

      <Sub id="rep-full">
        <CodeBlock title="terminal" code={`# 1. Download and extract every archive into the repository root
python scripts/download_zenodo_data.py

# 2. Evaluate predictions, then redraw the figures
python scripts/run_phase.py --phase 11
python scripts/run_phase.py --phase 12

# Or run the full-data checks through the orchestrator
python scripts/run_all.py --full-data`} />
        <P>The download script calls <C>aria2c</C>, so install it first. It resumes partial downloads and deletes each <C>.tar.gz</C> after extracting it. The archives are listed under <Jump to="data">Data and archives</Jump>.</P>
        <Callout kind="caveat" title="rcb run-phase prints the archive DOIs">
          <p>In this checkout <C>rcb run-phase --phase N</C> prints the archive DOIs and exits with code 1. Use <C>python scripts/run_phase.py --phase N</C> once the archives are in place.</p>
        </Callout>
      </Sub>

      <Sub id="rep-seeds">
        <DefTable caption="Seeds · docs/reproducibility.md" head={['Component', 'Seed source']} rows={[
          { a: 'Toy data', b: <C>rcb create-toy-data --seed</C> },
          { a: 'Track generation', b: 'Unit metadata plus a fixed base seed' },
          { a: 'Method wrappers', b: 'Method config and unit metadata' },
          { a: 'Rank summaries', b: 'Fixed bootstrap seed in the evaluation utilities' },
        ]} />
        <P>Processed datasets carry SHA-256 checksums in config metadata and AnnData provenance fields; every <C>runmeta.json</C> records the hashes of its input and output. To record the environment next to a report:</P>
        <CodeBlock title="terminal" code="python -m pip freeze > setup/frozen-requirements.txt" />
        <P>Full detail: <ExtLink href={repoFile('docs/reproducibility.md')}>docs/reproducibility.md</ExtLink>.</P>
      </Sub>
    </DocSection>
  );
}

function Jump({ to, children }: { to: 'data'; children: string }) {
  return (
    <button type="button" onClick={() => goToSection(to)}
      className="text-accent underline decoration-accent/30 underline-offset-2 transition-colors duration-150 hover:decoration-accent">
      {children}
    </button>
  );
}
