"""
Ingestion pipeline entry point.

Pipeline:
  download → checksum → extract → validate → load → manifest

Run with:
  python -m ingestion.run_pipeline
"""

from __future__ import annotations

import asyncio
import json
import zipfile
from datetime import datetime, timezone
from pathlib import Path

import structlog

from config import settings
from db.connection import async_session_factory, init_db
from ingestion.download import download_natural_earth
from ingestion.load import load_natural_earth_countries, register_dataset
from ingestion.validate import validate_and_repair_geometries

logger = structlog.get_logger(__name__)


async def run_ingestion_pipeline() -> None:
    """
    Run the full data ingestion pipeline.

    1. Download Natural Earth 1:10m Admin 0 Countries
    2. Verify checksum
    3. Extract and parse GeoJSON
    4. Validate and repair geometries
    5. Register dataset record
    6. Load entities to PostGIS
    7. Write manifest
    """
    logger.info("Starting WorldMap AI ingestion pipeline")
    await init_db()

    data_dir = settings.data_dir
    version = settings.natural_earth_version

    # Step 1: Download
    logger.info("Step 1: Downloading Natural Earth datasets", version=version)
    downloads = await download_natural_earth(data_dir, version)
    logger.info("Downloaded", count=len(downloads))

    async with async_session_factory() as session:
        for dl in downloads:
            logger.info("Processing dataset", name=dl.dataset_name)

            # Step 2: Extract
            logger.info("Step 2: Extracting", zip=str(dl.path))
            extract_dir = dl.path.parent / dl.dataset_name
            extract_dir.mkdir(parents=True, exist_ok=True)

            with zipfile.ZipFile(dl.path, "r") as zf:
                zf.extractall(extract_dir)

            # Find the GeoJSON or shapefile
            geojson_files = list(extract_dir.rglob("*.geojson"))
            shp_files = list(extract_dir.rglob("*.shp"))

            features: list[dict] = []

            if geojson_files:
                geojson_path = geojson_files[0]
                logger.info("Parsing GeoJSON", path=str(geojson_path))
                with open(geojson_path, "r", encoding="utf-8") as f:
                    fc = json.load(f)
                features = fc.get("features", [])

            elif shp_files:
                # Parse shapefile via fiona if geojson not available
                logger.info("Parsing shapefile", path=str(shp_files[0]))
                features = _read_shapefile(shp_files[0])
            else:
                logger.error("No GeoJSON or shapefile found in archive", name=dl.dataset_name)
                continue

            logger.info("Parsed features", count=len(features))

            # Step 3: Validate
            logger.info("Step 3: Validating geometries")
            valid_features, validation = validate_and_repair_geometries(features)
            logger.info(
                "Validation complete",
                valid=validation.valid_count,
                repaired=validation.repaired_count,
                rejected=validation.rejected_count,
            )

            # Step 4: Register dataset
            logger.info("Step 4: Registering dataset in database")
            dataset_id = await register_dataset(
                session=session,
                name=dl.dataset_name,
                provider="Natural Earth",
                version=version,
                license_str="Public Domain",
                source_url=dl.source_url,
                checksum=dl.checksum_sha256,
                retrieved_at=datetime.now(timezone.utc),
                scale="1:10m",
                entity_count=len(valid_features),
            )
            logger.info("Dataset registered", dataset_id=str(dataset_id))

            # Step 5: Load entities
            logger.info("Step 5: Loading entities to PostGIS", count=len(valid_features))
            counts = await load_natural_earth_countries(
                features=valid_features,
                dataset_id=dataset_id,
                dataset_version=version,
                dataset_name=dl.dataset_name,
                session=session,
            )
            logger.info("Load complete", **counts)

            # Step 6: Write manifest
            _write_manifest(
                data_dir=data_dir,
                dataset_name=dl.dataset_name,
                version=version,
                checksum=dl.checksum_sha256,
                source_url=dl.source_url,
                dataset_id=str(dataset_id),
                entity_count=counts["inserted"] + counts["updated"],
                validation=validation,
            )

    logger.info("Ingestion pipeline complete")


def _read_shapefile(shp_path: Path) -> list[dict]:
    """Read a shapefile using fiona and return GeoJSON-like feature list."""
    try:
        import fiona
        features = []
        with fiona.open(str(shp_path), encoding="utf-8") as src:
            for feat in src:
                features.append(dict(feat))
        return features
    except ImportError:
        logger.error("fiona not installed — cannot read shapefile. Install fiona or use GeoJSON.")
        return []


def _write_manifest(
    data_dir: Path,
    dataset_name: str,
    version: str,
    checksum: str,
    source_url: str,
    dataset_id: str,
    entity_count: int,
    validation: object,
) -> None:
    """Write a JSON manifest for the ingested dataset."""
    manifest_dir = Path("./manifests")
    manifest_dir.mkdir(parents=True, exist_ok=True)

    manifest = {
        "dataset_name": dataset_name,
        "version": version,
        "source_url": source_url,
        "checksum_sha256": checksum,
        "dataset_id": dataset_id,
        "entity_count": entity_count,
        "ingested_at": datetime.now(timezone.utc).isoformat(),
        "license": "Public Domain",
        "provider": "Natural Earth",
        "scale": "1:10m",
        "processing": {
            "valid": getattr(validation, "valid_count", None),
            "repaired": getattr(validation, "repaired_count", None),
            "rejected": getattr(validation, "rejected_count", None),
        },
    }

    manifest_path = manifest_dir / f"{dataset_name}_{version}.json"
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    logger.info("Manifest written", path=str(manifest_path))


if __name__ == "__main__":
    asyncio.run(run_ingestion_pipeline())
