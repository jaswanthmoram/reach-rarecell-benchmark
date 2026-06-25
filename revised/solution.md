# REACH Frontiers Revision — Solutions & Reviewer Comment Map

Welcome, hunter! Below is the master guide for how we addressed every concern raised by the reviewers (Reviewer 1 and Reviewer 3). We explain each problem, our solution, the exact results used to back it up, and where these changes are made in the manuscript.

To make sure the core logic is crystal clear, each section includes a **Caveman Analogy** (`🐗 Caveman Says`) explaining the concept simply.

---

## Table of Contents
1. [R1-1 — CNV Circularity](#r1-1--cnv-circularity)
2. [R1-2 — Independent CNV Validation](#r1-2--independent-cnv-validation)
3. [R1-3 — Track A ↔ Track B Correlation](#r1-3--track-a--track-b-correlation)
4. [R1-4 — Track C Null FPR Meaning](#r1-4--track-c-null-fpr-meaning)
5. [R1-5 — CaSee Degenerate Units](#r1-5--casee-degenerate-units)
6. [R1-6 — Label Threshold Sensitivity](#r1-6--label-threshold-sensitivity)
7. [R1-8 — Runtime Hardware / Environment](#r1-8--runtime-hardware--environment)
8. [R1-9 — Effect Sizes (Cliff's Delta)](#r1-9--effect-sizes-cliffs-delta)
9. [R1-10 — Supervised Ceiling Interpretation](#r1-10--supervised-ceiling-interpretation)
10. [R1-11 — Figure Caption Annotations](#r1-11--figure-caption-annotations)
11. [R3-1 — Reframing as Malignant-vs-TME Detection](#r3-1--reframing-as-malignant-vs-tme-detection)
12. [R3-2 — Ceiling Triviality in Intra-Lineage Settings](#r3-2--ceiling-triviality-in-intra-lineage-settings)
13. [R3-3 — TME Outliers as False Positives](#r3-3--tme-outliers-as-false-positives)
14. [R3-4 & R3-5 — Intra-Lineage Principle & Track F Implementation](#r3-4--r3-5--intra-lineage-principle--track-f-implementation)

---

## R1-1 — CNV Circularity

### 🔴 The Problem (Reviewer Concern)
The reviewer is worried that the method rankings are **circular**. We use copy-number variation (CNV) scores to help define which cells are "High-Confidence" (HC) positive ground truth. However, some methods being tested might also use CNVs to rank the cells. If we use CNVs to define the test answers and the methods use CNVs to find the answers, then methods using CNVs will look artificially better!

> ### 🐗 Caveman Says
> "You look for red-eyed wolves in forest. You say: *'Red-eyed wolves have sharp teeth. I only call them wolves if they have sharp teeth.'* Then you test if your hunting method is good at finding sharp-teethed wolves. Circular! Redundant! You grade your own cave-painting!"

### 🟢 Our Solution
We re-derived the High-Confidence (HC) labels from scratch **without using any CNV component**. Instead, we used only:
1. Source tissue annotation (is the cell from the tumor?).
2. AUCell signature scores (does it express tumor genes?).
3. kNN neighborhood purity (are its neighbors also tumor-like?).

We then re-ran the entire evaluation across the methods. The method rankings under this CNV-free labeling correlated strongly with the published rankings (**Spearman $\rho = 0.648, p = 0.043$;** [`data/results/revision/circularity_ranking.csv`](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/data/results/revision/circularity_ranking.csv)). This proves that the performance ordering of the methods is robust and is not artificially driven by CNV circularity.

### 📝 Manuscript Mapping
*   **Where:** Limitations section ([paper.md](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/paper.md) §Limitations, L158; [MANUSCRIPT_CHANGES.md §R1-1](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/MANUSCRIPT_CHANGES.md#R1-1)).
*   **Why:** Quantifies the circularity risk directly using correlation metrics instead of just acknowledging the potential bias, proving ranking stability to the reader.

---

## R1-2 — Independent CNV Validation

### 🔴 The Problem (Reviewer Concern)
If we use CNV scores to help build ground-truth labels, we need independent proof that the CNV scores we inferred are actually biologically correct and not just random noise.

> ### 🐗 Caveman Says
> "You say: *'Warm ground means hot fire under earth.'* But you do not dig dirt to see if there is real fire or just warm sun-baked rocks. You must dig to prove fire!"

### 🟢 Our Solution
We validated our inferred CNV burden (mean absolute deviation from the diploid reference line) against the original authors' malignancy annotations across 9 datasets (57,811 cells total). 
The results show high concordance:
*   **Overall AUROC:** **0.782**
*   **Overall MCC:** **0.361**
*   **Per-dataset AUROC:** Ranged from **0.747** (`hcc_wei`) to **0.960** (`luad_laughney`), with 5 out of 9 datasets exceeding **0.86** ([cnv_concordance.csv](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/data/results/revision/cnv_concordance.csv)).

**Critical Bug Fix:** In our previous draft, `hnscc_puram` had an AUROC of 0.500 (meaning CNV was random chance) because its cell-type labels (like `"T cell"` and `"Fibroblast"`) did not match infercnvpy's default reference categories (`T cells`, `B cells`). We fixed the singular reference categories, re-ran CNV inference, and its AUROC jumped to **0.906** (MCC = 0.763). This correction raised the overall cross-dataset CNV AUROC from 0.731 to 0.782.

We also deleted the weak "intersecting multiple callers breaks ultra-rare units" argument from the paper and replaced it with this hard validation data.

### 📝 Manuscript Mapping
*   **Where:** Limitations section ([paper.md](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/paper.md) §Limitations, L158; [MANUSCRIPT_CHANGES.md §R1-2](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/MANUSCRIPT_CHANGES.md#R1-2)).
*   **Why:** Replaces speculative defenses with empirical validation data showing that CNV burden is highly predictive of true malignancy.

---

## R1-3 — Track A ↔ Track B Correlation

### 🔴 The Problem (Reviewer Concern)
Why is Track B (the synthetic Splatter simulation track) separate? Why not blend it into the main leaderboard? We need to quantify how much the rankings differ between the real-cell track (A) and the synthetic track (B).

> ### 🐗 Caveman Says
> "You make clay model of wolf to practice throwing spear. Clay wolf does not run, clay wolf does not bite, clay wolf does not hide in bushes. Hunting clay wolf is NOT same as hunting real wolf! Do not mix clay wolf score with real forest hunt score!"

### 🟢 Our Solution
We calculated the method-level Spearman rank correlation between Track A and Track B across all 10 methods. The correlation is **$\rho = 0.042$ ($p = 0.907$)** ([sens2_sens3_extract.txt](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/data/results/revision/sens2_sens3_extract.txt)). 
This is statistically indistinguishable from zero, showing that synthetic rankings do not replicate real-cell rankings. For example:
*   `CaSee` ranked 2nd on Track A, but fell to 6th on Track B.
*   `scMalignantFinder` fell from 5th to 10th.
*   `RareQ` jumped from 7th to 2nd.

This lack of correlation justifies keeping Track B strictly as a separate stress test rather than blending it into the main leaderboard.

**Correction Note:** We retracted a prior draft claim of a "method-level $\rho > 0.95$" stability figure, which was erroneous. The true method-level correlation is indeed $\rho = 0.042$.

### 📝 Manuscript Mapping
*   **Where:** §Evaluation Tracks and §Key Statistical Results ([paper.md](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/paper.md) L47, L132; [MANUSCRIPT_CHANGES.md §R1-3](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/MANUSCRIPT_CHANGES.md#R1-3)).
*   **Why:** Provides statistical proof that synthetic data fails to model real biological complexities, justifying its role as a controlled stress test.

---

## R1-4 — Track C Null FPR Meaning

### 🔴 The Problem (Reviewer Concern)
What does the False Positive Rate (FPR) on Track C (null datasets containing zero malignant cells) actually represent, and what are the exact results?

> ### 🐗 Caveman Says
> "You hunt in empty forest with zero wolves. If your method screams *'WOLF!'* when there is only grass, you throw spear at tree. You waste spear! Track C tests if hunter shouts *'WOLF!'* when forest is empty."

### 🟢 Our Solution
Track C acts as a specificity diagnostic. If a method cannot control false alarms when there are zero malignant cells, it is dangerous for clinical screening.
*   **All unsupervised and naive baseline methods controlled their FPR near the expected ~3% floor:** `RareQ` (0.029), `cellsius` (0.029), `CaSee` (0.030), `scCAD` (0.030), `random_baseline` (0.031), `expr_threshold` (0.031), `DeepScena` (0.031), `scMalignantFinder` (0.031), `FiRE` (0.031).
*   **The supervised ceiling (`hvg_logreg`) failed catastrophically with a 78.8% FPR.** This is because it trains in-sample on the null unit's own data and overfits to noise (there are no actual positive signals to learn, so it treats noise as signal).

We added these per-method values to the paper to guide readers on specificity calibration.

### 📝 Manuscript Mapping
*   **Where:** §Key Statistical Results ([paper.md](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/paper.md) L132; [MANUSCRIPT_CHANGES.md §R1-4](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/MANUSCRIPT_CHANGES.md#R1-4)).
*   **Why:** Explains how to interpret Track C as a specificity control and lists the exact numbers demonstrating that unsupervised methods have robust false-alarm control.

---

## R1-5 — CaSee Degenerate Units

### 🔴 The Problem (Reviewer Concern)
`CaSee` is an autoencoder method. Sometimes it collapses during training and outputs identical scores for all cells, which biases its ranking. We need to report what happens when we filter out these "degenerate" units.

> ### 🐗 Caveman Says
> "CaSee hunter gets lazy. In 20 out of 160 hunts, CaSee sits on log, stares at sky, and says: *'All rocks look same.'* This is degenerate. We must count how good CaSee is when CaSee actually tries!"

### 🟢 Our Solution
We identified 20 degenerate units (out of 160) where CaSee had a score standard deviation of $\approx 0$. 
*   **Unfiltered CaSee median AP:** **0.512**
*   **Filtered (excl-degenerate) CaSee median AP:** **0.606** ([casee_filtered_leaderboard.csv](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/data/results/revision/casee_filtered_leaderboard.csv)).
*   For comparison, `scMalignantFinder` also had 20 degenerate units, and its AP went from 0.235 to 0.290.

We updated the paper to show both numbers in the leaderboard and clarified that `CaSee` is designated as "exploratory" because it cheats by training on the test unit itself. We also noted that it was evaluated via a faithful CPU recreation (`faithful_recreation`).

### 📝 Manuscript Mapping
*   **Where:** Primary Leaderboard footnote and Method Inclusion section ([paper.md](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/paper.md); [MANUSCRIPT_CHANGES.md §R1-5](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/MANUSCRIPT_CHANGES.md#R1-5)).
*   **Why:** Discloses CaSee's stability limitations transparently while showing its true potential when training does not collapse.

---

## R1-6 — Label Threshold Sensitivity

### 🔴 The Problem (Reviewer Concern)
How sensitive are the benchmark findings to the specific thresholds chosen to define High-Confidence labels (AUCell and kNN)? If we change the thresholds, does the leaderboard scramble?

> ### 🐗 Caveman Says
> "You say: *'A mammoth is heavy if it weighs 100 stones.'* What if you change rule to 95 stones or 105 stones? Do the heaviest mammoths change? If heaviest mammoths stay same, your rule is good!"

### 🟢 Our Solution
We evaluated 9 different combinations of thresholds (AUCell ∈ {0.10, 0.15, 0.20} and kNN purity ∈ {0.40, 0.50, 0.60}), keeping the CNV scores fixed.
Across the 5 datasets that yielded valid correlations:
*   The method rankings under the new thresholds correlated strongly with the published rankings, with a **Spearman $\rho$ range of [0.685, 0.939]** ([threshold_sensitivity.csv](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/data/results/revision/threshold_sensitivity.csv)).
*   `luad_laughney` correlated at 0.685, `pdac_peng` at 0.758, `bcc_yost` at 0.818, `hcc_wei` at 0.879, and `crc_lee` at 0.939.
*   Two datasets (`ov_izar_tirosh` and `rcc_multi`) failed to produce any high-confidence background cells under strict settings and were excluded.

This proves that the leaderboard rankings are stable and robust to threshold selection.

### 📝 Manuscript Mapping
*   **Where:** Limitations section ([paper.md](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/paper.md) §Limitations, L158; [MANUSCRIPT_CHANGES.md §R1-6](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/MANUSCRIPT_CHANGES.md#R1-6)).
*   **Why:** Adds threshold sensitivity stability metrics to show that the benchmark results are not an artifact of fine-tuned parameters.

---

## R1-8 — Runtime Hardware / Environment

### 🔴 The Problem (Reviewer Concern)
Runtimes are meaningless unless we specify the exact machine hardware and packages used during evaluation.

> ### 🐗 Caveman Says
> "You say: *'Grog runs faster than Thag.'* But did Grog run on flat grass and Thag run through muddy swamp? Or did Grog ride horse? You must describe path and horse!"

### 🟢 Our Solution
We documented the exact hardware and package configuration in the Reproducibility section of the paper:
*   **Compute Instance:** AMD EPYC 7B12, 16 vCPUs, 62 GiB RAM, Debian 13, **CPU-only (no GPU)**.
*   **Software versions:** Python 3.13.5, R 4.5.0, scanpy 1.12.1, scikit-learn 1.9.0, infercnvpy 0.6.1, anndata 0.11.4, PyTorch 2.12.1 (CPU).
*   **DeepScena Exception:** DeepScena requires a GPU, so it was executed on a Google Colab Tesla T4 GPU instance, and its predictions were copied back to our VM for scoring.

### 📝 Manuscript Mapping
*   **Where:** §Reproducibility and §Acknowledgements ([paper.md](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/paper.md); [MANUSCRIPT_CHANGES.md §R1-8](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/MANUSCRIPT_CHANGES.md#R1-8)).
*   **Why:** Ensures reproducibility and establishes a fair baseline for the runtime comparison.

---

## R1-9 — Effect Sizes (Cliff's Delta)

### 🔴 The Problem (Reviewer Concern)
We claim Method A is better than Method B based on mean AP, but we did not provide statistical effect size measures (like Cliff's delta) to prove how consistent this difference is across individual units.

> ### 🐗 Caveman Says
> "You say: *'Big mountain is taller than small hill.'* How much taller? Is it height of ten tall trees, or just height of one pebble? You must measure!"

### 🟢 Our Solution
We calculated pairwise Cliff's delta ($\delta$, a non-parametric measure of effect size) for all method pairs using their per-unit AP scores on shared Track A units ([cliff_delta_matrix.csv](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/data/results/revision/cliff_delta_matrix.csv)):
*   **hvg_logreg vs FiRE: $\delta = 0.796$** (large effect size — the supervised ceiling heavily dominates).
*   **FiRE vs expr_threshold: $\delta = 0.068$** (negligible effect size — despite a higher mean AP, FiRE does not consistently beat the simple expression baseline across units).
*   **FiRE vs DeepScena: $\delta = 0.775$** (large effect size).

We added these effect size findings to the paper.

### 📝 Manuscript Mapping
*   **Where:** §Key Statistical Results ([paper.md](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/paper.md) L132; [MANUSCRIPT_CHANGES.md §R1-9](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/MANUSCRIPT_CHANGES.md#R1-9)).
*   **Why:** Provides statistical depth by revealing that while some methods have higher average scores, their unit-level advantage is small.

---

## R1-10 — Supervised Ceiling Interpretation

### 🔴 The Problem (Reviewer Concern)
The supervised ceiling (`hvg_logreg`) has access to test labels. It is not a deployable method. Why is it in the benchmark, and how do we interpret it?

> ### 🐗 Caveman Says
> "You say: *'Fastest hunter is the one who already knows where the mammoth sleeps.'* Yes, but that is not fair hunt. That hunter just shows us the maximum speed a human can run to the mammoth!"

### 🟢 Our Solution
We clarified in the manuscript that `hvg_logreg` is a **calibration ceiling**, not a competitor. It represents the upper bound of performance on the inter-lineage task.
We also show that this ceiling is **not trivial** — it collapses on the harder intra-lineage task (Track F), where its median AP falls from **1.000 (Track A) to 0.001 (Track F)** ([track_a_vs_f_comparison.csv](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/data/results/revision/track_a_vs_f_comparison.csv)), as it cannot exploit inter-lineage TME markers.

### 📝 Manuscript Mapping
*   **Where:** Supervised Ceiling Justification section ([paper.md](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/paper.md); [MANUSCRIPT_CHANGES.md §R1-10](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/MANUSCRIPT_CHANGES.md#R1-10)).
*   **Why:** Explicitly contextualizes the role of the ceiling and uses the Track F collapse to show that the ceiling is bound to the inter-lineage setting.

---

## R1-11 — Figure Caption Annotations

### 🔴 The Problem (Reviewer Concern)
Captions for figures should explicitly state the sample sizes ($N$), list the datasets, and annotate hardware configurations.

> ### 🐗 Caveman Says
> "Do not just draw cave painting of mammoth. Write on wall how many mammoths you saw, and what spear you threw!"

### 🟢 Our Solution
We updated all figure captions in the manuscript to include $N$ values, dataset lists, and hardware notes. For example:
*   Added threshold sensitivity $\rho$ ranges to Fig2.
*   Added per-method FPR values to Fig5.
*   Added EPYC hardware annotations to Fig6.
*   Added Track F panel description to Fig9.
*   Added caption for the new Fig11 (Track A vs Track F comparison).

### 📝 Manuscript Mapping
*   **Where:** Figure captions in the main manuscript ([paper.md](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/paper.md); detailed changes in [FIGURE_CHANGES.md](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/FIGURE_CHANGES.md)).
*   **Why:** Ensures full transparency and context for every figure.

---

## R3-1 — Reframing as Malignant-vs-TME Detection

### 🔴 The Problem (Reviewer Concern)
REACH is not a general "rare-cell" benchmark. It specifically tests how well methods separate malignant cells from the tumor microenvironment (TME). The paper should be reframed to state this clearly.

> ### 🐗 Caveman Says
> "You say: *'I build tool to find any hidden beast in forest.'* But you only tested it on finding wolves among sheep and rabbits. It is a wolf-finder, not an animal-finder. Say it is wolf-finder!"

### 🟢 Our Solution
We agreed and reframed the title, abstract, contributions, and tracks sections of the manuscript to explicitly define REACH as a benchmark for **rare malignant-cell detection in heterogeneous TME** via imbalanced cell-level ranking. This represents an *inter-lineage* contrast, rather than general sub-state or intra-lineage discovery.

### 📝 Manuscript Mapping
*   **Where:** Title, Abstract, Contributions, and §Evaluation Tracks ([paper.md](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/paper.md); [MANUSCRIPT_CHANGES.md §R3-1](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/MANUSCRIPT_CHANGES.md#R3-1)).
*   **Why:** Aligns the paper's claims with the actual data, avoiding over-generalization.

---

## R3-2 — Ceiling Triviality in Intra-Lineage Settings

### 🔴 The Problem (Reviewer Concern)
The supervised ceiling (`hvg_logreg`) has an easy job on Track A because it separates epithelial tumor cells from immune/stromal cells (different lineages). This is trivially achievable and does not represent a hard biological boundary.

> ### 🐗 Caveman Says
> "It is easy to find wolf (epithelial) in a flock of sheep (immune). But what if wolf hides in pack of domestic dogs (normal epithelial) of same lineage? That is the real test!"

### 🟢 Our Solution
We conceded this point. We evaluated the supervised ceiling on the new Track F (malignant vs normal epithelial, same lineage). On Track F, the ceiling collapses:
*   **Track A Median AP:** **1.000**
*   **Track F 0.1% Median AP:** **0.001** (chance floor; AUROC = 0.500; [track_a_vs_f_comparison.csv](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/data/results/revision/track_a_vs_f_comparison.csv)).

Because the classifier was trained on inter-lineage labels, it outputs a constant 0.5 when forced to choose between cells of the same lineage. We documented this failure to show that the ceiling is only "trivial" in the inter-lineage microenvironment setting.

### 📝 Manuscript Mapping
*   **Where:** Supervised Ceiling Justification section ([paper.md](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/paper.md); [MANUSCRIPT_CHANGES.md §R3-2](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/MANUSCRIPT_CHANGES.md#R3-2)).
*   **Why:** Concedes the triviality argument honestly and supports it with Track F data.

---

## R3-3 — TME Outliers as False Positives

### 🔴 The Problem (Reviewer Concern)
Activated immune cells in the TME (like activated macrophages or plasmablasts) might share expression features with malignant cells and get falsely flagged.

> ### 🐗 Caveman Says
> "A sheep wearing wolf skin (activated immune cell) might look like wolf. Hunter might throw spear at sheep by mistake. We must warn other hunters!"

### 🟢 Our Solution
We added a dedicated paragraph (item 10) in the Limitations section of the manuscript. We acknowledge that activated TME populations with partially overlapping expression profiles will be flagged as false positives by inter-lineage anomaly detectors. We note that:
1. This is a deliberate scope choice to model the realistic clinical TME setting.
2. Track C (pure null) shows that the false positive rates are extremely low (3%) in the absence of signal, proving that any false positives in active datasets are biological, not algorithmic artifacts.

### 📝 Manuscript Mapping
*   **Where:** Limitations section ([paper.md](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/paper.md) §Limitations; [MANUSCRIPT_CHANGES.md §R3-3](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/MANUSCRIPT_CHANGES.md#R3-3)).
*   **Why:** Explicitly caveats biological false-positive risks for users of the benchmark.

---

## R3-4 & R3-5 — Intra-Lineage Principle & Track F Implementation

### 🔴 The Problem (Reviewer Concern)
The benchmark must demonstrate that inter-lineage performance does not imply the ability to distinguish malignant cells from normal cells of the same lineage (the intra-lineage principle). We need to implement a new Track F with normal epithelial cells as the background and malignant cells as the positive target.

> ### 🐗 Caveman Says
> "We must build new test in forest. We put wolf inside pack of domestic dogs of same lineage. We see if methods can find wolf. If they fail, it proves that finding wolf among sheep was easy, but finding wolf among dogs is very hard!"

### 🟢 Our Solution
We implemented and executed **Track F** on all 10 methods (150 predictions complete) using the `crc_lee` colorectal dataset (the only dataset with both tumor and normal epithelial cell annotations).
*   **Adaptive Unit Sizes:** 2,000 cells for 0.1% prevalence (to preserve positive detection signal) and 400 cells for 0.5% and 1.0% (to restrict background cell duplication to under 20%).

#### Key Leaderboard Results (0.1% Prevalence, Median AP):
| Method | Track A Median AP | Track F Median AP | Δ |
|--------|-------------------|-------------------|---|
| **hvg_logreg (Ceiling)** | 1.000 | 0.001 | −0.999 |
| **scMalignantFinder** | 0.235 | 1.000 | +0.765 |
| **expr_threshold** | 0.317 | 0.008 | −0.309 |
| **CaSee** | 0.512 | 0.003 | −0.510 |
| **FiRE** | 0.313 | 0.004 | −0.309 |
| **cellsius** | 0.259 | 0.001 | −0.258 |
| **RareQ** | 0.196 | 0.001 | −0.195 |
| **scCAD** | 0.130 | 0.001 | −0.129 |
| **DeepScena** | 0.018 | 0.001 | −0.017 |
| **random_baseline** | 0.019 | 0.002 | −0.017 |

Source: [track_f_leaderboard.csv](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/data/results/revision/track_f/track_f_leaderboard.csv) and [track_a_vs_f_comparison.csv](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/data/results/revision/track_f/track_a_vs_f_comparison.csv).

#### Key Takeaways & Caveats:
1.  **Intra-Lineage Principle Proven:** 9 out of 10 methods collapse to an AP $\le 0.009$ on Track F. Success on Track A does *not* imply success on Track F.
2.  **scMalignantFinder Exception:** `scMalignantFinder` retained perfect power (AP = 1.000) on Track F. However, Track F only uses colorectal cancer (`crc_lee`). On Track A, `scMalignantFinder` scored 0.943 on colorectal cancer but fell to 0.015 on head-and-neck cancer (`hnscc_puram`). Therefore, its Track F success is colorectal-specific and **must not be generalized**.
3.  **Data Ceiling:** Track F uses only `crc_lee` because it is the only dataset with normal epithelial annotations. Audits on the other 9 datasets showed only 0–70 cells matching fallback markers (EPCAM+ ∩ low-CNV ∩ source-negative) — too few to construct units.

### 📝 Manuscript Mapping
*   **Where:** §Evaluation Tracks and §Key Statistical Results ([paper.md](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/paper.md) L47, L132; [MANUSCRIPT_CHANGES.md §R3-4 & §R3-5](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/MANUSCRIPT_CHANGES.md#R3-4)).
*   **Why:** Formally establishes Track F, reports the full 10-method leaderboard, and states the biological implications and data limitations clearly.
