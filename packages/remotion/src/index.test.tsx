import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { createFlatCloudFigure, type FlatDesignScene } from "@moritzbrantner/flat-design";

import type { TemporalMapTrack } from ".";

const leafletMock = vi.hoisted(() => {
  type Handler = (...args: unknown[]) => void;
  type Layer = {
    latLng?: [number, number];
    options?: Record<string, unknown>;
    type: string;
  };

  const maps: MockMap[] = [];
  const layerGroups: MockLayerGroup[] = [];

  class MockLayerGroup {
    layers: Layer[] = [];

    constructor() {
      layerGroups.push(this);
    }

    addLayer(layer: Layer) {
      this.layers.push(layer);
    }

    addTo() {
      return this;
    }

    clearLayers() {
      this.layers = [];
    }
  }

  class MockMap {
    handlers = new Map<string, Handler[]>();
    removed = false;
    zoom = 6;

    constructor() {
      maps.push(this);
    }

    container = {
      clientHeight: 640,
      clientWidth: 960,
      style: {
        cursor: "",
      },
    };

    containerPointToLatLng([x, y]: [number, number]) {
      return {
        lat: 90 - y / 2,
        lng: x / 2 - 180,
      };
    }

    fitBounds() {}

    getBounds() {
      return {
        getEast: () => 180,
        getNorth: () => 90,
        getSouth: () => -90,
        getWest: () => -180,
      };
    }

    getContainer() {
      return this.container;
    }

    getZoom() {
      return this.zoom;
    }

    latLngToContainerPoint([lat, lng]: [number, number]) {
      return {
        x: (lng + 180) * 2,
        y: (90 - lat) * 2,
      };
    }

    off() {}

    on(event: string, handler: Handler) {
      const handlers = this.handlers.get(event) ?? [];

      handlers.push(handler);
      this.handlers.set(event, handlers);
    }

    remove() {
      this.removed = true;
    }

    setView(_latLng: [number, number], zoom: number) {
      this.zoom = zoom;
    }
  }

  function createLayer(type: string, latLng?: [number, number], options?: Record<string, unknown>) {
    const layer: Layer & {
      addTo: (group: MockLayerGroup) => typeof layer;
      on: () => typeof layer;
    } = {
      latLng,
      options,
      type,
      addTo(group: MockLayerGroup) {
        group.addLayer(this);
        return this;
      },
      on() {
        return this;
      },
    };

    return layer;
  }

  return {
    circleMarker: (latLng: [number, number], options: Record<string, unknown>) =>
      createLayer("circleMarker", latLng, options),
    divIcon: (options: Record<string, unknown>) => options,
    getLayerGroups: () => layerGroups,
    getMaps: () => maps,
    layerGroup: () => new MockLayerGroup(),
    map: () => new MockMap(),
    marker: (latLng: [number, number], options: Record<string, unknown>) =>
      createLayer("marker", latLng, options),
    polygon: (_latLngs: unknown, options: Record<string, unknown>) =>
      createLayer("polygon", undefined, options),
    polyline: (_latLngs: unknown, options: Record<string, unknown>) =>
      createLayer("polyline", undefined, options),
    reset: () => {
      maps.length = 0;
      layerGroups.length = 0;
    },
    tileLayer: () => ({
      addTo() {
        return this;
      },
    }),
  };
});

vi.mock("leaflet", () => leafletMock);

vi.mock("@moritzbrantner/maps", () => ({
  ClusteredMap: ({ mapLabel, points }: { mapLabel?: string; points: MockTemporalMapPoint[] }) => {
    const group = leafletMock.layerGroup();

    for (const point of points) {
      leafletMock
        .circleMarker([point.latitude, point.longitude], {
          className: "mb-maps__point-marker",
        })
        .addTo(group);
    }

    return <div aria-label={mapLabel} data-map-ready="true" />;
  },
  HeatMap: ({ mapLabel, points }: { mapLabel?: string; points: MockTemporalMapPoint[] }) => {
    const group = leafletMock.layerGroup();

    for (const point of points) {
      leafletMock
        .circleMarker([point.latitude, point.longitude], {
          className: "mb-maps__heat-marker",
        })
        .addTo(group);
    }

    return <div aria-label={mapLabel} data-map-ready="true" />;
  },
  getTemporalHeatMapMaxWeight: (
    tracks: MockTemporalMapTrack[],
    options: { weightMetric?: string } = {},
  ) =>
    Math.max(
      ...tracks.flatMap((track) =>
        track.frames.map((frame) =>
          options.weightMetric && frame.metrics
            ? Number(frame.metrics[options.weightMetric] ?? 0)
            : 1,
        ),
      ),
    ),
  getTemporalMapPointsAtTime: (tracks: MockTemporalMapTrack[], time: number) =>
    tracks.map((track) => interpolateTrackPoint(track, time)),
  getTemporalMapTimeRange: (tracks: MockTemporalMapTrack[]) => {
    const times = tracks.flatMap((track) => track.frames.map((frame) => frame.time));

    if (!times.length) {
      return null;
    }

    return {
      end: Math.max(...times),
      start: Math.min(...times),
    };
  },
  snapTemporalMapTime: (
    time: number,
    timeRange: { end: number; start: number },
    timeStep: number | "any",
  ) => {
    if (timeStep === "any" || timeStep <= 0) {
      return time;
    }

    return Math.min(
      timeRange.end,
      Math.max(timeRange.start, Math.round(time / timeStep) * timeStep),
    );
  },
}));

type MockTemporalMapPoint = {
  latitude: number;
  longitude: number;
  metrics?: Record<string, number>;
  time: number;
};

type MockTemporalMapTrack = {
  frames: MockTemporalMapPoint[];
};

function interpolateTrackPoint(track: MockTemporalMapTrack, time: number): MockTemporalMapPoint {
  const frames = [...track.frames].sort((left, right) => left.time - right.time);
  const firstFrame = frames[0];
  const lastFrame = frames[frames.length - 1];

  if (!firstFrame || !lastFrame) {
    return { latitude: 0, longitude: 0, time };
  }

  if (time <= firstFrame.time) {
    return firstFrame;
  }

  if (time >= lastFrame.time) {
    return lastFrame;
  }

  const nextFrame = frames.find((frame) => frame.time >= time) ?? lastFrame;
  const previousFrame =
    frames
      .slice()
      .reverse()
      .find((frame) => frame.time <= time) ?? firstFrame;
  const span = nextFrame.time - previousFrame.time;
  const progress = span > 0 ? (time - previousFrame.time) / span : 0;

  return {
    latitude: previousFrame.latitude + (nextFrame.latitude - previousFrame.latitude) * progress,
    longitude: previousFrame.longitude + (nextFrame.longitude - previousFrame.longitude) * progress,
    metrics: nextFrame.metrics ?? previousFrame.metrics,
    time,
  };
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  leafletMock.reset();
  vi.doUnmock("remotion");
});

describe("@moritzbrantner/remotion map adapters", () => {
  test("imports remotion map adapters without browser-only setup", async () => {
    const remotionPackage = await importRemotionPackage({
      durationInFrames: 1,
      frame: 0,
    });

    expect(remotionPackage).toHaveProperty("RemotionClusteredMap");
    expect(remotionPackage).toHaveProperty("RemotionHeatMap");
    expect(remotionPackage).toHaveProperty("getRemotionMapTimeAtFrame");
    expect(remotionPackage).toHaveProperty("RemotionFlatScene");
    expect(remotionPackage).toHaveProperty("sampleFlatSceneAtTime");
  }, 15_000);

  test("maps frames to track time in clamp and loop mode", async () => {
    const { getRemotionMapTimeAtFrame } = await importRemotionPackage({
      durationInFrames: 1,
      frame: 0,
    });

    expect(
      getRemotionMapTimeAtFrame({
        durationInFrames: 30,
        frame: 29,
        timeRange: {
          end: 10,
          start: 0,
        },
      }),
    ).toBe(10);
    expect(
      getRemotionMapTimeAtFrame({
        durationInFrames: 30,
        frame: 30,
        playback: "loop",
        timeRange: {
          end: 10,
          start: 0,
        },
      }),
    ).toBe(0);
  }, 15_000);

  test("renders a frame-driven clustered map from temporal tracks", async () => {
    const { RemotionClusteredMap } = await importRemotionPackage({
      durationInFrames: 25,
      frame: 12,
    });
    const tracks: TemporalMapTrack[] = [
      {
        id: "courier-1",
        frames: [
          {
            latitude: 10,
            longitude: 20,
            time: 0,
          },
          {
            latitude: 20,
            longitude: 40,
            time: 100,
          },
        ],
      },
    ];

    render(
      <RemotionClusteredMap
        mapLabel="Remotion courier map"
        showAttributionControl={false}
        timeStep={10}
        tracks={tracks}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Remotion courier map").getAttribute("data-map-ready")).toBe(
        "true",
      );
    });

    const marker = leafletMock
      .getLayerGroups()[0]
      ?.layers.find((layer) => layer.options?.className === "mb-maps__point-marker");

    expect(marker).toMatchObject({
      latLng: [15, 30],
      type: "circleMarker",
    });
  });

  test("renders a frame-driven heat map from temporal tracks", async () => {
    const { RemotionHeatMap } = await importRemotionPackage({
      durationInFrames: 49,
      frame: 24,
    });
    const tracks: TemporalMapTrack[] = [
      {
        id: "courier-2",
        frames: [
          {
            latitude: 10,
            longitude: 20,
            metrics: {
              demand: 4,
            },
            time: 0,
          },
          {
            latitude: 20,
            longitude: 40,
            metrics: {
              demand: 8,
            },
            time: 100,
          },
        ],
      },
    ];

    render(
      <RemotionHeatMap
        mapLabel="Remotion demand heat map"
        showAttributionControl={false}
        timeStep={10}
        tracks={tracks}
        weightMetric="demand"
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Remotion demand heat map").getAttribute("data-map-ready")).toBe(
        "true",
      );
    });

    const marker = leafletMock
      .getLayerGroups()[0]
      ?.layers.find((layer) => layer.options?.className === "mb-maps__heat-marker");

    expect(marker).toMatchObject({
      latLng: [15, 30],
      type: "circleMarker",
    });
  });

  test("samples flat-design scenes at an explicit time", async () => {
    const { sampleFlatSceneAtTime } = await importRemotionPackage({
      durationInFrames: 3,
      frame: 0,
      fps: 1,
    });
    const scene: FlatDesignScene = {
      width: 320,
      height: 180,
      title: "Sampled cloud",
      background: "#F6F9FF",
      layers: [
        {
          shapes: [
            createFlatCloudFigure({
              id: "hero-cloud",
              x: 160,
              y: 96,
              motion: {
                preset: "bobbing",
                options: { distance: 10, dur: "3s" },
              },
            }),
          ],
        },
      ],
    };

    const sampledScene = sampleFlatSceneAtTime(scene, 1_500);
    const cloud = sampledScene.layers[0]?.shapes[0];

    expect(cloud).toMatchObject({
      id: "hero-cloud",
      transform: "translate(160 96) translate(0 -10)",
    });
    expect(cloud?.animations).toBeUndefined();
    expect(cloud?.motion).toBeUndefined();
  });

  test("renders flat-design scenes from the active remotion frame", async () => {
    const { RemotionFlatScene, getRemotionFlatSceneTimeAtFrame } = await importRemotionPackage({
      durationInFrames: 3,
      frame: 1,
      fps: 1,
    });
    const scene: FlatDesignScene = {
      width: 240,
      height: 160,
      title: "Remotion flat scene",
      background: "#F6F9FF",
      layers: [
        {
          shapes: [
            {
              kind: "rect",
              id: "card",
              x: 24,
              y: 20,
              width: 96,
              height: 64,
              fill: "#2D7FF9",
              transform: "translate(12 0)",
              motion: {
                kind: "timeline",
                durationMs: 3_000,
                keyframes: [
                  { timeMs: 0, x: 0, opacity: 1, scale: 1 },
                  { timeMs: 1_500, x: 18, opacity: 0.5, scale: 1.2 },
                  { timeMs: 3_000, x: 0, opacity: 1, scale: 1 },
                ],
              },
            },
          ],
        },
      ],
    };

    render(<RemotionFlatScene scene={scene} />);

    const svg = screen.getByRole("img", { name: "Remotion flat scene" });
    const card = svg.querySelector("#card");

    expect(
      getRemotionFlatSceneTimeAtFrame({
        durationInFrames: 3,
        fps: 1,
        frame: 1,
      }),
    ).toBe(1_500);
    expect(card?.getAttribute("transform")).toBe("translate(12 0) translate(18 0) scale(1.2)");
    expect(card?.getAttribute("opacity")).toBe("0.5");
    expect(svg.querySelector("animateTransform")).toBeNull();
    expect(svg.querySelector('animate[attributeName="opacity"]')).toBeNull();
  });
});

async function importRemotionPackage({
  durationInFrames,
  frame,
  fps = 30,
}: {
  durationInFrames: number;
  frame: number;
  fps?: number;
}) {
  vi.doMock("remotion", () => ({
    useCurrentFrame: () => frame,
    useVideoConfig: () => ({
      durationInFrames,
      fps,
      height: 1080,
      width: 1920,
    }),
  }));

  return import(".");
}
