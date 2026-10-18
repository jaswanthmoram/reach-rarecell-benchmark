import { useState } from 'react';
import { href } from '../app/router';
import { Container, Icon } from '../ui';
import { KEY_PAGE, PAGE_COLUMNS, PERSONAS, keyDest, keyStop, type Persona } from './usecases/personas';
import { DestLink, JourneyMap } from './usecases/Journey';
import { UseCasesHero } from './usecases/Hero';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
const scrollToId = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
const visitedPages = (p: Persona) => new Set(p.steps.map((s) => s.dest.path).concat(p.edges.map((e) => e.dest.path)));
const pageLabel = (path: string) => PAGE_COLUMNS.find((c) => c.path === path)?.label ?? path;

/** `#/use-cases?p=reviewer` opens that persona. Switching writes the query back without a new history entry. */
const personaFromHash = () => {
  const p = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('p');
  return PERSONAS.some((x) => x.id === p) ? (p as string) : PERSONAS[0].id;
};

function Profile({ p }: { p: Persona }) {
  return (
    <aside className="flex flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
      <div>
        <p className="label mb-2">Goal</p>
        <p className="text-lg leading-snug tracking-[-0.01em] text-ink">{p.goal}</p>
        <p className="mt-3 text-sm leading-relaxed text-ink-2">{p.context}</p>
      </div>
      <div>
        <p className="label mb-3">Questions they bring</p>
        <ul className="flex flex-col divide-y divide-line rounded-card border border-line bg-surface">
          {p.questions.map((q) => <li key={q} className="px-4 py-3 text-sm leading-snug text-ink">{q}</li>)}
        </ul>
      </div>
      <div className="rounded-card border border-line bg-sunk p-4">
        <p className="label mb-2 flex items-center gap-2"><Icon name="check" size={13} className="text-ink-3" />Leaves with</p>
        <p className="text-sm leading-relaxed text-ink">{p.leaves}</p>
      </div>
    </aside>
  );
}

function KeyMark({ size = 'size-5' }: { size?: string }) {
  return (
    <span className={cx('relative mx-auto grid place-items-center', size)}>
      <span className="absolute inset-0 rounded-full border-[1.5px] border-accent" />
      <span className="size-2 rounded-full bg-accent" />
    </span>
  );
}

/** Persona × page dot matrix: filled = on the route, ringed = the page that answers the main question. */
function Matrix({ onPick, value }: { onPick: (id: string) => void; value: string }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-card border border-line bg-surface md:block">
        <table className="w-full table-fixed text-left text-sm">
          <caption className="sr-only">Pages each reader visits. A ringed dot marks the page that answers their main question.</caption>
          <thead className="border-b border-line">
            <tr className="h-10">
              <th scope="col" className="label w-[300px] px-4 font-normal">Reader</th>
              {PAGE_COLUMNS.map((c) => <th key={c.path} scope="col" className="label px-2 text-center font-normal">{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {PERSONAS.map((p) => {
              const visited = visitedPages(p);
              const on = p.id === value;
              return (
                <tr key={p.id} aria-current={on ? 'true' : undefined} className={cx('h-12 border-b border-line transition-colors duration-150 last:border-b-0', on ? 'bg-accent-tint' : 'hover:bg-sunk/60')}>
                  <th scope="row" className="px-4 font-normal">
                    <button type="button" onClick={() => onPick(p.id)} className={cx('flex items-center gap-2.5 text-left hover:text-accent', on ? 'font-medium text-ink' : 'text-ink')}>
                      <Icon name={p.icon} size={16} className={on ? 'text-accent' : 'text-ink-3'} />{p.role}
                    </button>
                  </th>
                  {PAGE_COLUMNS.map((c) => (
                    <td key={c.path} className="px-2 text-center">
                      {KEY_PAGE[p.id] === c.path ? <span title="Answers the main question"><KeyMark /><span className="sr-only">Key page</span></span>
                        : visited.has(c.path) ? <span className="mx-auto block size-2 rounded-full bg-ink-2"><span className="sr-only">Visited</span></span>
                        : <span className="mx-auto block h-px w-2 bg-line-strong"><span className="sr-only">Not on route</span></span>}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Phones: one row per reader, key page first, then the other pages on the route. */}
      <ul className="flex flex-col divide-y divide-line rounded-card border border-line bg-surface md:hidden">
        {PERSONAS.map((p) => {
          const others = PAGE_COLUMNS.filter((c) => c.path !== KEY_PAGE[p.id] && visitedPages(p).has(c.path));
          return (
            <li key={p.id} className={cx('px-4 py-3.5', p.id === value && 'bg-accent-tint')}>
              <button type="button" onClick={() => onPick(p.id)} className="flex w-full items-center gap-2.5 text-left text-sm font-medium text-ink">
                <Icon name={p.icon} size={16} className={p.id === value ? 'text-accent' : 'text-ink-3'} />{p.role}
              </button>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 pl-[26px] font-mono text-[11px] text-ink-2">
                <span className="flex items-center gap-1.5 text-ink"><KeyMark size="size-3.5" />{pageLabel(KEY_PAGE[p.id])}</span>
                {others.map((c) => <span key={c.path} className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-ink-2" />{c.label}</span>)}
              </p>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/** Every edge case in one index, grouped by the reader whose route raises it, with the page that answers it. */
function EdgeIndex({ value, onPick }: { value: string; onPick: (id: string) => void }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {PERSONAS.map((p) => {
        const on = p.id === value;
        return (
          <section key={p.id} aria-labelledby={`edges-${p.id}`} className="grid gap-x-10 gap-y-3 py-6 md:grid-cols-[240px_minmax(0,1fr)]">
            <div className="flex items-start gap-2.5">
              <Icon name={p.icon} size={16} className={cx('mt-0.5 shrink-0', on ? 'text-accent' : 'text-ink-3')} />
              <div>
                <h3 id={`edges-${p.id}`} className="text-sm font-medium text-ink">{p.role}</h3>
                <button type="button" onClick={() => onPick(p.id)} aria-current={on ? 'true' : undefined}
                  className={cx('mt-1 font-mono text-[11px] transition-colors duration-150', on ? 'text-accent' : 'text-ink-2 hover:text-accent')}>
                  {on ? 'Route open above' : 'Open this route'}
                </button>
              </div>
            </div>
            <ul className="flex flex-col divide-y divide-line">
              {p.edges.map((e) => (
                <li key={e.id} className="grid gap-x-6 gap-y-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <p className="flex items-start gap-2 text-sm leading-snug text-ink">
                    <Icon name="git-branch" size={15} className="mt-0.5 shrink-0 text-ink-3" />
                    <span>“{e.q}”</span>
                  </p>
                  <span className="pl-[23px] sm:pl-0"><DestLink dest={e.dest} /></span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export default function UseCases() {
  const [id, setId] = useState(personaFromHash);
  const persona = PERSONAS.find((p) => p.id === id) ?? PERSONAS[0];
  const pick = (next: string, scroll = false) => {
    setId(next);
    try { history.replaceState(null, '', href('/use-cases', `p=${next}`)); } catch { /* history blocked in some sandboxes: state still updates */ }
    if (scroll) scrollToId('journey');
  };
  const edgeCount = PERSONAS.reduce((n, p) => n + p.edges.length, 0);

  return (
    <>
      <UseCasesHero value={persona.id} onChange={(n) => pick(n)} />

      <section id="journey" aria-labelledby="journey-h" className="scroll-mt-20">
        <Container className="pb-20 pt-12 md:pb-28 md:pt-16">
          <div id="persona-panel" role="tabpanel" aria-labelledby={`persona-tab-${persona.id}`}>
            <div className="mb-10 flex flex-col gap-2 border-b border-line pb-6 md:flex-row md:items-end md:justify-between md:gap-6">
              <h2 id="journey-h" className="text-2xl font-semibold tracking-[-0.02em] text-ink md:text-4xl">{persona.role}</h2>
              <p className="flex flex-wrap gap-x-2 font-mono text-xs text-ink-2">
                <span className="whitespace-nowrap">{persona.steps.length} stops ·</span>
                <span className="whitespace-nowrap">answered at stop {keyStop(persona)}, {keyDest(persona).label} ·</span>
                <span className="whitespace-nowrap">{persona.edges.length} edge cases</span>
              </p>
            </div>
            <div className="grid gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
              <Profile p={persona} />
              <JourneyMap key={persona.id} persona={persona} />
            </div>
          </div>
        </Container>
      </section>

      <section aria-labelledby="matrix-h" className="border-y border-line bg-sunk">
        <Container className="py-14 md:py-20">
          <div className="mb-8 max-w-[68ch]">
            <h2 id="matrix-h" className="text-2xl font-semibold tracking-[-0.02em] text-ink md:text-4xl">Where each question lands</h2>
            <p className="mt-3 text-base leading-relaxed text-ink-2">The same eight pages serve all five readers. The ringed dot marks the page that answers each reader’s main question. Select a reader to open their route.</p>
          </div>
          <Matrix value={persona.id} onPick={(n) => pick(n, true)} />
          <p className="mt-3 hidden flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-2 md:flex">
            <span className="flex items-center gap-2"><KeyMark size="size-4" />Answers the main question</span>
            <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-ink-2" />On the route or an edge case</span>
            <span className="flex items-center gap-2"><span className="h-px w-2 bg-line-strong" />Not visited</span>
          </p>
        </Container>
      </section>

      <section aria-labelledby="edges-h">
        <Container className="pb-6 pt-20 md:pb-8 md:pt-28">
          <div className="mb-8 max-w-[68ch]">
            <h2 id="edges-h" className="text-2xl font-semibold tracking-[-0.02em] text-ink md:text-4xl">Edge cases across all five routes</h2>
            <p className="mt-3 text-base leading-relaxed text-ink-2">{edgeCount} questions that pull a reader off the main route{edgeCount % PERSONAS.length === 0 && `, ${edgeCount / PERSONAS.length} per reader`}. Each page link goes straight to the answer.</p>
          </div>
          <EdgeIndex value={persona.id} onPick={(n) => pick(n, true)} />
        </Container>
      </section>
    </>
  );
}
