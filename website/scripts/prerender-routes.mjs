// Post-build step for GitHub Pages (no SPA rewrite there): copy dist/index.html into one folder per route, so
// /reach-rarecell-benchmark/leaderboard/ is a real file on a direct load or a refresh, and to dist/404.html, which
// Pages serves for any other path (the app then renders its NotFound page). Each copy gets its own <title>,
// description and canonical URL. Also writes sitemap.xml and robots.txt. Run after `vite build`.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
/** Public address of the deployed site (keep in step with `base` in vite.config.ts). */
const SITE_URL = (process.env.SITE_URL ?? 'https://jaswanthmoram.me/reach-rarecell-benchmark/').replace(/\/?$/, '/');
const SITE_NAME = 'REACH Benchmark';

/** One short description per route; anything missing falls back to the home description in index.html. */
const DESCRIPTIONS = {
  '/leaderboard': 'Ranks of 10 rare malignant cell detection methods across 1,125 benchmark units, with global and pairwise significance tests and per-cohort results.',
  '/tracks': 'The six REACH evaluation tracks, A to F: what each one tests, how its units are built, and which methods lead.',
  '/datasets': 'The 10 oncology scRNA-seq cohorts behind REACH: accessions, cell counts, the malignant labelling rule and the CNV check.',
  '/methods': 'The 10 benchmarked methods: what each one needs, how it scores cells, what it costs to run, and when to use it.',
  '/reproduce': 'Install the rarecellbenchmark package, run a method on a toy unit, and rebuild the paper tables and figures from Git snapshots.',
  '/figures': 'The figures of the REACH article, each with its caption and a full-size view.',
  '/cite': 'How to cite the REACH article, code, data and predictions, with DOIs, BibTeX and licences.',
  '/use-cases': 'Five reader routes through REACH: where each question lands, and the edge cases that change the answer.',
};

/** ROUTES as declared in the app router (single source of truth for paths and labels). */
async function readRoutes() {
  const src = await readFile(join(ROOT, 'src/lib/router.ts'), 'utf8');
  const block = /export const ROUTES = \[([\s\S]*?)\] as const;/.exec(src)?.[1];
  if (!block) throw new Error('prerender: ROUTES not found in src/lib/router.ts');
  const routes = [...block.matchAll(/\{\s*path:\s*'([^']*)',\s*label:\s*'([^']*)'\s*\}/g)].map(([, path, label]) => ({ path, label }));
  if (!routes.some((r) => r.path === '/')) throw new Error('prerender: ROUTES has no "/" entry');
  return routes;
}

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const urlFor = (path) => (path === '/' ? SITE_URL : `${SITE_URL}${path.replace(/^\/+|\/+$/g, '')}/`);

/** Replace exactly one match, or fail the build (a silent miss would ship every page with the home metadata). */
function replaceOnce(html, pattern, replacement, what) {
  if (!pattern.test(html)) throw new Error(`prerender: ${what} not found in dist/index.html`);
  return html.replace(pattern, replacement);
}

function withMeta(html, { title, description, canonical, noindex = false }) {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  let out = replaceOnce(html, /<title>[^<]*<\/title>/, `<title>${t}</title>`, '<title>');
  out = replaceOnce(out, /<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${d}" />`, 'meta description');
  out = replaceOnce(out, /<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${t}" />`, 'og:title');
  out = replaceOnce(out, /<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${d}" />`, 'og:description');
  const extra = noindex
    ? '<meta name="robots" content="noindex" />'
    : `<link rel="canonical" href="${escapeHtml(canonical)}" />\n    <meta property="og:url" content="${escapeHtml(canonical)}" />`;
  return replaceOnce(out, /(\s*)<\/head>/, `\n    ${extra}$1</head>`, '</head>');
}

async function main() {
  const routes = await readRoutes();
  const template = await readFile(join(DIST, 'index.html'), 'utf8');
  const homeTitle = /<title>([^<]*)<\/title>/.exec(template)?.[1] ?? SITE_NAME;
  const homeDescription = /<meta name="description" content="([^"]*)"/.exec(template)?.[1] ?? '';
  const written = [];

  for (const { path, label } of routes) {
    const home = path === '/';
    const html = withMeta(template, {
      title: home ? homeTitle : `${label} · ${SITE_NAME}`,
      description: home ? homeDescription : (DESCRIPTIONS[path] ?? homeDescription),
      canonical: urlFor(path),
    });
    const file = home ? join(DIST, 'index.html') : join(DIST, path.slice(1), 'index.html');
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, html);
    written.push(file.slice(DIST.length + 1));
  }

  await writeFile(join(DIST, '404.html'), withMeta(template, {
    title: `Page not found · ${SITE_NAME}`,
    description: homeDescription,
    noindex: true,
  }));
  written.push('404.html');

  const today = new Date().toISOString().slice(0, 10);
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...routes.map(({ path }) => `  <url><loc>${urlFor(path)}</loc><lastmod>${today}</lastmod></url>`),
    '</urlset>',
    '',
  ].join('\n');
  await writeFile(join(DIST, 'sitemap.xml'), sitemap);
  await writeFile(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}sitemap.xml\n`);
  written.push('sitemap.xml', 'robots.txt');

  console.log(`prerender: wrote ${written.length} files to dist/ (${written.join(', ')})`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
