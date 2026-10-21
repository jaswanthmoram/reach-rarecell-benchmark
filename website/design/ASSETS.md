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

## Round 8: 3D icons

Source: Microsoft Fluent Emoji, 3D style, https://github.com/microsoft/fluentui-emoji (fetched 2026-10-20 from
`raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/<Name>/3D/<name>_3d.png`, 256x256 RGBA PNG).
Licence: **MIT**, Copyright (c) Microsoft Corporation. Keep this notice with the files (MIT asks for the copyright
and permission notice in copies; a credit line "Fluent Emoji 3D (MIT, Microsoft)" in the repo README covers it).
No attribution link is required on the page.

Encode: `cwebp -q 85 -alpha_q 100 -exact` (alpha kept), 256 px master and `-resize 128 128`. Total 120 KB for 22 files.
Component: `src/ui/Icon3D.tsx` (`<Icon3D name="microscope" size={56} />`, srcset 128w/256w, lazy, decorative alt="").
Use at hero, empty-state and use-case-card spots only (48-96 px); never in nav, tables or buttons.

| Name (`public/icons3d/<name>-128.webp`, `-256.webp`) | Fluent source | Intended use |
|---|---|---|
| `microscope` | Microscope | Cells, datasets, detection |
| `dna` | Dna | Expression, cohorts |
| `test-tube` | Test tube | Spike-in tracks, experiments |
| `bar-chart` | Bar chart | Results, leaderboard |
| `bullseye` | Bullseye | Accuracy, ranking without trophies |
| `straight-ruler` | Straight ruler | Measured metrics, methods |
| `card-file-box` | Card file box | Dataset catalogue |
| `open-book` | Open book | Article, docs |
| `laptop` | Laptop | Reproduce, terminal |
| `memo` | Memo | Cite |
| `busts-in-silhouette` | Busts in silhouette | Use cases (no skin-tone variant needed) |

## Round 8: app icon and PWA files

Rendered from the mark geometry in `public/favicon.svg` (3x3 plate, vermilion centre, cobalt reticle) with Pillow,
8x supersampled: `scratchpad/r8/foundation/make_icons.py`. Graphite dots on a `#FAFAFA` tile, so vermilion stays the
rare-cell colour and never becomes a brand fill.

| File | Size | Notes |
|---|---|---|
| `favicon.ico` | 32 + 16 | 16 px frame drops the reticle (research r8, section 5) |
| `favicon.svg` | vector | unchanged, has its own dark-scheme block |
| `apple-touch-icon.png` | 180 | opaque #FAFAFA, about 20 px padding |
| `icon-192.png`, `icon-512.png` | 192, 512 | `purpose: any`, rounded #FAFAFA tile, transparent corners |
| `icon-maskable-512.png` | 512 | full bleed; farthest ink 193 px from centre, inside the 204.8 px safe circle |
| `site.webmanifest` | | relative `src`, `start_url`/`scope` "./", name "REACH Benchmark", theme/background #FAFAFA |

Linked from `index.html` with `%BASE_URL%` so they resolve under `/reach-rarecell-benchmark/`.

## Round 8: hero motion

Generated with ElevenLabs Creative (flow `7w1o9l1f38jRlNaUfakQ`), model **Veo 3.1** (`veo-3.1-generate-001`, 8 s,
16:9, 720p; chosen over the Seedance default because its guide flags weak results on abstract prompts). 2 attempts,
31,999 credits each (about USD 3.84 each, 63,997 credits in all).

| Attempt | Prompt (short) | Verdict |
|---|---|---|
| 1 `h8jLmwWI6xKMdGLD6fvV` | Flat top-down macro field of graphite dots (#4A5160) on #FAFAFA, a few vermilion (#FF5A1F) rare cells, a thin cobalt (#2F5BEA) ring glides in and locks onto one, slow push-in, flat, shadowless, no text | **Kept, first 3.4 s only.** Frames 0-80 are flat and on-lane; the ring reaches and locks onto a vermilion cell by frame 80. After about frame 85 the model added a black microscope vignette and the ring jumps scale: off-brand, discarded. Ring came out navy and thick, background #F5F5F5. |
| 2 `5YmJNTluQENSyFoL7Yry` | Same idea, uniform bright paper background, hairline ring, tiny dots | **Rejected.** Halftone moiré grid with motion-blurred smudges and vermilion dots in a rigid lattice; reads as a print pattern, not cells. Ring lock was clean but the field is off-brand. |

Post-processing (`scratchpad/r8/hero/tools/grade.py`, Pillow + NumPy): flat-field correction (max-filtered, blurred
background divided out, removes the vignette onset), then each pixel mapped to the site tokens by hue class:
neutrals to the #FAFAFA to #4A5160 ramp, blues to #2F5BEA, reds to #FF5A1F. Output looked at frame by frame.

| File | Notes |
|---|---|
| `public/images/hero/frames/f-001..064.webp` | 64 frames sampled evenly from graded frames 0-80, 1280 x 720, cwebp q70, 2.4 MB total. Desktop canvas sequence: load intro plays the first 55%, scroll scrubs the rest to the lock. |
| `public/images/hero/poster-start.webp` | Frame 0, q80, 64 KB. First paint on desktop and phones (`fetchpriority="high"`); identical to sequence frame 1, so the canvas takes over without a jump. |
| `public/images/hero/poster.webp` | Frame 80 (ring locked), q80, 26 KB. Static frame under reduced motion and "Pause motion". |
| `public/video/hero/hero-loop.webm` / `.mp4` | Phones: frames 0-80 played forward then back (ping-pong, seamless), 960 x 540, 6.7 s, no audio. VP9 crf 50 718 KB; H.264 crf 26 faststart 630 KB. Plays muted only while on screen. |

The stage caption says "Illustration": the clip is not per-cell output.

## Round 11: hero v2

Colour UMAP hero on an almost white canvas, to the owner's reference: cobalt/royal blue clusters with near-black navy
cores, two violet clusters, grey-blue diffuse clusters, a branching stream with buds at the lower centre, pale-blue
hairline density contours, faint dotted connectors, one vermilion rare cell with a soft pale-orange halo and a dashed
ring, a dotted orange path of 4 smaller orange dots. Weight in the right 65%, left 30% calm. Light only (no dark pair yet).

Tool: Higgsfield `gpt_image_2_5` sunburst, high, 2k. 2 generations (cap 3), 5.5 credits (1119.35 to 1113.85).
Finishing (`$SCRATCH/r11/scripts/finish.py`, `python3 -I`, PIL + NumPy): cover-crop, canvas shifted to `#F8F9FC`
with a distance-weighted offset (colours untouched), pixels within 3 levels snapped to the exact canvas, Lanczos
resize, `cwebp -q 84 -sharp_yuv`. Decoded canvas reads `#F8FAFB` (1-level YUV drift, invisible).

| File | Size | Job | Prompt (short) | Verdict |
|---|---|---|---|---|
| `home-hero-v2-light.webp` | 1920x1080, 218 KB | `74d76c0a-2737-4e38-be5e-3f272463fb03` (2688x1520, crop 4 px top/bottom) | "UMAP-style single-cell embedding, thousands of tiny crisp flat round dots on #F8F9FC; weight in right 65%, left 30% nearly empty; main cobalt cluster (#1F45C7/#2F5BEA/#5B7CFA) with navy core, second cobalt cluster far right, two violet clusters (#6D4AE0 to #8A5CF6), 3-4 grey-blue diffuse clusters, branching stream with buds at lower centre-right; 1px pale-blue density contours; faint dotted connectors; exactly ONE vermilion #FF5A1F rare cell with pale-orange halo and dashed orange ring, dotted orange path with 4-5 small orange dots; soft out-of-focus pale discs; no text, no 3D, no glow" | Accept, first try. Crisp separated dots at full size, no text, left third calm. Minor: violets lean electric (about #5A2BE0 in the cores) |
| `home-hero-v2-portrait-light.webp` | 1080x1350 (4:5), 156 KB | `51c7fc7c-7c2f-4936-99d9-b9042ac4f809` (1792x2240, edit with the 16:9 job as `image_references`) | "Recompose the reference as 4:5: same style; all clusters in the upper-right two thirds, stream and buds below the main cluster ending at about 65% height; rare cell at the upper-left edge of the main cluster, orange path up-left; lower-left third calm" | Accept. Its own composition, not a crop (a crop of the 16:9 would put a bud in the lower left). Clusters end at about 70% height; lower-left calm |

Positions in `home-hero-v2-light.webp` (% of width, % of height), measured from pixel masks of the final file:
rare cell 46.2 / 23.2 (887, 251 px); main blue cluster centre 56.9 / 33.8 (navy core 55.8 / 35.1); violet clusters
upper 83.5 / 16.0 and lower 89.3 / 51.2; branching stream fork 60.5 / 63.9, stream with its 3 buds 59.1 / 79.3.

## Round 11: hero v3

Combines the owner's two reference mockups: reference A's dense UMAP (sky blue to cobalt to navy main cluster, dashed
elliptical contour with a cobalt ring marker, out-of-focus pale discs) with reference B's layout (hexagonal dot
texture with a pale-blue outline contour, separate navy cluster upper-left, violet crescent on the right, branching
stream with round buds, vermilion rare cell near the top centre with a dashed orange path down to the left cluster).
Weight in the right 62%, left 35% calm (0.07% non-canvas pixels). Light only.

Tool: Higgsfield `gpt_image_2_5` sunburst, high, 2k. 2 generations (cap 3), 5.5 credits (1113.85 to 1108.35).
Finishing (`$SCRATCH/r11v3/scripts/finish_v3.py`, `python3 -I`, PIL + NumPy): the v2 pipeline (cover-crop, canvas
shifted to `#F7F8FC` with a distance-weighted offset, pixels within 3 levels snapped, Lanczos) plus a violet soften:
pixels with hue 250-295 deg keep 85% of their saturation and lift 6% toward white, so the crescent cores sit near
`#9C6BFF` instead of `#8039EF`. Then `cwebp -q 84 -sharp_yuv`.

| File | Size | Job | Prompt (short) | Verdict |
|---|---|---|---|---|
| `home-hero-v3-light.webp` | 1920x1080, 251 KB | `1b40bbc8-a0ed-4712-819b-2550230228f7` (2688x1520, crop 4 px top/bottom; v2 job `74d76c0a` as style-only `image_references`) | "Use the reference ONLY for rendering style, NEW composition; canvas #F7F8FC; weight in right 62%, left 35% only 8-12 faint dots; huge main cluster at 60/42 with crisp hexagonal dot texture, sky blue #8FB8FF left edge to cobalt #2F5BEA to navy #0B1E5B core, 1px pale-blue outline contour; separate navy cluster at 44/30; ONE vermilion #FF5A1F rare cell at 54/13 with soft pink-orange halo and dashed orange ring, dashed orange line curving down-left to the navy cluster; muted violet crescent (#7C4DFF to #9C6BFF) at 86/40; branching stream with 3 buds; oblong cobalt cluster at 82/72 in a dashed ellipse with a bold cobalt ring marker; grey-blue clusters, dotted cobalt marker path; out-of-focus lavender discs lower right; flat, no glow except the halo, no text/UI/logos" | Accept, first try. Crisp separate dots at full size, no text, left calm, every requested element present. Violets came out slightly electric in the cores; softened in finishing |
| `home-hero-v3-portrait-light.webp` | 1080x1350 (4:5), 180 KB | `d1693a5c-2894-4bd0-9c83-5ea6583e4731` (1792x2240, edit with the 16:9 job as `image_references`) | "Recompose the reference as 4:5, same style and elements; all in the upper-right two thirds: rare cell 50/8, main cluster 62/32, crescent at the right edge, dashed-ellipse cluster 82/50, buds end by 66% height right of 40% width; lower-left third calm" | Accept. Own composition, not a crop. Buds end at about 70% height; lower-left calm apart from a few faint dots and soft discs at the lower right |

Positions in `home-hero-v3-light.webp` (% of width / % of height), centroids of pixel masks in the final file:
rare cell 55.6 / 8.8; main cluster centre 56.9 / 41.3 (navy core 59.5 / 43.0); upper-left navy cluster 43.0 / 24.5;
violet crescent 88.5 / 32.6; stream buds 48.9 / 82.3, 61.4 / 90.5, 73.7 / 83.0; dashed-ellipse cluster 86.2 / 73.2
(ring marker at about 89.9 / 66.2).

## Round 12: films (owner-supplied)

| File | Source | Encode | Size | Used on |
|---|---|---|---|---|
| `public/video/reach-overview.mp4` | Owner's 78 s overview film (3824x2160, AAC) | H.264 1920 wide, CRF 26, faststart, AAC 96k | 3.9 MB | Home "REACH in 78 seconds", README |
| `public/video/reach-overview-960.mp4` | same | H.264 960 wide, CRF 27, AAC 80k | 2.1 MB | Home on screens under 768 px |
| `public/video/reach-overview-poster.webp` / `.jpg` | frame at 3 s | cwebp q80 / JPEG | 49 / 102 KB | Home poster, README thumbnail |
| `public/video/reach-anatomy.mp4` | Owner's 8 min film "Anatomy of a benchmark: engineering REACH for scRNA-seq" (1280x720) | H.264 CRF 29, faststart, AAC 80k | 20 MB | Home link, README |
| `public/video/reach-anatomy-poster.jpg` | frame at 60 s | JPEG | 77 KB | README thumbnail |

The 24 s HyperFrames explainer loop (`reach-explainer*`) and its source are retired; the overview film replaces it.
