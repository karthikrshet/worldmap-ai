"""
Geometry service: polygon relocation, centroid, bounding box operations.

Used for the True Size overlay feature — moving a country polygon
to a different latitude for visual size comparison.
"""

from __future__ import annotations

from typing import Any

import structlog
from shapely.geometry import mapping, shape
from shapely.ops import transform as shapely_transform
import pyproj

logger = structlog.get_logger(__name__)


def relocate_geometry(
    geometry_geojson: dict[str, Any],
    target_lon: float,
    target_lat: float,
    source_name: str = "Unknown entity",
) -> dict[str, Any]:
    """
    Relocate a polygon to a new centroid position.

    Used for True Size mode: move a country polygon to a different latitude
    to show how its appearance changes under different projections.

    IMPORTANT: The original geometry is NOT modified. This creates a new
    geometry positioned for visual comparison only.

    Parameters
    ----------
    geometry_geojson : dict
        Source GeoJSON geometry (Polygon or MultiPolygon in EPSG:4326).
    target_lon, target_lat : float
        Target centroid position in EPSG:4326.
    source_name : str
        Display name of the entity (for labeling in UI).

    Returns
    -------
    dict
        GeoJSON geometry of the relocated polygon with comparison warning.
    """
    try:
        geom = shape(geometry_geojson)
        if geom.is_empty:
            return {"error": "Geometry is empty"}

        # Compute current centroid
        centroid = geom.centroid
        delta_lon = target_lon - centroid.x
        delta_lat = target_lat - centroid.y

        # Simple translation in geographic space
        # This is an approximation appropriate for visual comparison only.
        # For small offsets the approximation is acceptable.
        def translate(geom_obj: Any) -> Any:
            from shapely.affinity import translate as shapely_translate
            return shapely_translate(geom_obj, xoff=delta_lon, yoff=delta_lat)

        relocated = translate(geom)
        relocated_geojson = mapping(relocated)

        return {
            "geometry": relocated_geojson,
            "original_centroid": {"lon": centroid.x, "lat": centroid.y},
            "relocated_centroid": {"lon": target_lon, "lat": target_lat},
            "comparison_warning": (
                f"This geometry has been relocated for visual comparison only. "
                f"{source_name} is not geographically located here. "
                "Shape appearance may differ across projections."
            ),
            "method": "centroid-translation",
            "note": "Geographic coordinates of original entity are unchanged.",
        }
    except Exception as exc:
        logger.error("Geometry relocation failed", error=str(exc))
        return {"error": str(exc), "status": "unavailable"}


def get_geometry_info(geometry_geojson: dict[str, Any]) -> dict[str, Any]:
    """
    Return centroid, bounding box, and basic properties of a geometry.

    Returns
    -------
    dict
        Centroid, bbox, area type, validity status.
    """
    try:
        geom = shape(geometry_geojson)
        centroid = geom.centroid
        bounds = geom.bounds  # (minx, miny, maxx, maxy)

        return {
            "centroid": {"lon": round(centroid.x, 6), "lat": round(centroid.y, 6)},
            "bbox": {
                "minx": bounds[0],
                "miny": bounds[1],
                "maxx": bounds[2],
                "maxy": bounds[3],
            },
            "geometry_type": geom.geom_type,
            "is_valid": geom.is_valid,
            "crs": "EPSG:4326",
        }
    except Exception as exc:
        return {"error": str(exc), "status": "unavailable"}
