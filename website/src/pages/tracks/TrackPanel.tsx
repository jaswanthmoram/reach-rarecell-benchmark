import { cx } from '../../lib/format';
import { absoluteHref, href, preloadRoute } from '../../lib/router';
import { Check, Copy, ICON_STROKE } from '../../ui/icons';
import { useCopy } from '../../ui/useCopy';
import { DotChart } from './DotChart';
import { swatch } from './swatch';
import { PANEL_ID, chartFor, tabId, trackOf, type Letter } from './model';

const COPY_OPTS = { resetMs: 1600 } as const;

function CopyLink({ letter, code }: { letter: Letter; code: string }) {
  const copier = useCopy(COPY_OPTS);
  const copy = () => {
    const url = absoluteHref('/tracks', `track=${letter.toLowerCase()}`);
    void copier.copy(url, letter);
  };
  // Keyed by letter: a tab switch does not carry the last track's "Copied" over.
  const st = copier.stateOf(letter);
  const label = st === 'copied' ? 'Copied' : st === 'failed' ? 'Copy failed' : 'Copy link';
  const Icon = st === 'copied' ? Check : Copy;
  return (
    <button type="button" onClick={copy} aria-label={`Copy link to ${code}`}
      className="ml-auto inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-chip border border-line bg-surface px-2.5 text-[13px] text-ink-2 transition-[border-color,color,transform] duration-[var(--dur-1)] hover:border-line-strong hover:text-ink active:translate-y-px">
      <Icon size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
      <span aria-live="polite">{label}</span>
    </button>
  );
}

export function TrackPanel({ active }: { active: Letter }) {
  const t = trackOf(active);
  const chart = chartFor(active);
  const primary = t.letter === 'A';
  return (
    <article role="tabpanel" id={PANEL_ID} aria-labelledby={tabId(t.letter)} tabIndex={0}
      className="relative flex min-w-0 flex-col overflow-hidden rounded-card border border-line bg-surface shadow-[var(--elev-1)]">
      <div className="flex min-w-0 flex-col gap-5 px-[clamp(16px,4vw,28px)] py-4 sm:py-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-grid size-7 place-items-center rounded-chip border border-ink font-mono text-sm font-semibold">{t.letter}</span>
          <span className={`rounded-chip border px-1.5 py-[3px] font-mono text-[11px] ${primary ? 'border-[#c9d5fb] bg-accent-tint text-accent-ink' : 'border-line bg-[var(--chip-active)] text-ink-2'}`}>{t.reading}</span>
          <CopyLink letter={t.letter} code={t.code} />
        </div>
        <div>
          <h3 className="m-0 text-xl font-semibold tracking-[-0.02em] text-balance sm:text-[28px]">{t.code}: {t.name}</h3>
          <p className="m-0 mt-2 max-w-[72ch] text-sm leading-relaxed text-ink-2">{t.subtitle}</p>
        </div>
        <p className="m-0 max-w-[72ch] text-base leading-relaxed">{t.finding}</p>

        {t.top && (
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <span className="w-40 flex-none text-[13px] font-medium text-ink-2">{t.top.label}</span>
            <div className="min-w-0 flex-[1_1_260px]">
              <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0">
                {t.top.items.map((p) => (
                  <li key={p.name} className="inline-flex items-baseline gap-2">
                    <span className="inline-flex items-center gap-1.5 font-mono text-[13px]"><span style={swatch(p.color, p.ref)} />{p.name}</span>
                    <span className="tabular font-mono text-[13px] font-semibold">{p.value}</span>
                    <span className="text-xs text-ink-3">{p.note}</span>
                  </li>
                ))}
              </ul>
              {(t.top.note || t.top.link) && (
                <p className="m-0 mt-1.5 text-xs leading-normal text-ink-2">
                  {t.top.note}
                  {t.top.link && <> <a href={href('/methods')} onPointerEnter={() => preloadRoute('/methods')} onFocus={() => preloadRoute('/methods')} className="fx-underline text-accent-ink">Read the method notes</a>.</>}
                </p>
              )}
            </div>
          </div>
        )}

        <DotChart chart={chart} letter={t.letter} />

        <dl className="m-0 grid grid-cols-2 gap-x-6 border-y border-line py-4 sm:grid-cols-4 sm:gap-x-8">
          {t.stats.map((s, i) => (
            <div key={s.label} className={cx('row-span-3 grid min-w-0 grid-rows-subgrid gap-y-1', i > 1 && 'max-sm:mt-4')}>
              <dt className="self-end text-xs text-ink-3">{s.label}</dt>
              <dd className="tabular m-0 text-lg font-semibold leading-tight tracking-[-0.02em] sm:text-xl">{s.value}</dd>
              <dd className="m-0 text-xs leading-[1.4] text-ink-2">{s.sub}</dd>
            </div>
          ))}
        </dl>
      </div>

      <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-x-8 gap-y-5 border-t border-line bg-canvas px-[clamp(16px,4vw,28px)] py-5">
        <div>
          <dt className="mb-1.5 text-[13px] font-semibold text-ink">Objective</dt>
          <dd className="m-0 text-sm leading-relaxed text-ink-2">{t.objective}</dd>
        </div>
        <div>
          <dt className="mb-1.5 text-[13px] font-semibold text-ink">Construction</dt>
          <dd className="m-0 text-sm leading-relaxed text-ink-2">{t.methodology}</dd>
        </div>
      </dl>
    </article>
  );
}
