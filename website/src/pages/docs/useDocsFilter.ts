// Matching for the docs section filter: every typed word must appear in a title or its keywords.
import { useMemo } from 'react';
import { GROUPS, type Entry } from './nav';

const norm = (s: string): string => s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}\s._/-]/gu, ' ');
export const words = (q: string): string[] => norm(q).trim().split(/\s+/).filter(Boolean);
const hits = (ws: readonly string[], hay: string): boolean => ws.every((w) => hay.includes(w));

interface Match { entry: Entry; subs: Entry['subs'][number][] }
interface GroupMatch { label: string; items: Match[] }

/** Empty query: every group, no sub-rows. Otherwise only matching entries, with the steps that matched. */
export function useDocsFilter(query: string): { groups: GroupMatch[]; count: number; active: boolean } {
  return useMemo(() => {
    const ws = words(query);
    if (ws.length === 0) {
      return { groups: GROUPS.map((g) => ({ label: g.label, items: g.items.map((entry) => ({ entry, subs: [] })) })), count: 0, active: false };
    }
    let count = 0;
    const groups = GROUPS.map((g) => {
      const items = g.items.flatMap((entry): Match[] => {
        const own = hits(ws, norm(`${entry.title} ${entry.keywords}`));
        const subs = entry.subs.filter((s) => hits(ws, norm(`${s.title} ${s.keywords} ${entry.title}`)));
        if (!own && subs.length === 0) return [];
        count += 1 + subs.length;
        return [{ entry, subs }];
      });
      return { label: g.label, items };
    }).filter((g) => g.items.length > 0);
    return { groups, count, active: true };
  }, [query]);
}

