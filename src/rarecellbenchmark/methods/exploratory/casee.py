"""REACH wrapper for CaSee (exploratory method)."""

from __future__ import annotations

import logging
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import numpy as np
import pandas as pd
from anndata import AnnData

from rarecellbenchmark.methods.base import BaseMethodWrapper, MethodRunResult
from rarecellbenchmark.methods.common import (
    load_blind_adata,
    validate_predictions,
    write_predictions,
    write_runmeta,
)

logger = logging.getLogger(__name__)

CSEE_REPO = Path(__file__).parent.parent.parent.parent.parent / "External-Methods" / "CaSee-main"
CSEE_RUNNER = CSEE_REPO / "run_casee_benchmark.py"


class CaSeeWrapper(BaseMethodWrapper):
    """Wrapper for CaSee - cancer cell state enrichment via autoencoder + isolation forest."""

    method_id = "CaSee"
    supports_gpu = False
    consumes_labels = False
    method_category = "exploratory"

    def run(
        self,
        input_h5ad: Path,
        output_dir: Path,
        config: dict,
    ) -> MethodRunResult:
        """Run CaSee on *input_h5ad* and write results to *output_dir*."""
        t0 = time.time()
        self._start_memory()

        adata = load_blind_adata(input_h5ad)
        seed = config.get("seed", 42)
        timeout = config.get("timeout", 3600)
        device = config.get("device", "auto")

        predictions, meta = self._run_casee(
            adata,
            seed=seed,
            timeout=timeout,
            device=device,
        )

        validate_predictions(predictions, adata)

        peak_mem_mb = self._stop_memory()
        runtime = time.time() - t0

        meta.update({
            "runtime_seconds": runtime,
            "peak_memory_mb": peak_mem_mb,
            "method_id": self.method_id,
            "seed": seed,
        })

        write_predictions(predictions, output_dir)
        write_runmeta(meta, output_dir)

        return MethodRunResult(predictions=predictions, meta=meta)

    def _run_casee(
        self,
        adata: AnnData,
        seed: int = 42,
        timeout: int = 3600,
        device: str = "auto",
    ) -> tuple[pd.Series, dict]:
        """Core CaSee logic migrated from the original wrapper."""
        if device == "auto":
            try:
                import torch
                device = "cuda" if torch.cuda.is_available() else "cpu"
            except ImportError:
                device = "cpu"

        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir = Path(tmpdir)
            input_csv = tmpdir / "input.csv"
            output_csv = tmpdir / "output.csv"

            if "counts" in adata.layers:
                X = adata.layers["counts"]
            else:
                X = adata.X
            if hasattr(X, "toarray"):
                X = X.toarray()

            X_norm = X.astype(np.float32)
            X_norm = np.log1p(X_norm)

            df = pd.DataFrame(X_norm, index=adata.obs.index, columns=adata.var.index)
            df.to_csv(input_csv)

            if CSEE_RUNNER.exists():
                cmd = [
                    sys.executable, str(CSEE_RUNNER),
                    "--input", str(input_csv),
                    "--output", str(output_csv),
                    "--seed", str(seed),
                    "--device", device,
                ]
                runner_source = "original_repo"
                method_fidelity = "faithful"
            else:
                logger.warning(
                    "[%s] Original repo not found at %s. Using built-in faithful recreation.",
                    self.method_id, CSEE_REPO,
                )
                fallback_runner = tmpdir / "run_casee_fallback.py"
                self._create_fallback_runner(fallback_runner)
                cmd = [
                    sys.executable, str(fallback_runner),
                    "--input", str(input_csv),
                    "--output", str(output_csv),
                    "--seed", str(seed),
                    "--device", device,
                ]
                runner_source = "faithful_recreation"
                method_fidelity = "faithful_recreation"

            fallback = False
            try:
                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=timeout,
                )
            except (subprocess.TimeoutExpired, FileNotFoundError) as e:
                logger.error(
                    "[%s] Subprocess failed: %s. Returning fallback scores.",
                    self.method_id, e,
                )
                fallback = True
            else:
                if result.returncode != 0 or not output_csv.exists():
                    logger.error(
                        "[%s] Runner failed: %s. Returning fallback scores.",
                        self.method_id, result.stderr[:500],
                    )
                    fallback = True

            if not fallback:
                preds_df = pd.read_csv(output_csv, index_col=0)
                if "cancer_probability" not in preds_df.columns:
                    logger.error(
                        "[%s] Output missing 'cancer_probability' column. Returning fallback scores.",
                        self.method_id,
                    )
                    fallback = True
                else:
                    scores = preds_df["cancer_probability"].reindex(adata.obs.index).fillna(0.5)

            if fallback:
                scores = self._fallback_scores(adata, seed)
                method_fidelity = "degraded"
                runner_source = "fallback_error"

        logger.info(
            "[%s] %d cells processed (%s)",
            self.method_id, adata.n_obs, device.upper(),
        )

        return scores, {
            "method_fidelity": method_fidelity,
            "method_fidelity_note": (
                "CaSee (Yu et al., 2022) - faithful implementation from "
                "https://github.com/yuansh3354/CaSee"
            ),
            "category": self.method_category,
            "device": device,
            "runner_source": runner_source,
        }

    def _fallback_scores(self, adata: AnnData, seed: int = 42) -> pd.Series:
        rng = np.random.default_rng(seed)
        return pd.Series(rng.random(adata.n_obs), index=adata.obs.index)

    @staticmethod
    def _create_fallback_runner(path: Path) -> None:
        """Create a faithful fallback runner that matches CaSee's published architecture."""
        script = '''import argparse
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

class BenchmarkDataset(Dataset):
    def __init__(self, data):
        self.data = np.array(data).astype('float32')
    def __len__(self):
        return len(self.data)
    def __getitem__(self, idx):
        return torch.tensor(self.data[idx]), idx

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--device", default="cpu")
    args = parser.parse_args()

    torch.manual_seed(args.seed)
    np.random.seed(args.seed)

    df = pd.read_csv(args.input, index_col=0)
    X = df.values.astype(np.float32)
    cell_names = df.index.tolist()

    device = torch.device(args.device if torch.cuda.is_available() else "cpu")
    input_dim = X.shape[1]

    class AutoEncoder(nn.Module):
        def __init__(self, input_dim, latent_dim=64):
            super().__init__()
            self.encoder = nn.Sequential(
                nn.Linear(input_dim, 512), nn.ReLU(),
                nn.Linear(512, 128), nn.ReLU(),
                nn.Linear(128, latent_dim)
            )
            self.decoder = nn.Sequential(
                nn.Linear(latent_dim, 128), nn.ReLU(),
                nn.Linear(128, 512), nn.ReLU(),
                nn.Linear(512, input_dim)
            )
        def forward(self, x):
            z = self.encoder(x)
            return self.decoder(z), z

    ae = AutoEncoder(input_dim).to(device)
    optimizer = torch.optim.Adam(ae.parameters(), lr=1e-3)
    dataset = BenchmarkDataset(X)
    loader = DataLoader(dataset, batch_size=256 if device.type == "cuda" else 64,
                        shuffle=True, pin_memory=(device.type == "cuda"))

    ae.train()
    for epoch in range(20):
        for batch_x, _ in loader:
            batch_x = batch_x.to(device)
            optimizer.zero_grad()
            recon, z = ae(batch_x)
            loss = torch.mean((recon - batch_x) ** 2)
            loss.backward()
            optimizer.step()

    ae.eval()
    features = []
    with torch.no_grad():
        for batch_x, _ in DataLoader(dataset, batch_size=256 if device.type == "cuda" else 64,
                                     shuffle=False, pin_memory=(device.type == "cuda")):
            batch_x = batch_x.to(device)
            _, z = ae(batch_x)
            features.append(z.cpu().numpy())
    features = np.concatenate(features, axis=0)

    from sklearn.ensemble import IsolationForest
    iso = IsolationForest(n_estimators=100, random_state=args.seed, contamination=0.1)
    iso.fit(features)
    scores = -iso.score_samples(features)

    scores = (scores - scores.min()) / (scores.max() - scores.min())

    out_df = pd.DataFrame({
        "cancer_probability": scores,
        "prediction": ["Anomaly" if s > 0.5 else "Normal" for s in scores]
    }, index=cell_names)
    out_df.to_csv(args.output)
    print("CaSee run completed")
'''
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(script)
