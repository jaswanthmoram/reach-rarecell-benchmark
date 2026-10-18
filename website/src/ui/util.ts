export const asset = (p: string) => `${import.meta.env.BASE_URL}${p.replace(/^\//, '')}`;

/** Method identity colour for marks (dots, whiskers, lines). Text stays ink. */
export const methodColor = (id: string) => `var(--m-${id.toLowerCase()}, var(--ink-3))`;

export const fmt = {
  ap: (v: number) => v.toFixed(3),
  int: (v: number) => v.toLocaleString('en-US'),
  // Seconds with one decimal, as the paper reports runtimes (Figure 6: FiRE 118.1 s).
  secs: (v: number) => `${v.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} s`,
};
