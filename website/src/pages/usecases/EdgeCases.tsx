import { cx } from '../../lib/format';
import { SectionHeader } from '../../ui/SectionHeader';
import { ChevronDown, ICON_STROKE } from '../../ui/icons';
import { Reveal } from '../../ui/motion';
import { BranchIcon, PageChip } from './parts';
import { EDGE_KEYS, PERSONAS, edgeKey } from './personas';

/* "Edge cases across all five routes": one expander per off-route question, grouped by reader. */

const TOTAL = EDGE_KEYS.length;
const INTRO = `${TOTAL} questions that pull a reader off the main route, ${TOTAL / PERSONAS.length} per reader. Select a question to read the answer; the page link goes straight to it.`;

interface Props {
  selId: string;
  open: ReadonlySet<string>;
  onToggle: (key: string) => void;
  onToggleAll: () => void;
  onOpenRoute: (id: string) => void;
}

export function EdgeCases({ selId, open, onToggle, onToggleAll, onOpenRoute }: Props) {
  const allOpen = EDGE_KEYS.every((k) => open.has(k));
  return (
    <section id="edges" aria-labelledby="edges-h" className="mx-auto box-border max-w-[1240px] px-4 pt-24 pb-28 sm:px-6 max-sm:pt-16 max-sm:pb-20">
      <SectionHeader id="edges-h" title="Edge cases across all five routes" lede={INTRO}
        actions={
          <button type="button" onClick={onToggleAll} aria-expanded={allOpen}
            className="uc-ghost inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-card border border-line bg-surface px-3 text-[13px] font-medium text-ink">
            {allOpen ? 'Close all answers' : 'Open all answers'}
            <span className="uc-chev inline-flex text-ink-3" data-open={allOpen || undefined}><ChevronDown size={14} strokeWidth={ICON_STROKE} aria-hidden="true" /></span>
          </button>
        } />

      <Reveal className="border-y border-line">
        {PERSONAS.map((p, gi) => {
          const on = p.id === selId;
          return (
            <div key={p.id} className={cx('grid grid-cols-[240px_minmax(0,1fr)] gap-x-10 gap-y-3 py-6 max-[900px]:grid-cols-1', gi > 0 && 'border-t border-line')}>
              <div className="flex items-start gap-2.5">
                <span aria-hidden="true" className={cx('mt-1.5 size-2 flex-none rounded-full', on ? 'bg-accent' : 'bg-line-strong')} />
                <div>
                  <h3 className="m-0 text-sm font-medium leading-[1.4]">{p.role}</h3>
                  <button type="button" aria-pressed={on} onClick={() => onOpenRoute(p.id)} className={cx('uc-link mt-1 min-h-7 cursor-pointer border-0 bg-transparent p-0 font-mono text-[11px]', on ? 'text-accent' : 'text-ink-2')}>
                    {on ? 'Route open above' : 'Open this route'}
                  </button>
                </div>
              </div>
              <ul className="m-0 flex list-none flex-col p-0">
                {p.edges.map((e, i) => {
                  const k = edgeKey(p, i);
                  const isOpen = open.has(k);
                  const panel = `edge-${k}`;
                  const stop = p.steps[e.step];
                  return (
                    <li key={k} className={cx(i > 0 && 'border-t border-line')}>
                      <button type="button" aria-expanded={isOpen} aria-controls={panel} onClick={() => onToggle(k)}
                        className="uc-link flex min-h-11 w-full cursor-pointer items-start gap-2.5 border-0 bg-transparent py-3 text-left text-sm leading-[1.45] text-ink">
                        <BranchIcon />
                        <span className="min-w-0 flex-1">“{e.q}”</span>
                        <span aria-hidden="true" className="uc-chev mt-0.5 inline-flex flex-none text-ink-3" data-open={isOpen || undefined}><ChevronDown size={16} strokeWidth={ICON_STROKE} /></span>
                      </button>
                      {/* Opens with grid-template-rows 0fr -> 1fr (audit P2); `inert` keeps a closed answer out of tab order and find.
                          No role="region": fifteen landmarks would swamp the landmark list. */}
                      <div id={panel} className="uc-acc" data-open={isOpen || undefined} inert={!isOpen}>
                        <div className="min-h-0 overflow-hidden">
                          <div className="pb-4 pl-[25px]">
                            <p className="m-0 max-w-[72ch] text-[13px] leading-relaxed text-ink-2">{e.a}</p>
                            <p className="mt-2.5 mb-0 flex flex-wrap items-center gap-x-3 gap-y-2">
                              <PageChip to={e.to}>{e.l}</PageChip>
                              <span className="font-mono text-[11px] text-ink-3">Comes up at stop {e.step + 1}{stop ? `, ${stop.l}` : ''}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </Reveal>
    </section>
  );
}
