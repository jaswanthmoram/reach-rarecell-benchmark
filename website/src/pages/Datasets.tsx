/* Datasets page: specimen plate hero, cohort catalogue, two-cohort compare, evidence arms, CNV check, Figure 1. */
import { useCallback, useState } from 'react';
import { scrollToId, setQuery, useQuery } from '../lib/router';
import { SectionNav } from '../ui/SectionNav';
import { COHORTS } from './datasets/model';
import { SpecimenHero } from './datasets/SpecimenHero';
import { Catalogue } from './datasets/Catalogue';
import { Compare } from './datasets/Compare';
import { CnvTable, Evidence } from './datasets/Evidence';
import { PipelineFigure } from './datasets/PipelineFigure';
import './datasets/datasets.css';

const VALID = new Set(COHORTS.map((c) => c.id));
const MAX_PAIR = 2;

const SECTIONS = [
  { id: 'catalogue', label: 'Catalogue' },
  { id: 'compare', label: 'Compare' },
  { id: 'evidence', label: 'Labelling rule' },
  { id: 'cnv', label: 'CNV check' },
  { id: 'pipeline', label: 'Figure 1' },
];

/** The compare pair lives in the URL (`/datasets/?compare=a,b`) so "Copy link" reopens the same view. */
function usePair() {
  const raw = useQuery().get('compare') ?? '';
  const pair = [...new Set(raw.split(',').filter((id) => VALID.has(id)))].slice(0, MAX_PAIR);
  const key = pair.join(',');
  const setPair = useCallback((next: string[]) => setQuery(next.length ? `compare=${next.join(',')}` : ''), []);
  const toggle = useCallback((id: string) => {
    const cur = key ? key.split(',') : [];
    const without = cur.filter((x) => x !== id);
    setPair(without.length === cur.length ? [...cur, id].slice(-MAX_PAIR) : without);
  }, [key, setPair]);
  return { pair, setPair, toggle };
}

export default function Datasets() {
  const { pair, setPair, toggle } = usePair();
  const [hot, setHot] = useState<string | null>(null);

  const addAndShow = (id: string) => {
    setPair(pair.includes(id) ? pair : [...pair, id].slice(-MAX_PAIR));
    requestAnimationFrame(() => scrollToId('compare'));
  };

  return (
    <>
      <SpecimenHero pair={pair} hot={hot} onToggle={toggle} onHot={setHot} />
      <SectionNav label="Datasets sections" items={SECTIONS} />
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
        <Catalogue pair={pair} hot={hot} onHot={setHot} onCompare={addAndShow} />
        <Compare pair={pair} hot={hot} onToggle={toggle} onHot={setHot} setPair={setPair} />
        <Evidence />
        <CnvTable />
        <PipelineFigure />
      </div>
    </>
  );
}
