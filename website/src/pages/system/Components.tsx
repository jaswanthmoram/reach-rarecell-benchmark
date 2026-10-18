import { useState, type ReactNode } from 'react';
import { GLOBAL_STATS as G, LEADERBOARD_DATA } from '../../data/benchmarkData';
import { href } from '../../app/router';
import {
  Badge, Button, CIBar, Card, CodeBlock, EmptyState, ErrorState, Icon, Loader, MethodName, PageHeader,
  Skeleton, SkeletonCard, SkeletonTable, SkeletonText, Stat, Tabs, Tooltip, TrackChip, fmt, methodColor, useToast,
} from '../../ui';
import { SysSection, Usage, Well } from './kit';
import { cx, isReference, methodSortKey } from './util';

const RANKED = LEADERBOARD_DATA.filter((m) => m.publishedRankNum !== null).sort((a, b) => a.publishedRankNum! - b.publishedRankNum!);
const CEILING = LEADERBOARD_DATA.find((m) => m.id === 'hvg_logreg')!;
const FIRE = LEADERBOARD_DATA.find((m) => m.id === 'FiRE')!;
const REFERENCES = ['CaSee', 'expr_threshold', 'random_baseline'].map((id) => LEADERBOARD_DATA.find((m) => m.id === id)!).filter(Boolean);

/** One component specimen: name, when to use it, live preview, states, usage. */
/** `wide` drops the preview under the description at full width, for specimens laid out at page width (PageHeader). */
function Spec({ id, name, use, children, usage, states, wide }: { id: string; name: string; use: ReactNode; children: ReactNode; usage: string; states?: string; wide?: boolean }) {
  return (
    <article id={`c-${id}`} className={cx('scroll-mt-20 grid gap-4 border-t border-line pt-8 first:border-t-0 first:pt-0', !wide && 'lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10')}>
      <div className={cx(wide && 'max-w-[66ch]')}>
        <h3 className="font-mono text-[15px] font-medium text-ink">{name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">{use}</p>
        {states && <p className="mt-3 font-mono text-[11px] leading-relaxed text-ink-3">States: {states}</p>}
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        {children}
        <Usage>{usage}</Usage>
      </div>
    </article>
  );
}

function SkeletonDemo() {
  const [loaded, setLoaded] = useState(false);
  return (
    <Well label={loaded ? 'loaded' : 'loading'}>
      <div className="grid w-full gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {loaded ? (
          <div className="fade-in overflow-hidden rounded-card border border-line bg-surface">
            {RANKED.slice(0, 4).map((m) => (
              <div key={m.id} className="flex h-10 items-center justify-between border-b border-line px-4 last:border-b-0">
                <MethodName id={m.id} name={m.method} />
                <span className="font-mono text-[13px] tabular text-ink">{fmt.ap(m.medianAP)}</span>
              </div>
            ))}
          </div>
        ) : <SkeletonTable rows={4} cols={2} />}
        <div className="flex flex-col gap-4">
          {loaded ? <Stat label="Track A units" value={G.trackAUnits} context={`of ${fmt.int(G.totalUnits)} benchmark units`} /> : <SkeletonCard />}
        </div>
      </div>
      <div className="flex w-full items-center gap-3">
        <Button size="sm" variant="secondary" className="shrink-0 whitespace-nowrap" onClick={() => setLoaded((l) => !l)}>{loaded ? 'Show skeleton' : 'Show loaded'}</Button>
        <span className="text-xs text-ink-3">Same footprint in both states: no layout shift when data lands.</span>
      </div>
    </Well>
  );
}

// Phones: name and value on one line, the interval bar full width under them. From 640px: one 40px row.
const CI_ROW = 'grid grid-cols-[minmax(0,1fr)_56px] items-center gap-x-4 gap-y-1.5 px-4 py-2.5 sm:h-10 sm:grid-cols-[172px_minmax(0,1fr)_56px] sm:py-0';
const CI_BAR = 'order-last col-span-2 sm:order-none sm:col-span-1';

function StatesDemo() {
  const [mode, setMode] = useState<'empty' | 'error' | 'done'>('empty');
  const toast = useToast();
  const retry = () => new Promise<void>((resolve) => setTimeout(() => { setMode('done'); resolve(); toast({ title: 'Loaded', tone: 'ok' }); }, 1200));
  return (
    <div className="flex flex-col gap-3">
      <div><Tabs label="State" value={mode} onChange={setMode} options={[{ value: 'empty', label: 'Empty' }, { value: 'error', label: 'Error' }, { value: 'done', label: 'Recovered' }]} /></div>
      {mode === 'empty' && (
        <EmptyState title="No method matches these filters"
          action={<Button size="sm" variant="secondary" onClick={() => toast({ title: 'Filters cleared' })}>Clear filters</Button>}>
          R methods with a runtime under 10 s per unit were selected. The three R methods all take longer. Clear a filter to see results.
        </EmptyState>
      )}
      {mode === 'error' && (
        <ErrorState title="The figure did not load" detail="GET figures/paper/fig-4.webp · 404" onRetry={retry}>
          The image file is missing or the connection dropped. Try again, or open the figure from the paper PDF.
        </ErrorState>
      )}
      {mode === 'done' && (
        <div className="fade-in flex items-center gap-3 rounded-card border border-line bg-surface px-5 py-4 text-sm text-ink">
          <Icon name="check" size={16} className="text-ok" /> Content in place. Retry resolves here. While it runs the button shows the loader and is disabled.
        </div>
      )}
    </div>
  );
}

function ToastDemo() {
  const toast = useToast();
  return (
    <Well>
      <Button size="sm" variant="secondary" icon="copy" onClick={() => toast({ title: 'Citation copied', tone: 'ok' })}>Success</Button>
      <Button size="sm" variant="secondary" icon="download-simple" onClick={() => toast({ title: 'Exporting leaderboard.csv', description: '10 methods, Track A summary' })}>Neutral</Button>
      <Button size="sm" variant="secondary" icon="warning-circle" onClick={() => toast({ title: 'Copy failed', description: 'The browser blocked clipboard access. Select the text and copy it by hand.', tone: 'bad' })}>Error</Button>
    </Well>
  );
}

function TabsDemo() {
  const [v, setV] = useState<'a' | 'b' | 'f'>('a');
  const n = { a: G.trackAUnits, b: G.trackBUnits, f: G.trackFUnits }[v];
  return (
    <Well>
      <div className="flex flex-col gap-2">
        <Tabs label="Track" value={v} onChange={setV} options={[{ value: 'a', label: 'Track A' }, { value: 'b', label: 'Track B' }, { value: 'f', label: 'Track F' }]} />
        <p className="pl-3 font-mono text-[11px] text-ink-3">median AP · n = {n} units per method</p>
      </div>
    </Well>
  );
}

export function Components() {
  return (
    <SysSection id="components" title="Components"
      lead="Every primitive in src/ui, live. Use them as they are. If a page needs a variant, add a prop here rather than restyling inline.">
      <div className="flex flex-col gap-10">
        <Spec id="button" name="Button" use="Ink fill for the one primary action in a view, hairline secondary for the rest, ghost inside toolbars. An href renders a link."
          states="default · hover · focus-visible ring · active (1px press) · disabled"
          usage={`<Button icon="download-simple">Download CSV</Button>
<Button variant="secondary" size="sm" href={href('/docs')} iconRight="arrow-right">Docs</Button>
<Button disabled>Unavailable</Button>`}>
          <Well>
            <Button icon="download-simple">Download CSV</Button>
            <Button variant="secondary" iconRight="arrow-right" href={href('/docs')}>Read the docs</Button>
            <Button variant="ghost" icon="funnel-simple">Filter</Button>
            <Button size="sm">Small</Button>
            <Button size="sm" variant="secondary" icon="github-logo">GitHub</Button>
            <Button disabled>Disabled</Button>
          </Well>
        </Spec>

        <Spec id="badge" name="Badge · TrackChip" use="Badges label a role or state in mono 11px. Tracks are letter chips A to F."
          usage={`<Badge tone="accent">Primary endpoint</Badge>  <Badge tone="warn">proxy</Badge>
<TrackChip letter="A" />`}>
          <Well>
            <Badge>neutral</Badge><Badge tone="accent">Primary endpoint</Badge><Badge tone="ok">included</Badge>
            <Badge tone="warn">proxy</Badge><Badge tone="bad">excluded</Badge><Badge tone="signal">rare cell</Badge>
            <span className="mx-2 h-5 w-px bg-line" aria-hidden="true" />
            {['A', 'B', 'C', 'D', 'E', 'F'].map((l) => <TrackChip key={l} letter={l} />)}
          </Well>
        </Spec>

        <Spec id="method" name="MethodDot · MethodName" use="The method’s identity colour on a mark, the name in ink. The ceiling (hvg_logreg) and the three references (CaSee, expr_threshold, random_baseline) are dashed in every view. Shown in site order."
          usage={`<MethodName id="FiRE" name="FiRE" />
<MethodName id="hvg_logreg" name="hvg_logreg" reference />   // also CaSee, expr_threshold, random_baseline
<MethodDot id="cellsius" size={10} />   methodColor('cellsius') → var(--m-cellsius)`}>
          <Well>
            {[...LEADERBOARD_DATA].sort((a, b) => methodSortKey(a) - methodSortKey(b)).map((m) => (
              <span key={m.id} className="rounded-chip border border-line bg-surface px-2 py-1"><MethodName id={m.id} name={m.method} reference={isReference(m.id)} /></span>
            ))}
          </Well>
        </Spec>

        <Spec id="cibar" name="CIBar" use="Bootstrap mean dot with its 95% interval on a shared 0 to 1 axis. Overlap is the point: it is why no row is crowned."
          states="method colour · dashed (reference) · no interval"
          usage={`<CIBar value={m.bootstrapMeanAP} low={m.bootAPLow} high={m.bootAPHigh}
  color={methodColor(m.id)} label={\`\${m.method} bootstrap mean AP \${fmt.ap(m.bootstrapMeanAP)}\`} />`}>
          <div className="overflow-hidden rounded-card border border-line bg-surface">
            <div className="flex h-9 items-center border-b border-line px-4">
              <span className="label">Ceiling (not ranked)</span>
            </div>
            <div className={cx(CI_ROW, 'border-b border-line')}>
              <MethodName id={CEILING.id} name={CEILING.method} reference />
              <CIBar className={CI_BAR} value={CEILING.bootstrapMeanAP} low={CEILING.bootAPLow} high={CEILING.bootAPHigh} color={methodColor(CEILING.id)} dashed label={`hvg_logreg bootstrap mean AP ${fmt.ap(CEILING.bootstrapMeanAP)}, supervised ceiling`} />
              <span className="text-right font-mono text-[13px] tabular text-ink-2">{fmt.ap(CEILING.medianAP)}</span>
            </div>
            {RANKED.map((m) => (
              <div key={m.id} className={cx(CI_ROW, 'border-b border-line last:border-b-0')}>
                <span className="flex min-w-0 items-center gap-2.5"><span className="w-3 font-mono text-[11px] text-ink-3">{m.publishedRankNum}</span><MethodName id={m.id} name={m.method} className="truncate" /></span>
                <CIBar className={CI_BAR} value={m.bootstrapMeanAP} low={m.bootAPLow} high={m.bootAPHigh} color={methodColor(m.id)} label={`${m.method} bootstrap mean AP ${fmt.ap(m.bootstrapMeanAP)}, interval ${fmt.ap(m.bootAPLow ?? 0)} to ${fmt.ap(m.bootAPHigh ?? 0)}`} />
                <span className="text-right font-mono text-[13px] tabular text-ink">{fmt.ap(m.medianAP)}</span>
              </div>
            ))}
            <div className="flex h-9 items-center px-4">
              <span className="label">Reference rows (not ranked)</span>
            </div>
            {REFERENCES.map((m) => (
              <div key={m.id} className={cx(CI_ROW, 'border-t border-line')}>
                <MethodName id={m.id} name={m.method} reference className="truncate" />
                <CIBar className={CI_BAR} value={m.bootstrapMeanAP} low={m.bootAPLow} high={m.bootAPHigh} color={methodColor(m.id)} dashed label={`${m.method} bootstrap mean AP ${fmt.ap(m.bootstrapMeanAP)}, reference`} />
                <span className="text-right font-mono text-[13px] tabular text-ink-2">{fmt.ap(m.medianAP)}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-ink-3">Rows ordered by median Track A AP (the rank key, right column). Marks show the bootstrap mean AP with its 95% interval (2,000 resamples, Figure 4a). The ranked block is contiguous: the ceiling is pinned above it and the references sit below it, dashed.</p>
        </Spec>

        <Spec id="stat" name="Stat · Card" use="Stat: label, numeral, then a denominator or source. Card: 8px hairline container. With href it is interactive."
          states="card: resting · hover border · focus border accent"
          usage={`<Stat label="Track A units" value={160} context="of 1,125 benchmark units" />
<Card href={href('/leaderboard')}>…</Card>`}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Track A units" value={G.trackAUnits} context={`of ${fmt.int(G.totalUnits)} benchmark units`} />
            <Stat label="FiRE median AP" value={fmt.ap(FIRE.medianAP)} context={`highest of the ${G.methodsRankedPublished} ranked detectors, Track A`} />
            <Card href={href('/leaderboard')} className="group flex flex-col justify-between gap-6">
              <Icon name="ranking" size={18} className="text-ink-3" />
              <span className="flex items-center justify-between text-sm font-medium text-ink">Open the leaderboard<Icon name="arrow-right" size={14} className="transition-transform duration-150 group-hover:translate-x-0.5" /></span>
            </Card>
          </div>
        </Spec>

        <Spec id="tabs" name="Tabs" use="Segmented control for switching one view. Arrow keys move. The line under it restates the metric and n."
          states="selected · hover · focus-visible · keyboard ← →"
          usage={`<Tabs label="Track" value={v} onChange={setV} options={[{ value: 'a', label: 'Track A' }, …]} />`}>
          <TabsDemo />
        </Spec>

        <Spec id="code" name="CodeBlock" use="Commands and files. Header strip names the file or language. Copy gives inline feedback."
          usage={`<CodeBlock title="terminal" code={\`rcb smoke-test\`} />`}>
          <CodeBlock title="terminal" code={`python -m pip install -e '.[dev]'\nrcb smoke-test\nrcb run-method --method FiRE`} />
        </Spec>

        <Spec id="loader" name="Loader" use="The mark animating: cells pulse in a wave, then the signal cell is found. For waits over about 300ms. Always carries a screen-reader label."
          states="animated · reduced motion (static mark) · with visible label"
          usage={`<Loader size={32} label="Loading leaderboard" />
<Loader size={24} label="Loading figures" showLabel />`}>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <Well dense label="sizes">
              {[16, 24, 32, 48].map((s) => (
                <span key={s} className="grid w-14 grid-rows-[56px_auto] justify-items-center gap-1">
                  <span className="grid place-items-center"><Loader size={s} label={`Loader ${s}px`} /></span>
                  <span className="font-mono text-[11px] text-ink-3 tabular">{s}px</span>
                </span>
              ))}
            </Well>
            <Well dense label="with label"><Loader size={24} label="Loading figures" showLabel /></Well>
          </div>
        </Spec>

        <Spec id="skeleton" name="Skeleton" use="Placeholders shaped like the content they stand in for: text lines, 40px table rows, stat cards. The route-level PageSkeleton is the Suspense fallback."
          usage={`<SkeletonText lines={3} />  <SkeletonTable rows={6} cols={4} />  <SkeletonCard />
<Skeleton className="h-8 w-40 rounded-full" />   // any shape`}>
          <SkeletonDemo />
          <Well dense label="text"><SkeletonText lines={3} className="w-full max-w-md" /><Skeleton className="h-8 w-28 rounded-full" /></Well>
        </Spec>

        <Spec id="states" name="EmptyState · ErrorState" use="Empty names why nothing shows and the next action. Error names the problem and the recovery. Retry can be async."
          states="empty · error · retrying (disabled, loader) · recovered"
          usage={`<EmptyState title="No method matches these filters" action={<Button …>Clear filters</Button>}>…</EmptyState>
<ErrorState title="The figure did not load" detail="404" onRetry={() => refetch()}>…</ErrorState>`}>
          <StatesDemo />
        </Spec>

        <Spec id="toast" name="Toast" use="Brief confirmation for copy and export. Polite live region. Errors stay longer and use role=alert. Hovering pauses the timer."
          usage={`const toast = useToast();
toast({ title: 'Citation copied', tone: 'ok' });
<CopyButton text={bib} toast="BibTeX copied" />`}>
          <ToastDemo />
        </Spec>

        <Spec id="tooltip" name="Tooltip" use="A phrase for icon-only controls and abbreviations. Opens on hover after 250ms and on focus; Esc closes. Information a reader needs stays in visible text."
          usage={`<Tooltip content="Switch to dark theme"><button aria-label="Switch to dark theme">…</button></Tooltip>`}>
          <Well>
            {([['download-simple', 'Download CSV'], ['link', 'Copy link to this view'], ['arrows-out-simple', 'Open full size']] as const).map(([i, t]) => (
              <Tooltip key={i} content={t}>
                <button type="button" aria-label={t} className="grid size-9 place-items-center rounded-chip border border-line bg-surface text-ink-2 transition-colors duration-150 hover:border-line-strong hover:text-ink">
                  <Icon name={i} size={18} />
                </button>
              </Tooltip>
            ))}
            <Tooltip content="Benjamini–Hochberg false discovery rate" side="bottom">
              <button type="button" className="cursor-help border-b border-dashed border-ink-3 font-mono text-[13px] text-ink">BH-FDR</button>
            </Tooltip>
          </Well>
        </Spec>

        <Spec id="header" wide name="PageHeader" use="Every interior page starts with it: a label only when it adds information the heading lacks, one h1, a lead of two lines at most, optional art. Art sits in its own 8px hairline card inside the container: right of the text from 768px, above it on phones. Pages with a moving hero use LiveHero instead (see Motion)."
          usage={`<PageHeader label="Leaderboard · Track A" title="Six ranked detectors"
  lead="…" art="images/leaderboard-hero" artSize={[1600, 900]} />`}>
          <div className={cx('overflow-hidden rounded-card border border-line bg-canvas')}>
            <PageHeader titleAs="h2" label="Leaderboard · Track A" title="Six ranked detectors, four references"
              lead="Median AP on 160 Track A units. Overlapping intervals mean the middle band is practically indistinguishable."
              art="images/leaderboard-hero" artSize={[1600, 900]} />
          </div>
          <p className="text-xs text-ink-3">Preview uses an h2 so this page keeps a single h1.</p>
        </Spec>
      </div>
    </SysSection>
  );
}
