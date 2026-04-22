export type MediaClipKind = "audio" | "video" | "image" | "text";

export type MediaTimelineClip = {
  id: string;
  trackId: string;
  name: string;
  startMs: number;
  durationMs: number;
  kind: MediaClipKind;
  color?: string;
  muted?: boolean;
  locked?: boolean;
  sourceId?: string;
  sourceOffsetMs?: number;
};

export type MediaTimelineTrackKind = MediaClipKind | "mixed";

export type MediaTimelineTrack = {
  id: string;
  name: string;
  kind: MediaTimelineTrackKind;
  clips: MediaTimelineClip[];
  acceptsClipKinds?: MediaClipKind[];
  height?: number;
  muted?: boolean;
  locked?: boolean;
};

export type TimelineTick = {
  timeMs: number;
  label: string;
  major: boolean;
};

export type TimelineClipPlacement = {
  clipId: string;
  startMs?: number;
  trackId?: string;
};

export type TimelineClipResize = {
  clipId: string;
  edge: "start" | "end";
  startMs?: number;
  durationMs?: number;
};

export type TimelineOverlap = {
  trackId: string;
  firstClipId: string;
  secondClipId: string;
  overlapStartMs: number;
  overlapEndMs: number;
};

export type TimelineOperationOptions = {
  durationMs?: number;
  minClipDurationMs?: number;
  snapMs?: number;
};

const tickIntervalsMs = [
  100, 250, 500, 1_000, 2_000, 5_000, 10_000, 15_000, 30_000, 60_000, 120_000, 300_000, 600_000,
];

export const defaultMinClipDurationMs = 250;

export function clampTimelineTime(timeMs: number, minMs = 0, maxMs = Number.POSITIVE_INFINITY) {
  if (!Number.isFinite(timeMs)) {
    return minMs;
  }

  return Math.min(Math.max(timeMs, minMs), maxMs);
}

export function snapTimelineTime(timeMs: number, snapMs = 0) {
  if (!Number.isFinite(timeMs) || snapMs <= 0) {
    return timeMs;
  }

  return Math.round(timeMs / snapMs) * snapMs;
}

export function getClipEndMs(clip: Pick<MediaTimelineClip, "startMs" | "durationMs">) {
  return clip.startMs + clip.durationMs;
}

export function formatTimelineTime(timeMs: number) {
  const safeTimeMs = Math.max(0, Math.round(timeMs));
  const totalSeconds = Math.floor(safeTimeMs / 1_000);
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((safeTimeMs % 1_000) / 100);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenths}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}.${tenths}`;
}

export function getTimelineDurationMs(tracks: MediaTimelineTrack[], fallbackMs = 60_000) {
  const clipEndMs = tracks.flatMap((track) => track.clips.map(getClipEndMs));
  return Math.max(fallbackMs, 1, ...clipEndMs);
}

export function getTimelineTicks(durationMs: number, pixelsPerSecond: number, minTickPixels = 80) {
  const safeDurationMs = Math.max(0, durationMs);
  const safePixelsPerSecond = Math.max(1, pixelsPerSecond);
  const intervalMs =
    tickIntervalsMs.find(
      (candidate) => (candidate / 1_000) * safePixelsPerSecond >= minTickPixels,
    ) ?? tickIntervalsMs[tickIntervalsMs.length - 1]!;
  const majorIntervalMs = intervalMs * 2;
  const ticks: TimelineTick[] = [];

  for (let timeMs = 0; timeMs <= safeDurationMs + 1; timeMs += intervalMs) {
    ticks.push({
      timeMs,
      label: formatTimelineTime(timeMs),
      major: timeMs % majorIntervalMs === 0,
    });
  }

  return ticks;
}

export function canPlaceClipOnTrack(clip: MediaTimelineClip, track: MediaTimelineTrack) {
  if (track.locked) {
    return false;
  }

  if (track.acceptsClipKinds) {
    return track.acceptsClipKinds.includes(clip.kind);
  }

  return track.kind === "mixed" || track.kind === clip.kind;
}

export function findTimelineClip(tracks: MediaTimelineTrack[], clipId: string) {
  for (const track of tracks) {
    const clip = track.clips.find((candidate) => candidate.id === clipId);

    if (clip) {
      return { clip, track };
    }
  }

  return undefined;
}

export function normalizeTimelineTracks(
  tracks: MediaTimelineTrack[],
  options: TimelineOperationOptions = {},
) {
  const durationMs = options.durationMs ?? Number.POSITIVE_INFINITY;
  const minClipDurationMs = options.minClipDurationMs ?? defaultMinClipDurationMs;

  return tracks.map((track) => ({
    ...track,
    clips: track.clips
      .map((clip) => {
        const maxStartMs = Math.max(0, durationMs - minClipDurationMs);
        const startMs = clampTimelineTime(clip.startMs, 0, maxStartMs);
        const durationLimitMs = Number.isFinite(durationMs)
          ? Math.max(minClipDurationMs, durationMs - startMs)
          : Number.POSITIVE_INFINITY;
        const durationMsForClip = clampTimelineTime(
          clip.durationMs,
          minClipDurationMs,
          durationLimitMs,
        );

        return {
          ...clip,
          trackId: track.id,
          startMs,
          durationMs: durationMsForClip,
        };
      })
      .sort((left, right) => left.startMs - right.startMs || left.id.localeCompare(right.id)),
  }));
}

export function moveTimelineClip(
  tracks: MediaTimelineTrack[],
  placement: TimelineClipPlacement,
  options: TimelineOperationOptions = {},
) {
  const found = findTimelineClip(tracks, placement.clipId);

  if (!found || found.clip.locked || found.track.locked) {
    return tracks;
  }

  const targetTrack = tracks.find((track) => track.id === (placement.trackId ?? found.track.id));

  if (!targetTrack || !canPlaceClipOnTrack(found.clip, targetTrack)) {
    return tracks;
  }

  const durationMs = options.durationMs ?? Number.POSITIVE_INFINITY;
  const snapMs = options.snapMs ?? 0;
  const maxStartMs = Math.max(0, durationMs - found.clip.durationMs);
  const nextStartMs = clampTimelineTime(
    snapTimelineTime(placement.startMs ?? found.clip.startMs, snapMs),
    0,
    maxStartMs,
  );

  return normalizeTimelineTracks(
    tracks.map((track) => {
      if (track.id === found.track.id && track.id !== targetTrack.id) {
        return {
          ...track,
          clips: track.clips.filter((clip) => clip.id !== found.clip.id),
        };
      }

      if (track.id !== targetTrack.id) {
        return track;
      }

      const nextClip = {
        ...found.clip,
        trackId: targetTrack.id,
        startMs: nextStartMs,
      };

      if (track.id === found.track.id) {
        return {
          ...track,
          clips: track.clips.map((clip) => (clip.id === found.clip.id ? nextClip : clip)),
        };
      }

      return {
        ...track,
        clips: [...track.clips, nextClip],
      };
    }),
    options,
  );
}

export function resizeTimelineClip(
  tracks: MediaTimelineTrack[],
  resize: TimelineClipResize,
  options: TimelineOperationOptions = {},
) {
  const found = findTimelineClip(tracks, resize.clipId);

  if (!found || found.clip.locked || found.track.locked) {
    return tracks;
  }

  const durationMs = options.durationMs ?? Number.POSITIVE_INFINITY;
  const minClipDurationMs = options.minClipDurationMs ?? defaultMinClipDurationMs;
  const snapMs = options.snapMs ?? 0;
  const originalEndMs = getClipEndMs(found.clip);

  let nextStartMs = found.clip.startMs;
  let nextDurationMs = found.clip.durationMs;

  if (resize.edge === "start") {
    const maxStartMs = originalEndMs - minClipDurationMs;
    nextStartMs = clampTimelineTime(
      snapTimelineTime(resize.startMs ?? found.clip.startMs, snapMs),
      0,
      maxStartMs,
    );
    nextDurationMs = originalEndMs - nextStartMs;
  } else {
    const requestedDurationMs = resize.durationMs ?? found.clip.durationMs;
    const snappedEndMs = snapTimelineTime(found.clip.startMs + requestedDurationMs, snapMs);
    const nextEndMs = clampTimelineTime(
      snappedEndMs,
      found.clip.startMs + minClipDurationMs,
      durationMs,
    );
    nextDurationMs = nextEndMs - found.clip.startMs;
  }

  return normalizeTimelineTracks(
    tracks.map((track) => {
      if (track.id !== found.track.id) {
        return track;
      }

      return {
        ...track,
        clips: track.clips.map((clip) =>
          clip.id === found.clip.id
            ? {
                ...clip,
                startMs: nextStartMs,
                durationMs: nextDurationMs,
              }
            : clip,
        ),
      };
    }),
    options,
  );
}

export function detectTimelineOverlaps(tracks: MediaTimelineTrack[]) {
  const overlaps: TimelineOverlap[] = [];

  for (const track of tracks) {
    const clips = [...track.clips].sort((left, right) => left.startMs - right.startMs);

    for (let index = 1; index < clips.length; index += 1) {
      const previousClip = clips[index - 1]!;
      const clip = clips[index]!;
      const overlapStartMs = Math.max(previousClip.startMs, clip.startMs);
      const overlapEndMs = Math.min(getClipEndMs(previousClip), getClipEndMs(clip));

      if (overlapEndMs > overlapStartMs) {
        overlaps.push({
          trackId: track.id,
          firstClipId: previousClip.id,
          secondClipId: clip.id,
          overlapStartMs,
          overlapEndMs,
        });
      }
    }
  }

  return overlaps;
}
