import { href, preloadRoute } from '../../lib/router';
import { ArrowRight, ICON_STROKE } from '../../ui/icons';
import { factsOf, type Row } from './model';
import { MONO_LABEL } from './parts';

/** Expanded row: role, mechanism, failure mode, citation and the audit facts (board order). */
export function Details({ row }: { row: Row }) {
  const { m } = row;
  return (
    <div className="flex flex-wrap gap-x-10 gap-y-6">
      <div className="flex min-w-0 flex-[1.2_1_320px] flex-col gap-3.5">
        <p className={`m-0 ${MONO_LABEL} text-ink-2`}>{m.roleRankLabel}</p>
        <div>
          <p className={`m-0 mb-1.5 ${MONO_LABEL} text-ink-3`}>Mechanism</p>
          <p className="m-0 max-w-[68ch] text-sm leading-[1.6] text-ink-2">{m.mechanism}</p>
        </div>
        <div>
          <p className={`m-0 mb-1.5 ${MONO_LABEL} text-ink-3`}>Failure mode</p>
          <p className="m-0 max-w-[68ch] text-sm leading-[1.6] text-ink-2">{m.failureMode}</p>
        </div>
        <p className="m-0 text-xs leading-[1.6] text-ink-2"><span className={`mr-2 ${MONO_LABEL} text-ink-3`}>Citation</span>{m.citation}</p>
      </div>
      <dl className="m-0 flex min-w-0 flex-[1_1_300px] flex-col gap-2.5">
        {factsOf(m).map((f) => (
          <div key={f.k} className="flex flex-wrap gap-x-4 gap-y-0.5">
            <dt className={`flex-[0_0_132px] pt-px ${MONO_LABEL} text-ink-3`}>{f.k}</dt>
            <dd className="m-0 min-w-0 flex-[1_1_180px] font-mono text-xs leading-[1.6] text-ink tabular-nums">{f.v}</dd>
          </div>
        ))}
        <div>
          <dt className="sr-only">More</dt>
          <dd className="m-0"><a href={href('/methods')} onPointerEnter={() => { void preloadRoute('/methods'); }} onFocus={() => { void preloadRoute('/methods'); }}
            className="lb-btn group inline-flex min-h-10 items-center gap-1 rounded-chip text-xs font-medium">
            Method audit<ArrowRight size={13} strokeWidth={ICON_STROKE} aria-hidden="true" className="transition-transform duration-[var(--dur-1)] group-hover:translate-x-0.5" />
          </a></dd>
        </div>
      </dl>
    </div>
  );
}
