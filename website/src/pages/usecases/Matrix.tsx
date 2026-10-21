import { cx } from '../../lib/format';
import { href } from '../../lib/router';
import { SectionHeader } from '../../ui/SectionHeader';
import { Reveal } from '../../ui/motion';
import { KeyDot } from './parts';
import { COLS, PERSONAS, labelOf, pagesOf } from './personas';

/* "Where each question lands": readers by pages. A scrolling grid from 640 px up; a stacked list on phones (States board, 390 px). */

/** Reader names take the left third; the eight page columns are centred over the right two thirds (DESIGN-r9). */
const GRID = 'grid grid-cols-[33.333%_repeat(8,minmax(0,1fr))] items-center';
const VISITS = PERSONAS.map((p) => pagesOf(p));

function Legend() {
  return (
    <p className="mt-3 mb-0 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-2">
      <span className="inline-flex items-center gap-2"><KeyDot size={14} />Answers the main question</span>
      <span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-full bg-ink-2" />On the route or an edge case</span>
      <span className="inline-flex items-center gap-2"><span className="h-px w-2.5 bg-line-strong" />Not visited</span>
    </p>
  );
}

export function Matrix({ selId, onPick }: { selId: string; onPick: (id: string) => void }) {
  return (
    <section id="landing" aria-labelledby="landing-h" className="border-y border-line bg-sunk">
      <div className="mx-auto box-border max-w-[1240px] px-4 py-[72px] sm:px-6 max-sm:py-14">
        <SectionHeader id="landing-h" title="Where each question lands"
          lede="The same eight pages serve all five readers. The ringed dot marks the page that answers each reader’s main question. Select a reader to open their route above." />

        <Reveal>
        <div className="card overflow-x-auto max-sm:hidden">
          <div className="min-w-[760px]" role="table" aria-label="Pages each reader visits">
            <div role="row" className={cx(GRID, 'h-10 border-b border-line font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3')}>
              <span role="columnheader" className="px-4">Reader</span>
              {COLS.map((c) => (
                <span key={c.path} role="columnheader" className="text-center">
                  <a href={href(c.path)} className="uc-link text-ink-3 no-underline">{c.label}</a>
                </span>
              ))}
            </div>
            {PERSONAS.map((p, i) => {
              const on = p.id === selId;
              return (
                <div key={p.id} role="row" className={cx(GRID, 'h-12', i > 0 && 'border-t border-line', on ? 'bg-accent-tint' : 'bg-surface')}>
                  <span role="rowheader">
                    <button type="button" aria-pressed={on} onClick={() => onPick(p.id)} className={cx('uc-link flex min-h-11 w-full cursor-pointer items-center gap-2.5 border-0 bg-transparent px-4 text-left text-sm text-ink', on ? 'font-medium' : 'font-normal')}>
                      <span aria-hidden="true" className={cx('size-2 flex-none rounded-full', on ? 'bg-accent' : 'bg-line-strong')} />{p.role}
                    </button>
                  </span>
                  {COLS.map((c) => {
                    const key = p.key === c.path;
                    const hit = !key && VISITS[i].has(c.path);
                    const state = key ? 'answers the main question' : hit ? 'on the route' : 'not visited';
                    return (
                      <span key={c.path} role="cell" title={`${c.label}: ${state}`} className="grid place-items-center">
                        <span className="sr-only">{`${c.label}: ${state}`}</span>
                        {key ? <KeyDot /> : hit ? <span aria-hidden="true" className="size-2.5 rounded-full bg-ink-2" /> : <span aria-hidden="true" className="h-px w-2.5 bg-line-strong" />}
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        <ul className="card m-0 list-none p-0 sm:hidden" aria-label="Pages each reader visits">
          {PERSONAS.map((p, i) => {
            const on = p.id === selId;
            const others = COLS.filter((c) => c.path !== p.key && VISITS[i].has(c.path)).map((c) => c.label).join(' · ');
            return (
              <li key={p.id} className={cx(i > 0 && 'border-t border-line')}>
                <button type="button" aria-pressed={on} onClick={() => onPick(p.id)} className={cx('block w-full cursor-pointer border-0 px-3 py-2.5 text-left text-ink', on ? 'bg-accent-tint' : 'bg-transparent')}>
                  <span className="block text-[13px] font-medium">{p.role}</span>
                  <span className="mt-1 flex items-center gap-1.5 font-mono text-[11px] leading-normal text-accent-ink"><KeyDot size={12} />{labelOf(p.key)}</span>
                  {others && <span className="mt-0.5 block pl-[18px] font-mono text-[11px] leading-normal text-ink-2">{others}</span>}
                </button>
              </li>
            );
          })}
        </ul>
        </Reveal>

        <Legend />
      </div>
    </section>
  );
}
