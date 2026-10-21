// Get started: Install and Quickstart.
import { GLOBAL_STATS as G } from '../../data/benchmarkData';
import { CODE, TABSETS, numberWord } from './content';
import { C, Callout, CodeBlock, Faq, P, Section, Sub, TabbedCode, Table } from './kit';

export function Install() {
  return (
    <Section id="install" first lead={<>Install the <C>rarecellbenchmark</C> package (the <C>rcb</C> command) on Python 3.11 or newer.</>}>
      <Sub id="install-package" bare>
        <TabbedCode id="install" set={TABSETS.install} />
        <Faq summary="Python and R versions" className="mt-4">
          <Table head={['Where', 'Version', 'Source']} rows={[
            ['Supported range', 'Python 3.11 or newer; classifiers list 3.11 and 3.12', <C key="s">pyproject.toml</C>],
            ['Pinned environments', 'Python 3.11', <span key="s"><C>environment.yml</C>, <C>Dockerfile</C>, <C>Dockerfile.r</C></span>],
            ['Paper benchmark runs', 'Python 3.13.5, R 4.5.0', <span key="s"><C>README.md</C> (revision environment)</span>],
          ]} />
        </Faq>
      </Sub>
      <Sub id="install-verify">
        <CodeBlock id="verify" code={CODE.verify} />
        <P><C>rcb smoke-test</C> checks imports, configs, toy-data creation and the metric and schema basics. It should exit with code 0. CI runs the same three checks: ruff, pytest and the smoke test.</P>
      </Sub>
      <Sub id="install-extras">
        <P>Extras are declared in <C>pyproject.toml</C>. Install only what the methods you run need; wrappers report a missing optional dependency at runtime.</P>
        <CodeBlock id="extras" code={CODE.extras} />
        <P>FiRE, CellSIUS and RareQ run in R. The setup script clones the upstream repositories for scCAD, DeepScena, scMalignantFinder and CaSee, then installs the R packages if <C>Rscript</C> is on the PATH. The R script installs the R packages only.</P>
        <TabbedCode id="rmethods" set={TABSETS.rmethods} />
      </Sub>
    </Section>
  );
}

export function Quickstart() {
  return (
    <Section id="quickstart" lead="Run one method on one benchmark unit, end to end, without downloading anything. The toy unit has the same file layout as a real track unit.">
      <Sub id="quickstart-toy-unit">
        <CodeBlock id="toy" code={CODE.toy} />
        <P>This writes 300 cells by 200 genes, 50 of them malignant, with seed 42, into <C>data/toy/</C>:</P>
        <Table caption="Files written by create-toy-data" nowrap={[0]} head={['File', 'Contents']} rows={[
          [<C key="f">toy_expression.h5ad</C>, 'Expression matrix with counts and log1p layers and a 10-component PCA. No labels.'],
          [<C key="f">toy_labels.parquet</C>, <span key="c">Hidden ground truth: <C>cell_id</C>, <C>y_true</C>, tier, positive and background class.</span>],
          [<C key="f">toy_manifest.json</C>, 'Unit metadata: dataset, track, tier, prevalence, seed, cell and gene counts.'],
        ]} />
        <P>Change the size with <C>--n-cells</C>, <C>--n-genes</C>, <C>--n-positive</C>, <C>--seed</C> and <C>--out-dir</C>.</P>
      </Sub>
      <Sub id="quickstart-run-method">
        <CodeBlock id="run" code={CODE.run} />
        <P>
          The {numberWord(G.methodsIncluded)} IDs are <C>hvg_logreg</C> (supervised ceiling); the {numberWord(G.methodsRankedPublished)} ranked detectors <C>FiRE</C>, <C>cellsius</C>, <C>scMalignantFinder</C>, <C>RareQ</C>, <C>scCAD</C> and <C>DeepScena</C>; and the references <C>CaSee</C>, <C>expr_threshold</C> and <C>random_baseline</C>. IDs are case-sensitive. The R methods need the extras above.
        </P>
      </Sub>
      <Sub id="quickstart-output">
        <CodeBlock id="output" code={CODE.output} />
        <P>Each run writes two files to <C>data/predictions/&lt;method&gt;/</C> (change it with <C>--output-dir</C>):</P>
        <Table caption="Files written by run-method" nowrap={[0]} head={['File', 'Contents']} rows={[
          [<C key="f">&lt;unit&gt;_predictions.csv</C>, <span key="c">One row per cell, in the input order: <C>cell_id</C>, <C>score</C>. Higher score means more likely malignant.</span>],
          [<C key="f">&lt;unit&gt;_runmeta.json</C>, 'Method and unit IDs, runtime, peak memory, seed, SHA-256 of input and output, status.'],
        ]} />
        <Callout title="Only the cell ranking is scored">The primary metric is Average Precision on the score ranking, so a method only has to order cells. No threshold is needed.</Callout>
      </Sub>
    </Section>
  );
}
