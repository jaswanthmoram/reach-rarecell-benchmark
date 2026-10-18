import { useEffect, useState } from 'react';
import { Container } from '../ui';
import { SystemHero } from './system/Hero';
import { Brand } from './system/Brand';
import { Foundations } from './system/Foundations';
import { Icons } from './system/Icons';
import { Components } from './system/Components';
import { Rules } from './system/Rules';
import { cx } from './system/util';

const NAV = [
  { id: 'brand', label: 'Brand' },
  { id: 'colour', label: 'Colour' },
  { id: 'type', label: 'Type' },
  { id: 'space', label: 'Space and depth' },
  { id: 'motion', label: 'Motion' },
  { id: 'icons', label: 'Icons' },
  { id: 'components', label: 'Components' },
  { id: 'rules', label: 'Page rules' },
] as const;

const jump = (id: string) => document.getElementById(id)?.scrollIntoView({
  behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });

/** Highlights the section whose top most recently crossed the upper third of the viewport. */
function useActiveSection() {
  const [active, setActive] = useState<string>(NAV[0].id);
  useEffect(() => {
    const els = NAV.map((n) => document.getElementById(n.id)).filter((e): e is HTMLElement => Boolean(e));
    const io = new IntersectionObserver((entries) => {
      const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (hit) setActive(hit.target.id);
    }, { rootMargin: '-15% 0px -70% 0px' });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
  return active;
}

export default function System() {
  const active = useActiveSection();
  return (
    <>
      <SystemHero onJump={jump} />

      {/* phones and tablets: sticky jump chips */}
      <div className="sticky top-14 z-30 border-b border-line bg-canvas/90 backdrop-blur-md lg:hidden">
        <Container>
          <nav aria-label="System sections" className="-mx-4 flex gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none]">
            {NAV.map((n) => (
              <button key={n.id} type="button" onClick={() => jump(n.id)} aria-current={active === n.id ? 'true' : undefined}
                className={cx('h-8 shrink-0 rounded-full px-3 text-xs font-medium transition-colors duration-150', active === n.id ? 'bg-ink text-canvas' : 'text-ink-2 hover:bg-sunk hover:text-ink')}>
                {n.label}
              </button>
            ))}
          </nav>
        </Container>
      </div>

      <Container className="grid gap-10 pt-10 lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-14">
        <nav aria-label="System sections" className="hidden lg:block">
          <ul className="sticky top-20 flex flex-col border-l border-line">
            {NAV.map((n) => {
              const on = active === n.id;
              return (
                <li key={n.id}>
                  <button type="button" onClick={() => jump(n.id)} aria-current={on ? 'true' : undefined}
                    className={cx('relative -ml-px flex w-full items-center border-l py-1.5 pl-4 text-left text-sm transition-colors duration-150',
                      on ? 'border-ink text-ink' : 'border-transparent text-ink-2 hover:text-ink')}>
                    {n.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="min-w-0">
          <Brand />
          <Foundations />
          <Icons />
          <Components />
          <Rules />
        </div>
      </Container>
    </>
  );
}
