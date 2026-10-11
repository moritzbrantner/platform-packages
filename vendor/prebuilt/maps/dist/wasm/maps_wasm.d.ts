/* tslint:disable */
/* eslint-disable */

/**
 * Stateful WASM transport over the Maps-owned flat raster runtime.
 *
 * The browser host supplies input/network/pixel services. Camera, geographic
 * constraints, tile cover, request scheduling, cancellation and cache policy
 * remain Rust-owned.
 */
export class MapsFlatRasterRuntime {
    free(): void;
    [Symbol.dispose](): void;
    fitBounds(west: number, south: number, east: number, north: number, padding: number, max_zoom: number): void;
    /**
     * Advances scheduling and returns the packed frame (see [`pack_frame_plan`]).
     */
    framePacked(): Float64Array;
    markFailed(z: number, x: number, y: number): void;
    markLoaded(z: number, x: number, y: number): void;
    constructor(config: any);
    panBetween(previous_x: number, previous_y: number, current_x: number, current_y: number): void;
    panBy(delta_x: number, delta_y: number): void;
    projectPacked(coordinates: Float64Array): Float64Array;
    project(longitude: number, latitude: number): any;
    resize(width: number, height: number): void;
    rotateAbout(delta_bearing: number, screen_x: number, screen_y: number): void;
    setViewState(longitude: number, latitude: number, zoom: number, bearing: number, pitch: number): void;
    unproject(screen_x: number, screen_y: number): any;
    zoomAbout(delta_zoom: number, screen_x: number, screen_y: number, min_zoom: number, max_zoom: number): void;
}

/**
 * Direct WASM handle over the Maps-owned Rust point aggregation index.
 */
export class MapsPointAggregationIndex {
    free(): void;
    [Symbol.dispose](): void;
    getClusterExpansionZoom(cluster_id: number): number;
    getClusterLeaves(cluster_id: number, limit: number, offset: number): any;
    getPointById(point_id: string): any;
    getViewportAggregation(query: any): any;
    constructor(points: any, options: any);
}

export class MapsWgpuBaseMapRenderer {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    evictRetainedPoints(group: number): void;
    evictRetainedPolygons(group: number): void;
    evictTile(z: number, x: number, y: number): void;
    evictVectorTile(z: number, x: number, y: number): void;
    /**
     * Last frame and retained-resource counters: raster tiles drawn, vector tiles
     * drawn, draw calls, then retained vector tiles, features, fill triangles, line
     * segments and GPU bytes, then application GPU upload bytes of the last frame, then
     * retained points, cumulative retained point preparations, rebases and instance
     * upload bytes, and the retained point frames (world copies) drawn last frame, then the
     * same five for retained polygons: polygons, preparations, rebases, geometry upload
     * bytes and frames.
     */
    frameStats(): Float64Array;
    isDeviceLost(): boolean;
    /**
     * Renders one map frame from packed tile draws (see [`unpack_tile_draws`]).
     */
    renderPacked(tile_draws: Float64Array, application_frame: any, circle_data: Float32Array, order: Uint32Array): number;
    resize(width: number, height: number): void;
    /**
     * Retains an application point group: `[longitude, latitude]` pairs, lowered once by
     * `maps-core`, and one paint record per point (radius and stroke width in CSS px,
     * fill RGBA, stroke RGBA). Replaces the group's previous content. Returns the count.
     */
    setRetainedPoints(group: number, lon_lat: Float64Array, paint: Float32Array): number;
    /**
     * Retains an application shape group (polygons, lines and direction markers), lowered
     * once by `maps-core`: each shape's ring count, each ring's point count, the
     * concatenated `[longitude, latitude]` pairs and one paint record per shape (fill
     * RGBA, stroke RGBA, stroke width or marker size in CSS px, shape kind). Replaces the
     * group's previous content. Returns the shape count.
     */
    setRetainedPolygons(group: number, ring_counts: Uint32Array, point_counts: Uint32Array, lon_lat: Float64Array, paint: Float32Array): number;
    /**
     * Deepest vector tile zoom; deeper raster placements draw their ancestor.
     */
    setVectorMaxZoom(max_zoom: number): void;
    /**
     * Replaces the vector style table: one entry of 8 floats (RGBA in [0, 1], line
     * width in CSS px, 3 reserved) per `maps_core::VectorBasemapStyleClass`.
     */
    setVectorStyle(table: Float32Array): void;
    uploadTile(z: number, x: number, y: number, image: ImageBitmap): void;
    /**
     * Decodes a Shortbread tile and retains its tile-local buckets on the GPU.
     * Returns the number of decoded features. Camera frames only update uniforms.
     */
    uploadVectorTile(z: number, x: number, y: number, bytes: Uint8Array): number;
}

/**
 * Computes `[west, south, east, north]` bounds from finite native map points.
 */
export function boundsFromMapPoints(points: any): any;

export function createWgpuBaseMapRenderer(canvas: HTMLCanvasElement): Promise<MapsWgpuBaseMapRenderer>;

/**
 * Decodes selected Shortbread linework and polygons with their interior rings.
 */
export function decodeShortbreadBasemap(bytes: Uint8Array, z: number, x: number, y: number): any;

/**
 * Decodes selected Shortbread vector-tile linework through the Maps-owned Rust boundary.
 */
export function decodeShortbreadBasemapLines(bytes: Uint8Array, z: number, x: number, y: number): any;

/**
 * Tile-local paths for retained fixed-style basemap pixels. Runs in a browser worker.
 */
export function decodeShortbreadTilePixels(bytes: Uint8Array, size: number): any;

/**
 * Executes a canonical Maps engine scenario through the same Rust semantics
 * used by native consumers and returns the normalized observation envelope.
 */
export function executeEngineScenario(scenario_json: string): any;

/**
 * Normalizes native map points using the Maps-owned Rust contract.
 */
export function normalizeMapPoints(points: any): any;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_mapsflatrasterruntime_free: (a: number, b: number) => void;
    readonly __wbg_mapspointaggregationindex_free: (a: number, b: number) => void;
    readonly __wbg_mapswgpubasemaprenderer_free: (a: number, b: number) => void;
    readonly boundsFromMapPoints: (a: number, b: number) => void;
    readonly createWgpuBaseMapRenderer: (a: number) => number;
    readonly decodeShortbreadBasemap: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly decodeShortbreadBasemapLines: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly decodeShortbreadTilePixels: (a: number, b: number, c: number, d: number) => void;
    readonly executeEngineScenario: (a: number, b: number, c: number) => void;
    readonly mapsflatrasterruntime_fitBounds: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
    readonly mapsflatrasterruntime_framePacked: (a: number, b: number) => void;
    readonly mapsflatrasterruntime_markFailed: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly mapsflatrasterruntime_markLoaded: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly mapsflatrasterruntime_new: (a: number, b: number) => void;
    readonly mapsflatrasterruntime_panBetween: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly mapsflatrasterruntime_panBy: (a: number, b: number, c: number, d: number) => void;
    readonly mapsflatrasterruntime_project: (a: number, b: number, c: number, d: number) => void;
    readonly mapsflatrasterruntime_projectPacked: (a: number, b: number, c: number, d: number) => void;
    readonly mapsflatrasterruntime_resize: (a: number, b: number, c: number, d: number) => void;
    readonly mapsflatrasterruntime_rotateAbout: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly mapsflatrasterruntime_setViewState: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly mapsflatrasterruntime_unproject: (a: number, b: number, c: number, d: number) => void;
    readonly mapsflatrasterruntime_zoomAbout: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly mapspointaggregationindex_getClusterExpansionZoom: (a: number, b: number, c: number) => void;
    readonly mapspointaggregationindex_getClusterLeaves: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly mapspointaggregationindex_getPointById: (a: number, b: number, c: number, d: number) => void;
    readonly mapspointaggregationindex_getViewportAggregation: (a: number, b: number, c: number) => void;
    readonly mapspointaggregationindex_new: (a: number, b: number, c: number) => void;
    readonly mapswgpubasemaprenderer_evictRetainedPoints: (a: number, b: number) => void;
    readonly mapswgpubasemaprenderer_evictRetainedPolygons: (a: number, b: number) => void;
    readonly mapswgpubasemaprenderer_evictTile: (a: number, b: number, c: number, d: number) => void;
    readonly mapswgpubasemaprenderer_evictVectorTile: (a: number, b: number, c: number, d: number) => void;
    readonly mapswgpubasemaprenderer_frameStats: (a: number, b: number) => void;
    readonly mapswgpubasemaprenderer_isDeviceLost: (a: number) => number;
    readonly mapswgpubasemaprenderer_renderPacked: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => void;
    readonly mapswgpubasemaprenderer_resize: (a: number, b: number, c: number) => void;
    readonly mapswgpubasemaprenderer_setRetainedPoints: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly mapswgpubasemaprenderer_setRetainedPolygons: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number) => void;
    readonly mapswgpubasemaprenderer_setVectorMaxZoom: (a: number, b: number) => void;
    readonly mapswgpubasemaprenderer_setVectorStyle: (a: number, b: number, c: number, d: number) => void;
    readonly mapswgpubasemaprenderer_uploadTile: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly mapswgpubasemaprenderer_uploadVectorTile: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly normalizeMapPoints: (a: number, b: number) => void;
    readonly __wasm_bindgen_func_elem_1537: (a: number, b: number, c: number, d: number) => void;
    readonly __wasm_bindgen_func_elem_1537_44: (a: number, b: number, c: number, d: number) => void;
    readonly __wasm_bindgen_func_elem_1537_45: (a: number, b: number, c: number, d: number) => void;
    readonly __wasm_bindgen_func_elem_3002: (a: number, b: number, c: number, d: number) => void;
    readonly __wasm_bindgen_func_elem_3004: (a: number, b: number, c: number, d: number) => void;
    readonly __wasm_bindgen_func_elem_1538: (a: number, b: number, c: number) => void;
    readonly __wbindgen_export: (a: number, b: number) => number;
    readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_export3: (a: number) => void;
    readonly __wbindgen_export4: (a: number, b: number) => void;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
    readonly __wbindgen_export5: (a: number, b: number, c: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
