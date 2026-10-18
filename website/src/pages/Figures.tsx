import { useRef, useState, type CSSProperties } from 'react';
import { Button, Container, LiveHero, type LiveLayout } from '../ui';
import { GLOBAL_STATS as G } from '../data/benchmarkData';
import { href } from '../app/router';
import { PUBLISHED } from './figures/catalog';
import { FigureCard } from './figures/FigureCard';
import { Lightbox } from './figures/Lightbox';
import { ContactSheet } from './figures/ContactSheet';

/** Published figures in article order, two per row, each keeping its index into PUBLISHED for the viewer. */
const ROWS = PUBLISHED.map((f, i) => ({ f, i })).reduce<{ f: (typeof PUBLISHED)[number]; i: number }[][]>(
  (rows, item, i) => (i % 2 === 0 ? [...rows, [item]] : [...rows.slice(0, -1), [...rows[rows.length - 1], item]]), []);

/** Panels across the six figures, read from each figure's meta ("single panel", "panels a–c"). */
const PANELS = PUBLISHED.reduce((n, f) => {
  const m = f.meta.match(/panels a–([a-z])/);
  return n + (m ? m[1].charCodeAt(0) - 96 : 1);
}, 0);

/** Radius in px of the cobalt "finding" ring LiveField draws around a signal cell at its widest. */
const RING_PX = 22;

/** Hero grid geometry (Container max width, lg padding, text max width, sheet column, md gap), mirrored from the markup. */
const MAX_W = 1240, PAD = 32, TEXT_W = 560, SHEET_W = 520, GAP = 48;

/**
 * Far field behind the hero: a slow, sparse drift of cells. Rare cells sit only in the open gap between the text and
 * the contact sheet and, where the page gutter is wide enough, in the right margin, so the finding ring never
 * crosses the sheet or the text. Phones get a lighter field with none.
 */
const FAR_FIELD: LiveLayout = (r) => {
  const wide = matchMedia('(min-width: 1024px)').matches;
  const vw = innerWidth;
  const left = (vw - Math.min(vw, MAX_W)) / 2 + PAD;
  const textCol = Math.min(vw, MAX_W) - 2 * PAD - SHEET_W - GAP;
  // Centre of the open band between the end of the text and the start of the sheet.
  const gapX = (left + Math.min(textCol, TEXT_W) / 2 + textCol / 2 + GAP / 2) / vw;
  const margin = left - PAD > RING_PX * 3;
  const signals = !wide ? [] : [
    { x: gapX, y: 0.2 + r() * 0.15, r: 2.2, signal: true },
    ...(margin ? [0.3, 0.72].map((y) => ({ x: 1 - (left - PAD) / 2 / vw, y: y + r() * 0.08, r: 2.2, signal: true })) : []),
  ];
  return [
    ...Array.from({ length: wide ? 420 : 140 }, () => ({ x: 0.3 + r() * 0.7, y: r(), r: 0.5 + r() * 0.8, vx: 0.002 + r() * 0.004 })),
    ...signals,
  ];
};

export default function Figures() {
  const [open, setOpen] = useState<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const openAt = (index: number) => (el: HTMLButtonElement) => { triggerRef.current = el; setOpen(index); };
  const close = () => setOpen(null);
  const step = (dir: number) => setOpen((i) => (i === null ? null : (i + dir + PUBLISHED.length) % PUBLISHED.length));
  const toGallery = () => document.getElementById('published')?.scrollIntoView({
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });

  return (
    <>
      <LiveHero layout={FAR_FIELD} seed={6} intensity={0.6}>
        <Container className="grid gap-8 py-8 md:grid-cols-[minmax(0,1fr)_minmax(0,520px)] md:items-center md:gap-12 md:py-10">
          <div className="rise min-w-0 max-w-[560px]">
            <p className="label mb-3">{G.journalName} · {G.year}</p>
            <h1 className="balance text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] text-ink md:text-[2.5rem]">Figures</h1>
            <p className="mt-3 max-w-[56ch] text-base leading-relaxed text-ink-2">
              The article's {PUBLISHED.length === 6 ? 'six' : PUBLISHED.length} figures, each with a short reading and the
              caption from the proof. Open any figure for a 100% view and the file.
            </p>
            <p className="mt-4 font-mono text-xs text-ink-2 tabular">
              {PUBLISHED.length} figures · {PANELS} panels · WebP at full resolution
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={toGallery} iconRight="caret-down">Browse the figures</Button>
              <Button href={href('/cite')} variant="secondary">Cite the article</Button>
            </div>
          </div>
          <ContactSheet items={PUBLISHED} onOpen={(i, el) => openAt(i)(el)} />
        </Container>
      </LiveHero>

      <section id="published" aria-label="Published figures" className="scroll-mt-20 pb-4 pt-8 md:pt-10">
        <Container className="flex flex-col gap-16 md:gap-20">
          {/* Figures pair two to a row. Each column's fr equals its figure's aspect ratio and each sheet keeps that
              aspect, so both sheets in a row come out the same height with no letterboxing. */}
          {ROWS.map((row) => (
            <div key={row[0].f.id} className="grid gap-x-10 md:grid-cols-[var(--cols)]"
              style={{ '--cols': row.map(({ f }) => `${(f.size[0] / f.size[1]).toFixed(4)}fr`).join(' ') } as CSSProperties}>
              {row.map(({ f, i }) => <FigureCard key={f.id} f={f} onOpen={openAt(i)} />)}
            </div>
          ))}
        </Container>
      </section>

      {open !== null && PUBLISHED[open] && (
        <Lightbox items={PUBLISHED} index={open} onStep={step} onClose={close} returnFocusRef={triggerRef} />
      )}
    </>
  );
}
