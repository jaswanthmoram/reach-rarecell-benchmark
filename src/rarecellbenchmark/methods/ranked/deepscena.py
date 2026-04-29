"""
REACH - Ranked Method: DeepScena
=============================================
Uses the original DeepScena Python scripts for deep clustering of scRNA-seq data.

Reference: Hartman et al., Bioinformatics 2021
GitHub: https://github.com/shaoqiangzhang/DeepScena
"""

from __future__ import annotations

import logging
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import pandas as pd

from rarecellbenchmark.methods.base import BaseMethodWrapper, MethodRunResult, validate_predictions
from rarecellbenchmark.methods.common import load_blind_adata, write_predictions, write_runmeta
from rarecellbenchmark.io.checksums import compute_checksum

logger = logging.getLogger(__name__)

# Path to DeepScena source (4 parents up from this file → repo root)
DEEPSCENA_DIR = Path(__file__).parent.parent.parent.parent.parent / "External-Methods" / "DeepScena" / "DeepScena-1.0.1"
RUNNER_SCRIPT = DEEPSCENA_DIR / "run_deepscena_benchmark.py"


class DeepScenaWrapper(BaseMethodWrapper):
    """Wrapper for DeepScena deep-clustering method."""

    method_id = "DeepScena"
    category = "ranked"
    supports_gpu = True
    consumes_labels = False

    def _create_runner_script(self) -> None:
        """Write a runner script that calls the REAL DeepScena classes."""
        script_content = '''
import argparse
import numpy as np
import pandas as pd
import torch
import sys
import os
import random

# Add real DeepScena source to Python path
deepscena_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)))
if deepscena_dir not in sys.path:
    sys.path.insert(0, deepscena_dir)

from DeepScena import DeepScena
from Network import AutoEncoder, Mutual_net, myBottleneck
from torch.utils.data import Dataset, DataLoader
from torchvision.transforms import ToTensor
from torch import nn


class BenchmarkDataset(Dataset):
    def __init__(self, data, labels=None):
        self.data = np.array(data).astype("float32")
        if labels is None:
            self.labels = np.zeros(len(self.data), dtype=int)
        else:
            self.labels = np.array(labels).astype(int)

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        x = self.data[idx].reshape((28, 28))
        return ToTensor()(x), self.labels[idx], idx


def weights_init(m):
    if isinstance(m, nn.Conv2d):
        torch.nn.init.xavier_uniform_(m.weight.data)
        if m.bias is not None:
            torch.nn.init.zeros_(m.bias.data)
    if isinstance(m, nn.Linear):
        torch.nn.init.xavier_uniform_(m.weight.data)
        if m.bias is not None:
            torch.nn.init.zeros_(m.bias.data)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--num_cluster", type=int, default=8)
    parser.add_argument("--latent_size", type=int, default=10)
    parser.add_argument("--pretraining_epoch", type=int, default=50)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--dataset_name", default="benchmark")
    parser.add_argument("--batch_size", type=int, default=200)
    parser.add_argument("--max_iter1", type=int, default=20)
    parser.add_argument("--max_iter2", type=int, default=20)
    args = parser.parse_args()

    torch.manual_seed(args.seed)
    np.random.seed(args.seed)
    random.seed(args.seed)

    if not torch.cuda.is_available():
        print("CUDA not available - DeepScena requires a GPU")
        sys.exit(1)

    # Load preprocessed data (cell × 784)
    df = pd.read_csv(args.input, header=0, index_col=0)
    data = df.values
    dataset_size = data.shape[0]

    dataset = BenchmarkDataset(data)
    loader = DataLoader(
        dataset,
        batch_size=min(args.batch_size, len(dataset)),
        shuffle=True,
        drop_last=False,
    )

    num_cluster = args.num_cluster
    latent_size = args.latent_size
    pretraining_epoch = args.pretraining_epoch
    dataset_name = args.dataset_name
    batch_size = min(args.batch_size, len(dataset))
    T1 = 2
    T2 = 1
    MaxIter1 = args.max_iter1
    MaxIter2 = args.max_iter2
    m = 1.5
    zeta = 0.8
    gamma = 1 - zeta
    a = 0.1

    AE = AutoEncoder(myBottleneck, [1, 1, 1]).cuda()
    AE.apply(weights_init)
    MNet = Mutual_net(num_cluster).cuda()
    MNet.apply(weights_init)

    ds = DeepScena(
        AE,
        MNet,
        loader,
        dataset_size,
        batch_size=batch_size,
        pretraining_epoch=pretraining_epoch,
        MaxIter1=MaxIter1,
        MaxIter2=MaxIter2,
        num_cluster=num_cluster,
        m=m,
        T1=T1,
        T2=T2,
        latent_size=latent_size,
        zeta=zeta,
        gamma=gamma,
        dataset_name=dataset_name,
        a=a,
    )

    if pretraining_epoch != 0:
        ds.pretrain()
    if MaxIter1 != 0:
        ds.first_module()
    if MaxIter2 != 0:
        ds.second_module()

    # Extract predictions (same logic as original runDeepScena.py)
    original_label_list = []
    latent_u_list = []
    latent_q_list = []
    predict_list = []
    cell_index = []

    for x, target, index in loader:
        AE = torch.load("AE_Second_module_" + dataset_name)
        MNet = torch.load("MNet_Second_module_" + dataset_name)
        x = torch.autograd.Variable(x).cuda(non_blocking=True)
        _mean, _disp, u, y = AE(x)
        q = MNet(u)
        u = u.cpu()
        q = q.cpu()
        y = torch.argmax(q, dim=1)
        y = y.cpu()
        y = y.numpy()

        for i in range(0, x.shape[0]):
            p = index.numpy()[i]
            cell_index.append(p)
            latent_u_list.append(u.data.numpy()[i])
            original_label_list.append(target.numpy()[i])
            predict_list.append(y[i])
            latent_q_list.append(q.data.numpy()[i])

    predictedlabels = pd.DataFrame(data=predict_list, columns=["Predicted_labels"])
    cindex = pd.DataFrame(data=cell_index, index=None, columns=["cell_index"])

    clust_result = pd.concat([cindex, predictedlabels], axis=1)
    clust_result = clust_result.sort_values(by="cell_index", ascending=True)
    clust_result.to_csv(args.output, index=False)
    print("DeepScena benchmark done")
'''
        RUNNER_SCRIPT.parent.mkdir(parents=True, exist_ok=True)
        RUNNER_SCRIPT.write_text(script_content)

    def run(self, input_h5ad: Path, output_dir: Path, config: dict) -> MethodRunResult:
        seed = config.get("seed", 42)
        num_cluster = config.get("num_cluster", None)
        latent_size = config.get("latent_size", 10)
        pretraining_epoch = config.get("pretraining_epoch", 50)
        timeout = config.get("timeout", config.get("timeout_seconds", 3600))
        unit_id = config.get("unit_id", "unknown")

        adata = load_blind_adata(input_h5ad)
        self._start_memory()

        # Check for required Python dependencies
        try:
            import scanpy as sc
        except ImportError as exc:
            raise RuntimeError(
                "scanpy is required for DeepScena but not installed. "
                "Install with: pip install scanpy"
            ) from exc

        try:
            import torch
        except ImportError as exc:
            raise RuntimeError(
                "PyTorch is required for DeepScena but not installed. "
                "Install with: pip install torch"
            ) from exc
        _ = torch

        real_source_exists = (
            DEEPSCENA_DIR.exists()
            and (DEEPSCENA_DIR / "DeepScena.py").exists()
            and (DEEPSCENA_DIR / "Network.py").exists()
        )
        if not real_source_exists:
            raise RuntimeError(
                f"Real DeepScena source not found at {DEEPSCENA_DIR}. "
                "Clone https://github.com/shaoqiangzhang/DeepScena and place it in "
                f"{DEEPSCENA_DIR.parent}"
            )

        # Dynamic timeout based on dataset size
        if timeout is None or timeout <= 0:
            est_size_mb = (adata.n_obs * adata.n_vars * 4) / (1024 * 1024)
            if est_size_mb > 100:
                timeout = 7200
            elif est_size_mb > 30:
                timeout = 5400
            else:
                timeout = 3600

        if num_cluster is None:
            num_cluster = max(3, min(30, int(np.sqrt(adata.n_obs / 10))))

        with tempfile.TemporaryDirectory() as tmpdir_name:
            tmpdir = Path(tmpdir_name)
            input_csv = tmpdir / "input.csv"
            output_csv = tmpdir / "output.csv"

            # Prepare expression matrix
            if "counts" in adata.layers:
                X = adata.layers["counts"]
                is_counts = True
            elif "log1p_norm" in adata.layers:
                X = adata.layers["log1p_norm"]
                is_counts = False
            else:
                X = adata.X
                is_counts = False

            if hasattr(X, "toarray"):
                X = X.toarray()
            X = np.array(X, dtype=np.float32)

            tmp_adata = sc.AnnData(X, obs=adata.obs.copy(), var=adata.var.copy())

            if is_counts:
                sc.pp.filter_genes(tmp_adata, min_cells=3)
                sc.pp.normalize_total(tmp_adata, target_sum=1e4)
                sc.pp.log1p(tmp_adata)

            n_hvg = min(784, tmp_adata.n_vars)
            try:
                sc.pp.highly_variable_genes(tmp_adata, n_top_genes=n_hvg, flavor="seurat_v3")
            except Exception:
                sc.pp.highly_variable_genes(tmp_adata, n_top_genes=n_hvg, flavor="seurat")

            hvg_mask = tmp_adata.var.highly_variable.values
            X_hvg = tmp_adata[:, hvg_mask].X.astype(np.float32)

            target_features = 784
            n_features = X_hvg.shape[1]
            if n_features < target_features:
                padding = np.zeros((X_hvg.shape[0], target_features - n_features), dtype=np.float32)
                X_padded = np.concatenate([X_hvg, padding], axis=1)
            else:
                X_padded = X_hvg[:, :target_features]

            pd.DataFrame(X_padded, index=adata.obs.index).to_csv(input_csv)

            self._create_runner_script()

            cmd = [
                sys.executable,
                str(RUNNER_SCRIPT),
                "--input",
                str(input_csv),
                "--output",
                str(output_csv),
                "--num_cluster",
                str(num_cluster),
                "--latent_size",
                str(latent_size),
                "--pretraining_epoch",
                str(pretraining_epoch),
                "--seed",
                str(seed),
            ]

            try:
                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=timeout,
                    cwd=str(tmpdir),
                )
            except (subprocess.TimeoutExpired, FileNotFoundError) as exc:
                raise RuntimeError(
                    f"DeepScena subprocess failed: {exc}"
                ) from exc

            if result.returncode != 0 or not output_csv.exists():
                stderr_snippet = result.stderr[:500] if result.stderr else ""
                raise RuntimeError(
                    f"DeepScena runner failed (exit {result.returncode}): {stderr_snippet}"
                )

            clusters_df = pd.read_csv(output_csv)
            if "Predicted_labels" not in clusters_df.columns:
                raise RuntimeError("DeepScena output missing 'Predicted_labels' column")

            if "cell_index" in clusters_df.columns:
                clusters_df = clusters_df.sort_values("cell_index")
            cluster_labels = clusters_df["Predicted_labels"].values

            if len(cluster_labels) != adata.n_obs:
                raise RuntimeError(
                    f"DeepScena cluster output length mismatch ({len(cluster_labels)} vs {adata.n_obs})"
                )

            cluster_series = pd.Series(cluster_labels, index=adata.obs.index)
            cluster_sizes = cluster_series.value_counts()
            total_cells = len(cluster_series)
            scores = cluster_series.map(lambda c: 1.0 - (cluster_sizes[c] / total_cells))

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
            num_cluster=num_cluster,
            latent_size=latent_size,
            pretraining_epoch=pretraining_epoch,
        )

        return MethodRunResult(
            method_id=self.method_id,
            unit_id=unit_id,
            predictions_path=pred_path,
            runmeta_path=meta_path,
            status="success",
        )
