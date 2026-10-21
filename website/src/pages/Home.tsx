import './home/home.css';
import { SectionNav } from '../ui/SectionNav';
import { Explainer } from './home/Explainer';
import { Findings, TrackList } from './home/Findings';
import { Hero } from './home/Hero';
import { Pipeline } from './home/Pipeline';

const SECTIONS = [
  { id: 'how', label: 'How it works' },
  { id: 'findings', label: 'Findings' },
  { id: 'tracks', label: 'Tracks' },
  { id: 'run', label: 'Run it' },
];

/**
 * Overview (route `/`). The claim and its ranking first, then how the benchmark works (the explainer loop),
 * what it shows, the six tracks, and how to rerun it.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <SectionNav label="Overview sections" items={SECTIONS} />
      <Explainer />
      <Findings />
      <TrackList />
      <Pipeline />
    </>
  );
}
