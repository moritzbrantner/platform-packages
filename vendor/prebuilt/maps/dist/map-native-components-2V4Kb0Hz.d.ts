import { c as MapDisplayMode } from './map-display-ChLAprbZ.js';
import * as react_jsx_runtime from 'react/jsx-runtime';
import { ReactNode } from 'react';
import { C as MapFeatureInteractionProps, a as AggregatedMapFeature, L as PointAggregationIndexOptions, K as MapPointFilter, a1 as VisibleAggregationSummary, J as MapPoint, l as GeoJsonMapSource, H as MapMetricRecord, Y as TemporalGeoJsonSupportedGeometry, j as GeoJsonLayerStyle, e as FlowLayerProps, x as IndexedMapPoint, E as MapFlow } from './geojson-layer-09FHd5Kp.js';
import { l as HeatLayerProps, k as HeatLayerFeature } from './heat-layer-types-BH7QSCCa.js';

type ClusterLayerProps<TProperties = Record<string, unknown>> = MapFeatureInteractionProps<AggregatedMapFeature<TProperties>> & {
    clusterRadius?: PointAggregationIndexOptions<TProperties>["radius"];
    filterPoint?: MapPointFilter<TProperties>;
    layerId?: string;
    maxZoom?: PointAggregationIndexOptions<TProperties>["maxZoom"];
    minZoom?: PointAggregationIndexOptions<TProperties>["minZoom"];
    onFeatureSelect?: (feature: AggregatedMapFeature<TProperties> | null) => void;
    onViewportAggregationChange?: (summary: VisibleAggregationSummary) => void;
    points: readonly MapPoint<TProperties>[];
};
declare function ClusterLayer<TProperties = Record<string, unknown>>({ clusterRadius, filterPoint, getFeatureId, hoveredFeatureId, layerId, maxZoom, minZoom, onHoveredFeatureIdChange, onFeatureContextMenu, onFeatureHover, onFeatureSelect, onSelectedFeatureIdChange, onViewportAggregationChange, points, renderFeatureContextMenu, renderFeaturePopup, renderFeatureTooltip, selectedFeatureId, }: ClusterLayerProps<TProperties>): null;

type MapRuntimeFlow<TProperties = Record<string, unknown>> = {
    from: [longitude: number, latitude: number];
    id: string;
    label?: string;
    metrics?: MapMetricRecord;
    properties?: TProperties;
    to: [longitude: number, latitude: number];
};
type MapRuntimeDataset<TProperties extends Record<string, unknown> = Record<string, unknown>> = {
    kind: "geo-points";
    points: readonly MapPoint<TProperties>[];
} | {
    featureCollection: GeoJsonMapSource<TProperties>;
    kind: "geojson";
} | {
    flows: readonly MapRuntimeFlow<TProperties>[];
    kind: "geo-flows";
};

type CompatibilityEngine = {
    addDataset?: unknown;
    addLayer?: unknown;
    computeFrame?: unknown;
    removeDataset?: unknown;
    removeLayer?: unknown;
};
/**
 * Provider options for the Maps-owned dataset runtime.
 *
 * `backend` and `engine` are retained as deprecated compatibility inputs for
 * pre-runtime consumers. Maps does not instantiate or depend on a generic
 * visualization engine anymore; an explicitly supplied `engine` is observed
 * only by the narrow migration bridge below.
 */
type MapEngineProviderProps = {
    backend?: unknown;
    children: ReactNode;
    engine?: CompatibilityEngine;
};
type MapDatasetProps<TProperties extends Record<string, unknown> = Record<string, unknown>> = {
    id: string;
    kind: "geo-points";
    points: readonly MapPoint<TProperties>[];
} | {
    featureCollection: GeoJsonMapSource<TProperties>;
    id: string;
    kind: "geojson";
} | {
    flows: readonly MapFlow<TProperties>[];
    id: string;
    kind: "geo-flows";
};
type MapRuntimeContextValue = {
    compatibilityEngine: CompatibilityEngine | null;
    getCompatibilityDatasetId(publicId: string): string | null;
    getDataset(publicId: string): MapRuntimeDataset | null;
    registerDataset(publicId: string, dataset: MapRuntimeDataset): () => void;
    version: number;
};
declare function MapEngineProvider({ children, engine }: MapEngineProviderProps): react_jsx_runtime.JSX.Element;
declare function useMapEngine(): MapRuntimeContextValue;
/**
 * Compatibility hook for consumers that previously inspected a generic engine
 * frame. It now exposes the Maps-owned dataset plus current map viewport and is
 * intentionally map-domain specific. Renderer frames remain private until a
 * second renderer proves the contract in #58/#59.
 */
declare function useMapFrame(layer: {
    datasetId: string;
    kind: string;
}): {
    dataset: MapRuntimeDataset;
    datasetId: string;
    kind: string;
    viewport: {
        center: [longitude: number, latitude: number];
        display: MapDisplayMode;
        zoom: number;
    } | null;
} | null;
declare function MapDataset<TProperties extends Record<string, unknown> = Record<string, unknown>>(props: MapDatasetProps<TProperties>): null;
type GeoClusterLayerProps = Omit<ClusterLayerProps<Record<string, unknown>>, "clusterRadius" | "points"> & {
    datasetId: string;
    getFeatureColor?: (feature: AggregatedMapFeature) => string;
    getFeatureRadius?: (feature: AggregatedMapFeature) => number;
    radius?: number;
};
declare function GeoClusterLayer({ datasetId, getFeatureColor: _getFeatureColor, getFeatureRadius: _getFeatureRadius, radius, ...layerProps }: GeoClusterLayerProps): react_jsx_runtime.JSX.Element | null;
type GeoPointLayerProps = {
    datasetId: string;
    getFeatureColor?: (feature: IndexedMapPoint) => string;
    getFeatureRadius?: (feature: IndexedMapPoint) => number;
    layerId?: string;
    onFeatureSelect?: (feature: IndexedMapPoint | null) => void;
} & MapFeatureInteractionProps<IndexedMapPoint>;
declare function GeoPointLayer(props: GeoPointLayerProps): react_jsx_runtime.JSX.Element | null;
type GeoHeatLayerProps = Omit<HeatLayerProps, "heatmapRadius" | "points"> & {
    datasetId: string;
    getFeatureColor?: (feature: HeatLayerFeature) => string;
    getFeatureRadius?: (feature: HeatLayerFeature) => number;
    radiusMeters?: number;
};
declare function GeoHeatLayer({ datasetId, getFeatureColor: _getFeatureColor, getFeatureRadius: _getFeatureRadius, radiusMeters, ...layerProps }: GeoHeatLayerProps): react_jsx_runtime.JSX.Element | null;
type GeoFlowLayerProps = Omit<FlowLayerProps, "flows"> & {
    datasetId: string;
};
declare function GeoFlowLayer({ datasetId, ...layerProps }: GeoFlowLayerProps): react_jsx_runtime.JSX.Element | null;
type EngineGeoJsonLayerFeature<TProperties extends Record<string, unknown> = Record<string, unknown>> = {
    geometry: TemporalGeoJsonSupportedGeometry;
    id: string;
    properties: TProperties;
    sourceIndex: number;
    type: "Feature";
};
type EngineGeoJsonLayerProps = {
    datasetId: string;
    getFeatureStyle?: (feature: EngineGeoJsonLayerFeature) => GeoJsonLayerStyle;
    layerId?: string;
    onFeatureSelect?: (feature: EngineGeoJsonLayerFeature | null) => void;
} & GeoJsonLayerStyle & MapFeatureInteractionProps<EngineGeoJsonLayerFeature>;
declare function EngineGeoJsonLayer(props: EngineGeoJsonLayerProps): react_jsx_runtime.JSX.Element | null;

export { ClusterLayer as C, EngineGeoJsonLayer as E, GeoClusterLayer as G, MapDataset as M, type ClusterLayerProps as a, type EngineGeoJsonLayerFeature as b, type EngineGeoJsonLayerProps as c, type GeoClusterLayerProps as d, GeoFlowLayer as e, type GeoFlowLayerProps as f, GeoHeatLayer as g, type GeoHeatLayerProps as h, GeoPointLayer as i, type GeoPointLayerProps as j, type MapDatasetProps as k, MapEngineProvider as l, type MapEngineProviderProps as m, useMapFrame as n, useMapEngine as u };
