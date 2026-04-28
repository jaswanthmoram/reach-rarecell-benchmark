"""Dataset download stub / helper.

Full automated download is intentionally out of scope because GEO access
patterns vary (supplementary files, SRA, controlled access, etc.).  This
module provides helpers that log the correct manual steps.
"""

from __future__ import annotations

import logging
from pathlib import Path

from rarecellbenchmark.ingest.registry import DatasetRegistry

logger = logging.getLogger(__name__)

GEO_FTP_BASE = "https://ftp.ncbi.nlm.nih.gov/geo/series"


def _geo_ftp_url(geo_acc: str) -> str:
    """Construct the GEO FTP supplementary-files URL for a GSE accession."""
    nnn = geo_acc[:-3] + "nnn" if len(geo_acc) > 6 else geo_acc + "nnn"
    return f"{GEO_FTP_BASE}/{nnn}/{geo_acc}/suppl/"


def download_dataset(
    dataset_id: str,
    out_dir: Path,
    registry: DatasetRegistry,
) -> Path:
    """Log download instructions for *dataset_id* and return *out_dir*.

    For open-access GEO datasets the FTP URL is printed.  For controlled-access
    datasets the user is pointed to the access-request workflow.

    Parameters
    ----------
    dataset_id :
        Benchmark dataset identifier.
    out_dir :
        Destination directory for raw files.
    registry :
        Loaded dataset registry (used to pull GEO accession metadata).

    Returns
    -------
    Path - the *out_dir* that should contain the downloaded files.
    """
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    try:
        cfg = registry.get(dataset_id)
    except KeyError:
        logger.error("Dataset '%s' not found in registry.", dataset_id)
        raise

    geo_acc = cfg.accession
    is_controlled = getattr(cfg, "controlled_access", False)

    if is_controlled:
        logger.info(
            "[%s] Controlled-access dataset.\n"
            "  1. Request access via the relevant repository (e.g. dbGaP).\n"
            "  2. Download raw counts to: %s",
            dataset_id,
            out_dir,
        )
    else:
        ftp_url = _geo_ftp_url(geo_acc)
        logger.info(
            "[%s] Open-access GEO dataset (%s).\n"
            "  1. Browse: %s\n"
            "  2. Download supplementary count-matrix files.\n"
            "  3. Place them in: %s",
            dataset_id,
            geo_acc,
            ftp_url,
            out_dir,
        )

    return out_dir
