import { useRef, useState, type KeyboardEvent } from 'react';
import { cx } from '../../lib/format';
import { href, type RoutePath } from '../../lib/router';
import { PageHeader } from '../../ui/PageHeader';
import { ArrowRight, ICON_STROKE } from '../../ui/icons';
import { DrawPath } from '../../ui/motion';
import { LoopHost } from '../../ui/motion/LoopHost';
import { DEST, PERSONAS, labelOf } from './personas';

/* Hero from the P10 board: a drifting cell field, the reader picker, and five journeys that march to the page answering each reader. */

const ACCENT = 'var(--accent)';

/** Board field: same seeded generator (Park–Miller, seed 7), so the layout matches the canvas. */
const FIELD = (() => {
  let s = 7;
  const r = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  return Array.from({ length: 150 }, () => ({ x: Math.pow(r(), 0.7) * 100, y: r() * 100, r: 1.2 + r() * 1.6, o: 0.25 + r() * 0.35 }));
})();
const SIGNALS = [[62, 22], [81, 64], [55, 80], [92, 36]];
const y0Of = (i: number) => 40 + i * 80;
const yDest = (path: RoutePath) => (DEST.find((d) => d.path === path)?.y ?? 50) * 4;

interface Props { selId: string; onPick: (id: string) => void }

const pathOf = (i: number, dest: RoutePath) => `M10 ${y0Of(i)} C236.8 ${y0Of(i)} 323.2 ${yDest(dest)} 550 ${yDest(dest)}`;

/**
 * Reader picker: a radio group (one reader is always picked), arrow keys move and pick (roving tabindex), `?p=` holds the pick.
 * On phones the destination sits under the role so "Student reproducing the paper" never truncates (audit P1).
 */
function ReaderPicker({ selId, onPick }: Props) {
  const btns = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    const n = PERSONAS.length;
    const next = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: n - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const j = (next + n) % n;
    onPick(PERSONAS[j].id);
    btns.current[j]?.focus();
  };
  return (
    <div role="radiogroup" aria-label="Readers" className="rise mt-1 flex w-full max-w-[480px] flex-col gap-2 [animation-delay:220ms]">
      {PERSONAS.map((p, i) => {
        const on = p.id === selId;
        return (
          <button key={p.id} ref={(el) => { btns.current[i] = el; }} type="button" role="radio" aria-checked={on} aria-controls="journey" tabIndex={on ? 0 : -1}
            onClick={() => onPick(p.id)} onKeyDown={(e) => onKey(e, i)}
            className="uc-tab fx-card flex min-h-12 cursor-pointer items-center gap-3 px-3 py-2 text-left text-ink max-sm:gap-2.5 max-sm:px-2.5">
            <span aria-hidden="true" className={cx('size-2 flex-none rounded-full transition-colors duration-[var(--dur-1)]', on ? 'bg-accent' : 'bg-cell')} />
            <span className="flex min-w-0 flex-1 items-center justify-between gap-x-3 gap-y-0.5 max-sm:flex-col max-sm:items-start">
              <span className="text-sm font-medium leading-snug">{p.role}</span>
              <span className={cx('inline-flex items-center gap-1 font-mono text-[11px] leading-snug sm:whitespace-nowrap', on ? 'text-accent-ink' : 'text-ink-2')}>
                {p.keyLabel} <ArrowRight className="uc-arr max-sm:hidden" size={12} strokeWidth={ICON_STROKE} aria-hidden="true" />
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Hero art: five journeys march to the page that answers each reader. The picked route redraws once when picked. */
function RouteMap({ selId }: { selId: string }) {
  const [hover, setHover] = useState<RoutePath | null>(null);
  const sel = PERSONAS.find((p) => p.id === selId) ?? PERSONAS[0];
  const selIndex = PERSONAS.indexOf(sel);
  return (
    <div className="relative h-[400px] min-w-0 lg:ml-auto lg:h-[360px] lg:max-w-[500px] max-lg:h-[260px] max-sm:h-[170px] max-sm:rounded-card max-sm:border max-sm:border-line max-sm:bg-surface max-sm:py-2 max-sm:pr-24 max-sm:pl-2">
      {/* One gate for the route loops (march, travelling cells, ring): held off screen, in a hidden tab, under Pause or reduced motion. */}
      <LoopHost className="relative size-full">
        <svg aria-hidden="true" width="100%" height="100%" viewBox="0 0 700 400" preserveAspectRatio="none" className="absolute inset-0 overflow-visible">
          <DrawPath key={selId} d={pathOf(selIndex, sel.key)} fill="none" stroke={ACCENT} strokeWidth={1} strokeOpacity={0.4} duration={0.7} start="top 95%" />
          {PERSONAS.map((p, i) => {
            const on = p.id === selId;
            const half = !on && hover === p.key;
            const d = pathOf(i, p.key);
            const tone = on || half ? ACCENT : undefined;
            return (
              <g key={p.id}>
                <path d={d} fill="none" stroke={tone ?? 'var(--cell)'} strokeWidth={on ? 2.4 : half ? 1.9 : 1.4} strokeLinecap="round" strokeDasharray="1 7" opacity={on ? 0.95 : half ? 0.6 : 0.4} className="uc-march loop" vectorEffect="non-scaling-stroke" />
                <path d={d} fill="none" stroke={tone ?? 'var(--ink-2)'} strokeWidth={on ? 6 : half ? 5 : 4} strokeLinecap="round" strokeDasharray="0.1 64" opacity={on ? 1 : half ? 0.75 : 0.5} className={cx('uc-cells loop', i > 0 && `uc-c${i}`)} vectorEffect="non-scaling-stroke" />
              </g>
            );
          })}
        </svg>
        {PERSONAS.map((p, i) => (
          <span key={p.id} aria-hidden="true" className="absolute size-1.5 rounded-full border-[1.2px] bg-canvas" style={{ left: 'calc(1.43% - 4px)', top: `calc(${y0Of(i) / 4}% - 4px)`, borderColor: p.id === selId ? ACCENT : 'var(--ink-2)' }} />
        ))}
        {DEST.map((t) => {
          const on = sel.key === t.path;
          const lit = on || hover === t.path;
          const n = PERSONAS.filter((p) => p.key === t.path).length;
          const label = labelOf(t.path);
          return (
            <div key={t.path}>
              <span aria-hidden="true" className="absolute size-2 rounded-full" style={{ left: 'calc(78.6% - 4px)', top: `calc(${t.y}% - 4px)`, background: on ? ACCENT : 'var(--ink-2)' }} />
              {on && <span aria-hidden="true" className="uc-ring loop absolute size-4 rounded-full border-[1.2px] border-accent" style={{ left: 'calc(78.6% - 8px)', top: `calc(${t.y}% - 8px)` }} />}
              <a href={href(t.path)} aria-label={`${label}, answers ${n} of ${PERSONAS.length} readers`}
                onMouseEnter={() => setHover(t.path)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(t.path)} onBlur={() => setHover(null)}
                className={cx('uc-chip absolute inline-flex -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-chip border px-2 py-1 font-mono text-xs text-ink no-underline left-[calc(78.6%+14px)] max-sm:left-auto max-sm:-right-[88px] max-sm:px-1.5 max-sm:text-[11px]',
                  on ? 'border-accent/50 bg-accent-tint' : lit ? 'border-line-strong bg-sunk' : 'border-line bg-surface/90')}
                style={{ top: `${t.y}%` }}>
                {label}
              </a>
            </div>
          );
        })}
      </LoopHost>
    </div>
  );
}

export function Hero({ selId, onPick }: Props) {
  return (
    <div className="relative overflow-hidden border-b border-line">
      <LoopHost aria-hidden="true" className="uc-far loop pointer-events-none absolute inset-0">
        {FIELD.map((d, i) => (
          <span key={i} className="absolute rounded-full bg-cell" style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.r, height: d.r, opacity: d.o }} />
        ))}
        {SIGNALS.map(([x, y]) => <span key={`${x}-${y}`} className="uc-sig loop absolute size-[5px] rounded-full bg-signal" style={{ left: `${x}%`, top: `${y}%` }} />)}
      </LoopHost>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,var(--canvas)_0%,color-mix(in_srgb,var(--canvas)_88%,transparent)_38%,transparent_70%)] max-lg:bg-[linear-gradient(180deg,var(--canvas)_0%,color-mix(in_srgb,var(--canvas)_90%,transparent)_55%,color-mix(in_srgb,var(--canvas)_40%,transparent)_100%)]" />
      <PageHeader
        className="relative"
        title="Who reads REACH, and the route each one takes"
        lede={<>
          <span className="max-sm:hidden">Five readers arrive with different questions. Pick one to follow their route from the question they bring to the page that answers it.</span>
          <span className="sm:hidden">Pick a reader to follow their route to the page that answers them.</span>
        </>}
        art={<RouteMap selId={selId} />}
      >
        <ReaderPicker selId={selId} onPick={onPick} />
      </PageHeader>
    </div>
  );
}
