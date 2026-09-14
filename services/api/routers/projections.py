"""Projections router — catalog and coordinate transform endpoints."""

from __future__ import annotations

from typing import Any

import structlog
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator

from services.projections import (
    get_all_projections,
    get_projection,
    transform_coordinates,
)

logger = structlog.get_logger(__name__)
router = APIRouter(tags=["projections"])


@router.get("/projections")
async def list_projections() -> dict[str, Any]:
    """Return all projections in the catalog with full metadata."""
    projections = get_all_projections()
    return {
        "data": projections,
        "count": len(projections),
        "note": (
            "All projections listed here are mathematically defined. "
            "No single projection is universally superior. "
            "Projection choice depends on the intended use and which property must be preserved."
        ),
    }


@router.get("/projections/{projection_id}")
async def get_projection_detail(projection_id: str) -> dict[str, Any]:
    """Return detailed metadata for a single projection."""
    proj = get_projection(projection_id)
    if not proj:
        raise HTTPException(
            status_code=404,
            detail=f"Projection '{projection_id}' not found in catalog",
        )
    return proj


class TransformRequest(BaseModel):
    lon: float = Field(..., ge=-180, le=180, description="Longitude in degrees (WGS84)")
    lat: float = Field(..., ge=-90, le=90, description="Latitude in degrees (WGS84)")
    source_crs: str = Field(default="EPSG:4326", description="Source CRS (EPSG or PROJ string)")
    target_projection: str = Field(..., description="Target projection ID from the catalog")


@router.post("/projection/transform")
async def transform_coordinate(body: TransformRequest) -> dict[str, Any]:
    """
    Transform a coordinate pair from EPSG:4326 to a target projection.
    Uses PROJ via pyproj. Never executes arbitrary strings as commands.
    """
    proj = get_projection(body.target_projection)
    if not proj:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown projection '{body.target_projection}'. Use GET /projections for valid IDs.",
        )

    proj_def = proj.get("proj_definition") or proj.get("epsg")
    if not proj_def:
        raise HTTPException(status_code=400, detail="Projection has no PROJ definition")

    result = transform_coordinates(body.lon, body.lat, body.source_crs, proj_def)
    if "error" in result:
        raise HTTPException(status_code=422, detail=result["error"])
    return result
