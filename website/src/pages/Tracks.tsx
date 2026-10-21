import { scrollToId, setQuery, useQuery } from '../lib/router';
import { Reveal } from '../ui/motion';
import { SectionNav } from '../ui/SectionNav';
import { CnvCheck, PaperFigures, SECTION } from './tracks/Evidence';
import { Hero } from './tracks/Hero';
import { parseLetter, type Letter } from './tracks/model';
import { TrackPanel } from './tracks/TrackPanel';
import { TrackTabs } from './tracks/TrackTabs';
import './tracks/tracks.css';

const SECTIONS = [
  { id: 'explorer', label: 'Tracks A to F' },
  { id: 'cnv', label: 'Non-circularity check' },
  { id: 'figures', label: 'Paper figures' },
];

/** Tracks (P03 board): hero lanes and tabs A to F drive one panel; the choice lives in `?track=`. */
export default function Tracks() {
  const active = parseLetter(useQuery().get('track'));
  const pick = (l: Letter) => setQuery(`track=${l.toLowerCase()}`);
  const showA = () => { pick('A'); scrollToId('explorer'); };
  return (
    <>
      <Hero active={active} onPick={pick} onShowA={showA} />
      <SectionNav label="Tracks sections" items={SECTIONS} />
      <section id="explorer" aria-labelledby="explorer-h" className={`${SECTION} pb-14 pt-8 sm:pt-10`}>
        <h2 id="explorer-h" className="sr-only">Design and result, per track</h2>
        <Reveal className="flex flex-col gap-2">
          <TrackTabs active={active} onPick={pick} />
          <TrackPanel active={active} />
        </Reveal>
      </section>
      <CnvCheck />
      <PaperFigures />
    </>
  );
}
