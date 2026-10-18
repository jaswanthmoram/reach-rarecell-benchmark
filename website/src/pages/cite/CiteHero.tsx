import { LiveHero, Container, Icon, type LiveLayout } from '../../ui';
import { href, navigate } from '../../app/router';
import { ZENODO_ARCHIVES } from '../../data/benchmarkData';
import { PARTS, citedParts } from './components';
import { OrbitCanvas } from './OrbitCanvas';
import type { CitePick } from './useCitePick';

/* Far layer: a sparse field drifting slowly to the right behind the orbit. No signal cells: the orbit owns the found cell. */
const FAR_FIELD: LiveLayout = (r) => Array.from({ length: 320 }, () => ({ x: r(), y: r(), r: 0.5 + r() * 0.8, vx: 0.002 + r() * 0.004 }));

const CHIP = 'inline-flex h-9 items-center gap-2 rounded-chip border px-3 text-sm transition-[background,border-color,color] duration-150';

export function CiteHero({ pick }: { pick: CitePick }) {
  const { picked, hover, toggle, setHover } = pick;
  const dois = citedParts(picked).reduce((n, p) => n + p.cite.length, 0);
  return (
    <LiveHero layout={FAR_FIELD} seed={11} intensity={0.6}>
      <Container className="grid gap-6 py-8 md:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] md:items-center md:gap-8 md:py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)]">
        <div className="rise min-w-0 max-w-[600px]">
          <p className="label mb-3">1 article · {ZENODO_ARCHIVES.length} Zenodo archives</p>
          <h1 className="balance text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.03em] text-ink md:text-[2.75rem]">Cite REACH</h1>
          <p className="mt-3 max-w-[54ch] text-base leading-relaxed text-ink-2">
            Cite the article for any result on this site. If you reused code or data, add the matching Zenodo archive after it.
          </p>
          <fieldset className="mt-6">
            <legend className="mb-2 text-sm font-medium text-ink">What did you reuse?</legend>
            <div className="flex flex-wrap gap-2" onMouseLeave={() => setHover(null)}>
              {PARTS.map((p) => {
                const always = p.id === 'paper';
                const on = always || picked.has(p.id);
                return (
                  <button key={p.id} type="button" aria-pressed={on} aria-disabled={always || undefined}
                    title={always ? 'The article is always cited' : undefined}
                    onClick={() => !always && toggle(p.id)} onMouseEnter={() => setHover(p.id)} onFocus={() => setHover(p.id)} onBlur={() => setHover(null)}
                    className={`${CHIP} ${on ? 'border-accent/40 bg-accent-tint text-accent-ink' : 'border-line-strong bg-surface/80 text-ink-2 hover:border-ink/40 hover:text-ink'} ${always ? 'cursor-default' : ''}`}>
                    <Icon name={on ? 'check' : p.icon} size={14} />{p.short}{always && <span className="text-xs text-accent-ink/80">always</span>}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-sm text-ink-2" aria-live="polite">
              <span className="tabular text-ink">{dois} {dois === 1 ? 'DOI' : 'DOIs'}</span> to cite.{' '}
              <a href={href('/cite')} onClick={(e) => { e.preventDefault(); navigate('/cite', { anchor: 'archives' }); }} className="inline-flex items-center gap-1 text-accent underline decoration-accent/30 underline-offset-2 hover:decoration-accent">
                See them<Icon name="caret-down" size={12} />
              </a>
            </p>
          </fieldset>
        </div>
        <div className="rise relative h-[168px] min-w-0 [animation-delay:80ms] md:h-[300px]">
          <OrbitCanvas lit={picked} hover={hover} onHover={setHover} onPick={toggle} />
        </div>
      </Container>
    </LiveHero>
  );
}
