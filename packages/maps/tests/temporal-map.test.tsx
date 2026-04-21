import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { TemporalClusteredMap, type TemporalMapTrack } from "../src";

const maplibreMock = vi.hoisted(() => {
  type Source = {
    data: unknown;
    setData: (data: unknown) => void;
  };
  type Handler = (...args: unknown[]) => void;

  const maps: MockMap[] = [];

  class MockMap {
    handlers = new Map<string, Handler[]>();
    sources = new Map<string, Source>();
    removed = false;

    constructor() {
      maps.push(this);
      queueMicrotask(() => {
        this.emit("load");
      });
    }

    addControl() {}

    addLayer() {}

    addSource(id: string, source: { data: unknown }) {
      this.sources.set(id, {
        data: source.data,
        setData(data: unknown) {
          this.data = data;
        },
      });
    }

    easeTo() {}

    fitBounds() {}

    getBounds() {
      return {
        getEast: () => 180,
        getNorth: () => 90,
        getSouth: () => -90,
        getWest: () => -180,
      };
    }

    getCanvas() {
      return {
        style: {
          cursor: "",
        },
      };
    }

    getContainer() {
      return {
        clientHeight: 640,
        clientWidth: 960,
      };
    }

    getSource(id: string) {
      return this.sources.get(id);
    }

    getZoom() {
      return 6;
    }

    off() {}

    on(event: string, handler: Handler) {
      const handlers = this.handlers.get(event) ?? [];

      handlers.push(handler);
      this.handlers.set(event, handlers);
    }

    project([lng, lat]: [number, number]) {
      return {
        x: (lng + 180) * 2,
        y: (90 - lat) * 2,
      };
    }

    queryRenderedFeatures() {
      return [];
    }

    remove() {
      this.removed = true;
    }

    unproject([x, y]: [number, number]) {
      return {
        lat: 90 - y / 2,
        lng: x / 2 - 180,
      };
    }

    emit(event: string, ...args: unknown[]) {
      for (const handler of this.handlers.get(event) ?? []) {
        handler(...args);
      }
    }
  }

  return {
    Map: MockMap,
    NavigationControl: class MockNavigationControl {},
    getMaps: () => maps,
    reset: () => {
      maps.length = 0;
    },
  };
});

vi.mock("maplibre-gl", () => ({
  Map: maplibreMock.Map,
  NavigationControl: maplibreMock.NavigationControl,
}));

afterEach(() => {
  maplibreMock.reset();
});

describe("@moritzbrantner/maps TemporalClusteredMap", () => {
  test("renders timeline controls and slices track points into the map source", async () => {
    const tracks: TemporalMapTrack<{ status: string }>[] = [
      {
        id: "courier-1",
        label: "Courier 1",
        frames: [
          {
            latitude: 10,
            longitude: 20,
            metrics: {
              load: 2,
            },
            properties: {
              status: "dispatching",
            },
            time: 0,
          },
          {
            latitude: 20,
            longitude: 40,
            metrics: {
              load: 6,
            },
            properties: {
              status: "en-route",
            },
            time: 10,
          },
        ],
      },
    ];

    render(
      <TemporalClusteredMap
        defaultTime={5}
        formatTimeLabel={(time) => `T${time}`}
        mapLabel="Courier timeline"
        showAttributionControl={false}
        timeStep={5}
        tracks={tracks}
      />,
    );

    expect(screen.getByLabelText("Courier timeline").getAttribute("data-map-ready")).toBe(
      "false",
    );
    expect((screen.getByRole("button", { name: "Play" }) as HTMLButtonElement).disabled).toBe(
      false,
    );
    expect(screen.getByText("T5")).toBeTruthy();
    expect(
      (screen.getByRole("slider", { name: "Timeline" }) as HTMLInputElement).value,
    ).toBe("5");

    await waitFor(() => {
      expect(screen.getByLabelText("Courier timeline").getAttribute("data-map-ready")).toBe(
        "true",
      );
    });

    const source = maplibreMock.getMaps()[0]?.sources.get(
      "moritzbrantner-maps-source",
    );
    const data = source?.data as
      | {
          features: Array<{
            geometry?: {
              coordinates?: unknown;
              type?: string;
            };
            properties?: Record<string, unknown>;
            type?: string;
          }>;
          type: string;
        }
      | undefined;
    const pointFeature = data?.features.find(
      (feature) => feature.properties?.kind === "point",
    );

    expect(data?.type).toBe("FeatureCollection");
    expect(pointFeature).toMatchObject({
      geometry: {
        coordinates: [30, 15],
        type: "Point",
      },
      properties: {
        kind: "point",
        load: 4,
        pointId: "courier-1",
      },
      type: "Feature",
    });
  });

  test("snaps slider changes and reports the active time", async () => {
    const onTimeChange = vi.fn();
    const tracks: TemporalMapTrack[] = [
      {
        id: "courier-2",
        frames: [
          {
            latitude: 0,
            longitude: 0,
            time: 0,
          },
          {
            latitude: 10,
            longitude: 10,
            time: 20,
          },
        ],
      },
    ];

    render(
      <TemporalClusteredMap
        defaultTime={0}
        formatTimeLabel={(time) => `Minute ${time}`}
        onTimeChange={onTimeChange}
        timeStep={10}
        tracks={tracks}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByLabelText("Interactive timeline map").getAttribute("data-map-ready"),
      ).toBe("true");
    });

    fireEvent.change(screen.getByRole("slider", { name: "Timeline" }), {
      target: {
        value: "17",
      },
    });

    expect(
      (screen.getByRole("slider", { name: "Timeline" }) as HTMLInputElement).value,
    ).toBe("10");
    expect(screen.getByText("Minute 10")).toBeTruthy();
    await waitFor(() => {
      expect(onTimeChange).toHaveBeenLastCalledWith(10);
    });
  });
});
