#!/usr/bin/env python3
"""Stub downloader that reads configs/datasets.yaml and prints instructions."""
import argparse
from pathlib import Path

try:
    import yaml
except ImportError:  # pragma: no cover
    yaml = None

DEFAULT_CONFIG = Path("configs/datasets.yaml")


def main():
    parser = argparse.ArgumentParser(description="Print dataset download instructions")
    parser.add_argument("--dataset", required=True, help="Dataset ID to look up")
    args = parser.parse_args()

    if yaml is not None and DEFAULT_CONFIG.exists():
        with open(DEFAULT_CONFIG) as f:
            datasets = yaml.safe_load(f) or {}
    else:
        datasets = {}

    ds = datasets.get(args.dataset, {})
    geo_id = ds.get("geo_id", "N/A")
    access = ds.get("access", "open")
    ftp_url = ds.get(
        "ftp_url",
        f"https://ftp.ncbi.nlm.nih.gov/geo/series/{geo_id[:6]}nnn/{geo_id}/"
        if geo_id != "N/A"
        else "N/A",
    )

    print(f"Dataset: {args.dataset}")
    print(f"GEO ID:  {geo_id}")
    if access == "controlled":
        print("Access:  Controlled-access data.")
        print("Workflow: Request access via dbGaP or the relevant data access committee.")
    else:
        print(f"FTP URL: {ftp_url}")
        print("Suggested command:")
        print(f"  wget -r -np -nH --cut-dirs=3 {ftp_url} -P data/raw/{args.dataset}/")
    print("\nNote: This is a stub. Implement actual download logic as needed.")


if __name__ == "__main__":
    main()
