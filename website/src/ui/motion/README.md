# Motion kit (`src/ui/motion`)

GSAP 3.15 (ScrollTrigger; SplitText and DrawSVG on demand; standard no-charge licence, not OSI, do not vendor it).
Scrolling is native (Lenis was removed in r10: it ran scrolling on the main thread and forced a layout per frame).
Import from `'../ui/motion'` (from a page: `'../../ui/motion'`). Every piece is reduced-motion safe (`gsap.matchMedia`)
and respects the footer "Pause motion" switch. Only transform, opacity and clip-path move. Use `useGSAP` (not
`useEffect`) for any GSAP you write yourself: it reverts on unmount, so ScrollTriggers die with the page.

| API | One-line usage |
|---|---|
| `Reveal` | `<Reveal as="ul" className="grid gap-4">{cards}</Reveal>`: children below the fold enter once when their top reaches 88% of the viewport (one shared IntersectionObserver), 40ms apart (max 4 steps, stagger capped at 0.05s, duration capped at 0.45s); in a section with a `SectionHeader` they start at most 0.1s after it. On screen at mount or scrolled past: shown as is. `variant`: `'rise'` (default: 12px + fade, 0.34s), `'mask'` (clip-path wipe, 0.42s), `'fade'` (0.3s), `'scale'` (0.38s). Props: `as, selector, variant, y, stagger, duration, start` (`'top N%'`). |
| `useReveal` | `const ref = useReveal<HTMLDivElement>({ selector: '.card', variant: 'mask' }); <div ref={ref}>`: same, on an element you own. One per section block, not per element. |
| `SplitHeading` | `<SplitHeading as="h2" className="section-title">Plain text</SplitHeading>`: default `variant="block"`, the whole heading fades up 12px (0.38s, power3.out), no SplitText. Never hidden at first paint: on screen at mount, `immediate`, or scrolled past it is shown as is; below the fold it reveals on enter. `'lines' \| 'words' \| 'chars'` only where the split carries meaning: they lazy-load SplitText (durations <= 0.45s, stagger <= 0.05s). Props: `as, immediate, delay, variant, duration, stagger, control`. |
| `CountUp` | `<CountUp value={G.totalUnits} />`: counts once on view, en-GB grouping, width locked, final value in the DOM. Props: `value, decimals, duration, from, prefix, suffix, format, className`. **Counts only** (cohorts, cells, units): never tick AP, CI, p, delta, rho (audit S-18); show those static with `fmt.ap`. |
| `DrawPath` | `<DrawPath d={d} stroke="var(--m-fire)" fill="none" />`: one SVG path draws on first view. Props: SVG path props + `duration, delay, start`. |
| `useDrawIn` | `useDrawIn(ref, { selector: '[data-ci-dot]', from: { opacity: 0 }, then: [{ selector: '[data-ci]', from: { opacity: 0, scaleX: 0.4, svgOrigin: (_i, el) => el.dataset.o }, at: 0.06 }], once: drawnRef })`: chart marks (dots, intervals, CD bars) arrive once; follows the SectionHeader cue and a safety net forces the final state. Options: `selector, from, to, at, duration (0.5), stagger (0.03), then, delay, start, once, deps`. Replaces `useDotsIn`, `useIntervalDrawIn`, `useStripDrawIn`. |
| `useDrawSvg` | `const ref = useDrawSvg<SVGSVGElement>({ selector: '.ci, .axis' }); <svg ref={ref}>`: draws every stroke inside; dashed strokes (hvg_logreg, references) fade in and keep their dashes. |
| `Scrolly` | `<Scrolly graphic={(i) => <Chart step={i} />} steps={[<p>..</p>, ...]} mobileGraphic={(i) => <Chart step={i} />} />`: sticky graphic at >= 1024px, steps scroll past, no scroll-jacking. Props: `graphic, steps, mobileGraphic, side, onStepChange, className`. |
| `useScrollySteps` | `const { active, stepRef } = useScrollySteps(n); <li ref={stepRef(i)}>`: active step = the one crossing mid-screen (build your own layout). |
| `useScrollProgress` | `const ref = useScrollProgress<HTMLDivElement>((p) => { path.style.clipPath = ... }, { start: 'top 80%', end: 'bottom 40%' })`: scroll-linked 0..1 to a callback (no re-render); reduced motion reports 1. |
| `SmoothScroll` | Kept as a no-op passthrough for old imports; the site scrolls natively. `scrollToId` (lib/router) smooth-scrolls programmatic jumps (instant under reduced motion); `scroll-margin-top` on `[id]` clears the header and SectionNav. |
| `useLoopGate` | `const { ref, running, loopProps } = useLoopGate<SVGSVGElement>(); <svg ref={ref} {...loopProps}>`: the one gate for rAF, canvas, video and CSS loops. One shared IntersectionObserver per rootMargin for all gates; starts held until the first observation. `running` is on screen (80px margin) and tab visible and no reduced motion and not paused; `data-loop="hold"` pauses CSS animations inside (app.css). GSAP-free. |
| `LoopHost` | `<LoopHost className="relative"><svg>...</svg></LoopHost>`: a gated container for pure CSS loops (same gate, no ref plumbing). |
| `useInView` | `const [ref, inView] = useInView<HTMLDivElement>({ once: false, rootMargin: '80px' })`: `once` (default true) flips once for entrances; `once: false` follows in and out. Options: `once, threshold, rootMargin, initial, ref`. GSAP-free; `lib/motion` re-exports the old `useInView(threshold)`. |
| `useGlide` | `const ref = useGlide<HTMLUListElement>(sortKey); <li data-glide={row.id}>`: FLIP glide (360ms, transform only) when `sortKey` changes; nested `[data-glide]` groups add only their own move; instant under reduced or paused motion. GSAP-free. |
| `reducedMotion`, `motionAllowed` | `if (motionAllowed()) ...`: the one definition of "may this move now" (`canAnimate` is the same function). `reducedMotion()` is the OS setting only. In `paused.ts`, GSAP-free. |
| `useMotionPaused` | `const paused = useMotionPaused()`: stop canvas/rAF loops (draw one static frame) while the visitor has paused motion. Also `isMotionPaused()`, `setMotionPaused(bool)`. |
| `entranceState`, `whenCued`, `onEnter` | Choreography building blocks: `entranceState(el)` is `'above' \| 'inview' \| 'below'` at mount; `whenCued(el, (delay) => ...)` runs after the element's section header has started (<= 0.1s later, 0.2s safety); `onEnter(el, cb, 'top 88%')` runs once when the element reaches the line or was jumped past (shared IntersectionObserver). |
| `canAnimate`, `gsap`, `ScrollTrigger`, `useGSAP`, `MOTION_OK`, `MOTION_REDUCE`, `DUR`, `EASE`, `EASE_OUT` | Building blocks for a page's own signature moment. Wrap it in `gsap.matchMedia().add(MOTION_OK, ...)` and bail when `!canAnimate()`. |

## Choreography (automatic, through `PageHeader`, `SectionHeader` and `Reveal`)

r10 rule: **nothing on screen at first paint is ever hidden.** Content on screen at mount (every page hero, every
normal load), or already scrolled past, is shown as is; the route View Transition carries page changes. Only content
below the fold is hidden from JS at mount, and it is fully visible within ~0.5s of arriving:

1. trigger: the header's top reaches 88% of the viewport (one shared IntersectionObserver; content jumped past counts);
2. at 0: the section's top rule draws across (420ms CSS), the eyebrow fades (0.3s);
3. title at +40ms, lede at +80ms, actions at +100ms: each fades up 10px in 0.38s;
4. the section's `Reveal` groups start 0.1s after the header (per-section cue; 0.2s safety if the header never plays).

`PageHeader` below the fold (rare) does the same; its art fades in. On desktop with a fine pointer the art drifts up
6% as the header scrolls away, as a CSS scroll-driven animation (`animation-timeline: view()`), off under reduced or
paused motion and where scroll timelines are missing.

Pause motion holds GSAP loops (anything with `repeat: -1`, re-checked every 150ms by a timer, not a ticker listener)
and finishes running finite tweens once. Nothing in the kit keeps the GSAP ticker awake: it sleeps when no tween runs.
`rafGuard.ts` drops ScrollTrigger's forever-rAF (a Firefox repaint workaround) outside Firefox.

Rules the kit keeps: only transform, opacity and clip-path move; ease is `power3.out`; kit entrances <= 0.45s,
stagger <= 0.05s. Reduced motion or "Pause motion": everything is static and visible. A timer-based safety net forces
the final state if the ticker stalls. The rule needs a section with a visible top border and no overflow clip;
otherwise the border simply stays.

## Loop policy (r10)

- Every infinite CSS animation must sit inside a gated element: `useLoopGate`'s `loopProps` or `<LoopHost>`. Off
  screen, in a hidden tab (`html[data-hidden]`), under reduced or Pause motion, `data-loop="hold"` holds it.
- Budget: <= 20 animated elements per scene. Animate a parent `<g>` or wrapper, never 100+ leaves.
- Canvas/rAF loops: draw only while `running`, cap at 30fps (see `ShaderCanvas`), draw one still frame otherwise.
- One-shots (header mark, loader reticle) are finite; they are not loops and need no gate.

What pages can adopt later (none of this is automatic):
- `variant="mask"` on `Reveal` around figure grids and image cards (Figures, Tracks figures, Datasets Figure 1).
- Put the `Reveal` after the `SectionHeader` inside the same `<section>` so it follows the header's cue.
- `SplitHeading variant="words"` only below the fold, for a short display line; `"chars"` only for 1-3 words.
- **Sticky stack (documented only):** for 3-5 stacked panels that should hand off to each other, give each panel
  `position: sticky; top: calc(var(--header-h) + 16px)` in one column, and scale the panel underneath to 0.96 as the
  next one covers it, from the covering panel's `useScrollProgress((p) => { prev.style.transform = 'scale(' + (1 - 0.04 * p) + ')'; }, { start: 'top bottom', end: 'top top+=80' })`.
  Desktop only (`min-width: 1024px`), off under reduced motion, no pinning (`pin`) and no scroll-jacking. Do not use it
  on tables or anything people read across.

CSS side (in `src/styles/app.css`, no import needed):
- Durations `--dur-1` 150ms (hover/press), `--dur-2` 220ms (disclosure), `--dur-3` 420ms (entrance), `--dur-4` 600ms (hero beat); easing `--ease-out`.
- `.rise`, `.fade-in`, `.pop-in`: mount entrances on those tokens. Delete page-local copies (`lb-rise`, `m-rise`, `uc-rise`, `ds-rise`, `cite-rise`, `m-enter`, `lb-in`).
- `.loop`: add to anything that animates forever, so "Pause motion" holds it (`[data-motion=paused] .loop`), and put it inside a gate (Loop policy). Infinite CSS animations are also caught by a sweep, but the class is the contract.
- `.page-title`, `.section-title`: the type scale (`PageHeader`/`SectionHeader` use them).
- `motion.css` (imported by `choreo.ts`): the `[data-rule]` top-rule draw; set from JS only.

Rules (audit r8): motion explains data arriving or a state changing. No motion on leaderboard rows, sort, filters,
Board tabs, copy buttons or on AP/CI/p text. No magnetic buttons, cursor spotlights, marquees or gradient borders.
