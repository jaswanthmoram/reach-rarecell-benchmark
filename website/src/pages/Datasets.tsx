import { useEffect, useState } from 'react';
import { DATASETS_DATA } from '../data/benchmarkData';
import { href } from '../app/router';
import { Container, Section, fmt } from '../ui';
import Catalogue from './datasets/Catalogue';
import CnvValidation from './datasets/CnvValidation';
import Compare from './datasets/Compare';
import Evidence from './datasets/Evidence';
import OverviewFigure from './datasets/OverviewFigure';
import SpecimenHero from './datasets/SpecimenHero';
import { CNV_COHORTS, TOTALS } from './datasets/model';

const IDS = new Set(DATASETS_DATA.map((d) => d.id));
const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

/** `#/datasets?compare=a,b` opens a comparison. Unknown or repeated ids are dropped; at most two are kept. */
const pairFromHash = (): string[] => {
  const raw = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('compare') ?? '';
  return [...new Set(raw.split(',').map((s) => s.trim()).filter((s) => IDS.has(s)))].slice(0, 2);
};

export default function Datasets() {
  const [pair, setPair] = useState<string[]>(pairFromHash);

  // Keep the comparison shareable without adding history entries.
  useEffect(() => {
    const target = href('/datasets', pair.length ? `compare=${pair.join(',')}` : undefined);
    if (window.location.hash !== target) window.history.replaceState(null, '', target);
  }, [pair]);

  const toggle = (id: string) => setPair((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id].slice(-2)));
  /** From a catalogue row: add (never remove) and jump to the comparison. */
  const addAndShow = (id: string) => {
    setPair((p) => (p.includes(id) ? p : [...p, id].slice(-2)));
    requestAnimationFrame(() => scrollTo('compare'));
  };

  return (
    <>
      <SpecimenHero pair={pair} onToggle={toggle} onCompare={() => scrollTo('compare')} onEvidence={() => scrollTo('evidence')} />

      <section id="catalogue" aria-labelledby="catalogue-h" className="scroll-mt-16 pb-14 pt-6 md:pb-16">
        <Container>
          <Catalogue onCompare={addAndShow} />
        </Container>
      </section>

      <section id="compare" aria-labelledby="compare-h" className="scroll-mt-16 border-t border-line bg-sunk/50 py-14 md:py-20">
        <Container>
          <div className="mb-6 max-w-[68ch]">
            <h2 id="compare-h" className="text-2xl font-semibold tracking-[-0.02em] text-ink md:text-[2rem]">Two cohorts, side by side</h2>
            <p className="mt-3 text-base leading-relaxed text-ink-2">
              Size, CNV-set share, tracks and the best ranked detector line up on one grid. Below it, each of the six ranked detectors gets a small panel on the same 0 to 1 AP scale.
            </p>
          </div>
          <Compare pair={pair} onToggle={toggle} onSet={setPair} />
        </Container>
      </section>

      <Section id="evidence" label="Ground truth · Phase 03" className="border-t border-line"
        title="How a cell earns a label"
        lead="Four independent arms test every cell. A label is assigned only when all four agree; any disagreement leaves the cell out of the positive set.">
        <Evidence />
      </Section>

      <Section id="cnv" label="Arm 2 validation · Table 9b" className="border-t border-line"
        title="How well does the CNV arm agree with authors?"
        lead={`infercnvpy calls were checked against published source annotations on ${fmt.int(TOTALS.cnvCells)} cells from ${CNV_COHORTS.length} cohorts.`}>
        <CnvValidation />
      </Section>

      <Section id="overview" label="Paper figure" className="border-t border-line"
        title="Where the cohorts sit in the pipeline">
        <OverviewFigure />
      </Section>
    </>
  );
}
