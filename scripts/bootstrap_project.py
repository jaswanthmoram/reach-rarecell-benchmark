#!/usr/bin/env python3
"""Bootstrap a new REACH project directory."""
from pathlib import Path

def main():
    dirs = [
        "data/raw", "data/interim", "data/processed", "data/validation",
        "data/tracks/a", "data/tracks/b", "data/tracks/c", "data/tracks/d", "data/tracks/e",
        "data/predictions", "data/results/tables", "data/results/figures", "data/results/snapshots",
        "data/toy",
    ]
    for d in dirs:
        Path(d).mkdir(parents=True, exist_ok=True)
        gitkeep = Path(d) / ".gitkeep"
        gitkeep.touch(exist_ok=True)
    print("Project bootstrapped.")

if __name__ == "__main__":
    main()
