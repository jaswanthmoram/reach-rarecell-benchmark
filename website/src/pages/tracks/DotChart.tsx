import { useRef, type CSSProperties } from 'react';
import { cx } from '../../lib/format';
import { MOTION_OK, ScrollTrigger, canAnimate, gsap, useGSAP } from '../../ui/motion';
import type { Chart, ChartRow, Letter } from './model';
import { swatch } from './swatch';

/** Seconds between dots in the first-view draw-in (brief: 20 to 40 ms). */
const DOT_STAGGER = 0.03;

const dotStyle = (color: string, ref: boolean, filled: boolean): CSSProperties => ({
  position: 'absolute', left: -5, top: -5, width: 10, height: 10, borderRadius: '50%', boxSizing: 'border-box',
  background: filled ? color : 'var(--surface)', border: `1.5px ${ref && !filled ? 'dashed' : 'solid'} ${color}`, boxShadow: '0 0 0 2px var(--surface)',
});

const segStyle = (lo: number, w: number, color: string, ref: boolean): CSSProperties => ({
  position: 'absolute', top: '50%', left: `${lo.toFixed(2)}%`, width: `${w.toFixed(2)}%`,
  ...(ref ? { height: 0, borderTop: `1.5px dashed ${color}` } : { height: 2, marginTop: -1, borderRadius: 2, background: color }),
});

/** Rows split at each group heading, so every heading sits outside its list. */
function groups(rows: ChartRow[]) {
  const out: { head: string; rows: ChartRow[] }[] = [];
  rows.forEach((r) => { if (r.head || !out.length) out.push({ head: r.head, rows: [] }); out[out.length - 1].rows.push(r); });
  return out;
}

/*
 * Row layout. md and up: key | name | axis | value, one line. Phones: key and name with the value on the first line,
 * the axis across the full width under them, so the plot stays wide and every value stays on screen (audit P0).
 */
const ROW = 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 md:[grid-template-columns:var(--cols)] md:gap-x-3';
const AXIS_PAD = 'px-[7px]';

function Row({ r, letter }: { r: ChartRow; letter: Letter }) {
  return (
    <div role="listitem" title={r.said} className={cx(ROW, 'rounded-chip py-1 transition-colors duration-[var(--dur-1)] hover:bg-[var(--row-hover)] md:h-8 md:py-0')}>
      <span className="col-start-1 row-start-1 flex min-w-0 items-baseline gap-2 md:contents">
        <span className="pl-1 font-mono text-[11px] text-ink-3">{r.key}</span>
        <span className="inline-flex min-w-0 items-center gap-2 truncate font-mono text-[13px]"><span style={swatch(r.color, r.ref)} />{r.name}</span>
      </span>
      <span aria-hidden="true" className={cx('col-span-2 row-start-2 block h-5 md:col-span-1 md:row-start-auto', AXIS_PAD)}>
        <span className="tr-axis relative block h-full">
          <span className="tr-line absolute inset-x-0 top-1/2 h-px origin-left bg-line" />
          {r.seg && <span key={letter} className="tr-seg" style={segStyle(r.seg[0], r.seg[1], r.color, r.ref)} />}
          {r.marks.map((m, k) => (
            <span key={k} className="tr-mark" style={{ '--x': m.left.toFixed(2) } as CSSProperties}>
              <span className="tr-dotmark" style={dotStyle(r.color, r.ref, m.filled)} />
            </span>
          ))}
        </span>
      </span>
      <span className={cx('tabular col-start-2 row-start-1 whitespace-nowrap pr-1 text-right font-mono text-[13px] md:col-start-auto md:row-start-auto', r.ref ? 'text-ink-2' : 'text-ink')}>
        <span className="sr-only">{r.name}: </span>{r.value}
      </span>
    </div>
  );
}

/**
 * The track's dot plot. Draws in once on first view; on a track switch the dots glide to their new values.
 * The setup re-runs per track: before the first view it re-hides every mark the new track mounted, and after it only
 * rows or marks that just mounted (Track E rows, the second Track B and F mark) draw in. Kept marks glide (tracks.css).
 */
export function DotChart({ chart, letter }: { chart: Chart; letter: Letter }) {
  const ref = useRef<HTMLElement>(null);
  const drawn = useRef(false);
  const seen = useRef(new WeakSet<Element>());
  const cols = { '--cols': `84px minmax(0, 176px) minmax(0, 1fr) ${chart.valueCol}` } as CSSProperties;

  useGSAP(() => {
    const root = ref.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const lines = Array.from(root.querySelectorAll('.tr-line'));
      const dots = Array.from(root.querySelectorAll('.tr-dotmark'));
      const remember = () => { lines.forEach((el) => seen.current.add(el)); dots.forEach((el) => seen.current.add(el)); };
      if (!canAnimate() || (!drawn.current && root.getBoundingClientRect().bottom < 0)) { drawn.current = true; remember(); return; }
      if (drawn.current) {
        const newLines = lines.filter((el) => !seen.current.has(el));
        const newDots = dots.filter((el) => !seen.current.has(el));
        remember();
        if (!newLines.length && !newDots.length) return;
        const tl = gsap.timeline();
        if (newLines.length) tl.from(newLines, { scaleX: 0, duration: 0.5, ease: 'power2.out', stagger: 0.02, clearProps: 'transform' }, 0);
        if (newDots.length) tl.from(newDots, { opacity: 0, scale: 0.4, duration: 0.32, ease: 'power2.out', stagger: DOT_STAGGER, clearProps: 'opacity,transform' }, 0.18);
        return () => { tl.progress(1).kill(); };
      }
      gsap.set(lines, { scaleX: 0 });
      gsap.set(dots, { opacity: 0, scale: 0.4 });
      const finish = () => gsap.set([...lines, ...dots], { clearProps: 'opacity,transform' });
      const st = ScrollTrigger.create({
        trigger: root, start: 'top 82%', once: true,
        onEnter: () => {
          drawn.current = true;
          remember();
          if (!canAnimate()) { finish(); return; }
          gsap.to(lines, { scaleX: 1, duration: 0.5, ease: 'power2.out', stagger: 0.02 });
          gsap.to(dots, { opacity: 1, scale: 1, duration: 0.32, ease: 'power2.out', delay: 0.18, stagger: DOT_STAGGER, onComplete: finish });
        },
      });
      return () => { st.kill(); finish(); };
    });
    return () => mm.revert();
  }, { scope: ref, dependencies: [letter], revertOnUpdate: true });

  return (
    <figure ref={ref} className="m-0 min-w-0 border-t border-line pt-5" style={cols}>
      <figcaption className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium">{chart.title}</span>
        {chart.legend && (
          <span className="flex flex-wrap gap-4 text-xs text-ink-2">
            <span className="inline-flex items-center gap-1.5"><span className="box-border size-2.5 rounded-full border-[1.5px] border-ink-2 bg-surface" />{chart.legend[0]}</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-ink-2" />{chart.legend[1]}</span>
          </span>
        )}
      </figcaption>
      {groups(chart.rows).map((g, gi) => (
        <div key={gi}>
          {g.head && <p className="m-0 mb-1 mt-3 pl-1 text-xs font-medium text-ink-3">{g.head}</p>}
          <div role="list" aria-label={g.head ? `${chart.title}: ${g.head}` : chart.title} className="flex flex-col gap-0.5">
            {g.rows.map((r) => <Row key={r.id} r={r} letter={letter} />)}
          </div>
        </div>
      ))}
      <div aria-hidden="true" className={cx(ROW, 'mt-1')}>
        <span className="hidden md:block" /><span className="hidden md:block" />
        <span className={cx('col-span-2 flex justify-between font-mono text-[11px] text-ink-3 md:col-span-1', AXIS_PAD)}>
          {chart.ticks.map((t, i) => (
            <span key={t} className="w-0 whitespace-nowrap">
              <span className={cx('inline-block', i === 0 ? '' : i === chart.ticks.length - 1 ? '-translate-x-full' : '-translate-x-1/2')}>{t}</span>
            </span>
          ))}
        </span>
        <span className="hidden md:block" />
      </div>
      <p className="m-0 mt-3 max-w-[78ch] text-xs leading-relaxed text-ink-2">{chart.caption}</p>
    </figure>
  );
}
