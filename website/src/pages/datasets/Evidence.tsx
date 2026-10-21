/* Ground truth: the four evidence arms, the P_HC rule, B_HC = 0, and the CNV-arm validation table (Table 9b). */
import { useRef } from 'react';
import { SectionHeader } from '../../ui/SectionHeader';
import { ArrowRight, Check, ICON_STROKE } from '../../ui/icons';
import { MOTION_OK, Reveal, ScrollTrigger, canAnimate, gsap, useGSAP } from '../../ui/motion';
import { ARMS, CNV_POOLED, COHORTS, f3, int, type Cohort } from './model';
import { useNarrow } from './useNarrow';
import { cx } from '../../lib/format';
import { scrollToId } from '../../lib/router';

/** Index of the CNV burden arm in ARMS. */
const LEAD_ARM = 1;

/** Short names for the four arms, as they appear in the P_HC rule. */
const ARM_CHIPS = ['Source positive', 'Aneuploid', 'AUCell ≥ 0.15', 'Purity ≥ 0.50'];
const CHIP_STEP_S = 0.16;

/**
 * The labelling rule as a sequence: the four arm chips light one after another, then the P_HC result appears.
 * Once, on first view. Reduced or paused motion: everything is lit from the start.
 */
function useRuleSequence() {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const root = ref.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      if (!canAnimate() || root.getBoundingClientRect().bottom < 0) return;
      const chips = root.querySelectorAll('[data-chip]');
      const ticks = root.querySelectorAll('[data-chip] svg');
      const result = root.querySelectorAll('[data-result]');
      const tl = gsap.timeline({ paused: true });
      tl.from(chips, { opacity: 0.35, duration: 0.24, ease: 'power2.out', stagger: CHIP_STEP_S, clearProps: 'opacity' }, 0)
        .from(ticks, { scale: 0, duration: 0.24, ease: 'back.out(2)', stagger: CHIP_STEP_S, clearProps: 'transform' }, 0.06)
        .from(result, { opacity: 0, x: -8, duration: 0.36, ease: 'power2.out', clearProps: 'opacity,transform' }, `>-0.04`);
      const st = ScrollTrigger.create({ trigger: root, start: 'top 82%', once: true, onEnter: () => (canAnimate() ? tl.play() : tl.progress(1)) });
      return () => { st.kill(); tl.progress(1).kill(); };
    });
    return () => mm.revert();
  }, { scope: ref });
  return ref;
}

function RuleLine() {
  const ref = useRuleSequence();
  return (
    <div ref={ref} className="card flex flex-col gap-4 p-5 shadow-[var(--elev-1)] lg:flex-row lg:items-center lg:gap-6">
      <ol aria-label="All four arms must agree" className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
        {ARM_CHIPS.map((t, i) => (
          <li key={t} className="flex items-center gap-1.5">
            <span data-chip className="inline-flex min-h-7 items-center gap-1.5 rounded-chip border border-accent bg-accent-tint px-2 font-mono text-[12px] text-accent-ink">
              <Check size={13} strokeWidth={2} aria-hidden="true" />{t}
            </span>
            {i < ARM_CHIPS.length - 1 && <span aria-hidden="true" className="font-mono text-[11px] text-ink-3">and</span>}
          </li>
        ))}
      </ol>
      <p data-result className="m-0 flex min-w-0 flex-1 items-start gap-3">
        <ArrowRight size={16} strokeWidth={ICON_STROKE} aria-hidden="true" className="mt-0.5 flex-none text-ink-3 max-lg:hidden" />
        <span><b className="mr-1.5 font-mono text-sm">P_HC</b><b>High-confidence malignant.</b> <span className="text-sm text-ink-2">Source positive, aneuploid (infercnvpy), AUCell ≥ 0.15 and kNN purity ≥ 0.50. These cells are the Track A positives.</span></span>
      </p>
    </div>
  );
}

export function Evidence() {
  return (
    <section id="evidence" aria-labelledby="ev-h" className="border-t border-line pb-14 pt-16 sm:pb-20 sm:pt-32">
      <SectionHeader id="ev-h" title="How a cell earns a label" lede="Four independent arms test every cell. A label is assigned only when all four agree." />
      <Reveal as="ol" variant="mask" className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3 p-0">
        {ARMS.map((m, i) => {
          // The CNV arm leads: it is the one arm checked against the authors' labels (Table 9b, next section).
          const lead = i === LEAD_ARM;
          return (
            <li key={m.title} className={cx('flex flex-col p-5', lead ? 'ds-lead fx-card fx-sheen' : 'card shadow-[var(--elev-1)]')}>
              <h3 className="m-0 text-lg font-semibold">{m.title}</h3>
              <p className="m-0 mt-1 font-mono text-[12px] text-ink-2">{m.tool}</p>
              <p className="m-0 mb-4 mt-3 text-sm leading-relaxed text-ink-2">{m.body}</p>
              {lead && (
                <button type="button" onClick={() => scrollToId('cnv')}
                  className="ds-nudge fx-underline -mt-1 mb-4 inline-flex cursor-pointer items-center gap-1.5 self-start border-0 bg-transparent p-0 text-[13px] font-medium text-accent-ink">
                  See the check, Table 9b <ArrowRight size={13} strokeWidth={ICON_STROKE} aria-hidden="true" />
                </button>
              )}
              <dl className="m-0 mt-auto grid grid-cols-[auto_1fr] items-center gap-x-2.5 gap-y-1 border-t border-line pt-3 text-sm">
                <dt className="font-mono text-[11px] font-semibold">P_HC</dt>
                <dd className="m-0 inline-flex items-center gap-1.5"><Check size={13} strokeWidth={2} aria-hidden="true" className="text-accent" />{m.pos}</dd>
                <dt className="font-mono text-[11px] font-semibold text-ink-3">B_HC</dt>
                <dd className="m-0 text-ink-2">{m.neg}</dd>
              </dl>
            </li>
          );
        })}
      </Reveal>
      <div className="mt-6 grid gap-3">
        <RuleLine />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-card border border-dashed border-line-strong bg-sunk p-5">
          <b className="font-mono text-sm text-ink-2">B_HC</b>
          <span className="font-mono text-[28px] font-semibold">n = 0</span>
          <span className="min-w-0 flex-[1_1_420px] text-sm text-ink-2">No cell met all four benign criteria on any cohort or threshold setting, so Track A backgrounds come from the broader source-negative, diploid, low-signature pool (§3.5).</span>
        </div>
      </div>
    </section>
  );
}

const auPos = (au: number) => `${(((au - 0.5) / 0.5) * 100).toFixed(1)}%`;

function AuDot({ au, pooled }: { au: number; pooled?: boolean }) {
  return (
    <span className="relative block h-0.5 bg-line">
      <span data-au className={`absolute -top-1 -ml-[4.5px] size-[9px] rounded-full ${pooled ? 'bg-accent' : 'bg-cell'}`} style={{ left: auPos(au) }} />
    </span>
  );
}

const DOT_STAGGER_S = 0.035;

/** The AUROC markers slide in along the axis from 0.5, one row after another, once on first view. Rows do not move. */
function useAuDraw(layoutKey: string) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const root = ref.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      if (!canAnimate() || root.getBoundingClientRect().bottom < 0) return;
      const dots = Array.from(root.querySelectorAll<HTMLElement>('[data-au]'));
      gsap.set(dots, { opacity: 0, x: (_i: number, el: HTMLElement) => -el.offsetLeft });
      const st = ScrollTrigger.create({
        trigger: root, start: 'top 80%', once: true,
        onEnter: () => {
          if (!canAnimate()) { gsap.set(dots, { clearProps: 'opacity,transform' }); return; }
          gsap.to(dots, { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out', stagger: DOT_STAGGER_S, clearProps: 'opacity,transform' });
        },
      });
      return () => { st.kill(); gsap.set(dots, { clearProps: 'opacity,transform' }); };
    });
    return () => mm.revert();
  }, { scope: ref, dependencies: [layoutKey], revertOnUpdate: true });
  return ref;
}

interface CnvLine { id: string; au: number; se: number | null; sp: number | null; mcc: number | null; pos: number; cells: number; pooled?: boolean }

/** Phone layout: one block per cohort, AUROC beside the name and the axis under it, so nothing hides off-screen. */
function CnvPhoneList({ lines }: { lines: CnvLine[] }) {
  return (
    <ul aria-label="CNV arm against author labels, sorted by AUROC" className="m-0 list-none p-0">
      {lines.map((l) => (
        <li key={l.id} className={`border-t border-line px-4 py-3 font-mono tabular-nums first:border-t-0 ${l.pooled ? 'bg-sunk' : ''}`}>
          <p className="m-0 flex items-baseline justify-between gap-3 text-[13px]">
            <span className={l.pooled ? 'font-semibold' : ''}>{l.id}</span>
            <span className="font-semibold">AUROC {f3(l.au)}</span>
          </p>
          <span className="mt-2.5 block"><AuDot au={l.au} pooled={l.pooled} /></span>
          <p className="m-0 mt-2.5 text-[11px] text-ink-2">Sens. {f3(l.se)} · Spec. {f3(l.sp)} · MCC {f3(l.mcc)} · {int(l.pos)} / {int(l.cells)}</p>
        </li>
      ))}
    </ul>
  );
}

const toLine = (c: Cohort): CnvLine => ({ id: c.id, au: c.au ?? 0.5, se: c.se, sp: c.sp, mcc: c.mcc, pos: c.pos ?? 0, cells: c.cc ?? 0 });

const num = 'px-3 text-right';

export function CnvTable() {
  const rows = COHORTS.filter((c) => c.au !== null && c.cc && c.pos != null).sort((x, y) => (y.au ?? 0) - (x.au ?? 0));
  const narrow = useNarrow();
  const drawRef = useAuDraw(narrow ? 'list' : 'table');
  const pooled: CnvLine = { id: `Pooled · ${rows.length} cohorts`, au: CNV_POOLED.au, se: CNV_POOLED.se, sp: CNV_POOLED.sp, mcc: CNV_POOLED.mcc, pos: CNV_POOLED.pos, cells: CNV_POOLED.cells, pooled: true };
  return (
    <section id="cnv" aria-labelledby="cnv-h" className="pb-14 pt-8 sm:pb-20 sm:pt-16">
      <SectionHeader
        id="cnv-h"
        as="h2"
        eyebrow="Table 9b"
        title="How well does the CNV arm agree with authors?"
        lede={`infercnvpy calls against the authors' own labels on ${int(CNV_POOLED.cells)} cells in ${rows.length} cohorts, sorted by AUROC.`}
      />
      <div ref={drawRef} className="relative overflow-x-auto rounded-card border border-line bg-surface shadow-[var(--elev-1)]">
        {narrow ? <CnvPhoneList lines={[...rows.map(toLine), pooled]} /> : (
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <caption className="absolute h-px w-px overflow-hidden [clip:rect(0_0_0_0)]">CNV arm against author labels per cohort, sorted by AUROC, with the pooled result</caption>
          <thead className="bg-sunk font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3">
            <tr className="h-10">
              <th scope="col" className="px-3 text-left font-normal">Cohort</th>
              <th scope="col" className="w-[28%] px-3 text-left font-normal">AUROC · 0.5 to 1.0</th>
              <th scope="col" className={`${num} font-normal`}>AUROC</th>
              <th scope="col" className={`${num} font-normal`}>Sens.</th>
              <th scope="col" className={`${num} font-normal`}>Spec.</th>
              <th scope="col" className={`${num} font-normal`}>MCC</th>
              <th scope="col" className={`${num} font-normal`}>Positive / cells</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="h-10 border-t border-line font-mono tabular-nums transition-colors duration-150 hover:bg-(--row-hover)">
                <th scope="row" className="px-3 text-left text-[13px] font-normal">{c.id}</th>
                <td className="px-3"><AuDot au={c.au ?? 0.5} /></td>
                <td className={num}>{f3(c.au)}</td>
                <td className={`${num} text-ink-2`}>{f3(c.se)}</td>
                <td className={`${num} text-ink-2`}>{f3(c.sp)}</td>
                <td className={`${num} text-ink-2`}>{f3(c.mcc)}</td>
                <td className={`${num} text-ink-2`}>{int(c.pos ?? 0)} / {int(c.cc ?? 0)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-sunk font-mono font-semibold tabular-nums">
            <tr className="h-10 border-t border-line">
              <th scope="row" className="px-3 text-left text-[13px]">Pooled · {rows.length} cohorts</th>
              <td className="px-3"><AuDot au={CNV_POOLED.au} pooled /></td>
              <td className={num}>{f3(CNV_POOLED.au)}</td>
              <td className={num}>{f3(CNV_POOLED.se)}</td>
              <td className={num}>{f3(CNV_POOLED.sp)}</td>
              <td className={num}>{f3(CNV_POOLED.mcc)}</td>
              <td className={num}>{int(CNV_POOLED.pos)} / {int(CNV_POOLED.cells)}</td>
            </tr>
          </tfoot>
        </table>
        )}
      </div>
    </section>
  );
}
