/* Shared cohort hover: the plate, catalogue and compare chips all light the same cohort. */
import type { PointerEvent } from 'react';

/** Hover highlight for a cohort, mouse only: a touch tap must not leave a shared highlight behind. */
export function hoverProps(id: string, onHot: (id: string | null) => void) {
  return {
    onPointerEnter: (e: PointerEvent) => { if (e.pointerType === 'mouse') onHot(id); },
    onPointerLeave: (e: PointerEvent) => { if (e.pointerType === 'mouse') onHot(null); },
  };
}
