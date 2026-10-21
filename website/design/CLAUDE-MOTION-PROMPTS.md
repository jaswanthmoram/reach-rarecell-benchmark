# Claude Motion prompts for the REACH website

These are ready to paste into Claude Motion on the account that has it. Every number below is taken from
`src/data/benchmarkData.ts`; do not let the model change them. After each video is generated:

1. In Claude Motion use **Send to → HyperFrames** (or download the MP4) and share the link or put the file in
   `website/public/video/raw/<name>.mp4`.
2. I add the ElevenLabs English voice-over and the music bed from the script below, mix to -16 LUFS (web), make
   captions (`.vtt`), encode mp4 + webm + a 960 px phone version, and embed it on the page.

## Paste this style block at the top of every prompt

> Style: light scientific instrument. Background #FAFAFA, flat, no gradients, no glow, no 3D lighting, no lens flares,
> no stock footage, no people. Cells are small round dots: graphite #4A5160, far dots #8A909C. Rare malignant cells
> are vermilion #FF5A1F and are the only warm colour. Annotations are thin cobalt #2F5BEA hairlines and rings.
> Method colours (marks only, never text): FiRE #2563C9, CellSIUS #0F8C7E, scMalignantFinder #9C5B00, RareQ #8A3FC4,
> scCAD #C2357A, DeepScena #5B6B12. Type: Geist for titles, Geist Mono for labels and numbers, sentence case, UK
> spelling, no em dashes. Motion: calm and precise, strong ease-out, nothing bounces, no flashing. Numbers that are
> statistics (AP, p-values) appear at their final value and never count up. Never call any method "best" or the
> "winner"; never show trophies or medals. hvg_logreg is drawn as a dashed line labelled "supervised ceiling, not
> ranked". 16:9, 1920x1080, 30 fps, safe margins 96 px.

---

## 1. Launch film, "Finding one cell in ten thousand" (60 s, for Home and social)

**Prompt**
> Make a 60-second explainer film for REACH, a benchmark of rare malignant cell detection in single-cell RNA-seq,
> published in Frontiers in Bioinformatics on 19 October 2026. Scenes:
> 1. (0-6 s) Black-on-light title card: "REACH" in Geist, then "Rare-cell Evaluation Across Cancer Heterogeneity".
>    A single vermilion dot pulses once in the centre.
> 2. (6-14 s) The dot pulls back into a field of thousands of graphite cells that separate into 10 soft clusters.
>    Mono label: "10 public cohorts · 359,739 cells".
> 3. (14-22 s) A few vermilion cells are placed into the clusters; most sink out of sight among graphite cells.
>    A tier strip T1 to T4 fills left to right; label "spiked in down to 0.01-0.1%".
> 4. (22-30 s) Four thin cobalt arcs (Source, CNV, Signature, kNN) close around one cell; label "a cell counts as
>    malignant only when four evidence arms agree".
> 5. (30-40 s) Ten method lenses sweep the field one after another; each rings the cells it finds. Label
>    "10 methods · 6 tracks · 1,125 units · 11,250 runs".
> 6. (40-52 s) The field folds into a dot-and-interval chart. Top: a dashed cobalt line "hvg_logreg, supervised
>    ceiling, not ranked, 1.000". Then six rows in method colours with median AP: 1 FiRE 0.313, 2 CellSIUS 0.259,
>    3 scMalignantFinder 0.235, 4 RareQ 0.196, 5 scCAD 0.130, 6 DeepScena 0.018. Intervals overlap.
> 7. (52-60 s) A bracket links FiRE to a grey row "expr_threshold, total UMI baseline": label "not significantly
>    different, BH-FDR 0.836". End card: "Read the benchmark · reach-rarecell-benchmark" and the REACH mark.

**Voice-over (ElevenLabs, English, calm documentary voice, about 140 words)**
> Somewhere in a tumour sample, a few malignant cells hide among tens of thousands of normal ones.
> REACH asks how well today's tools can find them.
> We took ten public cohorts, three hundred and fifty-nine thousand cells,
> and spiked real malignant cells in, down to one in ten thousand.
> A cell only counts as malignant when four independent kinds of evidence agree.
> Then ten methods scored every cell, across six tracks and more than eleven thousand runs.
> The result is sobering. FiRE ranks first by median average precision,
> but it is not significantly better than simply counting molecules per cell.
> Rare cells are still hard to find, and REACH makes that measurable, and reproducible.

**Audio**: soft felt-piano or warm pad, 70-80 bpm, no drums; one quiet tick per ring lock; duck music -8 dB under VO.

---

## 2. Home hero illustration film (10 s, silent, seamless) → `public/video/hero/hero-motion.mp4`

The site already has a slot for this: drop the MP4 at that path and it plays in the hero automatically (muted, looped,
only on screen; the still artwork shows under reduced motion or "Pause motion").

> 10-second seamless loop, 1600x900, 30 fps, no text, no captions, no logo. Match this still exactly in look: a
> UMAP-style embedding of about 40,000 single cells drawn as tiny round dots on a #FAFAFA background. Ten soft
> clusters of different shapes (an arc, a kidney shape, a dense round core, a branching stream with three buds, small
> satellites), graphite #4A5160 with near-black cores where dense and pale #8A909C at the edges; a few large, soft,
> out-of-focus pale dots in the lower right foreground for depth. Keep the left 35% of the frame calm and nearly empty
> (the headline sits next to it on the site); the visual weight lives in the right 65%.
> Motion: the whole embedding breathes very slowly (dots drift a few pixels, clusters keep their shape). Five vermilion
> #FF5A1F rare cells sit inside different clusters. A thin cobalt #2F5BEA ring (1.5 px stroke) glides from cell to cell
> and locks on each in turn: on lock, two faint cobalt density contours draw around that cluster and thin graphite
> nearest-neighbour lines connect the rare cell to 4 neighbours, then fade as the ring moves on. Two of the five rare
> cells are never found (the ring passes them). The last frame must match the first frame exactly.
> Style: flat, no glow, no bloom, no 3D lighting, no gradients in the background, no camera shake, no flashing.
> Easing: slow, strong ease-out on every move; nothing bounces.

Export: MP4 (H.264, under 3 MB) and, if offered, WebM; I will add a phone version.

---

## 3. Leaderboard, "Six ranked, four references" (25 s)

> 25-second motion graphic. Build a forest plot: x axis "Track A AP" 0 to 0.6. A dashed cobalt line at the top,
> "hvg_logreg, supervised ceiling, not ranked". Six rows draw their 95% bootstrap intervals one by one in method
> colours: FiRE, CellSIUS, scMalignantFinder, RareQ, scCAD, DeepScena, with median AP 0.313, 0.259, 0.235, 0.196,
> 0.130, 0.018 printed at the right (never counting up). Three dashed grey reference rows below: CaSee, expr_threshold,
> random_baseline. Then highlight that FiRE's interval overlaps scMalignantFinder's: label "not significantly
> ahead, BH-FDR 0.831".

**VO**: "Six published detectors are ranked by median average precision on Track A. FiRE is highest, but its interval
overlaps scMalignantFinder's, and the difference is not significant."

---

## 4. Tracks, "One question per track" (30 s)

> 30-second motion graphic with six horizontal lanes appearing one after another, each with a short mono label:
> A "controlled real-cell spike-ins, ranked" (vermilion cells placed into graphite tissue);
> B "synthetic Splatter simulations" (a regular lattice of dots);
> C "null controls, no malignant cells" (graphite only, a cobalt false-alarm counter stays near zero);
> D "natural blood and CTC samples" (loose natural clumps);
> E "noisy labels" (dashed rings flicker between cells, then settle);
> F "same-lineage contrast" (two graphite shades close together). Finish with "Track A ranks. B to F stress-test it."

**VO**: "Track A produces the ranking. The other five ask whether that ranking survives simulation, empty samples,
natural blood, noisy labels and same-lineage contrast."

---

## 5. Datasets, "Ten cohorts, one labelling rule" (25 s)

> 25-second motion graphic: ten round specimen wells in a 5 by 2 grid fill with graphite dots at different
> densities; each well gets its cohort id in mono (pdac_peng, crc_lee, bcc_yost, luad_laughney, rcc_multi,
> mm_ledergor, hcc_wei, ov_izar_tirosh, hnscc_puram, breast_ctc_szczerba). Then zoom into one well: four cobalt arm
> chips "Source, CNV, Signature, kNN" light in sequence and one cell turns vermilion: "labelled malignant only when
> all four agree". Total label "359,739 cells".

**VO**: "Ten public cohorts, eight solid tumours and two blood samples. A cell is labelled malignant only when four
independent evidence arms agree."

---

## 6. Methods, "Ten lenses on one field" (25 s)

> 25-second motion graphic: one pale field of cells; ten circular lenses (six in the method colours, four graphite
> with one dashed) glide across and each reveals a different set of vermilion cells. Label "17 candidates audited,
> 10 passed, 6 ranked". End on a log-runtime vs median-AP scatter where dots rise from the axis.

**VO**: "Seventeen candidate methods were audited. Ten passed, six are ranked. Each one sees the same cells
differently, and at a very different cost."

---

## 7. Reproduce, "Twelve gates" (25 s)

> 25-second motion graphic: a stream of graphite cells flows left to right through twelve thin cobalt gates labelled
> Phase 00 to Phase 12 groups (Prep, Tracks, Methods, Exec, Eval) and comes out as ordered rows, with the vermilion
> cells separated into a final column. A mono terminal line types "rcb run-track --track a" then
> "python scripts/reproduce_from_snapshots.py". End: "Every table and figure rebuilds from frozen snapshots".

**VO**: "Twelve phases take raw public data to every table and figure in the paper. Install the package and rebuild
them yourself from the frozen snapshots."

---

## 8. Short social cut-downs (15 s each, 9:16 1080x1920)

Re-cut scenes 2-3, 6 and 7 of the launch film with the same VO lines, captions burned in, safe margins 160 px top and
bottom.

## What I need back from you

- The MP4s (or the HyperFrames links from Send to).
- Which ElevenLabs voice you like (or let me pick a calm British or neutral English voice), and whether you want
  music at all on the website versions (I suggest muted autoplay with an unmute button on Home, music only on the
  launch film).
