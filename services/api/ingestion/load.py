"""
Natural Earth data loader — inserts validated features into PostGIS.

Every inserted entity retains a reference to its dataset record
for full provenance tracing.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

import structlog
from shapely.geometry import shape, mapping
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from services.area import calculate_geodesic_area

logger = structlog.get_logger(__name__)


# Fields from Natural Earth Admin 0 Countries shapefile
# Mapping: Natural Earth field → our schema field
NE_FIELD_MAP = {
    "NAME": "name",
    "NAME_LONG": "name_long",
    "FORMAL_EN": "official_name",
    "ISO_A2": "iso2",
    "ISO_A3": "iso3",
    "ISO_N3": "iso_n3",
    "CONTINENT": "continent",
    "SUBREGION": "subregion",
    "SOVEREIGNT": "sovereign",
    "TYPE": "ne_type",
    "ADM0_A3": "adm0_a3",
    "NAME_ALT": "name_alt",
    "NOTE_BRK": "boundary_notes",
    "featurecla": "feature_class",
}

# Known NE ISO codes that need correction for -99 sentinel values
NE_SENTINEL = "-99"


async def load_natural_earth_countries(
    features: list[dict[str, Any]],
    dataset_id: UUID,
    dataset_version: str,
    dataset_name: str,
    session: AsyncSession,
) -> dict[str, int]:
    """
    Insert Natural Earth country features into geographic_entities.

    Parameters
    ----------
    features : list[dict]
        Validated GeoJSON features from Natural Earth Admin 0.
    dataset_id : UUID
        The dataset record this data belongs to.
    dataset_version : str
        Version string for provenance.
    dataset_name : str
        Human-readable dataset name.
    session : AsyncSession
        Database session.

    Returns
    -------
    dict
        Counts of inserted, updated, skipped records.
    """
    inserted = updated = skipped = 0

    for feat in features:
        props = feat.get("properties", {}) or {}
        geom_data = feat.get("geometry")

        # Extract and clean properties
        name = _clean_str(props.get("NAME") or props.get("name"))
        name_long = _clean_str(props.get("NAME_LONG") or props.get("name_long"))
        official_name = _clean_str(props.get("FORMAL_EN") or props.get("formal_en"))
        iso2 = _clean_code(props.get("ISO_A2") or props.get("iso_a2"))
        iso3 = _clean_code(props.get("ISO_A3") or props.get("iso_a3") or props.get("ADM0_A3"))
        iso_n3 = _clean_code(props.get("ISO_N3") or props.get("iso_n3"))
        continent = _clean_str(props.get("CONTINENT") or props.get("continent"))
        subregion = _clean_str(props.get("SUBREGION") or props.get("subregion"))
        boundary_notes = _clean_str(props.get("NOTE_BRK") or props.get("note_brk"))
        name_alt_raw = props.get("NAME_ALT") or props.get("name_alt")
        name_alt = [n.strip() for n in name_alt_raw.split("|") if n.strip()] \
            if isinstance(name_alt_raw, str) else []

        if not name:
            logger.warning("Feature has no name, skipping", iso3=iso3)
            skipped += 1
            continue

        if not geom_data:
            logger.warning("Feature has no geometry, skipping", name=name)
            skipped += 1
            continue

        # Build Shapely geometry for calculations
        geom = shape(geom_data)

        # Calculate geodesic area from geometry
        area_result = calculate_geodesic_area(
            geometry_geojson=geom_data,
            dataset_id=str(dataset_id),
            dataset_version=dataset_version,
            dataset_name=dataset_name,
        )
        area_m2 = area_result.get("area_m2")

        # Centroid
        centroid = geom.centroid
        bounds = geom.bounds

        # Simplified geometry for tile rendering
        simplified = geom.simplify(0.05, preserve_topology=True)
        if simplified.is_empty:
            simplified = geom

        geom_wkt = geom.wkt
        simplified_wkt = simplified.wkt
        centroid_wkt = centroid.wkt

        try:
            # Upsert: if iso3 + dataset_id already exists, update; else insert
            await session.execute(
                text("""
                    INSERT INTO geographic_entities (
                        entity_type, name, name_long, official_name,
                        iso2, iso3, iso_n3,
                        geometry, geometry_simplified, centroid,
                        bbox_minx, bbox_miny, bbox_maxx, bbox_maxy,
                        dataset_id, area_m2,
                        continent, subregion, boundary_notes,
                        name_alt, source_feature_id
                    ) VALUES (
                        'country', :name, :name_long, :official_name,
                        :iso2, :iso3, :iso_n3,
                        ST_GeomFromText(:geom_wkt, 4326),
                        ST_GeomFromText(:simplified_wkt, 4326),
                        ST_GeomFromText(:centroid_wkt, 4326),
                        :bbox_minx, :bbox_miny, :bbox_maxx, :bbox_maxy,
                        :dataset_id, :area_m2,
                        :continent, :subregion, :boundary_notes,
                        :name_alt, :source_feature_id
                    )
                    ON CONFLICT (iso3, dataset_id) DO UPDATE SET
                        name = EXCLUDED.name,
                        name_long = EXCLUDED.name_long,
                        geometry = EXCLUDED.geometry,
                        geometry_simplified = EXCLUDED.geometry_simplified,
                        centroid = EXCLUDED.centroid,
                        area_m2 = EXCLUDED.area_m2,
                        updated_at = NOW()
                """),
                {
                    "name": name,
                    "name_long": name_long,
                    "official_name": official_name,
                    "iso2": iso2,
                    "iso3": iso3,
                    "iso_n3": iso_n3,
                    "geom_wkt": geom_wkt,
                    "simplified_wkt": simplified_wkt,
                    "centroid_wkt": centroid_wkt,
                    "bbox_minx": bounds[0],
                    "bbox_miny": bounds[1],
                    "bbox_maxx": bounds[2],
                    "bbox_maxy": bounds[3],
                    "dataset_id": dataset_id,
                    "area_m2": area_m2,
                    "continent": continent,
                    "subregion": subregion,
                    "boundary_notes": boundary_notes,
                    "name_alt": name_alt,
                    "source_feature_id": iso3 or name,
                },
            )
            inserted += 1

        except Exception as exc:
            logger.error("Failed to insert entity", name=name, iso3=iso3, error=str(exc))
            await session.rollback()
            skipped += 1
            continue

    await session.commit()

    logger.info(
        "Load complete",
        inserted=inserted,
        updated=updated,
        skipped=skipped,
    )

    return {"inserted": inserted, "updated": updated, "skipped": skipped}


async def register_dataset(
    session: AsyncSession,
    name: str,
    provider: str,
    version: str,
    license_str: str,
    source_url: str,
    checksum: str,
    retrieved_at: datetime,
    scale: str = "1:10m",
    entity_count: int | None = None,
) -> UUID:
    """
    Register a dataset in the datasets table and return its UUID.
    If the same provider/name/version already exists, return existing ID.
    """
    result = await session.execute(
        text("""
            INSERT INTO datasets (
                name, provider, version, license, source_url,
                checksum, retrieved_at, processed_at, scale, entity_count
            ) VALUES (
                :name, :provider, :version, :license, :source_url,
                :checksum, :retrieved_at, NOW(), :scale, :entity_count
            )
            ON CONFLICT (provider, name, version) DO UPDATE SET
                processed_at = NOW(),
                entity_count = COALESCE(EXCLUDED.entity_count, datasets.entity_count)
            RETURNING id
        """),
        {
            "name": name,
            "provider": provider,
            "version": version,
            "license": license_str,
            "source_url": source_url,
            "checksum": checksum,
            "retrieved_at": retrieved_at,
            "scale": scale,
            "entity_count": entity_count,
        },
    )
    await session.commit()
    row = result.first()
    return UUID(str(row[0]))


def _clean_str(val: Any) -> str | None:
    """Clean a string value from shapefile properties."""
    if val is None:
        return None
    s = str(val).strip()
    if s in ("", "-99", "NA", "N/A"):
        return None
    return s


def _clean_code(val: Any) -> str | None:
    """Clean an ISO code, rejecting Natural Earth sentinel values."""
    s = _clean_str(val)
    if s and s.startswith("-"):
        return None
    return s.upper() if s else None
