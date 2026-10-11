import React, { ReactNode } from 'react';

type MapMetricRecord = Record<string, number>;
type MapPoint<TProperties = Record<string, unknown>> = {
    id?: string | number;
    label?: string;
    latitude: number;
    longitude: number;
    metrics?: MapMetricRecord;
    properties?: TProperties;
};
type IndexedMapPoint<TProperties = Record<string, unknown>> = Required<MapPoint<TProperties>> & {
    id: string;
};
type AggregatedMapPoint<TProperties = Record<string, unknown>> = {
    coordinates: [longitude: number, latitude: number];
    kind: "point";
    metrics: MapMetricRecord;
    point: IndexedMapPoint<TProperties>;
};
type AggregatedMapCluster = {
    clusterId: number;
    coordinates: [longitude: number, latitude: number];
    expansionZoom: number;
    kind: "cluster";
    metrics: MapMetricRecord;
    pointCount: number;
    pointCountAbbreviated: string;
};
type AggregatedMapFeature<TProperties = Record<string, unknown>> = AggregatedMapCluster | AggregatedMapPoint<TProperties>;
type ViewportAggregationQuery = {
    bounds: [west: number, south: number, east: number, north: number];
    zoom: number;
    /** Rust's camera result: the view sees the whole world and may repeat world copies. */
    spansFullWorld?: boolean;
};
type VisibleAggregationSummary = {
    bounds: ViewportAggregationQuery["bounds"];
    metrics: MapMetricRecord;
    visibleClusterCount: number;
    visiblePointCount: number;
    visibleUnclusteredCount: number;
    zoom: number;
};
type ViewportAggregation<TProperties = Record<string, unknown>> = {
    features: Array<AggregatedMapFeature<TProperties>>;
    summary: VisibleAggregationSummary;
};
type MapDensityViewportSummary = {
    bounds: ViewportAggregationQuery["bounds"];
    itemCount: number;
    kind: "map";
    metricKeys: string[];
    metrics: MapMetricRecord;
    visibleClusterCount: number;
    visiblePointCount: number;
    visibleUnclusteredCount: number;
    zoom: number;
};
type MapPointFilter<TProperties = Record<string, unknown>> = (point: IndexedMapPoint<TProperties>) => boolean;
type PointAggregationIndexOptions<TProperties = Record<string, unknown>> = {
    extent?: number;
    filterPoint?: MapPointFilter<TProperties>;
    maxZoom?: number;
    minZoom?: number;
    radius?: number;
};
type PointAggregationIndex<TProperties = Record<string, unknown>> = {
    dispose(): void;
    getClusterExpansionZoom(clusterId: number): number;
    getClusterLeaves(clusterId: number, limit?: number, offset?: number): Array<IndexedMapPoint<TProperties>>;
    getPointById(pointId: string): IndexedMapPoint<TProperties> | null;
    getViewportAggregation(query: ViewportAggregationQuery): ViewportAggregation<TProperties>;
};
declare function createPointAggregationIndex<TProperties = Record<string, unknown>>(points: readonly MapPoint<TProperties>[], options?: PointAggregationIndexOptions<TProperties>): PointAggregationIndex<TProperties>;
declare function createMapDensityViewportSummary<TProperties = Record<string, unknown>>(aggregation: ViewportAggregation<TProperties>): MapDensityViewportSummary;
declare function getBoundsFromPoints<TProperties = Record<string, unknown>>(points: readonly MapPoint<TProperties>[]): [west: number, south: number, east: number, north: number] | null;

type MapFeatureInteractionState = {
    hovered: boolean;
    selected: boolean;
};
type MapFeatureInteractionChange<TFeature> = {
    feature: TFeature | null;
    featureId: string | null;
    source: "click" | "context-menu" | "hover" | "clear";
};
type MapContextMenuContext = {
    close: () => void;
    coordinates: [longitude: number, latitude: number];
    position: {
        x: number;
        y: number;
    };
};
type MapFeatureContextMenuContext<TFeature> = MapContextMenuContext & {
    feature: TFeature;
};
type MapFeatureInteractionProps<TFeature> = {
    getFeatureId?: (feature: TFeature) => string;
    hoveredFeatureId?: string | null;
    onHoveredFeatureIdChange?: (featureId: string | null, context: MapFeatureInteractionChange<TFeature>) => void;
    onSelectedFeatureIdChange?: (featureId: string | null, context: MapFeatureInteractionChange<TFeature>) => void;
    onFeatureContextMenu?: (feature: TFeature) => void;
    onFeatureHover?: (feature: TFeature | null) => void;
    renderFeatureTooltip?: (feature: TFeature) => React.ReactNode;
    renderFeaturePopup?: (feature: TFeature) => React.ReactNode;
    renderFeatureContextMenu?: (feature: TFeature, context: MapFeatureContextMenuContext<TFeature>) => React.ReactNode;
    selectedFeatureId?: string | null;
};

type MapFlow<TProperties = Record<string, unknown>> = {
    from: [longitude: number, latitude: number];
    id: string;
    label?: string;
    metrics?: Record<string, number>;
    properties?: TProperties;
    to: [longitude: number, latitude: number];
};
type IndexedMapFlow<TProperties = Record<string, unknown>> = {
    from: [longitude: number, latitude: number];
    id: string;
    label: string;
    metrics: Record<string, number>;
    properties: TProperties;
    to: [longitude: number, latitude: number];
};
type FlowLayerFeature<TProperties = Record<string, unknown>> = {
    flow: IndexedMapFlow<TProperties>;
    rawValue: number;
    value: number;
    width: number;
};
type FlowLayerWeightAccessor<TProperties = Record<string, unknown>> = (flow: IndexedMapFlow<TProperties>) => number;
type FlowShape = "straight" | "arc" | "s-curve" | {
    bend?: number;
    direction?: "auto" | "clockwise" | "counterclockwise";
    segments?: number;
    type?: "straight" | "arc" | "s-curve";
};
type FlowDirectionMarker = "arrow" | "none";
type FlowLayerProps<TProperties = Record<string, unknown>> = MapFeatureInteractionProps<FlowLayerFeature<TProperties>> & {
    directionMarker?: FlowDirectionMarker;
    flowColor?: string;
    flowShape?: FlowShape;
    flowValueFormat?: (value: number, feature: FlowLayerFeature<TProperties>) => string;
    flows: readonly MapFlow<TProperties>[];
    getFlowLabel?: (feature: FlowLayerFeature<TProperties>) => ReactNode;
    getFlowColor?: (feature: FlowLayerFeature<TProperties>) => string;
    getWeight?: FlowLayerWeightAccessor<TProperties>;
    hoveredFlowOpacity?: number;
    inactiveFlowOpacity?: number;
    layerId?: string;
    maxWeight?: number;
    maxWidth?: number;
    minWidth?: number;
    onFeatureSelect?: (feature: FlowLayerFeature<TProperties> | null) => void;
    selectedFlowOpacity?: number;
    showDirection?: boolean;
    showEndpoints?: boolean;
    weightMetric?: string;
};
declare function FlowLayer<TProperties = Record<string, unknown>>({ directionMarker, flowColor, flowShape, flowValueFormat: _flowValueFormat, flows, getFeatureId, getFlowColor, getFlowLabel: _getFlowLabel, getWeight, hoveredFeatureId, hoveredFlowOpacity, inactiveFlowOpacity, layerId, maxWeight, maxWidth, minWidth, onHoveredFeatureIdChange, onFeatureContextMenu, onFeatureHover, onFeatureSelect, onSelectedFeatureIdChange, renderFeatureContextMenu, renderFeaturePopup, renderFeatureTooltip, selectedFeatureId, selectedFlowOpacity, showDirection, showEndpoints, weightMetric, }: FlowLayerProps<TProperties>): null;

type TemporalMapTimeRange = {
    end: number;
    start: number;
};
declare function snapTemporalMapTime(time: number, timeRange: TemporalMapTimeRange, step: number | "any" | undefined): number;

type GeoJsonPosition = [longitude: number, latitude: number];
type GeoJsonPointGeometry = {
    coordinates: GeoJsonPosition;
    type: "Point";
};
type GeoJsonMultiPointGeometry = {
    coordinates: GeoJsonPosition[];
    type: "MultiPoint";
};
type GeoJsonLineStringGeometry = {
    coordinates: GeoJsonPosition[];
    type: "LineString";
};
type GeoJsonMultiLineStringGeometry = {
    coordinates: GeoJsonPosition[][];
    type: "MultiLineString";
};
type GeoJsonPolygonGeometry = {
    coordinates: GeoJsonPosition[][];
    type: "Polygon";
};
type GeoJsonMultiPolygonGeometry = {
    coordinates: GeoJsonPosition[][][];
    type: "MultiPolygon";
};
type TemporalGeoJsonSupportedGeometry = GeoJsonPointGeometry | GeoJsonMultiPointGeometry | GeoJsonLineStringGeometry | GeoJsonMultiLineStringGeometry | GeoJsonPolygonGeometry | GeoJsonMultiPolygonGeometry;
type GeoJsonPartMatchingStrategy = "index" | "id" | "nearest-centroid" | "overlap" | "auto";
type TemporalGeoJsonGeometryFeature<TProperties extends Record<string, unknown> = Record<string, unknown>> = {
    geometry: TemporalGeoJsonSupportedGeometry | {
        geometries?: unknown;
        type: "GeometryCollection";
    } | {
        coordinates?: unknown;
        type: string;
    } | null;
    id?: string | number;
    properties?: TProperties | null;
    type: "Feature";
};
type TemporalGeoJsonGeometryFeatureCollection<TProperties extends Record<string, unknown> = Record<string, unknown>> = {
    features: readonly TemporalGeoJsonGeometryFeature<TProperties>[];
    type: "FeatureCollection";
};
type TemporalGeoJsonFrame<TProperties = Record<string, unknown>> = {
    geometry: TemporalGeoJsonSupportedGeometry;
    label?: string;
    metrics?: MapMetricRecord;
    properties?: TProperties;
    time: number;
    visible?: boolean;
};
type TemporalGeoJsonTrack<TProperties = Record<string, unknown>> = {
    id?: string | number;
    label?: string;
    metrics?: MapMetricRecord;
    properties?: TProperties;
    frames: readonly TemporalGeoJsonFrame<TProperties>[];
};
type TemporalGeoJsonInterpolationStrategy = "hold" | "compatible" | "resample" | "vertex-union" | "centroid-radial";
type TemporalGeoJsonInterpolationOptions = {
    fallback?: "hold" | "hide";
    maxCoordinatesPerLine?: number;
    maxCoordinatesPerRing?: number;
    minResampleCoordinates?: number;
    partMatchingStrategy?: Exclude<GeoJsonPartMatchingStrategy, "overlap">;
    strategy?: TemporalGeoJsonInterpolationStrategy;
};
/**
 * Preparation options for repeated temporal GeoJSON playback sampling.
 *
 * Dense geometry can be resampled once during index creation so animation
 * frames avoid repeatedly preparing the same rings and lines.
 */
type TemporalGeoJsonPlaybackIndexOptions = TemporalGeoJsonInterpolationOptions & {
    denseGeometryBehavior?: "preserve" | "resample";
    denseLineThreshold?: number;
    denseRingThreshold?: number;
};
type TemporalGeoJsonGeometryTrackOptions<TProperties extends Record<string, unknown> = Record<string, unknown>, TTrackProperties = TProperties> = {
    getLabel?: (feature: TemporalGeoJsonGeometryFeature<TProperties>, index: number) => string | undefined;
    getMetrics?: (feature: TemporalGeoJsonGeometryFeature<TProperties>, index: number) => MapMetricRecord | undefined;
    getProperties?: (feature: TemporalGeoJsonGeometryFeature<TProperties>, index: number) => TTrackProperties | undefined;
    getTime?: (feature: TemporalGeoJsonGeometryFeature<TProperties>, index: number) => number | string | Date | undefined;
    getTrackId?: (feature: TemporalGeoJsonGeometryFeature<TProperties>, index: number) => string | number | undefined;
    getVisible?: (feature: TemporalGeoJsonGeometryFeature<TProperties>, index: number) => boolean | undefined;
    metricKeys?: readonly string[];
};
type TemporalGeoJsonOutputFeature<TProperties = Record<string, unknown>> = {
    geometry: TemporalGeoJsonSupportedGeometry;
    id: string;
    properties: TProperties & {
        metrics: MapMetricRecord;
        temporalLabel: string;
        temporalTrackId: string;
    };
    type: "Feature";
};
type TemporalGeoJsonOutputFeatureCollection<TProperties = Record<string, unknown>> = {
    features: Array<TemporalGeoJsonOutputFeature<TProperties>>;
    type: "FeatureCollection";
};
/**
 * Precomputed temporal GeoJSON sampler for playback loops and animation frames.
 */
type TemporalGeoJsonPlaybackIndex<TProperties = Record<string, unknown>> = {
    getFeatureCollectionAtTime(time: number): TemporalGeoJsonOutputFeatureCollection<TProperties>;
    getTimeRange(): TemporalMapTimeRange | null;
};

type GeoJsonMapSource<TProperties extends Record<string, unknown> = Record<string, unknown>> = TemporalGeoJsonGeometryFeatureCollection<TProperties>;
type GeoJsonSourceOptions<TProperties extends Record<string, unknown> = Record<string, unknown>, TOutputProperties = TProperties> = {
    getFeatureId?: (feature: TemporalGeoJsonGeometryFeature<TProperties>, index: number, partIndex?: number) => string | number | undefined;
    getLabel?: (feature: TemporalGeoJsonGeometryFeature<TProperties>, index: number, partIndex?: number) => string | undefined;
    getMetrics?: (feature: TemporalGeoJsonGeometryFeature<TProperties>, index: number, partIndex?: number) => MapMetricRecord | undefined;
    getProperties?: (feature: TemporalGeoJsonGeometryFeature<TProperties>, index: number, partIndex?: number) => TOutputProperties | undefined;
    metricKeys?: readonly string[];
};
type GeoJsonOverlayMode = boolean | "all" | "incompatible" | "none";
type GeoJsonOverlayTarget = "flow" | "point";
type GeoJsonOverlayOptions = {
    mode?: GeoJsonOverlayMode;
    target?: GeoJsonOverlayTarget;
};
type FlattenedGeoJsonFeature<TProperties extends Record<string, unknown>> = {
    feature: TemporalGeoJsonGeometryFeature<TProperties>;
    geometry: TemporalGeoJsonSupportedGeometry;
    index: number;
    partIndex?: number;
};
declare function createMapPointsFromGeoJson<TProperties extends Record<string, unknown> = Record<string, unknown>, TOutputProperties extends Record<string, unknown> = TProperties>(collection: GeoJsonMapSource<TProperties>, options?: GeoJsonSourceOptions<TProperties, TOutputProperties>): Array<MapPoint<TOutputProperties>>;
declare function createMapFlowsFromGeoJson<TProperties extends Record<string, unknown> = Record<string, unknown>, TOutputProperties extends Record<string, unknown> = TProperties>(collection: GeoJsonMapSource<TProperties>, options?: GeoJsonSourceOptions<TProperties, TOutputProperties>): Array<MapFlow<TOutputProperties>>;
declare function createGeoJsonOverlayFeatureCollection<TProperties extends Record<string, unknown> = Record<string, unknown>>(collection: GeoJsonMapSource<TProperties>, options?: GeoJsonOverlayOptions): TemporalGeoJsonGeometryFeatureCollection<TProperties>;
declare function getBoundsFromGeoJson<TProperties extends Record<string, unknown>>(collection: GeoJsonMapSource<TProperties>): [west: number, south: number, east: number, north: number] | null;
declare function flattenGeoJsonFeatures<TProperties extends Record<string, unknown> = Record<string, unknown>>(collection: GeoJsonMapSource<TProperties>): Array<FlattenedGeoJsonFeature<TProperties>>;

type GeoJsonLayerFeature<TProperties = Record<string, unknown>> = {
    geometry: TemporalGeoJsonSupportedGeometry;
    id: string;
    properties: TProperties;
    sourceIndex: number;
};
type GeoJsonLayerStyle = {
    lineColor?: string;
    lineOpacity?: number;
    lineWidth?: number;
    pointColor?: string;
    pointRadius?: number;
    polygonFillColor?: string;
    polygonFillOpacity?: number;
    polygonStrokeColor?: string;
    polygonStrokeWidth?: number;
};
type GeoJsonLayerProps<TProperties extends Record<string, unknown> = Record<string, unknown>> = MapFeatureInteractionProps<GeoJsonLayerFeature<TProperties>> & GeoJsonLayerStyle & {
    featureCollection: TemporalGeoJsonGeometryFeatureCollection<TProperties>;
    getFeatureStyle?: (feature: GeoJsonLayerFeature<TProperties>) => GeoJsonLayerStyle;
    isFeatureInteractive?: (feature: GeoJsonLayerFeature<TProperties>) => boolean;
    layerId?: string;
    onFeatureSelect?: (feature: GeoJsonLayerFeature<TProperties> | null) => void;
};
declare function GeoJsonLayer<TProperties extends Record<string, unknown> = Record<string, unknown>>({ featureCollection, getFeatureId, getFeatureStyle, isFeatureInteractive, hoveredFeatureId, layerId, onHoveredFeatureIdChange, onFeatureContextMenu, onFeatureHover, onFeatureSelect, onSelectedFeatureIdChange, renderFeatureContextMenu, renderFeaturePopup, renderFeatureTooltip, selectedFeatureId, lineColor, lineOpacity, lineWidth, pointColor, pointRadius, polygonFillColor, polygonFillOpacity, polygonStrokeColor, polygonStrokeWidth, }: GeoJsonLayerProps<TProperties>): null;
declare function createGeoJsonLayerFeatures<TProperties extends Record<string, unknown> = Record<string, unknown>>(collection: TemporalGeoJsonGeometryFeatureCollection<TProperties>): Array<GeoJsonLayerFeature<TProperties>>;

export { type ViewportAggregation as $, type AggregatedMapCluster as A, type MapFeatureInteractionChange as B, type MapFeatureInteractionProps as C, type MapFeatureInteractionState as D, type MapFlow as E, type FlowDirectionMarker as F, GeoJsonLayer as G, type MapMetricRecord as H, type IndexedMapFlow as I, type MapPoint as J, type MapPointFilter as K, type PointAggregationIndexOptions as L, type MapContextMenuContext as M, type TemporalGeoJsonGeometryFeature as N, type TemporalGeoJsonGeometryFeatureCollection as O, type PointAggregationIndex as P, type TemporalGeoJsonGeometryTrackOptions as Q, type TemporalGeoJsonInterpolationOptions as R, type TemporalGeoJsonInterpolationStrategy as S, type TemporalGeoJsonFrame as T, type TemporalGeoJsonOutputFeature as U, type TemporalGeoJsonOutputFeatureCollection as V, type TemporalGeoJsonPlaybackIndex as W, type TemporalGeoJsonPlaybackIndexOptions as X, type TemporalGeoJsonSupportedGeometry as Y, type TemporalGeoJsonTrack as Z, type TemporalMapTimeRange as _, type AggregatedMapFeature as a, type ViewportAggregationQuery as a0, type VisibleAggregationSummary as a1, createGeoJsonLayerFeatures as a2, createGeoJsonOverlayFeatureCollection as a3, createMapDensityViewportSummary as a4, createMapFlowsFromGeoJson as a5, createMapPointsFromGeoJson as a6, createPointAggregationIndex as a7, flattenGeoJsonFeatures as a8, getBoundsFromGeoJson as a9, getBoundsFromPoints as aa, snapTemporalMapTime as ab, type AggregatedMapPoint as b, FlowLayer as c, type FlowLayerFeature as d, type FlowLayerProps as e, type FlowLayerWeightAccessor as f, type FlowShape as g, type GeoJsonLayerFeature as h, type GeoJsonLayerProps as i, type GeoJsonLayerStyle as j, type GeoJsonLineStringGeometry as k, type GeoJsonMapSource as l, type GeoJsonMultiLineStringGeometry as m, type GeoJsonMultiPointGeometry as n, type GeoJsonMultiPolygonGeometry as o, type GeoJsonOverlayMode as p, type GeoJsonOverlayOptions as q, type GeoJsonOverlayTarget as r, type GeoJsonPartMatchingStrategy as s, type GeoJsonPointGeometry as t, type GeoJsonPolygonGeometry as u, type GeoJsonPosition as v, type GeoJsonSourceOptions as w, type IndexedMapPoint as x, type MapDensityViewportSummary as y, type MapFeatureContextMenuContext as z };
