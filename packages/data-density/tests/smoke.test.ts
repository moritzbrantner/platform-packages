import { describe, expect, test } from "vitest";

import {
  collectDensityMetricKeys,
  createBinnedSeriesIndex,
  createDataDensityWindowIndex,
  createDensityMetricSummary,
  createDensityViewportSummary,
  createGeoDensityViewportSummary,
  createGeoPointAggregationIndex,
  getBoundsFromGeoPoints,
  sumDensityMetrics,
  type GeoDensityPoint,
} from "@moritzbrantner/data-density";

describe("@moritzbrantner/data-density", () => {
  test("normalizes and sums metric records", () => {
    const metricKeys = collectDensityMetricKeys([
      { orders: 2, revenue: 30 },
      { orders: 1, margin: 8 },
    ]);

    expect(metricKeys).toEqual(["margin", "orders", "revenue"]);
    expect(
      sumDensityMetrics(
        [
          { orders: 2, revenue: 30 },
          { orders: 1, margin: 8 },
        ],
        metricKeys,
      ),
    ).toEqual({ margin: 8, orders: 3, revenue: 30 });
    expect(
      createDensityMetricSummary([{ orders: 2 }, { orders: 3, revenue: 10 }]),
    ).toEqual({
      itemCount: 2,
      metricKeys: ["orders", "revenue"],
      metrics: { orders: 5, revenue: 10 },
    });
    expect(createDensityViewportSummary("table", [{ rows: 4 }])).toEqual({
      itemCount: 1,
      kind: "table",
      metricKeys: ["rows"],
      metrics: { rows: 4 },
    });
  });

  test("creates overscanned windows for large ordered data", () => {
    const index = createDataDensityWindowIndex(
      Array.from({ length: 1_000 }, (_, rowIndex) => ({
        id: `row-${rowIndex}`,
        metrics: { value: rowIndex },
        status: rowIndex % 2 === 0 ? "open" : "closed",
      })),
      {
        filterItem(row) {
          return row.status === "open";
        },
      },
    );
    const window = index.getWindow({ limit: 10, offset: 20, overscan: 2 });

    expect(window.items).toHaveLength(14);
    expect(window.items[0]?.id).toBe("row-36");
    expect(window.summary.totalItemCount).toBe(1_000);
    expect(window.summary.filteredItemCount).toBe(500);
    expect(window.summary.metrics.value).toBe(686);
    expect(index.getItemById("row-40")?.item.status).toBe("open");
  });

  test("bins numeric series into chart-sized summaries", () => {
    const index = createBinnedSeriesIndex(
      Array.from({ length: 100 }, (_, pointIndex) => ({
        id: pointIndex,
        metrics: { weight: 1 },
        x: pointIndex,
        y: pointIndex % 10,
      })),
    );
    const series = index.getBinnedSeries({
      targetBinCount: 5,
      xDomain: [0, 99],
    });

    expect(series.bins).toHaveLength(5);
    expect(series.summary.pointCount).toBe(100);
    expect(series.summary.metrics.weight).toBe(100);
    expect(series.bins[0]?.pointCount).toBe(20);
    expect(series.bins[0]?.minY).toBe(0);
    expect(series.bins[0]?.maxY).toBe(9);
    expect(index.getSeriesBounds()).toEqual({
      maxX: 99,
      maxY: 9,
      minX: 0,
      minY: 0,
    });
  });

  test("keeps empty windows and empty bins deterministic at viewport edges", () => {
    const windowIndex = createDataDensityWindowIndex([{ id: "row-a", metrics: { value: 2 } }]);

    expect(windowIndex.getWindow({ limit: 10, offset: 20 })).toMatchObject({
      items: [],
      summary: {
        endIndex: 1,
        filteredItemCount: 1,
        startIndex: 1,
        totalItemCount: 1,
        visibleItemCount: 0,
      },
    });

    const series = createBinnedSeriesIndex([
      { id: "a", x: 0, y: 2, metrics: { weight: 4 } },
      { id: "b", x: 10, y: 6, metrics: { weight: 8 } },
    ]).getBinnedSeries({
      includeEmptyBins: true,
      targetBinCount: 4,
      xDomain: [0, 20],
    });

    expect(series.bins).toHaveLength(4);
    expect(series.bins.map((bin) => bin.pointCount)).toEqual([1, 0, 1, 0]);
    expect(series.summary.metrics.weight).toBe(12);
  });

  test("aggregates high-volume series deterministically without mutating input points", () => {
    const points = Array.from({ length: 1_000 }, (_, index) => ({
      id: `point-${index}`,
      x: index,
      y: index % 7,
      metrics: { count: 1, weighted: index },
    }));
    const snapshot = structuredClone(points);
    const index = createBinnedSeriesIndex(points);
    const first = index.getBinnedSeries({ targetBinCount: 10, xDomain: [0, 999] });
    const second = index.getBinnedSeries({ targetBinCount: 10, xDomain: [0, 999] });

    expect(first).toEqual(second);
    expect(first.summary.metrics.count).toBe(1_000);
    expect(first.summary.metrics.weighted).toBe(499_500);
    expect(points).toEqual(snapshot);
  });

  test("clusters geographic points while preserving metric totals", () => {
    const points: Array<GeoDensityPoint<{ city: string }>> = [
      {
        id: "a",
        latitude: 40.7128,
        longitude: -74.006,
        metrics: { demand: 8, revenue: 1_200 },
        properties: { city: "New York" },
      },
      {
        id: "b",
        latitude: 40.7134,
        longitude: -74.002,
        metrics: { demand: 5, revenue: 900 },
        properties: { city: "New York" },
      },
      {
        id: "c",
        latitude: 34.0522,
        longitude: -118.2437,
        metrics: { demand: 2, revenue: 300 },
        properties: { city: "Los Angeles" },
      },
    ];
    const index = createGeoPointAggregationIndex(points);
    const aggregation = index.getViewportAggregation({
      bounds: [-180, -85, 180, 85],
      zoom: 2,
    });

    expect(aggregation.summary.visiblePointCount).toBe(3);
    expect(aggregation.summary.metrics.revenue).toBe(2_400);
    expect(aggregation.features.some((feature) => feature.kind === "cluster")).toBe(true);
    expect(createGeoDensityViewportSummary(aggregation)).toMatchObject({
      itemCount: 3,
      kind: "map",
      metricKeys: ["demand", "revenue"],
      metrics: { demand: 15, revenue: 2_400 },
      visiblePointCount: 3,
      zoom: 2,
    });
    expect(getBoundsFromGeoPoints(points)).toEqual([-118.2437, 34.0522, -74.002, 40.7134]);
  });
});
