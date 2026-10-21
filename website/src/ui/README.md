# Shared UI (`src/ui`)

Use these instead of hand-rolled page chrome so every page has one rhythm (audit r8, S-1, S-8, S-10).

| Import | One-line usage |
|---|---|
| `PageHeader` (`./PageHeader`) | `<PageHeader eyebrow="Track A · primary endpoint" title="Six ranked detectors" lede={<>...</>} actions={<Buttons />} art={<HeroArt />} />`: the interior-page hero. H1 `clamp(36px, 4.2vw, 56px)`, tracking -0.03em, painted as is at first paint (never hidden; r10), and `view-transition-name: page-title` so it morphs between pages. One per page; Home keeps its own hero. |
| `SectionHeader` (`./SectionHeader`) | `<SectionHeader id="tests-h" title="Global tests" lede="..." actions={<a>...</a>} />`: H2 `clamp(26px, 2.6vw, 36px)`. Eyebrow only for a source (Table 2, Figure 3, Track A), never a counter. `split={false}` to skip the reveal; `as="h3"` for sub-sections. |
| `SectionNav` (`./SectionNav`) | `<SectionNav label="Leaderboard sections" items={[{ id: 'board', label: 'Board' }, ...]} />`: the one sticky in-page section bar (44px, under the header) with scroll-spy and a sliding pill; scrolls sideways on phones. Each `id` must be on a section element. Not for tabs that swap a view. A mouse click blurs the pill (no ring on the next key press); keyboard activation keeps focus and the ring. |
| `Icon3D` (`./Icon3D`) | `<Icon3D name="microscope" size={64} />`: Fluent Emoji 3D (MIT). Names: microscope, dna, test-tube, bar-chart, bullseye, straight-ruler, card-file-box, open-book, laptop, memo, busts-in-silhouette. Hero, empty-state and use-case cards only (48-96px); never nav, tables or buttons. Decorative unless you pass `alt`. Floats on hover (also inside a `.group`). |
| icons (`./icons`) | `import { Check, ArrowUpRight, ICON_STROKE } from '../../ui/icons'; <Check size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />`: the one UI icon set (lucide-react). Replace glyph icons (✓ ▾ ↗ →) with these. Add new names to `icons.ts`. Brand mark: `<GithubMark size={16} />` (filled, `aria-hidden`; label the link, not the glyph). |
| `useSlidingPill` (`./useSlidingPill`) | Shared by the navbar and SectionNav: one pill sized to the active `[data-pill-key]` that slides with transform only (FLIP); boxes are measured in a ResizeObserver callback, so no layout is forced. Optional `onPlace(box, container, fits, clientWidth)`. Use it for any segmented control that needs a moving active state. |
| `useScrollSpy` (`./useScrollSpy`) | `const { active, jumpTo } = useScrollSpy(ids, { top: (wide) => (wide ? 96 : 160), bottomPct: 65, pick: 'last' })`: IntersectionObserver spy over element ids; rebuilt when the layout crosses 1024px; `jumpTo(id)` sets the target and locks the spy for 900ms while the smooth scroll passes; `scrollLockCapMs: 3000` keeps the lock while scroll events continue (150ms idle), up to 3s (Reproduce, two spies: sections and steps). SectionNav uses it (top 120, 55%, `'first'`). |
| `useMedia` (`./useMedia`) | `const wide = useMedia('(min-width: 1024px)')`: live `matchMedia` via `useSyncExternalStore`; false on the server. Use it instead of page-local `matchMedia` hooks. |
| `useCopy` (`./useCopy`) | `const { copy, stateOf, status } = useCopy(); onClick={() => copy(text, 'bibtex')}`; `stateOf('bibtex')` is `'idle' \| 'copied' \| 'failed'`, back to idle after 1.5s (`resetMs`; `failedMs` for failures), `stickyFailures` (true, or a list of keys) keeps a failure until `reset()`. Clipboard API with a textarea fallback that hands focus back; put `status` in an `aria-live="polite"` region. |
| motion kit (`./motion`) | See `motion/README.md`: `Reveal`, `SplitHeading`, `CountUp`, `DrawPath`, `Scrolly`, `useMotionPaused`, ... |

Shell accessibility (`src/shell`): a "Skip to content" link is the first tab stop (focuses the page's h1). After a
route change from a link, focus moves to the new page's `h1` (it gets `tabindex="-1"`); Back/Forward announces the
page title in a polite live region instead. Every page needs exactly one `h1` inside `<main>`.

Router helpers that pages also need (`src/lib/router.ts`): `href(path, query?, fragment?)` (clean URLs under the
Vite base, e.g. `/reach-rarecell-benchmark/tracks/?track=f`; internal `<a>` clicks are intercepted and rendered without
a reload), `absoluteHref` (for "Copy link"), `scrollToId` (offsets for the header and SectionNav come from
`scroll-margin-top` on `[id]`), `setFragment(id)` (records an in-page section in the URL, no history entry; `/page/#id`
lands on it on load), `useFragmentHandler(route, fn)` (a page that must prepare its target first), `preloadRoute(path)`
(call on hover/focus of in-page links to another route), `useQuery`, `setQuery` (replaces the query and keeps the
history entry). New routes open at the top; Back/Forward return to the remembered scroll position of that entry.
Old `/#/path?query` links and Reproduce's `?section=<id>` are rewritten to the clean URL on load.

Tokens added this round (`src/styles/app.css`): `--nav-active`, `--header-glass`, `--row-hover`, `--chip-active`,
`--dur-1..4`, `--header-h`. Use them instead of `bg-[#ececef]`, `bg-[#f6f7f8]`, `bg-[#eceef1]`.
The site is light only this round (`color-scheme: light`); there is no dark theme to support.

## Effects (`src/ui/effects`, round 9)

Direction and per-page plans: `design/DESIGN-r9.md`. Only transform, opacity and clip-path animate; every effect is
static under reduced motion and "Pause motion". No glow, no glass blobs, no cursor spotlight, no tilt cards.

| API | One-line usage |
|---|---|
| `ShaderBackdrop` (`./effects/ShaderBackdrop`) | `<section className="relative isolate"><ShaderBackdrop intensity={0.25} palette="lab" fade="top" className="absolute inset-0 -z-10" />...</section>`: drifting dot-grain WebGL field in the token colours. Props: `intensity` (0..1, default 0.3; <= 0.25 behind ink-3 small text, <= 0.35 behind ink-2), `palette` (`'graphite'`, `'cobalt'`, `'lab'` = cobalt + a trace of vermilion), `fade` (`'none' \| 'top' \| 'bottom' \| 'both'`), `dot` (px pitch, 14). The WebGL code is a lazy chunk (`ShaderCanvas-*.js`, ~2 kB gz) fetched the first time the band is on screen with motion allowed; DPR capped at 2, ~30fps, stops off-screen and in hidden tabs; a static CSS field (`.fx-shader-fallback`) shows under reduced/paused motion, without WebGL and before the chunk lands. Max one per page view (the footer already has one). |
| `.fx-card` | `<a className="fx-card block p-5">`: card surface (border, 8px radius, white) with the elevation steps: rest `--elev-1`, hover/focus-within lifted 2px with `--elev-2` (shadow fades in on `::after`), press back to rest at 0.995. Uses `::after`. |
| `.hover-lift` | `<li className="hover-lift rounded-card">`: the same lift and shadow on an element that already has its own surface. Uses `::after`. |
| `.fx-sheen` | `<a className="fx-card fx-sheen">`: one-time cobalt-tinted light sweep on hover (900ms), clipped to the card without `overflow: hidden`. Primary cards only (one or two per page). Uses `::before`. |
| `.fx-hairline-gradient` | `<div className="card fx-hairline-gradient">`: 1px border that warms to cobalt in the middle (mask, not border-image). Feature panels, not table rows. Uses `::before`. |
| `.fx-grain` | `<section className="bg-sunk fx-grain">`: faint static SVG noise on the element's own background. Behind art and bands, never behind table text. |
| `.fx-underline` | `<a className="fx-underline">`: faint rest underline, cobalt line grows from the left on hover/focus and leaves to the right. `fx-underline--bare` drops the rest line (nav, footer lists). Uses both pseudo-elements. |
| tokens | `--elev-0..3`, `--lift`, `--fx-hairline`, `--fx-hairline-x` (edge-faded, used by the header), `--fx-sheen`, `--fx-grain-img`. |

Pseudo-element budget: `.fx-card`/`.hover-lift` own `::after`, `.fx-sheen`/`.fx-hairline-gradient` own `::before`,
so `fx-card fx-sheen` and `fx-card fx-hairline-gradient` combine, but `fx-sheen` and `fx-hairline-gradient` do not.
Shell adoption: the header's scrolled hairline is `--fx-hairline-x` (`.fx-header-hairline`); the footer carries a
`ShaderBackdrop` at intensity 0.22 (worst-case ink-3 contrast 4.65:1).
