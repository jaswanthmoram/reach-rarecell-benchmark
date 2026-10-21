import { useState } from 'react';
import { cx } from '../../lib/format';
import { href } from '../../lib/router';
import { SectionHeader } from '../../ui/SectionHeader';
import { Reveal } from '../../ui/motion';
import { ArrowRight, Check, CircleAlert, ICON_STROKE, Info, RotateCcw, X } from '../../ui/icons';
import { methodOf } from './model';
import { Dot } from './parts';
import { label, nudge, sectionCls, textLink } from './ui';
import { useGlide } from '../../ui/motion/useGlide';
import { PRESET, QUESTIONS, SUMMARY, recommend, type Answers, type Fit } from './picker';

const FIT: Record<Fit, string> = { start: 'Start with', consider: 'Also consider', care: 'Use with care' };
const iconCls = 'mt-[3px] flex-none';
const pairLink = <a href={href('/leaderboard')} className={textLink}><span className="fx-underline">See pairwise tests</span><ArrowRight size={13} strokeWidth={ICON_STROKE} aria-hidden="true" className={nudge} /></a>;

function Questions({ a, set }: { a: Answers; set: (next: Answers) => void }) {
  return (
    <form onSubmit={(e) => e.preventDefault()} aria-label="Describe your data" className="flex min-w-0 flex-[0.95_1_400px] flex-col gap-7 self-start p-4 sm:p-6 min-[870px]:sticky min-[870px]:top-[calc(var(--header-h)+60px)]">
      {QUESTIONS.map((q) => (
        <fieldset key={q.key} className="m-0 min-w-0 border-0 p-0">
          <legend className="mb-3 text-[15px] font-semibold"><span className="mr-2 font-mono text-[11px] font-normal text-ink-3">{q.n}</span>{q.ask}</legend>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2">
            {q.opts.map((o) => {
              const on = a[q.key] === o.value;
              return (
                <label key={o.value} className={cx('m-opt relative flex min-h-11 cursor-pointer flex-col gap-0.5 rounded-card border px-3.5 py-3 transition-colors duration-150', on ? 'border-accent bg-accent-tint' : 'border-line bg-surface hover:border-line-strong')}>
                  <input type="radio" name={`picker-${q.key}`} value={o.value} checked={on} onChange={() => set({ ...a, [q.key]: o.value })} className="absolute m-0 size-px opacity-0" />
                  <span className="flex items-center justify-between gap-2 text-sm font-medium text-ink">
                    {o.title}
                    <span aria-hidden="true" className={cx('box-border inline-grid size-4 flex-none place-items-center rounded-full border transition-colors duration-[var(--dur-1)]', on ? 'border-accent bg-accent text-white' : 'border-line-strong bg-canvas text-transparent')}><Check size={10} strokeWidth={3} /></span>
                  </span>
                  <span className="text-xs font-normal leading-[1.4] text-ink-2">{o.hint}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
    </form>
  );
}

function Result({ a }: { a: Answers }) {
  const out = recommend(a);
  const groups = (['start', 'consider', 'care'] as Fit[]).map((f) => ({ f, picks: out.picks.filter((p) => p.fit === f) })).filter((g) => g.picks.length > 0);
  const count = out.picks.length === 1 ? 'One detector' : `${out.picks.length} detectors`;
  const glideRef = useGlide<HTMLDivElement>(`${a.lineage}-${a.compute}-${a.stability}`);
  return (
    <div className="min-w-0 flex-[1.05_1_420px] border-t border-line p-4 sm:p-6 min-[870px]:border-l min-[870px]:border-t-0">
      <div ref={glideRef} className="flex flex-col gap-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
          <p aria-live="polite" className="m-0 text-sm font-semibold">{count} for this situation</p>
          <p className={cx(label, 'm-0')}>{[SUMMARY[a.lineage], SUMMARY[a.compute], SUMMARY[a.stability]].join(' · ')}</p>
        </div>
        {groups.map((g) => (
          <section key={g.f} aria-label={FIT[g.f]} data-glide={`group-${g.f}`}>
            <p className={cx(label, 'm-0 mb-3', g.f === 'care' && 'text-warn')}>{FIT[g.f]}</p>
            <ol className="m-0 flex list-none flex-col p-0">
              {g.picks.map((p, i) => {
                const m = methodOf(p.id);
                const role = m.rank != null ? `Leaderboard rank ${m.rank} of 6` : `Reference, not ranked (${m.role})`;
                return (
                  <li key={p.id} data-glide={p.id} className={cx('relative bg-surface py-4', i === 0 ? 'pt-0' : 'border-t border-line')}>
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                      <span className="inline-flex items-center gap-2 font-mono text-[13px] font-medium"><Dot hue={m.hue} dashed={m.ref} />{m.name}</span>
                      <span className="font-mono text-xs">{m.rt} <span className="font-sans text-[11px] text-ink-3">{m.hw}</span></span>
                    </div>
                    <p className="mb-0 mt-1 text-xs leading-normal text-ink-3">{role} · {p.regime} · Scenario {p.scen.join(', ')}</p>
                    <ul className="m-0 mt-2.5 flex list-none flex-col gap-1 p-0">
                      {p.reasons.map((t) => (
                        <li key={t} className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-2"><Check size={13} strokeWidth={2.25} aria-hidden="true" className={cx(iconCls, 'text-ok')} /><span>{t}</span></li>
                      ))}
                      {p.caveats.map((c) => (
                        <li key={c.t} className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-2">
                          <CircleAlert size={13} strokeWidth={2} aria-hidden="true" className={cx(iconCls, 'text-warn')} />
                          <span><span className="sr-only">Caveat: </span>{c.t}{c.pw && <> {pairLink}</>}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
        <div data-glide="avoid" className="relative rounded-card border border-line bg-canvas p-4">
          <p className={cx(label, 'm-0 mb-2')}>Avoid</p>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {out.avoid.map((v) => (
              <li key={v.scenario} className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-2">
                <X size={13} strokeWidth={2} aria-hidden="true" className={cx(iconCls, 'text-bad')} /><span>{v.text} <span className="text-ink-3">(scenario {v.scenario})</span></span>
              </li>
            ))}
          </ul>
        </div>
        <ul data-glide="notes" className="relative m-0 flex list-none flex-col gap-1.5 p-0">
          {out.notes.map((t) => (
            <li key={t} className="flex items-start gap-2 text-xs leading-relaxed text-ink-2">
              <Info size={13} strokeWidth={ICON_STROKE} aria-hidden="true" className={cx(iconCls, 'mt-[2px] text-ink-3')} /><span>{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function MethodPicker() {
  const [a, setA] = useState<Answers>(PRESET);
  const isPreset = a.lineage === PRESET.lineage && a.compute === PRESET.compute && a.stability === PRESET.stability;
  return (
    <section id="guidance" aria-labelledby="guidance-h" className={sectionCls('last')}>
      <SectionHeader id="guidance-h" title="Which detector for which job"
        lede="The picker opens on the common case. Change any answer and the shortlist, drawn from the paper's four practitioner scenarios, updates. Expected AP is what was measured in that regime, not a promise for new data." />
      <Reveal>
      <div className="rounded-card border border-line bg-surface shadow-[var(--elev-1)]">
        <div className="flex items-center justify-between gap-3 border-b border-line py-1 pl-4 pr-3 sm:pl-5">
          <p className={cx(label, 'm-0')}>Method picker<span className="text-ink-2"> · {isPreset ? 'common case' : 'your answers'}</span></p>
          {/* aria-disabled, not disabled: the button keeps focus after a reset instead of dropping it to the body. */}
          <button type="button" onClick={() => { if (!isPreset) setA(PRESET); }} aria-disabled={isPreset}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-chip border-0 bg-transparent px-2 text-xs font-medium text-ink-2 transition-[background-color,color,transform,opacity] duration-[var(--dur-1)] aria-disabled:cursor-default aria-disabled:opacity-40 aria-[disabled=false]:cursor-pointer aria-[disabled=false]:hover:bg-sunk aria-[disabled=false]:hover:text-ink aria-[disabled=false]:active:scale-[0.97]"><RotateCcw size={13} strokeWidth={ICON_STROKE} aria-hidden="true" />Reset to preset</button>
        </div>
        <div className="flex flex-wrap">
          <Questions a={a} set={setA} />
          <Result a={a} />
        </div>
      </div>
      </Reveal>
      <a href={href('/reproduce')} className="fx-card fx-sheen group mt-12 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 px-5 py-5 text-ink no-underline sm:px-6">
        <span className="min-w-0 max-w-[68ch] text-[15px] leading-relaxed text-ink-2">Every number on this page comes from the 12-phase pipeline. Reproduce lists the command for each phase.</span>
        <span className="inline-flex flex-none items-center gap-1.5 text-[15px] font-medium text-accent-ink">Reproduce the paper<ArrowRight size={15} strokeWidth={ICON_STROKE} aria-hidden="true" className={nudge} /></span>
      </a>
    </section>
  );
}
