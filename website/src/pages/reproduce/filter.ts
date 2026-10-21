// Section filter (board sidebar): every typed word must appear in a section or step title or its keywords.
import { GROUPS, SECTIONS, type Group, type SectionDef, type SubDef } from './content';

export type Highlight = { t0: string; t1: string; t2: string };
export type FilteredItem = { section: SectionDef; title: Highlight; subs: { sub: SubDef; title: Highlight }[] };
export type FilterResult = { groups: { label: Group; items: FilteredItem[] }[]; filtering: boolean; count: number };

export function words(q: string): string[] {
  const n = q.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}\s._/-]/gu, ' ');
  return n.trim().split(/\s+/).filter(Boolean);
}

/** Marks the first typed word (2+ characters) found in the title. */
export function highlight(text: string, ws: readonly string[]): Highlight {
  const lower = text.toLowerCase();
  for (const w of ws) {
    if (w.length < 2) continue;
    const at = lower.indexOf(w);
    if (at >= 0) return { t0: text.slice(0, at), t1: text.slice(at, at + w.length), t2: text.slice(at + w.length) };
  }
  return { t0: text, t1: '', t2: '' };
}

export function filterSections(query: string): FilterResult {
  const ws = words(query);
  const filtering = ws.length > 0;
  const hits = (hay: string) => { const h = words(hay).join(' '); return ws.every((w) => h.includes(w)); };
  let count = 0;
  const groups = GROUPS.map((label) => {
    const items: FilteredItem[] = [];
    for (const s of SECTIONS.filter((x) => x.group === label)) {
      const own = !filtering || hits(`${s.title} ${s.keywords}`);
      const subs = filtering ? s.subs.filter((b) => hits(`${b.title} ${b.keywords} ${s.title}`)) : [];
      if (!own && subs.length === 0) continue;
      count += 1 + subs.length;
      items.push({ section: s, title: highlight(s.title, ws), subs: subs.map((b) => ({ sub: b, title: highlight(b.title, ws) })) });
    }
    return { label, items };
  }).filter((g) => g.items.length > 0);
  return { groups, filtering, count };
}

export const filterStatus = (r: FilterResult) => (!r.filtering ? '' : r.count === 0 ? 'No section matches' : `${r.count} ${r.count === 1 ? 'match' : 'matches'}`);
