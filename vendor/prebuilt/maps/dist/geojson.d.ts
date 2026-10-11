import { i as GeoJsonLayerProps, l as GeoJsonMapSource, M as MapContextMenuContext } from './geojson-layer-09FHd5Kp.js';
export { G as GeoJsonLayer, h as GeoJsonLayerFeature, j as GeoJsonLayerStyle, p as GeoJsonOverlayMode, q as GeoJsonOverlayOptions, r as GeoJsonOverlayTarget, w as GeoJsonSourceOptions, a2 as createGeoJsonLayerFeatures, a3 as createGeoJsonOverlayFeatureCollection, a5 as createMapFlowsFromGeoJson, a6 as createMapPointsFromGeoJson, a8 as flattenGeoJsonFeatures, a9 as getBoundsFromGeoJson } from './geojson-layer-09FHd5Kp.js';
export { G as GeoJsonBooleanOperation, a as GeoJsonContainmentRecord, b as GeoJsonIntersectionRecord, c as GeoJsonOperationFeatureProperties, d as GeoJsonOperationIssue, e as GeoJsonOperationIssueCode, f as GeoJsonOperationOptions, g as GeoJsonOperationResult, h as GeoJsonOverlapRecord, i as GeoJsonPolygonMeasurementOptions, j as GeoJsonPolygonMeasurementRecord, k as GeoJsonPolygonOutlineProperties, l as GeoJsonPolygonOutlineRingRole, m as GeoJsonPolygonOverlapResolutionOptions, n as GeoJsonPolygonOverlapResolutionResult, o as GeoJsonPolygonOverlapResolutionStrategy, p as GeoJsonPolygonSimplifyOptions, q as GeoJsonRelationshipOptions, r as GeoJsonValidationIssue, s as GeoJsonValidationOptions, t as GeoJsonValidationResult, u as GeoJsonValidationSeverity, v as clipGeoJsonToPolygon, w as createGeoJsonPolygonOutlines, x as differenceGeoJsonFeatures, y as findContainingGeoJsonFeatures, z as findOverlappingGeoJsonFeatures, A as getGeoJsonIntersections, B as getGeoJsonPolygonMeasurements, C as intersectGeoJsonFeatures, D as resolveGeoJsonPolygonOverlaps, E as simplifyGeoJsonPolygons, F as unionGeoJsonFeatures, H as validateGeoJsonMapSource } from './geojson-operations-DEjJcKy-.js';
import * as react_jsx_runtime from 'react/jsx-runtime';
import { Map } from 'maplibre-gl';
import { j as MapViewportProps, g as MapViewState, c as MapDisplayMode, R as RasterMapStyle, f as MapSurfaceController } from './map-display-ChLAprbZ.js';
import { f as MapMeasurementProps } from './measurement-UgWxBeK2.js';
import 'react';
import './geojson-topology-CmiY9wG1.js';

type GeoJsonMapProps<TProperties extends Record<string, unknown> = Record<string, unknown>> = Omit<GeoJsonLayerProps<TProperties>, "featureCollection"> & MapMeasurementProps & MapViewportProps & {
    children?: React.ReactNode;
    className?: string;
    fitBoundsPadding?: number;
    fitToData?: boolean;
    geoJson: GeoJsonMapSource<TProperties>;
    /**
     * @deprecated Use `defaultViewState` for an uncontrolled initial viewport.
     */
    initialViewState?: MapViewState;
    mapDisplay?: MapDisplayMode;
    mapLabel?: string;
    mapStyle?: string | RasterMapStyle;
    onMapControllerReady?: (controller: MapSurfaceController) => void;
    onMapContextMenu?: (context: MapContextMenuContext) => void;
    onMapReady?: (map: Map) => void;
    renderMapContextMenu?: (context: MapContextMenuContext) => React.ReactNode;
    showAttributionControl?: boolean;
    style?: React.CSSProperties;
};
declare function GeoJsonMap<TProperties extends Record<string, unknown> = Record<string, unknown>>({ className, children, fitBoundsPadding, fitToData, geoJson, initialViewState, mapDisplay, mapLabel, mapStyle, maxBounds, maxZoom, measurementDistanceFormat, measurementDraftLineColor, measurementLineColor, measurementMode, measurements, onMapControllerReady, onMapContextMenu, onMapReady, onMeasurementCreate, onMeasurementDraftChange, onMeasurementSelect, onViewStateChange, renderMapContextMenu, showAttributionControl, style, viewState, defaultViewState, ...layerProps }: GeoJsonMapProps<TProperties>): react_jsx_runtime.JSX.Element;

export { GeoJsonLayerProps, GeoJsonMap, type GeoJsonMapProps, GeoJsonMapSource };
