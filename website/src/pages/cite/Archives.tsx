import { cx } from '../../lib/format';
import { href } from '../../lib/router';
import { SectionHeader } from '../../ui/SectionHeader';
import { Reveal } from '../../ui/motion';
import { ARCHIVE_COUNT, PARTS, doiUrl, type CitePart, type PartId } from './data';
import { CopyButton, Doi, link, type Copier } from './ui';

interface Props {
  isOn: (id: PartId) => boolean;
  onToggle: (id: PartId) => void;
  anyArchive: boolean;
  copier: Copier;
}

interface SetEntry { name: string; doi: string; label: string }

/** The DOIs to cite, article first, in the order of the list. */
const citationSet = (cited: CitePart[]): SetEntry[] =>
  cited.flatMap((p) => p.refs.map((r) => {
    const name = p.id === 'paper' ? 'Article' : r.name;
    return { name, doi: r.doi, label: p.id === 'paper' ? 'Article' : `${r.name} (Zenodo)` };
  }));

function PartRow({ part, k, on, onToggle, copier }: { part: CitePart; k: number; on: boolean; onToggle: () => void; copier: Copier }) {
  const always = part.id === 'paper';
  const rx = 5 + k * 2.4;
  const state = always ? 'Always cited' : on ? 'Added' : 'Add';
  return (
    <li className={cx('flex flex-wrap gap-x-6 gap-y-3 border-b border-line px-1 py-4 transition-colors duration-[var(--dur-2)] sm:px-2', on && !always && 'bg-accent-tint/50')}>
      <button type="button" aria-pressed={on} aria-disabled={always || undefined} onClick={onToggle}
        className={cx('group grid min-w-0 flex-[999_1_320px] grid-cols-[28px_minmax(0,1fr)] gap-3 rounded-chip border-0 bg-transparent p-1 text-left text-ink',
          always ? 'cursor-default' : 'cite-part cursor-pointer')}>
        <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" className="cite-part-mark">
          <ellipse cx="14" cy="14" rx={rx} ry={rx * 0.42} transform="rotate(-14 14 14)" fill="none" stroke={on ? 'var(--accent)' : 'var(--cell)'} strokeWidth="1.4" />
          <circle cx="14" cy="14" r="2.2" fill="var(--signal)" />
        </svg>
        <span>
          <span className="text-[15px] font-medium">{part.what}</span>{' '}
          <span className={cx('text-xs transition-colors duration-[var(--dur-1)]', on ? 'text-accent-ink' : 'text-ink-3 group-hover:text-ink')}>{state}</span>
          <span className="mt-0.5 block text-sm leading-[1.6] text-ink-2">{part.when}</span>
        </span>
      </button>
      {part.note && (
        <p className="m-0 sm:order-last -mt-2 flex-[999_1_100%] pl-11 text-xs leading-[1.6] text-ink-2">
          {part.note}
          {part.id === 'data' && <> <a href={href('/datasets')} className={link}>Accessions on Datasets</a></>}
        </p>
      )}
      <ul className="m-0 flex min-w-0 flex-[1_1_300px] list-none flex-col gap-3 p-0 pl-11 sm:pl-0">
        {part.refs.map((r) => (
          <li key={r.doi}>
            <span className="block text-[13px] text-ink-2">{r.name}<span className="text-ink-3">{r.meta}</span></span>
            <span className="flex items-center justify-between gap-2">
              <a href={doiUrl(r.doi)} className={cx(link, 'font-mono text-[13px]')}><Doi doi={r.doi} /></a>
              <CopyButton copier={copier} slot={`ref-${r.doi}`} text={r.doi} idle="Copy" label={`Copy DOI ${r.doi}`} />
            </span>
          </li>
        ))}
      </ul>
    </li>
  );
}

/** The live set (audit Cite P1): it grows as parts are picked, stays in view beside the list on wide screens. */
function CitationSet({ set, list, anyArchive, copier }: { set: SetEntry[]; list: string; anyArchive: boolean; copier: Copier }) {
  return (
    <div className="card flex flex-col gap-4 p-4 lg:sticky lg:top-[calc(var(--header-h)+var(--section-nav-h,0px)+24px)]">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="m-0 text-[15px] font-semibold">Your citation set</h3>
        <span className="tabular text-xs text-ink-2" aria-live="polite">{set.length} {set.length === 1 ? 'DOI' : 'DOIs'}</span>
      </div>
      <ol className="m-0 flex list-none flex-col gap-0 border-t border-line p-0 text-sm">
        {set.map((x, i) => (
          <li key={x.doi} className={cx('grid grid-cols-[20px_minmax(0,1fr)] gap-x-2 border-b border-line py-2.5', i > 0 && 'fade-in')}>
            <span className="tabular font-mono text-[11px] leading-5 text-ink-3">{i + 1}</span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span>{x.name}</span>
              <span className="font-mono text-xs text-ink-2"><Doi doi={x.doi} /></span>
            </span>
          </li>
        ))}
      </ol>
      {!anyArchive && <p className="m-0 -mt-1 text-xs leading-[1.6] text-ink-2">Pick a part in the list, or above, to add its archive.</p>}
      <CopyButton copier={copier} slot="list" text={list} idle="Copy list" label={`Copy the ${set.length} DOIs as a list`} solid className="self-start" />
    </div>
  );
}

export function Archives({ isOn, onToggle, anyArchive, copier }: Props) {
  const set = citationSet(PARTS.filter((p) => isOn(p.id)));
  const list = set.map((x) => `${x.label}: ${doiUrl(x.doi)}`).join('\n');
  return (
    <section id="archives" aria-labelledby="archives-h" className="border-t border-line">
      <Reveal className="mx-auto flex max-w-[1240px] flex-col gap-x-16 gap-y-10 px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:flex-row lg:items-start">
        <div className="min-w-0 lg:flex-[999_1_560px]">
          <SectionHeader id="archives-h" title="Which DOI to cite" className="mb-6!"
            lede={`The article always comes first. After it, add one Zenodo archive for each part you reused (${ARCHIVE_COUNT} archives, about 20 GB in all).`} />
          <ol className="m-0 list-none border-t border-line p-0">
            {PARTS.map((p, k) => <PartRow key={p.id} part={p} k={k} on={isOn(p.id)} onToggle={() => onToggle(p.id)} copier={copier} />)}
          </ol>
        </div>
        <aside aria-label="Your citation set" className="min-w-0 self-stretch lg:max-w-[320px] lg:flex-[1_1_300px]">
          <CitationSet set={set} list={list} anyArchive={anyArchive} copier={copier} />
        </aside>
      </Reveal>
    </section>
  );
}
