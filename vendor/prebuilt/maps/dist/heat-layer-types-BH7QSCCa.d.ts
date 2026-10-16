import { K as MapPointFilter, x as IndexedMapPoint, J as MapPoint, O as TemporalGeoJsonGeometryFeatureCollection, C as MapFeatureInteractionProps, L as PointAggregationIndexOptions } from './geojson-layer-09FHd5Kp.js';

type HeatFieldInterpolation = "idw";
type HeatFieldMaskGeoJson = {
    [key: string]: unknown;
    type: string;
};
/**
 * Options for building a georeferenced scalar field from scattered point
 * measurements. The default interpolation is deterministic IDW over the
 * resolved domain bounds; larger grids improve visual smoothness at higher CPU
 * and memory cost.
 */
type HeatFieldOptions<TProperties = Record<string, unknown>> = {
    colorRamp?: readonly [valueOrNormalized: number, color: string][];
    domainBounds?: readonly [west: number, south: number, east: number, north: number];
    domainPaddingRatio?: number;
    fieldCellSizeMeters?: number;
    fieldColumns?: number;
    fieldRows?: number;
    filterPoint?: MapPointFilter<TProperties>;
    getValue?: (point: IndexedMapPoint<TProperties>) => number;
    interpolation?: HeatFieldInterpolation;
    interpolationEpsilonMeters?: number;
    interpolationExtrapolate?: boolean;
    interpolationK?: number;
    interpolationMaxDistanceMeters?: number;
    interpolationPower?: number;
    maskGeoJson?: HeatFieldMaskGeoJson | null;
    opacity?: number;
    valueDomain?: readonly [min: number, max: number];
    valueMetric?: string;
};
type ScalarFieldValuePoint<TProperties = Record<string, unknown>> = {
    index: number;
    point: IndexedMapPoint<TProperties>;
    value: number;
};
type ScalarFieldGrid = {
    bounds: [west: number, south: number, east: number, north: number];
    columns: number;
    rows: number;
    valueDomain: [min: number, max: number] | null;
    values: Array<number | null>;
};
type ScalarFieldInterpolator = {
    bounds: [west: number, south: number, east: number, north: number];
    getValueAtCoordinate(coordinate: [longitude: number, latitude: number]): number | null;
    pointCount: number;
    valueDomain: [min: number, max: number] | null;
};
type MapsScalarFieldWasmRuntime = {
    createScalarFieldGrid<TProperties = Record<string, unknown>>(points: readonly MapPoint<TProperties>[], options: HeatFieldOptions<TProperties>): ScalarFieldGrid;
};
declare function initializeMapsScalarFieldWasm(packageName?: string): Promise<boolean>;
declare function setMapsScalarFieldWasmRuntimeForTests(runtime: MapsScalarFieldWasmRuntime | null): void;
declare function resetMapsScalarFieldWasmRuntimeForTests(): void;
declare function getMapsScalarFieldWasmLoadError(): unknown;
declare function createScalarFieldGrid<TProperties = Record<string, unknown>>(points: readonly MapPoint<TProperties>[], options?: HeatFieldOptions<TProperties>): ScalarFieldGrid;
declare function createIdwInterpolator<TProperties = Record<string, unknown>>(points: readonly MapPoint<TProperties>[], options?: HeatFieldOptions<TProperties>): ScalarFieldInterpolator;
declare function getScalarFieldValueAtCoordinate(gridOrInterpolator: ScalarFieldGrid | ScalarFieldInterpolator, coordinate: [longitude: number, latitude: number]): number | null;
declare function normalizeScalarFieldValue(value: number, valueDomain: readonly [min: number, max: number] | null): number | null;
declare function resolveScalarFieldValuePoints<TProperties = Record<string, unknown>>(points: readonly MapPoint<TProperties>[], options?: Pick<HeatFieldOptions<TProperties>, "filterPoint" | "getValue" | "valueMetric">): Array<ScalarFieldValuePoint<TProperties>>;

type HeatFieldColorStop = readonly [valueOrNormalized: number, color: string];
type HeatFieldImageOptions = {
    colorRamp?: readonly HeatFieldColorStop[];
    opacity?: number;
    valueDomain?: readonly [min: number, max: number];
};
type HeatFieldContourOptions = {
    levels?: number | readonly number[];
    lineColor?: string;
    lineWidth?: number;
    opacity?: number;
    valueFormat?: (value: number) => string;
    valueDomain?: readonly [min: number, max: number];
};
type HeatFieldContourFeatureProperties = {
    kind: "heat-field-contour";
    label: string;
    levelIndex: number;
    levelCount: number;
    normalizedValue: number;
    value: number;
    valueLabel: string;
};
type HeatFieldContourFeatureCollection = TemporalGeoJsonGeometryFeatureCollection<HeatFieldContourFeatureProperties>;
type HeatFieldImage = {
    bounds: [west: number, south: number, east: number, north: number];
    height: number;
    url: string;
    width: number;
};
declare function createHeatFieldImage(grid: ScalarFieldGrid, options?: HeatFieldImageOptions): HeatFieldImage | null;
declare function createHeatFieldContourImage(grid: ScalarFieldGrid, options?: HeatFieldContourOptions): HeatFieldImage | null;
declare function createHeatFieldContourFeatureCollection(grid: ScalarFieldGrid, options?: HeatFieldContourOptions): HeatFieldContourFeatureCollection;
declare function resolveHeatFieldColor(colorRamp: readonly HeatFieldColorStop[], normalizedValue: number): HeatFieldParsedColor;
type HeatFieldParsedColor = {
    alpha: number;
    blue: number;
    green: number;
    red: number;
};
declare function parseHeatFieldColor(color: string): HeatFieldParsedColor | null;

type HeatLayerWeightAccessor<TProperties = Record<string, unknown>> = (point: IndexedMapPoint<TProperties>) => number;
type HeatLayerColorStop = readonly [density: number, color: string];
type HeatFieldRenderMode = "raster" | "contours" | "raster-contours";
type HeatLayerSurfaceMode = "data" | "interpolated" | "field";
type HeatLayerRenderStrategy = "auto" | "stable-raster" | "viewport-raster";
type HeatLayerRadius = number | {
    meters: number;
} | {
    max: number;
    maxZoom?: number;
    min: number;
    minZoom?: number;
};
type HeatLayerFeatureProperties = {
    kind: "heat-cluster" | "heat-point";
    label: string;
    pointId: string;
    pointCount: number;
    rawWeight: number;
    weight: number;
} & Record<string, number | string>;
type HeatLayerFeature = {
    geometry: {
        coordinates: [longitude: number, latitude: number];
        type: "Point";
    };
    properties: HeatLayerFeatureProperties;
    type: "Feature";
};
type HeatLayerProps<TProperties = Record<string, unknown>> = MapFeatureInteractionProps<HeatLayerFeature> & {
    domainBounds?: HeatFieldOptions<TProperties>["domainBounds"];
    domainPaddingRatio?: HeatFieldOptions<TProperties>["domainPaddingRatio"];
    fieldCellSizeMeters?: HeatFieldOptions<TProperties>["fieldCellSizeMeters"];
    fieldContourColor?: HeatFieldContourOptions["lineColor"];
    fieldContourLevels?: HeatFieldContourOptions["levels"];
    fieldContourLineWidth?: HeatFieldContourOptions["lineWidth"];
    fieldContourOpacity?: HeatFieldContourOptions["opacity"];
    fieldContourValueFormat?: HeatFieldContourOptions["valueFormat"];
    fieldColorRamp?: readonly HeatFieldColorStop[];
    fieldColumns?: HeatFieldOptions<TProperties>["fieldColumns"];
    fieldOpacity?: HeatFieldOptions<TProperties>["opacity"];
    fieldAsyncRender?: boolean;
    fieldRenderMode?: HeatFieldRenderMode;
    fieldRows?: HeatFieldOptions<TProperties>["fieldRows"];
    fieldValueDomain?: HeatFieldOptions<TProperties>["valueDomain"];
    filterPoint?: MapPointFilter<TProperties>;
    getValue?: HeatFieldOptions<TProperties>["getValue"];
    getWeight?: HeatLayerWeightAccessor<TProperties>;
    heatmapAggregationMaxZoom?: PointAggregationIndexOptions<TProperties>["maxZoom"];
    heatmapAggregationMinZoom?: PointAggregationIndexOptions<TProperties>["minZoom"];
    heatmapAggregationRadius?: PointAggregationIndexOptions<TProperties>["radius"];
    heatmapColorRamp?: readonly HeatLayerColorStop[];
    heatmapIntensity?: number;
    heatmapAsyncRender?: boolean;
    heatmapMaxRasterPixels?: number;
    heatmapMaxZoom?: number;
    heatmapMinZoomDeltaForRebuild?: number;
    heatmapSurfaceMode?: HeatLayerSurfaceMode;
    heatmapOpacity?: number;
    heatmapOverscanRatio?: number;
    heatmapRadius?: HeatLayerRadius;
    heatmapRenderStrategy?: HeatLayerRenderStrategy;
    interpolationEpsilonMeters?: HeatFieldOptions<TProperties>["interpolationEpsilonMeters"];
    interpolationExtrapolate?: HeatFieldOptions<TProperties>["interpolationExtrapolate"];
    interpolationK?: HeatFieldOptions<TProperties>["interpolationK"];
    interpolationMaxDistanceMeters?: HeatFieldOptions<TProperties>["interpolationMaxDistanceMeters"];
    interpolationPower?: HeatFieldOptions<TProperties>["interpolationPower"];
    layerId?: string;
    maskGeoJson?: HeatFieldMaskGeoJson | null;
    maxWeight?: number;
    points: readonly MapPoint<TProperties>[];
    showDataPoints?: boolean;
    dataPointColor?: string;
    dataPointOpacity?: number;
    dataPointRadius?: number;
    dataPointStrokeColor?: string;
    dataPointStrokeWidth?: number;
    dataPointValueFormat?: (value: number) => string;
    valueMetric?: string;
    weightMetric?: string;
};

export { resetMapsScalarFieldWasmRuntimeForTests as A, resolveHeatFieldColor as B, resolveScalarFieldValuePoints as C, setMapsScalarFieldWasmRuntimeForTests as D, type HeatFieldColorStop as H, type MapsScalarFieldWasmRuntime as M, type ScalarFieldGrid as S, type HeatFieldContourFeatureCollection as a, type HeatFieldContourFeatureProperties as b, type HeatFieldContourOptions as c, type HeatFieldImage as d, type HeatFieldImageOptions as e, type HeatFieldInterpolation as f, type HeatFieldMaskGeoJson as g, type HeatFieldOptions as h, type HeatFieldParsedColor as i, type HeatFieldRenderMode as j, type HeatLayerFeature as k, type HeatLayerProps as l, type HeatLayerRenderStrategy as m, type HeatLayerSurfaceMode as n, type ScalarFieldInterpolator as o, type ScalarFieldValuePoint as p, createHeatFieldContourFeatureCollection as q, createHeatFieldContourImage as r, createHeatFieldImage as s, createIdwInterpolator as t, createScalarFieldGrid as u, getMapsScalarFieldWasmLoadError as v, getScalarFieldValueAtCoordinate as w, initializeMapsScalarFieldWasm as x, normalizeScalarFieldValue as y, parseHeatFieldColor as z };
