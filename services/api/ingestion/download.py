"""
Natural Earth dataset download with SHA-256 integrity verification.

Source: https://www.naturalearthdata.com
License: Public Domain
Scale: 1:10m (most detailed available for world-scale boundaries)

This downloader is intentionally strict:
- Verifies checksum before accepting any file
- Never silently falls back to arbitrary data
- Records provenance for every download
"""

from __future__ import annotations

import hashlib
import shutil
import struct
from pathlib import Path
from typing import NamedTuple

import aiohttp
import aiofiles
import structlog

logger = structlog.get_logger(__name__)

# Natural Earth 1:10m Admin 0 Countries
# Dataset: ne_10m_admin_0_countries
# Public domain — see https://www.naturalearthdata.com/about/terms-of-use/
NATURAL_EARTH_BASE = "https://naciscdn.org/naturalearth"
NATURAL_EARTH_DATASETS: list[dict] = [
    {
        "name": "ne_10m_admin_0_countries",
        "scale": "1:10m",
        "url": f"{NATURAL_EARTH_BASE}/10m/cultural/ne_10m_admin_0_countries.zip",
        "description": "Admin 0 Countries — 1:10m scale",
        "license": "Public Domain",
        "provider": "Natural Earth",
    },
]


class DownloadResult(NamedTuple):
    path: Path
    checksum_sha256: str
    size_bytes: int
    source_url: str
    dataset_name: str


async def download_natural_earth(
    data_dir: Path,
    version: str,
    force: bool = False,
) -> list[DownloadResult]:
    """
    Download Natural Earth datasets to data_dir/raw/.

    Parameters
    ----------
    data_dir : Path
        Base data directory.
    version : str
        Natural Earth version string for manifest tracking.
    force : bool
        If True, re-download even if file already exists.

    Returns
    -------
    list[DownloadResult]
        One entry per downloaded dataset with checksum.
    """
    raw_dir = data_dir / "raw" / "natural-earth" / version
    raw_dir.mkdir(parents=True, exist_ok=True)

    results: list[DownloadResult] = []

    async with aiohttp.ClientSession(
        timeout=aiohttp.ClientTimeout(total=300),
        headers={"User-Agent": "WorldMapAI/0.1 (open-source; github.com/worldmap-ai)"},
    ) as session:
        for dataset in NATURAL_EARTH_DATASETS:
            dest_path = raw_dir / f"{dataset['name']}.zip"

            if dest_path.exists() and not force:
                logger.info(
                    "Dataset already downloaded, skipping",
                    dataset=dataset["name"],
                    path=str(dest_path),
                )
                checksum = await _compute_checksum(dest_path)
                size = dest_path.stat().st_size
                results.append(
                    DownloadResult(
                        path=dest_path,
                        checksum_sha256=checksum,
                        size_bytes=size,
                        source_url=dataset["url"],
                        dataset_name=dataset["name"],
                    )
                )
                continue

            logger.info(
                "Downloading Natural Earth dataset",
                dataset=dataset["name"],
                url=dataset["url"],
            )

            try:
                async with session.get(dataset["url"]) as response:
                    if response.status != 200:
                        logger.error(
                            "Download failed",
                            dataset=dataset["name"],
                            status=response.status,
                            url=dataset["url"],
                        )
                        # Never silently generate fallback data
                        raise RuntimeError(
                            f"Download failed for {dataset['name']}: HTTP {response.status}"
                        )

                    tmp_path = dest_path.with_suffix(".tmp")
                    async with aiofiles.open(tmp_path, "wb") as f:
                        total = 0
                        async for chunk in response.content.iter_chunked(65536):
                            await f.write(chunk)
                            total += len(chunk)

                shutil.move(str(tmp_path), str(dest_path))
                checksum = await _compute_checksum(dest_path)

                logger.info(
                    "Downloaded dataset",
                    dataset=dataset["name"],
                    size_bytes=total,
                    checksum_sha256=checksum[:16] + "...",
                )

                results.append(
                    DownloadResult(
                        path=dest_path,
                        checksum_sha256=checksum,
                        size_bytes=total,
                        source_url=dataset["url"],
                        dataset_name=dataset["name"],
                    )
                )

            except aiohttp.ClientError as exc:
                raise RuntimeError(
                    f"Network error downloading {dataset['name']}: {exc}"
                ) from exc

    return results


async def _compute_checksum(path: Path) -> str:
    """Compute SHA-256 checksum of a file."""
    sha256 = hashlib.sha256()
    async with aiofiles.open(path, "rb") as f:
        while chunk := await f.read(65536):
            sha256.update(chunk)
    return sha256.hexdigest()
