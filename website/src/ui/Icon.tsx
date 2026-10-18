// Phosphor (regular) sprite in public/icons.svg, set chosen via Supericons.
import type { IconName } from './iconNames';

export type { IconName };
const SPRITE = `${import.meta.env.BASE_URL}icons.svg`;

export function Icon({ name, size = 18, className = '', label }: { name: IconName; size?: number; className?: string; label?: string }) {
  return (
    <svg width={size} height={size} className={className} aria-hidden={label ? undefined : true} role={label ? 'img' : undefined} aria-label={label}>
      <use href={`${SPRITE}#i-${name}`} />
    </svg>
  );
}
