import { describe, expect, test } from "vitest";

import {
  createChartDensityIndex,
  createChartDensitySample,
  createChartDensityViewportSummary,
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
});
