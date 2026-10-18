import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { ROUTES, href, type RoutePath } from '../../app/router';
import { Container, Icon, LiveHero } from '../../ui';
import { DEST_PAGES, KEY_PAGE, PERSONAS, keyDest, keyStop } from './personas';
import { JourneyField } from './JourneyField';
import { DEST_INSET, FAR_FIELD, destY } from './journeyGeometry';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
const routeOf = (p: RoutePath) => ROUTES.find((r) => r.path === p)!;
const SIDE_BY_SIDE = '(min-width: 1024px)';

/**
 * Side by side (lg+), each reader's journey starts level with its picker row: returns the row centres as 0..1 of the
 * field's height. Stacked, it returns null and the field spaces the origins evenly.
 */
function useRowOrigins(field: RefObject<HTMLDivElement | null>) {
  const [origins, setOrigins] = useState<number[] | null>(null);
  useEffect(() => {
    const el = field.current;
    if (!el) return;
    const mq = matchMedia(SIDE_BY_SIDE);
    const measure = () => {
      const box = el.getBoundingClientRect();
      if (!mq.matches || box.height === 0) { setOrigins(null); return; }
      const ys = PERSONAS.map((p) => {
        const row = document.getElementById(`persona-tab-${p.id}`)?.getBoundingClientRect();
        return row ? (row.top + row.height / 2 - box.top) / box.height : NaN;
      });
      setOrigins(ys.every(Number.isFinite) ? ys : null);
    };
    measure();
    // Re-measure once the entry rise (a transform) and web fonts settle; both move the rows without resizing the field.
    let live = true;
    document.fonts?.ready.then(() => { if (live) measure(); });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    mq.addEventListener('change', measure);
    document.addEventListener('animationend', measure);
    return () => { live = false; ro.disconnect(); mq.removeEventListener('change', measure); document.removeEventListener('animationend', measure); };
  }, [field]);
  return origins;
}

/** Reader picker: a vertical tab list whose rows line up with the five journey origins in the field. */
function ReaderTabs({ value, onChange, onHover }: { value: string; onChange: (id: string) => void; onHover: (id: string | null) => void }) {
  const move = (e: KeyboardEvent, dir: number) => {
    e.preventDefault();
    const i = PERSONAS.findIndex((p) => p.id === value);
    const next = PERSONAS[(i + dir + PERSONAS.length) % PERSONAS.length];
    onChange(next.id);
    document.getElementById(`persona-tab-${next.id}`)?.focus();
  };
  return (
    <div role="tablist" aria-label="Readers" aria-orientation="vertical" className="flex flex-col gap-1.5" onMouseLeave={() => onHover(null)}
      onKeyDown={(e) => { if (e.key === 'ArrowDown' || e.key === 'ArrowRight') move(e, 1); if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') move(e, -1); }}>
      {PERSONAS.map((p) => {
        const on = p.id === value;
        return (
          <button key={p.id} id={`persona-tab-${p.id}`} role="tab" type="button" aria-selected={on} aria-controls="persona-panel" tabIndex={on ? 0 : -1}
            onClick={() => onChange(p.id)} onMouseEnter={() => onHover(p.id)}
            className={cx('group flex items-center gap-3 rounded-card border px-3 py-2.5 text-left transition-[border-color,background-color] duration-150',
              on ? 'border-accent/60 bg-accent-tint' : 'border-line bg-surface hover:border-line-strong lg:bg-surface/80 lg:hover:bg-surface')}>
            <Icon name={p.icon} size={16} className={cx('shrink-0 transition-colors duration-150', on ? 'text-accent' : 'text-ink-3 group-hover:text-ink-2')} />
            <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-ink sm:truncate">{p.role}</span>
            <span className={cx('flex shrink-0 items-center gap-1 font-mono text-[11px]', on ? 'text-accent' : 'text-ink-2')}>
              <span className="sr-only">Answered on </span>{keyDest(p).label}<span className="sr-only">, stop {keyStop(p)}</span>
              <Icon name="arrow-right" size={11} className="transition-transform duration-150 group-hover:translate-x-0.5" />
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function UseCasesHero({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [hover, setHover] = useState<string | null>(null);
  const [hoverPage, setHoverPage] = useState<RoutePath | null>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const origins = useRowOrigins(fieldRef);
  return (
    <LiveHero layout={FAR_FIELD} seed={11} intensity={0.8}>
      <Container className="grid gap-8 py-10 md:py-12 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] lg:gap-6">
        {/* Stacked (below lg) the field runs behind the text, so a canvas-coloured panel fades it out under the copy. */}
        <div className="rise relative min-w-0 max-lg:-mx-4 max-lg:-mt-10 max-lg:bg-[linear-gradient(180deg,var(--canvas)_78%,transparent)] max-lg:px-4 max-lg:pb-2 max-lg:pt-10 sm:max-lg:-mx-6 sm:max-lg:px-6 md:max-lg:-mt-12 md:max-lg:pt-12">
          <h1 className="balance text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] text-ink md:text-[2.5rem]">Who reads REACH, and the route each one takes</h1>
          <p className="mt-3 max-w-[56ch] text-base leading-relaxed text-ink-2">Five readers arrive with different questions. Pick one to follow their route from the question they bring to the page that answers it.</p>
          <div className="mt-6"><ReaderTabs value={value} onChange={onChange} onHover={setHover} /></div>
        </div>

        {/* Live journeys: decorative; the tabs and route map below carry the same facts as text. */}
        <div ref={fieldRef} className="relative h-[240px] min-w-0 sm:h-[300px] lg:h-auto lg:min-h-[400px]">
          <JourneyField active={value} hover={hover} hoverPage={hoverPage} origins={origins} className="absolute inset-0" />
          {DEST_PAGES.map((page) => {
            const on = KEY_PAGE[value] === page;
            const readers = PERSONAS.filter((p) => KEY_PAGE[p.id] === page).length;
            return (
              <a key={page} href={href(page)} onMouseEnter={() => setHoverPage(page)} onMouseLeave={() => setHoverPage(null)}
                onFocus={() => setHoverPage(page)} onBlur={() => setHoverPage(null)}
                style={{ top: `${destY(page) * 100}%`, left: `calc(100% - ${DEST_INSET - 14}px)` }}
                className={cx('group absolute flex -translate-y-1/2 items-center gap-1.5 rounded-chip border px-2 py-1 font-mono text-xs backdrop-blur-sm transition-colors duration-150',
                  on ? 'border-accent/60 bg-accent-tint text-ink' : 'border-line bg-surface/85 text-ink hover:border-line-strong')}>
                <Icon name={routeOf(page).icon} size={13} className={on ? 'text-accent' : 'text-ink-3'} />
                <span>{routeOf(page).label}</span>
                <span className="sr-only">, answers {readers} of {PERSONAS.length} readers</span>
              </a>
            );
          })}
        </div>
      </Container>
    </LiveHero>
  );
}
