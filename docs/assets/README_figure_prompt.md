# README Architecture Figure - Generation Prompt

This document contains the prompt used to generate the architecture figure assets.

## Master Spec Prompt

> Generate a clean, publication-quality schematic diagram of the REACH Benchmark 12-phase pipeline. The diagram should be a left-to-right flowchart with the following structure:
>
> **Left column (Phases 0-3):**
> - Phase 0: Environment Setup (gear icon)
> - Phase 1: Dataset Ingestion (download icon) → outputs `configs/datasets.yaml`
> - Phase 2: Preprocessing (wrench icon) → outputs `data/processed/*.h5ad`
> - Phase 3: Validation & Tier Assignment (shield icon) → outputs `data/validation/*_tier_assignments.parquet`
>
> **Middle column (Phases 4-10):**
> - From Phase 3, five parallel arrows branch to Tracks A-E.
> - Track A: Controlled Real Spike-ins (primary, bold border)
> - Track B: Synthetic Splatter Stress-Test (secondary, dashed border)
> - Track C: Null Controls (diagnostic, dotted border)
> - Track D: Natural Blood/CTC Prevalence (primary, bold border)
> - Track E: Noisy-Label Robustness (primary, bold border)
> - All tracks feed into Phase 9: Method Wrappers (puzzle-piece icon)
> - Phase 10: Prediction Execution (play icon) → outputs `results/*/*/predictions.csv`
>
> **Right column (Phases 11-12):**
> - Phase 11: Evaluation & Statistics (chart icon) → outputs `data/results/all_metrics.parquet` and `leaderboard.csv`
> - Phase 12: Figure Generation (image icon) → outputs `data/results/figures/*.pdf`
>
> **Design requirements:**
> - Use a light grey background.
> - Primary tracks (A, D, E) in blue tones; secondary (B) in green; diagnostic (C) in orange.
> - Phase 11-12 in purple tones.
> - Data store files shown as cylindrical database icons at the bottom.
> - Arrows should be thick, dark grey, with directional arrowheads.
> - Include a small legend: "Primary track | Secondary track | Diagnostic track".
> - Output as vector SVG and high-resolution PNG (300 dpi).

## Rendering Instructions

To regenerate the figure from this prompt:

1. **Mermaid (programmatic):**
   ```bash
   bash scripts/render_mermaid.sh docs/assets/architecture.mmd docs/assets/architecture.svg
   ```
   This requires `mmdc` (Mermaid CLI) or `npx @mermaid-js/mermaid-cli`.

2. **AI image generation:**
   Paste the master spec prompt above into DALL-E 3, Midjourney, or Stable Diffusion with `--ar 16:9`.

3. **Manual (Inkscape / Illustrator):**
   Use the Mermaid diagram in `architecture.mmd` as a structural guide, then apply the colour and icon specifications from the prompt.

## Placeholder Note

If `architecture.svg` and `architecture.png` need to be refreshed, regenerate them using one of the methods above and keep the rendered files small.
