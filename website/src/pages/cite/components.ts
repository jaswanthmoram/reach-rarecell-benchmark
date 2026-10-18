// The five citable parts of REACH. Shared by the hero orbit (one ring each, paper innermost) and the "How to cite" list.
import type { IconName } from '../../ui';
import { GLOBAL_STATS as G, ZENODO_ARCHIVES } from '../../data/benchmarkData';

export type PartId = 'paper' | 'code' | 'data' | 'units' | 'predictions';
export interface Ref { name: string; meta?: string; doi: string; url: string; /** Reserved but not yet registered: never shown as a live link. */ pending?: boolean }
export interface Part { id: PartId; short: string; what: string; icon: IconName; when: string; cite: Ref[] }
type Archive = (typeof ZENODO_ARCHIVES)[number];

/* Display names derived from the archive `part` field ("Archive 3 (Units A–C)"); the data file keeps its long titles. */
const RENAME: Record<string, string> = { 'code & revision': 'Code and configs' };
const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
function shortName(a: Archive): string {
  const inner = a.part.match(/\((.+)\)$/)?.[1] ?? a.part;
  const units = inner.match(/^Units\s+(.+)$/);
  if (units) return `Track ${units[1]} units`;
  return RENAME[inner.toLowerCase()] ?? sentence(inner);
}
const size = (a: Archive) => a.sizeEstimate.replace(/^~\s*/, '');
const toGB = (s: string) => { const n = parseFloat(s.replace(/[^\d.]/g, '')); return /MB/i.test(s) ? n / 1000 : n; };
export const TOTAL_GB = ZENODO_ARCHIVES.reduce((sum, a) => sum + toGB(a.sizeEstimate), 0);

const archive = (n: number): Ref[] => {
  const a = ZENODO_ARCHIVES.find((x) => x.part.startsWith(`Archive ${n} `));
  if (!a) return [];
  const concept = a.doi === G.zenodoConceptDoi ? ' · concept DOI' : '';
  return [{ name: shortName(a), meta: `${size(a)}${concept}`, doi: a.doi, url: a.url }];
};

export const PARTS: Part[] = [
  { id: 'paper', short: 'Article', what: 'Article', icon: 'file-text', when: 'Any result, figure, ranking or the benchmark design.',
    cite: [{ name: 'Article', meta: G.doiConfirmed ? undefined : 'DOI pending', doi: G.doi, url: `https://doi.org/${G.doi}`, pending: !G.doiConfirmed }] },
  { id: 'code', short: 'Code', what: 'Code archive', icon: 'code', when: `You ran, adapted or extended the framework, configs or method wrappers (${G.version}).`, cite: archive(1) },
  { id: 'data', short: 'Data', what: 'Processed data archive', icon: 'database', when: `You used the QC-filtered AnnData for the ${G.datasetsCount} cohorts.`, cite: archive(2) },
  { id: 'units', short: 'Units', what: 'Benchmark units', icon: 'cube', when: 'You re-ran methods on the pre-generated units instead of building your own.', cite: [...archive(3), ...archive(4)] },
  { id: 'predictions', short: 'Predictions', what: 'Predictions', icon: 'table', when: 'You re-scored or re-plotted from the per-cell predictions and run metadata.', cite: archive(5) },
];

/** The paper is always cited; the picked archives are added after it, in ring order. */
export const citedParts = (picked: ReadonlySet<PartId>) => PARTS.filter((p) => p.id === 'paper' || picked.has(p.id));

/** Plain-text DOI list for the picked parts, one line each, ready to paste into a data-availability statement. */
export const doiList = (picked: ReadonlySet<PartId>) =>
  citedParts(picked).flatMap((p) => p.cite.map((r) => `${p.id === 'paper' ? 'Article' : `${r.name} (Zenodo)`}: https://doi.org/${r.doi}`)).join('\n');
