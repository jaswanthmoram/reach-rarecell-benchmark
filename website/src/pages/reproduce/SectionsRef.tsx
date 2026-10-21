// Reference: Data and archives, Repository layout, CLI reference, Troubleshooting.
import { href } from '../../lib/router';
import { CODE, docUrl } from './content';
import { ARCHIVES } from './phases';
import { C, Callout, CodeBlock, Ext, Faq, P, Section, Sub, Table } from './kit';

const INLINE = 'text-accent underline decoration-accent/30 underline-offset-2 transition-[text-decoration-color] duration-150 hover:decoration-accent';

export function DataArchives() {
  return (
    <Section id="data" lead="Git holds the code, configs, toy data and frozen snapshots. Processed data, track units and predictions are on Zenodo. Raw counts are public on GEO.">
      <Sub id="data-where">
        <Table caption="Source · README.md" head={['What', 'Where']} rows={[
          ['Code, configs, docs, toy data, snapshot CSVs', 'This GitHub repository'],
          [<span key="w">Processed <C>.h5ad</C> datasets, track units, predictions</span>, 'Zenodo'],
          ['Raw counts', 'GEO'],
        ]} />
      </Sub>
      <Sub id="data-archives">
        <Table caption="Zenodo archives" head={['Archive', 'Contents', 'Size']} nowrap={[0, 2]} rows={ARCHIVES.map((a) => [a.label, a.contents, a.size])} />
        <P>DOIs and citation text for each archive are on the <a href={href('/cite')} className={INLINE}>Cite</a> page.</P>
      </Sub>
      <Sub id="data-download">
        <CodeBlock id="download" code={CODE.download} />
        <P>Besides the processed data, track units and predictions, the script also fetches Track F units, CNV results and Track F results from record 19850652, and the frozen results bundle from record 19851710. It needs <C>aria2c</C>, extracts into the repository root, and removes each tarball afterwards.</P>
      </Sub>
    </Section>
  );
}

export function Layout() {
  return (
    <Section id="layout" lead="Source follows the twelve pipeline phases: one package folder per phase group, with configs and scripts at the top level.">
      <Sub id="layout-tree">
        <CodeBlock id="tree" code={CODE.tree} title="repository" />
        <P>Phase-by-phase contracts and data-flow diagrams: <Ext href={docUrl('docs/architecture.md')}>docs/architecture.md</Ext>.</P>
      </Sub>
      <Sub id="layout-results">
        <Table caption="Tracked result paths" nowrap={[0]} head={['Path', 'Contents']} rows={[
          [<C key="p">data/results/snapshots/paper_v1/</C>, 'Frozen CSV snapshot used for public reproducibility checks'],
          [<C key="p">data/results/tables/phase11/</C>, 'Canonical Phase 11 tables: leaderboard, dataset summaries, rank tests, sensitivity'],
          [<C key="p">data/results/phase11/</C>, 'Compatibility copy of the Phase 11 tables for older scripts'],
          [<C key="p">data/results/figures/phase12/</C>, 'PNG previews of the Phase 12 figures'],
        ]} />
      </Sub>
    </Section>
  );
}

const STUB = 'Prints where to get the data and exits 1 in this checkout.';

export function Cli() {
  return (
    <Section id="cli" lead={<>Every <C>rcb</C> command and the options it requires, read from <C>src/rarecellbenchmark/cli.py</C>. Run <C>rcb &lt;command&gt; --help</C> for the full option list.</>}>
      <Sub id="cli-commands">
        <Table caption="rcb · global flags --version, --verbose" nowrap={[0]} head={['Command', 'Required', 'Does']} rows={[
          [<C key="c">init</C>, 'none', 'Creates the data, figures, logs and configs directories'],
          [<C key="c">create-toy-data</C>, 'none', 'Writes a synthetic unit to data/toy/'],
          [<C key="c">smoke-test</C>, 'none', 'Checks imports, configs, toy-data creation and metrics'],
          [<C key="c">run-method</C>, <C key="r">--method --unit-id --input</C>, 'Runs one method on one unit'],
          [<C key="c">run-track</C>, <C key="r">--track</C>, <span key="d">Builds track units from a processed <C>.h5ad</C>; tracks a to f</span>],
          [<C key="c">evaluate</C>, <C key="r">--track</C>, 'Computes AP, AUROC and top-k metrics from predictions and labels'],
          [<C key="c">figures</C>, 'none', <span key="d">Draws figures; <C>--all</C>, <C>--leaderboard</C>, <C>--runtime</C></span>],
          [<C key="c">run-phase</C>, <C key="r">--phase</C>, STUB],
          [<C key="c">verify-checksums</C>, <C key="r">--dataset</C>, STUB],
          [<C key="c">freeze-leaderboard</C>, <C key="r">--tag</C>, STUB],
        ]} />
      </Sub>
      <Sub id="cli-scripts">
        <Table caption="scripts/ entry points used on this page" nowrap={[0]} head={['Script', 'Key flags']} rows={[
          [<C key="s">run_all.py</C>, <span key="f"><C>--toy</C> | <C>--from-snapshots</C> | <C>--full-data</C></span>],
          [<C key="s">run_phase.py</C>, <span key="f"><C>--phase</C> toy, snapshots, 1 to 12</span>],
          [<C key="s">phase11_statistics.py</C>, <span key="f"><C>--from-snapshots</C> | <C>--metrics-csv</C>, <C>--output-dir</C></span>],
          [<C key="s">reproduce_from_snapshots.py</C>, 'none'],
          [<C key="s">run_methods.py</C>, <span key="f"><C>--methods --units-dir --output-dir</C>, <C>--dry-run</C></span>],
          [<C key="s">download_zenodo_data.py</C>, 'none; needs aria2c'],
        ]} />
      </Sub>
    </Section>
  );
}

export function Troubleshooting() {
  return (
    <Section id="troubleshooting" lead="Known errors, listed by the message you see.">
      <Sub id="troubleshooting-setup">
        <div className="mt-4">
          <Faq summary="Rscript not found, or no package called 'FiRE'">
            <p>Install R, then the benchmark's R packages.</p>
            <CodeBlock id="faqr" code={CODE.faqr} />
            <p>If a package fails to compile, install the build headers: <C>build-essential libcurl4-openssl-dev libssl-dev libxml2-dev</C> on Debian or Ubuntu.</p>
          </Faq>
          <Faq summary="ModuleNotFoundError: No module named 'DeepScena'">
            <p>The upstream method code is not vendored. <C>bash setup/setup_external_methods.sh</C> clones it. DeepScena needs a GPU for Track F; see <Ext href={docUrl('docs/deepscena_colab_instructions.md')}>the Colab instructions</Ext>. To check CUDA:</p>
            <CodeBlock id="cuda" code={CODE.cuda} />
          </Faq>
          <Faq summary="permission denied while connecting to the Docker daemon">
            <CodeBlock id="dockerperm" code={CODE.dockerperm} />
          </Faq>
        </div>
      </Sub>
      <Sub id="troubleshooting-runs">
        <div className="mt-4">
          <Faq summary="rcb run-phase exits with code 1">
            <p>In a Git-only checkout this is expected: it prints the four archive DOIs and stops. Restore the archives, then use <C>python scripts/run_phase.py --phase N</C>.</p>
          </Faq>
          <Faq summary="rcb evaluate stops and asks for --predictions-dir or --labels-dir">
            <p>Both are required in practice. Labels are not in Git: they ship with the track units in the Zenodo archives. After restoring them, point <C>--labels-dir</C> at the track folder, for example <C>data/tracks/a/</C>.</p>
          </Faq>
          <Faq summary="SHA-256 mismatch after preprocessing">
            <p>Checksums move with scanpy and anndata versions, floating-point PCA and seeds. Compare your versions with <C>python -m pip freeze</C>. If you changed preprocessing on purpose, delete the old checksum in <C>configs/datasets.yaml</C> and rerun Phase 2; the new checksum is written automatically.</p>
            <CodeBlock id="phase2" code={CODE.phase2} />
          </Faq>
          <Faq summary="Figures show squares instead of letters">
            <p>A missing font. Clear the matplotlib cache with <C>rm -rf ~/.cache/matplotlib</C>, or set a fallback:</p>
            <CodeBlock id="font" code={CODE.font} title="python" />
          </Faq>
          <Faq summary="Why is Track E not in the main ranking?">
            <p>Track E corrupts labels. Only <C>hvg_logreg</C> consumes labels, so only for it does Track E measure robustness. For unsupervised methods it measures how the metric reacts to wrong labels, so it is kept out of the primary ranking.</p>
          </Faq>
        </div>
        <Callout title="Report a problem">Open a GitHub issue with the exact command, the full traceback, <C>python -m pip list</C> and <C>rcb --version</C>. More cases: <Ext href={docUrl('docs/troubleshooting.md')}>docs/troubleshooting.md</Ext>.</Callout>
      </Sub>
    </Section>
  );
}
