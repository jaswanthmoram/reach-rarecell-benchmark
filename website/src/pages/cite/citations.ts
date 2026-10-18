// Citation strings for the Cite page, built from GLOBAL_STATS (audited against the Frontiers proof).
import { GLOBAL_STATS as G } from '../../data/benchmarkData';

/*
 * Family names in GLOBAL_STATS.authors order, as set in the proof's citation line
 * ("Satya Jaswanth MV, Gavin A, Aakash P, Tejesh Kumar M and Dasgupta A"). The data file stores
 * full names only, so the family/given split lives here.
 */
const FAMILY = ['Satya Jaswanth', 'Gavin', 'Aakash', 'Tejesh Kumar', 'Dasgupta'];

export const DOI_URL = `https://doi.org/${G.doi}`;

const [, VOLUME = '', ARTICLE = '', YEAR = ''] = G.journalCitation.match(/(\d+):(\d+)\s*\((\d{4})\)/) ?? [];
const JOURNAL_ABBR = G.journalCitation.replace(/\s*\d+:\d+.*$/, '');

export interface Author { full: string; family: string; given: string; initials: string; marks: string; corresponding: boolean }

export const AUTHORS: Author[] = G.authors.map((raw, i) => {
  const full = raw.replace(/[¹²³*]/g, '').trim();
  const family = FAMILY[i] ?? full.split(' ').slice(-1)[0];
  const given = full.slice(0, full.length - family.length).trim();
  return {
    full, family, given,
    initials: given.split(/\s+/).map((w) => w[0]).join(''),
    marks: raw.replace(/[^¹²³]/g, ''),
    corresponding: raw.includes('*'),
  };
});

const last = AUTHORS[AUTHORS.length - 1];
const apaName = (a: Author) => `${a.family}, ${a.initials.split('').map((c) => `${c}.`).join(' ')}`;
/* Keep acronyms upper-case in BibTeX styles that lower-case titles. */
const bibTitle = G.paperTitle.replace(/\b([A-Z]{2,})\b/g, '{$1}');

const frontiers = `${AUTHORS.slice(0, -1).map((a) => `${a.family} ${a.initials}`).join(', ')} and ${last.family} ${last.initials} (${YEAR}) ${G.paperTitle}. ${JOURNAL_ABBR} ${VOLUME}:${ARTICLE}. doi: ${G.doi}`;

const apa = `${AUTHORS.slice(0, -1).map(apaName).join(', ')}, & ${apaName(last)} (${YEAR}). ${G.paperTitle}. ${G.journalName}, ${VOLUME}, ${ARTICLE}. ${DOI_URL}`;

const bibtex = [
  `@article{${FAMILY[0].toLowerCase().replace(/\s+/g, '')}${YEAR}reach,`,
  `  title   = {${bibTitle}},`,
  `  author  = {${AUTHORS.map((a) => `${a.family}, ${a.given}`).join(' and ')}},`,
  `  journal = {${G.journalName}},`,
  `  year    = {${YEAR}},`,
  `  volume  = {${VOLUME}},`,
  `  pages   = {${ARTICLE}},`,
  `  doi     = {${G.doi}},`,
  `  url     = {${DOI_URL}},`,
  `  note    = {Code and data: Zenodo ${G.zenodoConceptDoi}. Software ${G.version}.}`,
  '}',
].join('\n');

const ris = [
  'TY  - JOUR',
  `TI  - ${G.paperTitle}`,
  ...AUTHORS.map((a) => `AU  - ${a.family}, ${a.given}`),
  `JO  - ${G.journalName}`,
  `J2  - ${JOURNAL_ABBR}`,
  `PY  - ${YEAR}`,
  `VL  - ${VOLUME}`,
  `SP  - ${ARTICLE}`,
  `DO  - ${G.doi}`,
  `UR  - ${DOI_URL}`,
  `N1  - Code and data: Zenodo ${G.zenodoConceptDoi}. Software ${G.version}.`,
  'ER  - ',
].join('\n');

export type FormatId = 'bibtex' | 'apa' | 'frontiers' | 'ris';
export interface CitationFormat { id: FormatId; label: string; use: string; text: string; file: string; mono: boolean; hanging?: boolean }

export const FORMATS: CitationFormat[] = [
  { id: 'bibtex', label: 'BibTeX', use: 'LaTeX and Overleaf', text: bibtex, file: 'reach-2026.bib', mono: true },
  { id: 'apa', label: 'APA 7', use: 'reference lists', text: apa, file: 'reach-2026-apa.txt', mono: false, hanging: true },
  { id: 'frontiers', label: 'Frontiers', use: 'the style printed in the article', text: frontiers, file: 'reach-2026-frontiers.txt', mono: false },
  { id: 'ris', label: 'RIS', use: 'Zotero, EndNote and Mendeley', text: ris, file: 'reach-2026.ris', mono: true },
];

/** Width (in ch) of a BibTeX `key = {` or RIS `TY  - ` prefix, so wrapped lines hang under the value. */
export const hangOf = (line: string) => line.match(/^(\s*\w+\s*=\s*\{|[A-Z][A-Z0-9] {2}- )/)?.[0].length ?? 0;
