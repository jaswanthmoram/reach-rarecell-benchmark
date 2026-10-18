import { useEffect, useState } from 'react';
import { FIGURES_DATA, GLOBAL_STATS as G, LEADERBOARD_DATA, TRACK_E_NOISE_CONDITIONS } from '../data/benchmarkData';
import { href } from '../app/router';
import { Button, Container, Icon, LiveHero, Section, asset, fmt } from '../ui';
import { Circularity } from './tracks/Circularity';
import { TrackPanel, TrackSelector } from './tracks/Explorer';
import { TrackLanes } from './tracks/Lanes';
import { LETTERS, TRACKS, farField, letterOf } from './tracks/model';

/** `#/tracks?track=f` deep links (Home links to Track F). */
const trackFromHash = (): string | null => {
  const q = window.location.hash.split('?')[1] ?? '';
  const t = new URLSearchParams(q).get('track')?.toUpperCase();
  return t && LETTERS.includes(t) ? t : null;
};

/* ---------- Published figures ---------- */
interface PaperFig { n: number; w: number; h: number; title: string; caption: string; alt: string }
function PaperFigure({ n, w, h, title, caption, alt }: PaperFig) {
  const src = asset(`figures/paper/fig-${n}.webp`);
  return (
    <figure className="flex flex-col overflow-hidden rounded-card border border-line bg-surface transition-colors duration-150 hover:border-line-strong">
      <div className="flex items-center justify-between gap-3 border-b border-line py-1.5 pl-4 pr-2 sm:py-2.5">
        <span className="label truncate">Paper figure {n}<span className="hidden sm:inline"> · {G.journalShort} {G.year}</span></span>
        <a href={src} target="_blank" rel="noreferrer" aria-label={`Figure ${n} at full size`}
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-chip px-2 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-2 transition-colors hover:bg-sunk hover:text-ink sm:min-h-8 sm:min-w-0">
          <span className="hidden sm:inline">Full size</span><Icon name="arrows-out-simple" size={13} />
        </a>
      </div>
      {/* Evidence sheet: stays #fafafa in both themes (DESIGN v2.1). The whole sheet opens the full-size file. */}
      <a href={src} target="_blank" rel="noreferrer" aria-label={`Open Figure ${n} at full size`}
        className="group relative block aspect-[4/3] overflow-hidden bg-[#fafafa] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent">
        <img src={src} alt={alt} width={w} height={h} loading="lazy" decoding="async"
          className="absolute inset-4 size-[calc(100%-2rem)] object-contain transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.015] motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
      </a>
      <figcaption className="flex flex-1 flex-col gap-1.5 border-t border-line p-4">
        <span className="text-sm font-semibold text-ink">{title}</span>
        <span className="text-sm leading-relaxed text-ink-2">{caption}</span>
      </figcaption>
    </figure>
  );
}

/* ---------- Page ---------- */
export default function Tracks() {
  const [active, setActive] = useState<string>(() => trackFromHash() ?? 'A');
  const track = TRACKS.find((t) => letterOf(t) === active) ?? TRACKS[0];

  useEffect(() => {
    const sync = () => { const t = trackFromHash(); if (t) setActive(t); };
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const select = (l: string) => {
    setActive(l);
    // replaceState, not navigate(): switching tabs should not stack history entries.
    window.history.replaceState(null, '', href('/tracks', `track=${l.toLowerCase()}`));
  };

  const f2 = FIGURES_DATA.find((f) => f.figNum === 'Figure 2');
  const hvg = LEADERBOARD_DATA.find((m) => m.id === 'hvg_logreg');
  const unsupFPR = LEADERBOARD_DATA.filter((m) => m.id !== 'hvg_logreg').map((m) => m.nullFPRate);
  const clean = TRACK_E_NOISE_CONDITIONS.find((c) => c.code === 'clean');

  return (
    <>
      {/* Live hero: a slow far field (shared LiveHero) behind six live lanes; the selected track focuses its lane. */}
      <LiveHero layout={farField} seed={11} intensity={0.6}>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-[5] bg-canvas/75 md:hidden" />
        <Container className="grid gap-6 py-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:items-center md:gap-10 md:py-7">
          <div className="rise min-w-0 max-w-[560px]">
            <p className="label mb-3">{G.tracksCount} tracks · {fmt.int(G.totalUnits)} units per method</p>
            <h1 className="balance text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] text-ink md:text-[2.5rem]">Track A ranks. Tracks B to F stress-test it.</h1>
            <p className="mt-3 max-w-[54ch] text-base leading-relaxed text-ink-2">Real spike-ins, then synthetic, null, blood, noisy-label and same-lineage units. Pick a lane to see how each one behaves.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" href={href('/leaderboard')} iconRight="arrow-right">Track A leaderboard</Button>
            </div>
          </div>
          <TrackLanes active={active} onSelect={select} />
        </Container>
      </LiveHero>

      <section id="explorer" aria-labelledby="explorer-h" className="scroll-mt-16 pb-12 pt-5 md:pb-20 md:pt-6">
        <Container>
          <h2 id="explorer-h" className="sr-only">Design and result, per track</h2>
          {/* Tabs joined to a full-width panel: the charts need the width. */}
          <div className="flex flex-col gap-2">
            <TrackSelector active={active} onSelect={select} />
            <TrackPanel key={track.id} t={track} />
          </div>
        </Container>
      </section>

      <Section id="circularity" label="Non-circularity check" className="border-t border-line"
        title="Do CNV-based labels favour CNV-sensitive methods?"
        lead="Ground-truth labels combine four evidence arms, one of them copy-number (infercnvpy). To test for circularity, labels were rebuilt from the three non-CNV arms and every method re-scored.">
        <Circularity />
      </Section>

      <Section id="figures" className="border-t border-line"
        title="The tracks in the paper"
        lead={`Figures 2 and 5 from the ${G.journalShort} article.`}>
        <div className="grid gap-6 lg:grid-cols-2">
          <PaperFigure n={2} w={1647} h={1179}
            title="Design of the six evaluation tracks"
            caption={f2?.description ?? ''}
            alt="Published Figure 2: unit construction for Tracks A to F, with datasets, prevalence tiers and replicate counts per track." />
          <PaperFigure n={5} w={1386} h={1254}
            title="Track A vs B, label noise, null controls and calibration"
            caption={`Track A and Track B rank agreement (ρ = ${G.trackABSpearmanRho.toFixed(3)}, p = ${G.trackABSpearmanP}); Track E label noise for the supervised ceiling (clean mean AP ${fmt.ap(clean?.meanAP ?? 0)}); Track C null false-positive rates (hvg_logreg ${hvg?.nullFPRate.toFixed(3)}, all other methods ${Math.min(...unsupFPR).toFixed(4)}–${Math.max(...unsupFPR).toFixed(4)}); score calibration.`}
            alt="Published Figure 5: Track A versus Track B rank comparison, Track E label-noise robustness, Track C null false-positive rates per method, and calibration curves." />
        </div>
      </Section>
    </>
  );
}
