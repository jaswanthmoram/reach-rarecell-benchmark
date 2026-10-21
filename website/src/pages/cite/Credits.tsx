import { cx } from '../../lib/format';
import { href } from '../../lib/router';
import { AFFILIATIONS, AUTHORS, EDITOR, G, LICENCE_SHORT, REVIEWERS } from './data';
import { SectionHeader } from '../../ui/SectionHeader';
import { Reveal } from '../../ui/motion';
import { dt, link } from './ui';

const LIC_LINK = 'fx-underline text-accent no-underline transition-colors duration-[var(--dur-1)] hover:text-accent-ink';

export function Authors() {
  return (
    <section id="authors" aria-labelledby="authors-h" className="border-t border-line">
      <Reveal className="mx-auto flex max-w-[1240px] flex-col gap-x-16 gap-y-10 px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:flex-row">
        <div className="min-w-0 lg:flex-[999_1_560px]">
          <SectionHeader id="authors-h" title="Authors" className="mb-6!" />
          <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-x-10 border-t border-line p-0">
            {AUTHORS.map((a) => (
              <li key={a.name} className="flex min-h-12 items-center border-b border-line text-base">
                {a.name}<sup className="ml-1 font-mono text-[11px] text-ink-2">{a.sup}</sup>
              </li>
            ))}
          </ol>
          <ol className="m-0 mt-6 flex max-w-[72ch] list-none flex-col gap-2 p-0 text-sm leading-[1.6] text-ink-2">
            {AFFILIATIONS.map((a) => (
              <li key={a.mark} className="grid grid-cols-[20px_minmax(0,1fr)]"><span className="font-mono text-[11px] leading-[1.6rem]">{a.mark}</span><span>{a.text}</span></li>
            ))}
          </ol>
        </div>
        <aside aria-label="Correspondence and editorial record" className="flex min-w-0 flex-col gap-7 lg:max-w-[304px] lg:flex-[1_1_280px]">
          <div className="card p-4">
            <p className={dt}>Correspondence</p>
            <p className="m-0 mt-2 text-base font-medium">{G.correspondingAuthor}</p>
            <p className="m-0 mt-2 flex flex-col items-start gap-1.5">
              {G.correspondingEmails.map((e) => (
                <a key={e} href={`mailto:${e}`} className={cx(link, 'inline-flex min-h-8 items-center font-mono text-[13px] [overflow-wrap:anywhere] focus-visible:outline-offset-2')}>
                  {e}<span className="sr-only"> (email)</span>
                </a>
              ))}
            </p>
            <p className="m-0 mt-4 border-t border-line pt-3 text-xs text-ink-2">
              Report code problems as a <a href={`${G.githubUrl}/issues`} className={link}>GitHub issue</a>.
            </p>
          </div>
          <dl className="m-0 border-t border-line">
            <div className="border-b border-line py-2.5">
              <dt className={dt}>Edited by</dt>
              <dd className="m-0 mt-1 text-sm">{EDITOR.name}<span className="block text-xs text-ink-2">{EDITOR.place}</span></dd>
            </div>
            <div className="border-b border-line py-2.5">
              <dt className={dt}>Reviewed by</dt>
              {REVIEWERS.map((r, i) => (
                <dd key={r.name} className={cx('m-0 text-sm', i === 0 ? 'mt-1' : 'mt-1.5')}>{r.name}<span className="block text-xs text-ink-2">{r.place}</span></dd>
              ))}
            </div>
          </dl>
        </aside>
      </Reveal>
    </section>
  );
}

const LICENCES = [
  { k: 'Code', v: 'MIT', note: 'Framework, method wrappers, configs and figure scripts.',
    end: <a href={`${G.githubUrl}/blob/main/LICENSE`} className={LIC_LINK}>LICENSE on GitHub</a> },
  { k: 'Article', v: LICENCE_SHORT, note: `Open access in ${G.journalName}. Credit the authors and the original publication.`,
    end: <a href={G.articleUrl} target="_blank" rel="noopener noreferrer" className={LIC_LINK}>Read the article<span className="sr-only"> (opens in a new tab)</span></a> },
  { k: 'Cohort data', v: 'Varies by source', note: `Each of the ${G.datasetsCount} cohorts keeps the terms of its source repository. Check the accession before redistributing.`,
    end: <a href={href('/datasets')} className={LIC_LINK}>Accessions on Datasets</a> },
];

export function Licences() {
  return (
    <section id="licences" aria-labelledby="lic-h" className="border-t border-line">
      <div className="mx-auto max-w-[1240px] px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-16">
        <SectionHeader id="lic-h" title="Licences" className="mb-6!" />
        {/* Capped at 960px with each link under its own description, so no link sits far from its label (DESIGN-r9). */}
        <Reveal as="dl" className="m-0 max-w-[960px] border-t border-line">
          {LICENCES.map((l) => (
            <div key={l.k} className="flex flex-wrap items-baseline gap-x-8 gap-y-1 border-b border-line py-4">
              <dt className={cx(dt, 'flex-[0_0_140px]')}>{l.k}</dt>
              <dd className="m-0 flex-[0_0_192px] text-lg font-semibold">{l.v}</dd>
              <dd className="m-0 flex-[1_1_320px] text-sm leading-[1.6] text-ink-2">
                {l.note}
                <span className="mt-1.5 block w-fit">{l.end}</span>
              </dd>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
