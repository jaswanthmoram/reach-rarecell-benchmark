// Page-local prose primitives for the Reproduce reading column (board classes .cb, .c, .p, .tw, .callout, .q).
import { useContext, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import { scrollToId } from '../../lib/router';
import { cx } from '../../lib/format';
import { Check, ChevronDown, Copy, ICON_STROKE } from '../../ui/icons';
import { SectionHeader } from '../../ui/SectionHeader';
import { useReveal } from '../../ui/motion';
import { GROUPS, SECTIONS, sectionOf, type TabSet } from './content';
import { CopyCtx } from './copy';
import { FoldCtx } from './collapse';

function CopyButton({ id, text, pre }: { id: string; text: string; pre: RefObject<HTMLPreElement | null> }) {
  const { copied, copy } = useContext(CopyCtx);
  const done = copied === id;
  const Icon = done ? Check : Copy;
  return (
    <button type="button" onClick={() => copy(id, text, pre.current)}
      className={cx('inline-flex min-h-8 min-w-[84px] shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-chip border-0 bg-transparent px-2.5 text-xs font-medium transition-colors duration-[var(--dur-1)] hover:bg-line hover:text-ink active:bg-line-strong active:text-ink active:duration-0',
        done ? 'text-ok' : 'text-ink-2')}>
      <Icon size={13} strokeWidth={ICON_STROKE} aria-hidden="true" />
      <span aria-live="polite">{done ? 'Copied' : 'Copy'}</span>
    </button>
  );
}

/** Code is a flat plate (--elev-0): a 1px border and no lift, so it never reads as a clickable card. */
const BOX = 'mt-4 overflow-hidden rounded-card border border-line bg-sunk shadow-[var(--elev-0)]';
const BAR = 'flex items-center justify-between gap-2 border-b border-line py-1 pl-3 pr-1.5';
const TITLE = 'font-mono text-[11px] uppercase tracking-[0.08em] text-ink-3 [overflow-wrap:anywhere]';
/* Lines never soft-wrap (a wrapped `-> pd.Series:` reads as a new line); long ones scroll sideways. */
const PRE = 'm-0 overflow-x-auto whitespace-pre p-4 font-mono text-[13px] leading-[1.7] text-ink [scrollbar-width:thin] [tab-size:4] max-sm:p-3.5 max-sm:text-[12.5px]';

export function CodeBlock({ id, code, title = 'terminal' }: { id: string; code: string; title?: string }) {
  const pre = useRef<HTMLPreElement>(null);
  return (
    <div className={BOX}>
      <div className={BAR}><span className={TITLE}>{title}</span><CopyButton id={id} text={code} pre={pre} /></div>
      {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable code region must be reachable by keyboard */}
      <pre ref={pre} tabIndex={0} role="region" aria-label={`${title} code`} className={PRE}>{code}</pre>
    </div>
  );
}

/** Code block with a pill tablist (arrow keys, Home and End move between tabs). */
export function TabbedCode({ id, set }: { id: string; set: TabSet }) {
  const [value, onChange] = useState(set.tabs[0].value);
  const base = useId();
  const pre = useRef<HTMLPreElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const idx = Math.max(0, set.tabs.findIndex((t) => t.value === value));
  const cur = set.tabs[idx];
  const onKey = (e: KeyboardEvent) => {
    const last = set.tabs.length - 1;
    const next = e.key === 'ArrowRight' ? (idx === last ? 0 : idx + 1) : e.key === 'ArrowLeft' ? (idx === 0 ? last : idx - 1) : e.key === 'Home' ? 0 : e.key === 'End' ? last : -1;
    if (next < 0) return;
    e.preventDefault();
    onChange(set.tabs[next].value);
    tabRefs.current[next]?.focus();
  };
  return (
    <>
      <div className={BOX}>
        <div className={cx(BAR, 'flex-wrap p-1.5')}>
          <div role="tablist" aria-label={set.label} onKeyDown={onKey} className="inline-flex flex-wrap gap-1 rounded-full border border-line bg-surface p-1">
            {set.tabs.map((t, i) => {
              const on = i === idx;
              return (
                <button key={t.value} ref={(el) => { tabRefs.current[i] = el; }} type="button" role="tab" id={`${base}-t${i}`} aria-selected={on} aria-controls={`${base}-p`} tabIndex={on ? 0 : -1}
                  onClick={() => onChange(t.value)}
                  className={cx('min-h-8 cursor-pointer rounded-full border-0 px-3 text-xs font-medium transition-colors duration-150', on ? 'bg-ink text-canvas' : 'bg-transparent text-ink-2 hover:bg-sunk hover:text-ink')}>{t.label}</button>
              );
            })}
          </div>
          <span className="ml-auto flex items-center gap-2"><span className={TITLE}>{cur.title}</span><CopyButton id={`${id}-${cur.value}`} text={cur.code} pre={pre} /></span>
        </div>
        <pre ref={pre} role="tabpanel" id={`${base}-p`} aria-labelledby={`${base}-t${idx}`} tabIndex={0} className={PRE}>{cur.code}</pre>
      </div>
      {cur.note && <P className="text-sm">{cur.note}</P>}
      {cur.rows && (
        <Table caption={cur.rowsCaption} head={[cur.rowsHead ?? '', 'Runs']} nowrap={[0]}
          rows={cur.rows.map((r) => [<C key="a">{r.a}</C>, <span key="b"><C>{r.b}</C>{r.archives && <> <Need archives /></>}</span>])} />
      )}
    </>
  );
}

/* ---------- Prose ---------- */
export function C({ children }: { children: ReactNode }) {
  return <code className="rounded-chip border border-line bg-sunk px-1 font-mono text-[0.86em] [overflow-wrap:anywhere]">{children}</code>;
}

export function P({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx('mb-0 mt-3 max-w-[68ch] text-base leading-[1.6] text-ink-2', className)}>{children}</p>;
}

const INLINE = 'cursor-pointer text-accent underline decoration-accent/30 underline-offset-2 transition-[text-decoration-color] duration-150 hover:decoration-accent';

export function Ext({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className={INLINE}>{children}<span className="sr-only"> (opens in a new tab)</span></a>;
}

/** In-page jump: a real button; the page's pick() records the section in the URL fragment. */
export function Jump({ to, children, className, onJump }: { to: string; children: ReactNode; className?: string; onJump?: (id: string) => void }) {
  return (
    // With onJump the page's pick() scrolls (and unfolds); calling scrollToId as well would scroll twice.
    <button type="button" onClick={() => { if (onJump) onJump(to); else scrollToId(to); }}
      className={cx(INLINE, 'border-0 bg-transparent p-0 text-left font-[inherit] text-[length:inherit]', className)}>{children}</button>
  );
}

export function Need({ archives = false }: { archives?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs">
      <i aria-hidden="true" className={cx('size-2 rounded-full border', archives ? 'border-signal bg-signal' : 'border-ink-3 bg-surface')} />
      {archives ? 'Zenodo archives' : 'Git only'}
    </span>
  );
}

export function Callout({ title, warn = false, children }: { title: string; warn?: boolean; children: ReactNode }) {
  return (
    <aside aria-label={title} className={cx('mt-4 rounded-chip border border-l-[3px] border-line bg-surface px-4 py-3 text-sm leading-[1.6] text-ink-2', warn ? 'border-l-signal' : 'border-l-accent')}>
      <b className="mb-0.5 block font-medium text-ink">{title}</b>{children}
    </aside>
  );
}

/* ---------- Tables ---------- */
export type Cell = ReactNode;
export function Table({ caption, head, rows, nowrap = [] }: { caption?: string; head: string[]; rows: Cell[][]; nowrap?: number[] }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-card border border-line bg-surface">
      <table className="w-full border-collapse text-sm leading-[1.5]">
        {caption && <caption className="border-b border-line px-3 py-2.5 text-left font-mono text-[11px] uppercase tracking-[0.08em] text-ink-3 [caption-side:top]">{caption}</caption>}
        <thead><tr>{head.map((h) => <th key={h} scope="col" className="whitespace-nowrap border-b border-line px-3 py-2 text-left text-xs font-medium text-ink-3">{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="[&:last-child>td]:border-b-0">
              {r.map((c, j) => <td key={j} className={cx('border-b border-sunk px-3 py-2.5 align-top', j === 0 ? 'text-ink' : 'text-ink-2', nowrap.includes(j) && 'whitespace-nowrap')}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Disclosure ---------- */
export function Caret() {
  return <ChevronDown size={16} strokeWidth={ICON_STROKE} aria-hidden="true" className="flex-none text-ink-2 transition-transform duration-[var(--dur-2)] [transition-timing-function:var(--ease-out)] group-open:rotate-180" />;
}

export function Faq({ summary, children, className }: { summary: string; children: ReactNode; className?: string }) {
  return (
    <details className={cx('group rounded-card border border-line bg-surface [&+&]:mt-2', className)}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-card px-4 py-2 text-sm font-medium text-ink transition-colors duration-150 [&::-webkit-details-marker]:hidden [@media(hover:hover)]:hover:bg-sunk/60">{summary}<Caret /></summary>
      <div className="fade-in border-t border-line px-4 pb-4 pt-1 text-sm leading-[1.6] text-ink-2 [&>p]:mb-0 [&>p]:mt-3">{children}</div>
    </details>
  );
}

/* ---------- Section and step scaffolding ---------- */
/** Clears the header (and the phone section bar below 1024 px). */
export const SCROLL_MT = 'scroll-mt-[calc(var(--header-h)+108px)] lg:scroll-mt-[calc(var(--header-h)+20px)]';
/** The lead and the body's loose blocks (phase map, notes) rise in; steps reveal themselves; the heading line-masks. */
const LEAD_REVEAL = ':scope > p';
const BODY_REVEAL = ':scope > :not([data-sub])';

/** First section of its group (Get started, Use, Reference): the group name shows once, with more space above. */
const groupStart = (id: string) => GROUPS.some((g) => SECTIONS.find((s) => s.group === g)?.id === id);

export function Section({ id, lead, first = false, children }: { id: string; lead: ReactNode; first?: boolean; children: ReactNode }) {
  const s = sectionOf(id);
  const ref = useReveal<HTMLElement>({ selector: LEAD_REVEAL });
  const opens = groupStart(id);
  return (
    <section ref={ref} id={id} aria-labelledby={`${id}-h`}
      className={cx(SCROLL_MT, first ? 'pt-2' : opens ? 'mt-24 border-t border-line-strong pt-16' : 'mt-20 border-t border-line pt-14')}>
      <div data-head>
        <SectionHeader id={`${id}-h`} title={s?.title ?? ''} eyebrow={opens ? s?.group : undefined} className="mb-0" />
      </div>
      <p className="mb-0 mt-4 max-w-[68ch] text-[17px] leading-[1.6] text-ink-2">{lead}</p>
      <Body id={id}>{children}</Body>
    </section>
  );
}

/** The "Show this section" button unmounts as it unfolds, so focus moves to the section heading instead of the body. */
function focusHeading(id: string) {
  const h = document.getElementById(`${id}-h`);
  if (!h) return;
  h.tabIndex = -1;
  h.focus({ preventScroll: true });
}

/** The section body; folded on phones for Reference sections (see collapse.ts). */
function Body({ id, children }: { id: string; children: ReactNode }) {
  const { folded, unfold } = useContext(FoldCtx);
  const ref = useReveal<HTMLDivElement>({ selector: BODY_REVEAL });
  const isFolded = folded(id);
  const s = sectionOf(id);
  // Folded = `hidden="until-found"` (React 19 renders the hidden prop as a plain boolean, so set it here):
  // find-in-page still matches inside, and the match unfolds the section.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!isFolded) { el.removeAttribute('hidden'); return; }
    el.setAttribute('hidden', 'until-found');
    const onMatch = () => unfold(id);
    el.addEventListener('beforematch', onMatch);
    return () => el.removeEventListener('beforematch', onMatch);
  }, [id, isFolded, unfold, ref]);
  return (
    <>
      {isFolded && (
        <button type="button" aria-expanded={false} aria-controls={`${id}-body`} onClick={() => unfold(id, () => focusHeading(id))}
          className="mt-5 flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-card border border-line bg-surface px-4 py-2.5 text-left transition-colors duration-[var(--dur-1)] active:bg-sunk">
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-medium text-ink">Show this section</span>
            <span className="text-xs leading-[1.45] text-ink-2">{s?.subs.map((b) => b.title).join(', ')}</span>
          </span>
          <ChevronDown size={16} strokeWidth={ICON_STROKE} aria-hidden="true" className="flex-none text-ink-2" />
        </button>
      )}
      <div ref={ref} id={`${id}-body`}>{children}</div>
    </>
  );
}

/** A step. Numbered when its section is numbered (the steps run in order); `bare` keeps the id but shows no heading. */
export function Sub({ id, bare = false, children }: { id: string; bare?: boolean; children: ReactNode }) {
  const s = sectionOf(id);
  const i = s ? s.subs.findIndex((b) => b.id === id) : -1;
  const sub = s?.subs[i];
  const ref = useReveal<HTMLDivElement>();
  if (bare) return <div ref={ref} id={id} data-sub role="group" aria-label={sub?.title} className={cx(SCROLL_MT, 'pt-2')}>{children}</div>;
  return (
    <div ref={ref} id={id} data-sub className={cx(SCROLL_MT, 'pt-10')}>
      <h3 className="m-0 flex items-center gap-3 text-lg font-semibold tracking-[-0.01em]">
        {s?.num && <span aria-hidden="true" className="grid size-6 flex-none place-items-center rounded-full border border-line-strong bg-surface font-mono text-[11px] font-normal text-ink-2">{i + 1}</span>}
        {sub?.title}
      </h3>
      {children}
    </div>
  );
}
