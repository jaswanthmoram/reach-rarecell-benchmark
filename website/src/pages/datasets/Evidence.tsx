import { GLOBAL_STATS } from '../../data/benchmarkData';
import { href } from '../../app/router';
import { Button, Icon, type IconName } from '../../ui';

/**
 * Per-arm criteria, worded from proof §3.4: a cell is P_HC only when it satisfies all four positive
 * criteria (source positive, aneuploid, AUCell >= tau_AUCell, kNN purity >= tau_kNN); B_HC needs all
 * four in the opposite direction. Thresholds are the defaults in EVIDENCE_ARMS.
 */
const G = GLOBAL_STATS;
const ARMS: { icon: IconName; title: string; tool: string; body: string; pos: string; neg: string }[] = [
  { icon: 'file-text', title: 'Source annotation', tool: 'Author cell-type labels', body: 'Published annotations separate tumour cells from immune, stromal and normal compartments.', pos: 'Source positive', neg: 'Source negative' },
  { icon: 'dna', title: 'CNV burden', tool: 'infercnvpy v0.6.1 · GRCh38', body: `Copy-number inference on gene positions. Checked against author labels on ${G.cnvValidatedCells.toLocaleString('en-US')} cells (AUROC ${G.cnvOverallAUROC.toFixed(3)}).`, pos: 'Aneuploid', neg: 'Diploid' },
  { icon: 'chart-bar', title: 'Malignancy signature', tool: 'AUCell · τ = 0.15', body: 'Cancer-signature score per cell. Threshold tested at 0.10, 0.15 and 0.20.', pos: 'AUCell ≥ 0.15', neg: 'Low signature' },
  { icon: 'share-network', title: 'Neighbourhood agreement', tool: 'kNN purity · k = 15 · τ = 0.50', body: 'Share of the 15 nearest PCA neighbours with the same provisional class. Tested at 0.40, 0.50 and 0.60.', pos: 'Purity ≥ 0.50', neg: 'Benign neighbourhood' },
];

function ArmPanel({ i }: { i: number }) {
  const a = ARMS[i];
  return (
    <li className="reveal flex flex-col rounded-card border border-line bg-surface p-5 transition-colors duration-150 hover:border-line-strong">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-semibold text-ink-3 tabular">{String(i + 1).padStart(2, '0')}</span>
        <span className="grid size-9 place-items-center rounded-full border border-line bg-sunk text-ink-2"><Icon name={a.icon} size={18} /></span>
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-[-0.01em] text-ink">{a.title}</h3>
      <p className="mt-1 font-mono text-xs text-ink-2">{a.tool}</p>
      <p className="mb-5 mt-3 text-sm leading-relaxed text-ink-2">{a.body}</p>
      <dl className="mt-auto grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 border-t border-line pt-4 text-sm">
        <dt className="font-mono text-[11px] font-semibold text-ink">P_HC</dt>
        <dd className="flex items-center gap-1.5 text-ink"><Icon name="check" size={14} className="text-ink-2" />{a.pos}</dd>
        <dt className="font-mono text-[11px] font-semibold text-ink-3">B_HC</dt>
        <dd className="flex items-center gap-1.5 text-ink-2"><Icon name="minus" size={14} className="text-ink-3" />{a.neg}</dd>
      </dl>
    </li>
  );
}

/** Four marks then the outcome: the intersection rule drawn, not just stated. */
function Rule({ label, marks, outcome, note, muted }: { label: string; marks: IconName; outcome: string; note: string; muted?: boolean }) {
  return (
    <div className={`grid gap-4 rounded-card border p-5 md:grid-cols-[auto_auto_minmax(0,1fr)] md:items-center md:gap-6 ${muted ? 'border-dashed border-line-strong bg-sunk' : 'border-line bg-surface'}`}>
      <p className="font-mono text-sm font-semibold text-ink">{label}</p>
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {ARMS.map((a, i) => (
          <span key={a.title} className="flex items-center gap-1.5">
            <span className={`grid size-8 place-items-center rounded-full border ${muted ? 'border-line-strong text-ink-3' : 'border-ink/25 bg-sunk text-ink'}`}>
              <Icon name={marks} size={14} />
            </span>
            {i < ARMS.length - 1 && <span className="font-mono text-xs text-ink-3">∧</span>}
          </span>
        ))}
        <Icon name="arrow-right" size={16} className="mx-1 text-ink-3" />
      </div>
      <div>
        <p className="text-base font-semibold text-ink">{outcome}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-ink-2">{note}</p>
      </div>
    </div>
  );
}

export default function Evidence() {
  return (
    <div>
      <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {ARMS.map((a, i) => <ArmPanel key={a.title} i={i} />)}
      </ol>

      <p className="label mb-3 mt-12">The rule · all four, or no label</p>
      <div className="grid gap-3">
        <Rule label="P_HC" marks="check" outcome="High-confidence malignant"
          note="Source positive, aneuploid (infercnvpy), AUCell ≥ 0.15 and kNN purity ≥ 0.50. All four criteria must hold. These cells are the Track A positives." />
        <Rule label="B_HC" marks="minus" muted outcome="High-confidence benign: no cell qualified (n = 0)"
          note="All four criteria in the opposite direction. No cell met all four on any of the seven cohorts and nine threshold settings tested, so Track A backgrounds come from the broader source-negative, diploid, low-signature pool (§3.5)." />
      </div>
      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="max-w-[72ch] text-sm leading-relaxed text-ink-2">
          Cells that miss any criterion keep a lower confidence tier and are not sampled as positives. A relabelling without the CNV arm (arms 1, 3 and 4 only) tests whether arm 2 favours CNV-sensitive methods.
        </p>
        <Button href={href('/tracks')} variant="ghost" size="sm" iconRight="arrow-right" className="shrink-0">Circularity check on Tracks</Button>
      </div>
    </div>
  );
}
