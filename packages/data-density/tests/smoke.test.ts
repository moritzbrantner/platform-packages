import { describe, expect, test } from "vitest";

import {
  collectDensityMetricKeys,
  createBinnedSeriesIndex,
  createDataDensityWindowIndex,
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
    expect(getBoundsFromGeoPoints(points)).toEqual([-118.2437, 34.0522, -74.002, 40.7134]);
  });
});
