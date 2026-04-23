import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { TemporalMapTrack } from "../src";

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

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  leafletMock.reset();
  vi.doUnmock("remotion");
});

describe("@moritzbrantner/remotion map adapters", () => {
  test("imports remotion map adapters without browser-only setup", async () => {
    const remotionMaps = await importRemotionMaps({
      durationInFrames: 1,
      frame: 0,
    });

    expect(remotionMaps).toHaveProperty("RemotionClusteredMap");
    expect(remotionMaps).toHaveProperty("RemotionHeatMap");
    expect(remotionMaps).toHaveProperty("getRemotionMapTimeAtFrame");
  });

  test("maps frames to track time in clamp and loop mode", async () => {
    const { getRemotionMapTimeAtFrame } = await importRemotionMaps({
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
  });

  test("renders a frame-driven clustered map from temporal tracks", async () => {
    const { RemotionClusteredMap } = await importRemotionMaps({
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
    const { RemotionHeatMap } = await importRemotionMaps({
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
      expect(
        screen.getByLabelText("Remotion demand heat map").getAttribute("data-map-ready"),
      ).toBe("true");
    });

    const marker = leafletMock
      .getLayerGroups()[0]
      ?.layers.find((layer) => layer.options?.className === "mb-maps__heat-marker");

    expect(marker).toMatchObject({
      latLng: [15, 30],
      type: "circleMarker",
    });
  });
});

async function importRemotionMaps({
  durationInFrames,
  frame,
}: {
  durationInFrames: number;
  frame: number;
}) {
  vi.doMock("remotion", () => ({
    useCurrentFrame: () => frame,
    useVideoConfig: () => ({
      durationInFrames,
      fps: 30,
      height: 1080,
      width: 1920,
    }),
  }));

  return import("../src");
}
