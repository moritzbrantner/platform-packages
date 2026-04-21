"use client";

import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn } from "@moritzbrantner/ui";

import {
  canPlaceClipOnTrack,
  defaultMinClipDurationMs,
  findTimelineClip,
  formatTimelineTime,
  getClipEndMs,
  getTimelineDurationMs,
  getTimelineTicks,
  moveTimelineClip,
  resizeTimelineClip,
  snapTimelineTime,
  type MediaTimelineClip,
  type MediaTimelineTrack,
} from "./core";

export type MediaTimelineDropDetail = {
  trackId: string;
  timeMs: number;
  nativeEvent: React.DragEvent<HTMLDivElement>;
};

export type MediaTimelineHotkeyAction =
  | "delete-selected"
  | "move-selected-down"
  | "move-selected-up"
  | "nudge-selected-left"
  | "nudge-selected-right"
  | "seek-backward"
  | "seek-end"
  | "seek-forward"
  | "seek-start"
  | "select-next-clip"
  | "select-previous-clip"
  | "toggle-playback"
  | "trim-selected-end-left"
  | "trim-selected-end-right"
  | "trim-selected-start-left"
  | "trim-selected-start-right";

export type MediaTimelineHotkeyMap = Partial<
  Record<MediaTimelineHotkeyAction, string | string[]>
>;

export type MediaTimelineProps = {
  tracks: MediaTimelineTrack[];
  durationMs?: number;
  currentTimeMs?: number;
  pixelsPerSecond?: number;
  selectedClipId?: string;
  snapMs?: number;
  minClipDurationMs?: number;
  hotkeys?: MediaTimelineHotkeyMap;
  hotkeyNudgeMs?: number;
  hotkeySeekMs?: number;
  readOnly?: boolean;
  className?: string;
  onTracksChange?: (tracks: MediaTimelineTrack[]) => void;
  onCurrentTimeChange?: (timeMs: number) => void;
  onSelectedClipChange?: (clipId: string | undefined) => void;
  onPlaybackToggle?: () => void;
  onTimelineDrop?: (detail: MediaTimelineDropDetail) => void;
};

type DragState =
  | {
      operation: "move" | "trim-start" | "trim-end";
      clipId: string;
      originClientX: number;
      originStartMs: number;
      originDurationMs: number;
      originTrackId: string;
      originTracks: MediaTimelineTrack[];
    }
  | {
      operation: "scrub";
    };

const defaultTrackHeight = 72;
const rulerHeight = 36;
const timelinePaddingPx = 24;
const clipKindColor: Record<MediaTimelineClip["kind"], string> = {
  audio: "#15803d",
  video: "#2563eb",
  image: "#7c3aed",
  text: "#b45309",
};

export const defaultMediaTimelineHotkeys = {
  "delete-selected": ["Backspace", "Delete"],
  "move-selected-down": "ArrowDown",
  "move-selected-up": "ArrowUp",
  "nudge-selected-left": "ArrowLeft",
  "nudge-selected-right": "ArrowRight",
  "seek-backward": "Shift+ArrowLeft",
  "seek-end": "End",
  "seek-forward": "Shift+ArrowRight",
  "seek-start": "Home",
  "select-next-clip": "]",
  "select-previous-clip": "[",
  "toggle-playback": "Space",
  "trim-selected-end-left": "Alt+Shift+ArrowLeft",
  "trim-selected-end-right": "Alt+Shift+ArrowRight",
  "trim-selected-start-left": "Alt+ArrowLeft",
  "trim-selected-start-right": "Alt+ArrowRight",
} satisfies MediaTimelineHotkeyMap;

export function MediaTimeline({
  tracks,
  durationMs: durationMsProp,
  currentTimeMs = 0,
  pixelsPerSecond = 80,
  selectedClipId,
  snapMs = 100,
  minClipDurationMs = defaultMinClipDurationMs,
  hotkeys = defaultMediaTimelineHotkeys,
  hotkeyNudgeMs,
  hotkeySeekMs = 1_000,
  readOnly = false,
  className,
  onTracksChange,
  onCurrentTimeChange,
  onSelectedClipChange,
  onPlaybackToggle,
  onTimelineDrop,
}: MediaTimelineProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const trackRefs = useRef(new Map<string, HTMLDivElement>());
  const dragStateRef = useRef<DragState | undefined>(undefined);
  const [activeDragClipId, setActiveDragClipId] = useState<string | undefined>();
  const durationMs = durationMsProp ?? getTimelineDurationMs(tracks, 30_000);
  const safePixelsPerSecond = Math.max(24, pixelsPerSecond);
  const timelineWidth = Math.max(720, (durationMs / 1_000) * safePixelsPerSecond + timelinePaddingPx);
  const ticks = useMemo(
    () => getTimelineTicks(durationMs, safePixelsPerSecond),
    [durationMs, safePixelsPerSecond],
  );
  const selectedClip = selectedClipId ? findTimelineClip(tracks, selectedClipId)?.clip : undefined;
  const hotkeyEntries = useMemo(() => normalizeHotkeyMap(hotkeys), [hotkeys]);
  const clipStepMs = hotkeyNudgeMs ?? snapMs;
  const orderedClips = useMemo(
    () =>
      tracks
        .flatMap((track, trackIndex) =>
          track.clips.map((clip) => ({
            clip,
            trackIndex,
          })),
        )
        .sort(
          (left, right) =>
            left.clip.startMs - right.clip.startMs ||
            left.trackIndex - right.trackIndex ||
            left.clip.id.localeCompare(right.clip.id),
        )
        .map((item) => item.clip),
    [tracks],
  );

  const setTrackRef = useCallback((trackId: string, element: HTMLDivElement | null) => {
    if (element) {
      trackRefs.current.set(trackId, element);
      return;
    }

    trackRefs.current.delete(trackId);
  }, []);

  const msToPx = useCallback(
    (timeMs: number) => (timeMs / 1_000) * safePixelsPerSecond,
    [safePixelsPerSecond],
  );

  const clientXToTimeMs = useCallback(
    (clientX: number) => {
      const scrollElement = scrollRef.current;

      if (!scrollElement) {
        return 0;
      }

      const rect = scrollElement.getBoundingClientRect();
      const localX = clientX - rect.left + scrollElement.scrollLeft;

      return snapTimelineTime((localX / safePixelsPerSecond) * 1_000, snapMs);
    },
    [safePixelsPerSecond, snapMs],
  );

  const trackIdFromClientY = useCallback((clientY: number, fallbackTrackId: string) => {
    for (const [trackId, element] of trackRefs.current.entries()) {
      const rect = element.getBoundingClientRect();

      if (clientY >= rect.top && clientY <= rect.bottom) {
        return trackId;
      }
    }

    return fallbackTrackId;
  }, []);

  const commitTracks = useCallback(
    (nextTracks: MediaTimelineTrack[]) => {
      onTracksChange?.(nextTracks);
    },
    [onTracksChange],
  );

  const startScrub = (event: PointerEvent<HTMLDivElement>) => {
    if (!onCurrentTimeChange) {
      return;
    }

    rootRef.current?.setPointerCapture(event.pointerId);
    dragStateRef.current = { operation: "scrub" };
    onCurrentTimeChange(Math.min(durationMs, Math.max(0, clientXToTimeMs(event.clientX))));
  };

  const startClipDrag = (
    event: PointerEvent<HTMLElement>,
    clip: MediaTimelineClip,
    operation: "move" | "trim-start" | "trim-end",
  ) => {
    if (readOnly || clip.locked) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    rootRef.current?.setPointerCapture(event.pointerId);
    onSelectedClipChange?.(clip.id);
    dragStateRef.current = {
      operation,
      clipId: clip.id,
      originClientX: event.clientX,
      originStartMs: clip.startMs,
      originDurationMs: clip.durationMs,
      originTrackId: clip.trackId,
      originTracks: tracks,
    };
    setActiveDragClipId(clip.id);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;

    if (!dragState) {
      return;
    }

    if (dragState.operation === "scrub") {
      onCurrentTimeChange?.(Math.min(durationMs, Math.max(0, clientXToTimeMs(event.clientX))));
      return;
    }

    if (!onTracksChange) {
      return;
    }

    const deltaMs = ((event.clientX - dragState.originClientX) / safePixelsPerSecond) * 1_000;

    if (dragState.operation === "move") {
      const found = findTimelineClip(dragState.originTracks, dragState.clipId);
      const targetTrackId = trackIdFromClientY(event.clientY, dragState.originTrackId);
      const targetTrack = dragState.originTracks.find((track) => track.id === targetTrackId);
      const nextTrackId =
        found && targetTrack && canPlaceClipOnTrack(found.clip, targetTrack)
          ? targetTrackId
          : dragState.originTrackId;

      commitTracks(
        moveTimelineClip(
          dragState.originTracks,
          {
            clipId: dragState.clipId,
            startMs: dragState.originStartMs + deltaMs,
            trackId: nextTrackId,
          },
          { durationMs, minClipDurationMs, snapMs },
        ),
      );
      return;
    }

    if (dragState.operation === "trim-start") {
      commitTracks(
        resizeTimelineClip(
          dragState.originTracks,
          {
            clipId: dragState.clipId,
            edge: "start",
            startMs: dragState.originStartMs + deltaMs,
          },
          { durationMs, minClipDurationMs, snapMs },
        ),
      );
      return;
    }

    commitTracks(
      resizeTimelineClip(
        dragState.originTracks,
        {
          clipId: dragState.clipId,
          edge: "end",
          durationMs: dragState.originDurationMs + deltaMs,
        },
        { durationMs, minClipDurationMs, snapMs },
      ),
    );
  };

  const endPointerInteraction = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current) {
      return;
    }

    if (rootRef.current?.hasPointerCapture(event.pointerId)) {
      rootRef.current.releasePointerCapture(event.pointerId);
    }

    dragStateRef.current = undefined;
    setActiveDragClipId(undefined);
  };

  const moveSelectedClipToTrack = (
    clip: MediaTimelineClip,
    direction: -1 | 1,
  ) => {
    const trackIndex = tracks.findIndex((track) => track.id === clip.trackId);

    for (
      let nextTrackIndex = trackIndex + direction;
      nextTrackIndex >= 0 && nextTrackIndex < tracks.length;
      nextTrackIndex += direction
    ) {
      const candidate = tracks[nextTrackIndex];

      if (!candidate || !canPlaceClipOnTrack(clip, candidate)) {
        continue;
      }

      return moveTimelineClip(
        tracks,
        { clipId: clip.id, trackId: candidate.id },
        { durationMs, minClipDurationMs, snapMs },
      );
    }

    return undefined;
  };

  const selectClipByOffset = (offset: -1 | 1) => {
    if (orderedClips.length === 0) {
      return;
    }

    const selectedIndex = Math.max(
      0,
      orderedClips.findIndex((clip) => clip.id === selectedClipId),
    );
    const nextIndex = Math.min(
      Math.max(selectedIndex + offset, 0),
      orderedClips.length - 1,
    );
    onSelectedClipChange?.(orderedClips[nextIndex]?.id);
  };

  const deleteSelectedClip = () => {
    if (!selectedClipId || !onTracksChange || readOnly) {
      return;
    }

    const found = findTimelineClip(tracks, selectedClipId);

    if (!found || found.clip.locked || found.track.locked) {
      return;
    }

    commitTracks(
      tracks.map((track) =>
        track.id === found.track.id
          ? {
              ...track,
              clips: track.clips.filter((clip) => clip.id !== selectedClipId),
            }
          : track,
      ),
    );
    onSelectedClipChange?.(undefined);
  };

  const handleHotkeyAction = (action: MediaTimelineHotkeyAction) => {
    const clip = selectedClipId ? findTimelineClip(tracks, selectedClipId)?.clip : undefined;
    const canEditClip = Boolean(clip && !readOnly && onTracksChange);
    let nextTracks: MediaTimelineTrack[] | undefined;

    if (action === "toggle-playback") {
      onPlaybackToggle?.();
      return;
    }

    if (action === "seek-backward" || action === "seek-forward") {
      const direction = action === "seek-backward" ? -1 : 1;
      onCurrentTimeChange?.(
        Math.min(durationMs, Math.max(0, currentTimeMs + direction * hotkeySeekMs)),
      );
      return;
    }

    if (action === "seek-start" || action === "seek-end") {
      onCurrentTimeChange?.(action === "seek-start" ? 0 : durationMs);
      return;
    }

    if (action === "select-next-clip") {
      selectClipByOffset(1);
      return;
    }

    if (action === "select-previous-clip") {
      selectClipByOffset(-1);
      return;
    }

    if (action === "delete-selected") {
      deleteSelectedClip();
      return;
    }

    if (!canEditClip || !clip) {
      return;
    }

    if (action === "nudge-selected-left" || action === "nudge-selected-right") {
      const direction = action === "nudge-selected-left" ? -1 : 1;
      nextTracks = moveTimelineClip(
        tracks,
        { clipId: clip.id, startMs: clip.startMs + direction * clipStepMs },
        { durationMs, minClipDurationMs, snapMs },
      );
    }

    if (action === "move-selected-up" || action === "move-selected-down") {
      nextTracks = moveSelectedClipToTrack(
        clip,
        action === "move-selected-up" ? -1 : 1,
      );
    }

    if (action === "trim-selected-start-left" || action === "trim-selected-start-right") {
      const direction = action === "trim-selected-start-left" ? -1 : 1;
      nextTracks = resizeTimelineClip(
        tracks,
        {
          clipId: clip.id,
          edge: "start",
          startMs: clip.startMs + direction * clipStepMs,
        },
        { durationMs, minClipDurationMs, snapMs },
      );
    }

    if (action === "trim-selected-end-left" || action === "trim-selected-end-right") {
      const direction = action === "trim-selected-end-left" ? -1 : 1;
      nextTracks = resizeTimelineClip(
        tracks,
        {
          clipId: clip.id,
          edge: "end",
          durationMs: clip.durationMs + direction * clipStepMs,
        },
        { durationMs, minClipDurationMs, snapMs },
      );
    }

    if (nextTracks) {
      commitTracks(nextTracks);
    }
  };

  const handleTimelineKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isEditableKeyboardTarget(event.target)) {
      return;
    }

    const action = findHotkeyAction(event, hotkeyEntries);

    if (!action) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    handleHotkeyAction(action);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, trackId: string) => {
    if (!onTimelineDrop) {
      return;
    }

    event.preventDefault();
    onTimelineDrop({
      trackId,
      timeMs: Math.min(durationMs, Math.max(0, clientXToTimeMs(event.clientX))),
      nativeEvent: event,
    });
  };

  return (
    <div
      ref={rootRef}
      aria-label="Media timeline editor"
      className={cn(
        "overflow-hidden border border-border bg-background text-foreground shadow-sm",
        className,
      )}
      role="application"
      tabIndex={0}
      onKeyDown={handleTimelineKeyDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endPointerInteraction}
      onPointerCancel={endPointerInteraction}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-3 py-2">
        <div className="min-w-0">
          <div className="text-sm font-medium">Media timeline</div>
          <div className="text-xs text-muted-foreground">
            {tracks.length} tracks · {formatTimelineTime(durationMs)}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatTimelineTime(currentTimeMs)}</span>
          {selectedClip ? <span className="hidden sm:inline">Selected: {selectedClip.name}</span> : null}
        </div>
      </div>

      <div className="flex min-h-0">
        <div className="w-40 shrink-0 border-r border-border bg-muted/20">
          <div style={{ height: rulerHeight }} className="border-b border-border" />
          {tracks.map((track) => (
            <div
              key={track.id}
              className="flex flex-col justify-center gap-1 border-b border-border px-3"
              style={{ height: track.height ?? defaultTrackHeight }}
            >
              <div className="truncate text-sm font-medium">{track.name}</div>
              <div className="flex items-center gap-2 text-[11px] uppercase text-muted-foreground">
                <span>{track.kind}</span>
                {track.locked ? <span>Locked</span> : null}
                {track.muted ? <span>Muted</span> : null}
              </div>
            </div>
          ))}
        </div>

        <div ref={scrollRef} className="min-w-0 flex-1 overflow-x-auto">
          <div style={{ width: timelineWidth }} className="relative">
            <div
              className="relative border-b border-border bg-muted/30"
              style={{ height: rulerHeight }}
              onPointerDown={startScrub}
            >
              {ticks.map((tick) => (
                <div
                  key={tick.timeMs}
                  className={cn(
                    "absolute top-0 h-full border-l text-[10px] text-muted-foreground",
                    tick.major ? "border-border" : "border-border/50",
                  )}
                  style={{ left: msToPx(tick.timeMs) }}
                >
                  <span className="ml-1">{tick.label}</span>
                </div>
              ))}
            </div>

            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-0 z-20 h-full w-px bg-destructive"
              style={{ left: msToPx(currentTimeMs) }}
            />

            {tracks.map((track) => (
              <div
                key={track.id}
                ref={(element) => setTrackRef(track.id, element)}
                className={cn(
                  "relative border-b border-border bg-background",
                  onTimelineDrop ? "data-[drop=true]:outline-none" : undefined,
                )}
                data-drop={onTimelineDrop ? "true" : undefined}
                style={{ height: track.height ?? defaultTrackHeight }}
                onPointerDown={startScrub}
                onDragOver={(event) => {
                  if (onTimelineDrop && !track.locked) {
                    event.preventDefault();
                  }
                }}
                onDrop={(event) => handleDrop(event, track.id)}
              >
                <TrackGrid ticks={ticks} msToPx={msToPx} />
                {track.clips.map((clip) => (
                  <TimelineClipButton
                    key={clip.id}
                    clip={clip}
                    selected={clip.id === selectedClipId}
                    dragging={clip.id === activeDragClipId}
                    left={msToPx(clip.startMs)}
                    width={Math.max(20, msToPx(clip.durationMs))}
                    readOnly={readOnly || Boolean(track.locked)}
                    onPointerDown={startClipDrag}
                    onSelect={(clipId) => onSelectedClipChange?.(clipId)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TrackGrid({
  ticks,
  msToPx,
}: {
  ticks: ReturnType<typeof getTimelineTicks>;
  msToPx: (timeMs: number) => number;
}) {
  return (
    <>
      {ticks.map((tick) => (
        <span
          key={tick.timeMs}
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-0 h-full border-l",
            tick.major ? "border-border/45" : "border-border/25",
          )}
          style={{ left: msToPx(tick.timeMs) }}
        />
      ))}
    </>
  );
}

function TimelineClipButton({
  clip,
  selected,
  dragging,
  left,
  width,
  readOnly,
  onPointerDown,
  onSelect,
}: {
  clip: MediaTimelineClip;
  selected: boolean;
  dragging: boolean;
  left: number;
  width: number;
  readOnly: boolean;
  onPointerDown: (
    event: PointerEvent<HTMLElement>,
    clip: MediaTimelineClip,
    operation: "move" | "trim-start" | "trim-end",
  ) => void;
  onSelect: (clipId: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const clipColor = clip.color ?? clipKindColor[clip.kind];
  const style = {
    left,
    width,
    backgroundColor: clipColor,
    transform: hovered && !dragging ? "translateY(-4px)" : undefined,
  } satisfies CSSProperties;

  return (
    <button
      type="button"
      aria-label={`${clip.name}, ${formatTimelineTime(clip.startMs)} to ${formatTimelineTime(getClipEndMs(clip))}`}
      aria-pressed={selected}
      className={cn(
        "absolute top-2 flex h-[calc(100%-1rem)] transform-gpu items-center justify-start overflow-hidden rounded-none border px-2 text-left text-white shadow-sm transition-[transform,box-shadow,filter] duration-150 ease-out",
        "hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        selected ? "border-white ring-2 ring-ring" : "border-white/35",
        dragging ? "opacity-80" : undefined,
        readOnly || clip.locked ? "cursor-default opacity-70" : "cursor-grab active:cursor-grabbing",
      )}
      style={style}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(clip.id);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerDown={(event) => onPointerDown(event, clip, "move")}
    >
      {!readOnly && !clip.locked ? (
        <span
          aria-hidden="true"
          className="absolute inset-y-1 left-1 w-1 cursor-ew-resize bg-white/70"
          onPointerDown={(event) => onPointerDown(event, clip, "trim-start")}
        />
      ) : null}
      <span className="min-w-0 pl-2">
        <span className="block truncate text-xs font-semibold leading-4">{clip.name}</span>
        <span className="block truncate text-[11px] leading-4 text-white/80">
          {formatTimelineTime(clip.durationMs)}
        </span>
      </span>
      {!readOnly && !clip.locked ? (
        <span
          aria-hidden="true"
          className="absolute inset-y-1 right-1 w-1 cursor-ew-resize bg-white/70"
          onPointerDown={(event) => onPointerDown(event, clip, "trim-end")}
        />
      ) : null}
    </button>
  );
}

type NormalizedHotkeyEntry = {
  action: MediaTimelineHotkeyAction;
  key: string;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
};

function normalizeHotkeyMap(hotkeys: MediaTimelineHotkeyMap) {
  const entries: NormalizedHotkeyEntry[] = [];

  for (const [action, shortcuts] of Object.entries(hotkeys) as Array<
    [MediaTimelineHotkeyAction, string | string[] | undefined]
  >) {
    const shortcutList = Array.isArray(shortcuts) ? shortcuts : shortcuts ? [shortcuts] : [];

    for (const shortcut of shortcutList) {
      const entry = parseHotkey(shortcut, action);

      if (entry) {
        entries.push(entry);
      }
    }
  }

  return entries;
}

function parseHotkey(shortcut: string, action: MediaTimelineHotkeyAction) {
  const parts = shortcut
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);
  const entry: NormalizedHotkeyEntry = {
    action,
    key: "",
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
  };

  for (const part of parts) {
    const token = part.toLowerCase();

    if (token === "alt" || token === "option") {
      entry.altKey = true;
      continue;
    }

    if (token === "ctrl" || token === "control") {
      entry.ctrlKey = true;
      continue;
    }

    if (token === "cmd" || token === "command" || token === "meta") {
      entry.metaKey = true;
      continue;
    }

    if (token === "shift") {
      entry.shiftKey = true;
      continue;
    }

    entry.key = normalizeHotkeyKey(part);
  }

  return entry.key ? entry : undefined;
}

function findHotkeyAction(
  event: KeyboardEvent,
  entries: NormalizedHotkeyEntry[],
) {
  const key = normalizeHotkeyKey(event.key);

  return entries.find(
    (entry) =>
      entry.key === key &&
      entry.altKey === event.altKey &&
      entry.ctrlKey === event.ctrlKey &&
      entry.metaKey === event.metaKey &&
      entry.shiftKey === event.shiftKey,
  )?.action;
}

function normalizeHotkeyKey(key: string) {
  if (key === " ") {
    return "space";
  }

  return key.toLowerCase();
}

function isEditableKeyboardTarget(target: EventTarget) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  return ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName);
}
