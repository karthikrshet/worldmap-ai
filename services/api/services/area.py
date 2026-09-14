"""
Geodesic area calculation service.

Uses pyproj.Geod (PROJ library) for ellipsoidal area calculations.
The WGS84 ellipsoid is the standard for GPS and most modern geospatial work.

Reference:
  Karney, C.F.F. (2013). Algorithms for geodesics.
  Journal of Geodesy, 87(1), 43-55.
  https://doi.org/10.1007/s00190-012-0578-z

  pyproj documentation: https://pyproj4.github.io/pyproj/stable/api/geod.html
"""

from __future__ import annotations

import math
from typing import Any

import structlog
from pyproj import Geod
from shapely.geometry import shape

logger = structlog.get_logger(__name__)

# WGS84 ellipsoid — the standard for GPS and modern geospatial work.
# 'WGS84' is equivalent to EPSG:4326 datum.
_GEOD = Geod(ellps="WGS84")

M2_TO_KM2 = 1e-6  # 1 km² = 1,000,000 m²


def calculate_geodesic_area(
    geometry_geojson: dict[str, Any],
    dataset_id: str,
    dataset_version: str,
    dataset_name: str = "Unknown",
) -> dict[str, Any]:
    """
    Calculate the geodesic (ellipsoidal) area of a GeoJSON geometry.

    Parameters
    ----------
    geometry_geojson : dict
        A valid GeoJSON geometry object (Polygon or MultiPolygon).
    dataset_id : str
        UUID of the dataset this geometry originates from.
    dataset_version : str
        Version string of the source dataset.
    dataset_name : str
        Human-readable dataset name for provenance display.

    Returns
    -------
    dict
        Structured result with area values, method, and provenance.
        Area is always positive (absolute value of signed area).

    Notes
    -----
    pyproj.Geod.geometry_area_perimeter returns a signed area.
    The sign depends on winding order (negative = clockwise / polygon interior).
    We take the absolute value — the magnitude is what matters for area.
    """
    try:
        geom = shape(geometry_geojson)

        if geom.is_empty:
            return _unavailable_result("Geometry is empty")

        # Repair invalid geometry before calculation
        if not geom.is_valid:
            geom = geom.buffer(0)
            logger.warning("Repaired invalid geometry before area calculation")

        # pyproj.Geod.geometry_area_perimeter:
        # Returns (area_m2, perimeter_m) using the Karney algorithm on WGS84.
        # area_m2 is signed (negative for CW winding). We take abs().
        area_m2_signed, perimeter_m = _GEOD.geometry_area_perimeter(geom)
        area_m2 = abs(area_m2_signed)
        area_km2 = area_m2 * M2_TO_KM2
        perimeter_km = abs(perimeter_m) / 1000.0

        return {
            "area_m2": round(area_m2, 0),
            "area_km2": round(area_km2, 2),
            "perimeter_km": round(perimeter_km, 2),
            "method": "geodesic-area",
            "ellipsoid": "WGS84",
            "algorithm": "Karney (2013) via pyproj",
            "geometry_type": geom.geom_type,
            "source": {
                "dataset_id": dataset_id,
                "dataset_name": dataset_name,
                "dataset_version": dataset_version,
            },
            "calculation": {
                "engine": "pyproj",
                "engine_version": _get_pyproj_version(),
                "proj_version": _get_proj_version(),
                "ellipsoid": "WGS84",
                "crs": "EPSG:4326",
            },
            "precision_note": (
                "Area precision is limited by geometry resolution. "
                "Natural Earth 1:10m geometries are suitable for continental-scale comparisons. "
                "See CALCULATIONS.md for methodology details."
            ),
        }

    except Exception as exc:
        logger.error("Geodesic area calculation failed", error=str(exc))
        return _unavailable_result(f"Calculation failed: {exc}")


def calculate_ratio(area_a_km2: float, area_b_km2: float) -> dict[str, Any]:
    """
    Calculate area ratio and difference between two areas.

    Formula:
        ratio = area_a / area_b
        difference_km2 = area_a - area_b
        percentage_difference = ((area_a - area_b) / area_b) × 100

    Returns
    -------
    dict
        Ratio, absolute difference, and percentage difference with formula documentation.
    """
    if area_b_km2 == 0:
        return {"error": "Cannot divide by zero area"}

    ratio = area_a_km2 / area_b_km2
    difference_km2 = area_a_km2 - area_b_km2
    # Percentage difference relative to B
    pct_diff = ((area_a_km2 - area_b_km2) / area_b_km2) * 100

    return {
        "ratio": round(ratio, 4),
        "ratio_display": f"{ratio:.2f}×",
        "difference_km2": round(difference_km2, 2),
        "percentage_difference": round(pct_diff, 2),
        "formulas": {
            "ratio": "area_a / area_b",
            "difference": "area_a - area_b",
            "percentage_difference": "((area_a - area_b) / area_b) × 100",
        },
    }


def _unavailable_result(reason: str) -> dict[str, Any]:
    """Return a structured 'data unavailable' result — never invent values."""
    return {
        "area_m2": None,
        "area_km2": None,
        "method": "geodesic-area",
        "ellipsoid": "WGS84",
        "status": "unavailable",
        "reason": reason,
    }


def _get_pyproj_version() -> str:
    try:
        import pyproj
        return pyproj.__version__
    except Exception:
        return "unknown"


def _get_proj_version() -> str:
    try:
        from pyproj import proj_version_str
        return proj_version_str
    except Exception:
        try:
            from pyproj._datadir import get_data_dir
            import pyproj
            return str(getattr(pyproj, "proj_version_str", "unknown"))
        except Exception:
            return "unknown"
