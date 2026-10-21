# REACH Frontiers Revision — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. After finishing each Phase, update `2026-06-21-reach-frontiers-revision-PROGRESS.md` (mark the phase's tasks done, paste the produced numbers).

**Goal:** Address all 15 reviewer revision requests (Reviewer 1: 6 major + 4 minor; Reviewer 3: 5 major) for *Frontiers in Bioinformatics* MS 1878538, by (a) restoring the missing compute environment, (b) regenerating the real CNV arm, (c) running the new analyses (circularity, threshold sensitivity, CaSee filtering, Cliff's δ, intra-lineage Track F), (d) re-storing all result tables/figures correctly, and (e) producing exact, line-level manuscript + figure change instructions for the author to apply by hand.

**Architecture:** The REACH benchmark is a Python package `rarecellbenchmark` (CLI `rcb`) with a 12-phase pipeline. Method scores are computed from expression only and stored as per-cell `predictions.csv`; labels enter at evaluation (Phase 11). Therefore most analyses re-evaluate **existing** predictions and need **no method reruns** — the single exception is Track F (R3-5), which builds new benchmark units and must run methods on them. The plan is staged so that everything runnable with zero prerequisites happens first, and the two environment-heavy prerequisites (real CNV; restoring the 7 external method wrappers) are isolated into Phase 1 and Phase 4B.

**Tech Stack:** Python ≥3.11 (`.venv/` runs 3.13.5), scanpy/anndata, infercnvpy (to be installed), scikit-learn, pandas, pyarrow, rpy2 + R (renv) for R-based methods, Docker (GHCR image), pytest, ruff, mypy.

## Global Constraints

- Working directory is `/home/moramvenkatasatyajaswanth/reach-rarecell-benchmark-test` (the active copy with `.venv/`, local `.h5ad`, predictions, results). All paths below are relative to it.
- Python entrypoint is always `.venv/bin/python` / `.venv/bin/rcb` / `.venv/bin/pytest` — never bare `python`.
- Ruff line-length 88, ignore E501; mypy target 3.11. Preserve all existing docstrings/comments.
- **Never fabricate a number.** Every result cell, AP, ρ, δ, or runtime in the manuscript must come from a file produced by these tasks. If a run is unflattering, report it.
- **Reproducibility honesty:** the public repo currently ships a CNV *stub* (`src/rarecellbenchmark/validate/cnv.py` returns zeros) and is missing `External-Methods/`. Both gaps must be closed or explicitly documented; do not claim infercnvpy was used while shipping a stub.
- All 10 processed datasets are already local in `data/processed/*.h5ad`. No Zenodo download is required for any task in this plan.
- Commit after every task with conventional-commit messages (`feat:`, `fix:`, `test:`, `docs:`, `chore:`). Work on a branch `revision/frontiers-r1` (created in Phase 0).
- The author (you) will apply manuscript text + image edits by hand from `manuscript_revision/`. Agents must NOT edit `paper.md` or the PDF directly; they only write the instruction files and regenerate figures.

---

## Reviewer-point → Phase index

| Point | Summary | Phase | Type | Needs CNV | Needs External-Methods | GPU |
|---|---|---|---|---|---|---|
| P1 (prereq) | Regenerate real CNV arm | 1 | code | — | no | no (CPU, heavy) |
| R1-1 | CNV circularity on rankings | 2 | code+text | no (drops CNV) | no | no |
| R1-3 | Track A↔B correlation | 2 | text (cite `sens2`) | no | no | no |
| R1-4 | Track C FPR meaning | 2 | text (cite `sens3`) | no | no | no |
| R1-5 | CaSee excluded / degenerate | 2 | code+text | no | no | no |
| R1-9 | Effect sizes (Cliff's δ) | 2 | code+text | no | no | no |
| R1-10 | Ceiling interpretation | 7 | text | no | no | no |
| R1-11 | Figure caption N/datasets | 6 | text | no | no | no |
| R1-2 | Independent CNV validation | 3 | code+text | **yes** | no | no |
| R1-6 | Label threshold sensitivity | 3 | code+text | **yes** | no | no |
| R1-8 | Runtime hardware/env | 7 | text (author input) | no | no | no |
| R3-1 | Reframe malignant-vs-TME | 7 | text | no | no | no |
| R3-2 | Ceiling trivial (concede) | 7 | text (uses Track F) | no | no | no |
| R3-3 | TME outliers as FP | 7 | text | no | no | no |
| R3-4 | Intra-lineage principle | 7 | text (uses Track F) | no | no | no |
| R3-5 | Track F intra-lineage track | 4 | code+text | reuses labels | full 10: **yes** | DeepScena: **yes** |

---

## Phase map (execution order)

- **Phase 0 — Environment, branch, GPU audit, dependency install** (gates everything)
- **Phase 1 — Regenerate real CNV arm (P1)** (gates R1-2, R1-6; feeds Track F labels honesty)
- **Phase 2 — Zero-prerequisite analyses** (R1-1, R1-3, R1-4, R1-5, R1-9)
- **Phase 3 — CNV-dependent analyses** (R1-2, R1-6) — requires Phase 1
- **Phase 4 — Track F intra-lineage** (R3-5): 4A core baselines (no prereq) → 4B full 10 methods (requires Phase 0 External-Methods + GPU)
- **Phase 5 — Result consolidation** (rebuild leaderboard/reranks/new tables, freeze snapshot)
- **Phase 6 — Figure regeneration + caption instructions** (R1-11 + new Track F figure)
- **Phase 7 — Manuscript text change instructions** (R1-2,3,4,5,8,9,10 + R3-1,2,3,4 narrative)
- **Phase 8 — QA / integration test of the whole revision bundle**

**GPU independence note:** Phases 5–8 may proceed with 9/10 Track F methods (all except DeepScena) if the GPU VM is deferred. The Track F leaderboard, A-vs-F comparison, figures, and manuscript text will note the DeepScena deferral explicitly. The R3-2 ceiling-drop evidence (hvg_logreg) and R3-4 intra-lineage principle come from 4A core baselines and do not require GPU. Do NOT block Phases 5–8 on GPU availability.

---

## File structure (what gets created/modified)

**New source code**
- Modify `src/rarecellbenchmark/validate/cnv.py` — replace stub with real infercnvpy implementation (CPU).
- Create `src/rarecellbenchmark/tracks/track_f_generator.py` — intra-lineage unit builder.
- Create `tests/validate/test_cnv_real.py`, `tests/tracks/test_track_f_generator.py`.

**New analysis scripts (post-hoc, on existing CLI/results)**
- Create `scripts/regenerate_cnv.py` — run real Phase-3 CNV across 10 datasets, persist per-cell `cnv_score`.
- Create `scripts/circularity_check.py` — R1-1.
- Create `scripts/threshold_sensitivity.py` — R1-6.
- Create `scripts/cnv_concordance.py` — R1-2.
- Create `scripts/casee_filtered_ap.py` — R1-5.
- Create `scripts/compute_cliff_delta.py` — R1-9.
- Create `scripts/run_track_f.py` — R3-5 orchestrator (subset → units → run methods → evaluate).
- Create `scripts/consolidate_revision_results.py` — Phase 5 result rebuild.

**New result outputs** (all under `data/results/revision/`)
- `cnv_scores/{dataset}_cnv.parquet`, `circularity_ranking.csv`, `threshold_sensitivity.csv`, `cnv_concordance.csv`, `casee_filtered_leaderboard.csv`, `cliff_delta_matrix.csv`, `track_f/track_f_results.csv`, `track_f/track_f_leaderboard.csv`, `REVISION_RESULTS_INDEX.md`.

**Figures** — regenerated into `data/results/figures/phase12/` + copied to `manuscript_revision/images/`.

**Author-facing deliverables** (`manuscript_revision/`)
- `MANUSCRIPT_CHANGES.md` — line/section-level text edits.
- `FIGURE_CHANGES.md` — which figures to swap, new captions, new figure spec.
- `RESPONSE_TO_REVIEWERS.md` — point-by-point reply letter.
- `images/`, `tables/` — regenerated assets staged for upload.

**Progress tracker**
- `docs/superpowers/plans/2026-06-21-reach-frontiers-revision-PROGRESS.md`.

---

# PHASE 0 — Environment, branch, GPU audit, dependencies

**Why:** Nothing downstream is trustworthy until we know what can run here. This phase establishes the branch, detects GPU, installs infercnvpy (needed Phase 1), and attempts to restore `External-Methods/` + R env (needed Phase 4B). It produces a written capability report so later phases know which methods run locally vs need a GPU host.

### Task 0.1: Create revision branch

- [ ] **Step 1: Create and switch to the branch**

Run:
```bash
cd ~/reach-rarecell-benchmark-test
git checkout -b revision/frontiers-r1
```
Expected: `Switched to a new branch 'revision/frontiers-r1'`

- [ ] **Step 2: Commit current untracked plan scaffolding**

```bash
git add docs/superpowers/plans manuscript_revision
git commit -m "docs: add Frontiers revision plan and manuscript_revision scaffold"
```

### Task 0.2: GPU + hardware capability audit (also feeds R1-8)

**Logic:** Reviewer 1-8 needs the real hardware. We capture it now into a file so the manuscript instruction in Phase 7 cites a real artifact instead of invented specs. We also detect GPU to decide Phase 4B method routing.

- [ ] **Step 1: Capture hardware + GPU + library versions**

Run:
```bash
cd ~/reach-rarecell-benchmark-test
mkdir -p data/results/revision
{
  echo "## CPU"; lscpu | grep -E 'Model name|^CPU\(s\)|Socket|Thread';
  echo "## MEM"; free -h | head -2;
  echo "## OS"; uname -a; cat /etc/os-release 2>/dev/null | head -2;
  echo "## GPU"; (nvidia-smi -L 2>/dev/null || echo "NO GPU DETECTED");
  echo "## PY"; .venv/bin/python -V;
  echo "## LIBS"; .venv/bin/pip freeze | grep -iE 'scanpy|anndata|scikit-learn|numpy|scipy|torch|infercnv|rpy2';
} | tee data/results/revision/environment_capture.txt
```
Expected: a file listing CPU model, RAM, OS, GPU presence (or "NO GPU DETECTED"), and library versions.

- [ ] **Step 2: Record the GPU verdict in the progress tracker**

Open the PROGRESS file and write under "Environment": `GPU available: YES/NO` (from Step 1). This decides whether DeepScena can run in Phase 4B locally (CaSee runs on CPU regardless — `supports_gpu=False`).

- [ ] **Step 3: Commit**

```bash
git add data/results/revision/environment_capture.txt
git commit -m "chore: capture revision compute environment and GPU status"
```

### Task 0.3: Install infercnvpy + gene-position reference (gates Phase 1)

**Logic:** infercnvpy is in no requirements file. The real CNV arm needs (a) the package and (b) per-gene chromosome positions. We install and add it to `requirements/full.txt` so the repo becomes honest/reproducible.

- [ ] **Step 1: Install infercnvpy**

```bash
.venv/bin/pip install infercnvpy
.venv/bin/python -c "import infercnvpy as cnv; print('infercnvpy', cnv.__version__)"
```
Expected: prints a version (e.g. `infercnvpy 0.4.x`) with no ImportError.

- [ ] **Step 2: Add to requirements**

Edit `requirements/full.txt` — append `infercnvpy`. Edit `pyproject.toml` optional-dependencies to add `"infercnvpy"` under a new `cnv` extra (mirror the existing `[project.optional-dependencies]` block at line ~41).

- [ ] **Step 3: Commit**

```bash
git add requirements/full.txt pyproject.toml
git commit -m "build: add infercnvpy dependency for real CNV arm"
```

### Task 0.4: Attempt External-Methods restore (gates Phase 4B full Track F)

**Logic:** The 7 published comparators run from `External-Methods/` which is absent, and the documented helper `setup/setup_external_methods.sh` is missing. We attempt restore; if upstream repos are unavailable, we record which methods are runnable and route the rest in Phase 4B.

- [ ] **Step 1: Print the exact entrypoints each wrapper expects**

```bash
grep -rn "External-Methods" src/rarecellbenchmark/methods/ | sed 's/:.*External-Methods/ -> External-Methods/' | sort -u
grep -ni 'github\|repo\|http' docs/METHODS.md | head -20
```
Expected: the `External-Methods/<Name>/<entry>.py` paths each wrapper needs.

- [ ] **Step 2: Create `setup/setup_external_methods.sh`** cloning each upstream repo into `External-Methods/` matching the exact folder nesting each wrapper expects. The confirmed URLs and structures are:
```bash
#!/usr/bin/env bash
set -euo pipefail
mkdir -p External-Methods && cd External-Methods

# 1. scCAD (verified URL: github.com/xuyp-csu/scCAD — Xu et al. 2024, Nat Commun)
mkdir -p scCAD
[ -d "scCAD/scCAD-1.0.0" ] || git clone --depth 1 https://github.com/xuyp-csu/scCAD.git scCAD/scCAD-1.0.0
# Create scCAD_patched.py from scCAD.py (wrapper imports scCAD_patched, not scCAD)
if [ -f "scCAD/scCAD-1.0.0/scCAD.py" ] && [ ! -f "scCAD/scCAD-1.0.0/scCAD_patched.py" ]; then
  cp scCAD/scCAD-1.0.0/scCAD.py scCAD/scCAD-1.0.0/scCAD_patched.py
  echo "NOTE: Created scCAD_patched.py as copy of scCAD.py. Apply n_jobs=4 + unique-temp-dir patches if running in parallel."
fi

# 2. DeepScena
mkdir -p DeepScena
[ -d "DeepScena/DeepScena-1.0.1" ] || git clone --depth 1 https://github.com/shaoqiangzhang/DeepScena.git DeepScena/DeepScena-1.0.1

# 3. scMalignantFinder (and download its Zenodo model reference)
mkdir -p scMalignantFinder
[ -d "scMalignantFinder/scMalignantFinder-main" ] || git clone --depth 1 https://github.com/Jonyyqn/scMalignantFinder.git scMalignantFinder/scMalignantFinder-main
mkdir -p scMalignantFinder/scMalignantFinder-main/pretrained_model
cd scMalignantFinder/scMalignantFinder-main/pretrained_model
[ -f "model.joblib" ] || wget -O model.joblib https://zenodo.org/records/17888140/files/model.joblib?download=1
[ -f "ordered_feature.tsv" ] || wget -O ordered_feature.tsv https://zenodo.org/records/17888140/files/ordered_feature.tsv?download=1
cd ../../..

# 4. CaSee
[ -d "CaSee-main" ] || git clone --depth 1 https://github.com/yuansh3354/CaSee.git CaSee-main

echo "Cloned external methods. Pre-installing R packages if R is available..."
if command -v Rscript &> /dev/null; then
  Rscript -e 'if (!requireNamespace("devtools", quietly=TRUE)) install.packages("devtools", repos="https://cloud.r-project.org")'
  Rscript -e 'if (!requireNamespace("FiRE", quietly=TRUE)) install.packages("FiRE", repos="https://cloud.r-project.org")'
  Rscript -e 'if (!requireNamespace("CellSIUS", quietly=TRUE)) devtools::install_github("Novartis/CellSIUS")'
  Rscript -e 'if (!requireNamespace("RareQ", quietly=TRUE)) devtools::install_github("fabotao/RareQ")'
fi
```

- [ ] **Step 3: Run it (best-effort) + check R**

```bash
bash setup/setup_external_methods.sh 2>&1 | tee data/results/revision/external_methods_setup.log
which R Rscript 2>/dev/null || echo "R NOT INSTALLED — R methods (FiRE/CellSIUS) need R+renv restore"
```

- [ ] **Step 4: Smoke-test every method on toy data → capability matrix**

```bash
for m in random_baseline expr_threshold hvg_logreg FiRE scCAD cellsius RareQ scMalignantFinder DeepScena CaSee; do
  .venv/bin/rcb run-method --method "$m" --unit-id smoke --input data/toy/*.h5ad 2>&1 | tail -1 | sed "s/^/[$m] /"
done | tee data/results/revision/method_smoke.log
```
Then hand-write `data/results/revision/method_capability.csv` with columns `method_id,kind,runnable_here,reason`. Expected: the 3 baselines succeed; externals succeed only if restored.

- [ ] **Step 5: Commit**

```bash
git add setup/setup_external_methods.sh data/results/revision/method_capability.csv data/results/revision/*.log
git commit -m "chore: restore external methods toolchain and record capability matrix"
```

**Phase 0 exit criteria:** branch created; `environment_capture.txt`, `method_capability.csv` exist; infercnvpy importable. Update PROGRESS Phase 0 → done; record GPU verdict + runnable methods.

---

# PHASE 1 — Regenerate the real CNV arm (Prerequisite P1)

**Why:** You have no cached CNV; the repo has only a zero-stub. R1-2 and R1-6 cannot be answered without real per-cell CNV scores, and the manuscript claims infercnvpy was used. This phase makes that claim true and produces `cnv_score` per cell for all 10 datasets.

**Logic of the method:** infercnvpy infers copy-number by smoothing expression along genomic position relative to a normal reference cell set. We need (1) gene→chromosome-position annotation, (2) a reference set of non-malignant cells (immune/stromal `cell_type`), (3) a per-cell CNV burden score = mean |inferred CNV| across the genome.

**Note:** Test subdirectories `tests/validate/`, `tests/tracks/`, `tests/evaluate/`, `tests/preprocess/` do not yet exist. Run `mkdir -p tests/validate tests/tracks tests/evaluate tests/preprocess tests/fixtures` before writing test files. The Write tool will create dirs implicitly, but mkdir is safer for CI.

### Task 1.1: Replace the CNV stub with a real implementation (TDD)

**Files:** Modify `src/rarecellbenchmark/validate/cnv.py`; Test `tests/validate/test_cnv_real.py`.

**Interfaces:** Produces `compute_cnv_score(adata, reference_key="cell_type", reference_cats=None) -> pd.Series` (per-cell float, higher = more aneuploid; backward compatible single-arg call).

- [ ] **Step 1: Write the failing test** — create `tests/validate/test_cnv_real.py`:
```python
import numpy as np
import pandas as pd
import scanpy as sc
from anndata import AnnData
from rarecellbenchmark.validate.cnv import compute_cnv_score


def _toy_adata(n=200, g=400, seed=0):
    rng = np.random.default_rng(seed)
    X = rng.poisson(1.0, size=(n, g)).astype(float)
    X[: n // 2, : g // 4] += 8.0  # chromosomal gain in half the cells
    var = pd.DataFrame(index=[f"g{i}" for i in range(g)])
    var["chromosome"] = ["chr1"] * (g // 2) + ["chr2"] * (g - g // 2)
    var["start"] = np.arange(g) * 1000
    var["end"] = var["start"] + 500
    obs = pd.DataFrame(index=[f"c{i}" for i in range(n)])
    obs["cell_type"] = ["malignant"] * (n // 2) + ["T cells"] * (n - n // 2)
    a = AnnData(X=X, obs=obs, var=var)
    sc.pp.normalize_total(a, target_sum=1e4); sc.pp.log1p(a)
    return a


def test_cnv_score_is_per_cell_and_separates_aneuploid():
    a = _toy_adata()
    s = compute_cnv_score(a, reference_cats=["T cells"])
    assert isinstance(s, pd.Series)
    assert list(s.index) == list(a.obs_names)
    assert s.notna().all()
    assert s.iloc[:100].mean() > s.iloc[100:].mean()
```

- [ ] **Step 2: Run → FAIL** (`.venv/bin/pytest tests/validate/test_cnv_real.py -v`): stub returns zeros so `gain > ref` is `0 > 0` → False.

- [ ] **Step 3: Implement** — replace the body of `src/rarecellbenchmark/validate/cnv.py`:
```python
from __future__ import annotations
import logging
import numpy as np
import pandas as pd
from anndata import AnnData

logger = logging.getLogger(__name__)
_DEFAULT_REFERENCE_CATS = (
    "T cells", "B cells", "Myeloids", "Mast cells", "Stromal cells",
    "Endothelial cells", "NK cells", "Plasma cells",
)


def compute_cnv_score(adata: AnnData, reference_key: str = "cell_type",
                      reference_cats: list[str] | None = None) -> pd.Series:
    """Per-cell CNV burden via infercnvpy, with a loud zero-fallback."""
    try:
        import infercnvpy as cnv
    except ImportError:
        logger.error("infercnvpy missing; returning ZERO CNV (NOT production-valid).")
        return pd.Series(0.0, index=adata.obs.index, name="cnv_score")
    if not {"chromosome", "start", "end"}.issubset(adata.var.columns):
        logger.error("var lacks genomic positions; returning ZERO CNV. Annotate first.")
        return pd.Series(0.0, index=adata.obs.index, name="cnv_score")
    cats = set(adata.obs[reference_key].astype(str).unique())
    ref = reference_cats or [c for c in _DEFAULT_REFERENCE_CATS if c in cats]
    kwargs = {"reference_key": reference_key, "reference_cat": ref} if ref else {}
    work = adata.copy()
    cnv.tl.infercnv(work, **kwargs)
    mat = work.obsm["X_cnv"]
    arr = mat.toarray() if hasattr(mat, "toarray") else np.asarray(mat)
    return pd.Series(np.abs(arr).mean(axis=1).ravel(), index=adata.obs.index, name="cnv_score")
```

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Lint + commit**
```bash
.venv/bin/ruff check src/rarecellbenchmark/validate/cnv.py tests/validate/test_cnv_real.py
git add src/rarecellbenchmark/validate/cnv.py tests/validate/test_cnv_real.py
git commit -m "feat: real infercnvpy CNV score with zero-fallback (replaces stub)"
```

### Task 1.2: Gene-position annotation helper (TDD)

**Files:** Modify `src/rarecellbenchmark/preprocess/gene_annotations.py` (existing fn is `annotate_genes(adata, gene_positions_path)` — reads TSV, fills NaN for unmatched, does NOT drop); Test `tests/preprocess/test_gene_positions.py`.

**Interfaces:** Add new `annotate_gene_positions(adata, gtf_or_table) -> AnnData` that adds `var["chromosome"|"start"|"end"]` and DROPS unmatched genes (unlike existing `annotate_genes` which keeps them with NaN). Or modify `annotate_genes` to add a `drop_unmatched=False` parameter. Check if `configs/grch38_gene_positions.tsv` already exists before creating `data/reference/gene_positions.csv`.

- [ ] **Step 1: Write failing test** with a 3-row fixture `tests/fixtures/gene_pos_tiny.csv` (`gene,chromosome,start,end`); assert matched genes get positions and unmatched are dropped.
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement** — read table, join on `var_names`, drop NaN-position genes, return subset. Source a real GENCODE position table:
  ```bash
  mkdir -p data/reference
  # Check if configs/grch38_gene_positions.tsv already exists — if so, reuse it instead.
  if [ -f "configs/grch38_gene_positions.tsv" ]; then
    echo "Reusing existing configs/grch38_gene_positions.tsv"
  else
    # Download GENCODE v44 GTF and extract gene positions (chr, start, end, gene_name)
    wget -O /tmp/gencode.v44.basic.gtf.gz https://ftp.ebi.ac.uk/pub/databases/gencode/Gencode_human/release_44/gencode.v44.basic.annotation.gtf.gz
    zcat /tmp/gencode.v44.basic.gtf.gz | awk -F'\t' '$3=="gene"{split($9,a,";"); for(i in a){if(a[i]~/gene_name/){gsub(/.*gene_name "|".*/,"",a[i]); gn=a[i]}; if(a[i]~/gene_type/){gsub(/.*gene_type "|".*/,"",a[i]); gt=a[i]}}} {print gn"\t"$1"\t"$4"\t"$5"\t"gt}' | sort -u > data/reference/gene_positions.tsv
  fi
  ```
  Document provenance in the docstring (GENCODE v44, human, basic annotation).
- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** `feat: gene genomic-position annotation for CNV`.

### Task 1.3: Regenerate CNV across all 10 datasets

**Files:** Create `scripts/regenerate_cnv.py` (loops processed `.h5ad` → annotate → CNV → `data/results/revision/cnv_scores/{dataset}_cnv.parquet`).

- [ ] **Step 1: Write the script** (see body in plan §"new analysis scripts"; loops `data/processed/*.h5ad`, skips existing outputs, logs per-dataset time).
- [ ] **Step 2: Smoke-run on smallest dataset** (`breast_ctc_szczerba.h5ad`); assert nonzero CNV count > 0.
- [ ] **Step 3: Full run (CPU-heavy, 0.5–5h):** `.venv/bin/python scripts/regenerate_cnv.py | tee data/results/revision/cnv_scores/regenerate_cnv.log`; expect 10 parquet files.
- [ ] **Step 4: Sanity-check** epithelial mean CNV ≥ immune mean CNV per dataset (script in plan notes). Record table.
- [ ] **Step 5: Commit** `feat: regenerate real per-cell CNV scores for all 10 datasets` (large parquet → git-lfs/DVC or .gitignore + note in PROGRESS).

**Phase 1 exit criteria:** 10 `*_cnv.parquet` with nonzero CNV; epithelial>immune sanity passes; per-dataset mean CNV table in PROGRESS.

---

# PHASE 2 — Zero-prerequisite analyses (R1-1, R1-3, R1-4, R1-5, R1-9)

**Why:** These need only existing predictions + existing `sens*.csv`. Do them first — real rebuttal numbers, no environment risk.

### Task 2.1: R1-1 circularity check
**Files:** add `rederive_hc_labels_no_cnv(...)` to `src/rarecellbenchmark/validate/tiers.py`; `scripts/circularity_check.py` → `data/results/revision/circularity_ranking.csv`; Test `tests/validate/test_rederive_no_cnv.py`.
**Logic:** re-derive HC labels from source+AUCell+kNN (CNV dropped) → relabel each Track-A unit's cells → recompute AP per method from existing prediction scores → Spearman ρ vs `data/results/leaderboard.csv`. High ρ ⇒ rankings robust to dropping CNV.
- [ ] **Step 1:** Write failing test for `rederive_hc_labels_no_cnv` (high sig + high neighbor support → `positive`).
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement helper reusing `score_signatures` (from `validate/signatures.py`) + `compute_neighborhood_purity` (from `validate/neighborhood.py`) + `_extract_source` (from `validate/tiers.py`) (positive = source-positive AND sig≥0.15 AND neighbor≥0.5; CNV omitted). Import from their actual modules, not tiers.py.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Write `scripts/circularity_check.py` (relabel units, recompute AP via `evaluate.metrics.evaluate_predictions`, median per method, Spearman vs published leaderboard) → `circularity_ranking.csv`.
- [ ] **Step 6:** Run; **record the real overall ρ** (do not assume).
- [ ] **Step 7:** Commit `feat: R1-1 CNV circularity ranking-robustness check`.

### Task 2.2: R1-5 CaSee filtered AP
**Files:** `scripts/casee_filtered_ap.py` → `data/results/revision/casee_filtered_leaderboard.csv`.
**Logic:** `results_per_unit.csv` has `is_degenerate`; recompute CaSee median AP excluding its 120 degenerate units vs all-units median.
- [ ] **Step 1:** Write the script (group Track-A per method; `median_ap_all`, `n_degenerate`, `median_ap_excl_degenerate`).
- [ ] **Step 2:** Run `.venv/bin/python scripts/casee_filtered_ap.py | tee data/results/revision/casee_filtered.log`; record CaSee both numbers (n_degenerate≈120).
- [ ] **Step 3:** Commit `feat: R1-5 CaSee degenerate-filtered leaderboard`.

### Task 2.3: R1-9 Cliff's δ
**Files:** add `cliff_delta(a,b)` to `src/rarecellbenchmark/evaluate/statistics.py`; `scripts/compute_cliff_delta.py` → `cliff_delta_matrix.csv`; Test `tests/evaluate/test_cliff_delta.py`.
- [ ] **Step 1:** Failing test (δ=1 dominating, 0 identical, −1 dominated).
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement `cliff_delta = (#a>b − #a<b)/(n*m)`.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Write `scripts/compute_cliff_delta.py` (method×method δ from paired per-unit AP, common units) → matrix CSV.
- [ ] **Step 6:** Run; record key δ (FiRE vs expr_threshold; hvg_logreg vs FiRE).
- [ ] **Step 7:** Commit `feat: R1-9 pairwise Cliff's delta effect sizes`.

### Task 2.4: R1-3 & R1-4 — extract existing sensitivity numbers
**Logic:** `sens2_track_a_vs_b.csv` (A↔B ρ) and `sens3_null_fp.csv` (Track C FPR) already exist; record exact values.
- [ ] **Step 1:** Print both into `data/results/revision/sens2_sens3_extract.txt`; record in PROGRESS.
- [ ] **Step 2:** Commit `docs: extract A-vs-B correlation and Track C FPR for rebuttal`.

**Phase 2 exit:** `circularity_ranking.csv`, `casee_filtered_leaderboard.csv`, `cliff_delta_matrix.csv`, `sens2_sens3_extract.txt` exist; numbers in PROGRESS.

---

# PHASE 3 — CNV-dependent analyses (R1-2, R1-6) — requires Phase 1

### Task 3.1: R1-2 CNV concordance
**Files:** `scripts/cnv_concordance.py` → `data/results/revision/cnv_concordance.csv`.
**Logic:** no CNV gold truth → measure concordance of regenerated CNV (binarized at 75th pct) vs published source malignancy annotation (`cell_type`); report sensitivity/specificity/MCC/AUROC per dataset + overall.
- [ ] **Step 1:** Write the script.
- [ ] **Step 2:** Run; record per-dataset AUROC/MCC.
- [ ] **Step 3:** Commit `feat: R1-2 CNV-vs-source concordance`.

### Task 3.2: R1-6 threshold sensitivity
**Files:** `scripts/threshold_sensitivity.py` → `data/results/revision/threshold_sensitivity.csv`.
**Logic:** hold Phase-1 CNV fixed; vary AUCell {0.10,0.15,0.20} × kNN {0.40,0.50,0.60}; re-derive tiers; recompute Track-A ranking on existing predictions; report `n_P_HC, n_B_HC, spearman_vs_published` per (dataset,aucell,knn).
- [ ] **Step 1:** Write the script (reuse `assign_tiers` with overridden thresholds + fixed CNV).
- [ ] **Step 2:** Run on `crc_lee pdac_peng bcc_yost` first, then all 10 if fast; record ρ range.
- [ ] **Step 3:** Commit `feat: R1-6 label-threshold sensitivity analysis`.

**Phase 3 exit:** `cnv_concordance.csv` + `threshold_sensitivity.csv` with real numbers in PROGRESS.

---

# PHASE 4 — Track F intra-lineage (R3-5)

**Why:** R3's one empirical demand. Background = normal-diploid epithelial only; positives = malignant epithelial spiked at 0.1%/0.5%/1%. 4A core baselines (no prereq, R3-2/R3-4 evidence) → 4B full 10 (Phase 0 + GPU).

### Task 4.1: Track F unit generator (TDD)
**Files:** `src/rarecellbenchmark/tracks/track_f_generator.py`; Test `tests/tracks/test_track_f_generator.py`.
**Interfaces:** `TrackFGenerator.generate(adata, malignant_mask, normal_epi_mask, prevalences=(0.001,0.005,0.01), unit_size=2000, n_replicates=5, seed=42) -> list[unit]`, mirroring `track_a_generator` output (`.h5ad` + `*_labels.parquet` with `true_label`).
- [ ] **Step 1:** Failing test — 0.1% unit of 2000 has exactly 2 positives, ~1998 background all from `normal_epi_mask`, dup fraction < 0.20, labels ∈ {positive,background}.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement reusing `tracks/base.py` + `tracks/seeding.py` (positives from `malignant_mask`, background from `normal_epi_mask`, <20% dup cap).
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat: Track F intra-lineage unit generator`.

### Task 4.2: Track F orchestrator + masks (4A core)
**Files:** `scripts/run_track_f.py`.
**Logic:** for `crc_lee`,`pdac_peng`: `malignant_mask` = epithelial ∩ existing P_HC positives; `normal_epi_mask` = epithelial ∩ `tissue_origin==normal`; delete non-epithelial; generate units; run `--methods` (default native baselines); evaluate → `data/results/revision/track_f/track_f_results.csv`.
- [ ] **Step 1:** Verify masks non-empty (script in plan notes). If `pdac_peng` lacks normal epithelium, substitute `hnscc_puram`; record substitution.
- [ ] **Step 2:** Write `scripts/run_track_f.py` with `--datasets` and `--methods` flags; units under `data/tracks/f/...`; predictions under `data/predictions/{method}/...track_f...`.
- [ ] **Step 3 (4A core): Run native baselines** `--methods random_baseline expr_threshold hvg_logreg`. **Key checks:** expr_threshold collapses toward chance; hvg_logreg ceiling drops below 1.0. Record — the R3-2 evidence.
- [ ] **Step 4:** Commit `feat: R3-5 Track F orchestrator + core-baseline results`.

### Task 4.3 (4B): Full 10-method Track F — routed via CPU and GPU VMs

**Defer-fallback:** IF the GPU VM is not available by the time you reach this task, skip Steps 2–5 for DeepScena. Record `status=deferred` for DeepScena in `track_f_results.csv`. Proceed to Step 5 with the 9 CPU-runnable methods. **Never fabricate DeepScena's Track F numbers.** Phases 5–8 can proceed without DeepScena — the R3-2 ceiling-drop evidence comes from hvg_logreg (4A core) and does NOT depend on GPU.

**GPU routing:** CPU-runnable (after External-Methods restore): FiRE, cellsius, scCAD, RareQ, scMalignantFinder, CaSee. GPU-dependent: DeepScena only. (CaSee wrapper has `supports_gpu=False` and a CPU fallback — runs on this VM, slower but correct.)

- [ ] **Step 1: Execute CPU-runnable methods locally on this CPU VM**
Run:
```bash
.venv/bin/python scripts/run_track_f.py --methods FiRE scCAD cellsius RareQ scMalignantFinder CaSee
```

- [ ] **Step 2a: Provision the GPU VM from scratch**

On your fresh GPU VM (e.g. GCP n1-standard-4 + NVIDIA T4):

```bash
# 1. Clone the repo
git clone <your-repo-url> ~/reach-rarecell-benchmark-test
cd ~/reach-rarecell-benchmark-test
git checkout revision/frontiers-r1

# 2. Create Python venv (>=3.11)
python3.11 -m venv .venv
.venv/bin/pip install --upgrade pip

# 3. Install the package in dev mode
.venv/bin/pip install -e '.[dev]'

# 4. Install CUDA-enabled PyTorch (DeepScena requires CUDA)
.venv/bin/pip install torch --index-url https://download.pytorch.org/whl/cu121

# 5. Install scanpy (DeepScena wrapper imports it)
.venv/bin/pip install scanpy

# 6. Restore ONLY DeepScena from External-Methods (not all 7 methods)
mkdir -p External-Methods/DeepScena
git clone --depth 1 https://github.com/shaoqiangzhang/DeepScena.git External-Methods/DeepScena/DeepScena-1.0.1

# 7. Verify DeepScena entry files exist (wrapper checks these at deepscena.py:240-241)
ls External-Methods/DeepScena/DeepScena-1.0.1/DeepScena.py External-Methods/DeepScena/DeepScena-1.0.1/Network.py

# 8. Verify CUDA is available
.venv/bin/python -c "import torch; print('CUDA available:', torch.cuda.is_available()); print('Device:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU ONLY')"
```

NOTE: R/renv is NOT needed on the GPU VM — DeepScena is Python-only.
NOTE: `data/processed/*.h5ad` and `*_labels.parquet` are NOT needed on the GPU VM. Labels are only used at evaluation, which runs on the CPU VM (Step 5).

- [ ] **Step 2: Transfer Track F units to the GPU VM**
Only DeepScena needs the GPU VM (CaSee runs on this CPU VM in Step 1).

Option A — GCP bucket (recommended for cross-cloud transfer):
```bash
# On this CPU VM — upload units and code:
gcloud auth login
gsutil mb -l us-central1 gs://reach-track-f-transfer    # one-time bucket creation
gsutil -m rsync -r data/tracks/f gs://reach-track-f-transfer/tracks-f
gsutil -m rsync -r src gs://reach-track-f-transfer/src
gsutil -m rsync -r scripts gs://reach-track-f-transfer/scripts
gsutil -m rsync -r configs gs://reach-track-f-transfer/configs
gsutil cp pyproject.toml gs://reach-track-f-transfer/pyproject.toml
gsutil cp requirements/full.txt gs://reach-track-f-transfer/requirements-full.txt

# On the GPU VM — download:
gcloud auth login
mkdir -p ~/reach-rarecell-benchmark-test/data/tracks/f
gsutil -m rsync -r gs://reach-track-f-transfer/tracks-f ~/reach-rarecell-benchmark-test/data/tracks/f
```

Option B — rsync/scp (if VMs are on the same network):
```bash
rsync -avz data/tracks/f/ your-gpu-vm-ip:~/reach-rarecell-benchmark-test/data/tracks/f/
rsync -avz scripts/run_track_f.py your-gpu-vm-ip:~/reach-rarecell-benchmark-test/scripts/
rsync -avz configs/ your-gpu-vm-ip:~/reach-rarecell-benchmark-test/configs/
```

Files the GPU VM needs: `data/tracks/f/**`, `src/`, `scripts/run_track_f.py`, `configs/**`, `pyproject.toml`, `requirements/`.
Files the GPU VM does NOT need: `data/processed/*.h5ad`, `*_labels.parquet`, `data/results/`.

- [ ] **Step 3: Run DeepScena on the GPU VM**
On your GPU VM (where GPU is available), execute:
```bash
.venv/bin/python scripts/run_track_f.py --methods DeepScena
```

- [ ] **Step 4: Sync predictions back to this CPU VM**
Transfer the generated predictions and runmeta files back to this CPU VM:
```bash
# Option A — GCP bucket:
gsutil -m rsync -r gs://reach-track-f-transfer/predictions/DeepScena data/predictions/DeepScena
# (run on GPU VM first: gsutil -m rsync -r data/predictions/DeepScena gs://reach-track-f-transfer/predictions/DeepScena)

# Option B — rsync:
rsync -avz your-gpu-vm-ip:~/reach-rarecell-benchmark-test/data/predictions/DeepScena/ data/predictions/DeepScena/
```

- [ ] **Step 4b: Verify synced predictions are real and non-corrupt**
Before evaluation, verify every DeepScena prediction file is valid:
```bash
.venv/bin/python -c "
import pandas as pd, anndata as ad, os, glob, sys
track_f_dir = 'data/tracks/f'
pred_dir = 'data/predictions/DeepScena'
errors = []
for unit_h5ad in glob.glob(f'{track_f_dir}/**/*.h5ad', recursive=True):
    unit_id = os.path.basename(unit_h5ad).replace('.h5ad','')
    pred_file = os.path.join(pred_dir, unit_id, 'predictions.csv')
    if not os.path.exists(pred_file):
        errors.append(f'MISSING: {pred_file}')
        continue
    df = pd.read_csv(pred_file)
    adata = ad.read_h5ad(unit_h5ad)
    if len(df) != adata.n_obs:
        errors.append(f'LENGTH MISMATCH: {pred_file} has {len(df)} rows, expected {adata.n_obs}')
    if df['score'].isna().any():
        errors.append(f'NaN SCORES: {pred_file}')
    if not df['cell_id'].equals(pd.Series(adata.obs_names)):
        errors.append(f'CELL_ID MISMATCH: {pred_file}')
if errors:
    print('PREDICTION INTEGRITY ERRORS:'); [print(f'  {e}') for e in errors]; sys.exit(1)
else:
    print(f'All DeepScena prediction files verified OK')
"
```
If this fails, re-run the affected units on the GPU VM or mark them deferred.

- [ ] **Step 5: Run post-evaluation on this CPU VM**
With all predictions synced back locally, run evaluation to consolidate results:
```bash
.venv/bin/python scripts/run_track_f.py --evaluate-only
```

- [ ] **Step 6: Commit**
```bash
git add data/predictions/
git commit -m "feat: R3-5 Track F full method predictions (synced from GPU VM)"
```

**Phase 4 exit:** `track_f_results.csv` with ≥3 baselines on ≥2 datasets; collapse/ceiling-drop recorded; GPU status documented. 4B/DeepScena may be deferred per the Task 4.3 defer-fallback — Phase 4 exits with 9/10 methods if DeepScena is deferred.

---

# PHASE 4-NEW — Push R1-2 and R3-5 from "disclosed limitation" to 100%

> **Added 2026-06-22 after the Phase 0–8 verification pass.** Two points are currently only *mitigated-and-disclosed*, not fully resolved:
> - **R1-2 (~85%)** — `hnscc_puram` CNV is all-zeros (AUROC 0.500) because its `cell_type` labels don't match infercnvpy's reference categories, dragging overall AUROC to 0.731.
> - **R3-5 (~70%, the weakest point)** — Track F runs on a **single dataset** (`crc_lee`) with **83% duplicate background cells** (340-cell pool resampled to 2000).
>
> This phase closes both. **Each task has a documented GO/NO-GO gate:** if the data genuinely cannot support the fix, the task converts the result into an *honest, explicitly-bounded* exclusion rather than a fabricated improvement. Never invent a dataset, a label, or a number.
>
> **Source-of-truth rule still applies:** every new number must come from a regenerated file under `data/results/revision/`.

## Task 4N.1: R1-2 → 100% — repair `hnscc_puram` CNV reference set

**Why:** infercnvpy returned zeros for `hnscc_puram` because no cells matched the default reference categories (`T cells`, `B cells`, …). Its real labels are singular/abbreviated (`"Fibroblast"`, `"T cell"`, `"0.0"`). Supplying the correct reference categories should yield real CNV and lift both its per-dataset AUROC and the overall concordance.

**Files:** `scripts/regenerate_cnv.py` (or a one-off `scripts/fix_hnscc_cnv.py`); re-run `scripts/cnv_concordance.py`. Possibly extend `_DEFAULT_REFERENCE_CATS` in `src/rarecellbenchmark/validate/cnv.py` to include singular forms.

- [ ] **Step 1 (GO/NO-GO gate): Inspect the real labels.**
```bash
.venv/bin/python -c "import anndata as ad; a=ad.read_h5ad('data/processed/hnscc_puram.h5ad'); print(a.obs['cell_type'].value_counts())"
```
**GO** if ≥1 clearly non-malignant population exists (Fibroblast / T cell / B cell / Macrophage / Endothelial / Mast / Dendritic). **NO-GO** if every cell is malignant or unlabeled (`"0.0"` only) → skip to Step 5-NoGo.

- [ ] **Step 2: Re-run CNV for `hnscc_puram` only**, passing explicit `reference_cats` built from the non-malignant labels found in Step 1 (singular forms). Assert the output is nonzero:
```bash
.venv/bin/python - <<'PY'
# load hnscc_puram, annotate gene positions, compute_cnv_score(adata, reference_cats=[...actual labels...])
# assert (cnv != 0).mean() > 0.5 ; write data/results/revision/cnv_scores/hnscc_puram_cnv.parquet
PY
```
Also add the matched singular forms to `_DEFAULT_REFERENCE_CATS` so the fix is permanent and reproducible (not a one-off arg).

- [ ] **Step 3: Re-run concordance** `.venv/bin/python scripts/cnv_concordance.py`; record the **new `hnscc_puram` AUROC/MCC** and the **new overall AUROC/MCC** (overall was 0.731). Paste both into PROGRESS.

- [ ] **Step 4: Commit** `fix: repair hnscc_puram CNV reference categories (R1-2)`.

- [ ] **Step 5-NoGo (only if Step 1 = NO-GO):** Drop `hnscc_puram` from the concordance table (9→8 datasets), recompute overall AUROC on the 8 datasets that have valid references, and rewrite the R1-2 text to state it as an explicit data-availability exclusion. Commit `docs: exclude hnscc_puram from CNV concordance (no reference cells available)`.

## Task 4N.2: R3-5 → 100% — add a second Track F dataset and cut duplication

**Why:** A single-dataset, 83%-duplicate Track F is the one result a strict Reviewer 3 can still reject. Closing this needs (a) ≥1 additional dataset, and (b) duplication driven below the generator's intended 20% cap.

**Files:** `scripts/run_track_f.py`, `src/rarecellbenchmark/tracks/track_f_generator.py`.

- [ ] **Step 1 (GO/NO-GO gate): Audit all 10 datasets for Track F eligibility.**
```bash
.venv/bin/python - <<'PY'
import anndata as ad, glob, os
for p in sorted(glob.glob('data/processed/*.h5ad')):
    a = ad.read_h5ad(p); obs = a.obs
    epi = obs.get('cell_type', '').astype(str).str.contains('pithel').sum()
    has_origin = 'tissue_origin' in obs.columns
    normal = (obs['tissue_origin'].astype(str).str.contains('ormal').sum() if has_origin else 0)
    print(f"{os.path.basename(p):24s} epithelial={epi:6d} tissue_origin={has_origin} normal_cells={normal}")
PY
```
**GO** if ≥1 dataset besides `crc_lee` has both epithelial cells and a normal-tissue background. **NO-GO** if none do → Step 2b (marker-based) → if that also fails, Step 5-NoGo.

- [ ] **Step 2a: Add the qualifying dataset(s)** to `run_track_f.py --datasets crc_lee <new>`; build malignant/normal-epi masks the same way (`tissue_origin`-based).

- [ ] **Step 2b (fallback if no second dataset has `tissue_origin`): marker-based normal epithelium.** Identify normal epithelial background as epithelial cells that are (i) `EPCAM+`, (ii) low CNV burden (bottom tercile of the Phase-1 `cnv_score`), and (iii) source-negative. Document the heuristic and its thresholds in the script docstring and FIGURE/MANUSCRIPT change docs. This is a *defined, reproducible* proxy — not a guess.

- [ ] **Step 3: Reduce duplication** in `track_f_generator.py`: sample background **without replacement**, capping `unit_size` at the available unique-background pool (e.g. `unit_size = min(2000, n_unique_background / (1 - prevalence))`). Target dup fraction < 0.20 (the original design cap). If a dataset's pool is too small for 2000, emit smaller units and record the real N per unit.

- [ ] **Step 4: Re-run Track F** for all 10 methods on the new/expanded units (CPU methods locally; DeepScena predictions already exist — re-run only if its units changed, else mark carried-over). Verify prediction integrity (length, no-NaN, cell_id match) as in Phase 4 Task 4.3 Step 4b.

- [ ] **Step 5: Commit** `feat: Track F second dataset + without-replacement sampling (R3-5)`.

- [ ] **Step 5-NoGo (only if Step 1 AND 2b fail):** Keep single-dataset Track F, but tighten the limitation text to state it is a **hard data-availability ceiling** (no other REACH dataset has normal-epithelial annotations even by markers), and report the duplication-reduction from Step 3 alone (smaller units, lower dup) as the partial improvement. Commit `docs: bound Track F single-dataset limitation as data ceiling`.

## Downstream re-run cascade (which master-plan phases to re-run)

Because both fixes change result files, the later phases must be **re-run, in this order** (this is the answer to "from which phase?" — **start at Phase 5**, plus the two targeted upstream sub-steps):

| Trigger | Re-run | Why |
|---|---|---|
| 4N.1 (hnscc CNV) | **Phase 1 (hnscc only)** → **Phase 3.1** | new CNV parquet → new concordance/overall AUROC |
| 4N.2 (Track F) | **Phase 4 evaluate** | new units/predictions |
| both | **Phase 5.1 + 5.2** | rebuild `track_f_leaderboard.csv`, `track_a_vs_f_comparison.csv`, `REVISION_RESULTS_INDEX.md`, freeze new snapshot |
| both | **Phase 6.2 + 6.3** | regenerate **Fig11** (now ≥2 datasets, lower dup) and Fig9 Track F panel + captions |
| both | **Phase 7.1** | update R1-2 AUROC, R3-4/R3-5 numbers; soften/remove the single-dataset + 83%-duplicate caveats; update `RESPONSE_TO_REVIEWERS.md` |
| both | **Phase 8 (all gates)** | pytest/ruff/mypy/smoke green + numbers-consistency (every cited file matches) |

> Phases 0, 2, and 3.2 are **unaffected** and must NOT be re-run.

**Phase 4-NEW exit criteria:**
- R1-2: `hnscc_puram` CNV nonzero (or honest 8-dataset exclusion); new overall AUROC recorded in PROGRESS.
- R3-5: Track F covers ≥2 datasets (or documented data-ceiling) AND duplication < 20% on at least the new units.
- Phases 5→8 re-run; `REVISION_RESULTS_INDEX.md` and `RESPONSE_TO_REVIEWERS.md` reflect the new numbers; Phase 8 numbers-consistency = `MISSING SOURCE FILES: none`.

---

# PHASE 5 — Result consolidation

### Task 5.1: Track F leaderboard + A-vs-F comparison
**Files:** `scripts/consolidate_revision_results.py` → `track_f/track_f_leaderboard.csv`, `track_a_vs_f_comparison.csv`.
- [ ] **Step 1:** Write script (median AP per method/prevalence; join vs `data/results/leaderboard.csv`; `method_id, track_a_median_ap, track_f_median_ap_0.1pct, delta`).
- [ ] **Step 2:** Run; expect table showing which methods dropped.
- [ ] **Step 3:** Commit `feat: consolidate Track F leaderboard and A-vs-F comparison`.

### Task 5.2: Revision results index + snapshot
- [ ] **Step 1:** Create `data/results/revision/REVISION_RESULTS_INDEX.md` — table: reviewer point → output file → key number (single source of truth for Phase 7).
- [ ] **Step 2:** Freeze `data/results/snapshots/paper_v2_revision/` (changed CSVs + new revision CSVs).
- [ ] **Step 3:** Commit `docs: revision results index + frozen v2 snapshot`.

**Phase 5 exit:** `REVISION_RESULTS_INDEX.md` lists every point with a real number + path.

---

# PHASE 6 — Figure regeneration + caption instructions

**Figures:** Fig0 Heatmap, Fig1 Leaderboard, Fig2 Sensitivity, Fig3 Critical Difference, Fig4 AP-Prevalence, Fig5 Track C Null, Fig6 Runtime Pareto, Fig7 Rank Forest, Fig8 Pipeline, Fig9 Track Design, Fig10 QC Audit, FigA1 DeepScena.

### Task 6.1: Determine change-set
- [ ] **Step 1:** Logic — **Fig9 Track Design** add Track F; **Fig8 Pipeline** show real CNV arm + new analyses; **new Fig11 Track F** (Track A vs F AP per method). Fig1/3/7 change only if Phase 2/5 reranks (check `circularity_ranking.csv` + `casee_filtered_leaderboard.csv`; if ranks unchanged, leave). Record change-set.

### Task 6.2: Regenerate / add figures
- [ ] **Step 1:** Add `src/rarecellbenchmark/figures/track_f.py` (Track A vs F median AP per method, `figures/leaderboard.py` style); wire into `scripts/generate_figures.py`.
- [ ] **Step 2:** `.venv/bin/rcb figures | tee data/results/revision/figures.log`.
- [ ] **Step 3:** Copy changed figures to `manuscript_revision/images/`.
- [ ] **Step 4:** Commit `feat: regenerate figures incl. Track F; stage manuscript images`.

### Task 6.3: Write `manuscript_revision/FIGURE_CHANGES.md`
- [ ] **Step 1:** Per changed/new figure: ID, what changed + why (reviewer point), new path, **new caption text** with R1-11 detail ("N = X common units after fallback filtering; datasets included: …") computed from `results_per_unit.csv`.
- [ ] **Step 2:** Commit `docs: figure change + caption instructions for author`.

**Phase 6 exit:** figures regenerated; Track F figure exists; `FIGURE_CHANGES.md` lists every edit + new caption.

---

# PHASE 7 — Manuscript text change instructions (author applies by hand)

**Source-of-truth rule:** every replacement sentence with a number cites the file+value from `REVISION_RESULTS_INDEX.md`. Agents do NOT edit `paper.md`.

### Task 7.1: Generate the manuscript change document
- [ ] **Step 1:** For each reviewer point, write a block in `MANUSCRIPT_CHANGES.md`: point, `paper.md` section + approx line, current text quoted, replacement/addition, source file. Cover:
  - **R3-1:** Abstract (L9) + Contributions (L19) + Evaluation Tracks (L47) — reframe to "rare malignant-cell detection in heterogeneous TME (MRD/CTC/low-purity analog), imbalanced ranking — not intra-lineage sub-state discovery."
  - **R3-2:** Supervised Ceiling Justification (L109) — inter-lineage-variance concession + Track F number (`track_a_vs_f_comparison.csv`).
  - **R3-3:** Limitations (L158) — TME-FP scope-choice paragraph.
  - **R3-4/R3-5:** new Track F subsection under Evaluation Tracks (L47) + results paragraph after Primary Leaderboard (L115) citing `track_f_leaderboard.csv`.
  - **R1-1:** Limitations (L158) — robustness statement citing `circularity_ranking.csv` ρ.
  - **R1-2:** Limitations (L160) — replace single-caller sentence with concordance result (`cnv_concordance.csv`); **delete the "intersection breaks ultra-rare units" argument**.
  - **R1-3:** Track B justification citing `sens2`.
  - **R1-4:** Key Statistical Results (L132) — Track C FPR framing citing `sens3`.
  - **R1-5:** Primary Leaderboard (L115) + Method Inclusion (L80) — CaSee exploratory rationale + filtered AP (`casee_filtered_leaderboard.csv`).
  - **R1-6:** Limitations (L158) — threshold-robustness citing `threshold_sensitivity.csv`.
  - **R1-8:** Reproducibility (L202) — compute-environment paragraph citing `environment_capture.txt`.
  - **R1-9:** Key Statistical Results (L132) — effect sizes citing `cliff_delta_matrix.csv`.
  - **R1-10:** Supervised Ceiling Justification (L109) — separability-bound nuance (pairs R3-2).
  - **R1-11:** handled in `FIGURE_CHANGES.md`.
- [ ] **Step 2:** Write `manuscript_revision/RESPONSE_TO_REVIEWERS.md` — one numbered reply per point, quoting the change + file/figure evidence.
- [ ] **Step 3:** Commit `docs: manuscript change instructions + response-to-reviewers letter`.

**Phase 7 exit:** `MANUSCRIPT_CHANGES.md` covers all 15 with quoted current text + replacement + source; `RESPONSE_TO_REVIEWERS.md` complete.

---

# PHASE 8 — QA / integration testing

### Task 8.1: Gates
- [ ] **Step 1:** `.venv/bin/pytest -q` (pass), `.venv/bin/ruff check .` (clean), `.venv/bin/mypy src/rarecellbenchmark/validate/cnv.py src/rarecellbenchmark/tracks/track_f_generator.py`, `.venv/bin/rcb smoke-test`.

### Task 8.2: Numbers-consistency (anti-fabrication)
- [ ] **Step 1:** Verify every file cited in `MANUSCRIPT_CHANGES.md` exists under `data/results/revision/` (script in plan §8.2). Expected: `MISSING SOURCE FILES: none`.

### Task 8.3: Reviewer reproduce-check + push
- [ ] **Step 1:** Run Phase-3 on one dataset; assert nonzero CNV in tier report; confirm `setup_external_methods.sh` exists.
- [ ] **Step 2:** `git add -A && git commit -m "test: revision QA gates green; bundle consistent" && git push -u origin revision/frontiers-r1`.

**Phase 8 exit:** gates green; no missing sources; branch pushed.

---

## Self-review coverage

R1-1→2.1 · R1-2→3.1 · R1-3→2.4 · R1-4→2.4 · R1-5→2.2 · R1-6→3.2 · R1-8→0.2+7.1 · R1-9→2.3 · R1-10→7.1 · R1-11→6.3 · R3-1→7.1 · R3-2→4.2+7.1 · R3-3→7.1 · R3-4→4+7.1 · R3-5→4. Prereqs: CNV→Phase1, env/GPU/methods→Phase0. All 15 + prereqs covered.

## GPU / "cannot run here" summary

- **CPU-only, run here:** infercnvpy (CNV), random_baseline, expr_threshold, hvg_logreg, FiRE, cellsius, scCAD, RareQ, scMalignantFinder, CaSee (supports_gpu=False, CPU fallback in wrapper).
- **GPU-dependent:** DeepScena only (runner hard-exits if torch.cuda.is_available() is False). If this VM has no GPU (Task 0.2), run DeepScena on a GPU host/GCP VM/Colab, or report Track F for the other 9 methods and mark DeepScena deferred — **never fabricate its Track F numbers.**
- **Env install path:** the GHCR Docker image is a clean base but does NOT bundle infercnvpy or External-Methods — Phase 0.3/0.4 installs are still required (in container or venv). Without Docker: `pip install -e '.[dev]'` + `pip install infercnvpy` + `setup/setup_external_methods.sh` + R/renv restore.
