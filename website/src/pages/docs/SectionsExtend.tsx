// Add a method, Data and archives, Repository layout, CLI reference, Troubleshooting.
// Sources: methods/TEMPLATE_new_method.py, methods/registry.py, methods/base.py, methods/common.py,
// configs/methods/TEMPLATE_new_method.yaml, tests/test_method_interface.py, cli.py, scripts/*.py,
// README.md, docs/troubleshooting.md, scripts/download_zenodo_data.py.
import type { ReactNode } from 'react';
import { CodeBlock, Icon } from '../../ui';
import { ZENODO_ARCHIVES } from '../../data/benchmarkData';
import { C, Callout, Cmd, DefTable, DocSection, ExtLink, P, Steps, Sub } from './kit';
import { repoFile } from './nav';
import { href, navigate } from '../../app/router';

const WRAPPER = `from rarecellbenchmark.methods.base import BaseMethodWrapper, MethodRunResult, validate_predictions
from rarecellbenchmark.methods.common import load_blind_adata, write_predictions, write_runmeta

class MyMethodWrapper(BaseMethodWrapper):
    method_id = "my_method"
    category = "ranked"  # naive, ranked, exploratory, or ensemble
    supports_gpu = False
    consumes_labels = False

    # run() is already written in the template: it loads the blind AnnData,
    # tracks time and memory, validates and writes predictions + runmeta.

    def _compute_scores(self, adata: AnnData, config: dict[str, Any]) -> pd.Series:
        """REPLACE WITH ACTUAL METHOD."""
        import numpy as np
        rng = np.random.default_rng(config.get("seed", 42))
        return pd.Series(rng.random(adata.n_obs), index=adata.obs_names)`;

const YAML = `method_id: my_method
name: "My Method"
category: ranked
language: python
wrapper: rarecellbenchmark.methods.ranked.my_method.MyMethodWrapper
consumes_labels: false
supports_gpu: false
requires_raw_counts: false
requires_gene_positions: false
score_direction: higher_is_positive
citation: "Author et al., Journal Year"
license: "MIT"
expected_runtime: "~1min"`;

const REGISTRY = `# src/rarecellbenchmark/methods/registry.py
from rarecellbenchmark.methods.ranked.my_method import MyMethodWrapper  # noqa: E402

for _wrapper_cls in [
    RandomBaselineWrapper,
    # ... the ten built-in wrappers ...
    CaSeeWrapper,
    MyMethodWrapper,
]:
    register(_wrapper_cls)  # type: ignore[type-abstract]`;

export function AddMethod() {
  return (
    <DocSection id="add-method" lead="A method is one wrapper class and one YAML config. It reads a blind unit and returns one score per cell; shared helpers write the standard outputs. You also register the class and add its ID to one test.">
      <Sub id="am-template">
        <CodeBlock title="terminal" code={`cp src/rarecellbenchmark/methods/TEMPLATE_new_method.py \\
   src/rarecellbenchmark/methods/ranked/my_method.py
cp configs/methods/TEMPLATE_new_method.yaml \\
   configs/methods/my_method.yaml`} />
        <P>Rename the class to <C>MyMethodWrapper</C> and set <C>method_id</C>. Baselines live in <C>naive/</C> and exploratory methods in <C>exploratory/</C>; published detectors go in <C>ranked/</C>.</P>
      </Sub>

      <Sub id="am-contract">
        <CodeBlock title="src/rarecellbenchmark/methods/ranked/my_method.py" lang="python" code={WRAPPER} />
        <DefTable caption="What the wrapper must satisfy" head={['Rule', 'Detail']} rows={[
          { a: 'Input', b: <><C>load_blind_adata</C> reads the unit and raises if <C>obs</C> contains <C>y_true</C>. Methods never see labels.</> },
          { a: 'Score', b: 'One float per cell. Higher means more likely rare or malignant.' },
          { a: 'Order', b: <><C>validate_predictions</C> raises unless there are exactly <C>n_obs</C> rows and <C>cell_id</C> matches <C>obs_names</C> in order.</> },
          { a: 'Outputs', b: <><C>&lt;unit&gt;_predictions.csv</C> and <C>&lt;unit&gt;_runmeta.json</C> with runtime, peak memory, seed and input and output hashes.</> },
          { a: 'Labels', b: <>Set <C>consumes_labels = True</C> only if the method reads labels. The one such wrapper, <C>hvg_logreg</C>, is reported as the supervised ceiling and is not assigned a leaderboard rank.</> },
        ]} />
        <P>Then fill in the YAML. <C>method_id</C>, <C>category</C> and <C>wrapper</C> must match the class, because a test imports the class from that path.</P>
        <CodeBlock title="configs/methods/my_method.yaml" lang="yaml" code={YAML} />
      </Sub>

      <Sub id="am-register">
        <P>Import the class in the registry and add it to the list that is passed to <C>register</C>.</P>
        <CodeBlock title="registry.py" lang="python" code={REGISTRY} />
      </Sub>

      <Sub id="am-test">
        <CodeBlock title="terminal" code={`pytest tests/test_method_interface.py -q

rcb create-toy-data
rcb run-method --method my_method --unit-id test01 \\
    --input data/toy/toy_expression.h5ad`} />
        <P>The interface test runs every registered wrapper on a toy unit and checks the YAML wrapper paths.</P>
        <Callout kind="caveat" title="One test pins the method count">
          <p><C>test_registry_exposes_all_included_methods</C> asserts the registry holds exactly the ten published IDs. It fails once you register an eleventh; add your ID to <C>EXPECTED_INCLUDED_METHODS</C> in the same file.</p>
        </Callout>
      </Sub>

      <Sub id="am-full">
        <CodeBlock title="terminal" code={`python scripts/run_methods.py --methods my_method \\
    --units-dir data/tracks --output-dir data/predictions --dry-run`} />
        <Steps>
          <li><C>--units-dir</C> is searched recursively for <C>*_manifest.json</C>. Track units live under <C>data/tracks/</C> once the archives are restored.</li>
          <li>Drop <C>--dry-run</C> to execute. Add <C>--continue-on-error</C> to keep going after a failed unit.</li>
          <li>
            <span className="flex min-w-0 flex-col gap-1.5">
              Score them one track at a time:
              <Cmd>rcb evaluate --track a --method my_method --predictions-dir data/predictions/ --labels-dir data/tracks/a/ --output my_method_a.csv</Cmd>
            </span>
          </li>
          <li><C>scripts/phase11_statistics.py</C> takes a per-unit metrics CSV through <C>--metrics-csv</C> for the rank tests.</li>
        </Steps>
      </Sub>
    </DocSection>
  );
}

/** Short names and one-line contents for the compact archive table; DOIs and full descriptions live on Cite. */
const ARCHIVE_NAME: Record<string, string> = {
  '10.5281/zenodo.19847108': 'Code and snapshots',
  '10.5281/zenodo.19850652': 'Processed data',
  '10.5281/zenodo.19850972': 'Units A to C',
  '10.5281/zenodo.19851287': 'Units D and E',
  '10.5281/zenodo.19851710': 'Predictions',
};
const ARCHIVE_CONTENTS: Record<string, string> = {
  '10.5281/zenodo.19847108': 'Code, configs, frozen paper_v1 snapshots, Track F results',
  '10.5281/zenodo.19850652': 'QC-filtered AnnData for 10 cohorts, 359,739 cells',
  '10.5281/zenodo.19850972': '440 units: Track A (160), B (120), C (160)',
  '10.5281/zenodo.19851287': '670 units: Track D (30), E (640)',
  '10.5281/zenodo.19851710': 'Predictions and run metadata, 10 methods by 1,125 units',
};

function CiteLink() {
  return (
    <a href={href('/cite')} onClick={(e) => { e.preventDefault(); navigate('/cite', { anchor: 'archives' }); }}
      className="text-accent underline decoration-accent/30 underline-offset-2 transition-colors duration-150 hover:decoration-accent">
      Cite
    </a>
  );
}

export function DataArchives() {
  return (
    <DocSection id="data" lead="Git holds the code, configs, toy data and frozen snapshots. Processed data, track units and predictions are on Zenodo. Raw counts are public on GEO.">
      <Sub id="data-where">
        <DefTable caption="Source · README.md" head={['What', 'Where']} rows={[
          { a: 'Code, configs, docs, toy data, snapshot CSVs', b: 'This GitHub repository' },
          { a: <>Processed <C>.h5ad</C> datasets, track units, predictions</>, b: 'Zenodo' },
          { a: 'Raw counts', b: 'GEO' },
        ]} />
      </Sub>

      <Sub id="data-archives">
        <DefTable label="Zenodo archives" aside={2} head={['Archive', 'Contents', 'Size']} rows={ZENODO_ARCHIVES.map((a, i) => ({
          a: <span className="whitespace-nowrap">{i + 1} · {ARCHIVE_NAME[a.doi] ?? a.part}</span>,
          b: ARCHIVE_CONTENTS[a.doi] ?? a.contents,
          c: <span className="whitespace-nowrap font-mono text-[12.5px] tabular-nums text-ink">{a.sizeEstimate}</span>,
        }))} />
        <P>DOIs and citation text for each archive are on the <CiteLink /> page.</P>
      </Sub>

      <Sub id="data-download">
        <CodeBlock title="terminal" code="python scripts/download_zenodo_data.py" />
        <P>Besides the processed data, track units and predictions, the script also fetches Track F units, CNV results and Track F results from record 19850652, and the frozen results bundle from record 19851710. It needs <C>aria2c</C>, extracts into the repository root, and removes each tarball afterwards.</P>
        <P>Instructions for publishing new archives: <ExtLink href={repoFile('docs/zenodo_upload_instructions.md')}>docs/zenodo_upload_instructions.md</ExtLink>.</P>
      </Sub>
    </DocSection>
  );
}

const TREE = `reach-rarecell-benchmark/
├── .github/          # CI, smoke, docs, and release workflows
├── configs/          # Dataset, method, metric, signature, and track configs
├── data/             # Directory skeleton, snapshot CSVs, small public result bundle
├── docs/             # Architecture, installation, reproducibility, extension guides
├── figures/          # Manuscript and schematic figures
├── requirements/     # Split dependency lists
├── scripts/          # Toy data, validation, orchestration, snapshot utilities
├── setup/            # Optional environment setup (R packages, external methods)
├── src/rarecellbenchmark/
│   ├── ingest/       # Phase 1–2 data ingestion
│   ├── preprocess/   # Phase 2 preprocessing
│   ├── validate/     # Phase 3 validation and tier assignment
│   ├── tracks/       # Phases 4–8 track generation
│   ├── methods/      # Phase 9 wrappers
│   ├── evaluate/     # Phase 11 evaluation
│   ├── figures/      # Phase 12 figure generation
│   └── execute/ io/ reports/ shared/
├── tests/            # Unit and smoke tests
├── Snakefile         # Toy, snapshot and full-data entry points
├── dvc.yaml          # DVC stages for public and full-data outputs
├── Makefile          # Common development tasks
├── Dockerfile        # Container image (Dockerfile.r adds R)
├── environment.yml   # Conda environment
└── pyproject.toml    # Package metadata and extras`;

export function Layout() {
  return (
    <DocSection id="layout" lead="Source follows the twelve pipeline phases: one package folder per phase group, with configs and scripts at the top level.">
      <Sub id="layout-tree">
        <CodeBlock title="repository" lang="text" code={TREE} />
        <P>Phase-by-phase contracts and data-flow diagrams: <ExtLink href={repoFile('docs/architecture.md')}>docs/architecture.md</ExtLink>.</P>
      </Sub>
      <Sub id="layout-results">
        <DefTable caption="Tracked result paths" head={['Path', 'Contents']} rows={[
          { a: <C>data/results/snapshots/paper_v1/</C>, b: 'Frozen CSV snapshot used for public reproducibility checks' },
          { a: <C>data/results/tables/phase11/</C>, b: 'Canonical Phase 11 tables: leaderboard, dataset summaries, rank tests, sensitivity' },
          { a: <C>data/results/phase11/</C>, b: 'Compatibility copy of the Phase 11 tables for older scripts' },
          { a: <C>data/results/figures/phase12/</C>, b: 'PNG previews of the Phase 12 figures' },
        ]} />
      </Sub>
    </DocSection>
  );
}

const STUB = 'Prints where to get the data and exits 1 in this checkout.';
/** "No required flags": spelled out in the desktop column, left out beside the command name on a phone. */
const NONE = <span className="max-md:hidden">none</span>;

export function CliRef() {
  return (
    <DocSection id="cli" lead={<>Every <C>rcb</C> command and the options it requires, read from <C>src/rarecellbenchmark/cli.py</C>. Run <C>rcb &lt;command&gt; --help</C> for the full option list.</>}>
      <Sub id="cli-commands">
        <DefTable caption="rcb · global flags --version, --verbose" head={['Command', 'Required', 'Does']} aside={1} asideInline rows={[
          { a: <C>init</C>, b: NONE, c: 'Creates the data, figures, logs and configs directories' },
          { a: <C>create-toy-data</C>, b: NONE, c: 'Writes a synthetic unit to data/toy/' },
          { a: <C>smoke-test</C>, b: NONE, c: 'Checks imports, configs, toy-data creation and metrics' },
          { a: <C>run-method</C>, b: <C>--method --unit-id --input</C>, c: 'Runs one method on one unit' },
          { a: <C>run-track</C>, b: <C>--track</C>, c: <>Builds track units from a processed <C>.h5ad</C>; tracks a to f</> },
          { a: <C>evaluate</C>, b: <C>--track</C>, c: 'Computes AP, AUROC and top-k metrics from predictions and labels' },
          { a: <C>figures</C>, b: NONE, c: <>Draws figures; <C>--all</C>, <C>--leaderboard</C>, <C>--runtime</C></> },
          { a: <C>run-phase</C>, b: <C>--phase</C>, c: STUB },
          { a: <C>verify-checksums</C>, b: <C>--dataset</C>, c: STUB },
          { a: <C>freeze-leaderboard</C>, b: <C>--tag</C>, c: STUB },
        ]} />
      </Sub>
      <Sub id="cli-scripts">
        <DefTable caption="scripts/ entry points used on this page" head={['Script', 'Key flags']} rows={[
          { a: <C>run_all.py</C>, b: <><C>--toy</C> | <C>--from-snapshots</C> | <C>--full-data</C></> },
          { a: <C>run_phase.py</C>, b: <><C>--phase</C> toy, snapshots, 1 to 12</> },
          { a: <C>phase11_statistics.py</C>, b: <><C>--from-snapshots</C> | <C>--metrics-csv</C>, <C>--output-dir</C></> },
          { a: <C>reproduce_from_snapshots.py</C>, b: 'none' },
          { a: <C>run_methods.py</C>, b: <><C>--methods --units-dir --output-dir</C>, <C>--dry-run</C></> },
          { a: <C>download_zenodo_data.py</C>, b: 'none; needs aria2c' },
        ]} />
      </Sub>
    </DocSection>
  );
}

function Q({ q, children }: { q: ReactNode; children: ReactNode }) {
  return (
    <details className="group rounded-card border border-line bg-surface open:border-line-strong">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium text-ink transition-colors duration-150 hover:bg-sunk/60 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">{q}</span>
        <Icon name="caret-down" size={14} className="shrink-0 text-ink-2 transition-transform duration-300 group-open:rotate-180" />
      </summary>
      <div className="flex flex-col gap-3 border-t border-line px-4 py-4 text-sm leading-relaxed text-ink-2">{children}</div>
    </details>
  );
}

export function Faq() {
  return (
    <DocSection id="faq" lead="Known errors, listed by the message you see.">
      <Sub id="faq-setup">
        <div className="flex flex-col gap-2">
          <Q q="Rscript not found, or no package called 'FiRE'">
            <p>Install R, then the benchmark's R packages.</p>
            <CodeBlock title="terminal" code={`Rscript setup/install_r_packages.R
# or, with the external method repositories too
bash setup/setup_external_methods.sh`} />
            <p>If a package fails to compile, install the build headers: <C>build-essential libcurl4-openssl-dev libssl-dev libxml2-dev</C> on Debian or Ubuntu.</p>
          </Q>
          <Q q="ModuleNotFoundError: No module named 'DeepScena'">
            <p>The upstream method code is not vendored. <C>bash setup/setup_external_methods.sh</C> clones it. DeepScena needs a GPU for Track F; see <ExtLink href={repoFile('docs/deepscena_colab_instructions.md')}>the Colab instructions</ExtLink>. To check CUDA:</p>
            <CodeBlock title="terminal" code={`python -c "import torch; print(torch.cuda.is_available())"`} />
          </Q>
          <Q q="permission denied while connecting to the Docker daemon">
            <CodeBlock title="terminal" code={`sudo usermod -aG docker $USER
newgrp docker
docker compose up`} />
          </Q>
        </div>
      </Sub>
      <Sub id="faq-runs">
        <div className="flex flex-col gap-2">
          <Q q="rcb run-phase exits with code 1">
            <p>In a Git-only checkout this is expected: it prints the four archive DOIs and stops. Restore the archives, then use <C>python scripts/run_phase.py --phase N</C>.</p>
          </Q>
          <Q q={<>rcb evaluate stops and asks for <span className="whitespace-nowrap">--predictions-dir</span> or <span className="whitespace-nowrap">--labels-dir</span></>}>
            <p>Both are required in practice. Labels are not in Git: they ship with the track units in the Zenodo archives. After restoring them, point <C>--labels-dir</C> at the track folder, for example <C>data/tracks/a/</C>.</p>
          </Q>
          <Q q="SHA-256 mismatch after preprocessing">
            <p>Checksums move with scanpy and anndata versions, floating-point PCA and seeds. Compare your versions with <C>python -m pip freeze</C>. If you changed preprocessing on purpose, delete the old checksum in <C>configs/datasets.yaml</C> and rerun Phase 2; the new checksum is written automatically.</p>
            <CodeBlock title="terminal" code="python scripts/run_phase.py --phase 2" />
          </Q>
          <Q q="Figures show squares instead of letters">
            <p>A missing font. Clear the matplotlib cache with <C>rm -rf ~/.cache/matplotlib</C>, or set a fallback:</p>
            <CodeBlock title="python" lang="python" code={`import matplotlib
matplotlib.rcParams['font.family'] = 'DejaVu Sans'`} />
          </Q>
          <Q q="Why is Track E not in the main ranking?">
            <p>Track E corrupts labels. Only <C>hvg_logreg</C> consumes labels, so only for it does Track E measure robustness. For unsupervised methods it measures how the metric reacts to wrong labels, so it is kept out of the primary ranking.</p>
          </Q>
        </div>
        <Callout title="Report a problem">
          <p>Open a GitHub issue with the exact command, the full traceback, <C>python -m pip list</C> and <C>rcb --version</C>. More cases: <ExtLink href={repoFile('docs/troubleshooting.md')}>docs/troubleshooting.md</ExtLink>.</p>
        </Callout>
      </Sub>
    </DocSection>
  );
}
