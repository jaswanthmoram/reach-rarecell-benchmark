// Error states from the States board: an unknown deep link (status) and a blocked clipboard (alert).
import { ICON_STROKE, X } from '../../ui/icons';

export type Notice = { kind: 'status' | 'alert'; title: string; body: string };

function Card({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  const alert = notice.kind === 'alert';
  return (
    <div className="fade-in fixed inset-x-4 bottom-4 z-40 flex gap-2.5 rounded-card border border-line bg-surface py-3.5 pl-4 pr-2 shadow-[0_1px_2px_rgb(14_17_22/0.06),0_8px_24px_-8px_rgb(14_17_22/0.18)] sm:left-auto sm:w-[380px]">
      {alert && <span aria-hidden="true" className="mt-1.5 size-2 flex-none rounded-full bg-bad" />}
      <span className="flex min-w-0 flex-auto flex-col gap-1">
        <span className="text-sm font-semibold">{notice.title}</span>
        <span className="text-[13px] leading-[1.5] text-ink-2 [overflow-wrap:anywhere]">{notice.body}</span>
      </span>
      <button type="button" aria-label="Dismiss" onClick={onClose}
        className="grid size-9 flex-none cursor-pointer place-items-center rounded-chip border-0 bg-transparent text-ink-3 transition-colors duration-[var(--dur-1)] hover:bg-sunk hover:text-ink">
        <X size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * Both live regions stay mounted and empty until a notice arrives: a region inserted already holding its text
 * is often not announced. The status notice goes in the polite region, the clipboard error in the assertive one.
 */
export function Toast({ notice, onClose }: { notice: Notice | null; onClose: () => void }) {
  return (
    <>
      <div role="status" aria-live="polite" aria-atomic="true">
        {notice?.kind === 'status' && <Card notice={notice} onClose={onClose} />}
      </div>
      <div role="alert" aria-live="assertive" aria-atomic="true">
        {notice?.kind === 'alert' && <Card notice={notice} onClose={onClose} />}
      </div>
    </>
  );
}
