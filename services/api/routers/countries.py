"""Countries router — entity lookup, search, and geometry endpoints."""

from __future__ import annotations

from typing import Annotated, Any
from uuid import UUID

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from db.connection import get_session

logger = structlog.get_logger(__name__)
router = APIRouter(tags=["countries"])


@router.get("/countries")
async def list_countries(
    session: Annotated[AsyncSession, Depends(get_session)],
    limit: int = Query(default=250, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    continent: str | None = Query(default=None),
    entity_type: str | None = Query(default=None, alias="type"),
) -> dict[str, Any]:
    """
    List geographic entities.
    Returns name, ISO codes, continent, area, and dataset provenance.
    """
    conditions = ["1=1"]
    params: dict[str, Any] = {"limit": limit, "offset": offset}

    if continent:
        conditions.append("ge.continent ILIKE :continent")
        params["continent"] = continent
    if entity_type:
        conditions.append("ge.entity_type = :entity_type")
        params["entity_type"] = entity_type

    where_clause = " AND ".join(conditions)

    sql = text(f"""
        SELECT
            ge.id,
            ge.entity_type,
            ge.name,
            ge.name_long,
            ge.official_name,
            ge.iso2,
            ge.iso3,
            ge.continent,
            ge.subregion,
            ge.area_m2,
            ge.area_m2 / 1e6 AS area_km2,
            ST_AsGeoJSON(ge.centroid)::jsonb AS centroid,
            ge.bbox_minx,
            ge.bbox_miny,
            ge.bbox_maxx,
            ge.bbox_maxy,
            ge.boundary_notes,
            d.name AS dataset_name,
            d.version AS dataset_version,
            d.provider AS dataset_provider,
            d.license AS dataset_license,
            d.source_url AS dataset_url,
            d.retrieved_at AS dataset_retrieved_at
        FROM geographic_entities ge
        JOIN datasets d ON ge.dataset_id = d.id
        WHERE {where_clause}
        ORDER BY ge.name
        LIMIT :limit OFFSET :offset
    """)

    count_sql = text(f"""
        SELECT COUNT(*) FROM geographic_entities ge WHERE {where_clause}
    """)

    try:
        result = await session.execute(sql, params)
        rows = result.mappings().all()

        count_params = {k: v for k, v in params.items() if k not in ("limit", "offset")}
        count_result = await session.execute(count_sql, count_params)
        total = count_result.scalar()

        entities = [_format_entity_summary(row) for row in rows]
        return {
            "data": entities,
            "meta": {
                "total": total,
                "limit": limit,
                "offset": offset,
                "count": len(entities),
            },
        }
    except Exception as exc:
        logger.error("Failed to list countries", error=str(exc))
        raise HTTPException(status_code=503, detail="Unable to retrieve country list")


@router.get("/countries/search")
async def search_countries(
    session: Annotated[AsyncSession, Depends(get_session)],
    q: str = Query(..., min_length=1, max_length=100, description="Search query"),
    limit: int = Query(default=10, ge=1, le=50),
) -> dict[str, Any]:
    """
    Search countries by name, ISO2, ISO3, or alternate names.
    Uses trigram similarity for fuzzy matching.
    """
    params: dict[str, Any] = {"query": q, "query_lower": q.lower(), "limit": limit}

    sql = text("""
        SELECT
            ge.id, ge.name, ge.name_long, ge.iso2, ge.iso3,
            ge.continent, ge.entity_type,
            ge.area_m2 / 1e6 AS area_km2,
            ST_AsGeoJSON(ge.centroid)::jsonb AS centroid,
            d.name AS dataset_name, d.version AS dataset_version,
            GREATEST(
                similarity(ge.name, :query),
                similarity(COALESCE(ge.iso2, ''), :query),
                similarity(COALESCE(ge.iso3, ''), :query),
                similarity(COALESCE(ge.name_long, ''), :query)
            ) AS score
        FROM geographic_entities ge
        JOIN datasets d ON ge.dataset_id = d.id
        WHERE
            ge.name ILIKE '%' || :query || '%'
            OR ge.name_long ILIKE '%' || :query || '%'
            OR ge.iso2 ILIKE :query_lower
            OR ge.iso3 ILIKE :query_lower
            OR ge.name % :query
        ORDER BY score DESC, ge.name
        LIMIT :limit
    """)

    try:
        result = await session.execute(sql, params)
        rows = result.mappings().all()
        return {
            "query": q,
            "results": [_format_entity_summary(row) for row in rows],
        }
    except Exception as exc:
        logger.error("Country search failed", error=str(exc))
        raise HTTPException(status_code=503, detail="Search unavailable")


@router.get("/countries/{iso3}")
async def get_country(
    iso3: str,
    session: Annotated[AsyncSession, Depends(get_session)],
    include_geometry: bool = Query(default=False),
) -> dict[str, Any]:
    """
    Get detailed information for a specific country by ISO3 code.
    Includes source provenance for every field.
    """
    if not iso3.isalpha() or len(iso3) != 3:
        raise HTTPException(status_code=400, detail="ISO3 code must be exactly 3 letters")

    geometry_select = ""
    if include_geometry:
        geometry_select = ", ST_AsGeoJSON(ge.geometry)::jsonb AS geometry"

    sql = text(f"""
        SELECT
            ge.id, ge.entity_type, ge.name, ge.name_long, ge.official_name,
            ge.iso2, ge.iso3, ge.continent, ge.subregion,
            ge.area_m2, ge.area_m2 / 1e6 AS area_km2,
            ST_AsGeoJSON(ge.centroid)::jsonb AS centroid,
            ge.bbox_minx, ge.bbox_miny, ge.bbox_maxx, ge.bbox_maxy,
            ge.boundary_notes, ge.source_feature_id,
            ge.name_alt, ge.metadata{geometry_select},
            d.id AS dataset_id, d.name AS dataset_name,
            d.version AS dataset_version, d.provider AS dataset_provider,
            d.license AS dataset_license, d.source_url AS dataset_url,
            d.retrieved_at AS dataset_retrieved_at,
            d.scale AS dataset_scale
        FROM geographic_entities ge
        JOIN datasets d ON ge.dataset_id = d.id
        WHERE UPPER(ge.iso3) = UPPER(:iso3)
        LIMIT 1
    """)

    try:
        result = await session.execute(sql, {"iso3": iso3.upper()})
        row = result.mappings().first()
        if not row:
            raise HTTPException(status_code=404, detail=f"Country '{iso3}' not found")

        return _format_entity_detail(row, include_geometry)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Failed to get country", iso3=iso3, error=str(exc))
        raise HTTPException(status_code=503, detail="Unable to retrieve country data")


def _format_entity_summary(row: Any) -> dict[str, Any]:
    """Format a database row into a clean API summary response."""
    return {
        "id": str(row["id"]),
        "entity_type": row["entity_type"],
        "name": row["name"],
        "name_long": row.get("name_long"),
        "iso2": row.get("iso2"),
        "iso3": row.get("iso3"),
        "continent": row.get("continent"),
        "subregion": row.get("subregion"),
        "area_km2": round(row["area_km2"], 2) if row.get("area_km2") else None,
        "centroid": row.get("centroid"),
        "bbox": {
            "minx": row.get("bbox_minx"),
            "miny": row.get("bbox_miny"),
            "maxx": row.get("bbox_maxx"),
            "maxy": row.get("bbox_maxy"),
        } if row.get("bbox_minx") is not None else None,
        "dataset": {
            "name": row["dataset_name"],
            "version": row["dataset_version"],
        },
    }


def _format_entity_detail(row: Any, include_geometry: bool) -> dict[str, Any]:
    """Format a database row into a full detail API response with provenance."""
    result: dict[str, Any] = {
        "id": str(row["id"]),
        "entity_type": row["entity_type"],
        "name": row["name"],
        "name_long": row.get("name_long"),
        "official_name": row.get("official_name"),
        "iso2": row.get("iso2"),
        "iso3": row.get("iso3"),
        "continent": row.get("continent"),
        "subregion": row.get("subregion"),
        "centroid": row.get("centroid"),
        "bbox": {
            "minx": row.get("bbox_minx"),
            "miny": row.get("bbox_miny"),
            "maxx": row.get("bbox_maxx"),
            "maxy": row.get("bbox_maxy"),
        } if row.get("bbox_minx") is not None else None,
        "name_alt": row.get("name_alt", []),
        "boundary_notes": row.get("boundary_notes"),
        # Area — geodesic area derived from geometry, NOT statistical area
        "area": {
            "area_m2": row.get("area_m2"),
            "area_km2": round(row["area_km2"], 2) if row.get("area_km2") else None,
            "label": "Geometry-derived geodesic area",
            "method": "geodesic-area",
            "ellipsoid": "WGS84",
            "note": (
                "This is the area calculated from the map geometry polygon, "
                "not an official statistical area figure. "
                "The two may differ due to geometry simplification and boundary definitions. "
                "See CALCULATIONS.md for methodology."
            ),
        },
        # Full provenance chain
        "source": {
            "dataset_id": str(row["dataset_id"]),
            "dataset_name": row["dataset_name"],
            "dataset_version": row["dataset_version"],
            "dataset_provider": row["dataset_provider"],
            "dataset_license": row["dataset_license"],
            "dataset_url": row["dataset_url"],
            "dataset_scale": row.get("dataset_scale"),
            "retrieved_at": row["dataset_retrieved_at"].isoformat()
            if row.get("dataset_retrieved_at") else None,
            "source_feature_id": row.get("source_feature_id"),
        },
    }

    if include_geometry:
        result["geometry"] = row.get("geometry")

    return result
