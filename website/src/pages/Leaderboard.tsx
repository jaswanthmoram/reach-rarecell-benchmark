import { SectionNav } from '../ui/SectionNav';
import { Board } from './leaderboard/Board';
import { Cohorts } from './leaderboard/Cohorts';
import { Hero } from './leaderboard/Hero';
import { Omnibus, Pairwise } from './leaderboard/Stats';
import './leaderboard/leaderboard.css';

const SECTIONS = [
  { id: 'board', label: 'Board' },
  { id: 'tests', label: 'Global tests' },
  { id: 'pairwise', label: 'Pairwise' },
  { id: 'cohorts', label: 'By cohort' },
];

/** P02 Leaderboard: hero forest plot, the data-driven board, global tests, pairwise tests, per-cohort heatmap. */
export default function Leaderboard() {
  return (
    <div className="bg-canvas text-ink">
      <Hero />
      <SectionNav label="Leaderboard sections" items={SECTIONS} />
      <Board />
      <Omnibus />
      <Pairwise />
      <Cohorts />
    </div>
  );
}
