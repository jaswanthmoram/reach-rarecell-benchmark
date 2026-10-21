import { useRef, useState, type KeyboardEvent } from 'react';
import { GLOBAL_STATS as G } from '../../data/benchmarkData';
import { cx } from '../../lib/format';
import { href, preloadRoute } from '../../lib/router';
import { ArrowRight, Check, Copy, ICON_STROKE } from '../../ui/icons';
import { SectionHeader } from '../../ui/SectionHeader';
import { useCopy, type CopyState } from '../../ui/useCopy';
import { STAGES } from './model';

const COPY_OPTS = { resetMs: 1600 } as const;

function CopyButton({ cmd, state, onCopy }: { cmd: string; state: CopyState; onCopy: (c: string) => void }) {
  const ok = state === 'copied';
  const text = ok ? 'Copied' : state === 'failed' ? 'Copy blocked' : 'Copy';
  const Icon = ok ? Check : Copy;
  const label = ok ? 'Command copied' : state === 'failed' ? 'Copying is blocked in this browser; select the command to copy it' : `Copy command: ${cmd}`;
  return (
    <button type="button" onClick={() => onCopy(cmd)} aria-label={label}
      className={cx('inline-flex min-h-8 min-w-[84px] flex-none cursor-pointer items-center justify-center gap-1.5 rounded-chip border border-line-strong bg-surface px-2.5 font-sans text-xs font-medium hover:bg-sunk', ok ? 'text-ok' : 'text-ink')}>
      <Icon size={13} strokeWidth={ICON_STROKE} aria-hidden="true" />
      <span aria-live="polite">{text}</span>
    </button>
  );
}

export function Pipeline() {
  const [active, setActive] = useState(0);
  const copier = useCopy(COPY_OPTS);
  const copy = (cmd: string) => { void copier.copy(cmd, cmd); };
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const cur = STAGES[active];

  const pick = (i: number, focus = false) => {
    setActive(i);
    copier.reset();
    if (focus) tabs.current[i]?.focus();
  };
  const onKey = (e: KeyboardEvent) => {
    const last = STAGES.length - 1;
    const next = { ArrowRight: active === last ? 0 : active + 1, ArrowLeft: active === 0 ? last : active - 1, Home: 0, End: last }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    pick(next, true);
  };

  return (
    <section id="run" aria-labelledby="p-h" className="border-t border-line px-4 pb-12 pt-16 sm:px-6 sm:pb-16 sm:pt-20">
      <div className="mx-auto max-w-[1240px]">
        <SectionHeader id="p-h" title="Run it yourself"
          lede={`Phase 00 locks the environment, then ${G.pipelinePhases} phases run in ${STAGES.length} stages. Pick a stage to see its commands. Tables and figures regenerate from frozen snapshots.`}
          actions={(
            <a href={href('/reproduce')} onPointerEnter={() => void preloadRoute('/reproduce')} className="hm-link hm-ul group inline-flex min-h-11 items-center gap-1 text-sm font-medium hover:text-ink">
              <span className="fx-underline">Every phase, explained</span><ArrowRight size={14} strokeWidth={ICON_STROKE} aria-hidden="true" className="hm-nudge" />
            </a>
          )} />
        <div role="tablist" aria-label="Pipeline stages" onKeyDown={onKey} className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
          {STAGES.map((s, i) => {
            const on = i === active;
            return (
              <button key={s.name} ref={(el) => { tabs.current[i] = el; }} type="button" role="tab" id={`stage-tab-${i}`}
                aria-selected={on} aria-controls="stage-panel" tabIndex={on ? 0 : -1} onClick={() => pick(i)}
                className={cx(
                  'hm-stage relative flex min-h-28 cursor-pointer flex-col items-start rounded-card border bg-surface p-4 text-left font-[inherit] text-ink',
                  on ? 'hm-stage-on' : 'border-line hover:border-line-strong',
                )}>
                <span className="flex w-full justify-between gap-2">
                  <span className="text-base font-semibold tracking-[-0.01em]">{s.name}</span>
                  <span className="font-mono text-[11px] text-ink-3">{s.num}</span>
                </span>
                <span className="mt-5 font-mono text-xs text-ink-2">
                  <span className="text-ink">{s.count}</span> {s.count === 1 ? 'phase' : 'phases'}<span className="text-ink-3">{s.hasLock ? ' + env lock' : ''}</span>
                </span>
                <span className="mt-0.5 font-mono text-[11px] text-ink-3">{s.range}</span>
                <span aria-hidden="true" className={cx('absolute inset-x-4 -bottom-px h-0.5 rounded-full bg-accent transition-opacity duration-150', on ? 'opacity-100' : 'opacity-0')} />
              </button>
            );
          })}
        </div>
        <div role="tabpanel" id="stage-panel" aria-labelledby={`stage-tab-${active}`} tabIndex={0} className="card mt-4 overflow-hidden focus-visible:outline-offset-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-3">
            <p className="eyebrow m-0"><span className="text-ink">{cur.num}</span> · {cur.name} · {cur.range}</p>
            <p className="m-0 font-mono text-[11px] text-ink-3">one command per step</p>
          </div>
          <ol key={cur.name} className="m-0 list-none p-0">
            {cur.phases.map((p, j) => (
              <li key={p.phase} className={cx('flex flex-wrap gap-x-8 gap-y-3 px-5 py-4', j > 0 && 'border-t border-line')}>
                <div className="min-w-0 flex-[1_1_320px]">
                  <p className="m-0 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-mono text-[11px] text-ink-3">{p.phase}</span>
                    <span className="text-sm font-medium">{p.title}</span>
                  </p>
                  <p className="m-0 mt-1.5 max-w-[60ch] text-sm leading-relaxed text-ink-2">{p.desc}</p>
                </div>
                <div className="flex min-w-0 flex-[1.1_1_320px] items-start gap-2 rounded-chip border border-line bg-[var(--row-hover)] py-1.5 pl-3 pr-1.5">
                  <code className="min-w-0 flex-1 overflow-x-auto whitespace-pre py-1 font-mono text-xs leading-relaxed text-ink">
                    <span aria-hidden="true" className="text-ink-3">$ </span>{p.cmd}
                  </code>
                  <CopyButton cmd={p.cmd} state={copier.stateOf(p.cmd)} onCopy={copy} />
                </div>
              </li>
            ))}
          </ol>
        </div>
        <p className="m-0 mt-10 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px] leading-relaxed text-ink-2">
          <span>Phase 03 labels a cell malignant only when all four evidence arms agree.</span>
          <a href={href('/datasets')} onPointerEnter={() => void preloadRoute('/datasets')} className="hm-link hm-ul group inline-flex min-h-11 items-center gap-1 text-sm font-medium hover:text-ink">
            <span className="fx-underline">How labels are built</span><ArrowRight size={14} strokeWidth={ICON_STROKE} aria-hidden="true" className="hm-nudge" />
          </a>
        </p>
      </div>
    </section>
  );
}
