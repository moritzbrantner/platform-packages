import { c as GeoJsonEditOperation, j as GeoJsonEditorSelection } from './geojson-transition-dEkA4Fky.js';
import { O as TemporalGeoJsonGeometryFeatureCollection } from './geojson-layer-09FHd5Kp.js';

type GeoJsonEditHistoryEntry<TProperties extends Record<string, unknown> = Record<string, unknown>> = {
    after: TemporalGeoJsonGeometryFeatureCollection<TProperties>;
    before: TemporalGeoJsonGeometryFeatureCollection<TProperties>;
    operation: GeoJsonEditOperation<TProperties>;
    selectionAfter?: GeoJsonEditorSelection;
    selectionBefore?: GeoJsonEditorSelection;
};
type GeoJsonEditHistoryState<TProperties extends Record<string, unknown> = Record<string, unknown>> = {
    canRedo: boolean;
    canUndo: boolean;
    future: Array<GeoJsonEditHistoryEntry<TProperties>>;
    past: Array<GeoJsonEditHistoryEntry<TProperties>>;
    present: TemporalGeoJsonGeometryFeatureCollection<TProperties>;
};
declare function createGeoJsonEditHistoryState<TProperties extends Record<string, unknown> = Record<string, unknown>>(initial: TemporalGeoJsonGeometryFeatureCollection<TProperties>): GeoJsonEditHistoryState<TProperties>;
declare function pushGeoJsonEditHistory<TProperties extends Record<string, unknown> = Record<string, unknown>>(state: GeoJsonEditHistoryState<TProperties>, entry: GeoJsonEditHistoryEntry<TProperties>, options?: {
    limit?: number;
}): GeoJsonEditHistoryState<TProperties>;
declare function undoGeoJsonEditHistory<TProperties extends Record<string, unknown> = Record<string, unknown>>(state: GeoJsonEditHistoryState<TProperties>): GeoJsonEditHistoryState<TProperties>;
declare function redoGeoJsonEditHistory<TProperties extends Record<string, unknown> = Record<string, unknown>>(state: GeoJsonEditHistoryState<TProperties>): GeoJsonEditHistoryState<TProperties>;
declare function invertGeoJsonEditOperation<TProperties extends Record<string, unknown> = Record<string, unknown>>(operation: GeoJsonEditOperation<TProperties>): GeoJsonEditOperation<TProperties>;

export { type GeoJsonEditHistoryEntry as G, type GeoJsonEditHistoryState as a, createGeoJsonEditHistoryState as c, invertGeoJsonEditOperation as i, pushGeoJsonEditHistory as p, redoGeoJsonEditHistory as r, undoGeoJsonEditHistory as u };
