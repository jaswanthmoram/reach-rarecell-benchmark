import { asset, cx } from '../lib/format';

/** Microsoft Fluent Emoji 3D (MIT), self-hosted as WebP in public/icons3d/ at 128 and 256 px. See design/ASSETS.md. */
export type Icon3DName =
  | 'microscope' | 'dna' | 'test-tube' | 'bar-chart' | 'bullseye' | 'straight-ruler'
  | 'card-file-box' | 'open-book' | 'laptop' | 'memo' | 'busts-in-silhouette';

export interface Icon3DProps {
  name: Icon3DName;
  /** Rendered size in CSS px (default 56; keep 48-96). */
  size?: number;
  /** Decorative by default. Pass alt text only when the icon carries meaning on its own. */
  alt?: string;
  className?: string;
}

/**
 * Hero, empty-state and use-case-card art only (never nav, tables or buttons; UI icons come from ./icons).
 * Floats 3px on hover where hover exists (also when its `.group` parent is hovered).
 */
export function Icon3D({ name, size = 56, alt = '', className }: Icon3DProps) {
  const src = (px: number) => asset(`icons3d/${name}-${px}.webp`);
  return (
    <img src={src(128)} srcSet={`${src(128)} 128w, ${src(256)} 256w`} sizes={`${size}px`}
      width={size} height={size} alt={alt} aria-hidden={alt ? undefined : true}
      loading="lazy" decoding="async" draggable={false} className={cx('icon3d select-none', className)} />
  );
}
