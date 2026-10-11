import * as react_jsx_runtime from 'react/jsx-runtime';
import * as maplibre_gl from 'maplibre-gl';
import { Map } from 'maplibre-gl';
import { K as MapPointFilter, l as GeoJsonMapSource, w as GeoJsonSourceOptions, p as GeoJsonOverlayMode, i as GeoJsonLayerProps, M as MapContextMenuContext, J as MapPoint, C as MapFeatureInteractionProps, F as FlowDirectionMarker, g as FlowShape, d as FlowLayerFeature, E as MapFlow$1, f as FlowLayerWeightAccessor, I as IndexedMapFlow$1 } from './geojson-layer-09FHd5Kp.js';
import { g as MapViewState, c as MapDisplayMode, R as RasterMapStyle, f as MapSurfaceController, j as MapViewportProps } from './map-display-ChLAprbZ.js';
import { f as MapMeasurementProps } from './measurement-UgWxBeK2.js';
import { d as PointLayerFeature, a as BubbleLayerFeature, c as BubbleLayerWeightAccessor } from './point-layer-CZ5_WTMb.js';
import { ReactNode } from 'react';

type PointMapFeature<TProperties extends Record<string, unknown> = Record<string, unknown>> = PointLayerFeature<TProperties>;
type PointMapProps<TProperties extends Record<string, unknown> = Record<string, unknown>> = {
    children?: React.ReactNode;
    className?: string;
    draggable?: boolean | ((feature: PointMapFeature<TProperties>) => boolean);
    filterPoint?: MapPointFilter<TProperties>;
    fitBoundsPadding?: number;
    fitToData?: boolean;
    geoJson?: GeoJsonMapSource<TProperties>;
    geoJsonOptions?: GeoJsonSourceOptions<TProperties>;
    geoJsonOverlay?: GeoJsonOverlayMode;
    geoJsonOverlayProps?: Omit<GeoJsonLayerProps<TProperties>, "featureCollection">;
    getPointColor?: (feature: PointMapFeature<TProperties>) => string;
    getPointRadius?: (feature: PointMapFeature<TProperties>) => number;
    /**
     * @deprecated Use `defaultViewState` for an uncontrolled initial viewport.
     */
    initialViewState?: MapViewState;
    mapDisplay?: MapDisplayMode;
    mapLabel?: string;
    mapStyle?: string | RasterMapStyle;
    onFeatureDrag?: (feature: PointMapFeature<TProperties>, coordinates: [longitude: number, latitude: number]) => void;
    onFeatureDragEnd?: (feature: PointMapFeature<TProperties>, coordinates: [longitude: number, latitude: number]) => void;
    onFeatureSelect?: (feature: PointMapFeature<TProperties> | null) => void;
    onMapContextMenu?: (context: MapContextMenuContext) => void;
    onMapControllerReady?: (controller: MapSurfaceController) => void;
    onMapReady?: (map: Map) => void;
    points?: readonly MapPoint<TProperties>[];
    pointColor?: string;
    pointRadius?: number;
    renderMapContextMenu?: (context: MapContextMenuContext) => React.ReactNode;
    showAttributionControl?: boolean;
    style?: React.CSSProperties;
} & MapMeasurementProps & MapViewportProps & MapFeatureInteractionProps<PointMapFeature<TProperties>>;
type BubbleMapWeightAccessor<TProperties extends Record<string, unknown> = Record<string, unknown>> = BubbleLayerWeightAccessor<TProperties>;
type BubbleMapFeature<TProperties extends Record<string, unknown> = Record<string, unknown>> = BubbleLayerFeature<TProperties>;
type BubbleMapProps<TProperties extends Record<string, unknown> = Record<string, unknown>> = Omit<PointMapProps<TProperties>, "draggable" | "getPointColor" | "getPointRadius" | "onFeatureDrag" | "onFeatureDragEnd" | "onFeatureSelect" | "pointColor" | "pointRadius"> & {
    bubbleColor?: string;
    draggable?: boolean | ((feature: BubbleMapFeature<TProperties>) => boolean);
    getBubbleColor?: (feature: BubbleMapFeature<TProperties>) => string;
    getWeight?: BubbleMapWeightAccessor<TProperties>;
    maxRadius?: number;
    maxWeight?: number;
    minRadius?: number;
    onFeatureDrag?: (feature: BubbleMapFeature<TProperties>, coordinates: [longitude: number, latitude: number]) => void;
    onFeatureDragEnd?: (feature: BubbleMapFeature<TProperties>, coordinates: [longitude: number, latitude: number]) => void;
    onFeatureSelect?: (feature: BubbleMapFeature<TProperties> | null) => void;
    weightMetric?: string;
};
declare function PointMap<TProperties extends Record<string, unknown> = Record<string, unknown>>({ mapDisplay, children, className, fitBoundsPadding, fitToData, initialViewState, mapLabel, mapStyle, maxBounds, maxZoom, measurementDistanceFormat, measurementDraftLineColor, measurementLineColor, measurementMode, measurements, onMapControllerReady, onMapContextMenu, onMapReady, onMeasurementCreate, onMeasurementDraftChange, onMeasurementSelect, points, geoJson, geoJsonOptions, geoJsonOverlay, geoJsonOverlayProps, renderMapContextMenu, showAttributionControl, style, viewState, defaultViewState, onViewStateChange, ...props }: PointMapProps<TProperties>): react_jsx_runtime.JSX.Element;
declare function BubbleMap<TProperties extends Record<string, unknown> = Record<string, unknown>>({ mapDisplay, children, className, fitBoundsPadding, fitToData, initialViewState, mapLabel, mapStyle, maxBounds, maxZoom, measurementDistanceFormat, measurementDraftLineColor, measurementLineColor, measurementMode, measurements, onMapControllerReady, onMapContextMenu, onMapReady, onMeasurementCreate, onMeasurementDraftChange, onMeasurementSelect, points, geoJson, geoJsonOptions, geoJsonOverlay, geoJsonOverlayProps, renderMapContextMenu, showAttributionControl, style, viewState, defaultViewState, onViewStateChange, ...props }: BubbleMapProps<TProperties>): react_jsx_runtime.JSX.Element;
declare function FlatBubbleMap<TProperties extends Record<string, unknown> = Record<string, unknown>>(props: BubbleMapProps<TProperties>): react_jsx_runtime.JSX.Element;
declare function createPointMapFeatures<TProperties extends Record<string, unknown> = Record<string, unknown>>(points: readonly MapPoint<TProperties>[], options?: {
    filterPoint?: MapPointFilter<TProperties>;
}): Array<PointMapFeature<TProperties>>;
declare function createBubbleMapFeatures<TProperties extends Record<string, unknown> = Record<string, unknown>>(points: readonly MapPoint<TProperties>[], options?: {
    filterPoint?: MapPointFilter<TProperties>;
    getWeight?: BubbleMapWeightAccessor<TProperties>;
    maxRadius?: number;
    maxWeight?: number;
    minRadius?: number;
    weightMetric?: string;
}): Array<BubbleMapFeature<TProperties>>;
declare function FlatPointMap<TProperties extends Record<string, unknown> = Record<string, unknown>>({ mapDisplay: _mapDisplay, ...props }: PointMapProps<TProperties>): react_jsx_runtime.JSX.Element;

type MapFlow<TProperties extends Record<string, unknown> = Record<string, unknown>> = MapFlow$1<TProperties>;
type IndexedMapFlow<TProperties extends Record<string, unknown> = Record<string, unknown>> = IndexedMapFlow$1<TProperties>;
type FlowMapFeature<TProperties extends Record<string, unknown> = Record<string, unknown>> = FlowLayerFeature<TProperties>;
type FlowMapWeightAccessor<TProperties extends Record<string, unknown> = Record<string, unknown>> = FlowLayerWeightAccessor<TProperties>;
type FlowMapProps<TProperties extends Record<string, unknown> = Record<string, unknown>> = {
    children?: ReactNode;
    className?: string;
    directionMarker?: FlowDirectionMarker;
    fitBoundsPadding?: number;
    fitToData?: boolean;
    flowColor?: string;
    flowShape?: FlowShape;
    flowValueFormat?: (value: number, feature: FlowMapFeature<TProperties>) => string;
    flows?: readonly MapFlow<TProperties>[];
    geoJson?: GeoJsonMapSource<TProperties>;
    geoJsonOptions?: GeoJsonSourceOptions<TProperties>;
    geoJsonOverlay?: GeoJsonOverlayMode;
    geoJsonOverlayProps?: Omit<GeoJsonLayerProps<TProperties>, "featureCollection">;
    getFlowColor?: (feature: FlowMapFeature<TProperties>) => string;
    getFlowLabel?: (feature: FlowMapFeature<TProperties>) => ReactNode;
    getWeight?: FlowMapWeightAccessor<TProperties>;
    hoveredFlowOpacity?: number;
    inactiveFlowOpacity?: number;
    /**
     * @deprecated Use `defaultViewState` for an uncontrolled initial viewport.
     */
    initialViewState?: MapViewState;
    mapDisplay?: MapDisplayMode;
    mapLabel?: string;
    mapStyle?: string | RasterMapStyle;
    maxWeight?: number;
    maxWidth?: number;
    minWidth?: number;
    onFeatureSelect?: (feature: FlowMapFeature<TProperties> | null) => void;
    onMapControllerReady?: (controller: MapSurfaceController) => void;
    onMapReady?: (map: maplibre_gl.Map) => void;
    selectedFlowOpacity?: number;
    showAttributionControl?: boolean;
    showDirection?: boolean;
    showEndpoints?: boolean;
    style?: React.CSSProperties;
    weightMetric?: string;
} & MapMeasurementProps & MapViewportProps & MapFeatureInteractionProps<FlowMapFeature<TProperties>>;
declare function FlowMap<TProperties extends Record<string, unknown> = Record<string, unknown>>({ mapDisplay, children, className, fitBoundsPadding, fitToData, initialViewState, mapLabel, mapStyle, maxBounds, maxZoom, measurementDistanceFormat, measurementDraftLineColor, measurementLineColor, measurementMode, measurements, onMapControllerReady, onMapReady, onMeasurementCreate, onMeasurementDraftChange, onMeasurementSelect, flows, geoJson, geoJsonOptions, geoJsonOverlay, geoJsonOverlayProps, showAttributionControl, style, viewState, defaultViewState, onViewStateChange, ...props }: FlowMapProps<TProperties>): react_jsx_runtime.JSX.Element;
declare function createFlowMapFeatures<TProperties extends Record<string, unknown> = Record<string, unknown>>(flows: readonly MapFlow<TProperties>[], options?: {
    getWeight?: FlowMapWeightAccessor<TProperties>;
    maxWeight?: number;
    maxWidth?: number;
    minWidth?: number;
    weightMetric?: string;
}): Array<FlowMapFeature<TProperties>>;
declare function FlatFlowMap<TProperties extends Record<string, unknown> = Record<string, unknown>>({ mapDisplay: _mapDisplay, ...props }: FlowMapProps<TProperties>): react_jsx_runtime.JSX.Element;

export { BubbleMap as B, FlatBubbleMap as F, type IndexedMapFlow as I, type MapFlow as M, PointMap as P, type BubbleMapFeature as a, type BubbleMapProps as b, type BubbleMapWeightAccessor as c, FlatFlowMap as d, FlatPointMap as e, FlowMap as f, type FlowMapFeature as g, type FlowMapProps as h, type FlowMapWeightAccessor as i, type PointMapFeature as j, type PointMapProps as k, createBubbleMapFeatures as l, createFlowMapFeatures as m, createPointMapFeatures as n };
