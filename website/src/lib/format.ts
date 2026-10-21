/** Display rules (canvas boards): AP to 3 decimals, runtimes in seconds, thousands with commas. */
export const fmt = {
  ap: (v: number | null | undefined) => (v == null ? 'n/a' : v.toFixed(3)),
  secs: (v: number | null | undefined) => (v == null ? 'n/a' : `${v.toFixed(1)} s`),
  int: (v: number) => v.toLocaleString('en-US'),
  pct: (v: number, d = 1) => `${(v * 100).toFixed(d)}%`,
};

/** Path to a file in public/, correct under the GitHub Pages base path. */
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

/** Method identity colour (marks only), e.g. `methodColor('FiRE')` gives `var(--m-fire)`. */
export const methodColor = (method: string) => `var(--m-${method.toLowerCase()})`;

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
