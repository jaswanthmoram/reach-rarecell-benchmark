import { Fragment, type CSSProperties } from 'react';

/**
 * Home's one authored moment, in two lines: "Rarity," in the bold display sans (ink), "under scrutiny." in the italic
 * display serif with the cobalt-to-violet ramp. Every word rises out of its own mask at first paint (CSS only; the
 * last word starts at 110 ms, so nothing waits longer than ~0.6 s). `background-clip: text` ignores transformed
 * children, so each serif word paints its own slice of one shared ramp: `--p0`/`--p1` are the word's start and end
 * along the line (by character count), which keeps the colour continuous from word to word. Hover (fine pointers)
 * slides the ramp on line 2 only. Reduced motion: the global rule makes the rise instant.
 */
const LINE_2 = ['under', 'scrutiny.'];
const STAGGER_MS = 55;

/** Start and end of each word along the line, 0..1, weighted by characters (the space counts with the word before). */
function spans(words: readonly string[]) {
  const total = words.reduce((n, w) => n + w.length + 1, -1);
  let at = 0;
  return words.map((w, i) => {
    const p0 = at / total;
    at += w.length + (i < words.length - 1 ? 1 : 0);
    return { w, p0, p1: at / total };
  });
}
const RAMP = spans(LINE_2);

type Vars = CSSProperties & Record<`--${string}`, string | number>;

export function Headline({ className }: { className?: string }) {
  return (
    <h1 id="h1" className={className}>
      <span className="hm-line-1 block font-display text-ink">
        <span className="hm-mask"><span className="hm-word">Rarity,</span></span>
      </span>{' '}
      <span className="hm-line-2 hm-grad block">
        {RAMP.map(({ w, p0, p1 }, i) => (
          <Fragment key={w}>
            <span className="hm-mask hm-mask-italic">
              <span className="hm-word hm-grad-word" style={{ '--d': `${(i + 1) * STAGGER_MS}ms`, '--p0': p0.toFixed(4), '--p1': p1.toFixed(4) } as Vars}>{w}</span>
            </span>
            {i < RAMP.length - 1 ? ' ' : null}
          </Fragment>
        ))}
      </span>
    </h1>
  );
}
