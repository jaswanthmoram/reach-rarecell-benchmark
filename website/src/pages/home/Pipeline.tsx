import { useRef, useState, type KeyboardEvent } from 'react';
import { href } from '../../app/router';
import { PIPELINE_PHASES } from '../../data/benchmarkData';
import { Button, Container, CopyButton, Icon, type IconName } from '../../ui';
import { G } from './facts';

type Phase = (typeof PIPELINE_PHASES)[number];
interface Stage { name: string; phases: Phase[]; numbers: number[] }

/** "Phase 04–08" -> [4,5,6,7,8]; "Phase 11" -> [11]. */
const phaseNumbers = (label: string): number[] => {
  const [a, b] = (label.match(/\d+/g) ?? []).map(Number);
  if (a === undefined) return [];
  return b === undefined ? [a] : Array.from({ length: b - a + 1 }, (_, i) => a + i);
};
const pad = (n: number) => String(n).padStart(2, '0');

const STAGES: Stage[] = Array.from(new Set(PIPELINE_PHASES.map((p) => p.stage))).map((name) => {
  const phases = PIPELINE_PHASES.filter((p) => p.stage === name);
  return { name, phases, numbers: phases.flatMap((p) => phaseNumbers(p.phase)) };
});
const STAGE_ICON: Record<string, IconName> = { Prep: 'database', Tracks: 'stack', Methods: 'flask', Exec: 'cpu', Eval: 'chart-bar' };

/** Phase 00 is the environment lock; the paper counts phases 01 to 12. */
const counted = (s: Stage) => s.numbers.filter((n) => n > 0);
const range = (s: Stage) => {
  const lo = Math.min(...s.numbers); const hi = Math.max(...s.numbers);
  return lo === hi ? `Phase ${pad(lo)}` : `Phases ${pad(lo)}–${pad(hi)}`;
};

/** Five equal stage cards act as tabs; the panel lists that stage's phases with wrapping, copyable commands. */
function StageExplorer() {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const stage = STAGES[active];
  const go = (i: number) => {
    const n = (i + STAGES.length) % STAGES.length;
    setActive(n); tabs.current[n]?.focus();
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const map: Record<string, number> = { ArrowRight: active + 1, ArrowDown: active + 1, ArrowLeft: active - 1, ArrowUp: active - 1, Home: 0, End: STAGES.length - 1 };
    if (e.key in map) { e.preventDefault(); go(map[e.key]); }
  };
  if (!stage) return null;
  return (
    <div className="reveal">
      <div role="tablist" aria-label="Pipeline stages" onKeyDown={onKey} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {STAGES.map((s, i) => {
          const on = i === active;
          const n = counted(s).length;
          return (
            <button key={s.name} ref={(el) => { tabs.current[i] = el; }} type="button" role="tab" id={`stage-tab-${i}`}
              aria-selected={on} aria-controls="stage-panel" tabIndex={on ? 0 : -1} onClick={() => setActive(i)}
              className={`group relative flex h-full min-h-36 flex-col rounded-card border p-4 text-left transition-[border-color,background,transform] duration-150 active:translate-y-px max-sm:last:col-span-2 ${on ? 'border-ink bg-surface' : 'border-line bg-canvas hover:border-line-strong hover:bg-surface'}`}>
              <span className="flex items-center justify-between gap-2">
                <Icon name={STAGE_ICON[s.name] ?? 'flow-arrow'} size={18} className={on ? 'text-ink' : 'text-ink-3'} />
                <span className="font-mono text-[11px] text-ink-3 tabular">{pad(i + 1)}</span>
              </span>
              <span className="mt-auto pt-6 text-base font-semibold tracking-[-0.01em] text-ink">{s.name}</span>
              <span className="mt-1 flex items-baseline gap-1.5 font-mono text-xs text-ink-2 tabular">
                <span className="text-ink">{n}</span>{n === 1 ? 'phase' : 'phases'}
                {s.numbers.includes(0) && <span className="text-ink-3">+ env lock</span>}
              </span>
              <span className="mt-0.5 font-mono text-[11px] text-ink-3 tabular">{range(s)}</span>
              <span aria-hidden="true" className={`absolute inset-x-4 -bottom-px h-0.5 rounded-full bg-ink transition-opacity duration-150 ${on ? 'opacity-100' : 'opacity-0'}`} />
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id="stage-panel" aria-labelledby={`stage-tab-${active}`} tabIndex={0}
        className="mt-4 overflow-hidden rounded-card border border-line bg-canvas focus-visible:border-accent">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-4 py-3 sm:px-5">
          <p className="label"><span className="text-ink">{pad(active + 1)}</span> · {stage.name} · {range(stage)}</p>
          <p className="font-mono text-[11px] text-ink-3">one command per step</p>
        </div>
        <ol key={stage.name} className="fade-in divide-y divide-line">
          {stage.phases.map((p) => (
            <li key={p.phase} className="grid gap-x-8 gap-y-3 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
              <div className="min-w-0">
                <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-mono text-[11px] text-ink-3 tabular">{p.phase}</span>
                  <span className="text-sm font-medium text-ink">{p.title}</span>
                </p>
                <p className="mt-1.5 max-w-[60ch] text-sm leading-relaxed text-ink-2">{p.desc}</p>
              </div>
              <div className="flex min-w-0 items-start gap-2 rounded-chip border border-line bg-sunk py-1.5 pl-3 pr-1.5">
                <code className="min-w-0 flex-1 whitespace-pre-wrap break-words py-1 font-mono text-[12px] leading-relaxed text-ink [overflow-wrap:anywhere]">
                  <span aria-hidden="true" className="select-none text-ink-3">$ </span>{p.cmd}
                </code>
                <CopyButton text={p.cmd} toast="Command copied" />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/** Ground truth in one line; the four arms are laid out on Datasets. */
function EvidenceArms() {
  return (
    <p className="mt-16 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-8 text-base leading-relaxed text-ink-2">
      <span>Phase 03 labels a cell malignant only when all four evidence arms agree.</span>
      <Button href={href('/datasets')} variant="ghost" size="sm" iconRight="arrow-right" className="-ml-3">How labels are built</Button>
    </p>
  );
}

export default function Pipeline() {
  return (
    <section id="how-it-works" aria-labelledby="how-it-works-h" className="border-t border-line bg-surface py-20 md:py-28">
      <Container>
        <div className="reveal mb-14 max-w-[62ch]">
          <p className="label mb-3">Pipeline · {G.pipelinePhases} phases</p>
          <h2 id="how-it-works-h" className="text-3xl font-semibold tracking-[-0.025em] text-ink md:text-[2.75rem] md:leading-[1.08]">How it works</h2>
          <p className="mt-4 text-base leading-relaxed text-ink-2 md:text-lg">Phase 00 locks the environment, then {G.pipelinePhases} phases run in {STAGES.length} stages. Pick a stage to see its commands. Tables and figures regenerate from frozen snapshots.</p>
          <Button href={href('/docs', 'section=reproduce')} variant="ghost" size="sm" iconRight="arrow-right" className="-ml-3 mt-4">Every phase, explained</Button>
        </div>
        <StageExplorer />
        <EvidenceArms />
      </Container>
    </section>
  );
}
