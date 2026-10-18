# Mobbin research — REACH web patterns (2026-10-18, level B, shipped products)

## Decisions this research drives
1. **Nav**: 8 pages don't fit a plain link row → primary links (Overview, Leaderboard, Tracks, Datasets, Methods) + "More" group (Figures, Docs, Cite); one filled CTA (GitHub). No floating pill bar (covers table headers).
2. **Stats**: big-numeral rows are saturated → every numeral carries a denominator + source link (mono label above, e.g. `COHORTS · 10 / 8 solid + 2 blood`).
3. **Leaderboard**: sort state lives on the header (caret, 3-state). Draw the bootstrap CI *on the row* (no shipped example — this is our differentiator). Metric/pool tabs must restate metric + n. Never invert a single "winner" row — overlapping CIs mean ties.
4. **Docs**: grouped left sidebar + reading column + "On this page" rail (collapse rail < 1280px). Copy action in the code-block header, text label "Copy".
5. **Figures**: grid (not carousel) with metadata line per figure (file, track, formats); custom lightbox with close/prev/next + Esc/arrow keys.
6. **Cite**: fixed citation text + BibTeX block with labelled Copy button attached to the visible preview; per-cohort licence links, not boilerplate.

## (a) Leaderboard
| Source | Mechanism | Fails for REACH when |
|---|---|---|
| [Retool sorting](https://mobbin.com/sites/sections/1616c6de-5892-4125-a855-cac20aefbe30) | Caret + 3-state sort menu on header | Sorting by AP hides overlapping CIs; state the default rank |
| [Retool ranked bars](https://mobbin.com/sites/sections/e531d2b4-31e1-4207-8e09-24da1bfc7b69) | Thin proportional bar under label, value right-aligned | Bars from zero compress close AP values |
| [Contra Labs best models](https://mobbin.com/sites/sections/02d9a4e4-1ba1-43d3-a178-de39ac3d5713) | Chart + numbered list, tabs switch pool, method note above | No uncertainty shown |
| [Kraken leaderboard](https://mobbin.com/screens/596e24c3-cff1-466a-9e8c-9cd5a2e5d94b) | Segmented metric tabs + search beside table | Changing metric changes #1; restate metric + n |
| [Wise emphasis row](https://mobbin.com/sites/sections/0cb759c3-52e6-4ab6-97f2-e18bb1ea6397) | One inverted row with tag | Implies a single winner |

## (b) Stats hero
| Source | Mechanism | Fails when |
|---|---|---|
| [Spade stat cards](https://mobbin.com/sites/sections/34a2151f-c9b2-4121-b790-8e85202fe9ca) | Mono label naming what each numeral measures | Unit-less |
| [Ramp numeral row](https://mobbin.com/sites/sections/b3c99307-fd22-4b51-8d0b-11bc1d750391) | 3 numerals, caption under, no container | "+" counts; ours are exact |
| [Duna hairline stats](https://mobbin.com/sites/sections/b4a2d7bc-628d-4514-b17f-100cca0942d5) | Hairline dividers between stats | Relative claims need a baseline |
| [Robot.com bento](https://mobbin.com/sites/sections/f85060f2-e490-4793-b11f-86d41a6a2cd0) | Unequal tiles, one graphic tile | Tile size implies importance |
| [Klarna tinted band](https://mobbin.com/sites/sections/3cd1f36b-d3d2-494b-953c-a7fcd9087451) | Numerals on a tinted band | Unsourced credibility claim |

## (c) Docs
[Epidemic Sound](https://mobbin.com/sites/sections/e3c24560-d2ff-4340-8a7c-ba483bf68a74) · [Mailchimp](https://mobbin.com/sites/sections/65dc6280-a00f-478b-964e-acc02427b44a) · [Better Stack](https://mobbin.com/sites/sections/d367b862-f8ac-44e5-b6c7-140cae9f2c2e) · [Loops](https://mobbin.com/sites/sections/4d9a600f-08b9-4875-b921-057b6b0386d1) · [Browserbase](https://mobbin.com/sites/sections/7b413555-643c-4e2d-9efb-2ee108b6b90c) · [Framer](https://mobbin.com/sites/sections/a5c2c61a-2584-474e-82fa-4193df231f05) — sidebar + centre column is near-universal (saturated); copy in header beats bottom-right on long snippets.

## (d) Figures
[Base metadata grid](https://mobbin.com/sites/sections/d4f3d376-5f46-430f-b7f6-0b3d82a90917) · [Rivian slides](https://mobbin.com/sites/sections/ceb97802-b7e4-4c5c-814c-220c0aea8def) · [Framer lightbox](https://mobbin.com/sites/sections/689f7f7a-ac20-4f6c-a83f-ff5a07c2e41c) — no open lightbox overlay found; grid wins for comparison.

## (e) Nav
[Resend mega panel](https://mobbin.com/sites/sections/3a3c66b0-d727-4fe4-b368-db103afd5b6b) · [Mixpanel](https://mobbin.com/sites/sections/0dd0987b-88f6-4fb0-889b-722b81b92847) · [Bird](https://mobbin.com/sites/sections/3369b81d-787c-4970-b49e-165e0393bc43) · [Hex](https://mobbin.com/sites/sections/13d9a28c-126f-4364-acaa-7cdb47e77a7b)

## (f) Cite / footer
[Grammarly citation](https://mobbin.com/sites/sections/1140c46c-7097-4d04-8786-4769d4442b22) · [Faculty Dept footer](https://mobbin.com/sites/sections/61c49280-bcb2-4ddc-b79d-63883c3a5d18) · [Notion footer](https://mobbin.com/sites/sections/4b14cc89-6240-4a45-af6f-db815b1e72e2) · [Spline code card](https://mobbin.com/sites/sections/e5bd695a-b697-4248-9dae-7dad1a2ae0c4)
