# Troubleshooting

Common issues encountered when setting up or running REACH, and their resolutions.

---

## 1. Missing R or R package errors

**Symptom:**
```
Error: Rscript not found
Error in library(FiRE): there is no package called 'FiRE'
```

**Resolution:**
```bash
# Install R 4.3+
sudo apt-get install r-base r-base-dev  # Ubuntu/Debian
brew install r                          # macOS

# Install benchmark R packages
Rscript setup/setup_r_packages.R
```

If a specific package fails to compile, ensure you have build tools:
```bash
sudo apt-get install build-essential libcurl4-openssl-dev libssl-dev libxml2-dev
```

---

## 2. Out-of-memory (OOM) crashes

**Symptom:**
```
MemoryError
Killed (process terminated by OS)
```

**Resolution:**
- **Use chunked execution.** Wrap heavy R methods with `adaptive_chunk_runner` from `src/shared/adaptive.py`. It partitions large datasets into ≤10,000-cell chunks while preserving biological neighbourhoods.
- **Reduce concurrent workers.** If running Phase 10 with `--workers 8`, drop to `--workers 2` for memory-heavy methods (CopyKAT, scATOMIC, CaSee).
- **Increase swap.** On cloud VMs:
  ```bash
  sudo fallocate -l 32G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  ```

---

## 3. Timeout errors

**Symptom:**
```
TimeoutError: Method exceeded 3600s limit
```

**Resolution:**
- Increase `runtime_limit_seconds` in the method's YAML config (e.g. from 3600 to 7200).
- Use chunked execution for methods that scale super-linearly.
- For GPU methods, ensure CUDA is available; CPU fallback is much slower:
  ```bash
  python -c "import torch; print(torch.cuda.is_available())"
  ```

---

## 4. Checksum mismatch after preprocessing

**Symptom:**
```
AssertionError: SHA-256 mismatch for pdac_peng.h5ad
```

**Resolution:**
Checksums are sensitive to:
- Scanpy / anndata version differences
- Floating-point non-determinism in PCA
- OS-level random seed differences

**Do not panic.** The benchmark is designed to tolerate minor checksum shifts:
1. Check that your environment matches `setup/frozen-requirements.txt`.
2. If you intentionally changed preprocessing, delete the old checksum in `configs/datasets.yaml` and run:
   ```bash
   python scripts/run_preprocess3.py --config configs/datasets.yaml
   ```
3. The new checksum will be written automatically.

---

## 5. Label branch setup (Git)

**Symptom:**
```
fatal: 'labels' does not appear to be a git repository
```

**Context:** Ground-truth labels and track-unit files are large generated artifacts and are not committed to this source repository.

**Resolution:**
Place regenerated or archived track-unit files under `data/tracks/`.

If you are only running the toy-data workflow, you do not need label archives. Public large-data archives are pending the first REACH release.

---

## 6. Docker permission errors

**Symptom:**
```
permission denied while trying to connect to the Docker daemon
```

**Resolution:**
```bash
sudo usermod -aG docker $USER
newgrp docker
docker compose up
```

---

## 7. Missing external method repositories

**Symptom:**
```
ModuleNotFoundError: No module named 'DeepScena'
FileNotFoundError: External-Methods/DeepScena/DeepScena.py
```

**Resolution:**
```bash
bash setup/setup_external_methods.sh
```

If a repository is unavailable (e.g. GitHub downtime), the wrapper should fall back to a `proxy` or `fallback` fidelity flag and continue execution.

---

## 8. Phase 11 evaluation crashes with "No predictions found"

**Symptom:**
```
ValueError: No prediction CSVs found for method='FiRE'
```

**Resolution:**
- Ensure Phase 10 completed for that method:
  ```bash
  ls results/FiRE/ | wc -l
  ```
- If you only want to evaluate a subset, pass `--methods`:
  ```bash
  python scripts/evaluate.py --methods random_baseline expr_threshold hvg_logreg
  ```

---

## 9. Figures render with missing fonts

**Symptom:** PDF figures show squares instead of letters.

**Resolution:**
```bash
# Ubuntu/Debian
sudo apt-get install msttcorefonts
rm -rf ~/.cache/matplotlib
```

Or set a fallback font in `matplotlibrc`:
```python
import matplotlib
matplotlib.rcParams['font.family'] = 'DejaVu Sans'
```

---

## 10. Still stuck?

1. Check `docs/` for the latest version of this document.
2. Search closed issues on GitHub.
3. Open a new issue with:
   - The exact command you ran.
   - The full traceback.
   - `python -m pip list` output.
   - `rcb --version` output.

---

*Next: [Reproducibility](reproducibility.md)*
