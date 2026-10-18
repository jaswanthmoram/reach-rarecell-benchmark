# Research: Refero (source = refero)

Question: how do best-in-class research / data / dev-tool sites handle data-dense hero, leaderboard tables, long-form method pages, code docs, figure galleries, and a disciplined light theme. Product: REACH Benchmark site (Home, Leaderboard, Tracks, Datasets, Methods, Figures, Docs, Cite).

## Source status (read first)

- **Styles layer FAILED.** `refero_search_styles` returned `NO_RESULTS` for all 14 queries tried (short, long, brand-named, plain "SaaS"; json and md). No style UUIDs, so `refero_get_style` could not run. **No style tokens in this file come from `refero_get_style`.** Retry later or ask the user to check the Refero plan/MCP auth.
- **Screens layer worked** (about 14 searches, 14 full `refero_get_screen` reads). Tokens below are therefore **screen-derived**: `hex_colors` (pixel-extracted by Refero, higher trust), `fonts` metadata (real, when present), and spacing/radius/size from the screen description text (model-written, approximate, treat as +/- 20 percent).
- Caveat: `0xFBFBFB` appears in nearly every capture. It is an extraction artifact for "white", not a brand colour. Ignore it as signal.
- Caveat: Refero's Linear, Vercel, Raycast, Cartesia, n8n captures are dark mode; Vercel/Stripe captures are old and have empty `hex_colors`. Light-theme evidence below comes from Anthropic, Stellate, Attio, W&B, Visitors, Instacart, Appwrite.
- **Not in Refero** (hand to the `web` / `sites` researchers): Hugging Face leaderboards, Observable, Papers with Code, Arc, scientific journals. Do not infer their tokens from this file.
- Flows layer not used (no multi-step journey in scope).

## References (13)

Sat = saturation flag. IDs are Refero screen UUIDs (open at `https://refero.design/pages/<uuid>`).

### 1. Anthropic research article (`1ec3888e-2e13-482b-b6ac-7527433a0301`)
- URL: https://www.anthropic.com/research/reward-tampering
- Informs: Methods (long-form), Home (headline + paper link), Figures.
- Mechanism: single centred column; title then ONE black pill CTA ("Read the paper") before the body; charts sit inline with body text, two bar charts side by side, neutral gray bars with one hot series colour; links in muted brown, underlined; fonts `Styrene A/B` (sans) + `Tiempos` (serif).
- Principle: the primary action for a research artifact is the paper itself; charts use gray as default and colour as the single claim.
- Fails for us: static chart images (no CIs, no hover, no data download); warm cream + terracotta is the current "AI-lab editorial" look. Sat: SATURATED (cream/serif/clay).

### 2. Anthropic research index (`91285208-9ba3-4a4d-990e-0f1c957ca83a`)
- URL: https://www.anthropic.com/research
- Informs: Figures index, Cite/About, Tracks switcher.
- Mechanism: capsule tab row under hero (active = filled black capsule, rest outlined) for faceting; full-width search; publication list as 3 columns (Title / Category / Date) divided by hairlines only; numbered principle blocks in 4 columns.
- Principle: facet with tabs, not dropdowns, when there are 3 to 6 facets (our tracks A-F fit exactly).
- Fails: list is not sortable; no metric column.

### 3. Weights & Biases eval table (`1ff391d4-ba59-4433-baa2-080dfc71fb50`)
- URL: https://wandb.ai (public report workspace)
- Informs: Leaderboard.
- Mechanism: numeric columns centre/right aligned at fixed 5-decimal precision so digits line up; hairline row rules (~#CCC) with no zebra; footer strip with pagination centred and "export CSV / columns / reset" as three small text buttons at right. Fonts: `Source Sans Pro` / Helvetica.
- Principle: leaderboards for scientists need export + column control as first-class, quiet controls; fixed precision beats pretty rounding.
- Fails: it is a modal over an app, about 15 columns with no rank concept and no uncertainty; chart sibling (`98ac467a-ee03-457f-b688-c20281d5e080`) uses a rainbow bar palette (do not copy).

### 4. Attio table (`4230ed22-90d5-4524-8348-840c69529946`)
- URL: https://attio.com (app screen)
- Informs: Leaderboard toolbar and cells.
- Mechanism: toolbar above table with Sort / Filter / View settings / Import-Export; header row bold 14px; uniform rows with 12-16px cell padding; light hairlines (~#E0E0E0); status as coloured dot + word ("Very weak" ... "Good"); row count bottom-left. Fonts Inter / SF.
- Principle: encode state with dot + label so colour is never the only channel (a11y).
- Fails: pastel category pills (green/yellow/purple) would fight a semantic palette; avatars irrelevant; no CI whiskers.

### 5. Parallel benchmark page (`e8d32363-183a-4902-8816-851861eea2f2`)
- URL: https://parallel.ai/ai
- Informs: Home hero (results as content), Leaderboard.
- Mechanism: the hero IS the result: benchmark tables (Series / Model / Cost / Accuracy / Win rate) set in monospace, aligned, inline with methodology notes; `Gerstner Programm` + `System Mono`; links shown as visible text.
- Principle: show the table and the method side by side; monospace guarantees numeric alignment.
- Fails: dark terminal pastiche, ASCII (not a real `<table>`, not sortable, poor for screen readers). Borrow the stance, not the skin. Sat: dark-terminal is trending.

### 6. Stellate home (`6366c14a-5c36-4e61-bf7a-3a2cd3913d3a`)
- URL: https://stellate.co/
- Informs: Home hero, stats band.
- Mechanism: hero splits left headline + two CTAs, right a white framed card holding a real analytics screenshot (table + bar chart) rather than a gradient; then a full-width chart band; later large numeric stat cards in white; section rhythm alternates white / soft blue / navy band. Fonts `TT Commons`, `Fira Code`, `Helvetica Neue`.
- Principle: real data in a bordered card is the hero image; alternate band backgrounds to pace a long page.
- Fails: orange CTA on navy is generic dev-SaaS; world-map stat band irrelevant; screenshots are product UI, ours must be live result components.

### 7. Linear home + customer chart (`99b285fd-ddf0-42a4-8e11-caa7cba87c9c`, `95b048cd-6c04-4903-8658-9f9e95f16b69`)
- URL: https://linear.app/ and linear.app/customers/brex
- Informs: Home hero framing, Figures (comparison chart language).
- Mechanism: real product screenshot under the headline; bento feature grid; the proof chart is a two-shade-of-gray horizontal bar pair with a 1-5 Likert axis, no colour at all. Font `Inter`.
- Principle: comparison charts in two grays are more credible than six colours.
- Fails: captured in dark mode only; tilted-screenshot hero is a trope; bento is saturated. Sat: SATURATED (dark + bento).

### 8. Visitors docs + home (`80123d5e-e4a9-4645-85a5-4fad33cb37c1`, `5e26d4eb-3993-441a-9c5f-d58d6da24d40`, `a7582434-e54f-4219-b5e3-5f628c9fdc26`)
- URL: https://visitors.now/docs/installation/basic
- Informs: Docs/Quickstart (light), status colours.
- Mechanism: left sidebar tinted very light gray (~#F9FAFB), 14px nav, active item bold with a small dot; 12px category eyebrow above a ~28px/700 H1; code block is LIGHT gray (~#F3F4F6) with `San Francisco Mono`; performance page uses green/yellow/red strictly for status values. Font `Open Runde`.
- Principle: light code blocks keep a light page calm; status hues reserved for status.
- Fails: pastel-gradient dashboard cards and purple accent are generic.

### 9. Anthropic docs intro (`ec087562-2b56-4e8b-8aa1-3f8b288d3d8f`)
- URL: https://docs.anthropic.com/en/docs/intro-to-claude
- Informs: Docs/Quickstart IA.
- Mechanism: two columns, left nav ~20 percent with grouped headings (get started / learn / build), active item gray-filled; body ~75-80 percent; tabs, table, accordion, prev/next pagination; tagged "Quickstart Guide". Font `Styrene`.
- Principle: group nav by user goal, not by API surface.
- Fails: no code-first hero; no copy-able 5-line "hello benchmark".

### 10. Appwrite tutorial (`086512fc-1860-44c4-a720-70df3247bd9b`)
- URL: https://appwrite.io/docs/tutorials/vue/step-2
- Informs: Docs/Quickstart (stepped).
- Mechanism: 3 columns: nav / content / right rail listing numbered tutorial steps 1-8; dark shell blocks with line numbers and top-right copy icon; bottom pair "back link + primary Next step button". Fonts `Inter`, `Aeonik`.
- Principle: numbered right-rail steps make a quickstart feel finite.
- Fails: dark blocks on light page are heavy; pink accent. Our flow is about 4 steps (install, load, evaluate, submit).

### 11. Instacart docs (`b6447a99-71c5-443a-b633-12d641d2beb0`)
- URL: https://docs.instacart.com/connect/api
- Informs: Docs layout, Methods page rail.
- Mechanism: left nav rail, centred article column, slim right "on this page" rail; neutral grays with exactly one brand accent (green ~#4FAC3C); fonts `SF Mono` for code.
- Principle: one accent on an otherwise neutral docs shell; the right rail is the reader's map in long pages.
- Fails: generic; nothing scientific (no citations, no footnotes).

### 12. Stripe docs Atlas (`4eb4e827-5346-44a2-838e-95b445677ab2`)
- URL: https://stripe.com/docs/atlas
- Informs: Docs nav depth, search.
- Mechanism: nested sidebar sections, active link bold/shaded, search field in top bar, breadcrumb + tabs above content, links blue with hover underline.
- Principle: persistent top-bar search is the main wayfinder in docs.
- Fails: old capture (empty `hex_colors`), no code column visible here. Treat as structural evidence only.

### 13. Unsplash gallery + stats, Visual Electric (`ecc0927d-37b7-4cab-aa73-36de7d93e174`, `b5ec7f03-8554-4b2c-b5e2-01e7cb0b4a49`, `91a3ee3b-6ebc-4933-a15b-4010b74e5905`)
- URL: https://unsplash.com/images/animals, /stats; https://visualelectric.com/inspo
- Informs: Figures gallery; Home stat row.
- Mechanism: title + count ("151 photos") + tag chips + breadcrumb above a grid; Visual Electric uses a dense masonry with no borders and no shadows; Unsplash stats page is big black numerals on white. Lightbox pattern (`5b5ad04d-9563-4157-8e7c-ff5b5ca0705c`): white rounded modal, small bold title, X top-right.
- Principle: show the count and filters before the grid; chips for facets.
- Fails: masonry suits photos, not figures with captions and panel letters; use a fixed-ratio grid with caption below each tile.

(Also seen, not relied on: Raycast vs Alfred feature table `783ecc48-054a-491c-b72a-c123b018edb6` for a method-by-check audit matrix, dark and red-accented; Matter reader `929abc02-87b8-4349-8b41-d16af22b2ec0` for small uppercase eyebrow over a bold serif headline in a ~70 percent article column.)

## Screen-derived tokens, top 3

1. **Anthropic research** (editorial). Fonts: Styrene A/B + Tiempos. Ink `#171716`; muted `#747472`, `#595957`, rule/secondary `#9A9A98`; accent terracotta `#CB7C5C` / `#C8725C`; link brown ~`#A0522D`; footer ~`#0A0A0A`. Page background described as `#FAF9F6` / `#F8F8F0` (two descriptions disagree; treat as warm off-white). Type: title ~28-40px, section ~20-24px, body 16px, line-height 1.2-1.4 on headings. Layout: centred single column, generous horizontal margins, capsule tabs, hairline list dividers. Radius: capsule for tabs/buttons; cards small. Reject: the warm cream and clay (saturated).
2. **Stellate** (data hero). Fonts: TT Commons, Fira Code, Helvetica Neue. Ink navy `#374154` / `#2C344C`; secondary text `#99A2B2`; blue `#528ED7`; CTA orange `#EE7651` (CTA only); page `#FFFFFF` with `#F7FAFC` bands; dark band ~`#1A202C`. Type: H ~36px bold, sub 18-20px, body 14-16px. Layout: two-column hero, white cards with subtle shadow, alternating bands. Reject: orange/navy pairing.
3. **Attio + W&B table** (data table). Fonts: Inter / San Francisco (Attio), Source Sans Pro (W&B). Ink `#04080C`; muted `#666`-`#888`; hairlines `#E0E0E0` / `#CCCCCC`; Attio accent blue `#2B6CF3`; badge tints `#DFF4DD`, `#FFF4D0`, `#F2DEFF`. Type: header 14px semibold, cells 12-14px. Spacing: cell padding 12-16px, uniform row height. Radius: none on rows, ~6-8px on modal. Reject: pastel badges, rainbow series.

## Patterns and gaps

- **Strongest pattern:** real data inside a bordered light card as the hero (Stellate) combined with a quiet toolbar-plus-numeric-table core (Attio, W&B) and gray-by-default charts with one accent (Anthropic, Linear).
- **Most common pattern:** three-zone docs shell (left nav / centred article / right rail) in Appwrite, Instacart, Anthropic, Stripe, Visitors; and dark-mode hero with gradient or tilted screenshot (SATURATED).
- **Gap no reference fills:** (a) uncertainty inside the table cell: none show rank CIs or whiskers next to the score; (b) none make the hero a live, sortable result; (c) none surface audit/provenance status as a table column or per-row reproducibility link; (d) none provide a figure gallery with panel-level captions, source data and "cite this figure".

## Recommended visual direction: "Lab instrument, light"

Reference lock. Primary: Stellate-style data hero card + Attio/W&B table discipline. Preserve: white framed result cards, hairline-only structure, gray-first charts with a single accent, monospace tabular numerals. Borrow only: Anthropic's capsule facet tabs and "paper link as primary CTA"; Appwrite's numbered right-rail steps. Reject: dark mode default, gradient blobs, cream + serif + clay, pastel pills, rainbow series, tilted screenshot, bento everywhere.

**Palette (hex)**
- Canvas `#FAFAFA`; surface `#FFFFFF`; sunken (code, sidebar) `#F3F4F6` (Visitors `#F3F4F6`/`#F9FAFB`)
- Hairline `#E2E4E8` (Attio `#E0E0E0`); strong rule `#C9CDD4` (W&B `#CCCCCC`)
- Ink `#0E1116` (W&B `#04080C`, Linear `#040B0B`); secondary `#4B5563` (Visitors body); tertiary `#8B91A0`
- Single accent `#2F5BEA` (Attio `#2B6CF3`, Stellate `#528ED7`; about 5.5:1 on white, AA); hover `#2448C8`; tint for selection/active row `#EAF0FE`. Used for links, focus, active sort, and the rank-1 marker only.
- Status trio, audit column only (Visitors rule: hues = status only): pass `#1F8A5B`, caution `#B7791F`, fail `#C0392B`; always with word or glyph, never colour alone.
- Charts: all series `#9AA1AE` gray; the claim series `#2F5BEA`; direct-label instead of 10-colour legends. Track A-F identified by letter chip (ink on `#F3F4F6`), not by hue.

**Type pairing (Google Fonts)**
- `Geist` (UI, display, body) + `Geist Mono` (all numerals in tables, code, IDs). Geist Mono echoes Raycast's `Geist Mono` and the monospace-table stance in Parallel / W&B fixed precision. If Geist is unavailable in the build, fall back to `Inter` + `JetBrains Mono`.
- Two families only. No serif by default; Methods prose uses Geist 17-18px / 1.65 at about 68ch (Anthropic single column), with small uppercase eyebrow labels (Matter, Visitors).
- Scale: hero 56-72 clamp, H1 40, H2 28, H3 20, body 16-18, table 13-14, eyebrow 12 uppercase +0.06em.

**Radius and spacing rhythm**
- Radius: 0 on table rows; 4px inputs, chips, code; 8px cards and figure frames; 999px only for facet tabs (Anthropic capsules) and status dots; overlays 8px.
- Depth: hairline borders, not shadows; shadow only on popovers/modals (`0 8px 24px rgba(14,17,22,.08)`).
- Spacing: 4px base; steps 4 / 8 / 12 / 16 / 24 / 40 / 64 / 112. Table rows 40px (32px dense toggle), cell padding 12x16 (Attio). Section rhythm alternates airy (112px) and dense (table/figure bands at 40-64px), with one tinted band per page (Stellate banding).
- Docs shell: 240 / 720 / 200 px columns (Appwrite, Instacart); Methods single column 68ch plus sticky right "on this page".

**Page map**
- Home: split hero, left claim + paper CTA, right live top-5 mini-leaderboard with AP bars and CI whiskers (real SVG, from data), then a mono stat row (543,499 cells, 10 cohorts, 6 tracks, 10 methods, 1,125 units).
- Leaderboard: Attio toolbar (sort/filter/view/export) + W&B fixed-precision numerics + rank CI whisker cell + status dot+word audit column; track tabs as capsules.
- Methods: Anthropic single-column article + Instacart right rail; audit matrix table instead of cards.
- Docs/Quickstart: Appwrite numbered right rail, light code blocks (Visitors), copy button, tabs for pip/conda.
- Figures: fixed-ratio grid, count + chips header (Unsplash), lightbox with caption, source data, cite-this-figure.
- Cite: single mono BibTeX block with copy button, paper link as primary CTA.

## Next steps for the orchestrator
1. Retry `refero_search_styles` later; if it recovers, run `refero_get_style` on 3 light-theme data/dev sites and replace the "screen-derived" tokens above.
2. Have `web` / `sites` researchers cover Hugging Face leaderboards, Observable, Papers with Code, Arc, journals (not in Refero).
