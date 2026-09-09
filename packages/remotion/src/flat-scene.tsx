import { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

import {
  FlatScene as FlatDesignSceneView,
  sampleFlatSceneAtTime,
  type FlatDesignScene,
  type FlatSceneProps,
} from "@moritzbrantner/flat-design";

export type RemotionFlatScenePlayback = "clamp" | "loop";

export type RemotionFlatSceneTimingProps = {
  durationInFrames?: number;
  fps?: number;
  frame?: number;
  playback?: RemotionFlatScenePlayback;
  timeInMs?: number;
};

export type RemotionFlatSceneTimeAtFrameOptions = {
  durationInFrames: number;
  fps: number;
  frame: number;
  playback?: RemotionFlatScenePlayback;
};

export type UseRemotionFlatSceneOptions = RemotionFlatSceneTimingProps & {
  scene: FlatDesignScene;
};

export type RemotionFlatSceneProps = Omit<FlatSceneProps, "scene"> & UseRemotionFlatSceneOptions;

export function getRemotionFlatSceneTimeAtFrame({
  durationInFrames,
  fps,
  frame,
  playback = "clamp",
}: RemotionFlatSceneTimeAtFrameOptions) {
  const frameCount = Number.isFinite(durationInFrames) ? Math.floor(durationInFrames) : 1;
  const framesPerSecond = Number.isFinite(fps) && fps > 0 ? fps : 30;

  if (!Number.isFinite(frame) || frameCount <= 1) {
    return 0;
  }

  const durationInMs = (frameCount / framesPerSecond) * 1_000;

  if (playback === "loop") {
    const loopedFrame = modulo(frame, frameCount);
    const progress = loopedFrame / frameCount;

    return durationInMs * progress;
  }

  const clampedFrame = clamp(frame, 0, frameCount - 1);
  const progress = clampedFrame / (frameCount - 1);

  return durationInMs * progress;
}

export function useRemotionFlatScene({
  durationInFrames,
  fps,
  frame,
  playback = "clamp",
  scene,
  timeInMs,
}: UseRemotionFlatSceneOptions) {
  const composition = useVideoConfig();
  const currentFrame = useCurrentFrame();
  const resolvedDurationInFrames = durationInFrames ?? composition.durationInFrames;
  const resolvedFps = fps ?? composition.fps;
  const resolvedFrame = frame ?? currentFrame;
  const resolvedTimeInMs =
    timeInMs ??
    getRemotionFlatSceneTimeAtFrame({
      durationInFrames: resolvedDurationInFrames,
      fps: resolvedFps,
      frame: resolvedFrame,
      playback,
    });

  return useMemo(() => sampleFlatSceneAtTime(scene, resolvedTimeInMs), [resolvedTimeInMs, scene]);
}

export function RemotionFlatScene({
  scene,
  durationInFrames,
  fps,
  frame,
  playback = "clamp",
  timeInMs,
  ...sceneProps
}: RemotionFlatSceneProps) {
  const sampledScene = useRemotionFlatScene({
    durationInFrames,
    fps,
    frame,
    playback,
    scene,
    timeInMs,
  });

  return <FlatDesignSceneView {...sceneProps} scene={sampledScene} />;
}

// Preserve the existing Remotion package export while keeping evaluator ownership
// in @moritzbrantner/flat-design.
export { sampleFlatSceneAtTime };

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function modulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}
