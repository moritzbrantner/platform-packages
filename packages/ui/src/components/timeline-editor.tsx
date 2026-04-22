"use client";

import * as React from "react";

import { cn } from "../lib/cn";

type TimelineEditorClip = {
  id: string;
  label: string;
  start: number;
  end: number;
  color?: string;
  disabled?: boolean;
  metadata?: Record<string, unknown>;
};

type TimelineEditorTrack = {
  id: string;
  label: string;
  clips: TimelineEditorClip[];
  locked?: boolean;
  height?: number;
};

type TimelineEditorMarker = {
  id: string;
  time: number;
  label?: string;
  color?: string;
};

type TimelineEditorHotkeyMap = {
  nudgeLeft?: string;
  nudgeRight?: string;
  delete?: string;
  selectAll?: string;
};

type TimelineEditorProps = Omit<React.ComponentProps<"div">, "onChange"> & {
  tracks: TimelineEditorTrack[];
  duration: number;
  currentTime?: number;
  onCurrentTimeChange?: (time: number) => void;
  onTracksChange?: (tracks: TimelineEditorTrack[]) => void;
  selectedClipId?: string | null;
  onSelectedClipChange?: (clipId: string | null, clip?: TimelineEditorClip) => void;
  onClipDelete?: (clipId: string) => void;
  markers?: TimelineEditorMarker[];
  snapInterval?: number;
  pixelsPerSecond?: number;
  readOnly?: boolean;
  hotkeys?: TimelineEditorHotkeyMap;
};

type TimelineDragState =
  | {
      type: "move";
      clipId: string;
      startX: number;
      originalStart: number;
      originalEnd: number;
    }
  | {
      type: "resize-start" | "resize-end";
      clipId: string;
      startX: number;
      originalStart: number;
      originalEnd: number;
    }
  | null;

const defaultHotkeys: Required<TimelineEditorHotkeyMap> = {
  nudgeLeft: "ArrowLeft",
  nudgeRight: "ArrowRight",
  delete: "Delete",
  selectAll: "a",
};

function formatTimelineEditorTime(value: number) {
  const totalSeconds = Math.max(0, value);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const frames = Math.round((totalSeconds - Math.floor(totalSeconds)) * 10);

  return `${minutes}:${seconds.toString().padStart(2, "0")}.${frames}`;
}

function getTimelineEditorTicks(duration: number, interval = 1) {
  const safeDuration = Math.max(0, duration);
  const safeInterval = Math.max(0.01, interval);
  const ticks: Array<{ time: number; label: string; major: boolean }> = [];

  for (let time = 0; time <= safeDuration + 0.0001; time += safeInterval) {
    const normalized = Number(time.toFixed(4));
    ticks.push({
      time: normalized,
      label: formatTimelineEditorTime(normalized),
      major: Math.round(normalized / safeInterval) % 5 === 0,
    });
  }

  return ticks;
}

function normalizeTimelineEditorTracks(
  tracks: TimelineEditorTrack[],
  options: { duration?: number; snapInterval?: number } = {},
) {
  const duration = options.duration ?? Number.POSITIVE_INFINITY;
  return tracks.map((track) => ({
    ...track,
    clips: track.clips
      .map((clip) => {
        const start = clampTime(snapTime(clip.start, options.snapInterval), 0, duration);
        const end = clampTime(snapTime(clip.end, options.snapInterval), start + 0.01, duration);
        return { ...clip, start, end };
      })
      .sort((left, right) => left.start - right.start),
  }));
}

function moveTimelineEditorClip(
  tracks: TimelineEditorTrack[],
  clipId: string,
  nextStart: number,
  options: { duration?: number; snapInterval?: number } = {},
) {
  const duration = options.duration ?? Number.POSITIVE_INFINITY;

  return tracks.map((track) => ({
    ...track,
    clips: track.clips.map((clip) => {
      if (clip.id !== clipId) {
        return clip;
      }
      const clipDuration = clip.end - clip.start;
      const start = clampTime(snapTime(nextStart, options.snapInterval), 0, duration - clipDuration);
      return { ...clip, start, end: start + clipDuration };
    }),
  }));
}

function resizeTimelineEditorClip(
  tracks: TimelineEditorTrack[],
  clipId: string,
  edge: "start" | "end",
  nextTime: number,
  options: { duration?: number; minDuration?: number; snapInterval?: number } = {},
) {
  const duration = options.duration ?? Number.POSITIVE_INFINITY;
  const minDuration = options.minDuration ?? 0.1;

  return tracks.map((track) => ({
    ...track,
    clips: track.clips.map((clip) => {
      if (clip.id !== clipId) {
        return clip;
      }

      const time = snapTime(nextTime, options.snapInterval);
      if (edge === "start") {
        return { ...clip, start: clampTime(time, 0, clip.end - minDuration) };
      }

      return { ...clip, end: clampTime(time, clip.start + minDuration, duration) };
    }),
  }));
}

function TimelineEditor({
  tracks,
  duration,
  currentTime = 0,
  onCurrentTimeChange,
  onTracksChange,
  selectedClipId,
  onSelectedClipChange,
  onClipDelete,
  markers = [],
  snapInterval = 0.25,
  pixelsPerSecond = 72,
  readOnly = false,
  hotkeys,
  className,
  ...props
}: TimelineEditorProps) {
  const [internalSelectedClipId, setInternalSelectedClipId] = React.useState<string | null>(null);
  const [dragState, setDragState] = React.useState<TimelineDragState>(null);
  const mergedHotkeys = { ...defaultHotkeys, ...hotkeys };
  const selection = selectedClipId ?? internalSelectedClipId;
  const totalWidth = Math.max(duration * pixelsPerSecond, 640);
  const normalizedTracks = React.useMemo(
    () => normalizeTimelineEditorTracks(tracks, { duration, snapInterval }),
    [duration, snapInterval, tracks],
  );
  const ticks = React.useMemo(
    () => getTimelineEditorTicks(duration, chooseTickInterval(duration)),
    [duration],
  );
  const selectedClip = findTimelineClip(normalizedTracks, selection);

  const commitSelection = (clipId: string | null) => {
    const clip = findTimelineClip(normalizedTracks, clipId);
    setInternalSelectedClipId(clipId);
    onSelectedClipChange?.(clipId, clip);
  };

  const handleRulerPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const time = getTimelineTimeFromPointer(event, totalWidth, duration);
    onCurrentTimeChange?.(snapTime(time, snapInterval));
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState || readOnly) {
      return;
    }

    if (dragState.type === "move") {
      const clientX = getPointerClientX(event) ?? dragState.startX;
      onTracksChange?.(
        moveTimelineEditorClip(
          normalizedTracks,
          dragState.clipId,
          dragState.originalStart + (clientX - dragState.startX) / pixelsPerSecond,
          {
            duration,
            snapInterval,
          },
        ),
      );
      return;
    }

    const clientX = getPointerClientX(event) ?? dragState.startX;
    onTracksChange?.(
      resizeTimelineEditorClip(
        normalizedTracks,
        dragState.clipId,
        dragState.type === "resize-start" ? "start" : "end",
        (dragState.type === "resize-start" ? dragState.originalStart : dragState.originalEnd) +
          (clientX - dragState.startX) / pixelsPerSecond,
        { duration, snapInterval },
      ),
    );
  };

  const handlePointerUp = () => {
    setDragState(null);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!selection || readOnly) {
      return;
    }

    if (event.key === mergedHotkeys.delete || event.key === "Backspace") {
      event.preventDefault();
      onClipDelete?.(selection);
      return;
    }

    if (event.key === mergedHotkeys.nudgeLeft || event.key === mergedHotkeys.nudgeRight) {
      event.preventDefault();
      const clip = findTimelineClip(normalizedTracks, selection);
      if (!clip) {
        return;
      }
      const direction = event.key === mergedHotkeys.nudgeLeft ? -1 : 1;
      onTracksChange?.(
        moveTimelineEditorClip(normalizedTracks, selection, clip.start + direction * snapInterval, {
          duration,
          snapInterval,
        }),
      );
    }
  };

  return (
    <div
      data-slot="timeline-editor"
      data-read-only={readOnly ? "true" : undefined}
      className={cn("overflow-x-auto rounded-md border bg-card text-card-foreground", className)}
      tabIndex={0}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      {...props}
    >
      <div style={{ width: totalWidth }} className="relative">
        <div
          data-slot="timeline-editor-ruler"
          className="relative h-10 border-b bg-muted/40"
          onPointerDown={handleRulerPointerDown}
        >
          {ticks.map((tick) => (
            <div
              key={tick.time}
              className="absolute top-0 h-full border-l border-border"
              style={{ left: `${(tick.time / duration) * 100}%` }}
            >
              {tick.major ? (
                <span className="ml-1 text-[10px] text-muted-foreground">{tick.label}</span>
              ) : null}
            </div>
          ))}
          {markers.map((marker) => (
            <div
              key={marker.id}
              data-slot="timeline-editor-marker"
              className="absolute top-0 h-full border-l-2"
              style={{
                left: `${(marker.time / duration) * 100}%`,
                borderColor: marker.color ?? "var(--primary)",
              }}
              title={marker.label}
            />
          ))}
        </div>
        <div
          data-slot="timeline-editor-playhead"
          className="pointer-events-none absolute top-0 bottom-0 z-20 w-px bg-primary"
          style={{ left: `${(clampTime(currentTime, 0, duration) / duration) * 100}%` }}
        />
        <div data-slot="timeline-editor-tracks" className="divide-y">
          {normalizedTracks.map((track) => (
            <div
              key={track.id}
              data-slot="timeline-editor-track"
              className="grid grid-cols-[9rem_minmax(0,1fr)]"
              style={{ minHeight: track.height ?? 56 }}
            >
              <div className="flex items-center border-r bg-muted/20 px-3 text-sm font-medium">
                <span className="truncate">{track.label}</span>
              </div>
              <div className="relative">
                {track.clips.map((clip) => {
                  const selected = clip.id === selection;
                  return (
                    <div
                      key={clip.id}
                      data-slot="timeline-editor-clip"
                      data-selected={selected ? "true" : undefined}
                      role="button"
                      tabIndex={-1}
                      aria-pressed={selected}
                      className={cn(
                        "absolute top-2 bottom-2 flex min-w-8 cursor-grab items-center rounded-md border px-2 text-xs font-medium text-white shadow-sm outline-none data-[selected=true]:ring-2 data-[selected=true]:ring-ring",
                        clip.disabled && "cursor-not-allowed opacity-60",
                        readOnly && "cursor-default",
                      )}
                      style={{
                        left: `${(clip.start / duration) * 100}%`,
                        width: `${((clip.end - clip.start) / duration) * 100}%`,
                        backgroundColor: clip.color ?? "var(--primary)",
                      }}
                      onPointerDown={(event) => {
                        if (readOnly || clip.disabled || track.locked) {
                          return;
                        }
                        event.stopPropagation();
                        commitSelection(clip.id);
                        setDragState({
                          type: "move",
                          clipId: clip.id,
                          startX: getPointerClientX(event) ?? 0,
                          originalStart: clip.start,
                          originalEnd: clip.end,
                        });
                      }}
                    >
                      <span
                        aria-hidden="true"
                        data-slot="timeline-editor-resize-start"
                        className="absolute inset-y-1 left-0 w-2 cursor-ew-resize rounded-l-md bg-white/25"
                        onPointerDown={(event) => {
                          if (readOnly || clip.disabled || track.locked) {
                            return;
                          }
                          event.stopPropagation();
                          commitSelection(clip.id);
                          setDragState({
                            type: "resize-start",
                            clipId: clip.id,
                            startX: getPointerClientX(event) ?? 0,
                            originalStart: clip.start,
                            originalEnd: clip.end,
                          });
                        }}
                      />
                      <span className="truncate">{clip.label}</span>
                      <span
                        aria-hidden="true"
                        data-slot="timeline-editor-resize-end"
                        className="absolute inset-y-1 right-0 w-2 cursor-ew-resize rounded-r-md bg-white/25"
                        onPointerDown={(event) => {
                          if (readOnly || clip.disabled || track.locked) {
                            return;
                          }
                          event.stopPropagation();
                          commitSelection(clip.id);
                          setDragState({
                            type: "resize-end",
                            clipId: clip.id,
                            startX: getPointerClientX(event) ?? 0,
                            originalStart: clip.start,
                            originalEnd: clip.end,
                          });
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only" aria-live="polite">
        {selectedClip ? `${selectedClip.label} selected` : "No clip selected"}
      </span>
    </div>
  );
}

function findTimelineClip(tracks: TimelineEditorTrack[], clipId?: string | null) {
  if (!clipId) {
    return undefined;
  }
  for (const track of tracks) {
    const clip = track.clips.find((item) => item.id === clipId);
    if (clip) {
      return clip;
    }
  }
  return undefined;
}

function getTimelineTimeFromPointer(
  event: React.PointerEvent<HTMLElement>,
  totalWidth: number,
  duration: number,
) {
  const rect = event.currentTarget.getBoundingClientRect();
  const width = rect.width || totalWidth;
  const clientX = getPointerClientX(event) ?? rect.left;
  const x = clampTime(clientX - rect.left, 0, width);
  return (x / width) * duration;
}

function getPointerClientX(event: React.PointerEvent<HTMLElement>) {
  const nativeEvent = event.nativeEvent as PointerEvent & {
    pageX?: number;
    x?: number;
    offsetX?: number;
  };
  const candidates = [nativeEvent.clientX, nativeEvent.pageX, nativeEvent.x, event.clientX];
  return candidates.find((value) => typeof value === "number" && Number.isFinite(value));
}

function chooseTickInterval(duration: number) {
  if (duration <= 10) {
    return 0.5;
  }
  if (duration <= 60) {
    return 1;
  }
  return 5;
}

function snapTime(value: number, interval?: number) {
  if (!interval || interval <= 0) {
    return value;
  }
  return Number((Math.round(value / interval) * interval).toFixed(4));
}

function clampTime(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export {
  TimelineEditor,
  formatTimelineEditorTime,
  getTimelineEditorTicks,
  moveTimelineEditorClip,
  normalizeTimelineEditorTracks,
  resizeTimelineEditorClip,
};
export type {
  TimelineEditorClip,
  TimelineEditorHotkeyMap,
  TimelineEditorMarker,
  TimelineEditorProps,
  TimelineEditorTrack,
};
