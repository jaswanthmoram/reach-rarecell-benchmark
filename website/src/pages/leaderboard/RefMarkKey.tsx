import { methodColor } from '../../ui';

export interface RefMark {
  id: string;
  label: string;
  /** Position on the shared axis, 0 to 100. */
  x: number;
}

const ROW = 18;
const FLIP_AT = 58;

/**
 * Names the dashed reference marks under a shared axis. Each label hangs from a dashed leader at its x.
 * Labels that run left (marks near the right edge) take the top rows, leftmost-first; labels that run right follow,
 * rightmost-first. Each label then only spans leaders that have already ended above it.
 */
/** `flipAt`: marks at or right of this x label leftwards; raise it where the key has free space to its right. */
export function RefMarkKey({ marks, flipAt = FLIP_AT }: { marks: RefMark[]; flipAt?: number }) {
  const right = marks.filter((m) => m.x < flipAt).sort((a, b) => b.x - a.x);
  const left = marks.filter((m) => m.x >= flipAt).sort((a, b) => a.x - b.x);
  const placed = [...left, ...right].map((m, row) => ({ ...m, row, flip: m.x >= flipAt }));
  return (
    <div className="relative mt-1 font-mono text-[11px] leading-4 text-ink-2 tabular" style={{ height: placed.length * ROW }} aria-hidden="true">
      {placed.map((m) => (
        <span key={m.id}>
          <span className="absolute top-0 border-l border-dashed" style={{ left: `${m.x}%`, height: m.row * ROW + ROW / 2, borderColor: methodColor(m.id) }} />
          <span className={`absolute whitespace-nowrap ${m.flip ? '-translate-x-full pr-1.5' : 'pl-1.5'}`} style={{ left: `${m.x}%`, top: m.row * ROW + 1 }}>
            {m.label}
          </span>
        </span>
      ))}
    </div>
  );
}
