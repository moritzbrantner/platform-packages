import * as react_jsx_runtime from 'react/jsx-runtime';
import * as maplibre_gl from 'maplibre-gl';
import { L as PointAggregationIndexOptions, K as MapPointFilter, l as GeoJsonMapSource, w as GeoJsonSourceOptions, p as GeoJsonOverlayMode, O as TemporalGeoJsonGeometryFeatureCollection, i as GeoJsonLayerProps, a as AggregatedMapFeature, a1 as VisibleAggregationSummary, J as MapPoint, C as MapFeatureInteractionProps } from './geojson-layer-09FHd5Kp.js';
import { g as MapViewState, c as MapDisplayMode, R as RasterMapStyle, f as MapSurfaceController, j as MapViewportProps } from './map-display-ChLAprbZ.js';
import { f as MapMeasurementProps } from './measurement-UgWxBeK2.js';

type ClusteredMapProps<TProperties extends Record<string, unknown> = Record<string, unknown>> = {
    children?: React.ReactNode;
    className?: string;
    clusterRadius?: PointAggregationIndexOptions<TProperties>["radius"];
    filterPoint?: MapPointFilter<TProperties>;
    fitBoundsPadding?: number;
    fitToData?: boolean;
    geoJson?: GeoJsonMapSource<TProperties>;
    geoJsonOptions?: GeoJsonSourceOptions<TProperties>;
    geoJsonOverlay?: GeoJsonOverlayMode;
    geoJsonOverlayCollection?: TemporalGeoJsonGeometryFeatureCollection<TProperties>;
    geoJsonOverlayProps?: Omit<GeoJsonLayerProps<TProperties>, "featureCollection">;
    /**
     * @deprecated Use `defaultViewState` for an uncontrolled initial viewport.
     */
    initialViewState?: MapViewState;
    mapDisplay?: MapDisplayMode;
    mapLabel?: string;
    mapStyle?: string | RasterMapStyle;
    maxZoom?: PointAggregationIndexOptions<TProperties>["maxZoom"];
    minZoom?: PointAggregationIndexOptions<TProperties>["minZoom"];
    onFeatureSelect?: (feature: AggregatedMapFeature<TProperties> | null) => void;
    onMapControllerReady?: (controller: MapSurfaceController) => void;
    onMapReady?: (map: maplibre_gl.Map) => void;
    onViewportAggregationChange?: (summary: VisibleAggregationSummary) => void;
    points?: readonly MapPoint<TProperties>[];
    showAttributionControl?: boolean;
    style?: React.CSSProperties;
} & MapMeasurementProps & Omit<MapViewportProps, "maxZoom"> & MapFeatureInteractionProps<AggregatedMapFeature<TProperties>>;

declare function ClusteredMap<TProperties extends Record<string, unknown> = Record<string, unknown>>({ children, className, fitBoundsPadding, fitToData, initialViewState, mapDisplay, mapLabel, mapStyle, measurementDistanceFormat, measurementDraftLineColor, measurementLineColor, measurementMode, measurements, onMapControllerReady, onMapReady, onMeasurementCreate, onMeasurementDraftChange, onMeasurementSelect, points, geoJson, geoJsonOptions, geoJsonOverlay, geoJsonOverlayCollection, geoJsonOverlayProps, maxBounds, showAttributionControl, style, viewState, defaultViewState, onViewStateChange, ...props }: ClusteredMapProps<TProperties>): react_jsx_runtime.JSX.Element;
declare function FlatClusteredMap<TProperties extends Record<string, unknown> = Record<string, unknown>>({ mapDisplay: _mapDisplay, ...props }: ClusteredMapProps<TProperties>): react_jsx_runtime.JSX.Element;

export { ClusteredMap as C, FlatClusteredMap as F, type ClusteredMapProps as a };
