import { useEffect, useState } from 'react';
import { LEADERBOARD_DATA } from '../../data/benchmarkData';
import { Button, Icon, Loader, MethodName } from '../../ui';
import { contrast, cx, isReference, methodSortKey } from './util';
import { useLiveTokens } from './useLiveTokens';
import { Ratio, Sub, SysSection, Usage, Well } from './kit';
import { LiveFields, LiveHeroSpec } from './Live';

/* ---------- Colour ---------- */
type Tok = { name: string; cls: string; role: string; min?: number };
const GROUPS: { title: string; note: string; tokens: Tok[] }[] = [
  { title: 'Neutrals', note: 'Gray first. Hairlines instead of shadows.', tokens: [
    { name: 'canvas', cls: 'bg-canvas', role: 'Page background' },
    { name: 'surface', cls: 'bg-surface', role: 'Cards, tables, panels' },
    { name: 'surface-sunk', cls: 'bg-sunk', role: 'Code, wells, hover rows' },
    { name: 'ink', cls: 'text-ink', role: 'Headings, body, numbers', min: 4.5 },
    { name: 'ink-2', cls: 'text-ink-2', role: 'Secondary text, leads', min: 4.5 },
    { name: 'ink-3', cls: 'text-ink-3', role: 'Labels, metadata, captions', min: 4.5 },
    { name: 'line', cls: 'border-line', role: 'Hairline borders, row rules' },
    { name: 'line-strong', cls: 'border-line-strong', role: 'Hover borders, inputs, chips' },
  ] },
  { title: 'Accent and signal', note: 'One accent for action. Signal is the rare-cell motif only.', tokens: [
    { name: 'accent', cls: 'text-accent', role: 'Links, focus, selection, highlighted series', min: 4.5 },
    { name: 'accent-ink', cls: 'text-accent-ink', role: 'Text on accent tint', min: 4.5 },
    { name: 'accent-tint', cls: 'bg-accent-tint', role: 'Selected and accent badge fills' },
    { name: 'signal', cls: 'bg-signal', role: 'The found cell: mark, art, dot-field', min: 3 },
    { name: 'signal-tint', cls: 'bg-signal-tint', role: 'Signal badge fill (motif contexts)' },
  ] },
  { title: 'Status and chart', note: 'Status is for audit and QC states only. Charts are gray with one highlight.', tokens: [
    { name: 'ok', cls: 'text-ok', role: 'Passed audit, success toast', min: 3 },
    { name: 'warn', cls: 'text-warn', role: 'Proxy, fallback, caution', min: 3 },
    { name: 'bad', cls: 'text-bad', role: 'Excluded, failed, error state', min: 3 },
    { name: 'chart-base', cls: 'bg-chart', role: 'Default series mark' },
    { name: 'chart-muted', cls: 'bg-chart-muted', role: 'Gridlines, inactive series' },
  ] },
];
const ALL_NAMES = [...GROUPS.flatMap((g) => g.tokens.map((t) => t.name)), ...LEADERBOARD_DATA.map((m) => `m-${m.id.toLowerCase()}`)];

function Swatch({ light, dark }: { light: string; dark: string }) {
  return (
    <span className="flex h-9 w-16 shrink-0 overflow-hidden rounded-chip border border-line" aria-hidden="true">
      <span className="flex-1" style={{ background: light }} />
      <span className="flex-1" style={{ background: dark }} />
    </span>
  );
}

type Values = { light: Record<string, string>; dark: Record<string, string> } | null;
type Read = (theme: 'light' | 'dark', n: string) => string;

function ContrastPair({ t, v }: { t: Tok; v: Read }) {
  if (t.min === undefined) return <span className="text-xs text-ink-3">Not a text colour</span>;
  return (
    <span className="flex flex-wrap gap-2">
      <Ratio value={contrast(v('light', t.name), v('light', 'surface'))} min={t.min} />
      <Ratio value={contrast(v('dark', t.name), v('dark', 'surface'))} min={t.min} />
    </span>
  );
}

/** Phones: the same tokens as a stacked list, so nothing hides behind a sideways scroll. */
function TokenList({ tokens, v }: { tokens: Tok[]; v: Read }) {
  return (
    <ul className="divide-y divide-line rounded-card border border-line bg-surface md:hidden">
      {tokens.map((t) => (
        <li key={t.name} className="flex items-start gap-3 px-4 py-3">
          <Swatch light={v('light', t.name)} dark={v('dark', t.name)} />
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[13px] text-ink">--{t.name} <span className="text-[11px] text-ink-3">{t.cls}</span></p>
            <p className="mt-0.5 text-xs leading-snug text-ink-2">{t.role}</p>
            <p className="mt-1.5 font-mono text-[11px] text-ink-2 tabular">L {v('light', t.name)} · D {v('dark', t.name)}</p>
            <div className="mt-1.5"><ContrastPair t={t} v={v} /></div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Colour({ values }: { values: Values }) {
  const v: Read = (theme, n) => values?.[theme][n] ?? '';
  const methods = [...LEADERBOARD_DATA].sort((a, b) => methodSortKey(a) - methodSortKey(b));
  return (
    <>
      {GROUPS.map((g) => (
        <Sub key={g.title} title={g.title} note={g.note}>
          <TokenList tokens={g.tokens} v={v} />
          <div className="hidden overflow-x-auto rounded-card border border-line bg-surface md:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <caption className="sr-only">{g.title} tokens with light and dark values and contrast against surface</caption>
              <thead className="border-b border-line">
                <tr className="h-10">
                  <th scope="col" className="label w-[34%] px-4 font-normal">Token</th>
                  <th scope="col" className="label px-4 font-normal">Role</th>
                  <th scope="col" className="label px-4 font-normal">Light</th>
                  <th scope="col" className="label px-4 font-normal">Dark</th>
                  <th scope="col" className="label px-4 font-normal">vs surface L / D</th>
                </tr>
              </thead>
              <tbody>
                {g.tokens.map((t) => {
                  const [l, d] = [v('light', t.name), v('dark', t.name)];
                  return (
                    <tr key={t.name} className="h-12 border-b border-line last:border-b-0">
                      <th scope="row" className="px-4 font-normal">
                        <span className="flex items-center gap-3">
                          <Swatch light={l} dark={d} />
                          <span className="min-w-0">
                            <span className="block font-mono text-[13px] text-ink">--{t.name}</span>
                            <span className="block font-mono text-[11px] text-ink-3">{t.cls}</span>
                          </span>
                        </span>
                      </th>
                      <td className="px-4 text-xs leading-snug text-ink-2">{t.role}</td>
                      <td className="px-4 font-mono text-xs text-ink-2">{l}</td>
                      <td className="px-4 font-mono text-xs text-ink-2">{d}</td>
                      <td className="px-4"><ContrastPair t={t} v={v} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Sub>
      ))}

      <Sub title="Method identity" note="Marks only (dots, whiskers, lines). Text stays ink. All ≥ 3:1 on surface, both themes">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {methods.map((m) => {
            const n = `m-${m.id.toLowerCase()}`;
            const [l, d] = [v('light', n), v('dark', n)];
            const ranked = m.publishedRankNum !== null;
            return (
              <div key={m.id} className="flex min-w-0 flex-col gap-3 rounded-card border border-line bg-surface p-3 sm:p-3.5">
                <span className="flex h-10 overflow-hidden rounded-chip border border-line" aria-hidden="true">
                  <span className="flex-1" style={{ background: l }} />
                  <span className="flex-1" style={{ background: d }} />
                </span>
                <MethodName id={m.id} name={m.method} reference={isReference(m.id)} className="min-w-0 text-[12px]! sm:text-[13px]!" />
                <span className="font-mono text-[11px] text-ink-3">{ranked ? `rank ${m.publishedRankNum} of 6` : (m.paperRole ?? 'reference').toLowerCase()}</span>
                <span className="flex flex-wrap gap-2">
                  <Ratio value={contrast(l, v('light', 'surface'))} min={3} />
                  <Ratio value={contrast(d, v('dark', 'surface'))} min={3} />
                </span>
              </div>
            );
          })}
        </div>
      </Sub>
    </>
  );
}

/* ---------- Type ---------- */
const TYPE: { name: string; spec: string; cls: string; sample: string; mono?: boolean }[] = [
  { name: 'Display', spec: 'clamp 40→76px · 600 · −0.035em · Home hero only', cls: 'text-display font-semibold', sample: 'Rare cells, found.' },
  { name: 'Page title', spec: '40px (32 on phones) · 600 · −0.03em · lh 1.1', cls: 'text-[2rem] md:text-[2.5rem] font-semibold leading-[1.1] tracking-[-0.03em]', sample: 'Six evaluation tracks' },
  { name: 'Section', spec: '36px (24 on phones) · 600 · −0.02em', cls: 'text-2xl md:text-4xl font-semibold tracking-[-0.02em]', sample: 'Where each question lands' },
  { name: 'Lead', spec: '18px · 400 · ink-2 · measure 62ch', cls: 'text-lg text-ink-2', sample: 'Ranks are inter-lineage and carry their bootstrap interval.' },
  { name: 'Body', spec: '16px · lh 1.625 · measure 68ch', cls: 'text-base leading-relaxed text-ink-2', sample: 'Malignant cells are spiked into real immune and stromal backgrounds at four prevalence tiers.' },
  { name: 'UI and tables', spec: '14px · 400 / 500', cls: 'text-sm text-ink', sample: 'Median AP · Track A · 160 units' },
  { name: 'Small', spec: '12px · captions, context lines', cls: 'text-xs text-ink-2', sample: 'n = 160 units · 2,000 bootstrap resamples' },
  { name: 'Label', spec: 'Geist Mono 11px · uppercase · +0.06em · ink-3', cls: 'label', sample: 'Cohorts · 10', mono: true },
  { name: 'Numbers', spec: 'Geist Mono 13px · tabular · AP to 3 decimals. Sample: Track A median AP, ranks 1 to 4', cls: 'font-mono text-[13px] tabular text-ink', sample: '0.313  0.259  0.235  0.196', mono: true },
];

function Type() {
  return (
    <Sub title="Type scale" note="Geist (UI, prose) and Geist Mono (labels, numbers, code). Two families, no serif">
      <div className="divide-y divide-line rounded-card border border-line bg-surface">
        {TYPE.map((t) => (
          <div key={t.name} className="grid gap-2 px-4 py-5 md:grid-cols-[200px_minmax(0,1fr)] md:gap-8 md:px-5">
            <div>
              <p className="text-sm font-medium text-ink">{t.name}</p>
              <p className="mt-1 font-mono text-[11px] leading-snug text-ink-3">{t.spec}</p>
            </div>
            <p className={cx('min-w-0 text-ink [overflow-wrap:anywhere]', t.cls)}>{t.sample}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Well dense label="tabular (tables)"><span className="font-mono text-2xl tabular text-ink">0.111<br />0.999</span></Well>
        <Well dense label="proportional (prose only)"><span className="text-2xl text-ink [font-variant-numeric:proportional-nums]">0.111<br />0.999</span></Well>
      </div>
    </Sub>
  );
}

/* ---------- Space, radius, depth ---------- */
const SPACE = [4, 8, 12, 16, 24, 32, 48, 80, 128];
function Space() {
  return (
    <>
      <Sub title="Spacing" note="4px base. Dense data blocks use 24/32. Topic changes use 80/128">
        <div className="overflow-x-auto rounded-card border border-line bg-surface">
          <ol className="flex min-w-max items-end gap-5 px-5 pb-4 pt-6">
            {SPACE.map((s) => (
              <li key={s} className="flex flex-col items-start gap-2">
                <span className="block rounded-[2px] bg-chart" style={{ width: s, height: s }} />
                <span className="font-mono text-[11px] text-ink-3 tabular">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </Sub>
      <Sub title="Radius and depth" note="Radius set by role. Shadow only for floating layers">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { r: '0', cls: 'rounded-none', use: 'Table rows' },
            { r: '4px', cls: 'rounded-chip', use: 'Chips, badges, inputs' },
            { r: '8px', cls: 'rounded-card', use: 'Cards, code, figures' },
            { r: 'full', cls: 'rounded-full', use: 'Segmented tabs only' },
          ].map((x) => (
            <div key={x.r} className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
              <span className={cx('h-14 border border-line-strong bg-sunk', x.cls)} />
              <span><span className="block font-mono text-xs text-ink">{x.r}</span><span className="text-xs text-ink-2">{x.use}</span></span>
            </div>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Well dense label="resting"><span className="block h-16 w-full rounded-card border border-line bg-surface" /></Well>
          <Well dense label="hover"><span className="block h-16 w-full rounded-card border border-line-strong bg-surface" /></Well>
          <Well dense label="floating · shadow-pop"><span className="block h-16 w-full rounded-card border border-line bg-surface shadow-pop" /></Well>
        </div>
      </Sub>
    </>
  );
}

/* ---------- Motion ---------- */
const MOTION = [
  { token: '--dur-fast', value: '150ms', use: 'Hover, focus, colour swaps, floating layers in' },
  { token: '--dur-base', value: '300ms', use: 'Disclosure, nav indicator, tab underline' },
  { token: '--dur-rise', value: '600ms', use: '.rise page entry, once. .reveal is a no-op: no scroll fades' },
  { token: '--ease-out', value: 'cubic-bezier(.16,1,.3,1)', use: 'Everything that enters or moves' },
  { token: 'loader', value: '1800ms loop', use: 'Cells pulse, then the cell is found. Ends on its start frame' },
  { token: 'LiveField', value: '1.6 s per found cell', use: 'Hero fields: cells drift, rare cells pulse, a ring finds one at a time. Paused off-screen' },
];

function useReducedMotion() {
  const [rm, setRm] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setRm(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return rm;
}

/** Plot of the ease-out curve with a marker that runs it on demand (transform only). */
function EaseDemo() {
  const [go, setGo] = useState(false);
  // cubic-bezier(.16,1,.3,1) on a 200×100 plot
  const d = 'M 0 100 C 32 0, 60 0, 200 0';
  return (
    <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center">
      <svg viewBox="-8 -8 216 116" className="h-28 w-56 shrink-0" aria-label="Ease-out curve (cobalt) against linear (dashed gray): fast start, long settle">
        <rect x="0" y="0" width="200" height="100" fill="none" className="stroke-line" strokeWidth="1" />
        <path d="M 0 100 L 200 0" fill="none" className="stroke-ink-3" strokeDasharray="3 3" strokeWidth="1" />
        <path d={d} fill="none" className="stroke-accent" strokeWidth="2" />
      </svg>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {[{ name: 'ease-out', timing: 'var(--ease-out)', knob: 'bg-accent' }, { name: 'linear', timing: 'linear', knob: 'bg-ink-3' }].map((x) => (
          <div key={x.name} className="flex items-center gap-3">
            <span className="w-16 font-mono text-[11px] text-ink-3">{x.name}</span>
            <span className="relative block h-3 flex-1 [container-type:inline-size]">
              <span className="absolute inset-x-0 top-1/2 h-px bg-line-strong" />
              <span className={cx('absolute left-0 top-0 size-3 rounded-full transition-transform duration-[600ms]', x.knob)}
                style={{ transitionTimingFunction: x.timing, transform: go ? 'translateX(calc(100cqw - 0.75rem))' : 'none' }} />
            </span>
          </div>
        ))}
        <Button size="sm" variant="secondary" onClick={() => setGo((g) => !g)} className="self-start">{go ? 'Reset' : 'Run 600ms'}</Button>
      </div>
    </div>
  );
}

function Motion() {
  const rm = useReducedMotion();
  const [riseKey, setRiseKey] = useState(0);
  const [open, setOpen] = useState(false);
  return (
    <Sub title="Tokens and feedback" note="Transform, opacity and canvas only. No animation library">
      <dl className="divide-y divide-line rounded-card border border-line bg-surface md:hidden">
        {MOTION.map((m) => (
          <div key={m.token} className="px-4 py-3">
            <dt className="flex flex-wrap items-baseline justify-between gap-x-3 font-mono text-[13px] text-ink">{m.token}<span className="text-xs text-ink-2">{m.value}</span></dt>
            <dd className="mt-0.5 text-xs leading-snug text-ink-2">{m.use}</dd>
          </div>
        ))}
      </dl>
      <div className="hidden overflow-x-auto rounded-card border border-line bg-surface md:block">
        <table className="w-full min-w-[620px] text-left text-sm">
          <caption className="sr-only">Motion tokens</caption>
          <thead className="border-b border-line"><tr className="h-10">
            <th scope="col" className="label px-4 font-normal">Token</th><th scope="col" className="label px-4 font-normal">Value</th><th scope="col" className="label px-4 font-normal">Used for</th>
          </tr></thead>
          <tbody>
            {MOTION.map((m) => (
              <tr key={m.token} className="h-10 border-b border-line last:border-b-0">
                <th scope="row" className="px-4 font-mono text-[13px] font-normal text-ink">{m.token}</th>
                <td className="px-4 font-mono text-xs text-ink-2">{m.value}</td>
                <td className="px-4 text-xs text-ink-2">{m.use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Well label="curve"><EaseDemo /></Well>
        <Well label="rise · page entry">
          <div className="flex w-full items-center justify-between gap-4">
            <div key={riseKey} className="rise min-w-0">
              <p className="label mb-1.5">Leaderboard</p>
              <p className="text-xl font-semibold tracking-[-0.02em] text-ink">Six ranked detectors</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setRiseKey((k) => k + 1)}>Replay</Button>
          </div>
        </Well>
        <Well label="disclosure · 300ms">
          <div className="flex w-full flex-col gap-3">
            <Button size="sm" variant="secondary" onClick={() => setOpen((o) => !o)} iconRight="caret-down" className="self-start">{open ? 'Hide note' : 'Show note'}</Button>
            <p aria-hidden={!open} className={cx('text-sm text-ink-2 transition-[opacity,transform] duration-300 [transition-timing-function:var(--ease-out)]', open ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0')}>
              The panel keeps its space, so nothing below it moves. Only opacity and position change.
            </p>
          </div>
        </Well>
        <Well label="reduced motion">
          <div className="flex w-full items-center gap-4">
            <Loader size={36} label="Loader specimen" />
            <p className="text-sm leading-relaxed text-ink-2">
              <span className="flex items-center gap-1.5 font-medium text-ink"><Icon name={rm ? 'check' : 'info'} size={14} className={rm ? 'text-ok' : 'text-ink-3'} />Reduced motion is {rm ? 'on' : 'off'} on this device.</span>
              When on, every animation collapses and the loader shows the complete mark, static.
            </p>
          </div>
        </Well>
      </div>
    </Sub>
  );
}

export function Foundations() {
  const { values, probes } = useLiveTokens(ALL_NAMES);
  return (
    <>
      <SysSection id="colour" title="Colour"
        lead="Values on this page are read live from tokens.css in both themes, so the table cannot drift from the code. Contrast is against the surface colour of the same theme.">
        {probes}
        <Colour values={values} />
        <Usage>{`className="bg-surface text-ink border-line"   // tokens only, never raw hex
style={{ background: methodColor('FiRE') }}     // method marks: var(--m-fire)`}</Usage>
      </SysSection>
      <SysSection id="type" title="Type" lead="One scale, role-based. Headings are balanced and tight. Prose holds a 62 to 68 character measure. Every number in a table is tabular.">
        <Type />
      </SysSection>
      <SysSection id="space" title="Space, radius and depth" lead="Rhythm varies with the content: dense data packs tight, transitions between topics get room. Depth comes from hairlines.">
        <Space />
      </SysSection>
      <SysSection id="motion" title="Motion" lead="Two kinds of motion. Each page hero runs a live dot-field: the rare-cell motif, moving. Everything you touch answers in 150 to 300ms. Reduced motion turns both into still frames.">
        <LiveFields />
        <LiveHeroSpec />
        <Motion />
      </SysSection>
    </>
  );
}
