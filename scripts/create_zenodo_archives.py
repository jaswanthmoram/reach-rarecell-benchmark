#!/usr/bin/env python3
"""Create Zenodo archive packages for the REACH benchmark.

All archives are created from the repo root so they unpack cleanly into
the correct data/ folder structure.

Usage:
    python scripts/create_zenodo_archives.py [--output-dir archives/]

Archives produced (all .tar.gz):
    1. reach-processed-datasets.tar.gz   → data/processed/
    2. reach-track-units-abc.tar.gz      → data/tracks/a/, b/, c/
    3. reach-track-units-de.tar.gz       → data/tracks/d/, e/
    4. reach-track-units-f.tar.gz        → data/tracks/f/   (NEW)
    5. reach-cnv-results.tar.gz          → data/results/revision/cnv_scores/ + cnv_concordance.csv  (NEW)
    6. reach-track-f-results.tar.gz      → data/results/revision/track_f/  (NEW)
    7. reach-frozen-results.tar.gz       → data/results/snapshots/paper_v1/
    8. reach-complete-results.tar.gz    → data/results/predictions/
"""

from __future__ import annotations

import argparse
import logging
import sys
import shutil
import subprocess
import tarfile
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

REPO_ROOT = Path(__file__).resolve().parents[1]

ARCHIVE_SPECS = [
    {
        "name": "reach-processed-datasets.tar.gz",
        "description": "Processed .h5ad datasets ready for track generation",
        "sources": [("data/processed/", "data/processed/")],
    },
    {
        "name": "reach-track-units-abc.tar.gz",
        "description": "Track A (160 units), Track B (120 units), Track C (160 units)",
        "sources": [
            ("data/tracks/a/", "data/tracks/a/"),
            ("data/tracks/b/", "data/tracks/b/"),
            ("data/tracks/c/", "data/tracks/c/"),
        ],
    },
    {
        "name": "reach-track-units-de.tar.gz",
        "description": "Track D (30 units), Track E (640 method-units)",
        "sources": [
            ("data/tracks/d/", "data/tracks/d/"),
            ("data/tracks/e/", "data/tracks/e/"),
        ],
    },
    {
        "name": "reach-track-units-f.tar.gz",
        "description": "Track F intra-lineage (15 units, crc_lee only) — NEW",
        "sources": [("data/tracks/f/", "data/tracks/f/")],
    },
    {
        "name": "reach-cnv-results.tar.gz",
        "description": "CNV inference scores + concordance validation — NEW",
        "sources": [
            ("data/results/revision/cnv_scores/", "data/results/revision/cnv_scores/"),
            ("data/results/revision/cnv_concordance.csv", "data/results/revision/cnv_concordance.csv"),
        ],
    },
    {
        "name": "reach-track-f-results.tar.gz",
        "description": "Track F leaderboard + comparison results — NEW",
        "sources": [
            ("data/results/revision/track_f/", "data/results/revision/track_f/"),
            ("data/results/revision/track_a_vs_f_comparison.csv", "data/results/revision/track_a_vs_f_comparison.csv"),
        ],
    },
    {
        "name": "reach-frozen-results.tar.gz",
        "description": "Frozen snapshot tables backing the paper figures",
        "sources": [("data/results/snapshots/paper_v1/", "data/results/snapshots/paper_v1/")],
    },
    {
        "name": "reach-complete-results.tar.gz",
        "description": "Complete method predictions for all tracks",
        "sources": [("data/predictions/", "data/predictions/")],
    },
]


def create_archive(archive_name: str, sources: list[tuple[str, str]], output_dir: Path, no_compress: bool = False) -> Path:
    """Create a single .tar.gz (or .tar if no_compress) archive from the specified source directories."""
    if no_compress:
        archive_name = archive_name.replace(".tar.gz", ".tar")
    archive_path = output_dir / archive_name

    # Check if native tar is available (much faster)
    if shutil.which("tar") is not None:
        if no_compress:
            cmd = ["tar", "-cf", str(archive_path)]
        else:
            cmd = ["tar", "-I", "gzip -1", "-cf", str(archive_path)]
            
        # Filter out non-existent sources
        valid_sources = []
        for src_rel, _ in sources:
            src_path = REPO_ROOT / src_rel
            if src_path.exists():
                valid_sources.append(src_rel)
            else:
                logger.warning("Source not found, skipping: %s", src_path)
        
        if not valid_sources:
            logger.warning("No valid sources found for %s", archive_name)
            # Create dummy empty archive to avoid errors
            with tarfile.open(archive_path, "w:gz" if not no_compress else "w") as tar:
                pass
            return archive_path
            
        cmd.extend(valid_sources)
        logger.info("Running native tar: %s in %s", " ".join(cmd), REPO_ROOT)
        subprocess.run(cmd, cwd=REPO_ROOT, check=True)
    else:
        file_count = 0
        with tarfile.open(archive_path, "w:gz" if not no_compress else "w") as tar:
            for src_rel, arc_rel in sources:
                src_path = REPO_ROOT / src_rel
                if not src_path.exists():
                    logger.warning("Source not found, skipping: %s", src_path)
                    continue
                if src_path.is_file():
                    tar.add(src_path, arcname=arc_rel)
                    file_count += 1
                elif src_path.is_dir():
                    for child in sorted(src_path.rglob("*")):
                        if child.is_file():
                            rel = child.relative_to(REPO_ROOT)
                            arcname = str(rel).replace(src_rel.rstrip("/") + "/", arc_rel.rstrip("/") + "/", 1)
                            tar.add(child, arcname=arcname)
                            file_count += 1

    size_mb = archive_path.stat().st_size / (1024 * 1024)
    logger.info("Created %s — %.1f MB", archive_name, size_mb)
    return archive_path


def main() -> int:
    parser = argparse.ArgumentParser(description="Create Zenodo archives for REACH benchmark")
    parser.add_argument("--output-dir", type=Path, default=REPO_ROOT / "archives", help="Output directory for archives")
    parser.add_argument("--list", action="store_true", help="List archive specs and exit")
    parser.add_argument("--no-compress", action="store_true", help="Create uncompressed .tar files instead of .tar.gz (extremely fast)")
    parser.add_argument("--archive", type=str, help="Create only a specific archive by name (e.g. reach-cnv-results.tar.gz)")
    parser.add_argument("--only-new", action="store_true", help="Create only the newly introduced archives (Track F units, CNV results, Track F results)")
    args = parser.parse_args()

    if args.list:
        for spec in ARCHIVE_SPECS:
            print(f"  {spec['name']}: {spec['description']}")
        return 0

    args.output_dir.mkdir(parents=True, exist_ok=True)

    specs_to_run = ARCHIVE_SPECS
    if args.archive:
        specs_to_run = [s for s in ARCHIVE_SPECS if s["name"] == args.archive]
        if not specs_to_run:
            logger.error("Archive not found: %s", args.archive)
            return 1
    elif args.only_new:
        new_names = {"reach-track-units-f.tar.gz", "reach-cnv-results.tar.gz", "reach-track-f-results.tar.gz"}
        specs_to_run = [s for s in ARCHIVE_SPECS if s["name"] in new_names]

    logger.info("Creating %d archives in %s (no-compress=%s)", len(specs_to_run), args.output_dir, args.no_compress)
    logger.info("Repo root: %s", REPO_ROOT)

    created = []
    for spec in specs_to_run:
        logger.info("")
        logger.info("--- %s ---", spec["name"])
        logger.info("    %s", spec["description"])
        path = create_archive(spec["name"], spec["sources"], args.output_dir, args.no_compress)
        created.append(path)

    logger.info("")
    logger.info("=== Summary ===")
    total_size = sum(p.stat().st_size for p in created)
    for p in created:
        logger.info("  %s — %.1f MB", p.name, p.stat().st_size / (1024 * 1024))
    logger.info("Total: %d archives, %.1f MB", len(created), total_size / (1024 * 1024))
    logger.info("")
    logger.info("Upload these archives to Zenodo.")
    logger.info("After upload, update the DOI references in:")
    logger.info("  - scripts/download_zenodo_data.py")
    logger.info("  - README.md")
    logger.info("  - paper.md")
    logger.info("  - docs/reproducibility.md")

    return 0


if __name__ == "__main__":
    sys.exit(main())