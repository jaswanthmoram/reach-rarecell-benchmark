import { useCallback, useState } from 'react';
import type { PartId } from './components';

/** Which archives the reader says they reused (the paper is implied), plus the part being previewed by hover/focus. */
export function useCitePick() {
  const [picked, setPicked] = useState<ReadonlySet<PartId>>(() => new Set());
  const [hover, setHover] = useState<PartId | null>(null);
  const toggle = useCallback((id: PartId) => {
    if (id === 'paper') return;
    setPicked((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }, []);
  return { picked, hover, toggle, setHover };
}
export type CitePick = ReturnType<typeof useCitePick>;
