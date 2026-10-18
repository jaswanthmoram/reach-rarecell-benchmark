import type { ReactNode } from 'react';
import { ThemedArt } from './primitives';
import { LiveField } from './LiveField';
import type { LiveFieldKind, LiveLayout } from './liveLayouts';
import { asset } from './util';

/**
 * Live hero stage. Layers, back to front: static art (poster frame, no-JS and reduced-motion fallback) →
 * live dot-field → optional muted video loop → content. Each layer is optional except the content.
 * The stage never covers text: content sits in its own column; the stage is decorative unless `label` is set.
 */
type Props = {
  children: ReactNode;
  art?: string; artSize?: [number, number];
  field?: LiveFieldKind; layout?: LiveLayout; seed?: number; intensity?: number;
  video?: { webm?: string; mp4?: string };
  label?: string;
  className?: string;
};

export function LiveHero({ children, art, artSize = [1600, 900], field, layout, seed, intensity, video, label, className = '' }: Props) {
  return (
    <section className={`relative isolate overflow-hidden border-b border-line ${className}`}>
      <div aria-hidden={label ? undefined : true} className="pointer-events-none absolute inset-0 -z-10">
        {art && <ThemedArt base={art} alt="" size={artSize} eager className="absolute inset-0 h-full w-full object-cover object-right opacity-40" />}
        {(field || layout) && <LiveField kind={field} layout={layout} seed={seed} intensity={intensity} label={label} className="absolute inset-0" />}
        {video && (
          <video className="absolute inset-0 h-full w-full object-cover opacity-60 motion-reduce:hidden" autoPlay muted loop playsInline preload="metadata"
            poster={art ? asset(`${art}-light.webp`) : undefined}>
            {video.webm && <source src={asset(video.webm)} type="video/webm" />}
            {video.mp4 && <source src={asset(video.mp4)} type="video/mp4" />}
          </video>
        )}
        {/* Readability scrim: calm left column for text, live stage on the right. */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--canvas)_0%,color-mix(in_srgb,var(--canvas)_88%,transparent)_38%,transparent_70%)]" />
      </div>
      {children}
    </section>
  );
}
