export { C as ClusterLayer, a as ClusterLayerProps, E as EngineGeoJsonLayer, b as EngineGeoJsonLayerFeature, c as EngineGeoJsonLayerProps, G as GeoClusterLayer, d as GeoClusterLayerProps, e as GeoFlowLayer, f as GeoFlowLayerProps, g as GeoHeatLayer, h as GeoHeatLayerProps, i as GeoPointLayer, j as GeoPointLayerProps } from './map-native-components-2V4Kb0Hz.js';
import * as react_jsx_runtime from 'react/jsx-runtime';
import React$1, { ReactNode, HTMLAttributes } from 'react';
import * as maplibre_gl from 'maplibre-gl';
import { Map } from 'maplibre-gl';
import { F as FlatLayerFactory, a as FlatLayerGroup, b as FlatMapAdapter, j as MapViewportProps, c as MapDisplayMode, R as RasterMapStyle, f as MapSurfaceController } from './map-display-ChLAprbZ.js';
import { M as MapContextMenuContext } from './geojson-layer-09FHd5Kp.js';
export { F as FlowDirectionMarker, c as FlowLayer, e as FlowLayerProps, d as FlowMapLayerFeature, g as FlowShape, G as GeoJsonLayer, h as GeoJsonLayerFeature, i as GeoJsonLayerProps, j as GeoJsonLayerStyle, z as MapFeatureContextMenuContext, B as MapFeatureInteractionChange, C as MapFeatureInteractionProps, D as MapFeatureInteractionState, a2 as createGeoJsonLayerFeatures } from './geojson-layer-09FHd5Kp.js';
export { B as BubbleLayer, b as BubbleLayerProps, a as BubbleMapLayerFeature, P as PointLayer, e as PointLayerProps, d as PointMapLayerFeature } from './point-layer-CZ5_WTMb.js';
export { H as HeatFieldLayer, a as HeatFieldLayerProps, b as HeatLayer } from './heat-layer-zPPaUTv0.js';
export { BeeLineMeasurementLayer, BeeLineMeasurementLayerProps } from './measurement.js';
export { j as HeatFieldRenderMode, l as HeatLayerProps, n as HeatLayerSurfaceMode } from './heat-layer-types-BH7QSCCa.js';
import './measurement-UgWxBeK2.js';

type FlatMapRuntime$1 = "maplibre" | "webgl";

type MapLibreLayerRender = (context: {
    flat: FlatLayerFactory;
    interactionMode: MapInteractionMode;
    isMeasuring: boolean;
    layer: FlatLayerGroup;
    map: FlatMapAdapter;
    maplibre: typeof maplibre_gl;
    maplibreMap: Map;
}) => void;
type MapInteractionMode = "none" | "measurement" | "editing";

type MapViewProps$1 = MapViewportProps & {
    children?: ReactNode;
    className?: string;
    dataBounds?: [west: number, south: number, east: number, north: number] | null;
    fitBoundsPadding?: number;
    fitToData?: boolean;
    flatRuntime?: FlatMapRuntime$1;
    mapDisplay?: MapDisplayMode;
    mapLabel?: string;
    mapStyle?: string | RasterMapStyle;
    onMapControllerReady?: (controller: MapSurfaceController) => void;
    onMapContextMenu?: (context: MapContextMenuContext) => void;
    onMapReady?: (map: Map) => void;
    renderMapContextMenu?: (context: MapContextMenuContext) => ReactNode;
    showAttributionControl?: boolean;
    style?: React.CSSProperties;
};

type FlatMapRuntime = FlatMapRuntime$1 | "maps";
type MapViewProps = Omit<MapViewProps$1, "flatRuntime"> & {
    flatRuntime?: FlatMapRuntime;
};
declare function MapView(props: MapViewProps): react_jsx_runtime.JSX.Element;

type MapLayersProps = {
    children?: ReactNode;
};
declare function MapLayers({ children }: MapLayersProps): react_jsx_runtime.JSX.Element;
type MapOverlayPosition = "bottom" | "bottom-left" | "bottom-right" | "left" | "right" | "top" | "top-left" | "top-right";
type MapOverlayProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: ReactNode;
    position?: MapOverlayPosition;
};
declare function MapOverlay({ children, className, position, ...props }: MapOverlayProps): react_jsx_runtime.JSX.Element;
type MapControlsProps = MapOverlayProps;
declare function MapControls({ className, position, role, ...props }: MapControlsProps): react_jsx_runtime.JSX.Element;
type MapLegendProps = MapOverlayProps;
declare function MapLegend({ className, position, role, ...props }: MapLegendProps): react_jsx_runtime.JSX.Element;

type MapLegendValueFormat = (value: number) => React$1.ReactNode;
type MapColorRampLegendProps = MapLegendProps & {
    stops: readonly [value: number, color: string][];
    title?: React$1.ReactNode;
    valueDomain?: readonly [min: number, max: number];
    valueFormat?: MapLegendValueFormat;
};
type MapSizeLegendProps = MapLegendProps & {
    color?: string;
    getRadius: (value: number) => number;
    title?: React$1.ReactNode;
    valueFormat?: MapLegendValueFormat;
    values: readonly number[];
};
type MapCategoryLegendProps = MapLegendProps & {
    items: readonly {
        color: string;
        label: React$1.ReactNode;
    }[];
    title?: React$1.ReactNode;
};
type MapFlowLegendProps = MapLegendProps & {
    color?: string;
    getWidth: (value: number) => number;
    title?: React$1.ReactNode;
    valueFormat?: MapLegendValueFormat;
    values: readonly number[];
};
declare function MapColorRampLegend({ children, className, stops, title, valueDomain, valueFormat, ...props }: MapColorRampLegendProps): react_jsx_runtime.JSX.Element;
declare function MapSizeLegend({ children, className, color, getRadius, title, valueFormat, values, ...props }: MapSizeLegendProps): react_jsx_runtime.JSX.Element;
declare function MapCategoryLegend({ children, className, items, title, ...props }: MapCategoryLegendProps): react_jsx_runtime.JSX.Element;
declare function MapFlowLegend({ children, className, color, getWidth, title, valueFormat, values, ...props }: MapFlowLegendProps): react_jsx_runtime.JSX.Element;

export { type FlatMapRuntime, MapCategoryLegend, type MapCategoryLegendProps, MapColorRampLegend, type MapColorRampLegendProps, MapContextMenuContext, MapControls, type MapControlsProps, MapFlowLegend, type MapFlowLegendProps, MapLayers, type MapLayersProps, MapLegend, type MapLegendProps, type MapLegendValueFormat, type MapLibreLayerRender, MapOverlay, type MapOverlayPosition, type MapOverlayProps, MapSizeLegend, type MapSizeLegendProps, MapView, type MapViewProps };
