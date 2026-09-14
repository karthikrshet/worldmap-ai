"""
Projection metadata and coordinate transformation service.

Uses pyproj/PROJ for coordinate transformations.
Projection catalog metadata is defined in packages/projection-catalog
and mirrored here for the Python API.

PROJ documentation: https://proj.org/en/stable/usage/projections.html
"""

from __future__ import annotations

from typing import Any

import structlog
from pyproj import Transformer, CRS

logger = structlog.get_logger(__name__)


# Projection catalog — mirrored from packages/projection-catalog/
# Each entry uses the PROJ string definition for authoritative transforms.
# Properties are based on established cartographic literature.
PROJECTION_CATALOG: dict[str, dict[str, Any]] = {
    "equal-earth": {
        "id": "equal-earth",
        "name": "Equal Earth",
        "family": "pseudocylindrical",
        "preserves_area": True,
        "preserves_angles": False,
        "preserves_distance_globally": False,
        "projection_type": "equal-area",
        "description": (
            "Equal Earth is a pseudocylindrical equal-area projection designed "
            "in 2018 by Šavrič, Patterson & Jenny. It is the default projection "
            "for WorldMap AI because it preserves relative area while maintaining "
            "a visually pleasing appearance. Like all flat maps, it distorts "
            "shapes and distances — but area ratios remain accurate."
        ),
        "proj_definition": "+proj=eqearth +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs",
        "epsg": None,
        "d3_projection": "geoEqualEarth",
        "appropriate_uses": ["World thematic maps", "Area comparison", "General reference"],
        "limitations": ["Shape distortion near poles and edges"],
        "references": [
            "Šavrič, B., Patterson, T. & Jenny, B. (2018). The Equal Earth map projection. International Journal of Geographical Information Science.",
        ],
        "un_resolution_note": (
            "The UN General Assembly resolution A/80/L.104 (September 4, 2026) "
            "encourages equal-area projections when relative area matters. "
            "It does not mandate Equal Earth specifically or prohibit Mercator."
        ),
    },
    "mercator": {
        "id": "mercator",
        "name": "Mercator",
        "family": "cylindrical",
        "preserves_area": False,
        "preserves_angles": True,
        "preserves_distance_globally": False,
        "projection_type": "conformal",
        "description": (
            "Mercator is a cylindrical conformal projection created by Gerardus Mercator "
            "in 1569 for nautical navigation. It preserves local angles (shapes), "
            "making rhumb lines appear as straight lines — essential for navigation. "
            "However, it severely exaggerates area near the poles: Greenland appears "
            "similar in size to Africa, though Africa is approximately 14 times larger."
        ),
        "proj_definition": "+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs",
        "epsg": "EPSG:3857",
        "d3_projection": "geoMercator",
        "appropriate_uses": ["Web mapping (street maps)", "Nautical navigation", "Local area maps"],
        "limitations": [
            "Extreme area distortion at high latitudes",
            "Cannot include poles",
            "Misleading for world area comparisons",
        ],
        "references": [
            "Snyder, J.P. (1987). Map Projections — A Working Manual. USGS Professional Paper 1395.",
        ],
    },
    "robinson": {
        "id": "robinson",
        "name": "Robinson",
        "family": "pseudocylindrical",
        "preserves_area": False,
        "preserves_angles": False,
        "preserves_distance_globally": False,
        "projection_type": "compromise",
        "description": (
            "Robinson is a pseudocylindrical compromise projection created by Arthur Robinson "
            "in 1963 for the Rand McNally atlas. It trades accuracy in all properties "
            "to achieve a visually balanced world map. Used by National Geographic "
            "from 1988 to 1998."
        ),
        "proj_definition": "+proj=robin +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs",
        "epsg": None,
        "d3_projection": "geoRobinson",
        "appropriate_uses": ["General world reference maps", "Educational maps"],
        "limitations": ["Neither conformal nor equal-area — a compromise"],
        "references": [
            "Snyder, J.P. & Voxland, P.M. (1989). An Album of Map Projections. USGS Professional Paper 1453.",
        ],
    },
    "winkel-tripel": {
        "id": "winkel-tripel",
        "name": "Winkel Tripel",
        "family": "pseudoazimuthal",
        "preserves_area": False,
        "preserves_angles": False,
        "preserves_distance_globally": False,
        "projection_type": "compromise",
        "description": (
            "Winkel Tripel (German for 'triple') minimises the sum of distortions "
            "in area, direction, and distance. Created by Oswald Winkel in 1921. "
            "Used by the National Geographic Society for world maps since 1998."
        ),
        "proj_definition": "+proj=wintri +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs",
        "epsg": None,
        "d3_projection": "geoWinkel3",
        "appropriate_uses": ["General world reference maps", "Educational maps"],
        "limitations": ["Compromise — not optimised for any single property"],
        "references": [
            "Snyder, J.P. & Voxland, P.M. (1989). An Album of Map Projections. USGS Professional Paper 1453.",
        ],
    },
    "mollweide": {
        "id": "mollweide",
        "name": "Mollweide",
        "family": "pseudocylindrical",
        "preserves_area": True,
        "preserves_angles": False,
        "preserves_distance_globally": False,
        "projection_type": "equal-area",
        "description": (
            "Mollweide is an equal-area pseudocylindrical projection created by "
            "Karl Brandan Mollweide in 1805. The entire world fits within an ellipse. "
            "Used for thematic world maps where area accuracy is important."
        ),
        "proj_definition": "+proj=moll +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs",
        "epsg": None,
        "d3_projection": "geoMollweide",
        "appropriate_uses": ["Thematic world maps", "Area comparison"],
        "limitations": ["Shape distortion toward edges and poles"],
        "references": [
            "Snyder, J.P. (1987). Map Projections — A Working Manual. USGS Professional Paper 1395.",
        ],
    },
    "cylindrical-equal-area": {
        "id": "cylindrical-equal-area",
        "name": "Gall-Peters (Cylindrical Equal-Area)",
        "family": "cylindrical",
        "preserves_area": True,
        "preserves_angles": False,
        "preserves_distance_globally": False,
        "projection_type": "equal-area",
        "description": (
            "The Gall-Peters projection is a cylindrical equal-area projection "
            "at standard parallels of 45°N and 45°S. It preserves relative area "
            "but significantly distorts shapes — countries near the equator appear "
            "stretched vertically, and those near the poles are compressed. "
            "It received political attention as an alternative to Mercator for "
            "showing the relative sizes of countries in the developing world."
        ),
        "proj_definition": "+proj=cea +lon_0=0 +lat_ts=45 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs",
        "epsg": None,
        "d3_projection": "geoCylindricalEqualArea",
        "appropriate_uses": ["Area comparison where shape distortion is acceptable"],
        "limitations": ["Severe shape distortion — not suitable for navigation or shape comparison"],
        "references": [
            "Snyder, J.P. (1987). Map Projections — A Working Manual. USGS Professional Paper 1395.",
        ],
    },
    "equirectangular": {
        "id": "equirectangular",
        "name": "Equirectangular (Plate Carrée)",
        "family": "cylindrical",
        "preserves_area": False,
        "preserves_angles": False,
        "preserves_distance_globally": False,
        "projection_type": "equidistant",
        "description": (
            "Equirectangular (Plate Carrée) maps longitude directly to x and latitude to y. "
            "Distances along meridians are preserved but no other property is globally preserved. "
            "Used as a simple GIS raster format and for celestial mapping."
        ),
        "proj_definition": "+proj=eqc +lat_ts=0 +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs",
        "epsg": "EPSG:4326",
        "d3_projection": "geoEquirectangular",
        "appropriate_uses": ["GIS raster storage", "Simple reference", "Celestial maps"],
        "limitations": ["Extreme area and shape distortion at high latitudes"],
        "references": [],
    },
    "natural-earth": {
        "id": "natural-earth",
        "name": "Natural Earth II",
        "family": "pseudocylindrical",
        "preserves_area": False,
        "preserves_angles": False,
        "preserves_distance_globally": False,
        "projection_type": "compromise",
        "description": (
            "Natural Earth II is a compromise pseudocylindrical projection created by "
            "Tom Patterson and Bernhard Jenny. It provides a visually pleasing world map "
            "with less polar distortion than many alternatives. Not to be confused with "
            "the Natural Earth dataset."
        ),
        "proj_definition": "+proj=natearth2 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs",
        "epsg": None,
        "d3_projection": "geoNaturalEarth2",
        "appropriate_uses": ["General world reference maps", "Decorative/editorial maps"],
        "limitations": ["Compromise — not optimised for any single property"],
        "references": [
            "Patterson, T. & Jenny, B. (2011). The Field Guide to Selecting Map Projections.",
        ],
    },
    "orthographic": {
        "id": "orthographic",
        "name": "Orthographic (Globe)",
        "family": "azimuthal",
        "preserves_area": False,
        "preserves_angles": False,
        "preserves_distance_globally": False,
        "projection_type": "azimuthal",
        "description": (
            "Orthographic simulates the Earth as seen from infinite distance in space. "
            "It is a perspective projection onto a plane tangent to the globe. "
            "Only one hemisphere is visible. Shapes and areas near the centre are "
            "approximately preserved but distort significantly toward edges. "
            "Used for globe visualisation."
        ),
        "proj_definition": "+proj=ortho +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs",
        "epsg": None,
        "d3_projection": "geoOrthographic",
        "appropriate_uses": ["Globe visualisation", "Hemisphere maps"],
        "limitations": ["Only one hemisphere visible", "Increasing distortion toward edges"],
        "references": [
            "Snyder, J.P. (1987). Map Projections — A Working Manual. USGS Professional Paper 1395.",
        ],
    },
    "azimuthal-equal-area": {
        "id": "azimuthal-equal-area",
        "name": "Lambert Azimuthal Equal Area",
        "family": "azimuthal",
        "preserves_area": True,
        "preserves_angles": False,
        "preserves_distance_globally": False,
        "projection_type": "equal-area",
        "description": (
            "Lambert Azimuthal Equal Area (LAEA) preserves area and true direction "
            "from the central point. Created by Johann Heinrich Lambert in 1772. "
            "Used by the European Environment Agency for Europe-centred maps "
            "and for polar projections."
        ),
        "proj_definition": "+proj=laea +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs",
        "epsg": "EPSG:6933",
        "d3_projection": "geoAzimuthalEqualArea",
        "appropriate_uses": ["Polar maps", "Continent-scale thematic maps", "Area analysis"],
        "limitations": ["Shape distortion far from centre point"],
        "references": [
            "Snyder, J.P. (1987). Map Projections — A Working Manual. USGS Professional Paper 1395.",
        ],
    },
}


def get_all_projections() -> list[dict[str, Any]]:
    """Return the full projection catalog."""
    return list(PROJECTION_CATALOG.values())


def get_projection(projection_id: str) -> dict[str, Any] | None:
    """Return a single projection by ID, or None if not found."""
    return PROJECTION_CATALOG.get(projection_id)


def transform_coordinates(
    lon: float,
    lat: float,
    source_proj: str = "EPSG:4326",
    target_proj: str = "+proj=eqearth",
) -> dict[str, Any]:
    """
    Transform a coordinate pair between CRS/projections using PROJ.

    Parameters
    ----------
    lon, lat : float
        Input coordinates in the source CRS.
    source_proj : str
        Source CRS (EPSG code or PROJ string).
    target_proj : str
        Target CRS (EPSG code or PROJ string).

    Returns
    -------
    dict
        Transformed coordinates with provenance.
    """
    try:
        transformer = Transformer.from_crs(source_proj, target_proj, always_xy=True)
        x, y = transformer.transform(lon, lat)
        return {
            "input": {"lon": lon, "lat": lat, "crs": source_proj},
            "output": {"x": x, "y": y, "crs": target_proj},
            "engine": "pyproj/PROJ",
            "method": "coordinate-transform",
        }
    except Exception as exc:
        logger.error("Coordinate transform failed", error=str(exc))
        return {
            "error": str(exc),
            "status": "unavailable",
            "reason": "Projection transformation failed",
        }
