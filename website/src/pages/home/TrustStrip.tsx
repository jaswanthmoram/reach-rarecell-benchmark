import { GLOBAL_STATS as G } from '../../data/benchmarkData';
import { ICON_STROKE, Landmark } from '../../ui/icons';

/** Neutral dot-cluster glyph (not a journal logo): seven dots in a loose cluster. Decorative. */
function DotCluster() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false" className="shrink-0 text-ink-3">
      <g fill="currentColor">
        <circle cx="9" cy="9" r="2.2" /><circle cx="3.6" cy="6.4" r="1.4" /><circle cx="14.2" cy="5.6" r="1.6" />
        <circle cx="13.8" cy="12.6" r="1.3" /><circle cx="5.2" cy="13.4" r="1.6" /><circle cx="9.4" cy="2.6" r="1.1" /><circle cx="9.6" cy="15.6" r="1" />
      </g>
    </svg>
  );
}

const label = 'eyebrow shrink-0';
const name = 'inline-flex items-center gap-2 text-[15px] font-medium text-ink-2';

/** "Featured in" and "Developed at": text wordmarks with neutral glyphs, no copied logos. */
export function TrustStrip({ className }: { className?: string }) {
  return (
    <div className={className}>
      <ul aria-label="Publication and affiliation" className="m-0 flex list-none flex-col gap-4 p-0 sm:flex-row sm:items-center sm:gap-0">
        <li className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className={label}>Featured in</span>
          <a href={G.articleUrl} target="_blank" rel="noopener noreferrer" className={`${name} hm-ul no-underline hover:text-ink`}>
            <DotCluster /><span className="fx-underline fx-underline--bare">{G.journalName}</span><span className="sr-only"> (opens in a new tab)</span>
          </a>
        </li>
        <li aria-hidden="true" className="mx-8 hidden h-8 w-px bg-line-strong sm:block" />
        <li className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className={label}>Developed at</span>
          <span className={name}><Landmark size={17} strokeWidth={ICON_STROKE} aria-hidden="true" className="shrink-0 text-ink-3" />SRM University-AP</span>
        </li>
      </ul>
    </div>
  );
}
