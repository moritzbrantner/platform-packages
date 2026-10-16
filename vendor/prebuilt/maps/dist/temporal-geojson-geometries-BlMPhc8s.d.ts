import { H as MapMetricRecord, J as MapPoint, _ as TemporalMapTimeRange, Y as TemporalGeoJsonSupportedGeometry, R as TemporalGeoJsonInterpolationOptions, N as TemporalGeoJsonGeometryFeature, Z as TemporalGeoJsonTrack, X as TemporalGeoJsonPlaybackIndexOptions, W as TemporalGeoJsonPlaybackIndex, O as TemporalGeoJsonGeometryFeatureCollection, Q as TemporalGeoJsonGeometryTrackOptions, V as TemporalGeoJsonOutputFeatureCollection } from './geojson-layer-09FHd5Kp.js';

type TemporalMapKeyframe<TProperties = Record<string, unknown>> = {
    latitude: number;
    longitude: number;
    label?: string;
    metrics?: MapMetricRecord;
    properties?: TProperties;
    time: number;
    visible?: boolean;
};
type TemporalMapTrack<TProperties = Record<string, unknown>> = {
    id?: string | number;
    label?: string;
    metrics?: MapMetricRecord;
    properties?: TProperties;
    frames: readonly TemporalMapKeyframe<TProperties>[];
};
type TemporalMapPlaybackIndex<TProperties = Record<string, unknown>> = {
    getPointsAtTime(time: number): Array<MapPoint<TProperties>>;
    getTimeRange(): TemporalMapTimeRange | null;
};

declare function getTemporalMapTimeRange<TProperties = Record<string, unknown>>(tracks: readonly TemporalMapTrack<TProperties>[]): TemporalMapTimeRange | null;
declare function getTemporalMapPointsAtTime<TProperties = Record<string, unknown>>(tracks: readonly TemporalMapTrack<TProperties>[], time: number): Array<MapPoint<TProperties>>;
declare function createTemporalMapPlaybackIndex<TProperties = Record<string, unknown>>(tracks: readonly TemporalMapTrack<TProperties>[]): TemporalMapPlaybackIndex<TProperties>;

type TemporalGeoJsonProperties = Record<string, unknown>;
type TemporalGeoJsonPointFeature<TProperties extends TemporalGeoJsonProperties = TemporalGeoJsonProperties> = {
    geometry: {
        coordinates: readonly [longitude: number, latitude: number, ...rest: number[]];
        type: "Point";
    } | {
        coordinates?: unknown;
        type: string;
    } | null;
    id?: string | number;
    properties?: TProperties | null;
    type: "Feature";
};
type TemporalGeoJsonPointFeatureCollection<TProperties extends TemporalGeoJsonProperties = TemporalGeoJsonProperties> = {
    features: readonly TemporalGeoJsonPointFeature<TProperties>[];
    type: "FeatureCollection";
};
type TemporalGeoJsonTrackOptions<TProperties extends TemporalGeoJsonProperties = TemporalGeoJsonProperties, TTrackProperties = TProperties> = {
    getLabel?: (feature: TemporalGeoJsonPointFeature<TProperties>, index: number) => string | undefined;
    getMetrics?: (feature: TemporalGeoJsonPointFeature<TProperties>, index: number) => MapMetricRecord | undefined;
    getProperties?: (feature: TemporalGeoJsonPointFeature<TProperties>, index: number) => TTrackProperties | undefined;
    getTime?: (feature: TemporalGeoJsonPointFeature<TProperties>, index: number) => number | string | Date | undefined;
    getTrackId?: (feature: TemporalGeoJsonPointFeature<TProperties>, index: number) => string | number | undefined;
    getVisible?: (feature: TemporalGeoJsonPointFeature<TProperties>, index: number) => boolean | undefined;
    metricKeys?: readonly string[];
};
declare function createTemporalMapTracksFromGeoJson<TProperties extends TemporalGeoJsonProperties = TemporalGeoJsonProperties, TTrackProperties = TProperties>(collection: TemporalGeoJsonPointFeatureCollection<TProperties>, options?: TemporalGeoJsonTrackOptions<TProperties, TTrackProperties>): Array<TemporalMapTrack<TTrackProperties>>;

declare function interpolateTemporalGeoJsonGeometry(previousGeometry: TemporalGeoJsonSupportedGeometry, nextGeometry: TemporalGeoJsonSupportedGeometry, progress: number, options?: TemporalGeoJsonInterpolationOptions): TemporalGeoJsonSupportedGeometry | null;

type NormalizedGeometryPart = {
    geometry: TemporalGeoJsonSupportedGeometry;
    partIndex: number;
    partPath: string;
};
declare function normalizeGeometryParts(geometry: TemporalGeoJsonGeometryFeature["geometry"], options?: {
    decomposeMultiGeometries?: boolean;
}): NormalizedGeometryPart[];

declare function createTemporalGeoJsonTracksFromGeoJson<TProperties extends Record<string, unknown> = Record<string, unknown>, TTrackProperties = TProperties>(collection: TemporalGeoJsonGeometryFeatureCollection<TProperties>, options?: TemporalGeoJsonGeometryTrackOptions<TProperties, TTrackProperties>): Array<TemporalGeoJsonTrack<TTrackProperties>>;
declare function getTemporalGeoJsonTimeRange<TProperties = Record<string, unknown>>(tracks: readonly TemporalGeoJsonTrack<TProperties>[]): TemporalMapTimeRange | null;
declare function createTemporalGeoJsonPlaybackIndex<TProperties = Record<string, unknown>>(tracks: readonly TemporalGeoJsonTrack<TProperties>[], options?: TemporalGeoJsonPlaybackIndexOptions): TemporalGeoJsonPlaybackIndex<TProperties>;
/**
 * Resolves a temporal GeoJSON feature collection for one-off calls.
 *
 * For playback or repeated lookups, prefer createTemporalGeoJsonPlaybackIndex so frame
 * sorting, normalization, dense geometry resampling, and interpolation setup happen once.
 */
declare function getTemporalGeoJsonFeatureCollectionAtTime<TProperties = Record<string, unknown>>(tracks: readonly TemporalGeoJsonTrack<TProperties>[], time: number, options?: TemporalGeoJsonInterpolationOptions): TemporalGeoJsonOutputFeatureCollection<TProperties>;

export { type NormalizedGeometryPart as N, type TemporalGeoJsonPointFeature as T, type TemporalGeoJsonPointFeatureCollection as a, type TemporalGeoJsonTrackOptions as b, type TemporalMapKeyframe as c, type TemporalMapPlaybackIndex as d, type TemporalMapTrack as e, createTemporalGeoJsonPlaybackIndex as f, createTemporalGeoJsonTracksFromGeoJson as g, createTemporalMapPlaybackIndex as h, createTemporalMapTracksFromGeoJson as i, getTemporalGeoJsonFeatureCollectionAtTime as j, getTemporalGeoJsonTimeRange as k, getTemporalMapPointsAtTime as l, getTemporalMapTimeRange as m, interpolateTemporalGeoJsonGeometry as n, normalizeGeometryParts as o };
