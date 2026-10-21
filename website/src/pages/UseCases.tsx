import { useState } from 'react';
import { scrollToId, setQuery, useQuery } from '../lib/router';
import { SectionNav } from '../ui/SectionNav';
import { ScrollTrigger } from '../ui/motion';
import { EdgeCases } from './usecases/EdgeCases';
import { Hero } from './usecases/Hero';
import { Matrix } from './usecases/Matrix';
import { Route } from './usecases/Route';
import { EDGE_KEYS, personaOf } from './usecases/personas';
import './usecases/usecases.css';

/** The route swap changes the page height, and the ScrollTrigger refresh that follows would cut a smooth scroll short. */
const NO_REFRESH_MS = 320;

/** Scroll to the route once the new route has been measured (after that refresh, or a short wait when none comes). */
function scrollToRoute() {
  let done = false;
  const go = () => {
    if (done) return;
    done = true;
    ScrollTrigger.removeEventListener('refresh', go);
    requestAnimationFrame(() => scrollToId('journey'));
  };
  ScrollTrigger.addEventListener('refresh', go);
  window.setTimeout(go, NO_REFRESH_MS);
}

const NAV = [
  { id: 'journey', label: 'Route' },
  { id: 'landing', label: 'Where each question lands' },
  { id: 'edges', label: 'Edge cases' },
];

/** Use cases (canvas board P10): five readers, the route each takes, and the edge cases that pull them off it. `?p=` holds the reader. */
export default function UseCases() {
  // An unknown or missing ?p= opens the first reader without an error (States board).
  const persona = personaOf(useQuery().get('p'));
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set());

  const pick = (id: string) => setQuery(`p=${encodeURIComponent(id)}`);
  const toggle = (key: string) => setOpen((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
  const toggleAll = () => setOpen((prev) => (EDGE_KEYS.every((k) => prev.has(k)) ? new Set() : new Set(EDGE_KEYS)));
  const openRoute = (id: string) => { pick(id); scrollToRoute(); };

  return (
    <div className="bg-canvas text-ink">
      <Hero selId={persona.id} onPick={pick} />
      <SectionNav label="Use cases sections" items={NAV} />
      <Route p={persona} />
      <Matrix selId={persona.id} onPick={pick} />
      <EdgeCases selId={persona.id} open={open} onToggle={toggle} onToggleAll={toggleAll} onOpenRoute={openRoute} />
    </div>
  );
}
