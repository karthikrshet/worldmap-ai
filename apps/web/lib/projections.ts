/**
 * Map projections supported by WorldMap AI.
 *
 * Grounded in cartographic mathematics and international standards.
 * Default is Equal Earth (encouraged in the UN debate via GA resolution A/80/L.104 on Sep 4, 2026).
 */

export interface ProjectionDefinition {
  id: string;
  name: string;
  type: string; // e.g. "Pseudocylindrical equal-area"
  creator: string;
  year: number;
  propertiesPreserved: string;
  propertiesDistorted: string;
  unStatus: string;
  description: string;
  aspectRatio: number; // width / height
  standardParallels?: string;
  tissotBehavior: string;
}

export const PROJECTIONS: Record<string, ProjectionDefinition> = {
  "equal-earth": {
    id: "equal-earth",
    name: "Equal Earth",
    type: "Pseudocylindrical equal-area",
    creator: "Bojan Šavrič, Tom Patterson, Bernhard Jenny",
    year: 2018,
    propertiesPreserved: "Relative surface area strictly preserved (1:1 ratio across all latitudes)",
    propertiesDistorted: "Moderate angular and shape distortion toward polar edges, but aesthetically balanced",
    unStatus:
      "Encouraged by UN General Assembly Resolution A/80/L.104 (Sept 4, 2026) for fair relative geographic representation.",
    description:
      "Developed in 2018 to provide an aesthetically pleasing, mathematically sound equal-area alternative to Robinson and Gall-Peters. Landmasses retain accurate relative proportion without extreme shear.",
    aspectRatio: 2.05,
    standardParallels: "±30° (approximate true scale)",
    tissotBehavior:
      "Indicatrices are ellipses of varying eccentricity, but all enclose identical surface area at every latitude.",
  },
  mercator: {
    id: "mercator",
    name: "Mercator",
    type: "Cylindrical conformal",
    creator: "Gerardus Mercator",
    year: 1569,
    propertiesPreserved: "Local angles and shapes (conformal); lines of constant compass bearing (rhumb lines) are straight",
    propertiesDistorted: "Extreme areal inflation toward poles; Greenland appears equal to Africa (actual ratio: 1:14.4)",
    unStatus:
      "Historically utilized for maritime navigation; GA Resolution A/80/L.104 cautions against its use where relative land area matters.",
    description:
      "Designed for 16th-century marine navigation. Because it projects meridians as parallel vertical lines, area scales with 1/cos²(latitude), producing massive polar expansion.",
    aspectRatio: 1.0,
    standardParallels: "Equator (0°)",
    tissotBehavior:
      "Indicatrices remain perfect circles (conformal), but expand infinitely toward the poles.",
  },
  robinson: {
    id: "robinson",
    name: "Robinson",
    type: "Pseudocylindrical compromise",
    creator: "Arthur H. Robinson",
    year: 1963,
    propertiesPreserved: "Visual balance and overall aesthetic harmony (neither equal-area nor conformal)",
    propertiesDistorted: "Distorts both area and shape in controlled, moderate amounts",
    unStatus: "Used widely in education and publishing (adopted by National Geographic 1988–1998).",
    description:
      "An empirical compromise projection created for Rand McNally. Parallels are straight horizontal lines; meridians curve gracefully, with non-zero polar line length.",
    aspectRatio: 1.97,
    tissotBehavior:
      "Indicatrices are slightly stretched ellipses with area varying moderately with latitude.",
  },
  "winkel-tripel": {
    id: "winkel-tripel",
    name: "Winkel Tripel (Winkel III)",
    type: "Modified azimuthal compromise",
    creator: "Oswald Winkel",
    year: 1921,
    propertiesPreserved: "Arithmetic mean of equirectangular and Aitoff projections; minimizes area, direction, and distance distortion",
    propertiesDistorted: "Neither strictly equal-area nor conformal, but achieves minimal aggregate distortion score",
    unStatus: "Standard world projection used by National Geographic Society since 1998.",
    description:
      "Gold standard for compromise reference maps. Parallels are curved, producing a pleasing curved outer boundary.",
    aspectRatio: 1.8,
    standardParallels: "±50°28′",
    tissotBehavior:
      "Modest variation in both area and eccentricity across mid-to-high latitudes.",
  },
  mollweide: {
    id: "mollweide",
    name: "Mollweide",
    type: "Pseudocylindrical equal-area",
    creator: "Karl Brandan Mollweide",
    year: 1805,
    propertiesPreserved: "Equal-area worldwide (relative areas strictly preserved)",
    propertiesDistorted: "Significant angular distortion and shearing toward equatorial and polar outer edges",
    unStatus: "Recognized classical equal-area projection.",
    description:
      "An elliptical equal-area projection where the outer meridian forms a 2:1 ellipse. Often used for thematic global distributions.",
    aspectRatio: 2.0,
    standardParallels: "±40°44′",
    tissotBehavior:
      "Ellipses of equal area throughout; major axis stretches sharply at high latitudes.",
  },
  orthographic: {
    id: "orthographic",
    name: "Orthographic (3D Globe)",
    type: "Azimuthal perspective",
    creator: "Hipparchus / Classical Antiquity",
    year: -150,
    propertiesPreserved: "True 3D perspective of Earth as viewed from deep space; shows one hemisphere at a time",
    propertiesDistorted: "Extreme compression and foreshortening toward the horizon/limb of the sphere",
    unStatus: "Standard spherical perspective.",
    description:
      "Projects a sphere onto a tangent plane from an infinite viewpoint. Simulates how Earth appears from orbit, ideal for visual orientation and scale comparison.",
    aspectRatio: 1.0,
    tissotBehavior:
      "Indicatrices are compressed radially toward the limb into thin ellipses.",
  },
};
