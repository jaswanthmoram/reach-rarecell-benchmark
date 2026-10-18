import { useState, type ReactNode } from 'react';
import { href } from '../app/router';
import { Button, Container, Stat, fmt } from '../ui';
import { G, METHOD_COUNT } from './home/facts';
import RankCard from './home/RankCard';
import FieldKey from './home/FieldKey';
import { HeroStageBand, HeroStageWide } from './home/HeroStage';
import type { Hot } from './home/CohortField';
import Findings from './home/Findings';
import TracksOverview from './home/TracksOverview';
import Pipeline from './home/Pipeline';
import Closing from './home/Closing';

function HeroText() {
  return (
    <div className="rise min-w-0 lg:col-span-6 lg:max-w-[38rem]">
      <p className="label mb-5">{G.journalName} · {G.year} · {G.version}</p>
      {/* U+2011 keeps "rare‑cell" on one line; the em cap holds the headline to three lines from lg. */}
      <h1 className="balance max-w-[14em] text-[2.125rem] font-semibold leading-[1.05] tracking-[-0.035em] text-ink sm:text-[2.625rem] lg:text-[2.5rem] xl:text-[2.875rem]">
        The top-ranked rare‑cell detector is not significantly better than counting UMIs.
      </h1>
      <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-ink-2">
        REACH scores {METHOD_COUNT} methods on {G.datasetsCount} tumour and blood cohorts, with spike-ins down to 0.01% prevalence and four-arm ground truth.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button href={href('/leaderboard')} iconRight="arrow-right">Open leaderboard</Button>
        <Button href={href('/cite')} variant="secondary" icon="quotes">How to cite</Button>
      </div>
    </div>
  );
}

/** Keeps a count and its noun together, so a narrow stat column wraps between parts, not inside one. */
const Nb = ({ children }: { children: ReactNode }) => <span className="whitespace-nowrap">{children}</span>;

/** Scale of the benchmark (every value links to its breakdown), then the key to the live field. */
function KeyFacts({ hot }: { hot: Hot }) {
  const stats = [
    { label: 'Cohorts', value: fmt.int(G.datasetsCount), context: <><Nb>{G.solidCohorts} solid</Nb> + <Nb>{G.hematologicCohorts} blood / CTC</Nb></>, to: href('/datasets') },
    { label: 'Cells', value: G.totalCells, context: 'QC-filtered', to: href('/datasets') },
    { label: 'Units', value: fmt.int(G.totalUnits), context: <><Nb>{fmt.int(G.coreUnits)} core</Nb> + <Nb>{fmt.int(G.trackFUnits)} Track F</Nb></>, to: href('/tracks') },
  ];
  return (
    <div className="flex min-w-0 flex-col gap-8 lg:col-span-5 lg:col-start-8 lg:row-start-2 lg:self-end">
      <section aria-label="Benchmark scale" className="grid grid-cols-3 gap-x-4 sm:gap-x-6">
        {/* The value steps down a size so 359,739 fits a third of the column on phones and at lg. */}
        {stats.map((s) => <Stat key={s.label} label={s.label} value={<span className="max-sm:text-2xl lg:text-[1.75rem] xl:text-3xl">{s.value}</span>} context={s.context} href={s.to} />)}
      </section>
      <FieldKey hot={hot} />
    </div>
  );
}

function Hero() {
  const [hot, setHot] = useState<Hot>(null);
  return (
    <header className="relative isolate overflow-hidden">
      <HeroStageWide hot={hot} />
      <Container className="grid gap-x-12 gap-y-8 pb-12 pt-10 md:pt-14 lg:grid-cols-12 lg:gap-y-14 lg:pb-16 lg:pt-20 xl:pt-24">
        <HeroText />
        <HeroStageBand hot={hot} />
        <div className="rise min-w-0 [animation-delay:160ms] max-lg:-mt-20 max-lg:max-w-xl lg:col-span-6 lg:row-start-2 lg:max-w-[38rem]">
          <RankCard hot={hot} onHot={setHot} />
        </div>
        <KeyFacts hot={hot} />
      </Container>
    </header>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <Findings />
      <TracksOverview />
      <Pipeline />
      <Closing />
    </>
  );
}
