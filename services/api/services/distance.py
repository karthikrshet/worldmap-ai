"""
Geodesic distance calculation service.

Uses pyproj.Geod (PROJ library) to compute geodesic (great-circle on WGS84 ellipsoid)
distances between two geographic points.

Reference:
  Karney, C.F.F. (2013). Algorithms for geodesics.
  Journal of Geodesy, 87(1), 43-55.
  https://doi.org/10.1007/s00190-012-0578-z
"""

from __future__ import annotations

from typing import Any

import structlog
from pyproj import Geod

logger = structlog.get_logger(__name__)

_GEOD = Geod(ellps="WGS84")


def calculate_geodesic_distance(
    lon1: float,
    lat1: float,
    lon2: float,
    lat2: float,
    label_a: str = "Point A",
    label_b: str = "Point B",
) -> dict[str, Any]:
    """
    Calculate the geodesic distance between two geographic points.

    Parameters
    ----------
    lon1, lat1 : float
        Longitude and latitude of the first point (degrees, WGS84).
    lon2, lat2 : float
        Longitude and latitude of the second point (degrees, WGS84).

    Returns
    -------
    dict
        Distance in km and m, bearing, method, and provenance metadata.

    Notes
    -----
    Geod.inv() returns (forward_azimuth, back_azimuth, distance_m).
    The forward_azimuth is the bearing FROM point 1 TO point 2 (degrees from N).
    """
    _validate_coordinates(lon1, lat1, "Point A")
    _validate_coordinates(lon2, lat2, "Point B")

    try:
        # forward_azimuth: bearing from A to B (degrees clockwise from north)
        # back_azimuth: bearing from B to A
        # distance_m: geodesic distance in metres
        forward_az, back_az, distance_m = _GEOD.inv(lon1, lat1, lon2, lat2)
        distance_km = distance_m / 1000.0

        return {
            "point_a": {"lon": lon1, "lat": lat1, "label": label_a},
            "point_b": {"lon": lon2, "lat": lat2, "label": label_b},
            "distance_m": round(distance_m, 1),
            "distance_km": round(distance_km, 2),
            "forward_bearing_deg": round(forward_az % 360, 2),
            "back_bearing_deg": round(back_az % 360, 2),
            "method": "geodesic",
            "ellipsoid": "WGS84",
            "algorithm": "Karney (2013) via pyproj",
            "calculation": {
                "engine": "pyproj",
                "ellipsoid": "WGS84",
                "crs": "EPSG:4326",
            },
            "display_note": (
                "Geodesic distance follows the shortest path on the WGS84 ellipsoid. "
                "This differs from rhumb-line (constant-bearing) distance."
            ),
        }
    except Exception as exc:
        logger.error("Geodesic distance calculation failed", error=str(exc))
        return {
            "distance_m": None,
            "distance_km": None,
            "status": "unavailable",
            "reason": str(exc),
        }


def _validate_coordinates(lon: float, lat: float, label: str) -> None:
    """Validate that coordinates are within valid WGS84 bounds."""
    if not (-180.0 <= lon <= 180.0):
        raise ValueError(f"{label}: longitude {lon} is outside valid range [-180, 180]")
    if not (-90.0 <= lat <= 90.0):
        raise ValueError(f"{label}: latitude {lat} is outside valid range [-90, 90]")
