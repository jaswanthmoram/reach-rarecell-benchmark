import { useEffect, useRef } from 'react';
import { Container, useToast } from '../ui';
import { ENTRIES, ENTRY_IDS, goToSection, isDocsId, sectionFromHash, titleOf, type EntryId } from './docs/nav';
import { GateBand } from './docs/GateBand';
import { SECTION_PHASES } from './docs/phases';
import { useActiveId } from './docs/useActiveId';
import { MobileJump, Rail, Sidebar } from './docs/shell';
import { Install, Quickstart, Reproduce } from './docs/SectionsStart';
import { AddMethod, CliRef, DataArchives, Faq, Layout } from './docs/SectionsExtend';

const SUB_IDS = ENTRIES.flatMap((e) => e.subs.map((s) => s.id));

/**
 * Docs is a working surface, not a landing page: no marketing hero. The title row carries the page's one live
 * element, a compact band of cells streaming through the twelve pipeline gates; the gates of the section in view
 * light up as the reader scrolls (scroll-spy below, never scroll-jacked). The first install command stays in the
 * first viewport at 1440 and 390.
 */
function TitleRow({ active }: { active: EntryId }) {
  const { gates, note } = SECTION_PHASES[active];
  return (
    <header className="rise max-w-[68ch] pt-7">
      <h1 className="text-[2rem] font-semibold leading-[1.15] tracking-[-0.03em] text-ink">Run the benchmark yourself</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-2">
        Commands are taken from <span className="font-mono text-[0.92em]">README.md</span>, the Makefile, Snakefile, <span className="font-mono text-[0.92em]">dvc.yaml</span> and the <span className="font-mono text-[0.92em]">rcb</span> CLI source.
      </p>
      <figure className="mt-5">
        <GateBand gates={gates} />
        <figcaption className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 text-xs text-ink-2">
          <span><span className="label mr-2">Pipeline phases</span>{titleOf(active)}: {note}</span>
          <button type="button" onClick={() => goToSection('reproduce')}
            className="text-accent underline decoration-accent/30 underline-offset-2 transition-colors duration-150 hover:decoration-accent">All twelve phases</button>
        </figcaption>
      </figure>
    </header>
  );
}

/**
 * Deep links: `#/docs?section=<id>` (copied from a heading) scrolls to that section once the page renders.
 * Other pages use `navigate('/docs', { anchor })`, which the router handles. An unknown id says so.
 */
function useDeepLink() {
  const toast = useToast();
  const handled = useRef(false);
  useEffect(() => {
    const id = sectionFromHash();
    if (!id || handled.current) return;
    handled.current = true;
    if (isDocsId(id)) { goToSection(id); return; }
    toast({ title: 'That docs section does not exist', description: `No section is called “${id}”. Showing the start of the docs.` });
  }, [toast]);
}

export default function Docs() {
  useDeepLink();
  const active = useActiveId(ENTRY_IDS, ENTRY_IDS[0]) as EntryId;
  const activeSub = useActiveId(SUB_IDS, SUB_IDS[0]);
  const entry = ENTRIES.find((e) => e.id === active) ?? ENTRIES[0];

  return (
    <Container className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[220px_minmax(0,1fr)_208px]">
      <div className="hidden pt-8 lg:block">
        <Sidebar active={active} />
      </div>
      <div className="min-w-0">
        <TitleRow active={active} />
        <MobileJump active={active} />
        <article className="min-w-0 max-w-[68ch]">
          <Install />
          <Quickstart />
          <Reproduce />
          <AddMethod />
          <DataArchives />
          <Layout />
          <CliRef />
          <Faq />
        </article>
      </div>
      <div className="hidden pt-8 xl:block">
        <Rail entry={entry} activeSub={entry.subs.some((s) => s.id === activeSub) ? activeSub : entry.subs[0].id} />
      </div>
    </Container>
  );
}
