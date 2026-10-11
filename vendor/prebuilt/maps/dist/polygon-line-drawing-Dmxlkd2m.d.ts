import { u as GeoJsonPolygonGeometry, o as GeoJsonMultiPolygonGeometry, k as GeoJsonLineStringGeometry, v as GeoJsonPosition } from './geojson-layer-09FHd5Kp.js';

/**
 * Where the Rust/WASM aggregation runtime stands:
 *
 * - `idle`: nothing has asked for it yet (also the SSR state);
 * - `loading`: a Map View (or `ensureMapsAggregationWasm`) started loading it;
 * - `ready`: Rust is the clustering authority;
 * - `unavailable`: loading failed, so indexes use the explicit unclustered fallback.
 *
 * `idle` and `loading` are *pending*: Map Layers render no aggregated output yet rather than
 * every point individually, and rebuild once the status settles on `ready` or `unavailable`.
 */
type MapsAggregationRuntimeStatus = "idle" | "loading" | "ready" | "unavailable";
/**
 * Starts loading the aggregation WASM runtime unless one is installed or loading, and resolves
 * to whether Rust clustering is available. Map Views call this on mount; consumers may await it
 * to sequence work after the runtime. While it loads, Map Layers stay pending (no aggregated
 * output); `createPointAggregationIndex` called directly in that window returns the unclustered
 * fallback. After a failed load, a later call retries.
 */
declare function ensureMapsAggregationWasm(): Promise<boolean>;
declare function getMapsAggregationRuntimeStatus(): MapsAggregationRuntimeStatus;
declare function subscribeMapsAggregationRuntime(listener: () => void): () => void;

type PolygonLineDrawingMode = "auto" | "hole" | "split";
type PolygonLineDrawingOperation = "hole" | "none" | "split";
type PolygonLineDrawingOptions = {
    mode?: PolygonLineDrawingMode;
    tolerance?: number;
};
type PolygonLineDrawingResult = {
    geometry: GeoJsonPolygonGeometry | GeoJsonMultiPolygonGeometry;
    operation: PolygonLineDrawingOperation;
    polygonIndex?: number;
};
/**
 * Applies a drawn line to a Polygon or MultiPolygon.
 *
 * In auto mode, closed lines create holes and open lines with exactly two shell
 * crossings split the affected polygon. Use mode: "hole" to close an open drawn
 * line into a hole, or mode: "split" to skip hole creation.
 */
declare function drawLineOnPolygonGeometry(geometry: GeoJsonPolygonGeometry | GeoJsonMultiPolygonGeometry, line: GeoJsonLineStringGeometry | readonly GeoJsonPosition[], options?: PolygonLineDrawingOptions): PolygonLineDrawingResult;

export { type MapsAggregationRuntimeStatus as M, type PolygonLineDrawingMode as P, type PolygonLineDrawingOperation as a, type PolygonLineDrawingOptions as b, type PolygonLineDrawingResult as c, drawLineOnPolygonGeometry as d, ensureMapsAggregationWasm as e, getMapsAggregationRuntimeStatus as g, subscribeMapsAggregationRuntime as s };
