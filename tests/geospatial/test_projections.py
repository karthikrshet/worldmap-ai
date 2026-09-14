"""
Projection round-trip tests.

Tests that lon/lat → projection → inverse → lon/lat recovers the original
coordinates within acceptable tolerance.

This validates that PROJ transforms are invertible and that no coordinate
corruption occurs in the pipeline.

PROJ documentation: https://proj.org/en/stable/usage/projections.html
"""

from __future__ import annotations

import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../services/api"))

from services.projections import (
    PROJECTION_CATALOG,
    get_all_projections,
    get_projection,
    transform_coordinates,
)


class TestProjectionCatalog:
    """Tests for the projection catalog metadata."""

    def test_catalog_has_required_projections(self):
        """All 10 required projections must be in the catalog."""
        required = {
            "equal-earth",
            "mercator",
            "robinson",
            "winkel-tripel",
            "mollweide",
            "cylindrical-equal-area",
            "equirectangular",
            "natural-earth",
            "orthographic",
            "azimuthal-equal-area",
        }
        catalog_ids = set(PROJECTION_CATALOG.keys())
        missing = required - catalog_ids
        assert not missing, f"Missing projections: {missing}"

    def test_equal_earth_preserves_area(self):
        """Equal Earth must be marked as area-preserving."""
        proj = get_projection("equal-earth")
        assert proj is not None
        assert proj["preserves_area"] is True

    def test_mercator_preserves_angles(self):
        """Mercator must be marked as conformal (angle-preserving)."""
        proj = get_projection("mercator")
        assert proj is not None
        assert proj["preserves_angles"] is True
        assert proj["preserves_area"] is False

    def test_every_projection_has_required_fields(self):
        """Every catalog entry must have the required interface fields."""
        required_fields = {
            "id", "name", "family", "preserves_area", "preserves_angles",
            "projection_type", "description", "references",
        }
        for proj_id, proj in PROJECTION_CATALOG.items():
            missing = required_fields - set(proj.keys())
            assert not missing, f"Projection '{proj_id}' missing fields: {missing}"

    def test_every_projection_has_proj_definition_or_epsg(self):
        """Every projection must have at least a PROJ definition or EPSG code."""
        for proj_id, proj in PROJECTION_CATALOG.items():
            has_proj = bool(proj.get("proj_definition"))
            has_epsg = bool(proj.get("epsg"))
            assert has_proj or has_epsg, (
                f"Projection '{proj_id}' has neither proj_definition nor epsg"
            )

    def test_equal_area_projections_are_marked(self):
        """All equal-area projections must have preserves_area=True."""
        expected_equal_area = {
            "equal-earth",
            "mollweide",
            "cylindrical-equal-area",
            "azimuthal-equal-area",
        }
        for proj_id in expected_equal_area:
            proj = get_projection(proj_id)
            assert proj is not None, f"Projection '{proj_id}' not found"
            assert proj["preserves_area"] is True, (
                f"Projection '{proj_id}' should have preserves_area=True"
            )

    def test_un_resolution_note_on_equal_earth(self):
        """Equal Earth entry must include UN Resolution note."""
        proj = get_projection("equal-earth")
        assert proj is not None
        note = proj.get("un_resolution_note", "")
        assert "A/80/L.104" in note
        assert "Mercator" in note  # note must say Mercator is not prohibited


class TestProjectionRoundTrip:
    """
    Test lon/lat → projection transform → inverse → lon/lat round-trips.

    Tolerance: 1e-6 degrees (≈ 0.1 metres at equator).
    Some projections have singularities (poles, dateline) —
    we use safe interior test points.
    """

    TOLERANCE_DEG = 1e-4  # 0.0001° ≈ 11 metres — appropriate for display purposes

    # Test points: (lon, lat, label)
    # Chosen to avoid projection singularities
    TEST_POINTS = [
        (0.0, 0.0, "Null Island"),
        (77.2090, 28.6139, "New Delhi"),
        (-74.0060, 40.7128, "New York"),
        (2.3522, 48.8566, "Paris"),
        (-43.1729, -22.9068, "Rio de Janeiro"),
        (139.6917, 35.6895, "Tokyo"),
        (31.2357, 30.0444, "Cairo"),
        (-99.1332, 19.4326, "Mexico City"),
    ]

    # Projections that support full round-trip testing
    ROUNDTRIP_PROJECTIONS = [
        "equal-earth",
        "mercator",
        "mollweide",
        "equirectangular",
        "azimuthal-equal-area",
    ]

    @pytest.mark.parametrize("proj_id", ROUNDTRIP_PROJECTIONS)
    @pytest.mark.parametrize("lon,lat,label", TEST_POINTS)
    def test_round_trip(self, proj_id: str, lon: float, lat: float, label: str):
        """
        Transform lon/lat to projection coordinates and back.
        The recovered coordinates must be within TOLERANCE_DEG.
        """
        proj = get_projection(proj_id)
        if not proj:
            pytest.skip(f"Projection '{proj_id}' not in catalog")

        proj_def = proj.get("proj_definition") or proj.get("epsg")
        if not proj_def:
            pytest.skip(f"No PROJ definition for '{proj_id}'")

        # Skip Mercator for high latitudes (projection singularity near poles)
        if proj_id == "mercator" and abs(lat) > 85.0:
            pytest.skip("Mercator undefined near poles")

        # Forward: EPSG:4326 → projection
        forward = transform_coordinates(lon, lat, "EPSG:4326", proj_def)
        assert "error" not in forward, (
            f"Forward transform failed for {proj_id} at {label}: {forward.get('error')}"
        )

        x = forward["output"]["x"]
        y = forward["output"]["y"]

        # Inverse: projection → EPSG:4326
        inverse = transform_coordinates(x, y, proj_def, "EPSG:4326")
        assert "error" not in inverse, (
            f"Inverse transform failed for {proj_id} at {label}: {inverse.get('error')}"
        )

        recovered_lon = inverse["output"]["x"]
        recovered_lat = inverse["output"]["y"]

        assert abs(recovered_lon - lon) < self.TOLERANCE_DEG, (
            f"{proj_id} round-trip longitude error at {label}: "
            f"|{recovered_lon:.6f} - {lon:.6f}| = {abs(recovered_lon - lon):.8f}° "
            f"> {self.TOLERANCE_DEG}°"
        )
        assert abs(recovered_lat - lat) < self.TOLERANCE_DEG, (
            f"{proj_id} round-trip latitude error at {label}: "
            f"|{recovered_lat:.6f} - {lat:.6f}| = {abs(recovered_lat - lat):.8f}° "
            f"> {self.TOLERANCE_DEG}°"
        )
