import { Fragment, useState } from 'react';
import { href } from '../../app/router';
import { Container, Icon, fmt } from '../../ui';
import { GLOBAL_STATS as G, type MethodResult } from '../../data/benchmarkData';
import { APMark, FidelityTag, Head, MethodLabel, PairwiseLink, RankCell } from './parts';
import { ROLE_GROUPS, SECTION_SCROLL, auditFor, detailFails, detailReading, isGpu, languageParts, matrixNotes, shortLanguage } from './shared';

const ALL_IDS = ROLE_GROUPS.flatMap((g) => g.methods.map((m) => m.id));
const detailId = (m: MethodResult) => `method-detail-${m.id}`;

/* ---------- Expanded detail (shared by table rows and cards) ---------- */

function Numbers({ m }: { m: MethodResult }) {
  const rows: [string, string, string?][] = [
    ['Mean AP', fmt.ap(m.meanAP), 'Track A'],
    ['AUROC', fmt.ap(m.auroc), 'Track A mean'],
    ['Degenerate', m.degenerateUnits, 'constant-score units'],
    ['Fallback', m.fallbackUnits, 'units that fell back'],
    ['Track F AP', fmt.ap(m.trackF01AP), m.id === 'scMalignantFinder' ? 'at 0.1%, crc_lee only' : 'median at 0.1%'],
    ['Mean AP, 95% CI', m.bootAPLow != null && m.bootAPHigh != null ? `${fmt.ap(m.bootAPLow)} to ${fmt.ap(m.bootAPHigh)}` : 'n/a', m.bootAPLow != null ? '95% bootstrap, Track A' : 'not reported for this method'],
  ];
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line">
      {rows.map(([k, v, sub]) => (
        <div key={k} className="bg-surface px-3 py-2.5">
          <dt className="label">{k}</dt>
          <dd className="mt-1 font-mono text-[13px] text-ink tabular">{v}</dd>
          {sub && <dd className="text-[11px] leading-tight text-ink-3">{sub}</dd>}
        </div>
      ))}
    </dl>
  );
}

function Detail({ m }: { m: MethodResult }) {
  const audit = auditFor(m.id);
  const note = matrixNotes(m);
  const fails = detailFails(m);
  const reading = detailReading(m);
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,300px)] lg:gap-8">
      <div className="min-w-0">
        <p className="label mb-1.5">Mechanism</p>
        <p className="text-sm leading-relaxed text-ink">{m.mechanism}</p>
        <p className="label mb-1.5 mt-4">Paradigm</p>
        <p className="text-sm leading-relaxed text-ink-2">{audit?.paradigm ?? m.paradigm} · {shortLanguage(m)}</p>
      </div>
      <div className="min-w-0">
        <p className="label mb-1.5">Where it fails</p>
        <p className="text-sm leading-relaxed text-ink-2">
          {fails.text}{fails.pairwise && <>{' '}<PairwiseLink /></>}
        </p>
        {reading && (
          <>
            <p className="label mb-1.5 mt-4">Reading</p>
            <p className="text-sm leading-relaxed text-ink-2">{reading}</p>
          </>
        )}
        {!reading && m.highlight?.includes('BH-FDR') && <p className="mt-4 text-sm"><PairwiseLink /></p>}
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <Numbers m={m} />
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <p className="text-xs leading-snug text-ink-2">{m.citation}{note.citeNote && <span className="text-ink-3"> †</span>}</p>
          <a href={`${href('/leaderboard')}?method=${encodeURIComponent(m.id)}`}
            className="group inline-flex min-h-10 items-center gap-1.5 rounded-chip text-sm font-medium text-accent hover:underline hover:underline-offset-4">
            Leaderboard row
            <Icon name="arrow-right" size={14} className="transition-transform duration-150 group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

function Toggle({ m, open, onToggle, wide }: { m: MethodResult; open: boolean; onToggle: () => void; wide?: boolean }) {
  return (
    <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={detailId(m)}
      aria-label={wide ? undefined : `${open ? 'Hide' : 'Show'} details for ${m.method}`}
      className={`group inline-flex shrink-0 items-center justify-center gap-1.5 rounded-chip text-ink-2 transition-colors duration-150 hover:bg-sunk hover:text-ink ${wide ? 'h-11 px-2 text-xs font-medium' : 'size-8'}`}>
      {wide && (open ? 'Hide details' : 'Details')}
      <Icon name="caret-down" size={14} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
    </button>
  );
}

/* ---------- Desktop table (lg and up) ---------- */

const COLS = [
  { key: 'rank', label: 'Rank', w: 'w-[100px]' },
  { key: 'method', label: 'Method · paradigm', w: 'w-[232px]' },
  { key: 'lang', label: 'Language', w: 'w-[76px]' },
  { key: 'fid', label: 'Fidelity', w: 'w-[84px]' },
  { key: 'ap', label: 'Median AP', w: 'w-[148px]' },
  { key: 'rt', label: 'Runtime', w: 'w-[120px]' },
  { key: 'fails', label: 'Where it fails', w: '', xl: true },
  { key: 'cite', label: 'Citation', w: 'w-[152px]' },
  { key: 'toggle', label: '', w: 'w-[40px]' },
];

function Row({ m, open, onToggle }: { m: MethodResult; open: boolean; onToggle: () => void }) {
  const n = matrixNotes(m);
  const lang = languageParts(m);
  return (
    <>
      <tr className={`group/row h-[52px] border-b border-line transition-colors duration-150 hover:bg-sunk/50 ${open ? 'bg-sunk/40' : ''}`}>
        <td className="pl-4 pr-2"><RankCell m={m} /></td>
        <th scope="row" className="min-w-0 px-3 py-2 text-left font-normal">
          <MethodLabel m={m} />
          <span className="mt-0.5 block truncate pl-4 text-xs text-ink-2" title={n.paradigm}>{n.paradigm}</span>
        </th>
        <td className="px-3">
          <span className="block text-[13px] text-ink-2">{lang[0]}</span>
          {lang[1] && <span className="block text-[11px] text-ink-3">{lang[1]}</span>}
        </td>
        <td className="px-3"><FidelityTag m={m} /></td>
        <td className="px-3"><APMark m={m} /></td>
        <td className="px-3">
          <span className="block font-mono text-[13px] text-ink tabular">{fmt.secs(m.runtimeS)}</span>
          <span className="block text-[11px] text-ink-3">{isGpu(m) ? 'per unit, T4 GPU' : 'per unit, CPU'}</span>
        </td>
        <td className="hidden px-3 xl:table-cell">
          <span className="line-clamp-2 text-[12.5px] leading-[1.4] text-ink-2" title={n.fails}>{n.fails}</span>
        </td>
        <td className="px-3">
          <span className="block truncate text-[12.5px] text-ink" title={m.citation}>{n.cite[0]}</span>
          <span className="block truncate text-[11px] text-ink-3">{n.cite[1]}</span>
        </td>
        <td className="pr-3 text-right"><Toggle m={m} open={open} onToggle={onToggle} /></td>
      </tr>
      {open && (
        <tr id={detailId(m)} className="border-b border-line bg-sunk/40">
          <td colSpan={COLS.length} className="px-4 pb-6 pt-2 lg:pl-[116px]"><Detail m={m} /></td>
        </tr>
      )}
    </>
  );
}

function MatrixTable({ isOpen, toggle }: { isOpen: (id: string) => boolean; toggle: (id: string) => void }) {
  return (
    <div className="hidden overflow-x-auto rounded-card border border-line bg-surface lg:block">
      <table className="w-full min-w-[952px] table-fixed border-collapse text-left">
        <caption className="sr-only">
          Ten methods grouped by role. Ranked published detectors carry leaderboard ranks 1 to 6. Reference methods are labelled by role and not ranked.
        </caption>
        <colgroup>{COLS.map((c) => <col key={c.key} className={c.w || undefined} />)}</colgroup>
        <thead>
          <tr className="h-10 border-b border-line bg-sunk">
            {COLS.map((c) => (
              <th key={c.key} scope="col" className={`label whitespace-nowrap px-3 font-normal first:pl-4 ${c.xl ? 'hidden xl:table-cell' : ''}`}>
                {c.label || <span className="sr-only">Details</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROLE_GROUPS.map((g) => (
            <Fragment key={g.key}>
              <tr className="border-b border-line bg-canvas">
                <th colSpan={COLS.length} scope="colgroup" className="px-4 py-2.5 text-left font-normal">
                  <span className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <span className="text-[13px] font-semibold text-ink">{g.title}</span>
                    <span className="font-mono text-[11px] text-ink-3 tabular">{g.methods.length}</span>
                    <span className="text-xs text-ink-2">{g.note}</span>
                  </span>
                </th>
              </tr>
              {g.methods.map((m) => <Row key={m.id} m={m} open={isOpen(m.id)} onToggle={() => toggle(m.id)} />)}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Cards (below lg) ---------- */

function MatrixCards({ isOpen, toggle }: { isOpen: (id: string) => boolean; toggle: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-8 lg:hidden">
      {ROLE_GROUPS.map((g) => (
        <section key={g.key} aria-label={g.title}>
          <div className="mb-3 border-b border-line pb-2">
            <p className="text-sm font-semibold text-ink">{g.title} <span className="font-mono text-[11px] font-normal text-ink-3">{g.methods.length}</span></p>
            <p className="mt-0.5 text-xs leading-snug text-ink-2">{g.note}</p>
          </div>
          <ul className="grid gap-3 md:grid-cols-2">
            {g.methods.map((m) => {
              const n = matrixNotes(m);
              const open = isOpen(m.id);
              return (
                <li key={m.id} className={`flex flex-col gap-2.5 rounded-card border border-line bg-surface p-4 ${open ? 'md:col-span-2' : ''}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-3"><RankCell m={m} /><MethodLabel m={m} /></span>
                    <FidelityTag m={m} />
                  </div>
                  <p className="text-xs text-ink-2">{n.paradigm} · {shortLanguage(m)}</p>
                  <dl className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <div className="flex items-center gap-2"><dt className="label">AP</dt><dd><APMark m={m} width="w-12" compact /></dd></div>
                    <div className="flex items-center gap-2">
                      <dt className="label">Runtime</dt>
                      <dd className="font-mono text-[13px] text-ink tabular">{fmt.secs(m.runtimeS)} <span className="font-sans text-[11px] text-ink-3">per unit, {isGpu(m) ? 'T4 GPU' : 'CPU'}</span></dd>
                    </div>
                  </dl>
                  <p className="text-[13px] leading-snug text-ink-2"><span className="label mr-1.5">Fails</span>{n.fails}</p>
                  <div className="-mb-2 flex items-center justify-between gap-3 border-t border-line pt-1">
                    <p className="min-w-0 truncate text-xs text-ink-3">{n.cite[0]}{n.cite[1] && ` · ${n.cite[1]}`}</p>
                    <Toggle m={m} open={open} onToggle={() => toggle(m.id)} wide />
                  </div>
                  {open && <div id={detailId(m)} className="border-t border-line pt-4"><Detail m={m} /></div>}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

/* ---------- Section ---------- */

export default function MethodMatrix() {
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set());
  const allOpen = open.size === ALL_IDS.length;
  const toggle = (id: string) => setOpen((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const isOpen = (id: string) => open.has(id);
  const fire = ROLE_GROUPS.find((g) => g.key === 'ranked')?.methods[0];
  const scCAD = ROLE_GROUPS.flatMap((g) => g.methods).find((m) => m.id === 'scCAD');
  const filteredUnits = G.trackAUnits - (scCAD ? parseInt(scCAD.trackAFallback, 10) : 0);

  return (
    <section id="matrix" aria-labelledby="matrix-h" className={`py-10 md:py-14 ${SECTION_SCROLL}`}>
      <Container>
        <Head id="matrix" label={`Method matrix · ${G.methodsIncluded} methods`} title="Ten methods, one contract"
          lead="Each method takes one AnnData unit and returns one continuous score per cell, so average precision needs no threshold. Rare means low-abundance malignant cells against immune, stromal and normal-epithelial background, not a rare biological sub-state." />

        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-ink-2" aria-label="Legend">
            <li className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="inline-grid size-5 place-items-center rounded-chip border border-line-strong font-mono text-[10px] text-ink">1</span>
              Leaderboard rank, published detectors only
            </li>
            <li className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="inline-block size-2.5 rounded-full border-[1.5px] border-dashed border-ink-2" />
              Dashed ring: reference method, not ranked
            </li>
            <li className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="inline-flex h-4 items-center rounded-chip border border-dashed border-warn/50 px-1 font-mono text-[10px] text-warn">Proxy</span>
              REACH wrapper, not the authors' package
            </li>
          </ul>
          <button type="button" onClick={() => setOpen(allOpen ? new Set() : new Set(ALL_IDS))}
            className="inline-flex h-9 items-center gap-1.5 rounded-chip border border-line bg-surface px-3 text-xs font-medium text-ink-2 transition-colors duration-150 hover:border-line-strong hover:text-ink">
            <Icon name={allOpen ? 'minus' : 'plus'} size={13} />
            {allOpen ? 'Collapse all' : 'Expand all'}
          </button>
        </div>

        <MatrixTable isOpen={isOpen} toggle={toggle} />
        <MatrixCards isOpen={isOpen} toggle={toggle} />

        <div className="mt-4 grid gap-x-10 gap-y-2 text-xs leading-relaxed text-ink-2 md:grid-cols-2">
          <p>
            Order: the ceiling, the six ranked detectors, then the references. Median AP is over Track A fallback-filtered units ({G.trackAUnits}, or {filteredUnits} for scCAD and DeepScena).
            Runtime is the mean per Track A unit. DeepScena ran on a Colab T4 GPU, so its time is not comparable with the CPU methods.
          </p>
          <p>
            {fire && <>{fire.method} has the highest median AP among the ranked published detectors ({fmt.ap(fire.medianAP)}). Whether that lead holds
            against the baselines is tested on the Leaderboard. <PairwiseLink /> </>}<span className="mt-2 block">† RareQ citation inferred from the reference list.</span>
          </p>
        </div>
      </Container>
    </section>
  );
}
