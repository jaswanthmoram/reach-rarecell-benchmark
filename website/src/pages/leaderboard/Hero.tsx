import { useCallback, useRef } from 'react';
import { Button, Container, LiveHero, fmt, methodColor, type LiveLayout } from '../../ui';
import { ForestCanvas } from './ForestCanvas';
import { REFERENCE_MARKS } from './model';

/**
 * Far layer: a sparse, slowly drifting field of cells behind the whole hero, with a few rare signal cells that the
 * shared engine "finds" in turn. The near layer is the live forest plot; the scrim keeps the text column calm.
 */
const FAR_FIELD: LiveLayout = (r) => {
  const out = Array.from({ length: 520 }, () => ({ x: r(), y: r(), r: 0.5 + r() * 0.9, vx: 0.002 + r() * 0.004 }));
  for (let i = 0; i < 5; i++) out.push({ x: 0.55 + r() * 0.42, y: 0.1 + r() * 0.8, r: 2.4, vx: 0.003 });
  return out.map((p, i) => (i >= 520 ? { ...p, signal: true } : p));
};

/** Scrolls to a method's row in the board and focuses its expand button, so the hero hands off to the table. */
function focusRow(id: string) {
  // Desktop row or mobile card, whichever is rendered; the board if the row is filtered out.
  const el = [`lb-row-${id}`, `lb-mrow-${id}`].map((x) => document.getElementById(x)).find((e) => e?.offsetParent) ?? document.getElementById('board');
  if (!el) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  el.querySelector<HTMLButtonElement>('button[aria-expanded]')?.focus({ preventScroll: true });
}

interface HeroProps { fdrExpr: string; fdrScmf: string; onJump: (id: string) => () => void }

export function LeaderboardHero({ fdrExpr, fdrScmf, onJump }: HeroProps) {
  const counter = useRef<HTMLSpanElement>(null);
  const pick = useCallback((id: string) => focusRow(id), []);
  return (
    <LiveHero layout={FAR_FIELD} seed={23} intensity={0.7} className="!border-b-0">
      <Container className="grid gap-6 pb-6 pt-7 md:grid-cols-[minmax(0,1fr)_minmax(0,560px)] md:items-center md:gap-10 md:pb-8 md:pt-9">
        <div className="rise min-w-0 max-w-[600px]">
          <p className="label mb-3">Track A · primary endpoint</p>
          <h1 className="balance text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] text-ink md:text-[2.5rem]">
            Six ranked detectors, four reference rows
          </h1>
          <p className="mt-3 max-w-[58ch] text-base leading-relaxed text-ink-2">
            Ranked by Track A median AP. FiRE is highest of the six but not significantly ahead of scMalignantFinder
            (BH-FDR <span className="font-medium text-ink tabular">{fdrScmf}</span>) or the naive expr_threshold baseline
            (BH-FDR <span className="font-medium text-ink tabular">{fdrExpr}</span>).
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={onJump('board')} iconRight="caret-down">Open the table</Button>
            <Button variant="ghost" size="sm" onClick={onJump('pairwise')} icon="scales">Pairwise tests</Button>
          </div>
        </div>

        <figure className="rise min-w-0 rounded-card border border-line bg-surface/85 p-3 backdrop-blur-[2px] [animation-delay:80ms] md:p-4">
          <figcaption className="mb-2 flex items-baseline justify-between gap-3">
            <span className="label">95% bootstrap intervals · Figure 4a</span>
            <span className="whitespace-nowrap font-mono text-[11px] text-ink-3 tabular" aria-hidden="true">
              resample <span ref={counter} className="inline-block min-w-[4ch] text-right text-ink-2">1</span> / {fmt.int(2000)}
            </span>
          </figcaption>
          <ForestCanvas onPick={pick} counterRef={counter} />
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] leading-relaxed text-ink-3">
            <span>Moving dots: illustrative draws inside each interval. Dashed, bootstrap mean AP:</span>
            {REFERENCE_MARKS.map((r) => (
              <span key={r.id} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span aria-hidden="true" className="h-3 border-l border-dashed" style={{ borderColor: methodColor(r.id) }} />
                {r.method} <span className="text-ink-2 tabular">{fmt.ap(r.bootstrapMeanAP)}</span>
              </span>
            ))}
          </p>
        </figure>
      </Container>
    </LiveHero>
  );
}
