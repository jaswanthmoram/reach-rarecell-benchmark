"""Tests for leaderboard construction and snapshotting."""

from pathlib import Path

import pandas as pd

from rarecellbenchmark.evaluate.leaderboard import build_leaderboard, freeze_leaderboard


def test_build_leaderboard_eligibility_and_tiebreaking() -> None:
    """Synthetic evaluation data with one eligible method, one low-success method,
    and one supervised method."""
    records = []
    # Method A: 100% success, highest AP
    for i in range(5):
        records.append(
            {
                "method_id": "method_a",
                "track": "A",
                "dataset_id": "d1",
                "tier": "T1",
                "replicate": i,
                "ap": 0.9,
                "auroc": 0.95,
                "runtime_seconds": 10.0,
                "consumes_labels": False,
            }
        )
    # Method B: 40% success -> excluded
    for i in range(5):
        records.append(
            {
                "method_id": "method_b",
                "track": "A",
                "dataset_id": "d1",
                "tier": "T1",
                "replicate": i,
                "ap": 0.8 if i < 2 else float("nan"),
                "auroc": 0.85 if i < 2 else float("nan"),
                "runtime_seconds": 20.0,
                "consumes_labels": False,
            }
        )
    # hvg_logreg: supervised -> excluded
    for i in range(5):
        records.append(
            {
                "method_id": "hvg_logreg",
                "track": "A",
                "dataset_id": "d1",
                "tier": "T1",
                "replicate": i,
                "ap": 0.99,
                "auroc": 0.99,
                "runtime_seconds": 5.0,
                "consumes_labels": True,
            }
        )

    eval_df = pd.DataFrame(records)
    lb = build_leaderboard(eval_df, track="A")

    assert "method_b" not in lb["method_id"].values
    assert "hvg_logreg" not in lb["method_id"].values
    assert lb.iloc[0]["method_id"] == "method_a"
    assert lb.iloc[0]["rank"] == 1


def test_build_leaderboard_deterministic_tiebreak() -> None:
    """When AP is equal, tie-breaking should be deterministic."""
    records = []
    for i in range(3):
        records.append(
            {
                "method_id": "method_x",
                "track": "A",
                "dataset_id": "d1",
                "tier": "T1",
                "replicate": i,
                "ap": 0.8,
                "auroc": 0.85,
                "runtime_seconds": 10.0,
                "consumes_labels": False,
            }
        )
    for i in range(3):
        records.append(
            {
                "method_id": "method_y",
                "track": "A",
                "dataset_id": "d1",
                "tier": "T1",
                "replicate": i,
                "ap": 0.8,
                "auroc": 0.80,
                "runtime_seconds": 12.0,
                "consumes_labels": False,
            }
        )
    eval_df = pd.DataFrame(records)
    lb = build_leaderboard(eval_df, track="A")
    # method_x has higher AUROC, so should be rank 1
    assert lb.iloc[0]["method_id"] == "method_x"
    assert lb.iloc[1]["method_id"] == "method_y"


def test_freeze_leaderboard(tmp_path: Path) -> None:
    lb = pd.DataFrame(
        {
            "method_id": ["m1"],
            "mean_ap": [0.5],
            "mean_auroc": [0.6],
            "median_ap": [0.5],
            "category": ["primary_competitor"],
            "note": ["PRIMARY COMPETITOR"],
        }
    )
    tag = "vtest"
    out_dir = tmp_path / "snapshots"
    csv_path = freeze_leaderboard(lb, tag, out_dir)
    assert csv_path.exists()
    assert csv_path.name == f"leaderboard_{tag}.csv"

    prov_path = out_dir / f"leaderboard_{tag}_provenance.json"
    assert prov_path.exists()
    prov = pd.read_json(prov_path, typ="series")
    assert prov["tag"] == tag
    assert prov["n_methods"] == 1
