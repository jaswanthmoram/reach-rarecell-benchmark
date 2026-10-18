import { GLOBAL_STATS as G } from '../data/benchmarkData';
import { Badge, Container, CopyButton, Icon, Lockup, Mark } from '../ui';
import { ROUTES, href, useRoute, type RoutePath } from './router';

const byPath = (p: RoutePath) => ROUTES.find((r) => r.path === p)!;
const SITEMAP: { title: string; paths: RoutePath[] }[] = [
  { title: 'Results', paths: ['/', '/leaderboard', '/tracks', '/datasets', '/methods'] },
  { title: 'Resources', paths: ['/figures', '/docs', '/cite', '/use-cases'] },
];
const DOI_PENDING = !G.doiConfirmed;
const AUTHORS = G.authors.map((a) => a.replace(/[¹²*]/g, ''));
const CITATION = `${AUTHORS.join(', ')}. ${G.paperTitle}. ${G.journalCitation}.${DOI_PENDING ? '' : ` doi:${G.doi}`}`;

const linkCls = 'inline-flex items-center gap-1.5 text-ink-2 transition-colors duration-150 hover:text-ink';

export function Footer() {
  // The Cite page already leads with the citation; the footer card would repeat it.
  const onCite = useRoute() === '/cite';
  return (
    <footer className="mt-16 border-t border-line">
      <Container className="grid gap-12 py-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16 [&>*]:min-w-0">
        <div className="flex flex-col gap-6">
          <Lockup size={24} link />
          <p className="max-w-[52ch] text-sm leading-relaxed text-ink-2">
            Rare-cell Evaluation Across Cancer Heterogeneity: a reproducible benchmark of rare malignant cell detection in
            single-cell RNA-seq. {G.datasetsCount} cohorts, {G.tracksCount} tracks, {G.methodsIncluded} methods, {G.totalUnits.toLocaleString('en-US')} benchmark units.
          </p>
          {!onCite && <figure className="rounded-card border border-line bg-surface">
            <div className="flex items-center justify-between gap-3 border-b border-line py-1.5 pl-4 pr-2">
              <figcaption className="label">Cite the paper</figcaption>
              <CopyButton text={CITATION} label="Copy citation" toast="Citation copied" />
            </div>
            <blockquote className="px-4 py-3.5 text-[13px] leading-relaxed text-ink-2">
              {AUTHORS.slice(0, 2).join(', ')}, et al. <span className="text-ink">{G.paperTitle}.</span>{' '}
              <span className="italic">{G.journalName}</span> {G.year}.
            </blockquote>
            <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-2.5">
              <span className="min-w-0 truncate font-mono text-xs text-ink-2">doi:{G.doi}</span>
              {DOI_PENDING && <Badge>pending</Badge>}
              <a href={href('/cite')} className="ml-auto inline-flex items-center gap-1 text-xs text-ink-2 hover:text-accent">
                All formats <Icon name="arrow-right" size={12} />
              </a>
            </div>
          </figure>}
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {SITEMAP.map((col) => (
            <div key={col.title}>
              <p className="label mb-4">{col.title}</p>
              <ul className="flex flex-col gap-3 text-sm">
                {col.paths.map((p) => <li key={p}><a href={href(p)} className={linkCls}>{byPath(p).label}</a></li>)}
              </ul>
            </div>
          ))}
          <div>
            <p className="label mb-4">Project</p>
            <ul className="flex flex-col gap-3 text-sm">
              <li><a href={href('/system')} className={linkCls}>Design system</a></li>
              <li><a href={G.githubUrl} target="_blank" rel="noreferrer" className={linkCls}>GitHub <Icon name="arrow-up-right" size={12} className="text-ink-3" /></a></li>
              <li><a href={`https://doi.org/${G.zenodoConceptDoi}`} target="_blank" rel="noreferrer" className={linkCls}>Zenodo archive <Icon name="arrow-up-right" size={12} className="text-ink-3" /></a></li>
              <li><a href={`${G.githubUrl}/blob/main/LICENSE`} target="_blank" rel="noreferrer" className={linkCls}>MIT licence (code) <Icon name="arrow-up-right" size={12} className="text-ink-3" /></a></li>
            </ul>
          </div>
        </nav>
      </Container>
      <Container className="flex flex-col gap-3 border-t border-line py-6 text-xs text-ink-3 sm:flex-row sm:items-center sm:justify-between [overflow-wrap:anywhere]">
        <span className="flex items-center gap-2.5"><Mark size={16} /> © {G.year} REACH authors · SRM University-AP</span>
        <span className="font-mono">{G.version} · {G.journalCitation}{DOI_PENDING ? ' · DOI pending' : ''}</span>
      </Container>
    </footer>
  );
}
