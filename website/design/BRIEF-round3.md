# Round 3 brief (read after BRIEF-pages.md and BRIEF-round2.md; overrides both)

User verdict on round 2: heroes "not nice", wants every page's hero and sections redesigned section by section to a
best-in-class, modern, beautiful standard, with working prototypes of every interaction, loaders, edge cases and
use cases. The site is reviewed as an artifact prototype: https://claude.ai/artifact/GrdyGhzb8K79dW5FmcJYgN

## Skills to invoke first (then apply them, not just read them)
`ui-design-os:section-designer` (design each section: place it in page rhythm, field 2–3 directions, pick one with a
product reason), `anthropic-skills:impeccable`, `design-master:design-tricks`, `tastemaker:tastemaker` (build mode, lock
in `.tastemaker/style-lock.md`), and at the end `design-master:slop-monster` on your rendered page; fix what it flags.

## Read
- `design/DESIGN.md` including **v2.1** and **v2.2 rule changes** (contiguous ranked block; ceiling above; references in
  their own group + axis marks; no best-value signal dot; no all-10 ranks except the chart titled "Within-unit rank,
  all 10 methods (Figure 4b)"; never "tie"; art on mobile; Figures shows only the 6 published figures).
- `design/PAPER-AUDIT.md` (a) and (c) for your page. Data in `src/data/benchmarkData.ts` is the truth
  (`bootAPLow/High` exist; `GLOBAL_STATS.year`, `journalShort`, `githubUrl`, `paperTitle`, `doiConfirmed`).
- Round-2 critic findings for your page (below, per page in your task prompt).
- New primitives/APIs from the brand round: read `src/ui/` and the System page (`#/system`) before building; use the
  branded `Loader`, `Skeleton`, `EmptyState`, `ErrorState`, `Toast`, `Tooltip`, `Logo` where relevant. Do not edit `src/ui`.

## New hero art (round 3)
`images/<page>-hero` light/dark pairs, 1600x900 (cite 1200x1200; home also `home-hero-portrait` 960x1200). Pages:
home, leaderboard, tracks, datasets, methods, figures, docs, cite, system, use-cases. Focal subject sits in the right
55%, calm left 45% for the headline. Use via `PageHeader art="images/<page>-hero" artSize={[1600,900]}` or a custom
hero with `ThemedArt`. The art is now strong: give it room (a hero band, not a thumbnail) while keeping the working
surface reachable (first interactive element within ~1 screen at 1440x900, ideally ≤ 420px).

## Each page must include
1. A redesigned hero: thesis headline (one checkable fact), one-sentence lead, at most one primary + one secondary
   action, the page art used well (both themes, mobile too), and a "key facts" strip only if it carries real numbers.
2. Every section designed deliberately (section-designer): one dominant element, varied rhythm, real data, show-don't-tell.
3. Working prototypes of every interaction on the page (sort, filter, tabs, expand, copy, lightbox, compare, etc.)
   with designed states: loading (branded Skeleton/Loader for any deferred content), empty (EmptyState), error
   (ErrorState with retry where something can fail, e.g. clipboard), focus/hover/active, reduced motion.
4. Edge cases visible: long names, missing values ("n/a" with reason), proxy/fallback/degenerate flags, unconfirmed
   DOI, mobile 320px.
5. Motion: purposeful CSS only (`.reveal`, `rise`, transform/opacity), ≤ 300ms interactions.

## Unchanged hard rules
Only edit your page file(s) + `src/pages/<page>/`. Tokens only. Method colours on marks only. No em dashes. No new deps.
No `href="#…"` in-page anchors. `npx tsc --noEmit -p tsconfig.app.json` + `npx oxlint src/pages` clean for your files.
Render 1440 + 390 in light + dark with `node /private/tmp/claude-501/-Users-moramvenkatasatyajaswanth-reach-rarecell-benchmark/6d9e67ba-83e7-497f-a11a-655966e71392/scratchpad/cdpshot.mjs "http://localhost:5199/#/<route>" <w> <light|dark> <out.png>`
(outside the sandbox) into `scratchpad/v4/`, LOOK, fix, then report ≤ 15 lines.
