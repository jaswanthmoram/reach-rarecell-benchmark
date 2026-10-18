# REACH v2 — Asset register

Art direction: "Lab instrument". Flat dot-field data art. Graphite dots, one signal colour for rare cells,
cobalt hairline annotations. No text, no 3D, no glow, no stock photos. Every artwork ships as a light and a
dark file with matching composition (the dark file is an image edit of the light one).

| Theme | Background | Dots | Signal | Accent |
|---|---|---|---|---|
| light (`*-light.webp`) | `#FAFAFA` exact | `#4A5160` / far `#8A909C` | `#FF5A1F` | `#2F5BEA` |
| dark (`*-dark.webp`) | `#0B0D11` exact | `#A7ADB8` / far `#6C7380` | `#FF7A45` | `#7B96FF` |

Post-processing for every file (`python3 -I`, PIL): near-background pixels snapped to the exact canvas colour
(this also removes the faint halo the model leaves around dots), Lanczos resize, `cwebp -sharp_yuv -q 82`.
`-sharp_yuv` keeps the flat background at the exact token value after YUV conversion. All files < 150 KB.

## Images (`public/images/`)

| File | Size | Tool / model | Prompt (short) | Verdict |
|---|---|---|---|---|
| `home-hero-light.webp` | 1600×905, 97 KB | Higgsfield `gpt_image_2_5` sunburst, high, 2k | UMAP-style landscape, 11 clusters (arc, kidney, bridge, satellites, dense core); depth from dot size/density only; weight right, calm left third; 7 vermilion rare cells, 3 with fine cobalt rings and leader lines | Accept. Round, separated dots; left third calm |
| `home-hero-dark.webp` | 1600×905, 104 KB | Higgsfield `gpt_image_2_5` edit of the light job | "Recolour this exact image for a dark theme…" token mapping above | Accept. Dot positions match the light file at full size |
| `home-hero-portrait-light.webp` | 960×1200 (4:5), 91 KB | Higgsfield `gpt_image_2_5` sunburst, high, 2k | The same landscape recomposed for portrait: weight on the lower two thirds, calm top third | Accept. Its own composition, not a crop (a crop of the 16:9 lost the rare-cell cluster) |
| `home-hero-portrait-dark.webp` | 960×1200, 94 KB | Higgsfield edit of the portrait job | Recolour mapping | Accept. Matches |
| `leaderboard-light.webp` | 1600×905, 31 KB | Higgsfield `gpt_image_2_5` sunburst, high, 2k | 12 overlapping dot-whisker interval rows, larger mean dots drifting left, top mean vermilion, dashed cobalt ceiling line, faint dot gridlines | Accept. Intervals overlap (no single winner) |
| `leaderboard-dark.webp` | 1600×905, 30 KB | Higgsfield edit | Recolour mapping, gridlines to `#343A45` | Accept |
| `methods-light.webp` | 1600×905, 65 KB | Higgsfield `gpt_image_2_5` sunburst, high, 2k | 5×2 specimen grid of 10 distinct dot glyphs (rings, holed grid, spiral, burst, lens, tree, lattice, crescent, honeycomb, waves); 1–2 vermilion dots each; 3 cobalt rings | Accept. All 10 distinct, same weight |
| `methods-dark.webp` | 1600×905, 63 KB | Higgsfield edit | Recolour mapping | Accept |
| `docs-light.webp` | 1600×900, 57 KB | Higgsfield `gpt_image_2_5` sunburst, high, 2k + PIL fix | Dot cloud on the left narrowing through 12 cobalt stage boxes into ordered rows; vermilion dots gathered in the last stage | Accept after fix. The model drew 13 boxes twice; the 12th box column was cut out in PIL (seamless at full size) to give exactly 12 stages |
| `docs-dark.webp` | 1600×900, 55 KB | Higgsfield edit of the fixed light file (uploaded) | Recolour mapping, "exactly twelve stage boxes" | Accept. 12 stages |
| `figures-light.webp` | 1280×720, 32 KB | ElevenLabs `gpt-image-2.5-sunburst` | 4×3 contact sheet of dot-chart thumbnails (heatmaps, forest plots, scatters, dot columns); a few vermilion dots, two cobalt trend lines | Accept |
| `figures-dark.webp` | 1280×720, 29 KB | ElevenLabs `gemini-3-pro-image` edit (`connect_from` the light node) | Recolour mapping, tile outlines `#23272F` | Accept. Background came back `#030509`; snapped to `#0B0D11`. Note: heatmap cores render dimmer than their rims in dark (light: darker core) |
| `cite-light.webp` | 720×720 (1:1), 24 KB | ElevenLabs `gpt-image-2.5-sunburst` | One vermilion cell, 7 concentric cobalt rings (inner solid, outer dashed/dotted), a few graphite dots on the rings | Accept. Model returned 16:9; centre-cropped to 1:1 with no element cut |
| `cite-dark.webp` | 720×720, 21 KB | ElevenLabs `gemini-3-pro-image` edit | Recolour mapping | Accept |
| `tracks-lanes-light.webp` | 1344×752, 22 KB | Existing file (renamed from `tracks-lanes.webp`) | — | Background snapped from `#F9F9F9` to `#FAFAFA`; otherwise unchanged |
| `tracks-lanes-dark.webp` | 1344×752, 27 KB | Higgsfield `gpt_image_2_5` edit of the uploaded light file | Recolour mapping, lane dividers `#23272F`, "remove faint smudges" | Accept. The light original's blurry ghost dots are gone in dark |
| `datasets-fields-light.webp` | 1280×720, 61 KB | Existing file (renamed from `datasets-fields.webp`) | — | Background snapped to `#FAFAFA`; otherwise unchanged |
| `datasets-fields-dark.webp` | 1280×720, 74 KB | Higgsfield edit of the uploaded light file | Recolour mapping, circle outlines `#343A45` | Accept |

Untouched: `hero-cells.webp` (old hero, still referenced by `Home.tsx`), `og.png`.

### Generation log
20 generations in total (cap was 30).
- Higgsfield: 4 × `gpt_image_2_5` flare/low/1k (hero, leaderboard, methods, docs, v1). All **rejected**:
  the dots were muddy, irregular blobs at full size and docs had 13 stages. Then 5 × sunburst/high/2k (v2,
  accepted) and 7 dark edits. About 34 Higgsfield credits spent.
- ElevenLabs: 2 × `gpt-image-2.5-sunburst` (figures, cite) and 2 × `gemini-3-pro-image` dark edits, about
  6,660 ElevenLabs credits (each Gemini edit cost about 3,015, ten times a sunburst generation).
- Masters and intermediates: `$SCRATCH/gen2/` (`*-v1/v2/v3.png`, `final_*.png`). Scripts: `$SCRATCH/scripts/finalize.py`
  and `$SCRATCH/scripts/sprite.py`.

## Cohort icons (`public/icons-cohorts.svg`)

Family: **Material Symbols Outlined** (Google), weight 400, grade 0, 24 dp, from the official Google Fonts CDN.
I found the family with Supericons. **Licence: Apache License 2.0**, free for commercial use; keep the attribution
in the sprite comment. Every shape is `fill="currentColor"` with `viewBox="0 -960 960 960"`. Symbol ids are `cohort-<datasetId>`.

Icons8 was tried first (iOS line style covers lungs, kidney, liver, colon, uterus and skin), but `get_icon_svg` refused
because the account has no Icons8 MCP API access, so no Icons8 SVG could be fetched. Phosphor (the site's UI family)
and the other Supericons libraries have no organ set. So the cohort sprite is its own single family, kept apart from the
Phosphor UI sprite `public/icons.svg`.

| Cohort (`id`) | Cancer / tissue | Symbol | Reads as | Fit |
|---|---|---|---|---|
| `hnscc_puram` | Head & neck SCC | `ent` | head profile, ear-nose-throat | good |
| `ov_izar_tirosh` | Ovarian (ascites) | `gynecology` | uterus with both ovaries | good |
| `hcc_wei` | Hepatocellular carcinoma | `oncology` | GI tract with a tumour lens | **proxy**, no liver glyph exists in the family |
| `luad_laughney` | Lung adenocarcinoma | `pulmonology` | lungs | good |
| `rcc_multi` | Renal cell carcinoma | `nephrology` | kidneys | good |
| `pdac_peng` | Pancreatic ductal adenocarcinoma | `endocrinology` | endocrine gland | **proxy**, no pancreas glyph exists in any library searched |
| `crc_lee` | Colorectal carcinoma | `gastroenterology` | GI tract and intestine | acceptable |
| `bcc_yost` | Basal cell carcinoma (skin) | `dermatology` | skin layers | good |
| `mm_ledergor` | Multiple myeloma (bone marrow) | `orthopedics` | bone / spine | acceptable (marrow lives in bone) |
| `breast_ctc_szczerba` | Breast CTCs (blood) | `hematology` | blood cells | acceptable (shows the liquid-biopsy origin, not the breast) |

Usage: `<svg class="size-5" aria-hidden="true"><use href="/icons-cohorts.svg#cohort-luad_laughney"/></svg>`.

## Needs a human decision
1. The liver (`hcc_wei`) and pancreas (`pdac_peng`) icons are proxies. Accept them, or commission two custom
   glyphs drawn on Material's 960 grid at weight 400.
2. Code still points at the old names: `src/pages/Home.tsx:222` (`tracks-lanes.webp`), `src/pages/Tracks.tsx:316`
   (`images/tracks-lanes`), `src/pages/Datasets.tsx:331` (`images/datasets-fields`), and `Home.tsx:125` (old `hero-cells.webp`).
   These must switch to the `-light` / `-dark` pair, for example `<picture>` with `prefers-color-scheme` plus the `data-theme`
   override. The new 16:9 files are 1600×905 or 1600×900, not 1344×752, so the `width`/`height` attributes change too.

## Cohort icons, round 3 (replaces the Material Symbols set)
Source: Health Icons (healthicons.org, MIT), outline set, fetched via the Iconify API. One family, real organ for every
cohort, no stand-ins. Old sprite archived at `_archive/v1/public/icons-cohorts-material.svg`.

| Cohort | Glyph |
|---|---|
| hnscc_puram | ears-nose-and-throat-outline |
| ov_izar_tirosh | female-reproductive-system-outline |
| hcc_wei | liver-outline |
| luad_laughney | lungs-outline |
| rcc_multi | kidneys-outline |
| pdac_peng | pancreas-outline |
| crc_lee | colon-outline |
| bcc_yost | skin-cancer-outline |
| mm_ledergor | blood-cells-outline |
| breast_ctc_szczerba | breasts-outline |

## Round 3 heroes (user: "hero image also not nice, redesign all hero sections in all pages")

One family, one per page. Graphite/ink dot fields with real density (near-black cores), depth from dot size and a few
soft out-of-focus discs, one vermilion signal for rare cells, cobalt hairline annotation, method colours only where a
piece shows methods. Weight in the right 55%, left 45% calm. Light originals: Higgsfield `gpt_image_2_5` sunburst, high,
2k (2688x1520). Dark files are a deterministic tonal edit of the finished light file (`$SCRATCH/scripts/gen3_dark.py`):
luminance inverted on the token axis, chroma kept, signal/accent nudged to `#FF7A45`/`#7B96FF`, canvas snapped to
`#0B0D11`. Every dot sits exactly where it is in the light file. Encode: `cwebp -q 84 -sharp_yuv`.
Light finishing: `$SCRATCH/scripts/gen3_light.py` (cover-crop, snap canvas to `#FAFAFA`, fixes listed below).

| File (light / dark) | Size | Prompt (short) | Tool | Verdict |
|---|---|---|---|---|
| `home-hero-light/-dark.webp` | 1600x900, 145 / 132 KB | UMAP of ~40k cells, 10 cohort clusters (arc, kidney, dense core, branching stream, satellites), cobalt density contours, 3 vermilion rare cells found (rings + kNN edges), 2 hidden, bokeh foreground lower right | Higgsfield (candidate A of 2) | Accept. Candidate B (one giant cluster, macro view) rejected: reads as one population, not 10 cohorts |
| `home-hero-portrait-light/-dark.webp` | 960x1200, 142 / 126 KB | Same embedding recomposed for 4:5, calm top 35% | Higgsfield | Accept after fix: brown glow around 2 hidden rare cells neutralised; one washed-out orange dot repainted to signal |
| `leaderboard-hero-light/-dark.webp` | 1600x900, 68 / 59 KB | 6 dotted-capsule interval rows in the 6 method colours, means stepping left, overlapping, dashed cobalt ceiling, soft cell field with a few vermilion cells at right | Higgsfield (candidate B of 2) | Accept. Candidate A (bare bootstrap rows) cleaner but flatter, and violet drifted to lilac |
| `tracks-hero-light/-dark.webp` | 1600x900, 85 / 78 KB | 6 lanes: spike-in cluster, lattice, null field, natural clumps, dashed-ring label noise, lineage curve | Higgsfield | Accept |
| `datasets-hero-light/-dark.webp` | 1600x900, 61 / 55 KB | 10 specimen wells, each a distinct texture, 1-3 rare cells each, one cobalt-ringed | Higgsfield | Accept after fix: wells started at 30% width, frame shrunk to 0.76 about the right edge so they sit in the right 55% |
| `methods-hero-light/-dark.webp` | 1600x900, 111 / 93 KB | 10 detector lenses over one pale field (6 method-colour rings + 4 graphite, one dashed), each revealing different rare cells | Higgsfield (v2) | v1 **rejected**: blurred bubble dots, merged half-orange blobs, blue ring used twice. v2 accept; two dull red dots neutralised |
| `figures-hero-light/-dark.webp` | 1600x900, 42 / 37 KB | 3x3 contact sheet: dot heatmap, CD diagram, scatter with vermilion cluster, strip plot, cobalt contours, mini UMAP, forest plot, triangle matrix, lollipop | Higgsfield | Accept after fix: shrunk to 0.90 about the right edge (tiles started at 40%) |
| `docs-hero-light/-dark.webp` | 1600x900, 54 / 49 KB | Cell cloud flowing through 12 cobalt gates into ordered rows, rare cells separated into a final column | Higgsfield | Accept after fix: model drew 13 gates again; the 12th-13th segment was cut out and the frame padded left (seamless) |
| `cite-hero-light/-dark.webp` | 1200x1200, 34 / 33 KB | One vermilion cell, 7 concentric cobalt rings (2 solid, 3 dashed, 2 dotted), graphite cells on rings | Higgsfield | Accept. Minor: the two dotted outer rings fade in short arcs at the lower right |
| `system-hero-light/-dark.webp` | 1600x900, 94 / 86 KB | 4x3 specimen board of dot densities and sizes; one rare-cell swatch, one cobalt-ring swatch, one method-colour row | Higgsfield | Accept after fixes: brown (CaSee) dot repainted violet so the row is the 6 ranked detectors; shrunk to 0.88. Minor: a few smudged dots in the densest swatch |
| `use-cases-hero-light/-dark.webp` | 1600x900, 39 / 32 KB | Three dotted paths fanning from one origin: cobalt path to a ringed rare cell, one into a dense cluster, one to an ordered grid | Higgsfield | Accept |

### Round 3 log
14 generations (cap 40): 13 light originals + 1 methods regeneration, all Higgsfield `gpt_image_2_5` sunburst/high/2k.
0 ElevenLabs credits: the dark files were made as a pixel-exact tonal edit instead of model edits (last round's Gemini
edit returned a wrong canvas and dimmed heatmap cores). Masters in `$SCRATCH/gen3/` (`*-v1/v2.png`, `final/*.png`).

### Needs a human decision (round 3)
1. New names `<page>-hero-light/-dark.webp` (`leaderboard-hero`, `tracks-hero`, `datasets-hero`, `methods-hero`,
   `figures-hero`, `docs-hero`, `cite-hero`, `system-hero`, `use-cases-hero`) are not wired yet. Round 2 files
   (`leaderboard-light.webp`, `methods-light.webp`, `cite-light.webp`, etc.) are untouched and still referenced.
   `home-hero-*` and `home-hero-portrait-*` were overwritten in place. Cite is now 1200x1200 (was 720x720).
2. Dark variants are a deterministic recolour, not a model edit. If a model-drawn dark set is wanted, it costs 11 edits.
