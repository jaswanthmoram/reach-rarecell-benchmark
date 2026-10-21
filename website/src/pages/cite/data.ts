import { GLOBAL_STATS as G, ZENODO_ARCHIVES as Z } from '../../data/benchmarkData';

/* Cite page model: citation formats, the five citable parts and the article record, all built from the data file. */

export type FormatId = 'bibtex' | 'apa' | 'frontiers' | 'ris';
export type PartId = 'paper' | 'code' | 'data' | 'units' | 'predictions';

export interface CiteFormat { id: FormatId; label: string; use: string; text: string; mono: boolean }
export interface CiteRef { name: string; meta: string; doi: string }
export interface CitePart { id: PartId; short: string; what: string; when: string; orbit: string; refs: CiteRef[]; note?: string }

export const doiUrl = (doi: string) => `https://doi.org/${doi}`;

const [, VOLUME = '6', ARTICLE_NO = '1878538'] = /(\d+):(\d+)/.exec(G.journalCitation) ?? [];
const TITLE = G.paperTitle;
const ZENODO_NOTE = `Code and data: Zenodo ${G.zenodoConceptDoi}. Software ${G.version}.`;

export const FORMATS: CiteFormat[] = [
  {
    id: 'bibtex', label: 'BibTeX', use: 'LaTeX and Overleaf', mono: true,
    text: [
      `@article{satyajaswanth${G.year}reach,`,
      `  title   = {${TITLE.replace('REACH', '{REACH}').replace('RNA', '{RNA}')}},`,
      '  author  = {Satya Jaswanth, Moram Venkata and Gavin, Amruthaluri and Aakash, Padarthi and Tejesh Kumar, Muttha and Dasgupta, Abhijit},',
      `  journal = {${G.journalName}},`,
      `  year    = {${G.year}},`,
      `  volume  = {${VOLUME}},`,
      `  pages   = {${ARTICLE_NO}},`,
      `  doi     = {${G.doi}},`,
      `  url     = {${doiUrl(G.doi)}},`,
      `  note    = {${ZENODO_NOTE}}`,
      '}',
    ].join('\n'),
  },
  {
    id: 'apa', label: 'APA 7', use: 'reference lists', mono: false,
    text: `Satya Jaswanth, M. V., Gavin, A., Aakash, P., Tejesh Kumar, M., & Dasgupta, A. (${G.year}). ${TITLE}. ${G.journalName}, ${VOLUME}, ${ARTICLE_NO}. ${doiUrl(G.doi)}`,
  },
  {
    id: 'frontiers', label: 'Frontiers', use: 'the style printed in the article', mono: false,
    text: `Satya Jaswanth MV, Gavin A, Aakash P, Tejesh Kumar M and Dasgupta A (${G.year}) ${TITLE}. Front. Bioinform. ${VOLUME}:${ARTICLE_NO}. doi: ${G.doi}`,
  },
  {
    id: 'ris', label: 'RIS', use: 'Zotero, EndNote and Mendeley', mono: true,
    text: [
      'TY  - JOUR',
      `TI  - ${TITLE}`,
      'AU  - Satya Jaswanth, Moram Venkata',
      'AU  - Gavin, Amruthaluri',
      'AU  - Aakash, Padarthi',
      'AU  - Tejesh Kumar, Muttha',
      'AU  - Dasgupta, Abhijit',
      `JO  - ${G.journalName}`,
      'J2  - Front. Bioinform.',
      `PY  - ${G.year}`,
      `DA  - ${G.year}/10/19`,
      `VL  - ${VOLUME}`,
      `SP  - ${ARTICLE_NO}`,
      `DO  - ${G.doi}`,
      `UR  - ${doiUrl(G.doi)}`,
      `N1  - ${ZENODO_NOTE}`,
      'ER  - ',
    ].join('\n'),
  },
];

const size = (i: number) => Z[i].sizeEstimate.replace(/^~\s*/, '');

export const PARTS: CitePart[] = [
  { id: 'paper', short: 'Article', what: 'Article', orbit: 'PAPER', when: 'Any result, figure, ranking or the benchmark design.',
    refs: [{ name: 'Article', meta: ` · ${G.journalName}`, doi: G.doi }] },
  { id: 'code', short: 'Code', what: 'Code archive', orbit: 'CODE',
    when: `You ran, adapted or extended the framework, configs or method wrappers (${G.version}).`,
    note: 'The concept DOI resolves to the latest release; name the version you ran.',
    refs: [{ name: 'Code and configs', meta: ` · ${size(0)} · concept DOI`, doi: Z[0].doi }] },
  { id: 'data', short: 'Data', what: 'Processed data archive', orbit: 'DATA',
    when: `You used the QC-filtered AnnData for the ${G.datasetsCount} cohorts.`,
    note: "Also cite each cohort's source study.",
    refs: [{ name: 'Processed data', meta: ` · ${size(1)}`, doi: Z[1].doi }] },
  { id: 'units', short: 'Units', what: 'Benchmark units', orbit: 'UNITS',
    when: 'You re-ran methods on the pre-generated units instead of building your own.',
    refs: [{ name: 'Track A–C units', meta: ` · ${size(2)}`, doi: Z[2].doi }, { name: 'Track D–E units', meta: ` · ${size(3)}`, doi: Z[3].doi }] },
  { id: 'predictions', short: 'Predictions', what: 'Predictions', orbit: 'PREDICTIONS',
    when: 'You re-scored or re-plotted from the per-cell predictions and run metadata.',
    refs: [{ name: 'Predictions', meta: ` · ${size(4)}`, doi: Z[4].doi }] },
];

export const ARCHIVE_COUNT = Z.length;
export const isFormatId = (v: string | null): v is FormatId => FORMATS.some((f) => f.id === v);
export const isPartId = (v: string): v is PartId => PARTS.some((p) => p.id === v && p.id !== 'paper');

/* ---------- Article record ---------- */

const SUP: Record<string, string> = { '¹': '1', '²': '2' };
const supOf = (marks: string) => [...marks].map((c) => SUP[c] ?? c).join('');

export const AUTHORS = G.authors.map((a) => {
  const m = /^(.*?)([¹²*]+)$/.exec(a);
  return m ? { name: m[1], sup: supOf(m[2]) } : { name: a, sup: '' };
});
export const AFFILIATIONS = [
  ...G.affiliations.map((a) => ({ mark: SUP[a[0]] ?? '', text: a.replace(/^[¹²]/, '') })),
  { mark: '*', text: 'Corresponding author' },
];

const person = (s: string) => {
  const i = s.indexOf(', ');
  return i < 0 ? { name: s, place: '' } : { name: s.slice(0, i), place: s.slice(i + 2) };
};
export const EDITOR = person(G.editor);
export const REVIEWERS = G.reviewers.map(person);

export const HISTORY = [
  { label: 'Received', date: G.receivedDate },
  { label: 'Revised', date: G.revisedDate },
  { label: 'Accepted', date: G.acceptedDate },
  { label: 'Published', date: G.publishedDate },
];

export const LICENCE_SHORT = G.license.replace(/\s*\(.*\)$/, '');
export const RELEASE_URL = `${G.githubUrl}/releases/tag/${G.version}`;
export { G };
