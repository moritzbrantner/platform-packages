import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import {
  TimelineEditor,
  type TimelineEditorMarker,
  type TimelineEditorTrack,
} from "./timeline-editor";

const initialTracks: TimelineEditorTrack[] = [
  {
    id: "video",
    label: "Video",
    clips: [
      { id: "intro", label: "Intro", start: 0, end: 3, color: "#1d4ed8" },
      { id: "demo", label: "Demo", start: 4, end: 9, color: "#166534" },
    ],
  },
  {
    id: "audio",
    label: "Audio",
    clips: [{ id: "voice", label: "Voiceover", start: 1, end: 8, color: "#581c87" }],
  },
];

const markers: TimelineEditorMarker[] = [
  { id: "m1", time: 3, label: "Title" },
  { id: "m2", time: 7, label: "CTA", color: "#dc2626" },
];

function TimelineEditorDemo({
  onCurrentTimeChange,
  onTracksChange,
  onSelectedClipChange,
}: {
  onCurrentTimeChange?: (time: number) => void;
  onTracksChange?: (tracks: TimelineEditorTrack[]) => void;
  onSelectedClipChange?: (clipId: string | null) => void;
}) {
  const [tracks, setTracks] = React.useState(initialTracks);
  const [currentTime, setCurrentTime] = React.useState(2);
  const [selectedClipId, setSelectedClipId] = React.useState<string | null>("demo");

  return (
    <TimelineEditor
      tracks={tracks}
      duration={12}
      currentTime={currentTime}
      selectedClipId={selectedClipId}
      markers={markers}
      onCurrentTimeChange={(time) => {
        setCurrentTime(time);
        onCurrentTimeChange?.(time);
      }}
      onTracksChange={(nextTracks) => {
        setTracks(nextTracks);
        onTracksChange?.(nextTracks);
      }}
      onSelectedClipChange={(clipId) => {
        setSelectedClipId(clipId);
        onSelectedClipChange?.(clipId);
      }}
      className="max-w-4xl"
    />
  );
}

const meta = {
  title: "Components/TimelineEditor",
  component: TimelineEditorDemo,
  tags: ["autodocs", "test"],
  args: {
    onCurrentTimeChange: fn(),
    onTracksChange: fn(),
    onSelectedClipChange: fn(),
  },
} satisfies Meta<typeof TimelineEditorDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByText("Intro"));
    await expect(canvas.getByText("Intro selected")).toBeInTheDocument();
  },
};
