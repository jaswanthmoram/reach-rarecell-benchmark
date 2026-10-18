# Round 4 brief: polish pass (read after BRIEF-round3.md; overrides it)

Three critics reviewed round 3 (brief, craft, slop-monster). This round fixes what they found. It is a refinement
pass: keep what works, cut what repeats, fix ordering and craft defects. Invoke `design-master:slop-monster` on your
page at the end and fix what it flags.

## Site-wide rules (apply on your page)
1. **Ordering everywhere, not just the main table.** Any list, chart, heatmap row/column, matrix axis or legend that
   shows methods uses: hvg_logreg (ceiling, dashed) FIRST/above, then ranked 1–6 by median AP (FiRE, CellSIUS,
   scMalignantFinder, RareQ, scCAD, DeepScena) contiguous, then references (CaSee, expr_threshold, random_baseline).
   If the ceiling is not relevant to a view, drop it rather than moving it below.
2. **Reference marks are dashed** (`MethodDot dashed`, `CIBar dashed`) for hvg_logreg, CaSee, expr_threshold,
   random_baseline, in every view incl. mobile cards.
3. **All-10 rank positions or shifts** appear only in a chart titled exactly "Within-unit rank, all 10 methods
   (Figure 4b)". A place-shift chart counts as rank positions: give it that title or show AP instead.
4. **Eyebrow labels**: `PageHeader`/`Section` `label` only when it adds information the heading lacks (a table name,
   a figure number, a unit count). Delete labels that restate the heading or expose process notes
   ("Prototype · compare", "proto-personas", "Get started · 01").
5. **Numbering** (01/02/03) only for real sequences (pipeline phases, Docs steps). Remove elsewhere.
6. **No coloured left-border accent stripes** on callouts. Use a 1px hairline + tint, or plain text.
7. **The headline result** (FiRE vs expr_threshold, BH-FDR 0.836) is stated in full only on Home and Leaderboard.
   Elsewhere link to it ("See pairwise tests" → `href('/leaderboard')`).
8. **Copy**: avoid the "X, not Y" / "never Y" contrast shape; say what the thing is. No caption that only describes
   what a figure obviously shows. One mention of "DOI pending" per viewport (badge on the DOI itself; elsewhere plain).
9. **Numbers**: AP always 3 decimals (`fmt.ap`), runtimes via `fmt.secs` (seconds, one decimal). Mono labels ≥ 11px.
10. **Motion**: `.reveal` is now a no-op site-wide; do not add scroll fades back. The hero may keep `rise`.
11. **Header**: `PageHeader` now puts art in a framed 8px card inside the container (no full-bleed). Do not wrap it
    again. The working surface should start by ~420px at 1440x900.

Unchanged: only edit your page files; tokens only; no em dashes; no new deps; tsc + oxlint clean for your files;
render 1440 + 390 light + dark (`scratchpad/cdpshot.mjs`, outside sandbox, one at a time) into `scratchpad/v5/`,
look, fix, report ≤ 12 lines.
