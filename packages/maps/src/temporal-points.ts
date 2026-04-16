import type { MapMetricRecord, MapPoint } from "./aggregation";

export type TemporalMapKeyframe<TProperties = Record<string, unknown>> = {
  latitude: number;
  longitude: number;
  label?: string;
  metrics?: MapMetricRecord;
  properties?: TProperties;
  time: number;
  visible?: boolean;
};

export type TemporalMapTrack<TProperties = Record<string, unknown>> = {
  id?: string | number;
  label?: string;
  metrics?: MapMetricRecord;
  properties?: TProperties;
  frames: readonly TemporalMapKeyframe<TProperties>[];
};

export type TemporalMapTimeRange = {
  end: number;
  start: number;
};

export function snapTemporalMapTime(
  time: number,
  timeRange: TemporalMapTimeRange,
  step: number | "any" | undefined,
) {
  if (step === "any" || !Number.isFinite(step) || (step ?? 0) <= 0) {
    return clampTemporalMapTime(time, timeRange);
  }

  const numericStep = Number(step);
  const clampedTime = clampTemporalMapTime(time, timeRange);

  if (clampedTime === timeRange.end) {
    return timeRange.end;
  }

  const stepOffset = clampedTime - timeRange.start;
  const snappedTime = timeRange.start + Math.floor(stepOffset / numericStep) * numericStep;

  return clampTemporalMapTime(snappedTime, timeRange);
}

export function getTemporalMapTimeRange<TProperties = Record<string, unknown>>(
  tracks: readonly TemporalMapTrack<TProperties>[],
): TemporalMapTimeRange | null {
  let start = Number.POSITIVE_INFINITY;
  let end = Number.NEGATIVE_INFINITY;

  for (const track of tracks) {
    for (const frame of track.frames) {
      if (!Number.isFinite(frame.time)) {
        continue;
      }

      start = Math.min(start, frame.time);
      end = Math.max(end, frame.time);
    }
  }

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return null;
  }

  return { end, start };
}

export function getTemporalMapPointsAtTime<TProperties = Record<string, unknown>>(
  tracks: readonly TemporalMapTrack<TProperties>[],
  time: number,
): Array<MapPoint<TProperties>> {
  if (!Number.isFinite(time)) {
    return [];
  }

  return tracks
    .map((track, index) => resolveTrackAtTime(track, index, time))
    .filter((point): point is MapPoint<TProperties> => point !== null);
}

function clampTemporalMapTime(time: number, timeRange: TemporalMapTimeRange) {
  if (!Number.isFinite(time)) {
    return timeRange.start;
  }

  return Math.min(Math.max(time, timeRange.start), timeRange.end);
}

function resolveTrackAtTime<TProperties>(
  track: TemporalMapTrack<TProperties>,
  index: number,
  time: number,
): MapPoint<TProperties> | null {
  const frames = [...track.frames]
    .filter((frame) =>
      Number.isFinite(frame.time) &&
      Number.isFinite(frame.latitude) &&
      Number.isFinite(frame.longitude),
    )
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
      : toMapPoint(track, index, frames[frames.length - 1]!);
  }

  const previousFrame = frames[firstFrameAfterTime - 1]!;

  if (previousFrame.time === time) {
    return previousFrame.visible === false
      ? null
      : toMapPoint(track, index, previousFrame);
  }

  if (previousFrame.visible === false) {
    return null;
  }

  const nextFrame = frames[firstFrameAfterTime]!;
  const progress = (time - previousFrame.time) / (nextFrame.time - previousFrame.time);

  return {
    id: String(track.id ?? index),
    label: previousFrame.label ?? track.label ?? "",
    latitude: interpolate(previousFrame.latitude, nextFrame.latitude, progress),
    longitude: interpolate(previousFrame.longitude, nextFrame.longitude, progress),
    metrics: interpolateMetrics(
      mergeMetrics(track.metrics, previousFrame.metrics),
      mergeMetrics(track.metrics, nextFrame.metrics),
      progress,
    ),
    properties: mergeProperties(track.properties, previousFrame.properties),
  };
}

function toMapPoint<TProperties>(
  track: TemporalMapTrack<TProperties>,
  index: number,
  frame: TemporalMapKeyframe<TProperties>,
): MapPoint<TProperties> {
  return {
    id: String(track.id ?? index),
    label: frame.label ?? track.label ?? "",
    latitude: frame.latitude,
    longitude: frame.longitude,
    metrics: mergeMetrics(track.metrics, frame.metrics),
    properties: mergeProperties(track.properties, frame.properties),
  };
}

function interpolate(left: number, right: number, progress: number) {
  return left + (right - left) * progress;
}

function interpolateMetrics(
  previousMetrics: MapMetricRecord,
  nextMetrics: MapMetricRecord,
  progress: number,
): MapMetricRecord {
  const keys = new Set([...Object.keys(previousMetrics), ...Object.keys(nextMetrics)]);

  return Object.fromEntries(
    [...keys].map((key) => [
      key,
      interpolate(previousMetrics[key] ?? 0, nextMetrics[key] ?? 0, progress),
    ]),
  );
}

function mergeMetrics(
  baseMetrics: MapMetricRecord | undefined,
  frameMetrics: MapMetricRecord | undefined,
): MapMetricRecord {
  return {
    ...(baseMetrics ?? {}),
    ...(frameMetrics ?? {}),
  };
}

function mergeProperties<TProperties>(
  baseProperties: TProperties | undefined,
  frameProperties: TProperties | undefined,
): TProperties {
  return {
    ...(baseProperties as Record<string, unknown> | undefined),
    ...(frameProperties as Record<string, unknown> | undefined),
  } as TProperties;
}
