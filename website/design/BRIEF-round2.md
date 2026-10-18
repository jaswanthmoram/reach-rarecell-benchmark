# Round 2 brief (read AFTER design/BRIEF-pages.md; this overrides it where they differ)

The user reviewed round 1 and wants a far more refined, modern, beautiful UI, with scientific errors fixed.
Your job: rebuild your assigned page to a polished, editorial, instrument-grade standard. Not a tweak.

## Read first (in this order)
1. `design/DESIGN.md`, especially the **v2.1 changes** section at the bottom (ranking rule, method colours, compact
   headers, themed art, icons, copy). It overrides anything earlier in the file.
2. `design/PAPER-AUDIT.md`: section (a) ranking framing, and section (c) copy corrections that name YOUR files.
   Apply every correction for your page. `src/data/benchmarkData.ts` was corrected against the latest proof; trust it.
3. `design/ASSETS.md`: the art and icons you can use.
4. Your page's current file(s) and the round-1 renders: `/private/tmp/claude-501/-Users-moramvenkatasatyajaswanth-reach-rarecell-benchmark/6d9e67ba-83e7-497f-a11a-655966e71392/scratchpad/v2/crops/<page>-*.png`.

## Non-negotiables
- **Ranking**: only FiRE, CellSIUS, scMalignantFinder, RareQ, scCAD, DeepScena are ranked (1–6 by median AP).
  hvg_logreg (supervised ceiling, dashed), CaSee (exploratory), expr_threshold (naive baseline), random_baseline
  (floor) are unranked reference rows/lines. Never "#1 overall", never "tie", never a winner badge.
- **Method colours** via `MethodDot` / `MethodName` / `methodColor(id)` / `CIBar color=` from `src/ui`.
  Use them wherever a method appears (tables, cards, charts, legends). Text stays ink. Reference methods use `dashed`
  where it helps (hvg_logreg always dashed).
- **Compact header**: use `<PageHeader label title lead art artSize artAlt>` (Home excepted). The working surface
  must begin by ~300px at 1440x900. No big marketing button pairs in interior headers (one small action max).
- **Art**: `art="images/<name>"` (no suffix; light/dark pair loaded automatically). For art elsewhere on a page use
  `<ThemedArt base="images/<name>" size={[w,h]} alt="">`. Sizes: home-hero 1600x905, home-hero-portrait 960x1200,
  leaderboard 1600x905, methods 1600x905, docs 1600x900, figures 1280x720, cite 720x720,
  tracks-lanes 1344x752, datasets-fields 1280x720. Never show a light art panel in dark mode.
- **Paper figures**: the canonical published figures are now `figures/paper/fig-1.webp` … `fig-6.webp`
  (sizes 1647x1172, 1647x1179, 1391x1409, 1653x1975, 1386x1254, 1152x609). Fig 1 overview, Fig 2 six tracks,
  Fig 3 method inclusion/QC audit + Track A AP leaderboard + multimetric summary, Fig 4 bootstrap AP intervals +
  critical-difference rank view + rarity tiers, Fig 5 Track A vs B + Track E noise + Track C null + calibration,
  Fig 6 runtime vs accuracy. Use these instead of the old `figures/*.png` pipeline outputs (those may only appear on
  the Figures page, labelled "Pipeline output, not the published figure"). Show figures on a `bg-[#fafafa]` sheet
  with a "Figure N · Frontiers 2026" label.
- **Icons**: Phosphor sprite via `<Icon name>` (see `src/ui/Icon.tsx` for names; if you need one that isn't
  there, tell me, do not add a new library). Cohort glyphs: `<svg><use href={asset('icons-cohorts.svg') + '#cohort-<datasetId>'} /></svg>`.
  Use icons as quiet section/item markers (16–20px, text-ink-3), not decoration.
- **Copy**: no em dashes. Greek inside `.label` wrapped in `<span className="normal-case">`. Every number must
  reconcile with the data file; state ordering keys and n in captions.
- **Visual quality bar**: real hierarchy (one dominant element per section), varied rhythm, generous whitespace
  around dense data, aligned baselines, hairline structure, consistent 40px table rows, tabular numbers, method
  colour accents, purposeful `.reveal` scroll entrances (CSS only), hover/focus states that feel designed.
  It should read like Linear / Stripe docs / Observable quality, applied to a research benchmark.
- Mobile 320–390: no clipped tables or code (scroll inside wrappers), no wrapping pill blobs, cards instead of
  wide tables.
- Only edit your assigned files (+ a `src/pages/<page>/` folder if needed). Do not edit `src/ui`, `src/app`,
  tokens or data. If a primitive is missing, build it locally and report it.

## Done means
- `npx tsc --noEmit -p tsconfig.app.json` clean, `npx oxlint src/pages` clean for your files, no em dash in your files
  (`grep -n '—' <files>` returns nothing).
- Render your page at 1440 and 390 in light and dark (dev server: the preview at http://localhost:5199 is already
  running; screenshot with `node /private/tmp/claude-501/-Users-moramvenkatasatyajaswanth-reach-rarecell-benchmark/6d9e67ba-83e7-497f-a11a-655966e71392/scratchpad/cdpshot.mjs "<url>" <width> <light|dark> <out.png>`
  (needs to run outside the sandbox), save to `scratchpad/v3/<page>-<w>-<theme>.png`, LOOK at them, and fix what
  looks wrong before reporting.
- Report ≤ 15 lines: what changed, which audit corrections applied, anything you could not do.
