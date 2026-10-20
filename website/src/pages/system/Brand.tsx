import { Icon, Lockup, Mark, Wordmark } from '../../ui';
import { Sub, SysSection, ThemePair, Usage, Well } from './kit';
import { cx } from './util';

const SIZES = [16, 24, 32, 64] as const;

function Dont({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <figure className="flex flex-col overflow-hidden rounded-card border border-line bg-surface">
      <div className="grid h-28 place-items-center border-b border-line bg-canvas">{children}</div>
      <figcaption className="flex items-start gap-2 px-3 py-2.5 text-xs leading-snug text-ink-2">
        <Icon name="x" size={13} className="mt-px shrink-0 text-bad" />{label}
      </figcaption>
    </figure>
  );
}

export function Brand() {
  return (
    <SysSection id="brand" title="Brand"
      lead="The mark is the benchmark’s question drawn as a plate: eight graphite cells around one signal cell, found by an open cobalt reticle. Edge cells read darker than the corners, so the eye lands in the middle.">
      <Sub title="Mark at every size" note="One 3×3 geometry at every size; cells stay distinct down to 16px">
        <div className="grid gap-3 sm:grid-cols-2">
          {(['light', 'dark'] as const).map((t) => (
            <div key={t} data-theme={t} className="rounded-card border border-line bg-canvas p-5">
              <p className="label mb-4">{t}</p>
              <div className="flex items-end justify-between gap-4">
                {SIZES.map((s) => (
                  <div key={s} className="flex flex-col items-center gap-3">
                    <Mark size={s} title={`REACH mark, ${s} pixels`} />
                    <span className="font-mono text-[11px] text-ink-3">{s}px</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Sub>

      <Sub title="Lockup" note="Mark + Geist 600 wordmark (+1.2% tracking) + Geist Mono descriptor">
        <ThemePair>{() => <Lockup size={32} />}</ThemePair>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Well dense label="nav, 22px"><Lockup size={22} /></Well>
          <Well dense label="compact, under 1024px"><Lockup size={22} descriptor={false} /></Well>
          <Well dense label="wordmark detail"><Wordmark size={44} /></Well>
        </div>
        <p className="mt-3 max-w-[66ch] text-sm leading-relaxed text-ink-2">
          The wordmark stays plain: the found cell lives in the mark only, so it never reads as a stray dot in the name.
          It is the only place the signal colour touches type.
        </p>
      </Sub>

      <Sub title="Clear space" note="x = mark height ÷ 2 on every side. Nothing enters the dashed area">
        <Well dots className="[&>div]:justify-center">
          <div className="relative p-4">
            <span aria-hidden="true" className="absolute inset-0 border border-dashed border-accent/70" />
            {/* x markers: one on the left edge, one on the top edge, each 16px = half the 32px mark */}
            <span aria-hidden="true" className="absolute left-0 top-1/2 flex w-4 -translate-y-1/2 flex-col items-center gap-0.5">
              <span className="font-mono text-[11px] leading-none text-accent">x</span><span className="h-px w-full bg-accent" />
            </span>
            <span aria-hidden="true" className="absolute left-[30px] top-0 flex h-4 items-center gap-1">
              <span className="h-full w-px bg-accent" /><span className="font-mono text-[11px] leading-none text-accent">x</span>
            </span>
            <span className="block outline outline-1 outline-line-strong"><Lockup size={32} /></span>
          </div>
        </Well>
      </Sub>

      <Sub title="Misuse" note="The signal marks the found cell and nothing else">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Dont label="Do not rotate or skew the grid"><span className="rotate-[18deg]"><Mark size={48} /></span></Dont>
          <Dont label="Do not recolour the signal or the reticle">
            <span className="[&_.fill-signal]:![fill:var(--accent)] [&_.stroke-accent]:![stroke:var(--signal)]"><Mark size={48} /></span>
          </Dont>
          <Dont label="Do not box the mark or set it in a badge">
            <span className="grid size-16 place-items-center rounded-card bg-accent"><span className="[&_.fill-ink-2]:fill-surface"><Mark size={40} /></span></span>
          </Dont>
          <Dont label="Do not stretch the lockup or add effects">
            <span className={cx('origin-center scale-x-[1.35] drop-shadow-lg')}><Lockup size={20} descriptor={false} /></span>
          </Dont>
        </div>
      </Sub>

      <Sub title="Use">
        <Usage>{`import { Mark, Lockup, Wordmark } from '../ui';
<Lockup size={22} link />            // nav: mark + wordmark + descriptor, links home
<Mark size={16} />                   // inline, footer, favicon (same 3×3 plate)
<Mark size={40} found={false} />     // empty and not-found states: no cell found
<Mark size={32} animated />          // what <Loader> renders`}</Usage>
        <p className="mt-3 text-sm text-ink-2">Favicon: <code className="font-mono text-[13px] text-ink">public/favicon.svg</code>, the 3×3 mark with its own light and dark fills.</p>
      </Sub>
    </SysSection>
  );
}
