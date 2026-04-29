"""
REACH - Ranked Method: FiRE
========================================
Runs FiRE (Finder of Rare Entities) on an AnnData object.
FiRE outputs a rarity score per cell (higher = more rare).

Install:
    # In R:
    install.packages('FiRE')  # from CRAN

Note: The Python version of FiRE requires compiling Cython/C++ extensions
which is difficult on Windows. We use the R version via Rscript instead.
"""

from __future__ import annotations

import logging
import os
import subprocess
import tempfile
from pathlib import Path

import numpy as np
import pandas as pd

from rarecellbenchmark.methods.base import BaseMethodWrapper, MethodRunResult, validate_predictions
from rarecellbenchmark.methods.common import load_blind_adata, write_predictions, write_runmeta
from rarecellbenchmark.io.checksums import compute_checksum

logger = logging.getLogger(__name__)

RSCRIPT = Path(os.environ.get("RSCRIPT_PATH", "Rscript"))


class FiREWrapper(BaseMethodWrapper):
    """Wrapper for the FiRE R package (CRAN)."""

    method_id = "FiRE"
    category = "ranked"
    supports_gpu = False
    consumes_labels = False

    def _get_safe_env(self):
        """Return env with optimal thread settings for FiRE."""
        env = os.environ.copy()
        env["OMP_NUM_THREADS"] = "4"
        env["OPENBLAS_NUM_THREADS"] = "1"
        env["MKL_NUM_THREADS"] = "1"
        env["GOTO_NUM_THREADS"] = "1"
        env["VECLIB_MAXIMUM_THREADS"] = "1"
        return env

    def _write_fire_r_script(
        self,
        r_script_path: Path,
        input_csv: Path,
        output_csv: Path,
        seed: int,
        n_features: int,
        n_bins: int,
    ) -> None:
        input_csv_r = Path(input_csv).as_posix()
        output_csv_r = Path(output_csv).as_posix()
        code = f"""
suppressPackageStartupMessages(library(FiRE))
set.seed({seed})

X <- as.matrix(read.csv("{input_csv_r}", row.names=1, check.names=FALSE))
model <- new(FiRE::FiRE, {n_features}, {n_bins})
model$fit(X)
scores <- model$score(X)

write.csv(data.frame(cell=rownames(X), score=scores), "{output_csv_r}", row.names=FALSE)
"""
        r_script_path.write_text(code)

    def run(self, input_h5ad: Path, output_dir: Path, config: dict) -> MethodRunResult:
        seed = config.get("seed", 42)
        n_features = config.get("n_features", 100)
        n_bins = config.get("n_bins", 20)
        timeout = config.get("timeout", config.get("timeout_seconds", 1800))
        unit_id = config.get("unit_id", "unknown")

        adata = load_blind_adata(input_h5ad)
        self._start_memory()

        # Verify Rscript is available
        try:
            subprocess.run(
                [str(RSCRIPT), "--version"],
                capture_output=True,
                check=True,
            )
        except (subprocess.CalledProcessError, FileNotFoundError) as exc:
            raise RuntimeError(
                "Rscript is required for FiRE but was not found. "
                "Install R (https://cran.r-project.org/) and then run: "
                "install.packages('FiRE')"
            ) from exc

        X = adata.X
        if hasattr(X, "toarray"):
            X = X.toarray()
        X = np.array(X, dtype=np.float32)

        with tempfile.TemporaryDirectory() as tmpdir_name:
            tmpdir = Path(tmpdir_name)
            input_csv = tmpdir / "input.csv"
            output_csv = tmpdir / "output.csv"
            r_script = tmpdir / "run_fire.R"

            pd.DataFrame(X, index=adata.obs.index, columns=adata.var.index).to_csv(input_csv)
            self._write_fire_r_script(r_script, input_csv, output_csv, seed, n_features, n_bins)

            cmd = [str(RSCRIPT), str(r_script)]
            log_file = tmpdir / "fire.log"
            kwargs = {}
            if os.name == "nt":
                si = subprocess.STARTUPINFO()  # type: ignore[attr-defined]
                si.dwFlags |= subprocess.STARTF_USESHOWWINDOW  # type: ignore[attr-defined]
                si.wShowWindow = subprocess.SW_HIDE  # type: ignore[attr-defined]
                kwargs["startupinfo"] = si
                kwargs["creationflags"] = subprocess.CREATE_NO_WINDOW  # type: ignore[attr-defined]

            try:
                with open(log_file, "w") as lf:
                    result = subprocess.run(
                        cmd,
                        stdin=subprocess.DEVNULL,
                        stdout=lf,
                        stderr=subprocess.STDOUT,
                        env=self._get_safe_env(),
                        timeout=timeout,
                        **kwargs,
                    )
            except subprocess.TimeoutExpired as exc:
                raise RuntimeError(
                    f"FiRE timed out after {timeout}s."
                ) from exc

            if result.returncode != 0 or not output_csv.exists():
                err_text = log_file.read_text()[-2000:] if log_file.exists() else ""
                raise RuntimeError(
                    f"FiRE R script failed (exit {result.returncode}):\n{err_text}"
                )

            df = pd.read_csv(output_csv)
            scores = pd.Series(df["score"].values, index=df["cell"]).reindex(adata.obs.index)
            if scores.max() > scores.min():
                scores = (scores - scores.min()) / (scores.max() - scores.min())

        predictions = pd.DataFrame({
            "cell_id": adata.obs_names.tolist(),
            "score": scores.values,
        })
        validate_predictions(predictions, adata)

        pred_path = write_predictions(predictions, output_dir, unit_id)

        runtime_s, peak_memory_mb = self._stop_memory()
        input_hash = compute_checksum(input_h5ad)
        output_hash = compute_checksum(pred_path)

        meta_path = write_runmeta(
            method_id=self.method_id,
            unit_id=unit_id,
            output_dir=output_dir,
            runtime_s=runtime_s,
            peak_memory_mb=peak_memory_mb,
            seed=seed,
            input_hash=input_hash,
            output_hash=output_hash,
            n_features=n_features,
            n_bins=n_bins,
        )

        return MethodRunResult(
            method_id=self.method_id,
            unit_id=unit_id,
            predictions_path=pred_path,
            runmeta_path=meta_path,
            status="success",
        )
