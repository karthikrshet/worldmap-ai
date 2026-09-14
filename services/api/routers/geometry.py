"""Geometry router — polygon relocation (True Size) and transform endpoints."""

from __future__ import annotations

from typing import Any

import structlog
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.geometry import get_geometry_info, relocate_geometry
from services.projections import get_projection, transform_coordinates

logger = structlog.get_logger(__name__)
router = APIRouter(tags=["geometry"])


class RelocateRequest(BaseModel):
    geometry: dict[str, Any] = Field(..., description="GeoJSON geometry object")
    target_lon: float = Field(..., ge=-180, le=180)
    target_lat: float = Field(..., ge=-90, le=90)
    entity_name: str = Field(default="Unknown entity", max_length=200)


class GeometryInfoRequest(BaseModel):
    geometry: dict[str, Any] = Field(..., description="GeoJSON geometry object")


@router.post("/geometry/relocate")
async def relocate_polygon(body: RelocateRequest) -> dict[str, Any]:
    """
    Relocate a polygon to a new centroid for True Size visual comparison.

    IMPORTANT: The relocated geometry is for visual comparison only.
    The API response includes a warning that must be displayed to users.
    The original entity's geographic location is not changed.
    """
    # Validate geometry type
    geom_type = body.geometry.get("type", "")
    if geom_type not in ("Polygon", "MultiPolygon", "GeometryCollection"):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported geometry type: {geom_type}. Expected Polygon or MultiPolygon.",
        )

    result = relocate_geometry(
        geometry_geojson=body.geometry,
        target_lon=body.target_lon,
        target_lat=body.target_lat,
        source_name=body.entity_name,
    )

    if "error" in result:
        raise HTTPException(status_code=422, detail=result["error"])

    return result


@router.post("/geometry/info")
async def geometry_info(body: GeometryInfoRequest) -> dict[str, Any]:
    """Return centroid, bounding box, and metadata for a GeoJSON geometry."""
    result = get_geometry_info(body.geometry)
    if "error" in result:
        raise HTTPException(status_code=422, detail=result["error"])
    return result
