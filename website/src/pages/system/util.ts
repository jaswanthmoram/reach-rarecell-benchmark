// Pure helpers for the System page (kept out of the component files for fast refresh).
export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

/* ---------- Contrast (WCAG 2.x relative luminance) ---------- */
const channel = (v: number) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
export function parseHex(hex: string): [number, number, number] | null {
  const h = hex.trim().replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
}
const lum = (rgb: [number, number, number]) => 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
export function contrast(a: string, b: string): number | null {
  const x = parseHex(a); const y = parseHex(b);
  if (!x || !y) return null;
  const [l1, l2] = [lum(x), lum(y)].sort((m, n) => n - m);
  return (l1 + 0.05) / (l2 + 0.05);
}


/* ---------- Method order (site rule 1) and reference marks (site rule 2) ---------- */
const REFERENCE_ORDER = ['CaSee', 'expr_threshold', 'random_baseline'];
const CEILING_ID = 'hvg_logreg';
/** Ceiling first, ranked 1 to 6 by median AP, then the three reference methods. */
export const methodSortKey = (m: { id: string; publishedRankNum: number | null }): number =>
  m.id === CEILING_ID ? 0 : m.publishedRankNum ?? 10 + REFERENCE_ORDER.indexOf(m.id);
/** The ceiling and the three references are drawn with dashed marks in every view. */
export const isReference = (id: string): boolean => id === CEILING_ID || REFERENCE_ORDER.includes(id);
