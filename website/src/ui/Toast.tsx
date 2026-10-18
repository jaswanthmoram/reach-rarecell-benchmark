import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import { ToastContext, type ToastInput, type ToastTone } from './toastContext';

interface Item extends Required<Omit<ToastInput, 'description'>> { id: number; description?: string }

const TONE_ICON: Record<ToastTone, { icon: IconName; cls: string }> = {
  neutral: { icon: 'info', cls: 'text-ink-2' },
  ok: { icon: 'check', cls: 'text-ok' },
  bad: { icon: 'warning-circle', cls: 'text-bad' },
};
const MAX = 3;

/**
 * Feedback for copy and export actions. Bottom-centre on phones, bottom-right from 640px. Polite live region;
 * errors use role="alert". Timers pause while the pointer is over the stack or focus is inside it.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const seq = useRef(0);
  const timers = useRef(new Map<number, number>());
  const paused = useRef(false);

  const dismiss = useCallback((id: number) => {
    window.clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setItems((xs) => xs.filter((x) => x.id !== id));
  }, []);

  const arm = useCallback((item: Item) => {
    if (item.duration <= 0) return;
    const tick = () => {
      if (paused.current) timers.current.set(item.id, window.setTimeout(tick, 800));
      else dismiss(item.id);
    };
    timers.current.set(item.id, window.setTimeout(tick, item.duration));
  }, [dismiss]);

  const toast = useCallback((t: ToastInput) => {
    const item: Item = { id: ++seq.current, title: t.title, description: t.description, tone: t.tone ?? 'neutral', duration: t.duration ?? (t.tone === 'bad' ? 6000 : 3200) };
    setItems((xs) => [...xs, item].slice(-MAX));
    arm(item);
  }, [arm]);

  useEffect(() => {
    const map = timers.current;
    return () => { map.forEach((h) => window.clearTimeout(h)); map.clear(); };
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div aria-live="polite" aria-label="Notifications" role="region"
        onPointerEnter={() => { paused.current = true; }} onPointerLeave={() => { paused.current = false; }}
        onFocus={() => { paused.current = true; }} onBlur={() => { paused.current = false; }}
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end">
        {items.map((t) => {
          const tone = TONE_ICON[t.tone];
          return (
            <div key={t.id} role={t.tone === 'bad' ? 'alert' : undefined}
              className="toast-in pointer-events-auto flex w-full max-w-[380px] items-start gap-3 rounded-card border border-line bg-surface py-3 pl-3.5 pr-2 shadow-pop">
              <Icon name={tone.icon} size={16} className={`mt-0.5 shrink-0 ${tone.cls}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{t.title}</p>
                {t.description && <p className="mt-0.5 text-xs leading-snug text-ink-2 [overflow-wrap:anywhere]">{t.description}</p>}
              </div>
              <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss notification"
                className="grid size-7 shrink-0 place-items-center rounded-chip text-ink-3 transition-colors duration-150 hover:bg-sunk hover:text-ink">
                <Icon name="x" size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
