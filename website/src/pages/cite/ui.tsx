/* Small shared pieces of the Cite page. */
import { cx } from '../../lib/format';
import { Check, CircleAlert, Copy, ICON_STROKE } from '../../ui/icons';
import type { useCopy } from '../../ui/useCopy';

export type Copier = ReturnType<typeof useCopy>;

/** A DOI that wraps only after the slash, never inside the number (States board, edge case). */
export function Doi({ doi }: { doi: string }) {
  const i = doi.indexOf('/');
  if (i < 0) return <span className="whitespace-nowrap">{doi}</span>;
  return <><span className="whitespace-nowrap">{doi.slice(0, i + 1)}</span><wbr /><span className="whitespace-nowrap">{doi.slice(i + 1)}</span></>;
}

export const link = 'rounded-[2px] text-accent underline decoration-accent/30 underline-offset-2 transition-colors duration-[var(--dur-1)] hover:text-ink hover:decoration-ink/40';
export const dt = 'eyebrow m-0 tracking-[0.06em]';
const ghost = 'inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-chip border-0 bg-transparent px-2 text-[13px] font-medium transition-colors duration-[var(--dur-1)]';

interface CopyButtonProps {
  copier: Copier;
  /** Feedback slot (one per button). */
  slot: string;
  text: string;
  idle: string;
  /** Accessible name when the visible label is short ("Copy"). */
  label?: string;
  /** Filled dark button (the citation panel) instead of the quiet ghost button. */
  solid?: boolean;
  onCopied?: (ok: boolean) => void;
  className?: string;
}

/** Copy with a state change only (audit Cite P2): the icon swaps to a check and the label to "Copied". No movement. */
export function CopyButton({ copier, slot, text, idle, label, solid = false, onCopied, className }: CopyButtonProps) {
  const st = copier.stateOf(slot);
  const done = st === 'copied';
  const failed = st === 'failed';
  const shown = done ? 'Copied' : failed ? 'Not copied' : idle;
  const Icon = done ? Check : failed ? CircleAlert : Copy;
  const click = async () => { const ok = await copier.copy(text, slot); onCopied?.(ok); };
  return (
    <button type="button" onClick={click} aria-label={label && !done && !failed ? label : undefined}
      className={cx(
        solid
          ? 'inline-flex h-9 min-w-[104px] cursor-pointer items-center justify-center gap-1.5 rounded-chip border-0 bg-ink px-3.5 text-sm font-medium text-canvas transition-colors duration-[var(--dur-1)] hover:bg-ink/85'
          : cx(ghost, done ? 'text-ok' : failed ? 'text-bad' : 'text-ink-2 hover:bg-sunk hover:text-ink'),
        className,
      )}>
      <Icon size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
      <span aria-live="polite">{shown}</span>
    </button>
  );
}
