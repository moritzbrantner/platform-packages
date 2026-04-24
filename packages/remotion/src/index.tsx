"use client";

import { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

import {
  ClusteredMap,
  HeatMap,
  getTemporalHeatMapMaxWeight,
  getTemporalMapPointsAtTime,
  getTemporalMapTimeRange,
  snapTemporalMapTime,
  type ClusteredMapProps,
  type HeatMapProps,
  type TemporalMapTimeRange,
  type TemporalMapTrack,
} from "@moritzbrantner/maps";

export type RemotionMapPlayback = "clamp" | "loop";

export type RemotionMapTimingProps = {
  durationInFrames?: number;
  endTime?: number;
  frame?: number;
  playback?: RemotionMapPlayback;
  startTime?: number;
  timeRange?: TemporalMapTimeRange;
  timeStep?: number | "any";
};

export type RemotionMapTimeAtFrameOptions = {
  durationInFrames: number;
  frame: number;
  playback?: RemotionMapPlayback;
  timeRange: TemporalMapTimeRange;
};

export type UseRemotionMapTimeOptions<TProperties = Record<string, unknown>> =
  RemotionMapTimingProps & {
    tracks: readonly TemporalMapTrack<TProperties>[];
  };

export type RemotionClusteredMapProps<TProperties = Record<string, unknown>> = Omit<
  ClusteredMapProps<TProperties>,
  "points"
> &
  RemotionMapTimingProps & {
    tracks: readonly TemporalMapTrack<TProperties>[];
  };

export type RemotionHeatMapProps<TProperties = Record<string, unknown>> = Omit<
  HeatMapProps<TProperties>,
  "points"
> &
  RemotionMapTimingProps & {
    preserveTemporalScale?: boolean;
    tracks: readonly TemporalMapTrack<TProperties>[];
  };

export function getRemotionMapTimeAtFrame({
  durationInFrames,
  frame,
  playback = "clamp",
  timeRange,
}: RemotionMapTimeAtFrameOptions) {
  const frameCount = Number.isFinite(durationInFrames) ? Math.floor(durationInFrames) : 1;

  if (!Number.isFinite(frame) || frameCount <= 1 || timeRange.end === timeRange.start) {
    return timeRange.start;
  }

  const span = timeRange.end - timeRange.start;

  if (playback === "loop") {
    const loopedFrame = modulo(frame, frameCount);
    const progress = loopedFrame / frameCount;

    return timeRange.start + span * progress;
  }

  const clampedFrame = clamp(frame, 0, frameCount - 1);
  const progress = clampedFrame / (frameCount - 1);

  return timeRange.start + span * progress;
}

export function useRemotionMapTime<TProperties = Record<string, unknown>>({
  durationInFrames,
  endTime,
  frame,
  playback = "clamp",
  startTime,
  timeRange,
  timeStep = "any",
  tracks,
}: UseRemotionMapTimeOptions<TProperties>) {
  const composition = useVideoConfig();
  const currentFrame = useCurrentFrame();
  const resolvedDurationInFrames = durationInFrames ?? composition.durationInFrames;
  const resolvedFrame = frame ?? currentFrame;
  const trackTimeRange = useMemo(() => getTemporalMapTimeRange(tracks), [tracks]);
  const resolvedTimeRange = useMemo(
    () =>
      resolveRemotionMapTimeRange({
        endTime,
        startTime,
        timeRange,
        trackTimeRange,
      }),
    [endTime, startTime, timeRange, trackTimeRange],
  );

  return useMemo(() => {
    if (!resolvedTimeRange) {
      return 0;
    }

    const resolvedTime = getRemotionMapTimeAtFrame({
      durationInFrames: resolvedDurationInFrames,
      frame: resolvedFrame,
      playback,
      timeRange: resolvedTimeRange,
    });

    return snapTemporalMapTime(resolvedTime, resolvedTimeRange, timeStep);
  }, [playback, resolvedDurationInFrames, resolvedFrame, resolvedTimeRange, timeStep]);
}

export function RemotionClusteredMap<TProperties = Record<string, unknown>>({
  durationInFrames,
  endTime,
  frame,
  playback = "clamp",
  startTime,
  timeRange,
  timeStep = "any",
  tracks,
  ...mapProps
}: RemotionClusteredMapProps<TProperties>) {
  const activeTime = useRemotionMapTime({
    durationInFrames,
    endTime,
    frame,
    playback,
    startTime,
    timeRange,
    timeStep,
    tracks,
  });
  const points = useMemo(() => getTemporalMapPointsAtTime(tracks, activeTime), [activeTime, tracks]);

  return <ClusteredMap {...mapProps} points={points} />;
}

export function RemotionHeatMap<TProperties = Record<string, unknown>>({
  durationInFrames,
  endTime,
  filterPoint,
  frame,
  getWeight,
  maxWeight,
  playback = "clamp",
  preserveTemporalScale = true,
  startTime,
  timeRange,
  timeStep = "any",
  tracks,
  weightMetric,
  ...mapProps
}: RemotionHeatMapProps<TProperties>) {
  const activeTime = useRemotionMapTime({
    durationInFrames,
    endTime,
    frame,
    playback,
    startTime,
    timeRange,
    timeStep,
    tracks,
  });
  const points = useMemo(() => getTemporalMapPointsAtTime(tracks, activeTime), [activeTime, tracks]);
  const temporalMaxWeight = useMemo(() => {
    if (!preserveTemporalScale || maxWeight !== undefined) {
      return undefined;
    }

    return getTemporalHeatMapMaxWeight(tracks, {
      filterPoint,
      getWeight,
      weightMetric,
    });
  }, [filterPoint, getWeight, maxWeight, preserveTemporalScale, tracks, weightMetric]);

  return (
    <HeatMap
      {...mapProps}
      filterPoint={filterPoint}
      getWeight={getWeight}
      maxWeight={maxWeight ?? temporalMaxWeight}
      points={points}
      weightMetric={weightMetric}
    />
  );
}

function resolveRemotionMapTimeRange({
  endTime,
  startTime,
  timeRange,
  trackTimeRange,
}: {
  endTime: number | undefined;
  startTime: number | undefined;
  timeRange: TemporalMapTimeRange | undefined;
  trackTimeRange: TemporalMapTimeRange | null;
}): TemporalMapTimeRange | null {
  const resolvedStart = startTime ?? timeRange?.start ?? trackTimeRange?.start;
  const resolvedEnd = endTime ?? timeRange?.end ?? trackTimeRange?.end;

  if (
    typeof resolvedStart !== "number" ||
    !Number.isFinite(resolvedStart) ||
    typeof resolvedEnd !== "number" ||
    !Number.isFinite(resolvedEnd)
  ) {
    return null;
  }

  return {
    end: Math.max(resolvedStart, resolvedEnd),
    start: Math.min(resolvedStart, resolvedEnd),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function modulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}

export type { TemporalMapTimeRange, TemporalMapTrack };
export {
  RemotionFlatScene,
  getRemotionFlatSceneTimeAtFrame,
  sampleFlatSceneAtTime,
  useRemotionFlatScene,
  type RemotionFlatScenePlayback,
  type RemotionFlatSceneProps,
  type RemotionFlatSceneTimeAtFrameOptions,
  type RemotionFlatSceneTimingProps,
  type UseRemotionFlatSceneOptions,
} from "./flat-scene";
