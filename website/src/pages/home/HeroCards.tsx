import { useEffect, useRef, type CSSProperties, type RefObject } from 'react';
import { GLOBAL_STATS as G } from '../../data/benchmarkData';
import { href, preloadRoute, type RoutePath } from '../../lib/router';
import { ChevronRight, ICON_STROKE } from '../../ui/icons';
import { reducedMotion } from '../../ui/motion';
import { HERO_VIOLET } from './heroArt';

/**
 * Three glass-light callouts pinned to features of the hero artwork by thin leader lines. Each anchor is a zero-size
 * point given in % of the 16:9 image (`.hm-artbox` has the image's exact geometry, so it stays on its feature at
 * every width); the card and its line are placed in px from that point. Entrance: card rises, then its line draws in.
 * Idle: a 4px float of the whole layer (Web Animations, held by the stage's loop gate).
 * Facts only, from GLOBAL_STATS and the Track A and D definitions.
 */
interface Pt { x: number; y: number }
interface CardSpec {
  title: string;
  lines: readonly [string, string];
  dot: string;
  link: { to: RoutePath; query?: string };
  /** Anchor in % of the artwork: the feature the line points at. */
  at: readonly [number, number];
  /** Card top-left, px from the anchor. */
  card: Pt;
  /** Where the leader line meets the card, px from the anchor. */
  end: Pt;
}

const CARDS: readonly CardSpec[] = [
  // Vermilion rare cell.
  { title: 'Spike-in rare cells', lines: ['Prevalence down to 0.01%', `Track A, ${G.trackAUnits} units`], dot: 'var(--signal)',
    link: { to: '/tracks', query: 'track=a' }, at: [55.6, 8.8], card: { x: -236, y: -32 }, end: { x: -24, y: 0 } },
  // Central blue cluster.
  { title: 'Tumour cohorts', lines: [`${G.solidCohorts} solid tumours`, '4 prevalence tiers'], dot: 'var(--accent)',
    link: { to: '/datasets' }, at: [56.9, 41.3], card: { x: -246, y: 132 }, end: { x: -40, y: 132 } },
  // Violet crescent.
  { title: 'Blood and CTC cohorts', lines: [`${G.hematologicCohorts} cohorts`, 'Natural prevalence, Track D'], dot: HERO_VIOLET,
    link: { to: '/tracks', query: 'track=d' }, at: [88.5, 32.6], card: { x: -206, y: 118 }, end: { x: -40, y: 118 } },
];

const CARD_ENTER_MS = 560;
/** The line starts on the pin ring (r = 8), not at the feature's centre: fraction of the way along it. */
const lead0 = (p: Pt) => 8 / Math.max(8, Math.hypot(p.x, p.y));
const CARD_STEP_MS = 120;
const LINE_AFTER_MS = 260;

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/**
 * The idle float: one Web Animation on the whole callout list (cards, lines and pins drift together by 4px), created
 * once and played only while the stage's gate says `running`. One animated layer, not one per card: per-card
 * animations cost a style pass for every card on every frame of the field (~15% idle CPU at 4x throttle).
 */
function useFloat(list: RefObject<HTMLUListElement | null>, running: boolean) {
  const anim = useRef<Animation | null>(null);
  useEffect(() => {
    const ul = list.current;
    if (!ul || reducedMotion() || typeof ul.animate !== 'function') return;
    const a = ul.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-4px)' }, { transform: 'translateY(0)' }],
      { duration: 6000, iterations: Infinity, easing: 'ease-in-out' });
    a.pause();
    anim.current = a;
    return () => { a.cancel(); anim.current = null; };
  }, [list]);
  useEffect(() => { const a = anim.current; if (a) { if (running) a.play(); else a.pause(); } }, [running]);
}

export function HeroCards({ running }: { running: boolean }) {
  const list = useRef<HTMLUListElement>(null);
  useFloat(list, running);
  return (
    <ul ref={list} className="absolute inset-0 m-0 list-none p-0">
      {CARDS.map((c, i) => {
        const enter = CARD_ENTER_MS + i * CARD_STEP_MS;
        const to = href(c.link.to, c.link.query);
        return (
          <li key={c.title} className="hm-anchor" style={{ left: `${c.at[0]}%`, top: `${c.at[1]}%` }}>
            <svg aria-hidden="true" width="1" height="1" className="absolute left-0 top-0 overflow-visible">
              <line x1={c.end.x * lead0(c.end)} y1={c.end.y * lead0(c.end)} x2={c.end.x} y2={c.end.y} pathLength={1} stroke="var(--ink-3)" strokeOpacity={0.65} strokeWidth={1}
                className="hm-lead" style={{ '--d': `${enter + LINE_AFTER_MS}ms` } as Vars} />
              <circle cx={0} cy={0} r={8} fill="none" stroke="var(--ink-3)" strokeOpacity={0.6} strokeWidth={1}
                className="hm-pin" style={{ '--d': `${enter + LINE_AFTER_MS + 380}ms` } as Vars} />
              <circle cx={c.end.x} cy={c.end.y} r={1.75} fill="var(--ink-3)" fillOpacity={0.7}
                className="hm-pin" style={{ '--d': `${enter + LINE_AFTER_MS}ms` } as Vars} />
            </svg>
            <div className="absolute w-max" style={{ left: c.card.x, top: c.card.y }}>
              <div className="rise" style={{ animationDelay: `${enter}ms` }}>
                <div>
                  <a href={to} onPointerEnter={() => void preloadRoute(c.link.to)} onFocus={() => void preloadRoute(c.link.to)}
                    className="hm-card group pointer-events-auto flex min-w-[196px] items-center gap-3 rounded-[14px] border border-line bg-white/90 py-2.5 pl-3 pr-2.5 no-underline">
                    <span aria-hidden="true" className="mt-[5px] size-2 shrink-0 self-start rounded-full" style={{ background: c.dot }} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="whitespace-nowrap text-[13.5px] font-semibold leading-tight text-ink">{c.title}</span>
                      <span className="mt-1 text-[12px] leading-tight text-ink-2">{c.lines[0]}</span>
                      <span className="mt-0.5 font-mono text-[11px] leading-tight text-ink-3">{c.lines[1]}</span>
                    </span>
                    <ChevronRight size={15} strokeWidth={ICON_STROKE} aria-hidden="true" className="hm-nudge shrink-0 text-ink-3" />
                  </a>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
