import { useEffect, useRef } from 'react';
import { asset } from '../../lib/format';
import { href, preloadRoute } from '../../lib/router';
import { ArrowRight, ArrowUpRight, ICON_STROKE } from '../../ui/icons';
import { Reveal, motionAllowed } from '../../ui/motion';
import { SectionHeader } from '../../ui/SectionHeader';

/** The short overview film, 1920 x 1084, 78 s, with sound. Phones get the 960 px encode. */
const FILM_W = 1920;
const FILM_H = 1084;
/** Share of the player that must be on screen before it starts by itself (muted). */
const IN_VIEW = 0.5;

/**
 * "REACH in 78 seconds": the overview film. Native controls (scrub, sound, fullscreen). It starts muted once when
 * it scrolls into view, unless reduced motion or "Pause motion" is on; it pauses when scrolled away. The visitor's
 * own play or pause wins after that. Links to the 8-minute deep dive and to the leaderboard as the text alternative.
 */
export function Explainer() {
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = video.current;
    if (!v || typeof IntersectionObserver === 'undefined') return;
    let started = false;
    let userPaused = false;
    let autoPause = false;
    const onPause = () => { if (!autoPause) userPaused = true; autoPause = false; };
    const onPlay = () => { userPaused = false; };
    v.addEventListener('pause', onPause);
    v.addEventListener('play', onPlay);
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        if (!started && motionAllowed()) { started = true; v.muted = true; v.play().catch(() => undefined); }
        else if (started && !userPaused && v.paused && motionAllowed()) v.play().catch(() => undefined);
      } else if (!v.paused) { autoPause = true; v.pause(); }
    }, { threshold: IN_VIEW });
    io.observe(v);
    return () => { io.disconnect(); v.removeEventListener('pause', onPause); v.removeEventListener('play', onPlay); };
  }, []);

  return (
    <section id="how" aria-labelledby="how-h" className="border-t border-line px-4 pb-12 pt-16 sm:px-6 sm:pt-20">
      <div className="mx-auto max-w-[1240px]">
        <SectionHeader id="how-h" title="REACH in 78 seconds" className="mb-10"
          lede="Why rare cells are hard to find, how REACH tests the detectors, and what the ranking shows. Turn the sound on in the player." />
        <figure className="m-0">
          <Reveal variant="mask">
            <div className="relative overflow-hidden border-y border-line bg-surface shadow-[var(--elev-1)] max-sm:-mx-4 sm:rounded-card sm:border-x" style={{ aspectRatio: `${FILM_W} / ${FILM_H}` }}>
              <video ref={video} width={FILM_W} height={FILM_H} controls playsInline preload="metadata"
                poster={asset('video/reach-overview-poster.webp')} aria-describedby="how-caption"
                className="absolute inset-0 block size-full bg-canvas object-cover">
                <source src={asset('video/reach-overview-960.mp4')} type="video/mp4" media="(max-width: 767px)" />
                <source src={asset('video/reach-overview.mp4')} type="video/mp4" />
                Your browser cannot play this video. <a href={asset('video/reach-overview.mp4')}>Download the overview film (MP4)</a>.
              </video>
            </div>
          </Reveal>
          <figcaption id="how-caption" className="mt-4 flex flex-col gap-1 text-[13px] leading-relaxed text-ink-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
            <a href={asset('video/reach-anatomy.mp4')} target="_blank" rel="noopener noreferrer"
              className="hm-link hm-ul group inline-flex min-h-11 items-center gap-1 self-start text-sm font-medium hover:text-ink">
              <span className="fx-underline">Watch the 8-minute deep dive</span><ArrowUpRight size={14} strokeWidth={ICON_STROKE} aria-hidden="true" className="hm-nudge-up" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <a href={href('/leaderboard')} onPointerEnter={() => void preloadRoute('/leaderboard')}
              className="hm-link hm-ul group inline-flex min-h-11 items-center gap-1 self-start text-sm font-medium hover:text-ink">
              <span className="fx-underline">Prefer text? Open the leaderboard</span><ArrowRight size={14} strokeWidth={ICON_STROKE} aria-hidden="true" className="hm-nudge" />
            </a>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
