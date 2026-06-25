# REACH Frontiers Revision — Technical Solution Ledger & Reviewer Comment Map

This document serves as the formal and detailed technical ledger of all modifications, scientific refactoring, and codebase corrections implemented during the *Frontiers in Bioinformatics* Revision 1 (R1) cycle for Manuscript ID **1878538**. 

Below is a detailed mapping of the 15 reviewer points (Reviewer 1: 10 points; Reviewer 3: 5 points), outlining the underlying scientific concerns, the legacy manuscript/code state, the implemented technical solutions, and their exact locations in the LaTeX source (`paper.md`) and codebase files. Following the reviewer comment mapping, Part 2 outlines additional codebase bug fixes, figure refactoring, and compilation deliverables completed during this revision cycle.

---

## Part 1: Reviewer Comment Mapping (The 15 Points)

### R1-1 — CNV Circularity Check

*   **Reviewer Concern:** The reviewer raised concerns regarding potential circularity in the method rankings, noting that the High-Confidence (HC) ground-truth labels are derived using inferred CNV scores from `infercnvpy`, which some of the evaluated methods may also utilize to score and rank cells.
*   **Old Concept / Legacy State:** The original manuscript acknowledged the risk of circularity bias but did not provide empirical quantification or evidence showing whether this bias actively impacted the final leaderboard rankings.
*   **Technical Solution & Implementation:** We re-derived the High-Confidence (HC) positive labels entirely without the CNV component—basing the derivation solely on source tissue annotations, AUCell signature scores, and kNN neighborhood purity. We re-evaluated all methods against these CNV-free labels. The method rankings under the CNV-free evaluation correlated strongly with the published rankings (Spearman $\rho = 0.648, p = 0.043$), demonstrating that the primary leaderboard is highly robust and not driven by circularity bias.
*   **Manuscript Mapping:** Addressed in the Limitations section ([paper.md](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/paper.md) §Limitations, L158, replacing Limitation 1 with a combined CNV caller and circularity check statement).
*   **Associated Tables & Figures:** The results are recorded and verified in [`data/results/revision/circularity_ranking.csv`](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/data/results/revision/circularity_ranking.csv).

---

### R1-2 — Independent CNV Validation

*   **Reviewer Concern:** The reviewer asserted that CNV inference should be independently validated against external malignancy annotations rather than being relied upon uncritically.
*   **Old Concept / Legacy State:** The original manuscript assumed the correctness of `infercnvpy`'s CNV burden metrics under default parameterizations. It defended this choice using a speculative argument that intersecting multiple CNV callers would break ultra-rare unit construction.
*   **Technical Solution & Implementation:** We validated the inferred CNV scores (per-cell mean absolute deviation from the diploid reference baseline) directly against the original studies' malignancy annotations across 9 datasets (57,811 cells total). The overall CNV AUROC was **0.782** with a Matthew's Correlation Coefficient (MCC) of **0.361**. Per-dataset AUROCs ranged from **0.747** (`hcc_wei`) to **0.960** (`luad_laughney`), with five datasets exceeding 0.86. 
    
    *Bug Fix:* We identified that the `hnscc_puram` dataset originally produced a CNV AUROC of 0.500 because its singular cell-type labels (e.g., `"T cell"`, `"Fibroblast"`) failed to match `infercnvpy`'s default plural reference categories (`T cells`, `B cells`). We corrected these reference category mappings, regenerated the CNV burden, and obtained a corrected AUROC of **0.906** (MCC = 0.763). This correction raised the overall cross-dataset CNV validation AUROC from 0.731 to 0.782. The speculative "caller intersection" argument was removed from the text.
*   **Manuscript Mapping:** Addressed in the Limitations section ([paper.md](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/paper.md) §Limitations, L158, replacing Limitation 1 with a detailed concordance statement).
*   **Associated Tables & Figures:** Supported by the validation dataset [`data/results/revision/cnv_concordance.csv`](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/data/results/revision/cnv_concordance.csv).

---

### R1-3 — Track A ↔ Track B Rank Correlation

*   **Reviewer Concern:** The reviewer requested quantitative proof to justify treating Track B (synthetic Splatter simulation) as a separate secondary track rather than blending its scores into the primary leaderboard.
*   **Old Concept / Legacy State:** The original manuscript treated Track B as a secondary stress test but did not provide the exact rank correlation. A prior revision draft erroneously claimed a "method-level rank stability $\rho > 0.95$" which is not present in the results.
*   **Technical Solution & Implementation:** We computed the Spearman rank correlation between method ranks on Track A (real cells) and Track B (synthetic cells) across all 10 methods. The method-level rank correlation is **$\rho = 0.042$ ($p = 0.907$)**, which is statistically indistinguishable from zero. This demonstrates that rankings on synthetic data do not replicate performance on real cells (e.g., `CaSee` falls from 2nd to 6th, `scMalignantFinder` falls from 5th to 10th), justifying the isolation of Track B as a stress-test probe.
*   **Manuscript Mapping:** Addressed in §Evaluation Tracks ([paper.md](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/paper.md) L47, as a footnote) and §Key Statistical Results (L132, L137).
*   **Associated Tables & Figures:** Fig2 (Sensitivity Robustness) caption updated. Source file: [`data/results/revision/sens2_sens3_extract.txt`](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/data/results/revision/sens2_sens3_extract.txt).

---

### R1-4 — Track C Null FPR Meaning

*   **Reviewer Concern:** The reviewer requested clarification of the biological and diagnostic meaning of the Track C null False Positive Rate (FPR) and the inclusion of exact method results.
*   **Old Concept / Legacy State:** The original paper reported Track C null FPR as "most unsupervised methods ~3% mean FPR" but did not explain the diagnostic utility of Track C or the out-of-bounds FPR of `hvg_logreg`.
*   **Technical Solution & Implementation:** Track C functions as a specificity diagnostic: it measures the rate of anomalous calls in pure-null (all-negative) units. All 9 unsupervised and naive methods controlled their null FPR near the expected ~3% floor (e.g., `RareQ` 0.029, `cellsius` 0.029, `CaSee` 0.030, `scCAD` 0.030, `FiRE` 0.031). The supervised `hvg_logreg` ceiling was the sole outlier at **78.8%** FPR because it trains in-sample on the null unit's own features and overfits to the noise.
*   **Manuscript Mapping:** Addressed in §Key Statistical Results ([paper.md](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/paper.md) L132, replacing the L139 bullet).
*   **Associated Tables & Figures:** Fig5 caption updated to document these FPR limits. Source file: [`data/results/revision/sens2_sens3_extract.txt`](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/data/results/revision/sens2_sens3_extract.txt).

---

### R1-5 — CaSee Degenerate Units and Exploratory Status

*   **Reviewer Concern:** The reviewer requested contextualization of `CaSee`'s performance given its tendency to produce constant-score predictions on specific units, and a clear explanation for its "exploratory" designation.
*   **Old Concept / Legacy State:** CaSee was ranked alongside peer methods without disclosing how often its autoencoder failed to train, or how its performance shifted when excluding these degenerate runs.
*   **Technical Solution & Implementation:** We identified that CaSee returned degenerate constant-score predictions (SD $\approx 0$) on 20 out of 160 units. 
    
    *   **All-units median AP:** **0.512**
    *   **Excl-degenerate median AP:** **0.606**
    
    We updated the primary leaderboard to report both numbers. We clarified that CaSee is "exploratory" because it trains on the test unit itself, which violates deployability rules. We also updated its wrapper fidelity to `faithful_recreation` (built-in CPU recreation fallback, not the original GPU repository).
*   **Manuscript Mapping:** Primary Leaderboard footnote ([paper.md](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/paper.md) §Primary Leaderboard, L115) and §Method Inclusion Table (L80, L87, L104).
*   **Associated Tables & Figures:** Leaderboard table and Method Inclusion table updated. Source file: [`data/results/revision/casee_filtered_leaderboard.csv`](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/data/results/revision/casee_filtered_leaderboard.csv).

---

### R1-6 — Label-Threshold Sensitivity

*   **Reviewer Concern:** The reviewer questioned whether the benchmark rankings are highly sensitive to the specific thresholds chosen to derive the High-Confidence labels (AUCell score and kNN purity).
*   **Old Concept / Legacy State:** The original paper did not evaluate the sensitivity of the final method rankings to changes in these labeling thresholds.
*   **Technical Solution & Implementation:** We varied the AUCell threshold ∈ {0.10, 0.15, 0.20} and the kNN purity cutoff ∈ {0.40, 0.50, 0.60} (9 combinations) with fixed CNV scores. Across the 5 datasets that yielded valid Spearman correlations, the method rankings under the modified thresholds correlated strongly with the published rankings (Spearman $\rho$ range: **[0.685, 0.939]**; `luad_laughney` 0.685, `pdac_peng` 0.758, `bcc_yost` 0.818, `hcc_wei` 0.879, `crc_lee` 0.939). Two datasets with insufficient high-confidence background cells were excluded.
*   **Manuscript Mapping:** Added as a new numbered item (item 9) in §Limitations ([paper.md](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/paper.md) §Limitations, L158).
*   **Associated Tables & Figures:** Fig2 caption updated. Source file: [`data/results/revision/threshold_sensitivity.csv`](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/data/results/revision/threshold_sensitivity.csv).

---

### R1-8 — Runtime Hardware / Environment

*   **Reviewer Concern:** The reviewer noted that runtime comparisons lack specific hardware annotations and execution environment details.
*   **Old Concept / Legacy State:** The original manuscript cited "NVIDIA L4 GPU instances" under Acknowledgements for raw preprocessing but did not document the specific compute environment used to measure method runtimes.
*   **Technical Solution & Implementation:** We documented the exact compute environment used to run the evaluations: AMD EPYC 7B12 CPU (16 vCPUs), 62 GiB RAM, Debian 13, and no GPU. R packages (FiRE, CellSIUS, RareQ) were run natively. DeepScena was run on a Google Colab Tesla T4 GPU because the revision VM had no GPU, which has been annotated. software versions: scanpy 1.12.1, scikit-learn 1.9.0, infercnvpy 0.6.1, torch 2.12.1.
*   **Manuscript Mapping:** Added a "Revision compute environment" subsection under Reproducibility ([paper.md](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/paper.md) §Reproducibility, L202, after L215).
*   **Associated Tables & Figures:** Fig6 caption updated. Source file: [`data/results/revision/environment_capture.txt`](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/data/results/revision/environment_capture.txt).

---

### R1-9 — Pairwise Effect Sizes (Cliff's delta)

*   **Reviewer Concern:** The reviewer requested the inclusion of statistical effect size metrics to supplement p-values for pairwise method comparisons.
*   **Old Concept / Legacy State:** The original manuscript reported Wilcoxon signed-rank p-values but did not provide non-parametric effect sizes, which could hide cases where statistical differences are practically negligible.
*   **Technical Solution & Implementation:** We computed pairwise Cliff's delta ($\delta$) using per-unit AP scores on shared Track A units:
    
    *   `hvg_logreg` vs `FiRE`: $\delta = 0.796$ (large effect size; ceiling dominates).
    *   `FiRE` vs `expr_threshold` (baseline): $\delta = 0.068$ (negligible effect size; FiRE does not consistently outperform the naive expression threshold baseline).
    *   `FiRE` vs `DeepScena`: $\delta = 0.775$ (large effect size).
    
    This indicates that while FiRE has a higher average score, its unit-level performance advantage over the simple expression baseline is inconsistent.
*   **Manuscript Mapping:** Added as a new bullet under §Key Statistical Results ([paper.md](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/paper.md) L132, after L136).
*   **Associated Tables & Figures:** Fig3 caption updated. Source file: [`data/results/revision/cliff_delta_matrix.csv`](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/data/results/revision/cliff_delta_matrix.csv).

---

### R1-10 — Supervised-Ceiling Interpretation

*   **Reviewer Concern:** The reviewer requested clarification that the supervised ceiling is a calibration upper bound, not a deployable competitor, and challenged the claim that it is "trivially achievable." Paired with R3-2.
*   **Old Concept / Legacy State:** The original manuscript presented the supervised ceiling `hvg_logreg` as a benchmark baseline without explicitly contextualizing its role or testing it in the absence of the TME background.
*   **Technical Solution & Implementation:** We reframed `hvg_logreg` as a **calibration ceiling** that quantifies the gap between supervised separability and unsupervised ranking (≈0.687 AP on Track A). We demonstrated that the ceiling is not trivial on the harder intra-lineage Track F, where its AP collapses from 1.000 (Track A) to 0.001 (Track F) because it cannot exploit TME-specific markers.
*   **Manuscript Mapping:** Replaced the paragraph under §Supervised Ceiling Justification ([paper.md](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/paper.md) L109, L111).
*   **Associated Tables & Figures:** Captions for Fig9 and Fig11 updated. Source file: [`data/results/revision/track_f/track_a_vs_f_comparison.csv`](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/data/results/revision/track_f/track_a_vs_f_comparison.csv).

---

### R1-11 — Figure Captions / N-Datasets Annotation

*   **Reviewer Concern:** Figure captions should explicitly state the sample sizes ($N$) and list the datasets.
*   **Old Concept / Legacy State:** Captions in the original manuscript were descriptive but lacked N annotations and lists of datasets used.
*   **Technical Solution & Implementation:** We updated all captions with N values and dataset lists sourced from [`data/results/results_per_unit.csv`](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/data/results/results_per_unit.csv).
*   **Manuscript Mapping:** Captions in `paper.md` were edited.
*   **Associated Tables & Figures:** Updated Fig1, Fig2, Fig3, Fig4, Fig5, Fig6, Fig7, Fig8, Fig9 captions and added new Fig11. Detailed changes are in [`revised/FIGURE_CHANGES.md`](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/FIGURE_CHANGES.md).

---

### R3-1 — Reframe "Malignant-vs-TME" / Imbalanced Ranking

*   **Reviewer Concern:** The reviewer requested that the benchmark be explicitly framed as rare malignant-cell detection in a heterogeneous TME via imbalanced ranking, rather than general rare-cell or intra-lineage sub-state discovery.
*   **Old Concept / Legacy State:** The original paper claimed REACH was a general "rare cell detection" benchmark, which could be misinterpreted as assessing intra-lineage sub-state discovery.
*   **Technical Solution & Implementation:** We reframed the title, abstract, contributions, and tracks sections of the manuscript to specify that REACH is a benchmark for **rare malignant-cell detection in heterogeneous tumor microenvironments** via imbalanced cell-level ranking (an inter-lineage contrast, not sub-state discovery).
*   **Manuscript Mapping:** Abstract L7, Contributions L19, and Evaluation Tracks L47.
*   **Associated Tables & Figures:** Fig8 and Fig9 titles/captions updated.

---

### R3-2 — Ceiling Is Trivial for Intra-Lineage (Concede)

*   **Reviewer Concern:** The reviewer noted that the supervised ceiling is trivial because it exploits the inter-lineage contrast between epithelial tumor cells and immune/stromal cells, which disappears in an intra-lineage task.
*   **Old Concept / Legacy State:** The original paper did not test the ceiling in the absence of the TME background.
*   **Technical Solution & Implementation:** We conceded this point. We evaluated `hvg_logreg` on the new Track F (malignant vs normal epithelial, same lineage), where its median AP collapsed to 0.001 (random chance) and AUROC was 0.500 (since it outputs a constant 0.5 score for all cells, having only learned TME-specific markers).
*   **Manuscript Mapping:** Supervised Ceiling Justification L109 (appended to R1-10 text).
*   **Associated Tables & Figures:** New Fig11 highlights the ceiling collapse (Δ = -0.999).

---

### R3-3 — TME Outliers as False Positives

*   **Reviewer Concern:** The reviewer pointed out that activated TME subpopulations (activated macrophages, cycling fibroblasts, plasmablasts) might share expression features with malignant cells and get falsely flagged.
*   **Old Concept / Legacy State:** The original paper did not address this biological source of false positives.
*   **Technical Solution & Implementation:** We added a paragraph to Limitations. We acknowledge that methods calibrated on inter-lineage contrast may flag activated TME cells sharing features with tumor cells. We show that Track C null units keep FPR near 3%, confirming that any false positives are due to biological overlap, not metric pathology.
*   **Manuscript Mapping:** Added as numbered item 10 in Limitations ([paper.md](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/paper.md) §Limitations).
*   **Associated Tables & Figures:** Captions of Fig5 and Track C references updated.

---

### R3-4 & R3-5 — Intra-Lineage Principle & Track F Implementation

*   **Reviewer Concern:** The reviewer requested that the benchmark demonstrate that inter-lineage performance does not imply the ability to distinguish malignant cells from normal cells of the same lineage (the intra-lineage principle, R3-4), and add an intra-lineage track (Track F) to report results across all methods (R3-5).
*   **Old Concept / Legacy State:** The original paper lacked any intra-lineage evaluation.
*   **Technical Solution & Implementation:** We implemented **Track F** (malignant epithelial positives vs normal epithelial background, same lineage, crc_lee colorectal cancer dataset only) across 3 prevalence tiers (0.1%, 0.5%, 1.0%), and evaluated all 10 methods (150 predictions). 9 of 10 methods collapsed to AP $\le 0.009$ (near zero). Only `scMalignantFinder` retained perfect power (AP = 1.000), but we disclosed that this is colorectal-cancer specific and does not generalize (on Track A its AP was 0.015 on head & neck cancer). Track F unit sizes are adaptive: 2,000 cells for 0.1% (83% duplication due to 340-cell pool) and 400 cells for 0.5%/1% (duplication <20%).
*   **Manuscript Mapping:** Evaluation Tracks ([paper.md](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/paper.md) §Evaluation Tracks, L47) updated with a new Track F table row, a subsection, and the "Intra-lineage principle" subsection. Key Statistical Results ([paper.md](file:///home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test/revised/paper.md) L132) updated with a results paragraph.
*   **Associated Tables & Figures:** Added new **Fig11** (matplotlib-generated grouped bar chart showing Track A vs Track F AP and highlighting the hvg_logreg collapse and scMalignantFinder inversion). Added **Track F Leaderboard Table** to the manuscript.

---

## Part 2: Additional Scientific & Codebase Changes

Beyond the 15 reviewer comments, several scientific corrections, bug fixes, and layout refactoring were executed:

### 2.1 Core Code Bug Fixes (5 Bugs Resolved)
1.  **Bug 1: CLI KeyError in `rcb run-track`:** Fixed `src/rarecellbenchmark/cli.py` to gracefully load and default parameters for all tracks (D, E, F), and added `"f"` to `TRACKS` in `constants.py`.
2.  **Bug 2: Zenodo Archive Inconsistencies & Packaging Script:** Created `scripts/create_zenodo_archives.py` to automate packaging of all 8 archives (including Track F data and leaderboard tables) with correct directory layouts.
3.  **Bug 3: `evaluate_results.py` Track Filtering:** Filtered prediction files matching the `_track_{track}_` suffix to prevent crash during evaluation on a single track.
4.  **Bug 4: `tarfile extractall` Deprecation Warning:** Patched `src/rarecellbenchmark/preprocess/preprocess_dataset.py:118` to use `filter='data'` to ensure Python 3.12+ compatibility.
5.  **Bug 5: Setup & Execution of R-based Methods:** Created `Dockerfile.r` and `setup/install_r_packages.R` to fully build the R environment and install CRAN/GitHub dependencies for R methods (FiRE, CellSIUS, RareQ).

### 2.2 Figure Schematic Updates
*   **Fig8 (Pipeline Overview) & Fig9 (Track Design):** Regenerated to include Track F, updating unit count to **1,125 units** and evaluations to **11,250**.
*   **`style.py`:** Added pink color (`#E91E63`) mapping for Track F.
*   **`Snakefile`:** Added Fig8-Fig11 build targets to ensure complete reproducibility.

### 2.3 LaTeX Compilation & Deliverables
Clean and tracked changes PDFs (`paper_clean.pdf`, `paper_tracked.pdf`, `tracked_changes.tex`) were successfully verified and compiled via the XeLaTeX engine.
