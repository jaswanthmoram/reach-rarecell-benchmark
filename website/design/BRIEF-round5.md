# Round 5 page brief (one sub-session per page)

You own ONE page of the REACH Benchmark website (`/Users/moramvenkatasatyajaswanth/reach-rarecell-benchmark/website`,
React 19 + Tailwind v4 + Vite, hash router). Nine other sessions own the other pages in this same checkout right now.
You may use subagents. Read first: `design/PLAN-round5.md`, `design/DESIGN.md` (all rule sections incl. v2.1/v2.2),
`design/BRIEF-round4.md` (still in force), `design/PAPER-AUDIT.md` (a) and (c) for your page.

## Ownership (hard)
- Edit ONLY `src/pages/<YourPage>.tsx` and `src/pages/<yourpage>/*`. Never edit `src/ui`, `src/app`, tokens, data,
  public assets of other pages, or other pages. Need a shared change? Build it page-locally and say so in your report.
- New assets for your page go in `public/images/<page>-*` or `public/video/<page>-*` only.
- The full shared navbar comes from the app shell on every page; do not hide or duplicate it.

## 1. Critic loop on live version 3 (first)
Start the dev server: `preview_start` with name `website` (from `/Users/moramvenkatasatyajaswanth/reach-rarecell-benchmark/.claude/launch.json`, port 5199)
if it is not already running. Render your route at 1440 and 390, light and dark, with
`node /private/tmp/claude-501/-Users-moramvenkatasatyajaswanth-reach-rarecell-benchmark/6d9e67ba-83e7-497f-a11a-655966e71392/scratchpad/cdpshot.mjs "http://localhost:5199/#/<route>" <w> <light|dark> <out.png>`
(run it outside the sandbox, one render at a time) into `scratchpad/r5/<page>/`. Then run three critics as subagents on
those renders: `design-master:brief-critic` (goal: the round-5 user requests below + DESIGN.md rules),
`design-master:craft-critic` (bar: `design/research/refero.md`, `mobbin.md`, Linear/Stripe/Observable quality), and a
`design-master:slop-monster` pass. Fix what they find.

## 2. Live hero (the user's main ask)
"In the hero, add an animated, moving background, something new and modern; moving dots; multiple live hero
backgrounds instead of a single image; full animation and the best UI/UX motion."
- Use the shared engine: `import { LiveHero, LiveField, LAYOUTS, type LiveLayout } from '../ui'`.
  `LiveHero` layers: your art (`images/<page>-hero`, light/dark pair) → `LiveField` (canvas dot-field, theme-aware,
  pauses off-screen, still frame under reduced motion) → optional muted `video` loop → your content.
  Built-in fields: `embedding`, `lanes`, `forest`, `specimens`, `flow`, `rings`, `grid`, `paths`. You may write your
  own `LiveLayout` page-locally (points in 0..1 space with optional `signal`, `group`, `vx`) for something new.
- "Multiple live backgrounds": compose 2–3 layers with intent (e.g. a slow far field + a nearer field with signal cells
  being found + the art), or let the hero switch between 2–3 live scenes tied to real page content (tabs, tracks,
  methods), crossfading with opacity only. Keep the text column calm and readable (contrast ≥ 4.5:1).
- Optional video: you may generate ONE short seamless loop (≤ 6 s, ≤ 2 MB, no text in frame) with ElevenLabs creative
  video (`creative_generate_video`) or Higgsfield (`generate_video`), from your page's art as the start frame. Save as
  `public/video/<page>-hero.webm` + `.mp4`. Only if it clearly beats the canvas animation; check credits first.
- Motion rules: transform/opacity/canvas only, 60fps, ≤ 300ms for interactions, `prefers-reduced-motion` → static.
  Interactive hero moments are welcome (hover a ranked method to highlight its cells, pointer-reactive field with
  gentle easing). No scroll-jacking, no autoplay sound.

## 3. Page redesign
Make the page more modern and refined section by section (`ui-design-os:section-designer` thinking: one dominant
element per section, varied rhythm, real data). Keep every round-4 rule: ranking order (ceiling, ranked 1–6,
references), dashed reference marks, no all-10 ranks except "Within-unit rank, all 10 methods (Figure 4b)", no "tie",
no em dashes, AP 3 decimals, runtimes in seconds, labels ≥ 11px and AA contrast.

## 4. Design-canvas preview (like the VasthraShree Seller Hub canvas)
Canvas: https://claude.ai/artifact/A2mnYNgeUNrEtPan49MfhB ("REACH Benchmark · Web", type Design). Your canvas page id is
given in your task. Add two artboards on YOUR page only:
- `P<NN>-<Page>-1-HiFi.dc.html`: the high-fi page preview, fluid PAGE (`expand: "fill"`, `is_interactive: true`,
  w 1440), with the FULL navbar (logo + Overview, Leaderboard, Tracks, Datasets, Methods, More, Search ⌘K, theme,
  GitHub), the animated hero (CSS keyframes and/or a small `componentDidMount` canvas loop in the DCLogic class;
  reduced-motion safe) and the real sections.
- `P<NN>-<Page>-2-States.dc.html`: loading, empty, error, edge cases and a 390px mobile view, side by side.
Read the canvas type's instructions with `{action:"read", url}` before writing (format.md rules: support.js line,
`x-dc`, DCLogic class, no innerHTML, holes are lookups only). Upload any image you use as an asset (`asset: true`) and
use the returned `/_blob/` url. Index edits: `read` `project/canvas.json` right before publishing, add ONLY your two
board entries (`page` = your page id; place at x 0 and x 1520, y 0) and your `order` slots and one `title1` note for
your row; keep everything else exactly; if the publish is refused because another session saved, re-read and retry.
Work in your own folder `scratchpad/canvas-<page>/project/…`.

## 5. Done
`npx tsc --noEmit -p tsconfig.app.json` and `npx oxlint src/pages` clean for your files; renders checked in both themes
at 1440 and 390; canvas artboards published. Report ≤ 15 lines: hero design, critic findings fixed, canvas boards,
anything left.
