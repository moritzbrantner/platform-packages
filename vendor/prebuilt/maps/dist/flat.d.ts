export { a as ClusteredMapProps, F as FlatClusteredMap } from './clustered-map-BE_cgxzx.js';
export { a as BubbleMapFeature, b as BubbleMapProps, c as BubbleMapWeightAccessor, F as FlatBubbleMap, d as FlatFlowMap, e as FlatPointMap, g as FlowMapFeature, h as FlowMapProps, i as FlowMapWeightAccessor, I as IndexedMapFlow, M as MapFlow, j as PointMapFeature, k as PointMapProps, l as createBubbleMapFeatures, m as createFlowMapFeatures, n as createPointMapFeatures } from './flow-map-DIzg3At_.js';
import { i as GeoJsonLayerProps, l as GeoJsonMapSource } from './geojson-layer-09FHd5Kp.js';
export { F as FlowDirectionMarker, g as FlowShape } from './geojson-layer-09FHd5Kp.js';
export { F as FlatHeatFieldMap, a as FlatHeatFieldMapProps, b as FlatHeatMap, e as HeatMapColorStop, f as HeatMapDensityIndex, g as HeatMapDensityIndexOptions, h as HeatMapFeature, i as HeatMapFeatureCollection, j as HeatMapFeatureProperties, k as HeatMapProps, l as HeatMapRadius, m as HeatMapSurfaceMode, n as HeatMapWeightAccessor, o as HeatMapWeightOptions } from './heat-map-BmNt3zvE.js';
export { j as HeatFieldRenderMode } from './heat-layer-types-BH7QSCCa.js';
import * as react_jsx_runtime from 'react/jsx-runtime';
import { Map } from 'maplibre-gl';
import { g as MapViewState, R as RasterMapStyle, M as MapBounds } from './map-display-ChLAprbZ.js';
export { c as MapDisplayMode, f as MapSurfaceController, h as MapViewStateChangeContext, i as MapViewStateChangeReason, j as MapViewportProps, k as defaultRasterMapStyle } from './map-display-ChLAprbZ.js';
export { c as createHeatMapDensityIndex, a as createHeatMapFeatureCollection, g as getHeatMapMaxWeight, r as resolveHeatMapPointWeight } from './heat-core-CCLNAU7c.js';
import './measurement-UgWxBeK2.js';
import './point-layer-CZ5_WTMb.js';
import 'react';

type FlatGeoJsonMapProps<TProperties extends Record<string, unknown> = Record<string, unknown>> = Omit<GeoJsonLayerProps<TProperties>, "featureCollection" | "onFeatureContextMenu" | "onFeatureHover" | "renderFeatureContextMenu" | "renderFeaturePopup" | "renderFeatureTooltip"> & {
    className?: string;
    fitBoundsPadding?: number;
    fitToData?: boolean;
    geoJson: GeoJsonMapSource<TProperties>;
    /**
     * @deprecated Use `defaultViewState` for an uncontrolled initial viewport.
     */
    initialViewState?: MapViewState;
    mapLabel?: string;
    mapStyle?: string | RasterMapStyle;
    maxBounds?: MapBounds;
    maxZoom?: number;
    onMapReady?: (map: Map) => void;
    showAttributionControl?: boolean;
    style?: React.CSSProperties;
};
declare function FlatGeoJsonMap<TProperties extends Record<string, unknown> = Record<string, unknown>>({ className, fitBoundsPadding, fitToData, geoJson, initialViewState, mapLabel, mapStyle, maxBounds, maxZoom, onMapReady, showAttributionControl, style, ...layerProps }: FlatGeoJsonMapProps<TProperties>): react_jsx_runtime.JSX.Element;

export { FlatGeoJsonMap, type FlatGeoJsonMapProps, MapViewState, RasterMapStyle };
