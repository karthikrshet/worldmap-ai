# BOUNDARY_POLICY.md

# WorldMap AI — Political Boundary Policy

## Overview

WorldMap AI visualizes geographic datasets. It does not independently determine
sovereignty, adjudicate territorial disputes, or take positions on contested borders.

---

## Principle

> WorldMap AI displays boundaries as represented in the configured source dataset.
> It does not independently determine which boundary is legally, politically,
> or diplomatically authoritative.

---

## Active Dataset

The current boundary data comes from **Natural Earth** (1:10m scale).
Natural Earth is a collaborative community effort that synthesizes multiple sources.
Its boundary representations may differ from:
- UN Cartographic Section representations
- Individual national government positions
- International Court of Justice determinations
- Other authoritative geospatial organizations

**This does not make WorldMap AI's data wrong** — it reflects a well-established
public domain dataset used across many open-source mapping projects.

---

## Disputed Territories

Where Natural Earth marks boundaries as disputed or includes specific notes
(stored in the `NOTE_BRK` field and displayed in the boundary_notes column),
WorldMap AI:

1. Displays the dataset note in the country detail panel
2. Does not silently suppress boundary notes
3. Does not take a position on the underlying dispute
4. Identifies the data source so users can investigate further

---

## India Specific Note

Natural Earth's Admin 0 boundary for India reflects the dataset maintainers' choices
which may differ from the Survey of India's official boundary. WorldMap AI records
which dataset version is in use. Where national requirements differ from international
datasets, the distinction will be documented rather than silently overridden.

Users and deployers in jurisdictions with specific legal requirements for boundary
representations should verify that the displayed boundaries meet those requirements
before deploying WorldMap AI for official purposes.

---

## No Adjudication

WorldMap AI is an educational and analytical tool. It does not:
- Determine which country has sovereignty over a disputed area
- Adjudicate international boundary disputes
- Represent the official position of any government or international organization
- Claim that any specific boundary representation is definitively legally authoritative

---

## Reporting Boundary Issues

If you believe the displayed boundaries contain a material error (not a known dispute,
but an actual dataset error), please open a GitHub issue with:
- The affected entity/region
- The observed boundary
- The expected boundary with authoritative source citation
- The Natural Earth dataset version in use

We will investigate and, if confirmed, record the discrepancy and update the dataset
manifest.

---

## Future Dataset Support

Future versions may support multiple concurrent dataset layers, allowing users to
select which boundary representation to use. This would be clearly labeled per layer.
