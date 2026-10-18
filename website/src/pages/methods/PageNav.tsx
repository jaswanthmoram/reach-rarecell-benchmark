import { Container } from '../../ui';
import { PAGE_SECTIONS, scrollTo } from './shared';
import type { SectionId } from './useActiveSection';

/** Below 1600px: a sticky row of section chips under the site header; scrolls inside itself on phones. */
export function JumpBar({ active }: { active: SectionId }) {
  return (
    <div data-jumpbar className="sticky top-14 z-30 border-b border-line bg-canvas/90 backdrop-blur-md min-[1600px]:hidden">
      <Container>
        <nav aria-label="Sections on this page" className="-mx-4 flex gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none] sm:mx-0 sm:px-0">
          {PAGE_SECTIONS.map((s) => {
            const on = active === s.id;
            return (
              <button key={s.id} type="button" onClick={() => scrollTo(s.id)} aria-current={on ? 'location' : undefined}
                className={`inline-flex h-9 shrink-0 items-center rounded-full px-3 text-xs font-medium transition-colors duration-150 ${on ? 'bg-ink text-canvas' : 'text-ink-2 hover:bg-sunk hover:text-ink'}`}>
                {s.label}
              </button>
            );
          })}
        </nav>
      </Container>
    </div>
  );
}

/** From 1600px: a sticky "On this page" rail beside the sections. */
export function Rail({ active }: { active: SectionId }) {
  return (
    <nav aria-label="On this page" className="sticky top-20 pt-10">
      <p className="label mb-3 pl-4">On this page</p>
      <ol className="flex flex-col border-l border-line">
        {PAGE_SECTIONS.map((s) => {
          const on = active === s.id;
          return (
            <li key={s.id}>
              <button type="button" onClick={() => scrollTo(s.id)} aria-current={on ? 'location' : undefined}
                className={`relative -ml-px flex min-h-9 w-full items-center border-l py-1.5 pl-4 text-left text-sm transition-colors duration-150 ${on ? 'border-ink font-medium text-ink' : 'border-transparent text-ink-2 hover:border-line-strong hover:text-ink'}`}>
                {s.label}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
