import { useState } from 'react';
import { cx, fmt } from '../../lib/format';
import { href } from '../../lib/router';
import { SectionHeader } from '../../ui/SectionHeader';
import { Reveal } from '../../ui/motion';
import { ArrowRight, ChevronDown, ICON_STROKE, Minus, Plus } from '../../ui/icons';
import { FIRE_FAILS, METHODS, READING, type Method } from './model';
import { Dot } from './parts';
import { ghostBtn, label, nudge, sectionCls, textLink } from './ui';

const th = 'px-3 font-normal';

function Caret({ open }: { open: boolean }) {
  return (
    <span className="m-caret" aria-hidden="true" style={{ transform: open ? 'rotate(180deg)' : 'none' }}>
      <ChevronDown size={15} strokeWidth={ICON_STROKE} />
    </span>
  );
}

function ToggleBtn({ m, open, onToggle, controls }: { m: Method; open: boolean; onToggle: () => void; controls: string }) {
  return (
    <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={controls} aria-label={`Details for ${m.name}`}
      className="grid size-9 flex-none cursor-pointer place-items-center rounded-chip border border-line bg-surface text-ink-2 transition-[background-color,color,transform] duration-[var(--dur-1)] hover:bg-sunk hover:text-ink active:scale-[0.94]">
      <Caret open={open} />
    </button>
  );
}

function RankCell({ m }: { m: Method }) {
  return m.rank != null
    ? <span className="inline-grid size-6 place-items-center rounded-chip border border-line-strong font-mono text-xs font-semibold">{m.rank}</span>
    : <span className={label}>{m.role}</span>;
}

function FidelityTag({ m }: { m: Method }) {
  return m.fidelity === 'Proxy'
    ? <span className="inline-flex h-5 items-center rounded-chip border border-dashed border-[#d9b77a] px-1.5 font-mono text-[11px] text-warn">Proxy</span>
    : <span className="font-mono text-xs text-ink-2">Faithful</span>;
}

function ApStrip({ m }: { m: Method }) {
  const left = `${(Math.max(0, Math.min(1, m.d.medianAP)) * 100).toFixed(1)}%`;
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="w-10 text-right font-mono">{fmt.ap(m.d.medianAP)}</span>
      <span aria-hidden="true" className="relative inline-block h-3 w-[72px]">
        <span className="absolute inset-x-0 top-1.5 h-px bg-line-strong" />
        <span className="absolute top-0.5 -ml-1 box-border size-2 rounded-full"
          style={{ left, ...(m.ref ? { background: '#fff', border: `1.5px dashed ${m.hue}` } : { background: m.hue }) }} />
      </span>
    </span>
  );
}

const pairLink = <a href={href('/leaderboard')} className={textLink}><span className="fx-underline">See pairwise tests</span><ArrowRight size={13} strokeWidth={ICON_STROKE} aria-hidden="true" className={nudge} /></a>;

/** Expanded row: mechanism, failure mode, reading and the key numbers. */
function Detail({ m }: { m: Method }) {
  const d = m.d;
  const reading = READING[m.key];
  const nums = [
    { k: 'Mean AP', v: fmt.ap(d.meanAP), sub: 'Track A' },
    { k: 'AUROC', v: fmt.ap(d.auroc), sub: 'Track A mean' },
    { k: 'Degenerate', v: d.degenerateUnits, sub: 'constant-score units' },
    { k: 'Fallback', v: d.fallbackUnits, sub: 'units that fell back' },
    { k: 'Track F AP', v: fmt.ap(d.trackF01AP), sub: m.key === 'scmalignantfinder' ? 'at 0.1%, crc_lee only' : 'median at 0.1%' },
    { k: 'Mean AP, 95% CI', v: `${fmt.ap(d.bootAPLow)} to ${fmt.ap(d.bootAPHigh)}`, sub: '95% bootstrap, Track A' },
  ];
  const head = cx(label, 'm-0 mb-1.5');
  return (
    <div className="rise flex flex-wrap [animation-duration:var(--dur-2)] gap-x-8 gap-y-6">
      <div className="min-w-0 flex-[1.1_1_260px]">
        <p className={head}>Mechanism</p>
        <p className="m-0 text-sm leading-relaxed text-ink">{d.mechanism}</p>
        <p className={cx(head, 'mt-4')}>Paradigm</p>
        <p className="m-0 text-sm leading-relaxed text-ink-2">{m.auditParadigm} · {m.langFull}</p>
      </div>
      <div className="min-w-0 flex-[1_1_260px]">
        <p className={head}>Where it fails</p>
        <p className="m-0 text-sm leading-relaxed text-ink-2">{m.key === 'fire' ? FIRE_FAILS : d.failureMode}</p>
        {reading && (<><p className={cx(head, 'mt-4')}>Reading</p><p className="m-0 text-sm leading-relaxed text-ink-2">{reading}</p></>)}
        {(m.key === 'fire' || m.key === 'expr_threshold') && <p className="mb-0 mt-3 text-sm">{pairLink}</p>}
      </div>
      <div className="flex min-w-0 flex-[0_1_300px] flex-col gap-3 sm:min-w-[240px]">
        <dl className="m-0 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line">
          {nums.map((n) => (
            <div key={n.k} className="bg-surface px-3 py-2.5">
              <dt className={label}>{n.k}</dt>
              <dd className="m-0 mt-1 font-mono text-[13px] text-ink">{n.v}</dd>
              <dd className="m-0 text-[11px] leading-[1.3] text-ink-3">{n.sub}</dd>
            </div>
          ))}
        </dl>
        <p className="m-0 text-xs leading-normal text-ink-2">{d.citation}</p>
        <a href={href('/leaderboard')} className={cx(textLink, 'min-h-10 self-start text-sm')}><span className="fx-underline">Leaderboard row</span><ArrowRight size={14} strokeWidth={ICON_STROKE} aria-hidden="true" className={nudge} /></a>
      </div>
    </div>
  );
}

function TableRows({ m, open, onToggle }: { m: Method; open: boolean; onToggle: () => void }) {
  return (
    <>
      <tr className={cx('h-[52px] border-t border-line transition-colors duration-150 hover:bg-[var(--row-hover)]', open && 'bg-[var(--row-hover)]')}>
        <td className="pl-4 pr-3"><RankCell m={m} /></td>
        <th scope="row" className="px-3 py-2 font-normal">
          <span className="inline-flex items-center gap-2 font-mono font-medium"><Dot hue={m.hue} dashed={m.ref} />{m.name}</span>
          <span className="mt-0.5 block pl-4 text-xs text-ink-2">{m.paradigm}</span>
        </th>
        <td className="px-3 text-ink-2">{m.lang}</td>
        <td className="px-3"><FidelityTag m={m} /></td>
        <td className="px-3"><ApStrip m={m} /></td>
        <td className="whitespace-nowrap px-3"><span className="block font-mono">{m.rt}</span><span className="block text-[11px] text-ink-3">{m.hw}</span></td>
        <td className="max-w-[260px] px-3 text-ink-2">{m.fails}</td>
        <td className="px-3"><span className="block">{m.cite}</span><span className="block text-[11px] text-ink-3">{m.venue}</span></td>
        <td className="pl-1 pr-3 text-right"><ToggleBtn m={m} open={open} onToggle={onToggle} controls={`method-detail-${m.key}`} /></td>
      </tr>
      {/* Always rendered so aria-controls resolves; hidden while closed. */}
      <tr id={`method-detail-${m.key}`} hidden={!open} className="border-t border-line bg-[var(--row-hover)]">
        <td colSpan={9} className="pb-6 pl-14 pr-4 pt-4"><Detail m={m} /></td>
      </tr>
    </>
  );
}

/** Phone layout (States board, 390 px): one card per method. */
function Card({ m, open, onToggle }: { m: Method; open: boolean; onToggle: () => void }) {
  return (
    <li className={cx('rounded-card border border-line p-4', open ? 'bg-[var(--row-hover)]' : 'bg-surface')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <span className="flex flex-wrap items-center gap-2.5">
            <RankCell m={m} />
            <span className="inline-flex items-center gap-2 font-mono text-[13px] font-medium"><Dot hue={m.hue} dashed={m.ref} />{m.name}</span>
            {m.fidelity === 'Proxy' && <FidelityTag m={m} />}
          </span>
          <span className="text-xs text-ink-2">{m.paradigm} · {m.lang}</span>
          <span className="font-mono text-[13px]">AP {fmt.ap(m.d.medianAP)} · {m.rt} {m.hw}</span>
          <span className="text-xs leading-normal text-ink-2">{m.fails}</span>
        </div>
        <ToggleBtn m={m} open={open} onToggle={onToggle} controls={`method-card-${m.key}`} />
      </div>
      <div id={`method-card-${m.key}`} hidden={!open} className="mt-4 border-t border-line pt-4"><Detail m={m} /></div>
    </li>
  );
}

export function MethodMatrix() {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const allOpen = METHODS.every((m) => open[m.key]);
  const toggle = (k: string) => () => setOpen((o) => ({ ...o, [k]: !o[k] }));
  const toggleAll = () => setOpen(allOpen ? {} : Object.fromEntries(METHODS.map((m) => [m.key, true])));
  return (
    <section id="matrix" aria-labelledby="matrix-h" className={sectionCls('first')}>
      <SectionHeader id="matrix-h" title="Ten methods, one contract"
        lede="Each method takes one AnnData unit and returns one continuous score per cell, so average precision needs no threshold. Rare means low-abundance malignant cells against immune, stromal and normal-epithelial background, not a rare biological sub-state." />
      <Reveal>
      {/* Table caption bar: what the table is on the left, the one table-wide action on the right. */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-[13px] text-ink-2"><span className="font-medium text-ink">Method matrix</span> · {METHODS.length} methods in leaderboard order. Open a row for its mechanism and key numbers.</p>
        <button type="button" onClick={toggleAll} className={ghostBtn}>{allOpen ? <Minus size={14} strokeWidth={ICON_STROKE} aria-hidden="true" /> : <Plus size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />}{allOpen ? 'Collapse all' : 'Expand all'}</button>
      </div>
      <div className="hidden overflow-x-auto rounded-card border border-line bg-surface md:block">
        <table className="w-full min-w-[1020px] border-collapse text-left text-[13px]">
          <caption className="sr-only">Ten methods in page order: the supervised ceiling, the six ranked published detectors, then the references. Use Details to open a row.</caption>
          <thead>
            <tr className="h-10 bg-sunk font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3">
              <th scope="col" className="pl-4 pr-3 font-normal">Rank</th><th scope="col" className={th}>Method · paradigm</th><th scope="col" className={th}>Language</th>
              <th scope="col" className={th}>Fidelity</th><th scope="col" className={th}>Median AP</th><th scope="col" className={th}>Runtime</th>
              <th scope="col" className={th}>Where it fails</th><th scope="col" className={th}>Citation</th><th scope="col" className="pl-1 pr-4 font-normal"><span className="sr-only">Details</span></th>
            </tr>
          </thead>
          <tbody>{METHODS.map((m) => <TableRows key={m.key} m={m} open={!!open[m.key]} onToggle={toggle(m.key)} />)}</tbody>
        </table>
      </div>
      <ul aria-label="Methods" className="m-0 flex list-none flex-col gap-2 p-0 md:hidden">
        {METHODS.map((m) => <Card key={m.key} m={m} open={!!open[m.key]} onToggle={toggle(m.key)} />)}
      </ul>
      <ul aria-label="Key" className="m-0 mt-3 flex list-none flex-wrap gap-x-5 gap-y-1 p-0 text-xs text-ink-2">
        <li className="inline-flex items-center gap-2"><span aria-hidden="true" className="inline-grid size-5 place-items-center rounded-chip border border-line-strong font-mono text-[11px] text-ink">1</span>Leaderboard rank, published detectors only</li>
        <li className="inline-flex items-center gap-2"><Dot hue="var(--ink-2)" dashed />Dashed ring: reference method, not ranked</li>
        <li className="inline-flex items-center gap-2"><span aria-hidden="true" className="inline-flex h-4 items-center rounded-chip border border-dashed border-[#d9b77a] px-1 font-mono text-[11px] text-warn">Proxy</span>REACH wrapper, not the authors' package</li>
      </ul>
      <p className="mb-0 mt-2 max-w-[110ch] text-xs leading-relaxed text-ink-2">
        The ceiling first, then the six ranked detectors and the references. Median AP is over Track A fallback-filtered units (160, or 140 for scCAD and DeepScena). Runtime is the mean per Track A unit; DeepScena ran on a Colab T4 GPU, so its time is not comparable with the CPU methods. {pairLink}
      </p>
      </Reveal>
    </section>
  );
}
