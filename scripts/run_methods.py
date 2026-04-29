#!/usr/bin/env python3
"""Run one or more registered methods over discovered unit manifests."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from rarecellbenchmark.methods.registry import get_method, list_methods


def discover_unit_manifests(units_dir: Path) -> list[Path]:
    """Return unit manifest paths below ``units_dir``."""
    if not units_dir.exists():
        raise FileNotFoundError(f"Units directory not found: {units_dir}")
    manifests = sorted(units_dir.rglob("*_manifest.json"))
    if not manifests and (units_dir / "toy_manifest.json").exists():
        manifests = [units_dir / "toy_manifest.json"]
    if not manifests:
        raise FileNotFoundError(f"No unit manifests found below {units_dir}")
    return manifests


def load_manifest(path: Path) -> dict[str, Any]:
    data = json.loads(path.read_text())
    data.setdefault("unit_id", path.stem.removesuffix("_manifest"))
    return data


def expression_path_for_manifest(manifest_path: Path, manifest: dict[str, Any]) -> Path:
    """Resolve the expression h5ad path for a unit manifest."""
    candidates: list[Path] = []
    for key in ("expression_path", "input_h5ad", "h5ad_path", "processed_h5ad"):
        value = manifest.get(key)
        if value:
            path = Path(value)
            candidates.append(path if path.is_absolute() else manifest_path.parent / path)

    unit_id = str(manifest["unit_id"])
    candidates.extend(
        [
            manifest_path.with_name(f"{unit_id}_expression.h5ad"),
            manifest_path.parent / "toy_expression.h5ad",
        ]
    )

    for candidate in candidates:
        if candidate.exists():
            return candidate
    raise FileNotFoundError(
        f"No expression .h5ad found for unit {unit_id}. Checked: "
        + ", ".join(str(path) for path in candidates)
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run REACH methods over unit manifests")
    parser.add_argument(
        "--methods",
        nargs="+",
        required=True,
        help="Method IDs to run, or 'all' for all registered wrappers",
    )
    parser.add_argument("--units-dir", type=Path, required=True, help="Directory containing *_manifest.json files")
    parser.add_argument("--output-dir", type=Path, required=True, help="Prediction output root")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--dry-run", action="store_true", help="Print planned runs without executing")
    parser.add_argument(
        "--continue-on-error",
        action="store_true",
        help="Continue running remaining units after a method failure",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    methods = list_methods() if args.methods == ["all"] else args.methods
    unknown = [method for method in methods if method not in list_methods()]
    if unknown:
        print(f"ERROR: Unknown method(s): {unknown}. Available: {list_methods()}", file=sys.stderr)
        return 1

    try:
        manifest_paths = discover_unit_manifests(args.units_dir)
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    print(f"Discovered {len(manifest_paths)} unit manifest(s)")
    failures = 0
    for manifest_path in manifest_paths:
        manifest = load_manifest(manifest_path)
        unit_id = str(manifest["unit_id"])
        for method_id in methods:
            method_output_dir = args.output_dir / method_id
            print(f"{method_id}\t{unit_id}\t{manifest_path}")
            if args.dry_run:
                continue
            try:
                expr_path = expression_path_for_manifest(manifest_path, manifest)
                wrapper = get_method(method_id)()
                wrapper.run(
                    expr_path,
                    method_output_dir,
                    {**manifest, "unit_id": unit_id, "seed": args.seed},
                )
            except Exception as exc:
                failures += 1
                print(f"ERROR: {method_id} failed on {unit_id}: {exc}", file=sys.stderr)
                if not args.continue_on_error:
                    return 1

    if failures:
        print(f"Completed with {failures} failure(s)", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
