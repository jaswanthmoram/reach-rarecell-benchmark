import { useState } from 'react';
import { href } from '../../app/router';
import { Badge, Button, Container, Icon, Skeleton, ThemedArt, fmt } from '../../ui';
import { G, TRACKS, trackLink } from './facts';

/** Vertical centre of each lane in tracks-lanes-*.webp (1344×752), top to bottom = Tracks A to F. */
const LANE_Y = ['8%', '24%', '40%', '56%', '72%', '90%'];

export default function TracksOverview() {
  const [active, setActive] = useState<string | null>(null);
  return (
    <section id="tracks-overview" aria-labelledby="tracks-overview-h" className="border-t border-line py-20 md:py-28">
      <Container>
        <div className="reveal mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-[62ch]">
            <p className="label mb-3">Tracks · {G.tracksCount}</p>
            <h2 id="tracks-overview-h" className="text-3xl font-semibold tracking-[-0.025em] text-ink md:text-[2.75rem] md:leading-[1.08]">Six tracks, one question each</h2>
            <p className="mt-4 text-base leading-relaxed text-ink-2 md:text-lg">
              Track A is the ranked endpoint. The other five test whether a Track A score survives simulation, empty samples, natural blood, noisy labels and same-lineage contrast.
            </p>
          </div>
          <Button href={href('/tracks')} variant="secondary" iconRight="arrow-right" className="self-start md:self-auto">All tracks</Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-14">
          <figure className="reveal relative overflow-hidden rounded-card border border-line bg-canvas">
            {/* Lazy art: the branded skeleton holds the frame until the opaque image paints over it. */}
            <Skeleton className="absolute inset-0 rounded-none" />
            <ThemedArt base="images/tracks-lanes" size={[1344, 752]} alt="Six horizontal lanes of dots, one per track, with a few rare cells marked in each lane"
              className="relative aspect-[1344/752] h-auto w-full object-cover" />
            <ol aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-2 sm:left-3">
              {TRACKS.map((t, i) => (
                <li key={t.id} className="absolute -translate-y-1/2" style={{ top: LANE_Y[i] }}>
                  <span className={`grid size-6 place-items-center rounded-chip border bg-surface font-mono text-xs font-semibold text-ink transition-[transform,border-color] duration-150 ${active === t.letter ? 'scale-110 border-accent text-accent' : 'border-line-strong'}`}>
                    {t.letter}
                  </span>
                </li>
              ))}
            </ol>
          </figure>

          <ul className="reveal border-t border-line">
            {TRACKS.map((t) => {
              const on = active === t.letter;
              return (
                <li key={t.id} className="border-b border-line">
                  <a href={trackLink(t.letter)}
                    onMouseEnter={() => setActive(t.letter)} onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(t.letter)} onBlur={() => setActive(null)}
                    className="group grid min-h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-1 py-3 transition-colors duration-150 hover:bg-sunk/70 focus-visible:bg-sunk/70">
                    <span className={`grid size-6 place-items-center rounded-chip border font-mono text-xs font-semibold transition-colors duration-150 ${on ? 'border-accent text-accent' : 'border-line-strong text-ink'} bg-surface`}>{t.letter}</span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-ink group-hover:text-accent">{t.name}</span>
                        {t.letter === 'A' && <Badge tone="accent">ranked</Badge>}
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-2">{t.roleBadge}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-right font-mono text-sm text-ink tabular">{fmt.int(t.units)}<span className="ml-1 text-xs text-ink-3">units</span></span>
                      <Icon name="arrow-right" size={14} className="text-ink-3 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-accent" />
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </Container>
    </section>
  );
}
