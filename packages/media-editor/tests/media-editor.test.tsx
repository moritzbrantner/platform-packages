import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import {
  MediaTimeline,
  detectTimelineOverlaps,
  formatTimelineTime,
  getTimelineTicks,
  moveTimelineClip,
  resizeTimelineClip,
  type MediaTimelineTrack,
} from "@moritzbrantner/media-editor";

const tracks: MediaTimelineTrack[] = [
  {
    id: "video",
    name: "Video",
    kind: "video",
    clips: [
      {
        id: "clip-1",
        trackId: "video",
        name: "Opening shot",
        kind: "video",
        startMs: 1_000,
        durationMs: 4_000,
      },
    ],
  },
  {
    id: "audio",
    name: "Voice",
    kind: "audio",
    clips: [
      {
        id: "clip-2",
        trackId: "audio",
        name: "Narration",
        kind: "audio",
        startMs: 2_000,
        durationMs: 3_000,
      },
    ],
  },
];

describe("@moritzbrantner/media-editor timeline utilities", () => {
  test("formats timeline times and chooses readable ticks", () => {
    expect(formatTimelineTime(65_430)).toBe("1:05.4");
    expect(getTimelineTicks(10_000, 100).map((tick) => tick.timeMs)).toContain(5_000);
  });

  test("moves clips across compatible tracks and preserves incompatible tracks", () => {
    const moved = moveTimelineClip(tracks, {
      clipId: "clip-1",
      startMs: 1_750,
      trackId: "audio",
    });

    expect(moved[0]?.clips[0]?.trackId).toBe("video");

    const mixedTracks: MediaTimelineTrack[] = [
      { id: "mixed", name: "Mixed", kind: "mixed", clips: [] },
      tracks[0]!,
    ];
    const movedToMixed = moveTimelineClip(mixedTracks, {
      clipId: "clip-1",
      startMs: 1_750,
      trackId: "mixed",
    });

    expect(movedToMixed[0]?.clips[0]?.trackId).toBe("mixed");
    expect(movedToMixed[0]?.clips[0]?.startMs).toBe(1_750);
  });

  test("resizes clips and reports same-track overlaps", () => {
    const resized = resizeTimelineClip(
      tracks,
      {
        clipId: "clip-1",
        edge: "end",
        durationMs: 5_000,
      },
      { durationMs: 8_000 },
    );

    expect(resized[0]?.clips[0]?.durationMs).toBe(5_000);
    expect(
      detectTimelineOverlaps([
        {
          id: "video",
          name: "Video",
          kind: "video",
          clips: [
            resized[0]!.clips[0]!,
            {
              id: "clip-3",
              trackId: "video",
              name: "Cutaway",
              kind: "video",
              startMs: 4_000,
              durationMs: 1_000,
            },
          ],
        },
      ]),
    ).toHaveLength(1);
  });
});

describe("@moritzbrantner/media-editor React timeline", () => {
  test("renders clips, supports selection, and nudges clips with the keyboard", () => {
    const handleTracksChange = vi.fn();
    const handleSelectionChange = vi.fn();

    render(
      <MediaTimeline
        tracks={tracks}
        durationMs={10_000}
        selectedClipId="clip-1"
        onTracksChange={handleTracksChange}
        onSelectedClipChange={handleSelectionChange}
      />,
    );

    const clip = screen.getByRole("button", {
      name: /Opening shot, 0:01.0 to 0:05.0/,
    });

    expect(clip.className).toContain("hover:-translate-y-1");
    expect(clip.className).not.toContain("scale");

    fireEvent.click(clip);
    expect(handleSelectionChange).toHaveBeenCalledWith("clip-1");

    fireEvent.keyDown(clip, { key: "ArrowRight" });
    expect(handleTracksChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: "video",
          clips: expect.arrayContaining([
            expect.objectContaining({
              id: "clip-1",
              startMs: 1_100,
            }),
          ]),
        }),
      ]),
    );
  });

  test("accepts a custom hotkey mapping for timeline controls", () => {
    const handleTracksChange = vi.fn();
    const handleSelectionChange = vi.fn();
    const handlePlaybackToggle = vi.fn();

    render(
      <MediaTimeline
        tracks={tracks}
        durationMs={10_000}
        selectedClipId="clip-1"
        hotkeys={{
          "nudge-selected-right": "D",
          "select-next-clip": "N",
          "toggle-playback": "Space",
        }}
        onTracksChange={handleTracksChange}
        onSelectedClipChange={handleSelectionChange}
        onPlaybackToggle={handlePlaybackToggle}
      />,
    );

    const timeline = screen.getByRole("application", {
      name: "Media timeline editor",
    });

    fireEvent.keyDown(timeline, { key: "ArrowRight" });
    expect(handleTracksChange).not.toHaveBeenCalled();

    fireEvent.keyDown(timeline, { key: "d" });
    expect(handleTracksChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: "video",
          clips: expect.arrayContaining([
            expect.objectContaining({
              id: "clip-1",
              startMs: 1_100,
            }),
          ]),
        }),
      ]),
    );

    fireEvent.keyDown(timeline, { key: "n" });
    expect(handleSelectionChange).toHaveBeenCalledWith("clip-2");

    fireEvent.keyDown(timeline, { key: " " });
    expect(handlePlaybackToggle).toHaveBeenCalledTimes(1);
  });
});
