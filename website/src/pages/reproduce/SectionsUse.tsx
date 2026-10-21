// Use: Reproduce the paper and Add your own method.
import { GLOBAL_STATS as G } from '../../data/benchmarkData';
import { fmt } from '../../lib/format';
import { CODE, TABSETS, docUrl, numberWord } from './content';
import { C, Callout, CodeBlock, Ext, Jump, Need, P, Section, Sub, TabbedCode, Table } from './kit';
import { PhaseMap } from './PhaseMap';

const MODES: [string, string, boolean][] = [
  ['Toy smoke', 'python scripts/run_all.py --toy', false],
  ['Snapshot tables and figures', 'python scripts/run_all.py --from-snapshots', false],
  ['Snakemake dry-run', 'snakemake -n --cores 1', false],
  ['DVC dry-run', 'dvc repro --dry', false],
  ['Full prediction evaluation', 'python scripts/run_phase.py --phase 11', true],
  ['Full figure regeneration', 'python scripts/run_phase.py --phase 12', true],
];

/** Phone layout (States board): the modes table becomes a stacked list. */
function ModesList() {
  return (
    <ul className="m-0 mt-4 list-none rounded-card border border-line bg-surface p-0 sm:hidden">
      {MODES.map(([mode, cmd, archives]) => (
        <li key={mode} className="flex flex-col gap-1.5 border-b border-line p-3 text-sm last:border-b-0">
          <span className="font-medium">{mode}</span>
          <code className="font-mono text-[12.5px] [overflow-wrap:anywhere]">{cmd}</code>
          <span className={archives ? 'self-start rounded-chip bg-sunk px-1.5 py-0.5 font-mono text-[11px] text-ink-2' : 'self-start rounded-chip bg-accent-tint px-1.5 py-0.5 font-mono text-[11px] text-accent-ink'}>
            {archives ? 'Needs Zenodo archives' : 'Git checkout only'}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Reproduce({ onJump }: { onJump: (id: string) => void }) {
  return (
    <Section id="reproduce" lead={`The Phase 11 tables and Phase 12 figures in the paper rebuild from CSV snapshots tracked in Git. Rerunning all ${fmt.int(G.totalEvaluations)} method-unit predictions needs the Zenodo archives.`}>
      <PhaseMap onJump={onJump} />
      <Sub id="reproduce-modes">
        <div className="max-sm:hidden">
          <Table caption="Source · docs/reproducibility.md" head={['Mode', 'Command', 'Needs']}
            rows={MODES.map(([mode, cmd, archives]) => [mode, <C key="c">{cmd}</C>, <Need key="n" archives={archives} />])} />
        </div>
        <ModesList />
      </Sub>
      <Sub id="reproduce-from-snapshots">
        <CodeBlock id="snapshot" code={CODE.snapshot} />
        <P>Input: four CSVs in <C>data/results/snapshots/paper_v1/</C> (per unit, per method, per dataset, and the degenerate-prediction report).</P>
        <Table caption="Outputs of the snapshot rebuild" nowrap={[0]} head={['Path', 'Contents']} rows={[
          [<C key="p">data/results/tables/phase11/</C>, 'Leaderboard, rank CIs, global and pairwise tests, per-dataset summary, unit metrics sample.'],
          [<C key="p">data/results/figures/phase12/</C>, <span key="c">12 PNG figures, from <C>Fig0_Phase11_Summary_Heatmap.png</C> to <C>Fig11_Track_F_vs_Track_A.png</C>.</span>],
        ]} />
      </Sub>
      <Sub id="reproduce-workflows">
        <P>The same snapshot steps are wired into Snakemake and DVC. Dry-runs check the workflow structure without running the data pipeline.</P>
        <TabbedCode id="workflow" set={TABSETS.workflow} />
      </Sub>
      <Sub id="reproduce-full-data">
        <CodeBlock id="full" code={CODE.full} />
        <P>The download script calls <C>aria2c</C>, so install it first. It resumes partial downloads and deletes each <C>.tar.gz</C> after extracting it. The archives are listed under <Jump to="data" onJump={onJump}>Data and archives</Jump>.</P>
        <Callout warn title="rcb run-phase prints the archive DOIs">In this checkout <C>rcb run-phase --phase N</C> prints the archive DOIs and exits with code 1. Use <C>python scripts/run_phase.py --phase N</C> once the archives are in place.</Callout>
      </Sub>
      <Sub id="reproduce-seeds">
        <Table caption="Seeds · docs/reproducibility.md" head={['Component', 'Seed source']} rows={[
          ['Toy data', <C key="s">rcb create-toy-data --seed</C>],
          ['Track generation', 'Unit metadata plus a fixed base seed'],
          ['Method wrappers', 'Method config and unit metadata'],
          ['Rank summaries', 'Fixed bootstrap seed in the evaluation utilities'],
        ]} />
        <P>Processed datasets carry SHA-256 checksums in config metadata and AnnData provenance fields; every <C>runmeta.json</C> records the hashes of its input and output. To record the environment next to a report:</P>
        <CodeBlock id="freeze" code={CODE.freeze} />
        <P>Full detail: <Ext href={docUrl('docs/reproducibility.md')}>docs/reproducibility.md</Ext>.</P>
      </Sub>
    </Section>
  );
}

export function AddMethod() {
  const ten = numberWord(G.methodsIncluded);
  return (
    <Section id="add-method" lead="A method is one wrapper class and one YAML config. It reads a blind unit and returns one score per cell; shared helpers write the standard outputs. You also register the class and add its ID to one test.">
      <Sub id="add-method-template">
        <CodeBlock id="template" code={CODE.template} />
        <P>Rename the class to <C>MyMethodWrapper</C> and set <C>method_id</C>. Baselines live in <C>naive/</C> and exploratory methods in <C>exploratory/</C>; published detectors go in <C>ranked/</C>.</P>
      </Sub>
      <Sub id="add-method-contract">
        <CodeBlock id="wrapper" code={CODE.wrapper} title="src/rarecellbenchmark/methods/ranked/my_method.py" />
        <Table caption="What the wrapper must satisfy" head={['Rule', 'Detail']} rows={[
          ['Input', <span key="d"><C>load_blind_adata</C> reads the unit and raises if <C>obs</C> contains <C>y_true</C>. Methods never see labels.</span>],
          ['Score', 'One float per cell. Higher means more likely rare or malignant.'],
          ['Order', <span key="d"><C>validate_predictions</C> raises unless there are exactly <C>n_obs</C> rows and <C>cell_id</C> matches <C>obs_names</C> in order.</span>],
          ['Outputs', <span key="d"><C>&lt;unit&gt;_predictions.csv</C> and <C>&lt;unit&gt;_runmeta.json</C> with runtime, peak memory, seed and input and output hashes.</span>],
          ['Labels', <span key="d">Set <C>consumes_labels = True</C> only if the method reads labels. The one such wrapper, <C>hvg_logreg</C>, is reported as the supervised ceiling and is not assigned a leaderboard rank.</span>],
        ]} />
        <P>Then fill in the YAML. <C>method_id</C>, <C>category</C> and <C>wrapper</C> must match the class, because a test imports the class from that path.</P>
        <CodeBlock id="yaml" code={CODE.yaml} title="configs/methods/my_method.yaml" />
      </Sub>
      <Sub id="add-method-register">
        <P>Import the class in the registry and add it to the list that is passed to <C>register</C>.</P>
        <CodeBlock id="registry" code={CODE.registry} title="registry.py" />
      </Sub>
      <Sub id="add-method-test">
        <CodeBlock id="amtest" code={CODE.amtest} />
        <P>The interface test runs every registered wrapper on a toy unit and checks the YAML wrapper paths.</P>
        <Callout warn title="One test pins the method count"><C>test_registry_exposes_all_included_methods</C> asserts the registry holds exactly the {ten} published IDs. It fails once you register an eleventh; add your ID to <C>EXPECTED_INCLUDED_METHODS</C> in the same file.</Callout>
      </Sub>
      <Sub id="add-method-run-units">
        <CodeBlock id="amfull" code={CODE.amfull} />
        <ol className="mb-0 mt-4 flex flex-col gap-2 pl-5 text-[15px] leading-[1.6] text-ink-2">
          <li><C>--units-dir</C> is searched recursively for <C>*_manifest.json</C>. Track units live under <C>data/tracks/</C> once the archives are restored.</li>
          <li>Drop <C>--dry-run</C> to execute. Add <C>--continue-on-error</C> to keep going after a failed unit.</li>
          <li>Score them one track at a time: <C>rcb evaluate --track a --method my_method --predictions-dir data/predictions/ --labels-dir data/tracks/a/ --output my_method_a.csv</C></li>
          <li><C>scripts/phase11_statistics.py</C> takes a per-unit metrics CSV through <C>--metrics-csv</C> for the rank tests.</li>
        </ol>
      </Sub>
    </Section>
  );
}
