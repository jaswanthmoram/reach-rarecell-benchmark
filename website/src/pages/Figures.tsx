import { useEffect, useRef, useState } from 'react';
import { asset } from '../lib/format';
import { href, scrollToId } from '../lib/router';
import { PageHeader } from '../ui/PageHeader';
import { SectionNav } from '../ui/SectionNav';
import { ChevronDown, FileText, ICON_STROKE } from '../ui/icons';
import { Reveal } from '../ui/motion';
import { FIGURES, PANEL_TOTAL, figId } from './figures/catalog';
import { ContactSheet, Field } from './figures/ContactSheet';
import { FigureCard } from './figures/FigureCard';
import { FigureViewer } from './figures/FigureViewer';
import { cardImage, jumpTo, morph } from './figures/morph';
import './figures/figures.css';

const NAV = FIGURES.map((f) => ({ id: figId(f), label: `Fig. ${f.n} ${f.short}` }));
const ARTICLE_PDF = asset('manuscript/reach-fbinf-2026-1878538.pdf');
const BTN = 'fig-press inline-flex h-11 cursor-pointer items-center gap-2 rounded-chip px-4 text-sm font-medium no-underline transition-colors duration-[var(--dur-1)]';

/** P06 Figures: contact-sheet hero, a section bar over the six published figures, and the figure viewer. */
export default function Figures() {
  const [open, setOpen] = useState<number | null>(null);
  const [morphing, setMorphing] = useState(false);
  const opener = useRef<HTMLElement | null>(null);

  // Focus goes back to the control that opened the viewer. It is passed in from the click, because Safari and
  // macOS Firefox do not focus a button on mouse click (activeElement is <body> there).
  const openAt = (k: number, from: HTMLElement) => {
    opener.current = from;
    const card = cardImage(figId(FIGURES[k]));
    morph((via) => { setMorphing(via); setOpen(k); }, card, 'open');
  };
  const close = () => {
    const card = open === null ? null : cardImage(figId(FIGURES[open]));
    morph(() => { setOpen(null); setMorphing(false); }, card, 'close');
  };
  // Restore after the viewer has unmounted (its focus guard is gone by then), whether or not the close morphed.
  useEffect(() => {
    if (open !== null) return;
    opener.current?.focus({ preventScroll: true });
    opener.current = null;
  }, [open]);
  const step = (dir: 1 | -1) => setOpen((o) => (o === null ? o : (o + dir + FIGURES.length) % FIGURES.length));

  return (
    <div className="bg-canvas text-ink">
      <div className="relative overflow-hidden border-b border-line">
        <Field />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,var(--canvas)_0%,color-mix(in_srgb,var(--canvas)_90%,transparent)_42%,transparent_78%)] max-lg:bg-[linear-gradient(180deg,var(--canvas)_0%,color-mix(in_srgb,var(--canvas)_88%,transparent)_45%,transparent_100%)]" />
        <PageHeader
          className="relative"
          eyebrow="Frontiers in Bioinformatics · 2026"
          title="Figures"
          lede="The six figures from the article, captioned from the proof. Pick one on the contact sheet to jump to it, or open any figure for the full caption, a 100% view and the file."
          actions={
            <>
              <button type="button" onClick={() => scrollToId(NAV[0].id)} className={`${BTN} border-0 bg-ink text-canvas`}>
                Browse the figures <ChevronDown size={16} strokeWidth={ICON_STROKE} aria-hidden="true" />
              </button>
              <a href={href('/cite')} className={`${BTN} border border-line-strong bg-surface text-ink hover:border-ink-3 hover:text-ink`}>Cite the article</a>
            </>
          }
          art={<ContactSheet onPick={(k) => { void jumpTo(figId(FIGURES[k])); }} paused={open !== null} />}
        >
          <p className="rise m-0 flex flex-wrap items-center gap-x-4 gap-y-2 [animation-delay:220ms]">
            <span className="font-mono text-xs text-ink-2">{FIGURES.length} figures · {PANEL_TOTAL} panels · WebP at full resolution</span>
            <a href={ARTICLE_PDF} target="_blank" rel="noopener noreferrer" className="fx-underline inline-flex items-center gap-1.5 text-sm font-medium text-ink">
              <FileText size={15} strokeWidth={ICON_STROKE} aria-hidden="true" /> Open the full article (PDF)
            </a>
          </p>
        </PageHeader>
      </div>

      <SectionNav label="Figures" items={NAV} />

      <section aria-label="Published figures" className="mx-auto max-w-[1240px] px-4 pt-10 pb-20 sm:px-6 sm:pt-14 sm:pb-28">
        <Reveal variant="mask" className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-x-10 gap-y-16">
          {FIGURES.map((f, k) => <FigureCard key={f.n} f={f} onOpen={(from) => openAt(k, from)} />)}
        </Reveal>
      </section>

      {open !== null && <FigureViewer index={open} onStep={step} onClose={close} morphing={morphing} />}
    </div>
  );
}
