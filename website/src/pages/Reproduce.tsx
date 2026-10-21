// Reproduce page (canvas board P07-Docs-1-HiFi and P07-Docs-2-States): shared PageHeader over a full-width
// gate band, a filterable sidebar with scroll-spy (kept over the shared SectionNav: eight sections and 25 steps
// read better as a vertical docs index), code tabs, copy buttons and the clickable phase map.
import { createContext, memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { scrollToId, setFragment, useFragmentHandler } from '../lib/router';
import { ArrowRight, ICON_STROKE } from '../ui/icons';
import { PageHeader } from '../ui/PageHeader';
import { SECTIONS, currentId, isKnownId, sectionOf } from './reproduce/content';
import { GateBand } from './reproduce/GateBand';
import { CopyCtx, usePageCopy } from './reproduce/copy';
import { FoldCtx, useFolds } from './reproduce/collapse';
import { C } from './reproduce/kit';
import { MobileBar, Rail, SideNav } from './reproduce/Nav';
import { Install, Quickstart } from './reproduce/SectionsStart';
import { AddMethod, Reproduce as ReproduceSection } from './reproduce/SectionsUse';
import { Cli, DataArchives, Layout, Troubleshooting } from './reproduce/SectionsRef';
import { Toast, type Notice } from './reproduce/Toast';
import { useScrollSpy, type ScrollSpyOptions } from '../ui/useScrollSpy';
import './reproduce/reproduce.css';

const STATUS_MS = 8000;
const TOP_ID = 'reproduce-top';
const SECTION_IDS = SECTIONS.map((s) => s.id);
const SUB_IDS = SECTIONS.flatMap((s) => s.subs.map((b) => b.id));
/**
 * Spy band: from just under the sticky chrome (header, plus the section bar below 1024 px) to 35% down. The section
 * and step in view are the last ones crossing it (the newer heading takes over at a boundary). A jump holds the spy
 * for 900 ms, and longer while its smooth scroll keeps going (up to 3 s), so the highlight does not flicker.
 */
const SPY: ScrollSpyOptions = { top: (wide) => (wide ? 96 : 160), bottomPct: 65, pick: 'last', scrollLockCapMs: 3000 };

/** True once the element has scrolled out of view (shows "Back to top" in the phone bar). */
function useScrolledPast(id: string) {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const el = document.getElementById(id);
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setPast(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, [id]);
  return past;
}

const BTN = 'inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-5 text-sm font-medium transition-[background-color,border-color,color,transform] duration-[var(--dur-1)] [transition-timing-function:var(--ease-out)] active:scale-[0.97]';

type Pick = (id: string, instant?: boolean) => void;
/** The section in view, for the gate band only: a section change re-renders the band, not the header around it. */
const BandCtx = createContext<{ lit: readonly number[]; label: string }>({ lit: [], label: '' });
function LiveBand() {
  const { lit, label } = useContext(BandCtx);
  return <GateBand lit={lit} label={label} />;
}

/** Hero and body do not depend on the section in view, so the scroll spy does not re-render them (or their code blocks). */
const Hero = memo(function Hero({ pick }: { pick: Pick }) {
  return (
    <PageHeader
      title="Run the benchmark yourself"
      lede={<>Install the package, run one method on a toy unit, then rebuild the paper&apos;s tables and figures from the snapshots in Git. Every command here is taken from <C>README.md</C>, the Makefile, Snakefile, <C>dvc.yaml</C> and the <C>rcb</C> CLI source.</>}
      actions={<>
        <button type="button" onClick={() => pick('install')} className={`${BTN} group border-0 bg-ink text-canvas [@media(hover:hover)]:hover:bg-ink/85`}>
          Install the package<ArrowRight size={15} strokeWidth={ICON_STROKE} aria-hidden="true" className="transition-transform duration-[var(--dur-1)] [@media(hover:hover)]:group-hover:translate-x-0.5" />
        </button>
        <button type="button" onClick={() => pick('reproduce-from-snapshots')} className={`${BTN} border border-line-strong bg-surface text-ink [@media(hover:hover)]:hover:border-ink-3`}>
          Rebuild the paper figures
        </button>
      </>}
      className="pb-8 lg:pb-10">
      <figure className="rise m-0 mt-4 w-full [animation-delay:240ms]">
        <LiveBand />
        <figcaption className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs leading-[1.5] text-ink-2">
          {/* Static text: a caption that rewrapped per section would shift the page above a smooth jump and stop it. */}
          <span>The twelve pipeline phases. The gates of the section you are reading light up.</span>
          <button type="button" onClick={() => pick('reproduce')}
            className="fx-underline cursor-pointer border-0 bg-transparent p-0 text-xs text-accent-ink">What each phase does</button>
        </figcaption>
      </figure>
    </PageHeader>
  );
});

const Body = memo(function Body({ pick }: { pick: Pick }) {
  return (
    <article className="min-w-0 max-w-[720px]">
      <Install />
      <Quickstart />
      <ReproduceSection onJump={pick} />
      <AddMethod />
      <DataArchives />
      <Layout />
      <Cli />
      <Troubleshooting />
    </article>
  );
});

export default function Reproduce() {
  const [query, setFilter] = useState('');
  const sectionSpy = useScrollSpy(SECTION_IDS, SPY);
  const subSpy = useScrollSpy(SUB_IDS, SPY);
  const [notice, setNotice] = useState<Notice | null>(null);
  const folds = useFolds();
  const { unfold } = folds;
  const pastHero = useScrolledPast(TOP_ID);
  const active = SECTIONS.find((s) => s.id === sectionSpy.active) ?? SECTIONS[0];
  // The step must belong to the current section; otherwise (its heading is in the band, no step yet) its first step.
  const activeSub = active.subs.some((b) => b.id === subSpy.active) ? (subSpy.active ?? active.subs[0].id) : active.subs[0].id;
  const { jumpTo: jumpSection } = sectionSpy;
  const { jumpTo: jumpSub } = subSpy;

  const onBlocked = useCallback(() => setNotice({ kind: 'alert', title: 'Could not copy the command', body: 'The browser blocked clipboard access. The text in the block is selected: copy it by hand.' }), []);
  const copyApi = usePageCopy(onBlocked);

  /** Jump to a section or step. `instant` for arrivals (deep links); a click scrolls smoothly. */
  const pick = useCallback((id: string, instant = false) => {
    const s = sectionOf(id);
    if (!s) return;
    jumpSection(s.id);
    jumpSub(s.subs.some((b) => b.id === id) ? id : s.subs[0].id);
    setFragment(id); // /reproduce/#<id> reopens this step (replaceState: no history entry per jump)
    // A folded section (phones) renders its body first; that jump is instant too, because the scroll triggers
    // re-measure right after and would cut a smooth scroll short.
    unfold(s.id, (wasFolded) => {
      if (!wasFolded && !instant) { scrollToId(id); return; }
      document.getElementById(id)?.scrollIntoView({ block: 'start' });
    });
  }, [jumpSection, jumpSub, unfold]);

  const toTop = useCallback(() => { setFragment(''); scrollToId(TOP_ID); }, []);

  // Deep link (/reproduce/#reproduce-from-snapshots; the router lands it after fonts and images settle, and rewrites
  // the old ?section=<id> to the fragment): unfold and jump. Old ids map to their slug; unknown ids say so.
  const land = useCallback((raw: string, arrival: boolean) => {
    const id = currentId(raw);
    if (!isKnownId(id)) {
      setNotice({ kind: 'status', title: 'That section does not exist', body: `No section is called “${raw.slice(0, 60)}”. Showing the start of the page.` });
      setFragment('');
      return;
    }
    requestAnimationFrame(() => pick(id, arrival));
  }, [pick]);
  useFragmentHandler('/reproduce', land);

  useEffect(() => {
    if (notice?.kind !== 'status') return;
    const t = window.setTimeout(() => setNotice(null), STATUS_MS);
    return () => window.clearTimeout(t);
  }, [notice]);

  const lit = active.gates;
  const bandLabel = `Cells streaming through the twelve pipeline gates; ${active.title} ${lit.length ? `lights phases ${lit.join(', ')}` : 'sits outside the pipeline'}`;
  const band = useMemo(() => ({ lit, label: bandLabel }), [lit, bandLabel]);

  return (
    <CopyCtx.Provider value={copyApi}>
      <FoldCtx.Provider value={folds}>
      <BandCtx.Provider value={band}>
        {/* No scroll anchoring here: on load a ScrollTrigger refresh scrolls to 0 and back, and Chrome's anchor
            then pulled a deep link about 650 px off its step. Nothing above the reader resizes on its own. */}
        <div className="[overflow-anchor:none]">
        <div id={TOP_ID}>
          <Hero pick={pick} />
        </div>

        <MobileBar query={query} onQuery={setFilter} active={active} onPick={pick} onTop={toTop} showTop={pastHero} />
        {/* The rule under the hero sits on the content edges (not the container padding), so the page has one left edge.
            Wide: 220 px filter rail, a 720 px reading column, the 184 px "On this page" rail. */}
        <div className="mx-auto max-w-[1240px] px-4 pb-24 sm:px-6">
        <div className="pt-8 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start lg:gap-x-12 lg:border-t lg:border-line lg:pt-10 xl:grid-cols-[220px_minmax(0,720px)_184px] xl:justify-between xl:gap-x-8">
          <SideNav query={query} onQuery={setFilter} active={active} onPick={pick} />

          <Body pick={pick} />

          <Rail active={active} activeSub={activeSub} onPick={pick} onTop={toTop} />
        </div>
        </div>
        </div>
        <Toast notice={notice} onClose={() => setNotice(null)} />
      </BandCtx.Provider>
      </FoldCtx.Provider>
    </CopyCtx.Provider>
  );
}
