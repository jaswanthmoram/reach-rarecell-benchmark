#!/usr/bin/env python3
import os
import sys
import tarfile
import subprocess
from pathlib import Path

ARCHIVES = [
    {
        "url": "https://zenodo.org/api/records/19850652/files/reach-processed-datasets.tar.gz/content",
        "filename": "reach-processed-datasets.tar.gz",
        "desc": "Processed datasets (7.3 GB)",
    },
    {
        "url": "https://zenodo.org/api/records/19850972/files/reach-track-units-abc.tar.gz/content",
        "filename": "reach-track-units-abc.tar.gz",
        "desc": "Track units A-C (9.7 GB)",
    },
    {
        "url": "https://zenodo.org/api/records/19851287/files/reach-track-units-de.tar.gz/content",
        "filename": "reach-track-units-de.tar.gz",
        "desc": "Track units D-E (2.2 GB)",
    },
    {
        "url": "https://zenodo.org/api/records/19850652/files/reach-track-units-f.tar.gz/content",
        "filename": "reach-track-units-f.tar.gz",
        "desc": "Track F intra-lineage units (NEW)",
    },
    {
        "url": "https://zenodo.org/api/records/19850652/files/reach-cnv-results.tar.gz/content",
        "filename": "reach-cnv-results.tar.gz",
        "desc": "CNV inference scores + concordance (NEW)",
    },
    {
        "url": "https://zenodo.org/api/records/19850652/files/reach-track-f-results.tar.gz/content",
        "filename": "reach-track-f-results.tar.gz",
        "desc": "Track F leaderboard + comparison results (NEW)",
    },
    {
        "url": "https://zenodo.org/api/records/19851710/files/reach-frozen-results.tar.gz/content",
        "filename": "reach-frozen-results.tar.gz",
        "desc": "Frozen results (5.2 MB)",
    },
    {
        "url": "https://zenodo.org/api/records/19851710/files/reach-complete-results.tar.gz/content",
        "filename": "reach-complete-results.tar.gz",
        "desc": "Complete results (425 MB)",
    },
]

def download_file_aria2(url, filename, desc):
    print("\n==================================================", flush=True)
    print(f"Downloading {desc} using aria2c...", flush=True)
    print("==================================================", flush=True)
    
    # -c: continue partial download
    # -x 16: max 16 connections per server
    # -s 16: split file into 16 parts
    # -k 1M: keep chunk size to 1M
    cmd = [
        "aria2c",
        "-c",
        "-x", "16",
        "-s", "16",
        "-k", "1M",
        "-o", filename,
        url
    ]
    
    print(f"Running command: {' '.join(cmd)}", flush=True)
    subprocess.run(cmd, check=True)
    print(f"Finished downloading {desc}.", flush=True)

def extract_tar(archive_path):
    print(f"Extracting {archive_path}...", flush=True)
    with tarfile.open(archive_path, 'r:gz') as tar:
        if hasattr(tarfile, "data_filter"):
            tar.extractall(path=os.getcwd(), filter='data')
        else:
            tar.extractall(path=os.getcwd())
    print(f"Finished extracting {archive_path}.", flush=True)

def main():
    root_dir = Path(__file__).resolve().parents[1]
    os.chdir(root_dir)
    print(f"Working in directory: {root_dir}", flush=True)
    
    for archive in ARCHIVES:
        target_path = root_dir / archive["filename"]
        
        # Download using aria2c (which supports resume)
        try:
            download_file_aria2(archive["url"], archive["filename"], archive["desc"])
        except subprocess.CalledProcessError as e:
            print(f"Error downloading {archive['desc']} with aria2c: {e}", file=sys.stderr, flush=True)
            sys.exit(1)
            
        try:
            extract_tar(target_path)
            # Remove the tar.gz file after extraction to save disk space
            os.remove(target_path)
            print(f"Removed temporary archive {target_path}.", flush=True)
        except Exception as e:
            print(f"Error extracting {archive['filename']}: {e}", file=sys.stderr, flush=True)
            
    print("\nZenodo download and extraction completed successfully using aria2c!", flush=True)

if __name__ == "__main__":
    main()
