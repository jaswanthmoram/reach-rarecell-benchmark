import { GITHUB_URL } from '../../app/App';
import { href } from '../../app/router';
import { Container, Icon, fmt, type IconName } from '../../ui';
import { G } from './facts';

const ZENODO_URL = `https://doi.org/${G.zenodoConceptDoi}`;

interface Tile { icon: IconName; title: string; body: string; to: string; external?: boolean }

const TILES: Tile[] = [
  { icon: 'github-logo', title: 'GitHub repository', body: 'MIT-licensed code, one command per phase, frozen snapshots.', to: GITHUB_URL, external: true },
  { icon: 'database', title: 'Zenodo archives', body: `Processed cohorts, units and all ${fmt.int(G.totalEvaluations)} predictions.`, to: ZENODO_URL, external: true },
  { icon: 'quotes', title: 'How to cite', body: 'Article, archive and software citations in one place.', to: href('/cite') },
];

export default function Closing() {
  return (
    <section aria-labelledby="closing-h" className="dotfield border-t border-line">
      <Container className="py-20 md:py-28">
        <div className="reveal overflow-hidden rounded-card border border-line bg-surface">
          <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:items-end lg:gap-14 lg:p-14">
            <div>
              <p className="label mb-4">Reuse</p>
              <h2 id="closing-h" className="balance text-4xl font-semibold leading-[1.04] tracking-[-0.035em] text-ink md:text-5xl">Rerun every table from the archived snapshots.</h2>
            </div>
            <ul className="grid gap-3 sm:grid-cols-3">
              {TILES.map((t) => (
                <li key={t.title}>
                  <a href={t.to} {...(t.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                    className="group flex h-full flex-col rounded-card border border-line bg-canvas p-5 transition-[border-color,transform] duration-150 hover:-translate-y-0.5 hover:border-line-strong focus-visible:border-accent">
                    <span className="flex items-center justify-between">
                      <Icon name={t.icon} size={20} className="text-ink-2" />
                      <Icon name={t.external ? 'arrow-up-right' : 'arrow-right'} size={14} className="text-ink-3 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-accent" />
                    </span>
                    <span className="pt-8 text-base font-semibold text-ink group-hover:text-accent">{t.title}</span>
                    <span className="mt-1 text-sm leading-relaxed text-ink-2">{t.body}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
