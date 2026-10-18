// Page-local prose primitives for the Docs reading column (68ch).
import { useId, useState, type ReactNode } from 'react';
import { CopyButton, Icon, Tabs, Tooltip, useToast } from '../../ui';
import { sectionUrl, stepOf, titleOf, type EntryId, type SubId } from './nav';

/**
 * Copy the shareable link of a section or step. Sits after the heading text; quiet until the heading row is
 * hovered or the button is focused, always visible on touch screens. 44px hit area around a 28px chip.
 */
function CopyLink({ id }: { id: EntryId | SubId }) {
  const toast = useToast();
  const [done, setDone] = useState(false);
  const title = titleOf(id);
  const copy = async () => {
    const url = sectionUrl(id);
    try {
      await navigator.clipboard.writeText(url);
      setDone(true);
      window.setTimeout(() => setDone(false), 1600);
      toast({ title: `Link to “${title}” copied`, description: url, tone: 'ok' });
    } catch {
      toast({ title: 'Could not copy the link', description: `The browser blocked clipboard access. Copy it by hand: ${url}`, tone: 'bad', duration: 0 });
    }
  };
  return (
    <Tooltip content={done ? 'Copied' : 'Copy link to this section'}>
      <button type="button" onClick={copy} aria-label={`Copy link to ${title}`}
        className="relative grid size-7 shrink-0 place-items-center rounded-chip text-ink-3 opacity-0 transition-[opacity,color,background-color] duration-150 before:absolute before:-inset-2 before:content-[''] hover:bg-sunk hover:text-ink focus-visible:opacity-100 group-hover/h:opacity-100 active:translate-y-px [@media(hover:none)]:opacity-100">
        <Icon name={done ? 'check' : 'link'} size={15} className={done ? 'text-ok' : undefined} />
      </button>
    </Tooltip>
  );
}

export function DocSection({ id, lead, children }: { id: EntryId; lead: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-36 border-t border-line pt-12 lg:scroll-mt-20 first:border-t-0 first:pt-10">
      <div className="group/h flex items-center gap-2">
        <h2 id={`${id}-h`} tabIndex={-1} className="text-2xl font-semibold leading-tight tracking-[-0.02em] text-ink outline-none">{titleOf(id)}</h2>
        <CopyLink id={id} />
      </div>
      <p className="mt-3 text-[1.0625rem] leading-relaxed text-ink-2">{lead}</p>
      <div className="mt-2 min-w-0 pb-14">{children}</div>
    </section>
  );
}

/**
 * A step with no visible h3: its content sits straight under the section lead (Install puts the first
 * command there). It keeps the step id, so the rail and shared links still land on it.
 */
export function BareSub({ id, children }: { id: SubId; children: ReactNode }) {
  const { n } = stepOf(id);
  return (
    <div id={id} aria-label={titleOf(id)} role="group" className="relative mt-6 flex min-w-0 scroll-mt-36 flex-col gap-4 md:pl-9 lg:scroll-mt-20">
      {/* Same step circle and left edge as the numbered steps below it, without a visible heading. */}
      <StepMark n={n} className="absolute left-0 top-2.5 hidden md:flex" />
      {children}
    </div>
  );
}

function StepMark({ n, className = '' }: { n: number; className?: string }) {
  return <span aria-hidden="true" className={`size-6 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface font-mono text-[11px] font-normal text-ink-2 tabular-nums ${className}`}>{n}</span>;
}

/** Secondary detail folded away under a one-line summary (native details: keyboard and screen readers for free). */
export function Disclosure({ summary, children }: { summary: string; children: ReactNode }) {
  return (
    <details className="group rounded-card border border-line bg-surface open:border-line-strong">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-card px-4 py-2.5 text-sm font-medium text-ink transition-colors duration-150 hover:bg-sunk/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
        {summary}
        <Icon name="caret-down" size={14} className="shrink-0 text-ink-2 transition-transform duration-300 group-open:rotate-180" />
      </summary>
      <div className="flex min-w-0 flex-col gap-3 border-t border-line p-3 text-sm leading-relaxed text-ink-2">{children}</div>
    </details>
  );
}

export function Sub({ id, children }: { id: SubId; children: ReactNode }) {
  const { n, numbered } = stepOf(id);
  return (
    <div id={id} className="min-w-0 scroll-mt-36 pt-10 lg:scroll-mt-20">
      <div className="group/h flex items-center gap-2">
        <h3 tabIndex={-1} className="flex items-center gap-3 text-lg font-semibold tracking-[-0.01em] text-ink outline-none">
          {numbered && <StepMark n={n} className="flex" />}
          {titleOf(id)}
        </h3>
        <CopyLink id={id} />
      </div>
      <div className={`mt-4 flex min-w-0 flex-col gap-4 ${numbered ? 'md:pl-9' : ''}`}>{children}</div>
    </div>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-base leading-relaxed text-ink-2">{children}</p>;
}

/** Inline code. */
export function C({ children }: { children: ReactNode }) {
  // Short tokens (flags, IDs) never split at their hyphens; long commands and paths may wrap.
  const long = typeof children !== 'string' || children.length > 28;
  return <code className={`rounded-chip border border-line bg-sunk px-1 py-px font-mono text-[0.875em] text-ink ${long ? '[overflow-wrap:anywhere]' : 'whitespace-nowrap'}`}>{children}</code>;
}

/**
 * A command inside a table cell. Block code that never wraps: a long command scrolls inside its own
 * well instead of breaking at a hyphen (`--` orphaned on the next line). No border, so a column of
 * commands reads as one band rather than a stack of chips.
 */
export function Cmd({ children, needsArchives }: { children: string; needsArchives?: boolean }) {
  return (
    <span className="flex min-w-0 flex-col items-start gap-1">
      <pre tabIndex={0} aria-label={`Command: ${children}`}
        className="w-full max-w-full overflow-x-auto whitespace-pre rounded-chip bg-sunk px-2 py-1 font-mono text-[12.5px] leading-relaxed text-ink [scrollbar-width:thin] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><code>{children}</code></pre>
      {needsArchives && <Needs archives />}
    </span>
  );
}

export function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-baseline gap-0.5 text-accent underline decoration-accent/30 underline-offset-2 transition-colors duration-150 hover:decoration-accent">
      {children}
      <Icon name="arrow-up-right" size={12} className="shrink-0 self-center" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

const CALLOUT = {
  note: { icon: 'info', box: 'border-accent/25 bg-accent-tint', mark: 'text-accent' },
  caveat: { icon: 'warning-circle', box: 'border-line-strong bg-sunk', mark: 'text-ink-2' },
} as const;

export function Callout({ kind = 'note', title, children }: { kind?: 'note' | 'caveat'; title: string; children: ReactNode }) {
  const k = CALLOUT[kind];
  return (
    <aside className={`flex min-w-0 gap-3 rounded-card border p-4 ${k.box}`} aria-label={title}>
      <Icon name={k.icon} size={18} className={`mt-px shrink-0 ${k.mark}`} />
      <div className="flex min-w-0 flex-col gap-1 text-sm leading-relaxed text-ink-2">
        <p className="font-medium text-ink">{title}</p>
        {children}
      </div>
    </aside>
  );
}

/**
 * What a command needs, as an icon and a few words rather than a badge: tables with a badge in every row read
 * as a wall of chips. Archives get ink and the download glyph; a plain checkout stays quiet in ink-2.
 */
export function Needs({ archives }: { archives: boolean }) {
  return archives
    ? <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-ink"><Icon name="download-simple" size={14} className="shrink-0 text-ink-2" />Zenodo archives</span>
    : <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-ink-2"><Icon name="git-branch" size={14} className="shrink-0" />Git checkout</span>;
}

/**
 * Key-value table. A real table at md+, stacked rows below 768px so nothing
 * scrolls sideways on a phone.
 */
export interface Row { a: ReactNode; b: ReactNode; c?: ReactNode }

/**
 * Inside a table the column already says "this is code", so inline code drops its chip (border, fill, padding)
 * and keeps only the mono face in ink. Prose outside tables keeps the chip.
 */
const PLAIN_CODE = '[&_:not(pre)>code]:border-0 [&_:not(pre)>code]:bg-transparent [&_:not(pre)>code]:p-0 [&_:not(pre)>code]:text-ink';

/** `codeCol`: index of a column holding `Cmd` blocks. It takes the remaining width and never widens the table. */
/**
 * `caption` may be omitted when a surrounding heading already names the table; `label` then names it for screen readers.
 * `aside`: below 768px this column (a short value such as a size or a few flags) sits beside the row name instead of
 * on its own labelled line.
 */
export function DefTable({ caption, label, head, rows, codeCol, aside, asideInline }: {
  caption?: string; label?: string; head: readonly string[]; rows: readonly Row[]; codeCol?: number;
  /** Column index shown beside the row name below 768px; `asideInline` puts it right after the name instead of flush right. */
  aside?: 1 | 2; asideInline?: boolean;
}) {
  const cellsOf = (r: Row) => (head.length > 2 ? [r.a, r.b, r.c] : [r.a, r.b]);
  // Stacked rows label each value only when there is more than one and none has moved beside the name.
  const stackLabels = aside === undefined && head.length > 2;
  return (
    <figure className="flex min-w-0 flex-col gap-2" aria-label={caption ? undefined : label}>
      {caption && <figcaption className="label">{caption}</figcaption>}
      <div className={`hidden overflow-x-auto rounded-card border border-line bg-surface md:block ${PLAIN_CODE} [&_th_code]:whitespace-nowrap`}>
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line">
              {head.map((h) => <th key={h} scope="col" className="label px-3 py-2 font-normal">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-line align-top last:border-b-0">
                {cellsOf(row).map((cell, j) => j === 0
                  ? <th key={j} scope="row" className={`px-3 py-2.5 font-medium text-ink ${codeCol !== undefined ? 'min-w-[9.5rem]' : ''}`}>{cell}</th>
                  : <td key={j} className={`px-3 py-2.5 text-ink-2 ${j === codeCol ? 'w-full max-w-0' : ''}`}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className={`flex flex-col divide-y divide-line rounded-card border border-line bg-surface md:hidden ${PLAIN_CODE}`}>
        {rows.map((row, i) => {
          const cells = cellsOf(row);
          return (
            <li key={i} className="flex flex-col gap-1.5 p-3 text-sm">
              <span className={asideInline ? 'flex flex-wrap items-baseline gap-x-2 gap-y-0.5' : 'flex items-baseline justify-between gap-3'}>
                <span className="font-medium text-ink">{row.a}</span>
                {aside !== undefined && <span className={asideInline ? 'min-w-0 text-ink-2' : 'shrink-0'}>{cells[aside]}</span>}
              </span>
              {cells.map((cell, j) => (j === 0 || j === aside ? null : (
                <span key={j} className="flex flex-col gap-0.5 text-ink-2">
                  {stackLabels && <span className="label">{head[j]}</span>}
                  <span className="min-w-0">{cell}</span>
                </span>
              )))}
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

export interface CodeTab<T extends string> { value: T; label: string; code: string; title: string; note?: ReactNode }

/** Alternatives for one step (OS, package manager, workflow engine). */
export function TabbedCode<T extends string>({ label, tabs }: { label: string; tabs: readonly CodeTab<T>[] }) {
  const [value, setValue] = useState<T>(tabs[0].value);
  const panelId = useId();
  const tab = tabs.find((t) => t.value === value) ?? tabs[0];
  const code = tab.code.replace(/^\n+|\s+$/g, '');
  return (
    <div className="flex min-w-0 max-w-full flex-col gap-3">
      {/* The route tabs live in the block's header strip (where CodeBlock shows its filename), so the first command sits higher. */}
      <div className="min-w-0 overflow-hidden rounded-card border border-line bg-sunk">
        <div className="flex min-w-0 items-center justify-between gap-2 border-b border-line py-1.5 pl-1.5 pr-3">
          <div className="min-w-0">
            <Tabs label={label} value={value} onChange={setValue} options={tabs.map((t) => ({ value: t.value, label: t.label }))} />
          </div>
          <span className="hidden shrink-0 sm:inline-flex"><CopyButton text={code} /></span>
        </div>
        {/* Below 640px every route tab needs the header width (four tabs do not fit beside Copy), so Copy moves onto the panel. */}
        <div id={panelId} role="tabpanel" aria-label={`${label}: ${tab.label}`} className="relative">
          <span className="absolute right-2 top-2 sm:hidden [&_button]:gap-0 [&_button]:text-[0px]"><CopyButton text={code} /></span>
          {/* Long URLs wrap instead of running off the right edge on a phone. */}
          <pre className="whitespace-pre-wrap p-4 font-mono text-[13px] leading-relaxed text-ink [overflow-wrap:anywhere]">
            {/* Keeps the first line clear of the overlaid Copy button; later lines use the full width. */}
            <span aria-hidden="true" className="float-right h-5 w-7 sm:hidden" />
            <code>{code}</code>
          </pre>
        </div>
      </div>
      {tab.note && <div className="text-sm leading-relaxed text-ink-2">{tab.note}</div>}
    </div>
  );
}

export function Steps({ children }: { children: ReactNode }) {
  return <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-base leading-relaxed text-ink-2 marker:font-mono marker:text-xs marker:text-ink-3">{children}</ol>;
}
