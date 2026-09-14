"""
Geodesic distance golden tests.

Reference values:
- Equatorial circumference ≈ 40,075.017 km (WGS84 semi-major axis × 2π)
  Source: NIMA TR8350.2, WGS84 definition
- Equatorial distance for 90° longitude difference ≈ 10,018.75 km

We verify these against pyproj computations.
"""

from __future__ import annotations

import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../services/api"))

from services.distance import calculate_geodesic_distance


class TestGeodesicDistance:
    """Golden tests for geodesic distance using known reference values."""

    def test_result_structure(self):
        """Every result must include method, ellipsoid, and both points."""
        result = calculate_geodesic_distance(0.0, 0.0, 1.0, 0.0)
        assert "distance_km" in result
        assert "distance_m" in result
        assert "method" in result
        assert "ellipsoid" in result
        assert result["method"] == "geodesic"
        assert result["ellipsoid"] == "WGS84"
        assert "point_a" in result
        assert "point_b" in result

    def test_zero_distance_same_point(self):
        """Distance from a point to itself must be 0."""
        result = calculate_geodesic_distance(77.0, 28.0, 77.0, 28.0)
        assert result["distance_m"] == pytest.approx(0.0, abs=1.0)
        assert result["distance_km"] == pytest.approx(0.0, abs=0.001)

    def test_equatorial_quarter_circumference(self):
        """
        Quarter of the equatorial circumference: 0°E to 90°E at lat 0°.
        Reference: WGS84 equatorial circumference = 40,075.017 km
        Quarter = 10,018.754 km.
        Tolerance: ±1 km (0.01%).
        """
        result = calculate_geodesic_distance(0.0, 0.0, 90.0, 0.0)
        reference_km = 10_018.754
        assert result["distance_km"] == pytest.approx(reference_km, abs=1.0), (
            f"Quarter-equator distance {result['distance_km']:.3f} km, "
            f"expected {reference_km} km ±1 km"
        )

    def test_half_equatorial_circumference(self):
        """
        0°E to 180°E at equator = half of 40,075.017 km = 20,037.5 km.
        """
        result = calculate_geodesic_distance(0.0, 0.0, 180.0, 0.0)
        reference_km = 20_037.508
        assert result["distance_km"] == pytest.approx(reference_km, abs=2.0)

    def test_north_pole_to_south_pole(self):
        """
        Polar diameter distance along meridian: 0°N → 90°N → distance through center
        We test distance from equator to north pole: 90°/360° × polar circumference.
        WGS84 polar semi-circumference ≈ 20,003.931 km.
        Equator (0°N, 0°E) to North Pole (0°E, 90°N) ≈ 10,001.966 km.
        """
        result = calculate_geodesic_distance(0.0, 0.0, 0.0, 90.0)
        reference_km = 10_001.966
        assert result["distance_km"] == pytest.approx(reference_km, abs=2.0)

    def test_distance_is_symmetric(self):
        """Geodesic distance A→B must equal B→A."""
        r1 = calculate_geodesic_distance(77.2090, 28.6139, 72.8777, 19.0760)  # Delhi → Mumbai
        r2 = calculate_geodesic_distance(72.8777, 19.0760, 77.2090, 28.6139)  # Mumbai → Delhi
        assert r1["distance_km"] == pytest.approx(r2["distance_km"], rel=1e-6)

    def test_delhi_to_mumbai_approximate(self):
        """
        Delhi → Mumbai distance.
        Reference (various sources): approximately 1,148–1,150 km geodesic.
        We use Delhi: 28.6139°N, 77.2090°E; Mumbai: 19.0760°N, 72.8777°E.
        """
        result = calculate_geodesic_distance(
            77.2090, 28.6139,
            72.8777, 19.0760,
            label_a="Delhi", label_b="Mumbai",
        )
        # Approximately 1,149 km
        assert 1100.0 < result["distance_km"] < 1200.0

    def test_invalid_longitude_rejected(self):
        """Longitude outside [-180, 180] must raise ValueError."""
        with pytest.raises(ValueError, match="longitude"):
            calculate_geodesic_distance(200.0, 0.0, 0.0, 0.0)

    def test_invalid_latitude_rejected(self):
        """Latitude outside [-90, 90] must raise ValueError."""
        with pytest.raises(ValueError, match="latitude"):
            calculate_geodesic_distance(0.0, 95.0, 0.0, 0.0)

    def test_labels_in_response(self):
        """Custom labels must appear in the response."""
        result = calculate_geodesic_distance(
            77.0, 28.0, 72.0, 19.0,
            label_a="City A", label_b="City B",
        )
        assert result["point_a"]["label"] == "City A"
        assert result["point_b"]["label"] == "City B"
