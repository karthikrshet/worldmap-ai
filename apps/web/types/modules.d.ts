declare module "d3-geo-projection" {
  import * as d3Geo from "d3-geo";
  export function geoRobinson(): d3Geo.GeoProjection;
  export function geoWinkel3(): d3Geo.GeoProjection;
  export function geoMollweide(): d3Geo.GeoProjection;
  export function geoWagner4(): d3Geo.GeoProjection;
  export function geoEckert4(): d3Geo.GeoProjection;
  export function geoKavrayskiy7(): d3Geo.GeoProjection;
}
