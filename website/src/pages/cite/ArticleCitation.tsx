import { useRef, type KeyboardEvent } from 'react';
import { asset, cx } from '../../lib/format';
import { SectionHeader } from '../../ui/SectionHeader';
import { ArrowUpRight, CircleAlert, Download, ICON_STROKE } from '../../ui/icons';
import { Reveal } from '../../ui/motion';
import { FORMATS, G, HISTORY, RELEASE_URL, doiUrl, type CiteFormat, type FormatId } from './data';
import { CopyButton, Doi, dt, link, type Copier } from './ui';
interface Props { fmt: CiteFormat; onPick: (id: FormatId) => void; copier: Copier }

/** The final article as published, hosted with the site (2.5 MB). */
const ARTICLE_PDF = asset('manuscript/reach-fbinf-2026-1878538.pdf');

/** The one strong download control beside the citation: outlined, full width in the card, press only. */
function PdfLink() {
  return (
    <a href={ARTICLE_PDF} download="reach-fbinf-2026-1878538.pdf" title="PDF, 2.5 MB"
      className="cite-pdf mt-3 flex min-h-11 items-center gap-2 rounded-chip border border-line-strong bg-surface px-3 text-[13px] font-medium text-ink no-underline">
      <Download size={16} strokeWidth={ICON_STROKE} aria-hidden="true" className="cite-pdf-icon shrink-0 text-accent" />
      <span className="min-w-0 flex-1">Download the article (PDF)<span className="sr-only">, 2.5 MB</span></span>
    </a>
  );
}

const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/** Article DOI card: published, resolvable, copyable. `compact` is the phone version shown above the tabs. */
function DoiCard({ copier, compact = false }: { copier: Copier; compact?: boolean }) {
  return (
    <div className={cx('card', compact ? 'p-3.5' : 'p-4')}>
      <div className="flex items-center justify-between gap-3">
        <p className={dt}>Article DOI</p>
        <span className="rounded-chip border border-ok/30 bg-ok/8 px-1.5 py-0.5 text-[11px] font-medium text-ok">Published</span>
      </div>
      <p className={cx('m-0 mt-2 font-mono', compact ? 'text-sm' : 'text-[15px]')}>
        <a href={doiUrl(G.doi)} className="rounded-[2px] text-ink no-underline decoration-accent/40 underline-offset-2 transition-colors duration-[var(--dur-1)] hover:text-accent-ink hover:underline"><Doi doi={G.doi} /></a>
      </p>
      {!compact && (
        <p className="m-0 mt-1.5 text-xs leading-[1.6] text-ink-2">
          Published {G.publishedDate} in {G.journalName}. The DOI resolves to the article.
        </p>
      )}
      <PdfLink />
      <div className="-ml-2 mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        <CopyButton copier={copier} slot="doi" text={G.doi} idle="Copy DOI" />
        <a href={G.articleUrl} target="_blank" rel="noopener noreferrer"
          className="cite-out inline-flex h-9 items-center gap-1 rounded-chip px-2 text-[13px] font-medium text-accent no-underline transition-colors duration-[var(--dur-1)] hover:bg-accent-tint hover:text-accent-ink">
          Read the article
          <ArrowUpRight className="cite-nudge" size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
          <span className="sr-only">(opens frontiersin.org in a new tab)</span>
        </a>
      </div>
    </div>
  );
}

function FormatTabs({ fmt, onPick }: { fmt: CiteFormat; onPick: (id: FormatId) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent) => {
    const i = FORMATS.findIndex((f) => f.id === fmt.id);
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: FORMATS.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const j = (next + FORMATS.length) % FORMATS.length;
    onPick(FORMATS[j].id);
    refs.current[j]?.focus();
  };
  return (
    <div role="tablist" aria-label="Citation format" onKeyDown={onKey}
      className="inline-flex flex-wrap gap-1 self-start rounded-full border border-line bg-surface p-1">
      {FORMATS.map((f, i) => {
        const on = f.id === fmt.id;
        return (
          <button key={f.id} ref={(el) => { refs.current[i] = el; }} id={`cite-tab-${f.id}`} type="button" role="tab"
            aria-selected={on} aria-controls="cite-panel" tabIndex={on ? 0 : -1} onClick={() => onPick(f.id)}
            className={cx('h-9 cursor-pointer rounded-full border-0 px-3.5 text-[13px] font-medium transition-[background-color,color] duration-[var(--dur-1)]',
              on ? 'bg-ink text-canvas' : 'bg-transparent text-ink-2 hover:bg-sunk hover:text-ink')}>
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

function CitationPanel({ fmt, copier }: { fmt: CiteFormat; copier: Copier }) {
  const panel = useRef<HTMLElement | null>(null);
  const blocked = copier.stateOf('fmt') === 'failed';
  const selectIfBlocked = (ok: boolean) => {
    const el = panel.current;
    if (!ok && el) window.getSelection()?.selectAllChildren(el);
  };
  const retry = async () => selectIfBlocked(await copier.copy(fmt.text, 'fmt'));
  const panelProps = {
    id: 'cite-panel', role: 'tabpanel', tabIndex: 0, 'aria-labelledby': `cite-tab-${fmt.id}`,
    className: cx('m-0 break-words text-ink outline-offset-[-2px]', blocked && 'bg-accent/12'),
  } as const;
  return (
    <figure className="card m-0 overflow-hidden">
      <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line bg-sunk/60 py-2 pl-3.5 pr-2 sm:pl-4">
        <span className="text-[13px] text-ink-2 sm:text-sm">For {fmt.use} <span className="hidden text-xs sm:inline">· published {G.publishedDate}</span></span>
        <CopyButton copier={copier} slot="fmt" text={fmt.text} idle="Copy" label={`Copy the ${fmt.label} citation`} solid onCopied={selectIfBlocked} />
      </figcaption>
      {fmt.mono ? (
        <pre ref={(el) => { panel.current = el; }} {...panelProps}
          className={cx(panelProps.className, 'whitespace-pre-wrap p-3.5 font-mono text-xs leading-[1.7] sm:px-6 sm:py-[22px] sm:text-[13px] sm:leading-[1.75]')}>{fmt.text}</pre>
      ) : (
        <p ref={(el) => { panel.current = el; }} {...panelProps}
          className={cx(panelProps.className, 'py-[18px] pl-10 pr-4 -indent-6 text-[15px] leading-[1.7] sm:py-[22px] sm:pl-14 sm:pr-6 sm:-indent-8 sm:text-base')}>{fmt.text}</p>
      )}
      {blocked && (
        <div role="alert" className="flex flex-wrap items-start gap-3 border-t border-bad/30 px-4 py-3">
          <CircleAlert size={16} strokeWidth={ICON_STROKE} aria-hidden="true" className="mt-0.5 shrink-0 text-bad" />
          <div className="min-w-0 flex-[1_1_200px]">
            <p className="m-0 text-sm font-medium">This browser blocked the clipboard</p>
            <p className="m-0 mt-0.5 text-sm leading-[1.6] text-ink-2">The {fmt.label} citation above is selected. Press {isMac() ? '⌘C' : 'Ctrl+C'} to copy it.</p>
          </div>
          <button type="button" onClick={retry}
            className="h-9 cursor-pointer rounded-chip border border-line bg-surface px-2.5 text-sm text-ink-2 transition-colors duration-[var(--dur-1)] hover:border-line-strong hover:text-ink">Try again</button>
        </div>
      )}
    </figure>
  );
}

const RECORD = [
  { k: 'Journal', v: G.journalName },
  { k: 'Type', v: G.articleType },
  { k: 'Citation', v: G.journalCitation },
  { k: 'Licence', v: G.license },
];

export function ArticleCitation({ fmt, onPick, copier }: Props) {
  return (
    <section id="article" aria-labelledby="article-h" className="mx-auto max-w-[1240px] px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-16">
      <Reveal className="flex flex-col gap-x-16 gap-y-8 lg:flex-row">
      <div className="flex min-w-0 flex-col gap-5 sm:gap-6 lg:flex-[999_1_560px]">
        <SectionHeader id="article-h" title="Article citation" lede="Pick a format, copy it, and paste it into your reference list." className="mb-1!" />
        <div className="lg:hidden"><DoiCard copier={copier} compact /></div>
        <FormatTabs fmt={fmt} onPick={onPick} />
        <CitationPanel fmt={fmt} copier={copier} />
      </div>
      <aside aria-label="Article record" className="flex min-w-0 flex-col gap-7 lg:max-w-[360px] lg:flex-[1_1_280px]">
        <div className="hidden lg:block"><DoiCard copier={copier} /></div>
        <dl className="m-0 border-t border-line">
          {RECORD.map((r) => (
            <div key={r.k} className="grid grid-cols-[104px_minmax(0,1fr)] items-baseline gap-3 border-b border-line py-2.5">
              <dt className={dt}>{r.k}</dt>
              <dd className="m-0 text-sm">{r.v}</dd>
            </div>
          ))}
          <div className="grid grid-cols-[104px_minmax(0,1fr)] items-baseline gap-3 border-b border-line py-2.5">
            <dt className={dt}>Software</dt>
            <dd className="m-0 text-sm"><a href={RELEASE_URL} className={cx(link, 'font-mono text-[13px]')}>{G.version}</a></dd>
          </div>
        </dl>
        <div>
          <h3 className="m-0 mb-3 text-sm font-medium text-ink">History</h3>
          <ol className="m-0 flex list-none flex-col gap-3 p-0">
            {HISTORY.map((h, i) => {
              const last = i === HISTORY.length - 1;
              return (
                <li key={h.label} className="grid grid-cols-[8px_92px_minmax(0,1fr)] items-baseline gap-3">
                  <span className={cx('size-2 rounded-full', last ? 'bg-ok' : 'bg-ink-3')} />
                  <span className={dt}>{h.label}</span>
                  <span className={cx('text-sm text-ink', last && 'font-medium')}>{h.date}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </aside>
      </Reveal>
    </section>
  );
}
