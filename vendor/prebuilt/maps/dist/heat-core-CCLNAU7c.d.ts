import { J as MapPoint, x as IndexedMapPoint } from './geojson-layer-09FHd5Kp.js';
import { g as HeatMapDensityIndexOptions, f as HeatMapDensityIndex, o as HeatMapWeightOptions, i as HeatMapFeatureCollection } from './heat-map-BmNt3zvE.js';

declare function createHeatMapFeatureCollection<TProperties extends Record<string, unknown> = Record<string, unknown>>(points: readonly MapPoint<TProperties>[], options?: HeatMapWeightOptions<TProperties>): HeatMapFeatureCollection;
declare function createHeatMapDensityIndex<TProperties extends Record<string, unknown> = Record<string, unknown>>(points: readonly MapPoint<TProperties>[], options?: HeatMapDensityIndexOptions<TProperties>): HeatMapDensityIndex;
declare function getHeatMapMaxWeight<TProperties extends Record<string, unknown> = Record<string, unknown>>(points: readonly MapPoint<TProperties>[], options?: Omit<HeatMapWeightOptions<TProperties>, "maxWeight">): number;
declare function resolveHeatMapPointWeight<TProperties extends Record<string, unknown> = Record<string, unknown>>(point: IndexedMapPoint<TProperties>, options?: Omit<HeatMapWeightOptions<TProperties>, "maxWeight">): number;

export { createHeatMapFeatureCollection as a, createHeatMapDensityIndex as c, getHeatMapMaxWeight as g, resolveHeatMapPointWeight as r };
