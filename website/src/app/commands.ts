import { DATASETS_DATA, GLOBAL_STATS as G, LEADERBOARD_DATA, TRACKS_DATA } from '../data/benchmarkData';
import { ENTRIES as DOC_ENTRIES } from '../pages/docs/nav';
import type { IconName } from '../ui/Icon';
import { ROUTES, navigate } from './router';
import { toggleTheme } from './theme';

export type CommandGroup = 'Pages' | 'Tracks' | 'Methods' | 'Cohorts' | 'Docs' | 'Actions';
export interface Command {
  id: string;
  group: CommandGroup;
  label: string;
  desc: string;
  keywords?: string;
  icon?: IconName;
  /** Cohort glyph id in icons-cohorts.svg (instead of `icon`). */
  cohort?: string;
  /** Short right-aligned meta, e.g. "Rank 1 of 6". */
  meta?: string;
  run: (ctx: { copy: (text: string, what: string) => void }) => void;
}

const citation = () =>
  `${G.authors.map((a) => a.replace(/[¹²*]/g, '')).join(', ')}. ${G.paperTitle}. ${G.journalCitation}.${G.doiConfirmed ? ` doi:${G.doi}` : ''}`;

const methodMeta = (m: (typeof LEADERBOARD_DATA)[number]) =>
  m.publishedRankNum ? `Rank ${m.publishedRankNum} of ${G.methodsRankedPublished}` : (m.paperRole ?? 'Reference').toLowerCase();

export const COMMANDS: Command[] = [
  ...ROUTES.map((r): Command => ({
    id: `page:${r.path}`, group: 'Pages', label: r.label, desc: r.desc, icon: r.icon, run: () => navigate(r.path),
  })),
  ...[...TRACKS_DATA].sort((a, b) => a.code.localeCompare(b.code)).map((t): Command => {
    const letter = t.code.replace('Track ', '');
    return {
      id: `track:${letter}`, group: 'Tracks', label: `${t.code} · ${t.name}`, desc: t.subtitle, keywords: `${t.roleBadge} ${t.rarityRegime}`,
      icon: 'stack', meta: `${t.units} units`, run: () => navigate('/tracks', { query: `track=${letter.toLowerCase()}` }),
    };
  }),
  ...[...LEADERBOARD_DATA].sort((a, b) => (a.publishedRankNum ?? 99) - (b.publishedRankNum ?? 99)).map((m): Command => ({
    id: `method:${m.id}`, group: 'Methods', label: m.method,
    desc: `${m.paradigm} · median Track A AP ${m.medianAP.toFixed(3)}`,
    keywords: `${m.language} ${m.category} ${m.paperRole ?? ''}`,
    icon: 'flask', meta: methodMeta(m), run: () => navigate('/leaderboard'),
  })),
  ...DATASETS_DATA.map((d): Command => ({
    id: `cohort:${d.id}`, group: 'Cohorts', label: d.name, desc: `${d.cancerType} · ${d.cells} cells · ${d.accession}`,
    keywords: `${d.tissueCategory} ${d.platform}`, cohort: d.id, run: () => navigate('/datasets'),
  })),
  ...DOC_ENTRIES.map((e): Command => ({
    id: `doc:${e.id}`, group: 'Docs', label: e.title, desc: e.subs.map((s) => s.title).join(' · '),
    icon: e.icon as IconName, run: () => navigate('/docs', { anchor: e.id }),
  })),
  { id: 'act:theme', group: 'Actions', label: 'Toggle light and dark theme', desc: 'Switch the colour theme for this site', keywords: 'dark mode light mode appearance', icon: 'moon', run: () => toggleTheme() },
  { id: 'act:cite', group: 'Actions', label: 'Copy citation', desc: `${G.journalCitation}${G.doiConfirmed ? '' : ' · DOI pending'}`, keywords: 'cite reference bibliography', icon: 'quotes', run: ({ copy }) => copy(citation(), 'Citation') },
  { id: 'act:github', group: 'Actions', label: 'Open the GitHub repository', desc: G.githubRepo, keywords: 'code source repo', icon: 'github-logo', run: () => { window.open(G.githubUrl, '_blank', 'noopener'); } },
  { id: 'act:zenodo', group: 'Actions', label: 'Open the Zenodo archive', desc: `doi:${G.zenodoConceptDoi}`, keywords: 'data download archive', icon: 'package', run: () => { window.open(`https://doi.org/${G.zenodoConceptDoi}`, '_blank', 'noopener'); } },
];

/* ---------- Matching ---------- */
const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}\s]/gu, ' ');

/** Higher is better; 0 = no match. Every query word must hit the label, description or keywords. */
export function score(c: Command, query: string): number {
  const q = norm(query).trim();
  if (!q) return 1;
  const label = norm(c.label);
  const hay = `${label} ${norm(c.desc)} ${norm(c.keywords ?? '')} ${c.group.toLowerCase()}`;
  let total = 0;
  for (const w of q.split(/\s+/)) {
    if (label.startsWith(w)) total += 8;
    else if (new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(label)) total += 5;
    else if (label.includes(w)) total += 3;
    else if (hay.includes(w)) total += 1;
    else return 0;
  }
  return total + (c.group === 'Pages' ? 0.5 : 0);
}

export const GROUP_ORDER: CommandGroup[] = ['Pages', 'Methods', 'Tracks', 'Cohorts', 'Docs', 'Actions'];
