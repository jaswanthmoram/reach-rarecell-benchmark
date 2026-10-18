import { href } from '../../app/router';
import { CopyButton, Icon } from '../../ui';
import { ZENODO_ARCHIVES } from '../../data/benchmarkData';
import { BreakAtSlash } from './BreakAtSlash';
import { PARTS, TOTAL_GB, citedParts, doiList, type Part, type Ref } from './components';
import type { CitePick } from './useCitePick';

const LINK = 'inline-flex items-center gap-1 text-accent underline decoration-accent/30 underline-offset-2 hover:decoration-accent';

/** The row's orbit, drawn at its relative size: the same ring that lights in the hero. */
function RingGlyph({ k, on }: { k: number; on: boolean }) {
  const rx = 5 + k * 2.4;
  return (
    <svg aria-hidden="true" width="28" height="28" viewBox="0 0 28 28" className="shrink-0">
      <ellipse cx="14" cy="14" rx={rx} ry={rx * 0.42} transform="rotate(-14 14 14)" fill="none" strokeWidth={on ? 1.5 : 1}
        className={`transition-[stroke] duration-150 ${on ? 'stroke-accent' : 'stroke-ink-3/60'}`} />
      <circle cx="14" cy="14" r="2.2" className="fill-signal" />
    </svg>
  );
}

function Doi({ r }: { r: Ref }) {
  return (
    <li className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2">
      <span className="col-span-2 text-[13px] leading-snug text-ink-2">{r.name}{r.meta && <span className="text-ink-3"> · {r.meta}</span>}</span>
      {r.pending ? (
        /* Not registered yet, so it would not resolve: plain text, no link. */
        <span className="min-w-0 font-mono text-[13px] text-ink [overflow-wrap:normal]"><BreakAtSlash text={r.doi} /></span>
      ) : (
        <a href={r.url} target="_blank" rel="noreferrer" className={`${LINK} min-w-0 font-mono text-[13px] [overflow-wrap:normal]`}>
          <span className="min-w-0"><BreakAtSlash text={r.doi} /></span><Icon name="arrow-up-right" size={12} className="shrink-0" />
        </a>
      )}
      <CopyButton text={r.doi} label="Copy" toast={`DOI ${r.doi} copied`} />
    </li>
  );
}

const NOTES: Partial<Record<Part['id'], React.ReactNode>> = {
  code: 'The concept DOI resolves to the latest release; name the version you ran.',
  data: <>Also cite each cohort&apos;s source study. <a href={href('/datasets')} className={LINK}>Accessions on Datasets<Icon name="arrow-right" size={12} /></a></>,
};

function Row({ p, k, pick }: { p: Part; k: number; pick: CitePick }) {
  const always = p.id === 'paper';
  const on = always || pick.picked.has(p.id);
  const preview = pick.hover === p.id;
  return (
    <li onMouseEnter={() => pick.setHover(p.id)} onMouseLeave={() => pick.setHover(null)}
      className={`grid grid-cols-1 gap-x-6 gap-y-3 border-b border-line py-4 transition-colors duration-150 md:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] ${on && !always ? 'bg-accent-tint/50' : preview ? 'bg-sunk/50' : ''}`}>
      <div className="min-w-0">
        <button type="button" aria-pressed={on} aria-disabled={always || undefined} onClick={() => pick.toggle(p.id)}
          onFocus={() => pick.setHover(p.id)} onBlur={() => pick.setHover(null)}
          className={`-mx-2 grid w-[calc(100%+1rem)] grid-cols-[1.75rem_minmax(0,1fr)] gap-x-3 rounded-chip px-2 py-1 text-left ${always ? 'cursor-default' : 'hover:bg-sunk/70'}`}>
          <RingGlyph k={k} on={on || preview} />
          <span className="min-w-0">
            <span className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-[15px] font-medium text-ink">{p.what}</span>
              <span className={`inline-flex h-5 items-center gap-1 rounded-chip border px-1.5 text-xs transition-colors duration-150 ${always ? 'border-line text-ink-2' : on ? 'border-accent/40 bg-accent-tint text-accent-ink' : 'border-line-strong text-ink-2'}`}>
                {!always && <Icon name={on ? 'check' : 'plus'} size={11} />}{always ? 'Always cited' : on ? 'Added' : 'Add'}
              </span>
            </span>
            <span className="mt-0.5 block text-sm leading-relaxed text-ink-2">{p.when}</span>
          </span>
        </button>
        {NOTES[p.id] && <p className="mt-1 pl-10 text-xs leading-relaxed text-ink-2">{NOTES[p.id]}</p>}
      </div>
      <ul className="flex min-w-0 flex-col gap-3 pl-10 md:pl-0">{p.cite.map((r) => <Doi key={r.doi} r={r} />)}</ul>
    </li>
  );
}

/** What the reader has picked, as one copyable list for a data-availability statement. */
function CitationSet({ pick }: { pick: CitePick }) {
  const parts = citedParts(pick.picked);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="label">Your citation set</p>
        <CopyButton text={doiList(pick.picked)} label="Copy list" toast="DOI list copied" />
      </div>
      <ol className="flex flex-col gap-2.5 text-sm">
        {parts.map((p) => p.cite.map((r) => (
          <li key={r.doi} className="flex min-w-0 flex-col">
            <span className="text-ink">{p.id === 'paper' ? 'Article' : r.name}{r.pending && <span className="text-xs text-ink-2"> · DOI pending</span>}</span>
            <span className="font-mono text-[12px] text-ink-2 [overflow-wrap:anywhere]">{r.doi}</span>
          </li>
        )))}
      </ol>
      {parts.length === 1 && <p className="text-xs leading-relaxed text-ink-2">Pick a part in the list to add its archive.</p>}
    </div>
  );
}

/** Which DOI goes with which reuse. Rows toggle the same rings as the hero; the rail keeps the picked set in view. */
export function ComponentGuide({ pick }: { pick: CitePick }) {
  return (
    <section id="archives" aria-labelledby="archives-h" className="scroll-mt-20 border-t border-line py-14 md:py-20">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-16 lg:px-8">
        <div className="min-w-0">
          <h2 id="archives-h" className="text-2xl font-semibold tracking-[-0.02em] text-ink md:text-[2rem]">Which DOI to cite</h2>
          <p className="mt-2 max-w-[62ch] text-pretty text-base leading-relaxed text-ink-2">
            The article always comes first. After it, add one Zenodo archive for each part you reused ({ZENODO_ARCHIVES.length}&nbsp;archives, about {Math.round(TOTAL_GB)}&nbsp;GB in all).
          </p>
          <ol className="mt-6 border-t border-line">
            {PARTS.map((p, k) => <Row key={p.id} p={p} k={k} pick={pick} />)}
          </ol>
        </div>
        <aside aria-label="Your citation set" className="min-w-0">
          <div className="rounded-card border border-line bg-surface p-4 lg:sticky lg:top-24">
            <CitationSet pick={pick} />
          </div>
        </aside>
      </div>
    </section>
  );
}
