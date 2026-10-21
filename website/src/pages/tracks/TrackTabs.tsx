import { useRef, type KeyboardEvent } from 'react';
import { cx } from '../../lib/format';
import { LETTERS, PANEL_ID, TRACKS, tabId, type Letter } from './model';

interface TrackTabsProps { active: Letter; onPick: (l: Letter) => void }

/** Six tabs in a horizontal tablist; automatic activation, roving tabindex, Left and Right wrap, Home and End jump to A and F. */
export function TrackTabs({ active, onPick }: TrackTabsProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = LETTERS.indexOf(active);
    const n = LETTERS.length;
    const keys: Record<string, number> = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 };
    const next = keys[e.key];
    if (next === undefined) return;
    e.preventDefault();
    onPick(LETTERS[next]);
    refs.current[next]?.focus();
  };
  return (
    <div role="tablist" aria-label="Evaluation tracks" onKeyDown={onKey}
      className="grid grid-cols-3 gap-1.5 sm:grid-cols-[repeat(auto-fit,minmax(150px,1fr))] sm:gap-2">
      {TRACKS.map((t, i) => {
        const on = t.letter === active;
        return (
          <button key={t.letter} ref={(el) => { refs.current[i] = el; }} type="button" role="tab" id={tabId(t.letter)}
            aria-selected={on} aria-controls={PANEL_ID} tabIndex={on ? 0 : -1} onClick={() => onPick(t.letter)}
            className={cx(
              'relative flex cursor-pointer rounded-card border text-left transition-[border-color,background-color] duration-150',
              'min-h-11 items-center gap-2 px-2.5 sm:min-h-24 sm:flex-col sm:items-stretch sm:gap-2 sm:px-4 sm:py-3',
              on ? 'tr-tab-on border-[rgba(47,91,234,0.55)] bg-surface' : 'hover-lift border-line bg-surface hover:border-line-strong',
            )}>
            <span className="flex items-center gap-2.5">
              <span className={cx('inline-grid size-6 flex-none place-items-center rounded-chip border bg-surface font-mono text-xs font-semibold max-sm:size-auto max-sm:border-0 max-sm:bg-transparent',
                on ? 'border-accent text-accent' : 'border-line-strong text-ink-2')}>{t.letter}</span>
              <span className="hidden font-mono text-[11px] text-ink-3 sm:inline">{t.units} units</span>
            </span>
            <span className="text-[13px] text-ink sm:hidden">{t.short}</span>
            <span className="hidden text-[13px] font-medium leading-[1.35] text-ink sm:block">{t.name}</span>
            <span className="hidden font-mono text-[11px] text-ink-2 sm:block">{t.headline}</span>
          </button>
        );
      })}
    </div>
  );
}
