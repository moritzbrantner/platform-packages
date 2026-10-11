import { Y as TemporalGeoJsonSupportedGeometry } from './geojson-layer-09FHd5Kp.js';

type PolygonLikeGeometry = Extract<TemporalGeoJsonSupportedGeometry, {
    type: "Polygon";
}> | Extract<TemporalGeoJsonSupportedGeometry, {
    type: "MultiPolygon";
}>;

export type { PolygonLikeGeometry as P };
