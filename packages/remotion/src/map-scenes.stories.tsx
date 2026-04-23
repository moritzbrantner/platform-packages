import { Player } from "@remotion/player";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentType, CSSProperties } from "react";
import { AbsoluteFill } from "remotion";

import {
  RemotionClusteredMap,
  RemotionHeatMap,
  type RemotionMapPlayback,
  type TemporalMapTrack,
} from "./index";

type SceneStoryArgs = {
  durationInFrames: number;
  playback: RemotionMapPlayback;
  preserveTemporalScale: boolean;
};

type SceneProps = {
  playback: RemotionMapPlayback;
  preserveTemporalScale: boolean;
};

const remotionMapTracks = [
  {
    id: "alpha",
    label: "Alpha convoy",
    frames: [
      { latitude: 52.52, longitude: 13.405, metrics: { intensity: 2 }, time: 0 },
      { latitude: 51.3397, longitude: 12.3731, metrics: { intensity: 5 }, time: 40 },
      { latitude: 50.1109, longitude: 8.6821, metrics: { intensity: 7 }, time: 80 },
      { latitude: 48.1351, longitude: 11.582, metrics: { intensity: 4 }, time: 120 },
      { latitude: 47.3769, longitude: 8.5417, metrics: { intensity: 3 }, time: 160 },
    ],
  },
  {
    id: "bravo",
    label: "Bravo signal",
    frames: [
      { latitude: 48.8566, longitude: 2.3522, metrics: { intensity: 3 }, time: 0 },
      { latitude: 50.8503, longitude: 4.3517, metrics: { intensity: 4 }, time: 40 },
      { latitude: 52.3676, longitude: 4.9041, metrics: { intensity: 6 }, time: 80 },
      { latitude: 53.5511, longitude: 9.9937, metrics: { intensity: 6 }, time: 120 },
      { latitude: 55.6761, longitude: 12.5683, metrics: { intensity: 5 }, time: 160 },
    ],
  },
  {
    id: "charlie",
    label: "Charlie relay",
    frames: [
      { latitude: 41.9028, longitude: 12.4964, metrics: { intensity: 2 }, time: 0 },
      { latitude: 43.7696, longitude: 11.2558, metrics: { intensity: 3 }, time: 40 },
      { latitude: 45.4642, longitude: 9.19, metrics: { intensity: 8 }, time: 80 },
      { latitude: 45.0703, longitude: 7.6869, metrics: { intensity: 4 }, time: 120 },
      { latitude: 44.4949, longitude: 11.3426, metrics: { intensity: 2 }, time: 160 },
    ],
  },
] satisfies TemporalMapTrack<{ intensity: number }>[];

const compositionStyle: CSSProperties = {
  background:
    "radial-gradient(circle at top, rgb(16 185 129 / 0.28), transparent 58%), linear-gradient(180deg, #0b1120, #020617)",
  padding: 32,
};

const mapStyle: CSSProperties = {
  borderRadius: 18,
  minHeight: "100%",
};

function ClusteredMapScene({ playback }: SceneProps) {
  return (
    <AbsoluteFill style={compositionStyle}>
      <RemotionClusteredMap
        tracks={remotionMapTracks}
        fitBoundsPadding={48}
        mapLabel="Frame-driven clustered map scene"
        mapStyle={{ tiles: false }}
        playback={playback}
        style={mapStyle}
      />
    </AbsoluteFill>
  );
}

function HeatMapScene({ playback, preserveTemporalScale }: SceneProps) {
  return (
    <AbsoluteFill style={compositionStyle}>
      <RemotionHeatMap
        tracks={remotionMapTracks}
        fitBoundsPadding={48}
        mapLabel="Frame-driven heat map scene"
        mapStyle={{ tiles: false }}
        playback={playback}
        preserveTemporalScale={preserveTemporalScale}
        style={mapStyle}
        weightMetric="intensity"
      />
    </AbsoluteFill>
  );
}

function MapScenePlayer({
  component,
  durationInFrames,
  inputProps,
  loop,
}: {
  component: ComponentType<SceneProps>;
  durationInFrames: number;
  inputProps: SceneProps;
  loop: boolean;
}) {
  return (
    <div className="mb-remotion-scene">
      <div className="mb-remotion-scene__player">
        <Player
          autoPlay
          component={component}
          compositionHeight={720}
          compositionWidth={1280}
          controls
          durationInFrames={durationInFrames}
          fps={30}
          inputProps={inputProps}
          loop={loop}
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
}

const meta = {
  title: "Remotion/Map Scenes",
  args: {
    durationInFrames: 240,
    playback: "clamp",
    preserveTemporalScale: true,
  },
  argTypes: {
    durationInFrames: {
      control: { type: "number", min: 30, max: 720, step: 30 },
      description: "Player composition length used for timeline scrubbing.",
    },
    playback: {
      control: { type: "inline-radio" },
      options: ["clamp", "loop"],
    },
    preserveTemporalScale: {
      control: { type: "boolean" },
      description: "Keeps heat-map color scale fixed across all frames.",
    },
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<SceneStoryArgs>;

export default meta;

type Story = StoryObj<SceneStoryArgs>;

export const ClusteredScene: Story = {
  render: (args) => (
    <MapScenePlayer
      component={ClusteredMapScene}
      durationInFrames={args.durationInFrames}
      inputProps={{
        playback: args.playback,
        preserveTemporalScale: args.preserveTemporalScale,
      }}
      loop={args.playback === "loop"}
    />
  ),
};

export const HeatScene: Story = {
  render: (args) => (
    <MapScenePlayer
      component={HeatMapScene}
      durationInFrames={args.durationInFrames}
      inputProps={{
        playback: args.playback,
        preserveTemporalScale: args.preserveTemporalScale,
      }}
      loop={args.playback === "loop"}
    />
  ),
};
