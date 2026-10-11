import * as react_jsx_runtime from 'react/jsx-runtime';
import * as maplibre_gl from 'maplibre-gl';
import { K as MapPointFilter, x as IndexedMapPoint, l as GeoJsonMapSource, w as GeoJsonSourceOptions, p as GeoJsonOverlayMode, O as TemporalGeoJsonGeometryFeatureCollection, i as GeoJsonLayerProps, L as PointAggregationIndexOptions, J as MapPoint, a0 as ViewportAggregationQuery } from './geojson-layer-09FHd5Kp.js';
import { g as MapViewState, c as MapDisplayMode, R as RasterMapStyle, f as MapSurfaceController, j as MapViewportProps } from './map-display-ChLAprbZ.js';
import { h as HeatFieldOptions, c as HeatFieldContourOptions, H as HeatFieldColorStop, j as HeatFieldRenderMode, m as HeatLayerRenderStrategy, n as HeatLayerSurfaceMode, g as HeatFieldMaskGeoJson } from './heat-layer-types-BH7QSCCa.js';
import { f as MapMeasurementProps } from './measurement-UgWxBeK2.js';

type HeatMapWeightAccessor<TProperties extends Record<string, unknown> = Record<string, unknown>> = (point: IndexedMapPoint<TProperties>) => number;
type HeatMapColorStop = readonly [density: number, color: string];
type HeatMapSurfaceMode = HeatLayerSurfaceMode;
type HeatMapRadius = number | {
    meters: number;
} | {
    max: number;
    maxZoom?: number;
    min: number;
    minZoom?: number;
};
type HeatMapFeatureProperties = {
    kind: "heat-cluster" | "heat-point";
    label: string;
    pointId: string;
    pointCount: number;
    rawWeight: number;
    weight: number;
} & Record<string, number | string>;
type HeatMapFeature = {
    geometry: {
        coordinates: [longitude: number, latitude: number];
        type: "Point";
    };
    properties: HeatMapFeatureProperties;
    type: "Feature";
};
type HeatMapFeatureCollection = {
    features: HeatMapFeature[];
    type: "FeatureCollection";
};
type HeatMapWeightOptions<TProperties extends Record<string, unknown> = Record<string, unknown>> = {
    filterPoint?: MapPointFilter<TProperties>;
    getWeight?: HeatMapWeightAccessor<TProperties>;
    maxWeight?: number;
    weightMetric?: string;
};
type HeatMapDensityIndexOptions<TProperties extends Record<string, unknown> = Record<string, unknown>> = HeatMapWeightOptions<TProperties> & {
    maxZoom?: PointAggregationIndexOptions<TProperties>["maxZoom"];
    minZoom?: PointAggregationIndexOptions<TProperties>["minZoom"];
    radius?: PointAggregationIndexOptions<TProperties>["radius"];
};
type HeatMapDensityIndex = {
    getFeatureCollection(query: ViewportAggregationQuery): HeatMapFeatureCollection;
    maxWeight: number;
    pointCount: number;
};
type HeatMapProps<TProperties extends Record<string, unknown> = Record<string, unknown>> = HeatMapWeightOptions<TProperties> & MapMeasurementProps & {
    children?: React.ReactNode;
    className?: string;
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
    fitBoundsPadding?: number;
    fitToData?: boolean;
    geoJson?: GeoJsonMapSource<TProperties>;
    geoJsonOptions?: GeoJsonSourceOptions<TProperties>;
    geoJsonOverlay?: GeoJsonOverlayMode;
    geoJsonOverlayCollection?: TemporalGeoJsonGeometryFeatureCollection<TProperties>;
    geoJsonOverlayProps?: Omit<GeoJsonLayerProps<TProperties>, "featureCollection">;
    heatmapAggregationMaxZoom?: PointAggregationIndexOptions<TProperties>["maxZoom"];
    heatmapAggregationMinZoom?: PointAggregationIndexOptions<TProperties>["minZoom"];
    heatmapAggregationRadius?: PointAggregationIndexOptions<TProperties>["radius"];
    heatmapAsyncRender?: boolean;
    heatmapColorRamp?: readonly HeatMapColorStop[];
    heatmapIntensity?: number;
    heatmapMaxRasterPixels?: number;
    heatmapMaxZoom?: number;
    heatmapMinZoomDeltaForRebuild?: number;
    heatmapOpacity?: number;
    heatmapOverscanRatio?: number;
    heatmapRadius?: HeatMapRadius;
    heatmapRenderStrategy?: HeatLayerRenderStrategy;
    heatmapSurfaceMode?: HeatMapSurfaceMode;
    getValue?: HeatFieldOptions<TProperties>["getValue"];
    /**
     * @deprecated Use `defaultViewState` for an uncontrolled initial viewport.
     */
    initialViewState?: MapViewState;
    interpolationEpsilonMeters?: HeatFieldOptions<TProperties>["interpolationEpsilonMeters"];
    interpolationExtrapolate?: HeatFieldOptions<TProperties>["interpolationExtrapolate"];
    interpolationK?: HeatFieldOptions<TProperties>["interpolationK"];
    interpolationMaxDistanceMeters?: HeatFieldOptions<TProperties>["interpolationMaxDistanceMeters"];
    interpolationPower?: HeatFieldOptions<TProperties>["interpolationPower"];
    mapDisplay?: MapDisplayMode;
    mapLabel?: string;
    mapStyle?: string | RasterMapStyle;
    maskGeoJson?: HeatFieldMaskGeoJson | null;
    onMapControllerReady?: (controller: MapSurfaceController) => void;
    onMapReady?: (map: maplibre_gl.Map) => void;
    points?: readonly MapPoint<TProperties>[];
    showAttributionControl?: boolean;
    showDataPoints?: boolean;
    dataPointColor?: string;
    dataPointOpacity?: number;
    dataPointRadius?: number;
    dataPointStrokeColor?: string;
    dataPointStrokeWidth?: number;
    dataPointValueFormat?: (value: number) => string;
    style?: React.CSSProperties;
    valueMetric?: string;
} & MapViewportProps;
declare function HeatMap<TProperties extends Record<string, unknown> = Record<string, unknown>>({ mapDisplay, children, className, fitBoundsPadding, fitToData, initialViewState, mapLabel, mapStyle, maxBounds, maxZoom, measurementDistanceFormat, measurementDraftLineColor, measurementLineColor, measurementMode, measurements, onMapControllerReady, onMapReady, onMeasurementCreate, onMeasurementDraftChange, onMeasurementSelect, points, geoJson, geoJsonOptions, geoJsonOverlay, geoJsonOverlayCollection, geoJsonOverlayProps, showAttributionControl, style, viewState, defaultViewState, onViewStateChange, ...props }: HeatMapProps<TProperties>): react_jsx_runtime.JSX.Element;
type HeatFieldMapProps<TProperties extends Record<string, unknown> = Record<string, unknown>> = Omit<HeatMapProps<TProperties>, "heatmapSurfaceMode">;
declare function HeatFieldMap<TProperties extends Record<string, unknown> = Record<string, unknown>>(props: HeatFieldMapProps<TProperties>): react_jsx_runtime.JSX.Element;
declare function FlatHeatMap<TProperties extends Record<string, unknown> = Record<string, unknown>>({ mapDisplay: _mapDisplay, ...props }: HeatMapProps<TProperties>): react_jsx_runtime.JSX.Element;
type FlatHeatFieldMapProps<TProperties extends Record<string, unknown> = Record<string, unknown>> = Omit<HeatMapProps<TProperties>, "heatmapSurfaceMode" | "mapDisplay">;
declare function FlatHeatFieldMap<TProperties extends Record<string, unknown> = Record<string, unknown>>(props: FlatHeatFieldMapProps<TProperties>): react_jsx_runtime.JSX.Element;

export { FlatHeatFieldMap as F, HeatFieldMap as H, type FlatHeatFieldMapProps as a, FlatHeatMap as b, type HeatFieldMapProps as c, HeatMap as d, type HeatMapColorStop as e, type HeatMapDensityIndex as f, type HeatMapDensityIndexOptions as g, type HeatMapFeature as h, type HeatMapFeatureCollection as i, type HeatMapFeatureProperties as j, type HeatMapProps as k, type HeatMapRadius as l, type HeatMapSurfaceMode as m, type HeatMapWeightAccessor as n, type HeatMapWeightOptions as o };
