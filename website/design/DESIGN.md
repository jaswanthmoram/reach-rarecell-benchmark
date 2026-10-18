# REACH v2.1: Design System

**Direction: "Lab instrument, light."** The site is a precision instrument for reading a benchmark, not a
marketing page. Real data is the hero. Hairlines instead of shadows. Gray first, one accent, one signal.
Evidence: `research/refero.md` (Stellate data-card hero, Attio/W&B numeric tables, Anthropic article column,
Appwrite docs shell) and `research/mobbin.md`.

## Signature motif — the rare cell
Thousands of gray dots, a handful in **signal vermilion**. It appears in: the logo mark, hero art, the `.dotfield`
texture, and the leaderboard's "best AP" marker. Signal is **never** used for status or links.

## Tokens (`src/styles/tokens.css`)
| Role | Light | Dark | Tailwind |
|---|---|---|---|
| Canvas | `#FAFAFA` | `#0B0D11` | `bg-canvas` |
| Surface (cards, tables) | `#FFFFFF` | `#12151B` | `bg-surface` |
| Sunk (code, wells) | `#F2F3F5` | `#0F1217` | `bg-sunk` |
| Ink / 2 / 3 | `#0E1116` / `#4A5160` / `#8A909C` | `#E8EAEE` / `#A7ADB8` / `#6C7380` | `text-ink`, `text-ink-2`, `text-ink-3` |
| Hairline / strong | `#E2E4E8` / `#CDD1D8` | `#23272F` / `#343A45` | `border-line`, `border-line-strong` |
| Accent (links, focus, selected, highlighted series) | `#2F5BEA` | `#7B96FF` | `text-accent`, `bg-accent-tint` |
| Signal (rare-cell motif only) | `#FF5A1F` | `#FF7A45` | `bg-signal` |
| Status ok / warn / bad (audit only) | `#1F8A5B` / `#B7791F` / `#C0392B` | lifted | `text-ok` … |
| Chart base / muted | `#C4C8D0` / `#E6E8EC` | | `bg-chart` |

Contrast: ink-2 on canvas 7.9:1, ink-3 on surface 3.4:1 → ink-3 is for labels ≥ 11px uppercase mono and
non-essential metadata only; never body text.

## Type
- **Geist** (UI, prose) + **Geist Mono** (labels, numbers in tables, code). Two families, no serif.
- Scale: `text-micro` 11 mono label · `text-xs` 12 · `text-sm` 14 (table, UI) · `text-base` 16 (prose) ·
  `text-lg` 18 lead · `text-2xl` 24 / `text-4xl` 36 section heads · `text-display` fluid 40→76 page hero.
- Headings: weight 600, tracking `-0.02em` (display `-0.035em`). Prose measure `max-w-[68ch]`.
- All numbers `tabular-nums`; AP values fixed 3 decimals (`0.412`), runtimes with unit.

## Space, shape, depth
- 4px base. Rhythm: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 80 · 128. Sections `py-20 md:py-32`; not uniform —
  dense data blocks get 24/32, transitions between topics get 80/128.
- Radius: **0** table rows · **4px** chips/badges/inputs · **8px** cards, code, figures · **full** only segmented tabs.
- Depth: hairline borders. `shadow-pop` only for floating layers (menus, lightbox, toasts).
- Container: `max-w-[1240px] px-4 sm:px-6 lg:px-8`. Docs: 240 sidebar / 68ch column / 200 rail.

## Motion
`--ease-out` cubic-bezier(.16,1,.3,1); 150ms for hover/focus, 300ms for disclosure, 600ms `.rise` on page entry
(once). Transform/opacity only. `prefers-reduced-motion` collapses everything.

## Components (`src/ui/`)
| Component | Variants | Notes |
|---|---|---|
| `Button` | primary (ink fill), secondary (hairline), ghost; sm/md | Icon optional; `href` renders `<a>` |
| `Badge` | neutral, accent, ok/warn/bad, track (A–F letter chip) | 4px radius, mono 11px |
| `Stat` | — | Mono label → numeral → denominator/source line. Never a bare number |
| `Card` | plain, interactive | 8px, hairline, hover lifts border to `line-strong` |
| `Section` | — | Eyebrow label + h2 + lead + content; `id` for anchor |
| `PageHeader` | with/without art | Every page starts with it: label, h1 display, lead, optional image |
| `CodeBlock` | — | Header strip with filename/lang + text "Copy" button |
| `Tabs` (segmented) | — | `role=tablist`, arrow keys; restates metric + n under it |
| `CIBar` | — | Mean dot + bootstrap CI whisker on a shared 0–1 scale; the leaderboard differentiator |
| `Icon` | — | Phosphor regular sprite (`public/icons.svg`), chosen via Supericons |

## Icons
Phosphor regular, one family everywhere (Supericons recommendation). Sprite in `public/icons.svg`, `<Icon name>`.
Animated Icons8 icons were evaluated and rejected: they come in other families (iOS7/Fluent) and would break
the single-family rule; Lottie needs a paid credential. Motion on icons is CSS (copy → check swap).

## Imagery
Generated, then reviewed at full size. Flat dot-field data art on `#FAFAFA` in graphite + signal + accent hairlines.
Always framed in an 8px hairline card (so it sits in both themes). No stock photos, no 3D, no glow, no text in images.

## Page rules
- Every number has a denominator or a source link (Mobbin: unsourced numeral rows are saturated).
- Leaderboard never crowns one winner: overlapping CIs are shown, ranks carry their bootstrap interval.
- Tracks are letter chips A–F, not colours.
- Nav: 5 primary links + "More" (Figures, Docs, Cite) + GitHub button. Mobile: full-screen sheet.


---

## v2.1 changes (round 2: user review + critics + tastemaker)

### Method identity colours
Each method has one categorical colour (`--m-<id>` in tokens.css; `methodColor(id)`, `<MethodDot>`,
`<MethodName>` in `src/ui`). Rules:
- Colour marks the method on **marks only**: dots, CI whiskers, chart lines, chips. Text stays `ink`.
- Published detectors get hues (FiRE blue, CellSIUS teal, scMalignantFinder ochre, RareQ violet, scCAD magenta,
  DeepScena olive); CaSee (exploratory) brown; references are neutral: expr_threshold gray, random_baseline light
  gray, hvg_logreg ink **with a dashed mark** (`dashed` prop) because it is a supervised ceiling, not a detector.
- All marks >= 3:1 against `surface` in both themes (checked with tastemaker `check_contrast.py`).
- Same method = same colour on every page. Never use a method colour for anything else.

### Ranking presentation (scientific integrity, non-negotiable; from PAPER-AUDIT.md, Table 4 note p.11)
- **Only the six published detectors are ranked, 1–6, by median AP (Track A):** FiRE 0.313, CellSIUS 0.259,
  scMalignantFinder 0.235 (proxy), RareQ 0.196, scCAD 0.130, DeepScena 0.018.
- **References are never ranked** ("not assigned leaderboard ranks"): hvg_logreg = in-sample supervised ceiling
  (dashed line above the list), CaSee = exploratory comparator, expr_threshold = naive baseline (total UMI count),
  random_baseline = floor. Show them as labelled reference rows/lines where their score falls, no rank number.
- Wording: say "no significant difference (BH-FDR 0.836)", "overlapping middle band", "practically
  indistinguishable". Never "tie", never "#n overall", never a winner badge. FiRE may be called "highest median AP
  among the ranked published detectors" with the no-significant-difference note next to it.
- The 1–10 within-unit rank (Figure 4b) may appear only on a chart explicitly labelled as such.
- DOI is unconfirmed in the proof (`doiConfirmed: false`): show it with a small "pending" note.

### Headers and first viewport
- Only Home has a display hero. Interior pages use the compact `PageHeader` (44px H1, <= 2-line lead, optional
  art thumbnail at right). The working surface must start by ~300px at 1440x900.
- Hero (Home): two clean columns, text left, data card + art right; the card never overlaps text; headline wraps
  to 2–3 balanced lines (`text-wrap: balance`, max ~14ch per line).

### Art in both themes
Every illustration ships as `<name>-light.webp` + `<name>-dark.webp`; render with `<ThemedArt base>` /
`PageHeader art=`. No white panels in dark mode. Paper figures (matplotlib PNGs) are evidence: keep them on a
`bg-[#fafafa]` sheet in both themes and label them "Paper figure", never use them as decoration.

### Icon vocabulary
- UI + section icons: Phosphor regular sprite (`public/icons.svg`), chosen via Supericons. Use icons as section
  markers on findings, pipeline steps, archives, track rows: one icon per item, 16–20px, `text-ink-3`.
- Cohort icons: organ/tissue glyphs in `public/icons-cohorts.svg` (`<symbol id="cohort-<datasetId>">`), one family.

### Copy
- No em dashes in shipped copy (tastemaker hard ban). Use a period, colon, comma or parentheses.
- Greek in `.label` (uppercase) must be wrapped in `<span className="normal-case">` so ρ/δ/χ² stay correct.
- Every count shown must reconcile with the data file; if two sources disagree, show the paper's number and
  footnote the discrepancy rather than silently picking one.

### Motion
CSS only (no GSAP dependency): `.rise` on entry (once), 150–300ms interaction transitions, plus native CSS
scroll-driven reveals (`animation-timeline: view()`) inside `@supports` for section entrances on Home. Global
reduced-motion reset in tokens.css covers every file.


### v2.2 rule changes (round-2 brief critic)
- **Ranked block is contiguous.** Ranks 1–6 are never interleaved with reference rows. Layout: ceiling (hvg_logreg,
  dashed) pinned above; ranked 1–6 block; then a separate "Reference rows" group (CaSee, expr_threshold,
  random_baseline) below, each also drawn as a thin vertical reference mark on the shared AP axis so readers see where
  it falls.
- **No "best value" signal dot** on any ranked number. The signal colour is the rare-cell motif only.
- **No all-10 rank numbers anywhere** except the single chart explicitly titled "Within-unit rank, all 10 methods
  (Figure 4b)". Track A vs B and CNV-sensitivity views show AP or rank *shifts* without 1–10 positions, or use that
  exact title. Never the word "tie"/"ties".
- **Art on mobile too.** Interior headers show their art on every width (a short band on phones).
- **Figures page shows only the six published figures.** Pipeline PNGs contradict the proof in places, so they are
  removed from the site.
- **Reference methods are marked by shape.** hvg_logreg, CaSee, expr_threshold and random_baseline always use the
  dashed `MethodDot` / `CIBar` mark, so a reference can never be mistaken for a ranked detector even where hues are
  close (CaSee brown vs scMalignantFinder ochre).
