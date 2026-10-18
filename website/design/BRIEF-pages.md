# Page builder brief (shared by every page builder)

Project: `/Users/moramvenkatasatyajaswanth/reach-rarecell-benchmark/website` — React 19 + Tailwind v4 + Vite, static, GitHub Pages.

## Read first
1. `design/DESIGN.md` — the system. Follow it exactly (tokens, radius, type, page rules).
2. `design/research/mobbin.md` (decisions list at the top) and `design/research/refero.md`.
3. `src/ui/index.tsx` — primitives: `Container, Section, PageHeader, Button, CopyButton, Badge, TrackChip, Stat, Card, CodeBlock, Tabs, CIBar, Icon, asset, fmt`. Use them; don't restyle them inline.
4. `src/styles/tokens.css` — Tailwind token classes: `bg-canvas bg-surface bg-sunk text-ink text-ink-2 text-ink-3 border-line border-line-strong text-accent bg-accent-tint bg-signal text-ok text-warn text-bad rounded-chip rounded-card shadow-pop text-display`, `.label` (mono eyebrow), `.dotfield`, `.rise`.
5. `src/data/benchmarkData.ts` — the ONLY content source. Every number shown must come from it (or from the archived v1 copy). No invented numbers, no lorem.
6. `_archive/v1/src/components/*.tsx` — the old site. Mine it for copy/facts and feature ideas; do NOT copy its visual design.

## Hard rules
- **Only edit the page file(s) you were assigned** (`src/pages/<Page>.tsx`). If you need a page-local sub-component, keep it in the same file (or `src/pages/<page>/` if the file passes ~500 lines). Do not edit `src/ui`, `src/app`, tokens, or other pages. If a primitive is missing, write it locally and mention it in your report.
- Page file must `export default function <Page>()` and start with `<PageHeader>`.
- **Hash routing**: never write `href="#something"` for in-page anchors — the router reads the hash as a route. For in-page jumps use a button calling `document.getElementById(id)?.scrollIntoView({behavior:'smooth'})`. Links to other pages: `import { href } from '../app/router'` → `href('/leaderboard')`.
- Images: `asset('images/hero-cells.webp')`, figures `asset('figures/Fig1_Leaderboard.png')`. Always `width`/`height`, `loading="lazy"` below the fold, meaningful `alt`.
  Available art: `images/hero-cells.webp` (UMAP dot-field with rare cells, 874×752), `images/tracks-lanes.webp` (six lanes = six tracks, 1344×752), `images/datasets-fields.webp` (ten sample fields = ten cohorts, 1280×720). Paper figures: `public/figures/*.png`, `public/figures/proof/*.png`.
- Light + dark must both work — use token classes only, never raw hex (exception: the image frame `bg-[#fafafa]`).
- Responsive 320 → 1920. No horizontal page scroll; wide tables scroll inside their own `overflow-x-auto` wrapper; under 768px prefer stacked card rows for tables.
- Accessibility: semantic headings in order (one h1 from PageHeader), buttons are `<button>`, tables use `<th scope>`, sortable headers use `aria-sort`, icons decorative unless labelled, focus states visible.
- Motion: only `.rise` / transform / opacity, ≤ 300ms for interactions.
- No new npm dependencies. No `console.log`. No `dangerouslySetInnerHTML`.
- Numbers: AP 3 decimals via `fmt.ap`, counts via `fmt.int`, `tabular-nums`. Every big numeral gets a denominator/context (`Stat` primitive).
- Never crown a single winner where CIs overlap; call out ties honestly (e.g. FiRE vs expr_threshold not significant).
- Copy voice: plain, precise, scientific. Short sentences. No hype ("revolutionary", "cutting-edge"), no emoji.

## Done means
- `npx tsc --noEmit -p tsconfig.app.json` passes with zero errors in your files, and `npx oxlint src/pages` is clean for your files.
- Report back (≤ 15 lines): what sections the page has, any primitive you wished existed, any data you could not find.
