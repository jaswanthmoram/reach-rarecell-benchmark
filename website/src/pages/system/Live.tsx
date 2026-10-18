import { useState } from 'react';
import { LiveField, LiveHero, Tabs, type LiveFieldKind } from '../../ui';
import { Sub, Usage } from './kit';

/** What each built-in layout draws, in the order the engine lists them. */
const KINDS: { kind: LiveFieldKind; reads: string }[] = [
  { kind: 'embedding', reads: 'Ten cohort clusters in an embedding. Nine rare cells sit inside three of them.' },
  { kind: 'lanes', reads: 'Six lanes of cells streaming left to right at their own speeds, one rare cell per lane in five.' },
  { kind: 'forest', reads: 'Six interval clouds under a dashed ceiling line, the found cell on the ceiling.' },
  { kind: 'specimens', reads: 'Ten specimen wells, each with its own density and one rare cell.' },
  { kind: 'flow', reads: 'Cells moving through a pipeline. The stream narrows as cells are filtered out.' },
  { kind: 'rings', reads: 'One found cell, cited by six rings of orbiting cells.' },
  { kind: 'grid', reads: 'A specimen board of rising densities with one rare cell. This page’s hero extends it.' },
  { kind: 'paths', reads: 'Three journeys diverging through a field, each ending on a found cell.' },
];

export function LiveFields() {
  const [frame, setFrame] = useState<'live' | 'still'>('live');
  return (
    <Sub id="live-fields" title={`Live fields · ${KINDS.length} layouts`} note="One canvas each. DPR capped at 2. Paused off-screen and in hidden tabs">
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Tabs label="Frame" value={frame} onChange={setFrame} options={[{ value: 'live', label: 'Live' }, { value: 'still', label: 'Reduced motion' }]} />
        <p className="text-xs text-ink-2">
          {frame === 'live'
            ? 'Cells drift, rare cells pulse, and a cobalt ring finds one every 1.6 s.'
            : 'With reduced motion on, the engine draws this single frame: every rare cell already found.'}
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {KINDS.map(({ kind, reads }) => (
          <li key={kind} className="overflow-hidden rounded-card border border-line bg-surface">
            <div className="h-40 border-b border-line bg-canvas">
              <LiveField kind={kind} still={frame === 'still'} />
            </div>
            <p className="px-4 pb-3.5 pt-3">
              <code className="font-mono text-[13px] text-ink">{kind}</code>
              <span className="mt-1 block text-xs leading-snug text-ink-2">{reads}</span>
            </p>
          </li>
        ))}
      </ul>
      <div className="mt-3">
        <Usage>{`<LiveField kind="specimens" />                       // decorative: aria-hidden
<LiveField layout={myLayout} seed={9} intensity={0.8} />   // page-local layout, points in 0..1
type LivePoint = { x, y, r?, signal?, group?, vx? }     // signal = rare cell, vx = drift per second`}</Usage>
      </div>
    </Sub>
  );
}

const LAYERS: { name: string; prop: string; rule: string }[] = [
  { name: 'Art', prop: 'art', rule: 'Light and dark pair at 40% opacity. The poster frame while the canvas starts.' },
  { name: 'Live field', prop: 'field · layout', rule: 'One canvas. Pauses off-screen and in hidden tabs. Reduced motion draws one still frame.' },
  { name: 'Video', prop: 'video', rule: 'Optional muted loop, 6 s and 2 MB at most, no text in frame. Hidden under reduced motion.' },
  { name: 'Scrim', prop: 'built in', rule: 'Canvas gradient from the left, so the text column reads at 4.5:1 or better.' },
  { name: 'Content', prop: 'children', rule: 'Text in its own column. The stage is aria-hidden unless a label is passed.' },
];

export function LiveHeroSpec() {
  return (
    <Sub title="LiveHero · layers, back to front" note="Transform, opacity and canvas only. No scroll-jacking, no sound">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <ol className="divide-y divide-line rounded-card border border-line bg-surface">
          {LAYERS.map((l, i) => (
            <li key={l.name} className="grid grid-cols-[28px_minmax(0,1fr)] gap-x-2 px-4 py-3">
              <span className="font-mono text-[11px] leading-5 text-ink-3 tabular">{i + 1}</span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="text-sm font-medium text-ink">{l.name}</span>
                  <code className="font-mono text-[11px] text-ink-3">{l.prop}</code>
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-ink-2">{l.rule}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="overflow-hidden rounded-card border border-line bg-canvas">
          <LiveHero art="images/system-hero" field="embedding" className="h-full min-h-[260px] border-b-0!">
            <div className="flex h-full min-h-[260px] max-w-[60%] flex-col justify-end p-5">
              <p className="label mb-2">Specimen</p>
              <p className="balance text-xl font-semibold leading-tight tracking-[-0.02em] text-ink">Content sits on the calm side of the scrim</p>
            </div>
          </LiveHero>
        </div>
      </div>
      <div className="mt-3">
        <Usage>{`<LiveHero art="images/tracks-hero" field="lanes" video={{ webm: 'video/tracks-hero.webm' }}>
  <Container>…title, lead, actions…</Container>
</LiveHero>`}</Usage>
      </div>
    </Sub>
  );
}
