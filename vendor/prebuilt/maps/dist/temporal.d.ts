import { b as TemporalGeoJsonTrackOptions, e as TemporalMapTrack } from './temporal-geojson-geometries-BlMPhc8s.js';
export { N as NormalizedGeometryPart, T as TemporalGeoJsonPointFeature, a as TemporalGeoJsonPointFeatureCollection, c as TemporalMapKeyframe, d as TemporalMapPlaybackIndex, f as createTemporalGeoJsonPlaybackIndex, g as createTemporalGeoJsonTracksFromGeoJson, h as createTemporalMapPlaybackIndex, i as createTemporalMapTracksFromGeoJson, j as getTemporalGeoJsonFeatureCollectionAtTime, k as getTemporalGeoJsonTimeRange, l as getTemporalMapPointsAtTime, m as getTemporalMapTimeRange, n as interpolateTemporalGeoJsonGeometry, o as normalizeGeometryParts } from './temporal-geojson-geometries-BlMPhc8s.js';
import * as react_jsx_runtime from 'react/jsx-runtime';
import { a as ClusteredMapProps } from './clustered-map-BE_cgxzx.js';
import { l as GeoJsonMapSource, p as GeoJsonOverlayMode, i as GeoJsonLayerProps, X as TemporalGeoJsonPlaybackIndexOptions, Q as TemporalGeoJsonGeometryTrackOptions } from './geojson-layer-09FHd5Kp.js';
export { k as GeoJsonLineStringGeometry, m as GeoJsonMultiLineStringGeometry, n as GeoJsonMultiPointGeometry, o as GeoJsonMultiPolygonGeometry, s as GeoJsonPartMatchingStrategy, t as GeoJsonPointGeometry, u as GeoJsonPolygonGeometry, v as GeoJsonPosition, T as TemporalGeoJsonFrame, N as TemporalGeoJsonGeometryFeature, O as TemporalGeoJsonGeometryFeatureCollection, R as TemporalGeoJsonInterpolationOptions, S as TemporalGeoJsonInterpolationStrategy, U as TemporalGeoJsonOutputFeature, V as TemporalGeoJsonOutputFeatureCollection, W as TemporalGeoJsonPlaybackIndex, Y as TemporalGeoJsonSupportedGeometry, Z as TemporalGeoJsonTrack, _ as TemporalMapTimeRange, ab as snapTemporalMapTime } from './geojson-layer-09FHd5Kp.js';
import { k as HeatMapProps, o as HeatMapWeightOptions } from './heat-map-BmNt3zvE.js';
import 'maplibre-gl';
import './map-display-ChLAprbZ.js';
import './measurement-UgWxBeK2.js';
import 'react';
import './heat-layer-types-BH7QSCCa.js';

type TemporalClusteredMapProps<TProperties extends Record<string, unknown> = Record<string, unknown>> = Omit<ClusteredMapProps<TProperties>, "points"> & {
    autoPlay?: boolean;
    currentTime?: number;
    defaultTime?: number;
    formatTimeLabel?: (time: number) => string;
    geoJson?: GeoJsonMapSource<TProperties>;
    geoJsonOverlay?: GeoJsonOverlayMode;
    geoJsonOverlayProps?: Omit<GeoJsonLayerProps<TProperties>, "featureCollection">;
    geoJsonPlaybackOptions?: TemporalGeoJsonPlaybackIndexOptions;
    geoJsonTrackOptions?: TemporalGeoJsonTrackOptions<TProperties, TProperties>;
    geoJsonOverlayTrackOptions?: TemporalGeoJsonGeometryTrackOptions<TProperties, TProperties>;
    loopPlayback?: boolean;
    onTimeChange?: (time: number) => void;
    playbackRate?: number;
    showPlaybackControls?: boolean;
    timeStep?: number | "any";
    timelineLabel?: string;
    tracks?: readonly TemporalMapTrack<TProperties>[];
};
declare function TemporalClusteredMap<TProperties extends Record<string, unknown> = Record<string, unknown>>({ autoPlay, className, currentTime, defaultTime, formatTimeLabel, geoJson, geoJsonOverlay, geoJsonOverlayProps, geoJsonPlaybackOptions, geoJsonTrackOptions, geoJsonOverlayTrackOptions, loopPlayback, mapLabel, onTimeChange, playbackRate, showPlaybackControls, style, timeStep, timelineLabel, tracks, ...mapProps }: TemporalClusteredMapProps<TProperties>): react_jsx_runtime.JSX.Element;

type TemporalHeatMapProps<TProperties extends Record<string, unknown> = Record<string, unknown>> = Omit<HeatMapProps<TProperties>, "points"> & {
    autoPlay?: boolean;
    currentTime?: number;
    defaultTime?: number;
    formatTimeLabel?: (time: number) => string;
    geoJson?: GeoJsonMapSource<TProperties>;
    geoJsonOverlay?: GeoJsonOverlayMode;
    geoJsonOverlayProps?: Omit<GeoJsonLayerProps<TProperties>, "featureCollection">;
    geoJsonPlaybackOptions?: TemporalGeoJsonPlaybackIndexOptions;
    geoJsonTrackOptions?: TemporalGeoJsonTrackOptions<TProperties, TProperties>;
    geoJsonOverlayTrackOptions?: TemporalGeoJsonGeometryTrackOptions<TProperties, TProperties>;
    loopPlayback?: boolean;
    onTimeChange?: (time: number) => void;
    playbackRate?: number;
    preserveTemporalScale?: boolean;
    showPlaybackControls?: boolean;
    timeStep?: number | "any";
    timelineLabel?: string;
    tracks?: readonly TemporalMapTrack<TProperties>[];
};
declare function TemporalHeatMap<TProperties extends Record<string, unknown> = Record<string, unknown>>({ autoPlay, className, currentTime, defaultTime, filterPoint, formatTimeLabel, geoJson, geoJsonOverlay, geoJsonOverlayProps, geoJsonPlaybackOptions, geoJsonTrackOptions, geoJsonOverlayTrackOptions, getWeight, loopPlayback, mapLabel, maxWeight, onTimeChange, playbackRate, preserveTemporalScale, showPlaybackControls, style, timeStep, timelineLabel, tracks, weightMetric, ...mapProps }: TemporalHeatMapProps<TProperties>): react_jsx_runtime.JSX.Element;
declare function getTemporalHeatMapMaxWeight<TProperties extends Record<string, unknown> = Record<string, unknown>>(tracks: readonly TemporalMapTrack<TProperties>[], options?: Omit<HeatMapWeightOptions<TProperties>, "maxWeight">): number;

export { TemporalClusteredMap, type TemporalClusteredMapProps, TemporalGeoJsonGeometryTrackOptions, TemporalGeoJsonPlaybackIndexOptions, TemporalGeoJsonTrackOptions, TemporalHeatMap, type TemporalHeatMapProps, TemporalMapTrack, getTemporalHeatMapMaxWeight };
