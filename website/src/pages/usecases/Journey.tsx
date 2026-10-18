import type { ReactNode } from 'react';
import { ROUTES, href, navigate } from '../../app/router';
import { Icon } from '../../ui';
import { KEY_PAGE, type Dest, type Persona } from './personas';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
const iconOf = (d: Dest) => ROUTES.find((r) => r.path === d.path)?.icon ?? 'file-text';

/** A link to a page, a page view (`?track=f`) or a section on a page (scrolls after the route renders). */
export function DestLink({ dest, className, children }: { dest: Dest; className?: string; children?: ReactNode }) {
  const body = children ?? (
    <>
      <Icon name={iconOf(dest)} size={14} className="shrink-0 text-ink-3 transition-colors duration-150 group-hover:text-accent" />
      <span>{dest.label}</span>
      <Icon name="arrow-right" size={12} className="shrink-0 text-ink-3 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-accent" />
    </>
  );
  const cls = cx('group inline-flex items-center gap-1.5 rounded-chip border border-line bg-surface px-2 py-1 font-mono text-xs text-ink transition-colors duration-150 hover:border-accent/40', className);
  if (dest.anchor) {
    return <button type="button" className={cls} onClick={() => navigate(dest.path, { query: dest.query, anchor: dest.anchor })}>{body}</button>;
  }
  return <a href={href(dest.path, dest.query)} className={cls}>{body}</a>;
}

/**
 * Journey map: the main route runs down a rail of numbered stops. Edge cases nest under the stop where they come
 * up, joined to the rail by a dashed connector, so no empty column opens beside stops without a branch.
 */
export function JourneyMap({ persona }: { persona: Persona }) {
  const keyIdx = persona.steps.findIndex((s) => s.dest.path === KEY_PAGE[persona.id]);
  return (
    <ol className="relative">
      {persona.steps.map((s, i) => {
        const edges = persona.edges.filter((e) => e.step === i);
        const last = i === persona.steps.length - 1;
        const isKey = i === keyIdx;
        return (
          <li key={i} className="relative grid grid-cols-[32px_minmax(0,1fr)] gap-x-4 pb-10 last:pb-0 md:gap-x-6">
            {!last && <span aria-hidden="true" className="absolute bottom-0 left-[15.5px] top-8 w-px bg-line-strong" />}
            <span className={cx('relative z-10 grid size-8 place-items-center rounded-full border bg-surface font-mono text-xs font-semibold',
              isKey ? 'border-accent text-accent ring-4 ring-accent-tint' : 'border-line-strong text-ink')}>
              {i + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <DestLink dest={s.dest} />
                {isKey && <span className="font-mono text-[11px] text-accent">Answers the main question</span>}
              </div>
              <p className="mt-2.5 text-[15px] font-medium leading-snug text-ink">{s.does}</p>
              <p className="mt-1.5 max-w-[64ch] text-sm leading-relaxed text-ink-2">{s.learns}</p>
              {edges.length > 0 && (
                <div className={cx('mt-4 grid gap-3', edges.length > 1 && 'xl:grid-cols-2')}>
                  {edges.map((e) => (
                    <div key={e.id} className="relative rounded-card border border-line bg-surface p-4">
                      <p className="flex items-start gap-2 text-sm font-medium text-ink">
                        <Icon name="git-branch" size={15} className="mt-0.5 shrink-0 text-ink-3" />
                        <span><span className="sr-only">Edge case: </span>“{e.q}”</span>
                      </p>
                      <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{e.a}</p>
                      <DestLink dest={e.dest} className="mt-3" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
