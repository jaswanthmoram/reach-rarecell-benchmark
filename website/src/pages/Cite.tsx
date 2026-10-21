import { setQuery, useQuery } from '../lib/router';
import { SectionNav } from '../ui/SectionNav';
import { ArticleCitation } from './cite/ArticleCitation';
import { Archives } from './cite/Archives';
import { Authors, Licences } from './cite/Credits';
import { FORMATS, PARTS, isFormatId, isPartId, type FormatId, type PartId } from './cite/data';
import { Hero } from './cite/Hero';
import { useCopy } from '../ui/useCopy';
import './cite/cite.css';

/* Cite page (canvas board P08). State lives in the URL: `/cite/?reuse=code,data&fmt=apa`. */

/** Copied shows 1.6 s, Not copied 2.4 s; the citation panel's failure stays until the format changes. */
const COPY_OPTS = { resetMs: 1600, failedMs: 2400, stickyFailures: ['fmt'] } as const;
const NAV = [
  { id: 'article', label: 'Article citation' },
  { id: 'archives', label: 'Which DOI to cite' },
  { id: 'authors', label: 'Authors' },
  { id: 'licences', label: 'Licences' },
];

function writeQuery(fmt: FormatId, reuse: readonly PartId[]) {
  const parts = [reuse.length ? `reuse=${reuse.join(',')}` : '', fmt !== 'bibtex' ? `fmt=${fmt}` : ''].filter(Boolean);
  setQuery(parts.join('&'));
}

export default function Cite() {
  const q = useQuery();
  const fmtParam = q.get('fmt');
  const fmtId: FormatId = isFormatId(fmtParam) ? fmtParam : 'bibtex';
  const fmt = FORMATS.find((f) => f.id === fmtId) ?? FORMATS[0];
  const picked = new Set((q.get('reuse') ?? '').split(',').filter(isPartId));
  const reuse = PARTS.map((p) => p.id).filter((id) => picked.has(id));
  const copier = useCopy(COPY_OPTS);

  const isOn = (id: PartId) => id === 'paper' || picked.has(id);
  const anyArchive = reuse.length > 0;
  const lit = PARTS.map((p) => isOn(p.id));
  const doiCount = PARTS.filter((p) => isOn(p.id)).reduce((n, p) => n + p.refs.length, 0);

  const toggle = (id: PartId) => {
    if (id === 'paper') return;
    writeQuery(fmtId, picked.has(id) ? reuse.filter((x) => x !== id) : PARTS.map((p) => p.id).filter((x) => x === id || picked.has(x)));
  };
  const pickFormat = (id: FormatId) => {
    copier.reset();
    writeQuery(id, reuse);
  };

  return (
    <div className="bg-canvas text-ink">
      <Hero isOn={isOn} onToggle={toggle} lit={lit} anyArchive={anyArchive} doiCount={doiCount} />
      <SectionNav label="Cite sections" items={NAV} />
      <ArticleCitation fmt={fmt} onPick={pickFormat} copier={copier} />
      <Archives isOn={isOn} onToggle={toggle} anyArchive={anyArchive} copier={copier} />
      <Authors />
      <Licences />
    </div>
  );
}
