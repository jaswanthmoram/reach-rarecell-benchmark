import { cx } from '../../lib/format';
import { scrollToId } from '../../lib/router';
import { PageHeader } from '../../ui/PageHeader';
import { Check, ICON_STROKE, Plus } from '../../ui/icons';
import { PARTS, type PartId } from './data';
import { DotField, Orbit } from './Orbit';
import { useInView } from '../../ui/motion/useInView';
import { link } from './ui';

interface HeroProps {
  isOn: (id: PartId) => boolean;
  onToggle: (id: PartId) => void;
  lit: readonly boolean[];
  anyArchive: boolean;
  doiCount: number;
}

const chip = 'cite-chip inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-chip border px-3 text-sm';

/** The reuse picker: one toggle per citable part. It writes `?reuse=` (Cite.tsx), so a set can be shared as a link. */
function ReusePicker({ isOn, onToggle, doiCount }: Pick<HeroProps, 'isOn' | 'onToggle' | 'doiCount'>) {
  return (
    <fieldset className="rise m-0 mt-1 border-0 p-0 [animation-delay:220ms]">
      <legend className="mb-2.5 p-0 text-sm font-medium">What did you reuse?</legend>
      <div className="flex flex-wrap gap-2">
        {PARTS.map((p) => {
          const on = isOn(p.id);
          const always = p.id === 'paper';
          const Icon = on ? Check : Plus;
          return (
            <button key={p.id} type="button" aria-pressed={on} aria-disabled={always || undefined}
              title={always ? 'The article is always cited' : undefined}
              onClick={() => onToggle(p.id)}
              className={cx(chip, on
                ? 'border-accent/40 bg-accent-tint text-accent-ink hover:border-accent/70'
                : 'border-line-strong bg-surface/85 text-ink-2 hover:border-ink-3 hover:text-ink',
                always && 'cursor-default')}>
              <Icon size={14} strokeWidth={on ? 2.2 : ICON_STROKE} aria-hidden="true" />
              {p.short}
              {always && <span className="text-xs opacity-80">always</span>}
            </button>
          );
        })}
      </div>
      <p className="m-0 mt-3 text-sm text-ink-2" aria-live="polite">
        <span className="tabular text-ink">{doiCount} {doiCount === 1 ? 'DOI' : 'DOIs'}</span> to cite.{' '}
        <button type="button" onClick={() => scrollToId('archives')} className={cx(link, 'cursor-pointer border-0 bg-transparent p-0 text-sm')}>See them</button>
      </p>
    </fieldset>
  );
}

export function Hero({ isOn, onToggle, lit, anyArchive, doiCount }: HeroProps) {
  const [ref, onScreen] = useInView<HTMLDivElement>({ once: false, rootMargin: '80px' });
  return (
    <div ref={ref} className="relative overflow-hidden border-b border-line">
      <DotField paused={!onScreen} />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,var(--canvas)_0%,color-mix(in_srgb,var(--canvas)_88%,transparent)_40%,transparent_72%)]" />
      <PageHeader
        className="relative"
        title="Cite REACH"
        lede="Cite the article for any result on this site. If you reused code or data, add the matching Zenodo archive after it."
        art={<div className="mx-auto h-[220px] max-w-[560px] sm:h-[320px]"><Orbit lit={lit} anyArchive={anyArchive} /></div>}
      >
        <ReusePicker isOn={isOn} onToggle={onToggle} doiCount={doiCount} />
      </PageHeader>
    </div>
  );
}
