import type { ReactNode } from 'react';
import { href } from '../app/router';
import { GITHUB_URL } from '../app/App';
import { Badge, Container, CopyButton, Icon } from '../ui';
import { GLOBAL_STATS as G } from '../data/benchmarkData';
import { AUTHORS } from './cite/citations';
import { CitationPanel } from './cite/CitationPanel';
import { ComponentGuide } from './cite/ComponentGuide';
import { BreakAtSlash } from './cite/BreakAtSlash';
import { CiteHero } from './cite/CiteHero';
import { useCitePick } from './cite/useCitePick';

const LICENSE_URL = `${GITHUB_URL}/blob/main/LICENSE`;
const RELEASE_URL = `${GITHUB_URL}/releases/tag/${G.version}`;
/** "Sagnik Sen, New England Biolabs, United States" -> name + where. */
const splitPerson = (s: string) => { const i = s.indexOf(','); return i < 0 ? [s, ''] : [s.slice(0, i), s.slice(i + 1).trim()]; };
const H2 = 'text-2xl font-semibold tracking-[-0.02em] text-ink md:text-[2rem]';
const LINK = 'inline-flex items-center gap-1 text-accent underline decoration-accent/30 underline-offset-2 transition-colors duration-150 hover:decoration-accent';

const ext = (url: string, text: ReactNode) => (
  <a href={url} target="_blank" rel="noreferrer" className={LINK}>{text}<Icon name="arrow-up-right" size={12} /></a>
);

/* ---------- Article: citation + record rail ---------- */
function Field({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-baseline gap-3 py-2.5">
      <dt className="label">{k}</dt>
      <dd className="min-w-0 text-sm text-ink [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

function History() {
  /* Data reads "Not yet assigned (proof: XX XX 2026)"; show only the status, never the placeholder. */
  const steps = [
    { k: 'Received', v: G.receivedDate, done: true },
    { k: 'Revised', v: G.revisedDate, done: true },
    { k: 'Accepted', v: G.acceptedDate, done: true },
    { k: 'Published', v: G.publishedDate.split(' (')[0], done: false },
  ];
  return (
    <ol aria-label="Article history" className="relative flex flex-col gap-3 before:absolute before:bottom-2 before:left-[3.5px] before:top-2 before:w-px before:bg-line">
      {steps.map((s) => (
        <li key={s.k} className="relative grid grid-cols-[6.5rem_minmax(0,1fr)] items-baseline gap-3 pl-5">
          <span aria-hidden="true" className={`absolute left-0 top-[5px] size-2 rounded-full ${s.done ? 'bg-ink-3' : 'border border-dashed border-ink-3 bg-canvas'}`} />
          <span className="label">{s.k}</span>
          <span className={`text-sm tabular ${s.done ? 'text-ink' : 'text-ink-2'}`}>{s.v}</span>
        </li>
      ))}
    </ol>
  );
}

/** The one place the pending status is explained. */
function DoiCard() {
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="label">Article DOI</p>
        {!G.doiConfirmed && <Badge>Pending</Badge>}
      </div>
      <p className="mt-2 font-mono text-[15px] text-ink [overflow-wrap:normal]"><BreakAtSlash text={G.doi} /></p>
      {!G.doiConfirmed && <p className="mt-1.5 text-xs leading-relaxed text-ink-2">Reserved by the journal. It resolves once Crossref registers it.</p>}
      <div className="-ml-2 mt-2"><CopyButton text={G.doi} label="Copy DOI" toast={`DOI ${G.doi} copied`} /></div>
    </div>
  );
}

function Article() {
  return (
    <section id="article" aria-labelledby="article-h" className="pb-14 pt-10 md:pb-16 md:pt-12">
      <Container className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-x-16">
        {/* Phones: heading, the copyable formats, DOI status, then the record. From lg: heading + formats left, DOI + record in the rail. */}
        <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-8">
          <h2 id="article-h" className={`${H2} order-1`}>Article citation</h2>
          <div className="order-2 min-w-0"><CitationPanel /></div>
        </div>
        <div className="contents lg:block lg:min-w-0 lg:pt-1">
          <div className="order-3 min-w-0"><DoiCard /></div>
          <div className="order-4 min-w-0 lg:mt-8">
            <dl className="divide-y divide-line border-y border-line">
              <Field k="Journal">{G.journalName}</Field>
              <Field k="Type">{G.articleType}</Field>
              <Field k="Citation"><span className="font-mono text-[13px]">{G.journalCitation}</span></Field>
              <Field k="Licence">{G.license}</Field>
              <Field k="Software">{ext(RELEASE_URL, <span className="font-mono text-[13px]">{G.version}</span>)}</Field>
            </dl>
            <div className="mt-8"><p className="label mb-3">History</p><History /></div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Authors, correspondence, editorial record ---------- */
function Authors() {
  const editor = splitPerson(G.editor);
  return (
    <section id="authors" aria-labelledby="authors-h" className="border-t border-line py-14 md:py-20">
      <Container className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-x-16">
        <div className="min-w-0">
          <h2 id="authors-h" className={H2}>Authors</h2>
          <ol className="mt-6 grid gap-x-10 border-t border-line sm:grid-cols-2">
            {AUTHORS.map((a) => (
              <li key={a.full} className="flex min-h-12 items-center border-b border-line py-2.5 text-base text-ink">
                {a.full}<sup className="ml-1 font-mono text-[11px] text-ink-2">{a.marks}{a.corresponding && '*'}</sup>
              </li>
            ))}
          </ol>
          <ol className="mt-6 flex max-w-[72ch] flex-col gap-2 text-sm leading-relaxed text-ink-2">
            {G.affiliations.map((aff) => (
              <li key={aff} className="grid grid-cols-[1.25rem_minmax(0,1fr)] items-baseline">
                <span className="font-mono text-xs text-ink-2">{aff.charAt(0)}</span><span>{aff.slice(1)}</span>
              </li>
            ))}
            <li className="grid grid-cols-[1.25rem_minmax(0,1fr)] items-baseline"><span className="font-mono text-xs text-ink-2">*</span><span>Corresponding author</span></li>
          </ol>
        </div>
        <aside aria-label="Correspondence and editorial record" className="flex min-w-0 flex-col gap-8 lg:pt-1">
          <div className="rounded-card border border-line bg-surface p-4">
            <p className="label">Correspondence</p>
            <p className="mt-2 text-base font-medium text-ink">{G.correspondingAuthor}</p>
            <ul className="mt-2 flex flex-col gap-1">
              {G.correspondingEmails.map((e) => (
                <li key={e} className="flex min-w-0 items-center gap-2">
                  <Icon name="envelope" size={14} className="shrink-0 text-ink-3" />
                  <a href={`mailto:${e}`} className="min-w-0 py-1 font-mono text-[13px] text-accent underline decoration-accent/30 underline-offset-2 [overflow-wrap:anywhere] hover:decoration-accent">{e}</a>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-ink-2">Report code problems as a {ext(`${GITHUB_URL}/issues`, 'GitHub issue')}.</p>
          </div>
          <dl className="divide-y divide-line border-y border-line">
            <div className="py-2.5">
              <dt className="label">Edited by</dt>
              <dd className="mt-1 text-sm text-ink">{editor[0]}<span className="block text-xs text-ink-2">{editor[1]}</span></dd>
            </div>
            <div className="py-2.5">
              <dt className="label">Reviewed by</dt>
              {G.reviewers.map((r) => { const [n, w] = splitPerson(r); return <dd key={r} className="mt-1 text-sm text-ink">{n}<span className="block text-xs text-ink-2">{w}</span></dd>; })}
            </div>
          </dl>
        </aside>
      </Container>
    </section>
  );
}

/* ---------- Licences: one row per thing you might reuse ---------- */
function Licences() {
  const rows: { what: string; licence: string; scope: string; where: ReactNode }[] = [
    { what: 'Code', licence: 'MIT', scope: 'Framework, method wrappers, configs and figure scripts.', where: ext(LICENSE_URL, 'LICENSE on GitHub') },
    { what: 'Article', licence: G.license.replace(/\s*\(.*\)$/, ''), scope: `Open access in ${G.journalName}. Credit the authors and the original publication.`, where: <span className="font-mono text-[13px] text-ink-2">{G.journalCitation}</span> },
    { what: 'Cohort data', licence: 'Varies by source', scope: `Each of the ${G.datasetsCount} cohorts keeps the terms of its source repository. Check the accession before redistributing.`, where: <a href={href('/datasets')} className={LINK}>Accessions on Datasets<Icon name="arrow-right" size={12} /></a> },
  ];
  return (
    <section id="licences" aria-labelledby="licences-h" className="border-t border-line pb-2 pt-14 md:pt-20">
      <Container>
        <h2 id="licences-h" className={H2}>Licences</h2>
        <dl className="mt-6 border-t border-line">
          {rows.map((r) => (
            <div key={r.what} className="grid gap-x-8 gap-y-1 border-b border-line py-4 md:grid-cols-[10rem_12rem_minmax(0,1fr)_17rem] md:items-baseline">
              <dt className="label">{r.what}</dt>
              <dd className="text-lg font-semibold tracking-[-0.01em] text-ink">{r.licence}</dd>
              <dd className="text-sm leading-relaxed text-ink-2">{r.scope}</dd>
              <dd className="text-sm md:text-right">{r.where}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}

export default function Cite() {
  const pick = useCitePick();
  return (
    <>
      <CiteHero pick={pick} />
      <Article />
      <ComponentGuide pick={pick} />
      <Authors />
      <Licences />
    </>
  );
}
