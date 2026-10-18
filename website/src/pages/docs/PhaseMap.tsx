// The twelve pipeline phases (docs/architecture.md, "Phase dependency DAG") as the same live gate band the page
// title carries. At rest it lights the two phases a Git checkout rebuilds (11 and 12); pointing at a phase in the
// list lights that phase's gate instead.
import { useState } from 'react';
import { GateBand } from './GateBand';
import { pad2 } from './nav';
import { PHASES, type PhaseMark } from './phases';

const SNAPSHOT_GATES = PHASES.filter((p) => p.mark === 'snapshot').map((p) => p.n);

const dot = (mark: Exclude<PhaseMark, null>): string =>
  mark === 'snapshot' ? 'border-accent bg-accent' : 'border-ink-3 bg-surface';

function Key({ mark, children }: { mark: Exclude<PhaseMark, null>; children: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full border ${dot(mark)}`} />
      {children}
    </span>
  );
}

export function PhaseMap() {
  const [hot, setHot] = useState<number | null>(null);
  return (
    <figure className="mt-8 overflow-hidden rounded-card border border-line bg-surface">
      <div className="border-b border-line bg-sunk px-3 pb-1 pt-3 sm:px-4">
        <GateBand gates={hot ? [hot] : SNAPSHOT_GATES} />
      </div>
      <ol aria-label="The twelve pipeline phases" className="grid grid-cols-1 gap-x-6 px-4 py-3 min-[360px]:grid-cols-2 md:grid-cols-3">
        {PHASES.map((p) => (
          <li key={p.n} onPointerEnter={() => setHot(p.n)} onPointerLeave={() => setHot(null)}
            className="flex min-h-8 items-start gap-2.5 rounded-chip py-1.5 text-sm leading-snug text-ink-2 transition-colors duration-150 hover:text-ink">
            <span className={`w-5 shrink-0 pt-px font-mono text-[11px] tabular-nums transition-colors duration-150 ${hot === p.n ? 'text-accent' : 'text-ink-3'}`}>{pad2(p.n)}</span>
            <span className="min-w-0 flex-1">{p.name}</span>
            {p.mark && <span aria-hidden="true" className={`mt-[5px] size-2.5 shrink-0 rounded-full border ${dot(p.mark)}`} />}
            {p.mark && <span className="sr-only">{p.mark === 'snapshot' ? ', reruns from Git snapshots' : ', output archived on Zenodo'}</span>}
          </li>
        ))}
      </ol>
      <figcaption className="flex flex-col gap-2 border-t border-line px-4 py-3 text-sm leading-relaxed text-ink-2">
        <span className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-2">
          <Key mark="snapshot">Reruns from Git snapshots</Key>
          <Key mark="archived">Output archived on Zenodo</Key>
        </span>
        <span>
          Source: <span className="font-mono text-[0.875em]">docs/architecture.md</span>. A Git checkout reruns phases 11 and 12
          from frozen CSVs. The Zenodo archives hold the outputs of phases 2, 4 to 8 and 10, so a full-data rerun starts at phase 11.
        </span>
      </figcaption>
    </figure>
  );
}
