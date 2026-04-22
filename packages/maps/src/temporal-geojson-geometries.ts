import { booleanClockwise } from "@turf/boolean-clockwise";
import { centroid } from "@turf/centroid";
import { polygon as createTurfPolygon } from "@turf/helpers";

import type { MapMetricRecord } from "./aggregation";
import {
  filterFiniteMetrics,
  getTemporalMapTimeRange as getTemporalTrackTimeRange,
  interpolate,
  interpolateMetrics,
  isRecord,
  mergeMetrics,
  mergeProperties,
  parseTemporalGeoJsonTime,
  type TemporalMapTimeRange,
} from "./temporal-core";

export type GeoJsonPosition = [longitude: number, latitude: number];

export type GeoJsonPointGeometry = {
  coordinates: GeoJsonPosition;
  type: "Point";
};

export type GeoJsonLineStringGeometry = {
  coordinates: GeoJsonPosition[];
  type: "LineString";
};

export type GeoJsonMultiLineStringGeometry = {
  coordinates: GeoJsonPosition[][];
  type: "MultiLineString";
};

export type GeoJsonPolygonGeometry = {
  coordinates: GeoJsonPosition[][];
  type: "Polygon";
};

export type GeoJsonMultiPolygonGeometry = {
  coordinates: GeoJsonPosition[][][];
  type: "MultiPolygon";
};

export type TemporalGeoJsonSupportedGeometry =
  | GeoJsonPointGeometry
  | GeoJsonLineStringGeometry
  | GeoJsonMultiLineStringGeometry
  | GeoJsonPolygonGeometry
  | GeoJsonMultiPolygonGeometry;

export type TemporalGeoJsonGeometryFeature<
  TProperties extends Record<string, unknown> = Record<string, unknown>,
> = {
  geometry:
    | TemporalGeoJsonSupportedGeometry
    | {
        coordinates?: unknown;
        type: string;
      }
    | null;
  id?: string | number;
  properties?: TProperties | null;
  type: "Feature";
};

export type TemporalGeoJsonGeometryFeatureCollection<
  TProperties extends Record<string, unknown> = Record<string, unknown>,
> = {
  features: readonly TemporalGeoJsonGeometryFeature<TProperties>[];
  type: "FeatureCollection";
};

export type TemporalGeoJsonFrame<TProperties = Record<string, unknown>> = {
  geometry: TemporalGeoJsonSupportedGeometry;
  label?: string;
  metrics?: MapMetricRecord;
  properties?: TProperties;
  time: number;
  visible?: boolean;
};

export type TemporalGeoJsonTrack<TProperties = Record<string, unknown>> = {
  id?: string | number;
  label?: string;
  metrics?: MapMetricRecord;
  properties?: TProperties;
  frames: readonly TemporalGeoJsonFrame<TProperties>[];
};

export type TemporalGeoJsonInterpolationStrategy =
  | "hold"
  | "compatible"
  | "resample"
  | "centroid-radial";

export type TemporalGeoJsonInterpolationOptions = {
  fallback?: "hold" | "hide";
  maxCoordinatesPerLine?: number;
  maxCoordinatesPerRing?: number;
  minResampleCoordinates?: number;
  strategy?: TemporalGeoJsonInterpolationStrategy;
};

export type TemporalGeoJsonGeometryTrackOptions<
  TProperties extends Record<string, unknown> = Record<string, unknown>,
  TTrackProperties = TProperties,
> = {
  getLabel?: (
    feature: TemporalGeoJsonGeometryFeature<TProperties>,
    index: number,
  ) => string | undefined;
  getMetrics?: (
    feature: TemporalGeoJsonGeometryFeature<TProperties>,
    index: number,
  ) => MapMetricRecord | undefined;
  getProperties?: (
    feature: TemporalGeoJsonGeometryFeature<TProperties>,
    index: number,
  ) => TTrackProperties | undefined;
  getTime?: (
    feature: TemporalGeoJsonGeometryFeature<TProperties>,
    index: number,
  ) => number | string | Date | undefined;
  getTrackId?: (
    feature: TemporalGeoJsonGeometryFeature<TProperties>,
    index: number,
  ) => string | number | undefined;
  getVisible?: (
    feature: TemporalGeoJsonGeometryFeature<TProperties>,
    index: number,
  ) => boolean | undefined;
  metricKeys?: readonly string[];
};

export type TemporalGeoJsonOutputFeature<TProperties = Record<string, unknown>> = {
  geometry: TemporalGeoJsonSupportedGeometry;
  id: string;
  properties: TProperties & {
    metrics: MapMetricRecord;
    temporalLabel: string;
    temporalTrackId: string;
  };
  type: "Feature";
};

export type TemporalGeoJsonOutputFeatureCollection<TProperties = Record<string, unknown>> = {
  features: Array<TemporalGeoJsonOutputFeature<TProperties>>;
  type: "FeatureCollection";
};

type MutableTemporalGeoJsonTrack<TProperties> = Omit<
  TemporalGeoJsonTrack<TProperties>,
  "frames"
> & {
  frames: TemporalGeoJsonFrame<TProperties>[];
};

type ResolvedInterpolationOptions = Required<TemporalGeoJsonInterpolationOptions>;

const DEFAULT_INTERPOLATION_OPTIONS: ResolvedInterpolationOptions = {
  fallback: "hold",
  maxCoordinatesPerLine: 512,
  maxCoordinatesPerRing: 512,
  minResampleCoordinates: 16,
  strategy: "compatible",
};

export function createTemporalGeoJsonTracksFromGeoJson<
  TProperties extends Record<string, unknown> = Record<string, unknown>,
  TTrackProperties = TProperties,
>(
  collection: TemporalGeoJsonGeometryFeatureCollection<TProperties>,
  options: TemporalGeoJsonGeometryTrackOptions<TProperties, TTrackProperties> = {},
): Array<TemporalGeoJsonTrack<TTrackProperties>> {
  const tracks = new Map<string, MutableTemporalGeoJsonTrack<TTrackProperties>>();

  collection.features.forEach((feature, index) => {
    const geometry = normalizeSupportedGeometry(feature.geometry);

    if (!geometry) {
      return;
    }

    const time = parseTemporalGeoJsonTime(readTime(feature, index, options));

    if (!Number.isFinite(time)) {
      return;
    }

    const trackId = readTrackId(feature, index, options);
    const trackKey = String(trackId);
    const label = readLabel(feature, index, options, trackId);
    const frame: TemporalGeoJsonFrame<TTrackProperties> = {
      geometry,
      metrics: readMetrics(feature, index, options),
      properties: readProperties(feature, index, options),
      time,
      visible: readVisible(feature, index, options),
    };
    const track = tracks.get(trackKey);

    if (label !== undefined) {
      frame.label = label;
    }

    if (track) {
      if (track.label === undefined && label !== undefined) {
        track.label = label;
      }

      track.frames.push(frame);
      return;
    }

    tracks.set(trackKey, {
      frames: [frame],
      id: trackId,
      label,
    });
  });

  return [...tracks.values()].map((track) => ({
    ...track,
    frames: [...track.frames].sort((left, right) => left.time - right.time),
  }));
}

export function getTemporalGeoJsonTimeRange<TProperties = Record<string, unknown>>(
  tracks: readonly TemporalGeoJsonTrack<TProperties>[],
): TemporalMapTimeRange | null {
  return getTemporalTrackTimeRange(tracks);
}

export function getTemporalGeoJsonFeatureCollectionAtTime<TProperties = Record<string, unknown>>(
  tracks: readonly TemporalGeoJsonTrack<TProperties>[],
  time: number,
  options: TemporalGeoJsonInterpolationOptions = {},
): TemporalGeoJsonOutputFeatureCollection<TProperties> {
  if (!Number.isFinite(time)) {
    return {
      features: [],
      type: "FeatureCollection",
    };
  }

  return {
    features: tracks
      .map((track, index) => resolveTrackAtTime(track, index, time, options))
      .filter((feature): feature is TemporalGeoJsonOutputFeature<TProperties> => feature !== null),
    type: "FeatureCollection",
  };
}

export function interpolateTemporalGeoJsonGeometry(
  previousGeometry: TemporalGeoJsonSupportedGeometry,
  nextGeometry: TemporalGeoJsonSupportedGeometry,
  progress: number,
  options: TemporalGeoJsonInterpolationOptions = {},
): TemporalGeoJsonSupportedGeometry | null {
  const resolvedOptions = resolveInterpolationOptions(options);

  if (!Number.isFinite(progress)) {
    return applyInterpolationFallback(previousGeometry, resolvedOptions);
  }

  if (resolvedOptions.strategy === "hold") {
    return cloneGeometry(previousGeometry);
  }

  if (previousGeometry.type !== nextGeometry.type) {
    return applyInterpolationFallback(previousGeometry, resolvedOptions);
  }

  const geometry = interpolateMatchingGeometry(
    previousGeometry,
    nextGeometry,
    clampProgress(progress),
    resolvedOptions,
  );

  return geometry ?? applyInterpolationFallback(previousGeometry, resolvedOptions);
}

function resolveTrackAtTime<TProperties>(
  track: TemporalGeoJsonTrack<TProperties>,
  index: number,
  time: number,
  options: TemporalGeoJsonInterpolationOptions,
): TemporalGeoJsonOutputFeature<TProperties> | null {
  const frames = [...track.frames]
    .filter((frame) => Number.isFinite(frame.time) && normalizeSupportedGeometry(frame.geometry))
    .sort((left, right) => left.time - right.time);

  if (frames.length === 0) {
    return null;
  }

  const firstFrameAfterTime = frames.findIndex((frame) => frame.time > time);

  if (firstFrameAfterTime === 0) {
    return null;
  }

  if (firstFrameAfterTime === -1) {
    return frames[frames.length - 1]?.visible === false
      ? null
      : toFeature(track, index, frames[frames.length - 1]!);
  }

  const previousFrame = frames[firstFrameAfterTime - 1]!;

  if (previousFrame.time === time) {
    return previousFrame.visible === false ? null : toFeature(track, index, previousFrame);
  }

  if (previousFrame.visible === false) {
    return null;
  }

  const nextFrame = frames[firstFrameAfterTime]!;
  const progress = (time - previousFrame.time) / (nextFrame.time - previousFrame.time);
  const geometry = interpolateTemporalGeoJsonGeometry(
    previousFrame.geometry,
    nextFrame.geometry,
    progress,
    options,
  );

  if (!geometry) {
    return null;
  }

  return toFeature(track, index, {
    geometry,
    label: previousFrame.label,
    metrics: interpolateMetrics(
      mergeMetrics(track.metrics, previousFrame.metrics),
      mergeMetrics(track.metrics, nextFrame.metrics),
      progress,
    ),
    properties: mergeProperties(track.properties, previousFrame.properties),
    time,
    visible: true,
  });
}

function toFeature<TProperties>(
  track: TemporalGeoJsonTrack<TProperties>,
  index: number,
  frame: TemporalGeoJsonFrame<TProperties>,
): TemporalGeoJsonOutputFeature<TProperties> {
  const trackId = String(track.id ?? index);
  const temporalLabel = frame.label ?? track.label ?? "";
  const metrics = mergeMetrics(track.metrics, frame.metrics);
  const properties = {
    ...(mergeProperties(track.properties, frame.properties) as Record<string, unknown>),
    metrics,
    temporalLabel,
    temporalTrackId: trackId,
  } as TemporalGeoJsonOutputFeature<TProperties>["properties"];

  return {
    geometry: cloneGeometry(frame.geometry),
    id: trackId,
    properties,
    type: "Feature",
  };
}

function interpolateMatchingGeometry(
  previousGeometry: TemporalGeoJsonSupportedGeometry,
  nextGeometry: TemporalGeoJsonSupportedGeometry,
  progress: number,
  options: ResolvedInterpolationOptions,
): TemporalGeoJsonSupportedGeometry | null {
  switch (previousGeometry.type) {
    case "Point":
      return {
        coordinates: interpolatePosition(
          previousGeometry.coordinates,
          (nextGeometry as GeoJsonPointGeometry).coordinates,
          progress,
        ),
        type: "Point",
      };
    case "LineString":
      return interpolateLineStringGeometry(
        previousGeometry,
        nextGeometry as GeoJsonLineStringGeometry,
        progress,
        options,
      );
    case "MultiLineString":
      return interpolateMultiLineStringGeometry(
        previousGeometry,
        nextGeometry as GeoJsonMultiLineStringGeometry,
        progress,
        options,
      );
    case "Polygon":
      return interpolatePolygonGeometry(
        previousGeometry,
        nextGeometry as GeoJsonPolygonGeometry,
        progress,
        options,
      );
    case "MultiPolygon":
      return interpolateMultiPolygonGeometry(
        previousGeometry,
        nextGeometry as GeoJsonMultiPolygonGeometry,
        progress,
        options,
      );
  }
}

function interpolateLineStringGeometry(
  previousGeometry: GeoJsonLineStringGeometry,
  nextGeometry: GeoJsonLineStringGeometry,
  progress: number,
  options: ResolvedInterpolationOptions,
): GeoJsonLineStringGeometry | null {
  const coordinates = interpolateLineCoordinates(
    previousGeometry.coordinates,
    nextGeometry.coordinates,
    progress,
    options,
  );

  return coordinates ? { coordinates, type: "LineString" } : null;
}

function interpolateMultiLineStringGeometry(
  previousGeometry: GeoJsonMultiLineStringGeometry,
  nextGeometry: GeoJsonMultiLineStringGeometry,
  progress: number,
  options: ResolvedInterpolationOptions,
): GeoJsonMultiLineStringGeometry | null {
  if (previousGeometry.coordinates.length !== nextGeometry.coordinates.length) {
    return null;
  }

  const lines = previousGeometry.coordinates.map((line, index) =>
    interpolateLineCoordinates(line, nextGeometry.coordinates[index]!, progress, options),
  );

  if (lines.some((line) => line === null)) {
    return null;
  }

  return {
    coordinates: lines as GeoJsonPosition[][],
    type: "MultiLineString",
  };
}

function interpolatePolygonGeometry(
  previousGeometry: GeoJsonPolygonGeometry,
  nextGeometry: GeoJsonPolygonGeometry,
  progress: number,
  options: ResolvedInterpolationOptions,
): GeoJsonPolygonGeometry | null {
  const coordinates = interpolatePolygonCoordinates(
    previousGeometry.coordinates,
    nextGeometry.coordinates,
    progress,
    options,
  );

  return coordinates ? { coordinates, type: "Polygon" } : null;
}

function interpolateMultiPolygonGeometry(
  previousGeometry: GeoJsonMultiPolygonGeometry,
  nextGeometry: GeoJsonMultiPolygonGeometry,
  progress: number,
  options: ResolvedInterpolationOptions,
): GeoJsonMultiPolygonGeometry | null {
  if (previousGeometry.coordinates.length !== nextGeometry.coordinates.length) {
    return null;
  }

  const polygons = previousGeometry.coordinates.map((polygon, index) =>
    interpolatePolygonCoordinates(polygon, nextGeometry.coordinates[index]!, progress, options),
  );

  if (polygons.some((polygon) => polygon === null)) {
    return null;
  }

  return {
    coordinates: polygons as GeoJsonPosition[][][],
    type: "MultiPolygon",
  };
}

function interpolateLineCoordinates(
  previousCoordinates: GeoJsonPosition[],
  nextCoordinates: GeoJsonPosition[],
  progress: number,
  options: ResolvedInterpolationOptions,
): GeoJsonPosition[] | null {
  if (options.strategy === "compatible") {
    if (previousCoordinates.length !== nextCoordinates.length || previousCoordinates.length < 2) {
      return null;
    }

    return previousCoordinates.map((position, index) =>
      interpolatePosition(position, nextCoordinates[index]!, progress),
    );
  }

  if (options.strategy !== "resample" && options.strategy !== "centroid-radial") {
    return null;
  }

  const coordinateCount = clampInteger(
    Math.max(previousCoordinates.length, nextCoordinates.length, options.minResampleCoordinates, 2),
    2,
    options.maxCoordinatesPerLine,
  );
  const previousLine = resampleLine(previousCoordinates, coordinateCount);
  const nextLine = resampleLine(nextCoordinates, coordinateCount);

  return previousLine.map((position, index) =>
    interpolatePosition(position, nextLine[index]!, progress),
  );
}

function interpolatePolygonCoordinates(
  previousCoordinates: GeoJsonPosition[][],
  nextCoordinates: GeoJsonPosition[][],
  progress: number,
  options: ResolvedInterpolationOptions,
): GeoJsonPosition[][] | null {
  if (previousCoordinates.length !== nextCoordinates.length) {
    return null;
  }

  const rings = previousCoordinates.map((ring, index) => {
    const nextRing = nextCoordinates[index]!;

    if (options.strategy === "compatible") {
      return interpolateCompatibleRing(ring, nextRing, progress);
    }

    if (options.strategy === "resample") {
      return interpolateResampledRing(ring, nextRing, progress, options);
    }

    if (options.strategy === "centroid-radial") {
      return interpolateCentroidRadialRing(ring, nextRing, progress, options);
    }

    return null;
  });

  if (rings.some((ring) => ring === null)) {
    return null;
  }

  return rings as GeoJsonPosition[][];
}

function interpolateCompatibleRing(
  previousRing: GeoJsonPosition[],
  nextRing: GeoJsonPosition[],
  progress: number,
): GeoJsonPosition[] | null {
  const normalizedPreviousRing = normalizeRing(previousRing);
  const normalizedNextRing = normalizeRing(nextRing);

  if (
    !normalizedPreviousRing ||
    !normalizedNextRing ||
    normalizedPreviousRing.length !== normalizedNextRing.length
  ) {
    return null;
  }

  return closeRing(
    normalizedPreviousRing.map((position, index) =>
      interpolatePosition(position, normalizedNextRing[index]!, progress),
    ),
  );
}

function interpolateResampledRing(
  previousRing: GeoJsonPosition[],
  nextRing: GeoJsonPosition[],
  progress: number,
  options: ResolvedInterpolationOptions,
): GeoJsonPosition[] | null {
  const previousOpenRing = getOpenRing(previousRing);
  const nextOpenRing = getOpenRing(nextRing);

  if (!previousOpenRing || !nextOpenRing) {
    return null;
  }

  const orientedNextRing = orientRingLike(nextOpenRing, previousOpenRing);
  const alignedNextRing = alignRingStart(orientedNextRing, previousOpenRing[0]!);
  const coordinateCount = clampInteger(
    Math.max(previousOpenRing.length, alignedNextRing.length, options.minResampleCoordinates, 3),
    3,
    options.maxCoordinatesPerRing,
  );
  const previousSamples = resampleRing(previousOpenRing, coordinateCount);
  const nextSamples = resampleRing(alignedNextRing, coordinateCount);

  return closeRing(
    previousSamples.map((position, index) =>
      interpolatePosition(position, nextSamples[index]!, progress),
    ),
  );
}

function interpolateCentroidRadialRing(
  previousRing: GeoJsonPosition[],
  nextRing: GeoJsonPosition[],
  progress: number,
  options: ResolvedInterpolationOptions,
): GeoJsonPosition[] | null {
  const previousOpenRing = getOpenRing(previousRing);
  const nextOpenRing = getOpenRing(nextRing);

  if (!previousOpenRing || !nextOpenRing) {
    return null;
  }

  const coordinateCount = clampInteger(
    Math.max(previousOpenRing.length, nextOpenRing.length, options.minResampleCoordinates, 3),
    3,
    options.maxCoordinatesPerRing,
  );
  const previousSamples = sampleRingByAngle(previousOpenRing, coordinateCount);
  const nextSamples = sampleRingByAngle(nextOpenRing, coordinateCount);

  return closeRing(
    previousSamples.map((position, index) =>
      interpolatePosition(position, nextSamples[index]!, progress),
    ),
  );
}

function normalizeSupportedGeometry(
  geometry: TemporalGeoJsonGeometryFeature["geometry"],
): TemporalGeoJsonSupportedGeometry | null {
  if (!geometry || !isRecord(geometry)) {
    return null;
  }

  switch (geometry.type) {
    case "Point":
      return normalizePointGeometry(geometry);
    case "LineString":
      return normalizeLineStringGeometry(geometry);
    case "MultiLineString":
      return normalizeMultiLineStringGeometry(geometry);
    case "Polygon":
      return normalizePolygonGeometry(geometry);
    case "MultiPolygon":
      return normalizeMultiPolygonGeometry(geometry);
    default:
      return null;
  }
}

function normalizePointGeometry(geometry: {
  coordinates?: unknown;
  type: string;
}): GeoJsonPointGeometry | null {
  const position = normalizePosition(geometry.coordinates);

  return position ? { coordinates: position, type: "Point" } : null;
}

function normalizeLineStringGeometry(geometry: {
  coordinates?: unknown;
  type: string;
}): GeoJsonLineStringGeometry | null {
  const coordinates = normalizeLineCoordinates(geometry.coordinates);

  return coordinates ? { coordinates, type: "LineString" } : null;
}

function normalizeMultiLineStringGeometry(geometry: {
  coordinates?: unknown;
  type: string;
}): GeoJsonMultiLineStringGeometry | null {
  if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
    return null;
  }

  const lines = geometry.coordinates.map(normalizeLineCoordinates);

  if (lines.some((line) => line === null)) {
    return null;
  }

  return {
    coordinates: lines as GeoJsonPosition[][],
    type: "MultiLineString",
  };
}

function normalizePolygonGeometry(geometry: {
  coordinates?: unknown;
  type: string;
}): GeoJsonPolygonGeometry | null {
  const coordinates = normalizePolygonCoordinates(geometry.coordinates);

  return coordinates ? { coordinates, type: "Polygon" } : null;
}

function normalizeMultiPolygonGeometry(geometry: {
  coordinates?: unknown;
  type: string;
}): GeoJsonMultiPolygonGeometry | null {
  if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
    return null;
  }

  const polygons = geometry.coordinates.map(normalizePolygonCoordinates);

  if (polygons.some((polygon) => polygon === null)) {
    return null;
  }

  return {
    coordinates: polygons as GeoJsonPosition[][][],
    type: "MultiPolygon",
  };
}

function normalizeLineCoordinates(value: unknown): GeoJsonPosition[] | null {
  if (!Array.isArray(value) || value.length < 2) {
    return null;
  }

  const coordinates = value.map(normalizePosition);

  if (coordinates.some((position) => position === null)) {
    return null;
  }

  return coordinates as GeoJsonPosition[];
}

function normalizePolygonCoordinates(value: unknown): GeoJsonPosition[][] | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const rings = value.map(normalizeRing);

  if (rings.some((ring) => ring === null)) {
    return null;
  }

  return rings as GeoJsonPosition[][];
}

function normalizeRing(value: unknown): GeoJsonPosition[] | null {
  if (!Array.isArray(value) || value.length < 3) {
    return null;
  }

  const coordinates = value.map(normalizePosition);

  if (coordinates.some((position) => position === null)) {
    return null;
  }

  const openRing = removeClosingPosition(coordinates as GeoJsonPosition[]);

  if (openRing.length < 3) {
    return null;
  }

  return closeRing(openRing);
}

function normalizePosition(value: unknown): GeoJsonPosition | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const longitude = value[0];
  const latitude = value[1];

  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return null;
  }

  return [longitude, latitude];
}

function readTrackId<TProperties extends Record<string, unknown>, TTrackProperties>(
  feature: TemporalGeoJsonGeometryFeature<TProperties>,
  index: number,
  options: TemporalGeoJsonGeometryTrackOptions<TProperties, TTrackProperties>,
) {
  const customTrackId = options.getTrackId?.(feature, index);

  if (customTrackId !== undefined) {
    return customTrackId;
  }

  if (feature.id !== undefined) {
    return feature.id;
  }

  const propertyTrackId = feature.properties?.trackId;

  return typeof propertyTrackId === "string" || typeof propertyTrackId === "number"
    ? propertyTrackId
    : `feature-${index}`;
}

function readTime<TProperties extends Record<string, unknown>, TTrackProperties>(
  feature: TemporalGeoJsonGeometryFeature<TProperties>,
  index: number,
  options: TemporalGeoJsonGeometryTrackOptions<TProperties, TTrackProperties>,
): unknown {
  const customTime = options.getTime?.(feature, index);

  if (customTime !== undefined) {
    return customTime;
  }

  return feature.properties?.time ?? feature.properties?.timestamp;
}

function readLabel<TProperties extends Record<string, unknown>, TTrackProperties>(
  feature: TemporalGeoJsonGeometryFeature<TProperties>,
  index: number,
  options: TemporalGeoJsonGeometryTrackOptions<TProperties, TTrackProperties>,
  trackId: string | number,
) {
  const customLabel = options.getLabel?.(feature, index);

  if (customLabel !== undefined) {
    return customLabel;
  }

  const propertyLabel = feature.properties?.label;

  return typeof propertyLabel === "string" ? propertyLabel : String(trackId);
}

function readMetrics<TProperties extends Record<string, unknown>, TTrackProperties>(
  feature: TemporalGeoJsonGeometryFeature<TProperties>,
  index: number,
  options: TemporalGeoJsonGeometryTrackOptions<TProperties, TTrackProperties>,
): MapMetricRecord {
  const customMetrics = options.getMetrics?.(feature, index);

  if (customMetrics) {
    return filterFiniteMetrics(customMetrics);
  }

  const metrics: MapMetricRecord = {};
  const rawMetrics = feature.properties?.metrics;

  if (isRecord(rawMetrics)) {
    Object.assign(metrics, filterFiniteMetrics(rawMetrics));
  }

  for (const metricKey of options.metricKeys ?? []) {
    const value = feature.properties?.[metricKey];

    if (typeof value === "number" && Number.isFinite(value)) {
      metrics[metricKey] = value;
    }
  }

  return metrics;
}

function readVisible<TProperties extends Record<string, unknown>, TTrackProperties>(
  feature: TemporalGeoJsonGeometryFeature<TProperties>,
  index: number,
  options: TemporalGeoJsonGeometryTrackOptions<TProperties, TTrackProperties>,
) {
  const customVisible = options.getVisible?.(feature, index);

  if (customVisible !== undefined) {
    return customVisible;
  }

  return feature.properties?.visible !== false;
}

function readProperties<TProperties extends Record<string, unknown>, TTrackProperties>(
  feature: TemporalGeoJsonGeometryFeature<TProperties>,
  index: number,
  options: TemporalGeoJsonGeometryTrackOptions<TProperties, TTrackProperties>,
): TTrackProperties {
  const customProperties = options.getProperties?.(feature, index);

  if (customProperties !== undefined) {
    return customProperties;
  }

  return { ...(feature.properties ?? {}) } as TTrackProperties;
}

function resolveInterpolationOptions(
  options: TemporalGeoJsonInterpolationOptions,
): ResolvedInterpolationOptions {
  return {
    fallback: options.fallback ?? DEFAULT_INTERPOLATION_OPTIONS.fallback,
    maxCoordinatesPerLine: sanitizePositiveInteger(
      options.maxCoordinatesPerLine,
      DEFAULT_INTERPOLATION_OPTIONS.maxCoordinatesPerLine,
    ),
    maxCoordinatesPerRing: sanitizePositiveInteger(
      options.maxCoordinatesPerRing,
      DEFAULT_INTERPOLATION_OPTIONS.maxCoordinatesPerRing,
    ),
    minResampleCoordinates: sanitizePositiveInteger(
      options.minResampleCoordinates,
      DEFAULT_INTERPOLATION_OPTIONS.minResampleCoordinates,
    ),
    strategy: options.strategy ?? DEFAULT_INTERPOLATION_OPTIONS.strategy,
  };
}

function applyInterpolationFallback(
  previousGeometry: TemporalGeoJsonSupportedGeometry,
  options: ResolvedInterpolationOptions,
) {
  return options.fallback === "hide" ? null : cloneGeometry(previousGeometry);
}

function interpolatePosition(
  previousPosition: GeoJsonPosition,
  nextPosition: GeoJsonPosition,
  progress: number,
): GeoJsonPosition {
  return [
    interpolate(previousPosition[0], nextPosition[0], progress),
    interpolate(previousPosition[1], nextPosition[1], progress),
  ];
}

function resampleLine(
  coordinates: readonly GeoJsonPosition[],
  coordinateCount: number,
): GeoJsonPosition[] {
  if (coordinates.length === coordinateCount) {
    return coordinates.map(clonePosition);
  }

  const distances = getCumulativeDistances(coordinates, false);
  const totalDistance = distances.at(-1) ?? 0;

  if (totalDistance === 0) {
    return Array.from({ length: coordinateCount }, () => clonePosition(coordinates[0]!));
  }

  return Array.from({ length: coordinateCount }, (_, index) => {
    if (index === coordinateCount - 1) {
      return clonePosition(coordinates[coordinates.length - 1]!);
    }

    return interpolateAlongPath(
      coordinates,
      distances,
      (totalDistance * index) / (coordinateCount - 1),
      false,
    );
  });
}

function resampleRing(
  openRing: readonly GeoJsonPosition[],
  coordinateCount: number,
): GeoJsonPosition[] {
  const distances = getCumulativeDistances(openRing, true);
  const totalDistance = distances.at(-1) ?? 0;

  if (totalDistance === 0) {
    return Array.from({ length: coordinateCount }, () => clonePosition(openRing[0]!));
  }

  return Array.from({ length: coordinateCount }, (_, index) =>
    interpolateAlongPath(openRing, distances, (totalDistance * index) / coordinateCount, true),
  );
}

function getCumulativeDistances(coordinates: readonly GeoJsonPosition[], closed: boolean) {
  const distances = [0];
  const segmentCount = closed ? coordinates.length : coordinates.length - 1;

  for (let index = 0; index < segmentCount; index += 1) {
    const start = coordinates[index]!;
    const end = coordinates[(index + 1) % coordinates.length]!;

    distances.push(distances[index]! + distance(start, end));
  }

  return distances;
}

function interpolateAlongPath(
  coordinates: readonly GeoJsonPosition[],
  distances: readonly number[],
  targetDistance: number,
  closed: boolean,
): GeoJsonPosition {
  const segmentCount = closed ? coordinates.length : coordinates.length - 1;

  for (let index = 0; index < segmentCount; index += 1) {
    const segmentStartDistance = distances[index]!;
    const segmentEndDistance = distances[index + 1]!;

    if (targetDistance > segmentEndDistance) {
      continue;
    }

    const start = coordinates[index]!;
    const end = coordinates[(index + 1) % coordinates.length]!;
    const segmentLength = segmentEndDistance - segmentStartDistance;
    const progress =
      segmentLength === 0 ? 0 : (targetDistance - segmentStartDistance) / segmentLength;

    return interpolatePosition(start, end, progress);
  }

  return clonePosition(coordinates[coordinates.length - 1]!);
}

function sampleRingByAngle(
  openRing: readonly GeoJsonPosition[],
  coordinateCount: number,
): GeoJsonPosition[] {
  const center = getRingCentroid(openRing);

  return Array.from({ length: coordinateCount }, (_, index) => {
    const angle = (index / coordinateCount) * Math.PI * 2;
    const ray = [Math.cos(angle), Math.sin(angle)] as const;
    let bestDistance = Number.POSITIVE_INFINITY;
    let bestPosition: GeoJsonPosition | null = null;

    for (let ringIndex = 0; ringIndex < openRing.length; ringIndex += 1) {
      const start = openRing[ringIndex]!;
      const end = openRing[(ringIndex + 1) % openRing.length]!;
      const intersection = getRaySegmentIntersection(center, ray, start, end);

      if (!intersection || intersection.distance >= bestDistance) {
        continue;
      }

      bestDistance = intersection.distance;
      bestPosition = intersection.position;
    }

    return bestPosition ?? getNearestPositionByAngle(openRing, center, angle);
  });
}

function getRingCentroid(openRing: readonly GeoJsonPosition[]): GeoJsonPosition {
  try {
    const ring = closeRing(openRing);
    const center = centroid(createTurfPolygon([ring])).geometry.coordinates;

    if (Number.isFinite(center[0]) && Number.isFinite(center[1])) {
      return [center[0], center[1]];
    }
  } catch {
    // Fall through to the deterministic average below.
  }

  const total = openRing.reduce(
    (sum, position) => [sum[0] + position[0], sum[1] + position[1]] as GeoJsonPosition,
    [0, 0],
  );

  return [total[0] / openRing.length, total[1] / openRing.length];
}

function getRaySegmentIntersection(
  origin: GeoJsonPosition,
  ray: readonly [number, number],
  start: GeoJsonPosition,
  end: GeoJsonPosition,
): { distance: number; position: GeoJsonPosition } | null {
  const segment = [end[0] - start[0], end[1] - start[1]] as const;
  const denominator = cross(ray, segment);

  if (Math.abs(denominator) < 1e-12) {
    return null;
  }

  const delta = [start[0] - origin[0], start[1] - origin[1]] as const;
  const rayDistance = cross(delta, segment) / denominator;
  const segmentProgress = cross(delta, ray) / denominator;

  if (rayDistance < 0 || segmentProgress < 0 || segmentProgress > 1) {
    return null;
  }

  return {
    distance: rayDistance,
    position: [origin[0] + ray[0] * rayDistance, origin[1] + ray[1] * rayDistance],
  };
}

function getNearestPositionByAngle(
  coordinates: readonly GeoJsonPosition[],
  center: GeoJsonPosition,
  angle: number,
) {
  let bestPosition = coordinates[0]!;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const position of coordinates) {
    const positionAngle = Math.atan2(position[1] - center[1], position[0] - center[0]);
    const angleDistance = Math.abs(normalizeAngle(positionAngle - angle));

    if (angleDistance >= bestDistance) {
      continue;
    }

    bestDistance = angleDistance;
    bestPosition = position;
  }

  return clonePosition(bestPosition);
}

function orientRingLike(
  ring: readonly GeoJsonPosition[],
  referenceRing: readonly GeoJsonPosition[],
) {
  const normalizedRing = closeRing(ring);
  const normalizedReferenceRing = closeRing(referenceRing);
  const ringIsClockwise = booleanClockwise(normalizedRing);
  const referenceRingIsClockwise = booleanClockwise(normalizedReferenceRing);

  return ringIsClockwise === referenceRingIsClockwise ? [...ring] : [...ring].reverse();
}

function alignRingStart(ring: readonly GeoJsonPosition[], targetPosition: GeoJsonPosition) {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < ring.length; index += 1) {
    const candidateDistance = distance(ring[index]!, targetPosition);

    if (candidateDistance >= bestDistance) {
      continue;
    }

    bestDistance = candidateDistance;
    bestIndex = index;
  }

  return [...ring.slice(bestIndex), ...ring.slice(0, bestIndex)];
}

function getOpenRing(ring: GeoJsonPosition[]) {
  const normalizedRing = normalizeRing(ring);

  return normalizedRing ? removeClosingPosition(normalizedRing) : null;
}

function closeRing(coordinates: readonly GeoJsonPosition[]): GeoJsonPosition[] {
  if (coordinates.length === 0) {
    return [];
  }

  const closed = coordinates.map(clonePosition);

  if (!samePosition(closed[0]!, closed.at(-1)!)) {
    closed.push(clonePosition(closed[0]!));
  }

  return closed;
}

function removeClosingPosition(coordinates: readonly GeoJsonPosition[]) {
  if (coordinates.length >= 2 && samePosition(coordinates[0]!, coordinates.at(-1)!)) {
    return coordinates.slice(0, -1).map(clonePosition);
  }

  return coordinates.map(clonePosition);
}

function cloneGeometry(
  geometry: TemporalGeoJsonSupportedGeometry,
): TemporalGeoJsonSupportedGeometry {
  switch (geometry.type) {
    case "Point":
      return {
        coordinates: clonePosition(geometry.coordinates),
        type: "Point",
      };
    case "LineString":
      return {
        coordinates: geometry.coordinates.map(clonePosition),
        type: "LineString",
      };
    case "MultiLineString":
      return {
        coordinates: geometry.coordinates.map((line) => line.map(clonePosition)),
        type: "MultiLineString",
      };
    case "Polygon":
      return {
        coordinates: geometry.coordinates.map((ring) => ring.map(clonePosition)),
        type: "Polygon",
      };
    case "MultiPolygon":
      return {
        coordinates: geometry.coordinates.map((polygon) =>
          polygon.map((ring) => ring.map(clonePosition)),
        ),
        type: "MultiPolygon",
      };
  }
}

function clonePosition(position: GeoJsonPosition): GeoJsonPosition {
  return [position[0], position[1]];
}

function samePosition(left: GeoJsonPosition, right: GeoJsonPosition) {
  return left[0] === right[0] && left[1] === right[1];
}

function distance(left: GeoJsonPosition, right: GeoJsonPosition) {
  return Math.hypot(right[0] - left[0], right[1] - left[1]);
}

function cross(left: readonly [number, number], right: readonly [number, number]) {
  return left[0] * right[1] - left[1] * right[0];
}

function normalizeAngle(value: number) {
  let angle = value;

  while (angle <= -Math.PI) {
    angle += Math.PI * 2;
  }

  while (angle > Math.PI) {
    angle -= Math.PI * 2;
  }

  return angle;
}

function clampProgress(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

function sanitizePositiveInteger(value: number | undefined, fallback: number) {
  if (!Number.isFinite(value) || (value ?? 0) <= 0) {
    return fallback;
  }

  return Math.floor(value!);
}

function clampInteger(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(Math.floor(value), minimum), maximum);
}
