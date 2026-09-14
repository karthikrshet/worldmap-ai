# CALCULATIONS.md

# WorldMap AI — Calculation Methodology

All geographic measurements in WorldMap AI are produced by deterministic algorithms
using established mathematical methods. This document describes each calculation type,
the algorithm used, its limitations, and how to reproduce results.

---

## 1. Geodesic Area

### Method
Area is calculated using the **Karney (2013) geodesic algorithm** implemented in
[pyproj](https://pyproj4.github.io/pyproj/stable/) via `Geod.geometry_area_perimeter()`.

### Ellipsoid
**WGS84** (World Geodetic System 1984)
- Semi-major axis: a = 6,378,137.0 m
- Flattening: f = 1/298.257223563

### Algorithm
Karney, C.F.F. (2013). *Algorithms for geodesics.*
Journal of Geodesy, 87(1), 43–55.
https://doi.org/10.1007/s00190-012-0578-z

The algorithm computes the exact area of a polygon on the surface of an ellipsoid
(not a sphere). This produces more accurate results than spherical approximations,
especially at high latitudes.

### Implementation
```python
from pyproj import Geod
geod = Geod(ellps="WGS84")
# Returns (area_m2_signed, perimeter_m)
area_signed, perimeter = geod.geometry_area_perimeter(shapely_geometry)
area_m2 = abs(area_signed)  # Take absolute value — sign depends on winding order
```

### Precision
- Method precision: sub-metre (limited by algorithm)
- Practical precision: limited by geometry resolution (see Coastline Paradox below)

### Geometry-derived vs Statistical Area
This is important.

| Area Type | Source | Example |
|-----------|--------|---------|
| **Geometry-derived** | Calculated from polygon vertices | WorldMap AI (this document) |
| **Statistical/official** | Government survey, international body | CIA World Factbook, UN Statistics |

The two may differ because:
1. Map polygon geometry is simplified (Natural Earth 1:10m generalises coastlines)
2. Statistical area may include/exclude territorial waters, lakes, rivers
3. Boundary definitions may differ between sources

WorldMap AI labels its area values as "Geometry-derived geodesic area" and notes
the potential difference from statistical figures.

---

## 2. Geodesic Distance

### Method
Geodesic (great-circle) distance on the WGS84 ellipsoid using `Geod.inv()`.

### Implementation
```python
from pyproj import Geod
geod = Geod(ellps="WGS84")
# Returns (forward_azimuth, back_azimuth, distance_m)
fwd_az, back_az, dist_m = geod.inv(lon1, lat1, lon2, lat2)
```

### Interpretation
The geodesic distance is the **shortest path on the WGS84 ellipsoid surface**.
This differs from:
- **Rhumb-line distance**: follows a constant compass bearing
- **Chord distance**: straight line through the Earth's interior

WorldMap AI always labels the distance method in the response.

---

## 3. Area Ratio & Comparison

### Formulas (as documented in every API response)

```
ratio              = area_a / area_b
difference_km2     = area_a - area_b
percentage_diff    = ((area_a - area_b) / area_b) × 100
```

No ratio is hardcoded. Every ratio is computed from the calculation engine result.

---

## 4. Coordinate Transformation

### Engine
PROJ coordinate transformation library via pyproj.

All projections in the catalog use PROJ string definitions or EPSG codes.
No projection mathematics are manually reimplemented.

### Round-trip test
For every supported projection, WorldMap AI runs:
```
lon, lat → projection → inverse → lon_recovered, lat_recovered
```
Tolerance: |error| < 0.0001° (approximately 11 metres).

---

## 5. Coastline Paradox

The measured perimeter (and to a lesser extent, area) of a coastline depends on
the resolution of the geometry. This is related to fractal geometry — finer
measurements follow more irregularities.

Natural Earth 1:10m smooths coastlines significantly compared to high-resolution
national surveys. As a result:
- **Area** from NE 1:10m may be within 0.5–3% of official statistics for most countries
- **Perimeter** from NE 1:10m will be significantly shorter than surveys at finer resolution

WorldMap AI always displays the dataset scale (1:10m) in calculation results.

---

## 6. Precision Display

WorldMap AI follows these precision conventions:

| Value | Display precision |
|-------|-------------------|
| Area ≥ 1,000 km² | 0 decimal places |
| Area < 1,000 km² | 1 decimal place |
| Distance ≥ 1 km | 2 decimal places |
| Ratio | 2 decimal places |
| Percentage | 1 decimal place |
| Coordinates | 6 decimal places |

Full-precision values are available in the API response and methodology download.

---

## 7. Reproducibility

Every calculation result includes:
- Dataset name, version, and checksum reference
- Engine version (pyproj, PROJ)
- Ellipsoid
- CRS
- Timestamp

Given the same dataset version, engine version, and inputs, a calculation will
always produce the same result. This is a core design requirement.
