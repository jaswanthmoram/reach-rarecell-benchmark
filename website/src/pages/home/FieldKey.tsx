import type { CSSProperties } from 'react';
import { MOTION_REDUCE, useMotionPaused } from '../../ui/motion';
import { FIELD_COHORTS, RARE_PER_COHORT, RARE_TOTAL, ringTally, type RankRow } from './model';
import { useMedia } from '../../ui/useMedia';

const SLOTS = Array.from({ length: RARE_PER_COHORT }, (_, j) => j);
const UNSCORED_DOT: CSSProperties = { border: '1.5px dashed var(--line-strong)', opacity: 0.6 };

function dot(hot: RankRow | null, found: number | null, j: number): CSSProperties {
  if (!hot) return { background: 'var(--signal)', border: '1.5px solid var(--signal)' };
  if (found == null) return UNSCORED_DOT;
  if (j >= found) return { border: '1.5px solid var(--line-strong)' };
  return hot.isRef ? { border: `1.5px dashed ${hot.color}` } : { background: hot.color, border: `1.5px solid ${hot.color}` };
}

const list = (xs: readonly string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const unscoredOf = (row: RankRow) => FIELD_COHORTS.filter((_, k) => row.found[k] == null);

/** The words after "<name> rings <n> of <m>" for the highlighted method (null when it has no Track A score here). */
function tail(row: RankRow) {
  const { ringed, of, cohorts } = ringTally(row);
  if (of === 0) return null;
  const off = unscoredOf(row);
  const offText = off.length ? ` ${list(off)} ${off.length === 1 ? 'is' : 'are'} not scored on Track A.` : '';
  const how = ringed === 0 ? `every scored cohort stays at 0 of ${RARE_PER_COHORT}.` : 'three times its mean AP on each, rounded.';
  return ` rare cells on the ${cohorts} Track A cohorts: ${how}${offText} Illustrative, not per-cell output.`;
}

function summary(row: RankRow) {
  const { ringed, of } = ringTally(row);
  const t = tail(row);
  return t ? `${row.name} rings ${ringed} of ${of}${t}` : `${row.name} has no Track A score on these cohorts.`;
}

/** Key to the live field (`bare` when it sits inside the field's own card; the cohort list shows from 640px): what the clouds mean, and how many rare cells the highlighted method rings per cohort. */
export function FieldKey({ hot, pinned, className, bare = false }: { hot: RankRow | null; pinned: RankRow | null; className?: string; bare?: boolean }) {
  // The cobalt finder does not move under reduced motion or "Pause motion", so the idle sentence does not promise it.
  const paused = useMotionPaused();
  const reduced = useMedia(MOTION_REDUCE);
  const still = paused || reduced;
  const tally = hot ? ringTally(hot) : null;
  const rest = hot ? tail(hot) : null;
  const anyUnscored = !!hot && hot.found.some((n) => n == null);
  return (
    <section aria-labelledby="key-h" className={`${bare ? '' : 'rounded-card border border-line bg-white/85 '}p-5 ${className ?? ''}`}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="key-h" className="eyebrow m-0 font-normal">Live field</h2>
        <span className="font-mono text-[11px] text-ink-3">{FIELD_COHORTS.length} cohorts · {RARE_TOTAL} rare cells</span>
      </div>
      {/* Hover and focus change this text silently; only a pin (a deliberate choice) is announced, below. */}
      <p className="m-0 mt-3 min-h-[68px] text-sm leading-relaxed text-ink-2">
        {!hot && (still
          ? 'Each cloud is one cohort, sized by its cell count, with three vermilion rare cells in each. Point at a method in the card, or tap it, to ring the cells it recovers.'
          : 'Each cloud is one cohort, sized by its cell count. Three vermilion rare cells sit in each; the cobalt ring finds them in turn. Point at a method in the card, or tap it, to ring the cells it recovers.')}
        {hot && tally && rest && (
          <>
            <span className="font-mono text-ink">{hot.name}</span> rings <span className="font-mono text-ink">{tally.ringed} of {tally.of}</span>{rest}
          </>
        )}
        {hot && !rest && summary(hot)}
      </p>
      <p className="sr-only" aria-live="polite">{pinned ? `Pinned. ${summary(pinned)}` : ''}</p>
      <ul className="m-0 mt-4 hidden list-none sm:grid grid-cols-2 gap-x-6 gap-y-1.5 border-t border-line p-0 pt-4">
        {FIELD_COHORTS.map((c, k) => {
          const f = hot ? hot.found[k] : null;
          const label = !hot ? `${RARE_PER_COHORT} rare cells` : f == null ? 'not scored on Track A' : `${f} of ${RARE_PER_COHORT} ringed`;
          return (
            <li key={c} className={`flex items-center justify-between gap-2 font-mono text-[11px] ${hot && f == null ? 'text-ink-3' : 'text-ink-2'}`}>
              <span className="truncate">{c}</span>
              <span className="flex gap-1" role="img" aria-label={label}>
                {SLOTS.map((j) => <span key={j} className="box-border size-2 rounded-full" style={dot(hot, f, j)} />)}
              </span>
            </li>
          );
        })}
        {anyUnscored && (
          <li className="col-span-2 mt-1 flex items-center gap-2 font-mono text-[11px] text-ink-3">
            <span aria-hidden="true" className="box-border size-2 rounded-full" style={UNSCORED_DOT} />
            Not scored on Track A
          </li>
        )}
      </ul>
    </section>
  );
}
