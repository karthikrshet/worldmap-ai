"""
Calculations router — geodesic area, distance, and comparison endpoints.

Architecture: The LLM must NEVER calculate geographic facts.
These endpoints are the authoritative calculation layer.
Every result includes full provenance metadata.
"""

from __future__ import annotations

import time
from typing import Annotated, Any

import structlog
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from db.connection import get_session
from services.area import calculate_geodesic_area, calculate_ratio
from services.distance import calculate_geodesic_distance

logger = structlog.get_logger(__name__)
router = APIRouter(tags=["calculations"])


# ── Request models ────────────────────────────────────────────────

class AreaRequest(BaseModel):
    iso3: str = Field(..., min_length=3, max_length=3, description="ISO3 country code")


class CompareAreaRequest(BaseModel):
    entity_a: str = Field(..., min_length=2, max_length=3, description="ISO2 or ISO3 code")
    entity_b: str = Field(..., min_length=2, max_length=3, description="ISO2 or ISO3 code")


class DistanceRequest(BaseModel):
    lon1: float = Field(..., ge=-180, le=180)
    lat1: float = Field(..., ge=-90, le=90)
    lon2: float = Field(..., ge=-180, le=180)
    lat2: float = Field(..., ge=-90, le=90)
    label_a: str = Field(default="Point A", max_length=100)
    label_b: str = Field(default="Point B", max_length=100)


class MultiCompareRequest(BaseModel):
    entity_codes: list[str] = Field(
        ...,
        min_length=2,
        max_length=20,
        description="List of ISO2 or ISO3 codes to compare total area",
    )
    compare_to: str | None = Field(
        default=None,
        description="Optional reference entity ISO3 code to compare aggregate against",
    )


# ── Endpoints ─────────────────────────────────────────────────────

@router.post("/calculations/area")
async def calculate_area(
    body: AreaRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict[str, Any]:
    """
    Calculate the geodesic area of a country from its stored geometry.

    Returns area in m² and km² with full provenance.
    Values come from actual geometric computation — never from hardcoded figures.
    """
    entity, dataset = await _fetch_entity_with_geometry(body.iso3.upper(), session)

    geometry_geojson = entity["geometry"]
    result = calculate_geodesic_area(
        geometry_geojson=geometry_geojson,
        dataset_id=str(dataset["id"]),
        dataset_version=dataset["version"],
        dataset_name=dataset["name"],
    )

    if result.get("status") == "unavailable":
        raise HTTPException(status_code=422, detail=result.get("reason", "Calculation failed"))

    return {
        "entity": {
            "name": entity["name"],
            "iso3": entity["iso3"],
        },
        **result,
    }


@router.post("/calculations/compare-area")
async def compare_area(
    body: CompareAreaRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict[str, Any]:
    """
    Compare the geodesic areas of two geographic entities.

    Both values are calculated from stored geometry.
    The ratio, difference, and percentage are derived from those calculations.
    No values are hardcoded or AI-generated.
    """
    t_start = time.perf_counter()

    entity_a, dataset_a = await _fetch_entity_with_geometry(body.entity_a.upper(), session)
    entity_b, dataset_b = await _fetch_entity_with_geometry(body.entity_b.upper(), session)

    result_a = calculate_geodesic_area(
        entity_a["geometry"],
        str(dataset_a["id"]),
        dataset_a["version"],
        dataset_a["name"],
    )
    result_b = calculate_geodesic_area(
        entity_b["geometry"],
        str(dataset_b["id"]),
        dataset_b["version"],
        dataset_b["name"],
    )

    if result_a.get("status") == "unavailable" or result_b.get("status") == "unavailable":
        raise HTTPException(
            status_code=422,
            detail="Unable to calculate area for one or both entities",
        )

    ratio_data = calculate_ratio(result_a["area_km2"], result_b["area_km2"])

    duration_ms = round((time.perf_counter() - t_start) * 1000, 2)

    return {
        "entity_a": {
            "name": entity_a["name"],
            "iso3": entity_a["iso3"],
            "area_km2": result_a["area_km2"],
            "area_m2": result_a["area_m2"],
            "source": result_a["source"],
            "calculation": result_a["calculation"],
        },
        "entity_b": {
            "name": entity_b["name"],
            "iso3": entity_b["iso3"],
            "area_km2": result_b["area_km2"],
            "area_m2": result_b["area_m2"],
            "source": result_b["source"],
            "calculation": result_b["calculation"],
        },
        "comparison": ratio_data,
        "method": "geodesic-area",
        "ellipsoid": "WGS84",
        "formulas": {
            "ratio": "area_a / area_b",
            "difference": "area_a - area_b",
            "percentage_difference": "((area_a - area_b) / area_b) × 100",
        },
        "duration_ms": duration_ms,
        "provenance_note": (
            "All area values are calculated from polygon geometries using the "
            "WGS84 ellipsoid (Karney algorithm via pyproj). "
            "Geometry-derived areas may differ from official statistical figures. "
            "See CALCULATIONS.md."
        ),
    }


@router.post("/calculations/distance")
async def calculate_distance(body: DistanceRequest) -> dict[str, Any]:
    """
    Calculate geodesic distance between two geographic points.

    Uses pyproj Geod with WGS84 ellipsoid (Karney algorithm).
    Method is clearly identified in the response.
    """
    result = calculate_geodesic_distance(
        lon1=body.lon1,
        lat1=body.lat1,
        lon2=body.lon2,
        lat2=body.lat2,
        label_a=body.label_a,
        label_b=body.label_b,
    )

    if result.get("status") == "unavailable":
        raise HTTPException(status_code=422, detail=result.get("reason", "Calculation failed"))

    return result


@router.post("/calculations/compare-area/multi")
async def compare_area_multi(
    body: MultiCompareRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict[str, Any]:
    """
    Compare total area of multiple entities, optionally against a reference.

    All areas are calculated from stored geometry. Total is the sum of those calculations.
    """
    entities_data = []
    total_area_km2 = 0.0

    for code in body.entity_codes:
        try:
            entity, dataset = await _fetch_entity_with_geometry(code.upper(), session)
        except HTTPException:
            entities_data.append({"code": code, "status": "not_found"})
            continue

        result = calculate_geodesic_area(
            entity["geometry"],
            str(dataset["id"]),
            dataset["version"],
            dataset["name"],
        )

        if result.get("area_km2"):
            total_area_km2 += result["area_km2"]
            entities_data.append({
                "name": entity["name"],
                "iso3": entity["iso3"],
                "area_km2": result["area_km2"],
                "source": result["source"],
            })
        else:
            entities_data.append({"code": code, "status": "calculation_failed"})

    response: dict[str, Any] = {
        "entities": entities_data,
        "total_area_km2": round(total_area_km2, 2),
        "method": "geodesic-area",
        "ellipsoid": "WGS84",
    }

    if body.compare_to:
        try:
            ref_entity, ref_dataset = await _fetch_entity_with_geometry(
                body.compare_to.upper(), session
            )
            ref_result = calculate_geodesic_area(
                ref_entity["geometry"],
                str(ref_dataset["id"]),
                ref_dataset["version"],
                ref_dataset["name"],
            )
            if ref_result.get("area_km2"):
                ratio_data = calculate_ratio(total_area_km2, ref_result["area_km2"])
                response["reference"] = {
                    "name": ref_entity["name"],
                    "iso3": ref_entity["iso3"],
                    "area_km2": ref_result["area_km2"],
                }
                response["comparison"] = ratio_data
        except HTTPException:
            response["reference"] = {"status": "not_found", "code": body.compare_to}

    return response


# ── Helpers ───────────────────────────────────────────────────────

async def _fetch_entity_with_geometry(
    code: str, session: AsyncSession
) -> tuple[dict[str, Any], dict[str, Any]]:
    """
    Fetch a geographic entity and its geometry from the database.
    Raises HTTPException if not found.
    """
    sql = text("""
        SELECT
            ge.id, ge.name, ge.iso3, ge.iso2,
            ST_AsGeoJSON(ge.geometry)::jsonb AS geometry,
            d.id AS dataset_id, d.name, d.version, d.license, d.source_url
        FROM geographic_entities ge
        JOIN datasets d ON ge.dataset_id = d.id
        WHERE UPPER(ge.iso3) = :code OR UPPER(ge.iso2) = :code
        LIMIT 1
    """)

    result = await session.execute(sql, {"code": code})
    row = result.mappings().first()

    if not row:
        raise HTTPException(
            status_code=404,
            detail=f"Entity '{code}' not found. Use ISO2 or ISO3 code.",
        )

    if not row["geometry"]:
        raise HTTPException(
            status_code=422,
            detail=f"Geometry unavailable for '{code}'.",
        )

    entity = {
        "id": str(row["id"]),
        "name": row["name"],
        "iso3": row["iso3"],
        "iso2": row["iso2"],
        "geometry": row["geometry"],
    }
    dataset = {
        "id": str(row["dataset_id"]),
        "name": row["name_1"] if "name_1" in row else row["name"],
        "version": row["version"],
        "license": row["license"],
        "source_url": row["source_url"],
    }

    return entity, dataset
