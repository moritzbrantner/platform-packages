import { useEffect, useMemo, useRef, useState } from "react";

import {
  MediaTimeline,
  canPlaceClipOnTrack,
  detectTimelineOverlaps,
  formatTimelineTime,
  getTimelineDurationMs,
  normalizeTimelineTracks,
  type MediaClipKind,
  type MediaTimelineHotkeyMap,
  type MediaTimelineTrack,
} from "@moritzbrantner/media-editor";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Slider,
  cn,
} from "@moritzbrantner/ui";

import { PlaygroundPage } from "./app-shell";
import { mountPage } from "./mount";

type MediaAsset = {
  id: string;
  name: string;
  kind: MediaClipKind;
  durationMs: number;
  color: string;
};

const assetDragType = "application/x-media-editor-asset";

const timelineHotkeys = {
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

const mediaAssets: MediaAsset[] = [
  {
    id: "asset-video-a",
    name: "Camera A",
    kind: "video",
    durationMs: 6_000,
    color: "#2563eb",
  },
  {
    id: "asset-cutaway",
    name: "Cutaway",
    kind: "video",
    durationMs: 3_200,
    color: "#0891b2",
  },
  {
    id: "asset-voice",
    name: "Voice over",
    kind: "audio",
    durationMs: 5_000,
    color: "#15803d",
  },
  {
    id: "asset-music",
    name: "Music bed",
    kind: "audio",
    durationMs: 9_000,
    color: "#65a30d",
  },
  {
    id: "asset-title",
    name: "Title card",
    kind: "text",
    durationMs: 2_500,
    color: "#b45309",
  },
];

const initialTracks: MediaTimelineTrack[] = normalizeTimelineTracks([
  {
    id: "video-1",
    name: "Video 1",
    kind: "video",
    clips: [
      {
        id: "clip-opening",
        trackId: "video-1",
        name: "Opening shot",
        kind: "video",
        startMs: 0,
        durationMs: 5_500,
        color: "#2563eb",
      },
      {
        id: "clip-cutaway",
        trackId: "video-1",
        name: "Cutaway",
        kind: "video",
        startMs: 6_000,
        durationMs: 3_000,
        color: "#0891b2",
      },
    ],
  },
  {
    id: "titles",
    name: "Titles",
    kind: "text",
    clips: [
      {
        id: "clip-title",
        trackId: "titles",
        name: "Lower third",
        kind: "text",
        startMs: 1_500,
        durationMs: 2_500,
        color: "#b45309",
      },
    ],
  },
  {
    id: "dialogue",
    name: "Dialogue",
    kind: "audio",
    clips: [
      {
        id: "clip-dialogue",
        trackId: "dialogue",
        name: "Interview",
        kind: "audio",
        startMs: 500,
        durationMs: 6_500,
        color: "#15803d",
      },
    ],
  },
  {
    id: "music",
    name: "Music",
    kind: "audio",
    clips: [
      {
        id: "clip-music",
        trackId: "music",
        name: "Music bed",
        kind: "audio",
        startMs: 0,
        durationMs: 10_000,
        color: "#65a30d",
      },
    ],
  },
]);

function MediaEditorPage() {
  const [tracks, setTracks] = useState(initialTracks);
  const [selectedClipId, setSelectedClipId] = useState("clip-opening");
  const [currentTimeMs, setCurrentTimeMs] = useState(1_000);
  const [pixelsPerSecond, setPixelsPerSecond] = useState(90);
  const [isPlaying, setIsPlaying] = useState(false);
  const frameRef = useRef<number | undefined>(undefined);
  const lastFrameTimeRef = useRef<number | undefined>(undefined);
  const clipSequenceRef = useRef(0);
  const durationMs = Math.max(15_000, getTimelineDurationMs(tracks, 15_000));
  const selectedClip = useMemo(
    () =>
      tracks.flatMap((track) => track.clips).find((clip) => clip.id === selectedClipId),
    [selectedClipId, tracks],
  );
  const overlaps = useMemo(() => detectTimelineOverlaps(tracks), [tracks]);

  useEffect(() => {
    if (!isPlaying) {
      return undefined;
    }

    const tick = (now: number) => {
      const lastFrameTime = lastFrameTimeRef.current ?? now;
      const deltaMs = now - lastFrameTime;
      lastFrameTimeRef.current = now;

      setCurrentTimeMs((value) => {
        const nextValue = value + deltaMs;

        if (nextValue >= durationMs) {
          setIsPlaying(false);
          return durationMs;
        }

        return nextValue;
      });

      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== undefined) {
        window.cancelAnimationFrame(frameRef.current);
      }

      frameRef.current = undefined;
      lastFrameTimeRef.current = undefined;
    };
  }, [durationMs, isPlaying]);

  const addAssetToTrack = (asset: MediaAsset, trackId: string, startMs: number) => {
    const targetTrack = tracks.find((track) => track.id === trackId);
    const draftClip = {
      id: `${asset.id}-${clipSequenceRef.current}`,
      trackId,
      name: asset.name,
      kind: asset.kind,
      startMs,
      durationMs: asset.durationMs,
      color: asset.color,
      sourceId: asset.id,
    };

    if (!targetTrack || !canPlaceClipOnTrack(draftClip, targetTrack)) {
      return;
    }

    clipSequenceRef.current += 1;
    setTracks((currentTracks) =>
      normalizeTimelineTracks(
        currentTracks.map((track) =>
          track.id === trackId
            ? {
                ...track,
                clips: [...track.clips, draftClip],
              }
            : track,
        ),
        { durationMs },
      ),
    );
    setSelectedClipId(draftClip.id);
  };

  const addAssetAtPlayhead = (asset: MediaAsset) => {
    const targetTrack = tracks.find((track) =>
      canPlaceClipOnTrack(
        {
          id: asset.id,
          trackId: track.id,
          name: asset.name,
          kind: asset.kind,
          startMs: currentTimeMs,
          durationMs: asset.durationMs,
        },
        track,
      ),
    );

    if (targetTrack) {
      addAssetToTrack(asset, targetTrack.id, currentTimeMs);
    }
  };

  return (
    <PlaygroundPage
      activePage="media-editor"
      title="Media editor timeline MVP"
      description="Reusable React timeline primitives for Electron, Tauri, and browser-based audio/video editors."
    >
      <section className="grid gap-4 xl:grid-cols-[minmax(260px,0.32fr)_minmax(0,1fr)]">
        <div className="grid gap-4">
          <Card className="rounded-none border-border/60 bg-background/75 shadow-2xl shadow-black/10">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Assets</CardTitle>
                <Badge variant="secondary">{mediaAssets.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-2">
              {mediaAssets.map((asset) => (
                <Button
                  key={asset.id}
                  type="button"
                  variant="ghost"
                  draggable
                  className="grid h-auto min-h-14 grid-cols-[0.55rem_1fr_auto] items-center gap-3 border border-border bg-background px-3 text-left text-sm shadow-none transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => addAssetAtPlayhead(asset)}
                  onDragStart={(event) => {
                    event.dataTransfer.setData(assetDragType, asset.id);
                    event.dataTransfer.effectAllowed = "copy";
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="h-8 w-2"
                    style={{ backgroundColor: asset.color }}
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{asset.name}</span>
                    <span className="block text-xs uppercase text-muted-foreground">
                      {asset.kind}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTimelineTime(asset.durationMs)}
                  </span>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-none border-border/60 bg-background/75 shadow-2xl shadow-black/10">
            <CardHeader>
              <CardTitle>Inspector</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm">
              {selectedClip ? (
                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{selectedClip.name}</span>
                    <Badge variant="outline">{selectedClip.kind}</Badge>
                  </div>
                  <dl className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <dt>Start</dt>
                    <dd className="text-right text-foreground">
                      {formatTimelineTime(selectedClip.startMs)}
                    </dd>
                    <dt>Duration</dt>
                    <dd className="text-right text-foreground">
                      {formatTimelineTime(selectedClip.durationMs)}
                    </dd>
                    <dt>End</dt>
                    <dd className="text-right text-foreground">
                      {formatTimelineTime(selectedClip.startMs + selectedClip.durationMs)}
                    </dd>
                  </dl>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No clip selected</div>
              )}

              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>Zoom</span>
                  <span>{pixelsPerSecond}px/s</span>
                </div>
                <Slider
                  value={[pixelsPerSecond]}
                  min={40}
                  max={180}
                  step={10}
                  onValueChange={(value) => setPixelsPerSecond(value[0] ?? 90)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant={overlaps.length > 0 ? "destructive" : "secondary"}>
                  {overlaps.length} overlaps
                </Badge>
                <Badge variant="outline">{formatTimelineTime(durationMs)}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4">
          <Card className="rounded-none border-border/60 bg-background/75 shadow-2xl shadow-black/10">
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Sequence</CardTitle>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {formatTimelineTime(currentTimeMs)}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={isPlaying ? "secondary" : "default"}
                    onClick={() => setIsPlaying((value) => !value)}
                  >
                    {isPlaying ? "Pause" : "Play"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentTimeMs(0);
                    }}
                  >
                    Stop
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setPixelsPerSecond((value) => Math.max(40, value - 10))}
                  >
                    Zoom -
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setPixelsPerSecond((value) => Math.min(180, value + 10))}
                  >
                    Zoom +
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <MediaTimeline
                tracks={tracks}
                durationMs={durationMs}
                currentTimeMs={currentTimeMs}
                pixelsPerSecond={pixelsPerSecond}
                selectedClipId={selectedClipId}
                hotkeys={timelineHotkeys}
                onTracksChange={setTracks}
                onCurrentTimeChange={(timeMs) => {
                  setCurrentTimeMs(timeMs);
                  setIsPlaying(false);
                }}
                onPlaybackToggle={() => setIsPlaying((value) => !value)}
                onSelectedClipChange={(clipId) => setSelectedClipId(clipId ?? "")}
                onTimelineDrop={({ trackId, timeMs, nativeEvent }) => {
                  const assetId = nativeEvent.dataTransfer.getData(assetDragType);
                  const asset = mediaAssets.find((candidate) => candidate.id === assetId);

                  if (asset) {
                    addAssetToTrack(asset, trackId, timeMs);
                  }
                }}
              />
            </CardContent>
          </Card>

          <div className="grid gap-3 md:grid-cols-3">
            {tracks.map((track) => (
              <div
                key={track.id}
                className={cn(
                  "border border-border bg-background/70 p-4 shadow-sm",
                  track.clips.length === 0 ? "text-muted-foreground" : undefined,
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{track.name}</span>
                  <Badge variant="outline">{track.clips.length}</Badge>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {track.clips.length > 0
                    ? `${formatTimelineTime(track.clips[0]!.startMs)} first clip`
                    : "Empty"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PlaygroundPage>
  );
}

mountPage(<MediaEditorPage />);
