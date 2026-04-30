# Methods

## Included methods (10)

| Method | Category | Status | Tracks | Language | Citation | Notes |
|---|---|---|---|---|---|---|
| FiRE | ranked | Included | A-E | R | Jindal et al., Bioinformatics 2018 | CRAN package; moderate AP with low degeneracy |
| DeepScena | ranked | Included | A-E | Python | Yu et al., 2022 | GPU optional; lowest mean AP (0.029) among ranked methods (see discussion below) |
| RareQ | ranked | Included | A-E | R | fabotao/RareQ (GitHub) | Quantile-based rarity score; some degenerate outputs |
| cellsius | ranked | Included | A-E | R | Wegmann et al., Genome Biology 2019 | Cell-level rarity statistic; R-based |
| scCAD | ranked | Included | A-E | Python | Original publication (see wrapper) | Anomaly-based scorer; fallback on large datasets |
| scMalignantFinder | ranked | Included | A-E | Python | Original publication (see wrapper) | Fast Python scorer; proxy fidelity; high degeneracy |
| CaSee | exploratory | Included | A-E | Python (PyTorch) | Yu et al., 2022 | Faithful exploratory comparator; strong AP but reported separately from published ranked methods |
| random_baseline | naive | Included | A-E | Python | N/A - baseline | Random floor for significance testing |
| expr_threshold | naive | Included | A-E | Python | N/A - baseline | Naive biological signal (expression threshold) |
| hvg_logreg | supervised | Included | A,B,C,E | Python | N/A - supervised ceiling baseline | Supervised in-sample oracle; ceiling reference |

### Note on DeepScena

DeepScena completed successfully on 140/160 units but exhibited the lowest mean AP (0.029) among all ranked methods. This transparent negative result highlights that deep-learning architectures optimised for cluster detection may be less sensitive to extremely sparse rare-cell signals.

## Excluded methods (7)

Seven selected methods were attempted but excluded from the primary leaderboard after output-quality control. Rationale is summarized here because manuscript supplement files are not part of this lean source repository.

| Method | Category | Status | Tracks | Language | Citation | Notes |
|---|---|---|---|---|---|---|
| CopyKAT | orthogonal | Excluded | N/A | R | Kaixuan et al., 2021 (Nature Biotechnology) | CNV-based; OOM / skipped on all datasets |
| MACE | orthogonal | Excluded | N/A | Python | Original publication (see wrapper) | CNV-based; dynamic reference unsupported |
| SCANER | ranked | Excluded | N/A | Python (PyTorch) | Original publication (see wrapper) | Deep learning; GPU OOM, degenerate outputs |
| SCEVAN | orthogonal | Excluded | N/A | R | Original publication (see wrapper) | CNV-based; timeout on large datasets |
| RaceID3 | ranked | Excluded | N/A | R | Grun et al., 2016 (Cell) | Cluster-based; degenerate outputs |
| scATOMIC | orthogonal | Excluded | N/A | R | Original publication (see wrapper) | Pan-cancer annotator; score contract mismatch |
| GiniClust3 | ranked | Excluded | N/A | Python | Original publication (see wrapper) | Gini-index cluster-based; degenerate outputs |

## Method taxonomy

- **Ranked** - Unsupervised or semi-supervised detectors that produce a continuous score per cell.
- **Naive** - Simple baselines (random, biological threshold) used for floor calibration.
- **Supervised** - Oracle methods that use ground-truth labels in-sample (ceiling reference only).
- **Orthogonal** - Methods based on independent biological signals (for example, CNV) that do not fit the primary scoring contract; retained for future comparator work.
