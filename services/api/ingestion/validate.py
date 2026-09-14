"""
Geometry validation for ingested datasets.

Validates GeoJSON/GeoDataFrame geometries before loading to PostGIS.
Rejects or repairs invalid geometries; never silently accepts corrupt data.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import structlog
from shapely.geometry import shape
from shapely.validation import explain_validity

logger = structlog.get_logger(__name__)


@dataclass
class ValidationResult:
    valid_count: int = 0
    repaired_count: int = 0
    rejected_count: int = 0
    rejected_ids: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


def validate_and_repair_geometries(
    features: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], ValidationResult]:
    """
    Validate and repair geometry for a list of GeoJSON features.

    Repairs:
    - Invalid polygons are repaired with .buffer(0)
    - Coordinates outside WGS84 bounds are rejected

    Rejections:
    - Empty geometries
    - Geometries that cannot be repaired

    Parameters
    ----------
    features : list[dict]
        List of GeoJSON Feature dicts.

    Returns
    -------
    tuple[list[dict], ValidationResult]
        Valid (possibly repaired) features and validation statistics.
    """
    valid_features: list[dict[str, Any]] = []
    result = ValidationResult()

    for feat in features:
        props = feat.get("properties", {})
        feature_id = props.get("ISO_A3") or props.get("iso3") or str(feat.get("id", "unknown"))

        geom_data = feat.get("geometry")
        if not geom_data:
            logger.warning("Feature has no geometry", feature_id=feature_id)
            result.rejected_count += 1
            result.rejected_ids.append(feature_id)
            continue

        try:
            geom = shape(geom_data)
        except Exception as exc:
            logger.error("Cannot parse geometry", feature_id=feature_id, error=str(exc))
            result.rejected_count += 1
            result.rejected_ids.append(feature_id)
            continue

        # Reject empty geometries
        if geom.is_empty:
            logger.warning("Empty geometry rejected", feature_id=feature_id)
            result.rejected_count += 1
            result.rejected_ids.append(feature_id)
            continue

        # Validate coordinate bounds (WGS84: lon [-180,180], lat [-90,90])
        if not _check_coordinate_bounds(geom):
            logger.warning("Coordinates outside WGS84 bounds", feature_id=feature_id)
            result.rejected_count += 1
            result.rejected_ids.append(feature_id)
            continue

        # Repair invalid geometry
        if not geom.is_valid:
            reason = explain_validity(geom)
            logger.warning(
                "Repairing invalid geometry",
                feature_id=feature_id,
                reason=reason,
            )
            repaired = geom.buffer(0)
            if repaired.is_empty or not repaired.is_valid:
                logger.error("Geometry repair failed", feature_id=feature_id)
                result.rejected_count += 1
                result.rejected_ids.append(feature_id)
                continue
            feat = {**feat, "geometry": _geom_to_geojson(repaired)}
            result.repaired_count += 1

        valid_features.append(feat)
        result.valid_count += 1

    logger.info(
        "Geometry validation complete",
        valid=result.valid_count,
        repaired=result.repaired_count,
        rejected=result.rejected_count,
    )

    return valid_features, result


def _check_coordinate_bounds(geom: Any) -> bool:
    """Verify all coordinates are within WGS84 bounds."""
    try:
        bounds = geom.bounds  # (minx, miny, maxx, maxy)
        minx, miny, maxx, maxy = bounds
        return (
            minx >= -180.0
            and maxx <= 180.0
            and miny >= -90.0
            and maxy <= 90.0
        )
    except Exception:
        return False


def _geom_to_geojson(geom: Any) -> dict[str, Any]:
    """Convert a Shapely geometry to GeoJSON dict."""
    from shapely.geometry import mapping
    return mapping(geom)
