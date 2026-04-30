"""Execution runner for benchmark methods."""

from __future__ import annotations

import json
import logging
import time
import traceback
from concurrent.futures import ProcessPoolExecutor, as_completed
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional

import pandas as pd

from rarecellbenchmark.config import MethodConfig, MethodRegistry, load_method_registry
from rarecellbenchmark.execute.failures import FailureHandler
from rarecellbenchmark.execute.resources import ResourceMonitor

logger = logging.getLogger(__name__)


@dataclass
class MethodRunResult:
    """Result of running a single method on a single unit."""

    method_id: str
    unit_id: str
    success: bool
    predictions_path: Optional[Path] = None
    meta_path: Optional[Path] = None
    runtime_seconds: float = 0.0
    peak_memory_mb: float = -1.0
    error: Optional[str] = None
    traceback: Optional[str] = None
    meta: dict[str, Any] = field(default_factory=dict)


# Legacy method path mappings for fallback import resolution
METHOD_PATHS = {
    "random_baseline": "src.methods.naive.random_baseline",
    "expr_threshold": "src.methods.naive.expr_threshold",
    "hvg_logreg": "src.methods.naive.hvg_logreg",
    "raceid3": "src.methods.ranked.raceid3_wrapper",
    "cellsius": "src.methods.ranked.cellsius_wrapper",
    "scCAD": "src.methods.ranked.scCAD_wrapper",
    "deepscena": "src.methods.ranked.deepscena_wrapper",
    "giniclust3": "src.methods.ranked.giniclust3_wrapper",
    "scMalignantFinder": "src.methods.ranked.scmalignantfinder_wrapper",
    "SCANER": "src.methods.ranked.scaner_wrapper",
    "MACE": "src.methods.orthogonal.mace_wrapper",
    "CopyKAT": "src.methods.orthogonal.copykat_orthogonal",
    "SCEVAN": "src.methods.orthogonal.scevan_wrapper",
    "scATOMIC": "src.methods.orthogonal.scatomic_wrapper",
    "CaSee": "src.methods.exploratory.casee_wrapper",
}


def _load_method_module(method_id: str):
    """Dynamically import a method wrapper module."""
    import importlib

    if method_id not in METHOD_PATHS:
        raise ValueError(f"Unknown method: {method_id}. Valid: {list(METHOD_PATHS.keys())}")
    return importlib.import_module(METHOD_PATHS[method_id])


def run_method_on_unit(
    method_id: str,
    adata,
    unit_manifest: dict,
    labels_path: Path,
    true_labels: Optional[pd.Series] = None,
    strict: bool = False,
    **method_kwargs,
) -> dict:
    """Run one method on one benchmark unit and return raw evaluation dict.

    Parameters
    ----------
    method_id : str
        Method identifier.
    adata : AnnData
        Expression data.
    unit_manifest : dict
        Unit metadata (from manifest.json).
    labels_path : Path
        Path to labels.parquet.
    true_labels : pd.Series, optional
        Ground-truth labels for supervised methods.
    strict : bool
        If True, raise on failures.
    **method_kwargs
        Additional keyword arguments passed to the method wrapper.

    Returns
    -------
    dict
        Evaluation result dict including metrics and metadata.
    """
    module = _load_method_module(method_id)
    t0 = time.time()

    # Handle methods that require labels (supervised ceiling)
    if method_id == "hvg_logreg":
        if true_labels is None:
            true_labels = pd.read_parquet(labels_path)["true_label"]
        scores, meta = module.run(adata, true_labels=true_labels, **method_kwargs)
    else:
        scores, meta = module.run(adata, **method_kwargs)

    runtime = time.time() - t0
    meta["total_runtime"] = runtime

    # Lazy import to avoid circular dependency
    from rarecellbenchmark.evaluate.metrics import evaluate_unit

    result = evaluate_unit(unit_manifest, scores, labels_path, strict=strict)
    result["method_id"] = method_id
    result["runtime_seconds"] = meta.get("runtime_seconds", runtime)
    result["meta"] = meta
    result["scores"] = scores

    return result


class ExecutionRunner:
    """Orchestrate method execution across benchmark units."""

    def __init__(self, config: dict) -> None:
        self.config = config
        self.parallel_jobs = int(config.get("parallel_jobs", 1))
        self._registry: Optional[MethodRegistry] = None
        self._failure_handler = FailureHandler()

    def _get_registry(self) -> MethodRegistry:
        if self._registry is None:
            registry_path = self.config.get("methods_registry", Path("configs/methods.yaml"))
            self._registry = load_method_registry(registry_path)
        return self._registry

    def _lookup_method(self, method_id: str) -> MethodConfig:
        registry = self._get_registry()
        for m in registry.methods:
            if m.method_id == method_id:
                return m
        raise KeyError(f"Method '{method_id}' not found in registry")

    def run_method(
        self,
        method_id: str,
        unit_id: str,
        unit_dir: Path,
        output_dir: Path,
    ) -> MethodRunResult:
        """Run a single method on a single unit.

        Parameters
        ----------
        method_id : str
            Method identifier.
        unit_id : str
            Unit identifier.
        unit_dir : Path
            Directory containing unit expression and labels.
        output_dir : Path
            Directory where predictions and metadata are written.

        Returns
        -------
        MethodRunResult
        """
        import anndata as ad

        method_cfg = self._lookup_method(method_id)
        unit_dir = Path(unit_dir)
        output_dir = Path(output_dir)
        method_pred_dir = output_dir / method_id
        method_pred_dir.mkdir(parents=True, exist_ok=True)

        # Load manifest
        manifest_path = unit_dir / f"{unit_id}_manifest.json"
        if manifest_path.exists():
            with open(manifest_path) as f:
                unit_manifest = json.load(f)
        else:
            unit_manifest = {"unit_id": unit_id}

        track = unit_manifest.get("track", "").lower()
        labels_path = unit_dir / f"{unit_id}_labels.parquet"
        expr_path = unit_dir / f"{unit_id}_expression.h5ad"
        if not expr_path.exists() and "expression_path" in unit_manifest:
            expr_path = Path(unit_manifest["expression_path"])

        if not expr_path.exists():
            raise FileNotFoundError(f"Expression file not found: {expr_path}")
        if not labels_path.exists():
            raise FileNotFoundError(f"Labels file not found: {labels_path}")

        # Verify ranked-track eligibility
        if track in ("a", "b", "c", "d", "e") and method_cfg.consumes_labels:
            # Ranked tracks do not permit label-consuming methods
            msg = f"Method {method_id} consumes labels but track {track} is ranked"
            logger.error(msg)
            failure_path = self._failure_handler.handle_failure(
                method_id=method_id,
                unit_id=unit_id,
                exception=RuntimeError(msg),
                output_dir=method_pred_dir,
                runtime_s=0.0,
                peak_memory_mb=-1.0,
            )
            return MethodRunResult(
                method_id=method_id,
                unit_id=unit_id,
                success=False,
                meta_path=failure_path,
                error=msg,
            )

        adata = ad.read_h5ad(expr_path)

        with ResourceMonitor() as monitor:
            try:
                result = run_method_on_unit(
                    method_id=method_id,
                    adata=adata,
                    unit_manifest=unit_manifest,
                    labels_path=labels_path,
                    strict=False,
                )
                runtime_s = result.get("runtime_seconds", 0.0)
                peak_memory_mb = monitor.peak_memory_mb

                # Save predictions
                scores = result.get("scores")
                if scores is not None and isinstance(scores, pd.Series):
                    pred_path = method_pred_dir / f"{unit_id}_predictions.csv"
                    scores.to_csv(pred_path, header=["score"])
                else:
                    pred_path = None

                # Save run meta
                meta = {
                    "success": True,
                    "method_id": method_id,
                    "unit_id": unit_id,
                    "dataset_id": unit_manifest.get("dataset_id"),
                    "track": unit_manifest.get("track"),
                    "tier": unit_manifest.get("tier"),
                    "replicate": unit_manifest.get("replicate"),
                    "prevalence": unit_manifest.get("prevalence"),
                    "noise_condition": unit_manifest.get("noise_condition"),
                    "duplicate_fraction": unit_manifest.get("duplicate_fraction"),
                    "n_cells": int(adata.n_obs),
                    "n_genes": int(adata.n_vars),
                    "runtime_seconds": float(runtime_s),
                    "peak_ram_mb": float(peak_memory_mb),
                    "method_fidelity": result.get("meta", {}).get("method_fidelity", "unknown"),
                    "partial": bool(result.get("meta", {}).get("partial", False)),
                }
                meta_path = method_pred_dir / f"{unit_id}_run_meta.json"
                with open(meta_path, "w") as f:
                    json.dump(meta, f, indent=2)

                logger.info(f"  {method_id} | {unit_id} | {adata.n_obs} cells | {runtime_s:.1f}s")
                return MethodRunResult(
                    method_id=method_id,
                    unit_id=unit_id,
                    success=True,
                    predictions_path=pred_path,
                    meta_path=meta_path,
                    runtime_seconds=runtime_s,
                    peak_memory_mb=peak_memory_mb,
                    meta=meta,
                )
            except Exception as exc:
                runtime_s = monitor.elapsed_s
                peak_memory_mb = monitor.peak_memory_mb
                failure_path = self._failure_handler.handle_failure(
                    method_id=method_id,
                    unit_id=unit_id,
                    exception=exc,
                    output_dir=method_pred_dir,
                    runtime_s=runtime_s,
                    peak_memory_mb=peak_memory_mb,
                )
                logger.error(f"  {method_id} | {unit_id} | FAILED: {str(exc)[:200]}")
                return MethodRunResult(
                    method_id=method_id,
                    unit_id=unit_id,
                    success=False,
                    runtime_seconds=runtime_s,
                    peak_memory_mb=peak_memory_mb,
                    error=str(exc)[:500],
                    traceback=traceback.format_exc()[:500],
                    meta={"failure_path": str(failure_path)},
                )

    def run_all_methods(
        self,
        unit_dir: Path,
        methods: list[str],
        output_root: Path,
    ) -> list[MethodRunResult]:
        """Run all specified methods on one unit.

        Parameters
        ----------
        unit_dir : Path
            Directory containing unit expression and labels.
        methods : list[str]
            List of method IDs to run.
        output_root : Path
            Root directory where predictions are written.

        Returns
        -------
        list[MethodRunResult]
        """
        unit_dir = Path(unit_dir)
        output_root = Path(output_root)

        # Find unit_id from manifest
        manifests = sorted(unit_dir.rglob("*_manifest.json"))
        if manifests:
            with open(manifests[0]) as f:
                manifest = json.load(f)
            unit_id = manifest.get("unit_id", unit_dir.name)
        else:
            unit_id = unit_dir.name

        results: list[MethodRunResult] = []

        if self.parallel_jobs <= 1:
            for method_id in methods:
                result = self.run_method(method_id, unit_id, unit_dir, output_root)
                results.append(result)
            return results

        with ProcessPoolExecutor(max_workers=self.parallel_jobs) as executor:
            futures = {
                executor.submit(
                    self.run_method, method_id, unit_id, unit_dir, output_root
                ): method_id
                for method_id in methods
            }
            for future in as_completed(futures):
                method_id = futures[future]
                try:
                    result = future.result()
                    results.append(result)
                except Exception as exc:
                    logger.error(f"  {method_id} | {unit_id} | EXECUTOR FAILED: {exc}")
                    failure_path = self._failure_handler.handle_failure(
                        method_id=method_id,
                        unit_id=unit_id,
                        exception=exc,
                        output_dir=output_root / method_id,
                        runtime_s=0.0,
                        peak_memory_mb=-1.0,
                    )
                    results.append(
                        MethodRunResult(
                            method_id=method_id,
                            unit_id=unit_id,
                            success=False,
                            error=str(exc)[:500],
                            traceback=traceback.format_exc()[:500],
                            meta={"failure_path": str(failure_path)},
                        )
                    )
        return results
