import { describe, expect, test } from "vitest";

import {
  createChartDensityIndex,
  createChartDensitySample,
  createChartDensityViewportSummary,
  createProgressiveChartDensityIndex,
  type ChartDensityValueMode,
} from "@moritzbrantner/charts";

describe("@moritzbrantner/charts", () => {
  test("adapts data-density bins into chart samples", () => {
    const index = createChartDensityIndex(
      Array.from({ length: 12 }, (_, pointIndex) => ({
        id: `point-${pointIndex}`,
        metrics: { orders: 1 },
        x: pointIndex,
        y: pointIndex % 4,
      })),
    );

    const series = index.getChartSeries({
      targetBinCount: 3,
      valueMode: "count",
      xDomain: [0, 11],
    });

    expect(series.samples).toHaveLength(3);
    expect(series.summary.pointCount).toBe(12);
    expect(series.summary.metrics.orders).toBe(12);
    expect(series.summary.valueMode).toBe("count");
    expect(series.samples.map((sample) => sample.y)).toEqual([4, 4, 4]);
    expect(createChartDensityViewportSummary(series)).toMatchObject({
      binCount: 3,
      itemCount: 12,
      kind: "chart",
      metricKeys: ["orders"],
      metrics: { orders: 12 },
      sampleCount: 3,
      valueMode: "count",
      xDomain: [0, 11],
    });
    expect(index.getPointById("point-5")?.y).toBe(1);
  });

  test("derives a renderable sample from a single bin", () => {
    const index = createChartDensityIndex([
      { id: "a", x: 0, y: 2 },
      { id: "b", x: 1, y: 6 },
    ]);
    const [bin] = index.getBinnedSeries({ targetBinCount: 1, xDomain: [0, 1] }).bins;
    const sample = createChartDensitySample(bin!, "average");

    expect(sample.x).toBe(0.5);
    expect(sample.y).toBe(4);
    expect(sample.minY).toBe(2);
    expect(sample.maxY).toBe(6);
  });

  test("keeps chart samples in parity across density backends", () => {
    const points = [
      { id: "b", x: 5, y: 10, metrics: { orders: 1 } },
      { id: "a", x: 0, y: 2, metrics: { orders: 1 } },
      { id: "c", x: 5, y: -2, metrics: { orders: 1 } },
      { id: "d", x: 20, y: 8, metrics: { orders: 1 } },
      { id: "invalid", x: Number.NaN, y: 100, metrics: { orders: 100 } },
    ];
    const hybrid = createChartDensityIndex(points, { backend: "hybrid-js" });
    const wasm = createChartDensityIndex(points, { backend: "wasm-index" });
    const valueModes: ChartDensityValueMode[] = ["average", "count", "max", "min", "sum"];

    for (const valueMode of valueModes) {
      const query = {
        includeEmptyBins: true,
        targetBinCount: 4,
        valueMode,
        xDomain: [20, 0] as [number, number],
      };

      expect(wasm.getChartSeries(query)).toEqual(hybrid.getChartSeries(query));
      expect(createChartDensityViewportSummary(wasm.getChartSeries(query))).toEqual(
        createChartDensityViewportSummary(hybrid.getChartSeries(query)),
      );
    }
  });

  test("creates high-volume chart samples through the dense-data WASM backend", () => {
    const points = Array.from({ length: 5_000 }, (_, pointIndex) => ({
      id: `point-${pointIndex}`,
      metrics: {
        orders: 1,
        revenue: pointIndex % 37,
        unstable: pointIndex % 2 === 0 ? Number.NaN : pointIndex,
      },
      properties: {
        segment: pointIndex % 5,
      },
      x: pointIndex % 2 === 0 ? pointIndex : 5_000 - pointIndex,
      y: Math.sin(pointIndex / 10) * 25 + (pointIndex % 13),
    }));
    const snapshot = structuredClone(points);
    const expectedPoints = points.filter((point) => point.id !== "point-17");
    const index = createChartDensityIndex(
      [
        ...points,
        {
          id: "invalid",
          metrics: { orders: 100, revenue: 100 },
          properties: { segment: 0 },
          x: Number.NaN,
          y: 10,
        },
      ],
      {
        backend: "wasm-index",
        filterPoint(point) {
          return point.id !== "point-17";
        },
      },
    );

    const series = index.getChartSeries({
      includeEmptyBins: true,
      targetBinCount: 128,
      valueMode: "average",
      xDomain: [0, 5_000],
    });

    expect(series.samples).toHaveLength(128);
    expect(series.summary.binCount).toBe(128);
    expect(series.summary.pointCount).toBe(expectedPoints.length);
    expect(series.summary.metrics.orders).toBe(expectedPoints.length);
    expect(series.summary.metrics.revenue).toBe(
      expectedPoints.reduce((total, point) => total + point.metrics.revenue, 0),
    );
    expect(series.summary.metrics.unstable).toBe(
      expectedPoints
        .filter((point) => Number.isFinite(point.metrics.unstable))
        .reduce((total, point) => total + point.metrics.unstable, 0),
    );
    expect(series.samples.every((sample) => sample.x >= sample.x0 && sample.x <= sample.x1)).toBe(
      true,
    );
    expect(createChartDensityViewportSummary(series)).toMatchObject({
      binCount: 128,
      itemCount: expectedPoints.length,
      kind: "chart",
      metricKeys: ["orders", "revenue", "unstable"],
      sampleCount: 128,
      valueMode: "average",
    });
    expect(index.getPointById("point-2500")?.properties.segment).toBe(0);
    expect(index.getPointById("invalid")).toBeNull();
    expect(points).toEqual(snapshot);
  });

  test("keeps dense-data-backed chart value modes correct with empty and duplicate bins", () => {
    const index = createChartDensityIndex(
      [
        { id: "a", metrics: { count: 1 }, x: 0, y: 2 },
        { id: "b", metrics: { count: 1 }, x: 0, y: 8 },
        { id: "c", metrics: { count: 1 }, x: 20, y: -4 },
      ],
      { backend: "wasm-index" },
    );
    const query = {
      includeEmptyBins: true,
      targetBinCount: 4,
      xDomain: [0, 40] as [number, number],
    };

    expect(
      index.getChartSeries({ ...query, valueMode: "average" }).samples.map((sample) => sample.y),
    ).toEqual([5, null, -4, null]);
    expect(
      index.getChartSeries({ ...query, valueMode: "count" }).samples.map((sample) => sample.y),
    ).toEqual([2, null, 1, null]);
    expect(
      index.getChartSeries({ ...query, valueMode: "max" }).samples.map((sample) => sample.y),
    ).toEqual([8, null, -4, null]);
    expect(
      index.getChartSeries({ ...query, valueMode: "min" }).samples.map((sample) => sample.y),
    ).toEqual([2, null, -4, null]);
    expect(
      index.getChartSeries({ ...query, valueMode: "sum" }).samples.map((sample) => sample.y),
    ).toEqual([10, null, -4, null]);
  });

  test("progressively renders with hybrid-js and switches to wasm-index after warmup", async () => {
    const scheduledWarmups: Array<() => void> = [];
    const points = Array.from({ length: 200 }, (_, pointIndex) => ({
      id: `point-${pointIndex}`,
      metrics: { count: 1, revenue: pointIndex % 9 },
      x: pointIndex % 2 === 0 ? pointIndex : 200 - pointIndex,
      y: pointIndex % 17,
    }));
    const index = createProgressiveChartDensityIndex(points, {
      progressive: {
        scheduler(warmup) {
          scheduledWarmups.push(warmup);
        },
      },
    });
    const query = {
      includeEmptyBins: true,
      targetBinCount: 16,
      valueMode: "average" as const,
      xDomain: [0, 200] as [number, number],
    };
    const firstSeries = index.getChartSeries(query);

    expect(index.getProgressiveStatus()).toMatchObject({
      activeBackend: "hybrid-js",
      isWarming: false,
      wasmReady: false,
    });
    expect(firstSeries.summary.pointCount).toBe(200);
    expect(scheduledWarmups).toHaveLength(1);

    scheduledWarmups[0]?.();
    await index.whenWasmReady();

    expect(index.getProgressiveStatus()).toMatchObject({
      activeBackend: "wasm-index",
      isWarming: false,
      wasmError: null,
      wasmReady: true,
    });
    expect(index.getChartSeries(query)).toEqual(firstSeries);
  });

  test("can defer wasm-index construction until an interaction warms it manually", async () => {
    const index = createProgressiveChartDensityIndex(
      Array.from({ length: 50 }, (_, pointIndex) => ({
        id: `point-${pointIndex}`,
        metrics: { count: 1 },
        x: pointIndex,
        y: pointIndex % 5,
      })),
      {
        progressive: {
          warmup: "manual",
        },
      },
    );

    expect(index.getActiveBackend()).toBe("hybrid-js");
    expect(index.getChartSeries({ targetBinCount: 5, xDomain: [0, 49] }).summary.pointCount).toBe(
      50,
    );

    await index.warmWasmIndex();

    expect(index.getActiveBackend()).toBe("wasm-index");
    expect(index.getPointById("point-20")?.y).toBe(0);
  });
});
