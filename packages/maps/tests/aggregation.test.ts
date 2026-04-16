import { describe, expect, test } from "vitest";

import { createPointAggregationIndex, getBoundsFromPoints, type MapPoint } from "../src";

type TestPoint = MapPoint<{
  city: string;
}>;

describe("@moritzbrantner/maps aggregation", () => {
  test("aggregates metric totals into clusters and preserves visible counts", () => {
    const index = createPointAggregationIndex<{ city: string }>([
      {
        id: "a",
        latitude: 40.7128,
        longitude: -74.006,
        metrics: { demand: 8, revenue: 1200 },
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
    ]);

    const aggregation = index.getViewportAggregation({
      bounds: [-180, -85, 180, 85],
      zoom: 2,
    });

    expect(aggregation.summary.visiblePointCount).toBe(3);
    expect(aggregation.summary.metrics.revenue).toBe(2400);
    expect(aggregation.features.some((feature) => feature.kind === "cluster")).toBe(true);
  });

  test("returns cluster leaves as original points", () => {
    const points = Array.from({ length: 20 }, (_, index) => ({
      id: `point-${index}`,
      latitude: 52.52 + index * 0.0002,
      longitude: 13.405 + index * 0.0002,
      metrics: { orders: 1 },
      properties: { city: "Berlin" },
    }));
    const index = createPointAggregationIndex(points);
    const aggregation = index.getViewportAggregation({
      bounds: [13.3, 52.4, 13.6, 52.7],
      zoom: 4,
    });
    const cluster = aggregation.features.find((feature) => feature.kind === "cluster");

    expect(cluster?.kind).toBe("cluster");

    const leaves = index.getClusterLeaves(cluster!.clusterId, 5, 0);

    expect(leaves).toHaveLength(5);
    expect(leaves[0]?.properties.city).toBe("Berlin");
  });

  test("keeps totals intact for large datasets", () => {
    const points = createSyntheticPoints(100_000);
    const index = createPointAggregationIndex(points, {
      radius: 64,
    });
    const aggregation = index.getViewportAggregation({
      bounds: [-180, -85, 180, 85],
      zoom: 1,
    });

    expect(aggregation.summary.visiblePointCount).toBe(100_000);
    expect(aggregation.summary.metrics.weight).toBe(5_050_000);
  });

  test("computes a bounding box from raw points", () => {
    const bounds = getBoundsFromPoints([
      { latitude: 10, longitude: 20 },
      { latitude: 14, longitude: 18 },
      { latitude: 9, longitude: 22 },
    ]);

    expect(bounds).toEqual([18, 9, 22, 14]);
  });
});

function createSyntheticPoints(count: number): TestPoint[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    latitude: -70 + (index % 140) * 0.9,
    longitude: -160 + (index % 320) * 1,
    metrics: { weight: 50.5 },
    properties: { city: "Synthetic" },
  }));
}
