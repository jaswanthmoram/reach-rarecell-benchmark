# Extending the Benchmark - Contributing a New Method

This guide is for **external contributors** who want to add a new rare-cell detection method to the REACH Benchmark.

---

## 1. Fork the repository

1. Fork `https://github.com/jaswanthmoram/reach-rarecell-benchmark` on GitHub.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/reach-rarecell-benchmark.git
   cd reach-rarecell-benchmark
   python -m venv .venv
   source .venv/bin/activate
   pip install -e '.[dev]'
   ```

---

## 2. Copy the template

```bash
cp src/rarecellbenchmark/methods/TEMPLATE_new_method.py src/rarecellbenchmark/methods/ranked/my_method.py
cp configs/methods/TEMPLATE_new_method.yaml configs/methods/my_method.yaml
```

The template provides:
- A `run(input_h5ad, output_dir, config)` function signature.
- `predictions.csv` writer with correct columns (`cell_id`, `score`, `pred_label`).
- `runmeta.json` writer with required keys.
- A `try/except` scaffold that catches `MemoryError` and `TimeoutError` and writes `failure.json`.

---

## 3. Implement the wrapper

Open \`src/rarecellbenchmark/methods/ranked/my_method.py\` and fill in the \`# IMPLEMENT\` sections.

### Minimal contract

Your `run()` function must:

1. **Read** the blind expression matrix from `input_h5ad`.
2. **Compute** a continuous score per cell (higher = more likely malignant/rare).
3. **Write** `predictions.csv` to `output_dir/` with columns `cell_id, score, pred_label`.
4. **Write** `runmeta.json` to `output_dir/` with at least:
   - `method`
   - `version`
   - `runtime_seconds`
   - `peak_ram_mb`
   - `success`
   - `n_cells`
   - `fidelity` (`faithful` | `proxy` | `fallback`)
   - `is_degenerate`

### Example skeleton

```python
def run(input_h5ad: str, output_dir: str, config: dict) -> None:
    import anndata as ad
    import numpy as np
    import pandas as pd
    import json
    import time
    import tracemalloc

    tracemalloc.start()
    t0 = time.time()

    adata = ad.read_h5ad(input_h5ad)
    n_cells = adata.n_obs

    # IMPLEMENT: replace with actual method logic
    scores = np.random.rand(n_cells)
    pred_labels = (scores > 0.5).astype(int)

    runtime = time.time() - t0
    _, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()

    out_csv = Path(output_dir) / "predictions.csv"
    out_csv.parent.mkdir(parents=True, exist_ok=True)
    pd.DataFrame({
        "cell_id": adata.obs_names,
        "score": scores,
        "pred_label": pred_labels,
    }).to_csv(out_csv, index=False)

    out_meta = Path(output_dir) / "runmeta.json"
    with open(out_meta, "w") as f:
        json.dump({
            "method": "my_method",
            "version": "1.0.0",
            "runtime_seconds": round(runtime, 2),
            "peak_ram_mb": round(peak / 1024 / 1024, 2),
            "success": True,
            "n_cells": n_cells,
            "fidelity": "faithful",
            "is_degenerate": False,
        }, f, indent=2)
```

---

## 4. Register the method

Edit `src/rarecellbenchmark/methods/registry.py` and add an entry:

```python
METHOD_REGISTRY = {
    # ... existing methods ...
    "my_method": {
        "module": "src.rarecellbenchmark.methods.ranked.my_method",
        "category": "ranked",
        "language": "python",
        "gpu": False,
        "yaml": "configs/methods/my_method.yaml",
    },
}
```

Edit `configs/methods/my_method.yaml`:

```yaml
method_id: my_method
display_name: "My Method"
citation: "Author et al., Journal Year"
repository: "https://github.com/author/my_method"
category: ranked
fidelity: faithful
gpu: false
runtime_limit_seconds: 3600
```

---

## 5. Provide test evidence

Before opening a pull request, you **must** supply:

### a) Interface test output
```bash
pytest tests/test_method_interface.py -q
```
Attach the terminal output showing **all tests passed**.

### b) Smoke-test log
```bash
rcb smoke-test --method my_method
```
Or run on a single Track A unit:
```bash
rcb run-method \
    --method my_method \
    --unit data/tracks/a/bcc_yost/T1/bcc_yost_track_a_T1_rep01_expression.h5ad \
    --outdir results/my_method/test/
```

Attach:
- `results/my_method/test/runmeta.json`
- `results/my_method/test/predictions.csv` (first 10 lines)

---

## 6. Run on the full benchmark (optional but recommended)

Once smoke tests pass, you may evaluate on the full benchmark locally:

```bash
python scripts/run_methods.py \
    --config configs/protocol_version.yaml \
    --methods my_method \
    --tracks A B C D E
```

Then regenerate evaluation and figures:

```bash
python scripts/evaluate_results.py
python scripts/phase11_statistics.py --n-boot 2000
python scripts/generate_figures.py
```

If your method improves median AP on Track A for ≥3 datasets relative to the current best published method, highlight this in your PR description.

---

## 7. Open a pull request

### PR checklist

- [ ] Fork created and feature branch used (`git checkout -b add-my-method`).
- [ ] Wrapper code follows the minimal contract above.
- [ ] YAML config includes `method_id`, `citation`, `repository`, and `category`.
- [ ] `METHOD_REGISTRY` updated in `src/rarecellbenchmark/methods/registry.py`.
- [ ] `pytest tests/test_method_interface.py -q` passes (attach output).
- [ ] Smoke-test log attached (`runmeta.json` + `predictions.csv` preview).
- [ ] No secrets, large binary files, or dataset outputs committed.
- [ ] `CHANGELOG.md` updated with a one-line description.

### Review timeline

We aim to review external method PRs **within 5-7 business days**. Reviews focus on:
- Contract compliance (`predictions.csv` and `runmeta.json` schema).
- Reproducibility (determinism, seed handling, dependency pinning).
- Scientific transparency (fidelity declaration, fallback handling).

If changes are requested, please respond within **14 days** to keep the PR active.

---

## Tips

- **Memory:** If your method uses >8 GB on a 40k-cell dataset, wrap it with `adaptive_chunk_runner` from `src/shared/adaptive.py`.
- **Timeouts:** Set `runtime_limit_seconds` realistically. The orchestrator kills jobs that exceed this limit.
- **Determinism:** Use the `seed` key from the method YAML or unit manifest for reproducible random initialisation.
- **Logging:** Write verbose logs to `output_dir/log.txt` if needed; Phase 11 ignores them but they help debugging.

---

*Next: [Adding a New Dataset](adding_new_dataset.md)*
