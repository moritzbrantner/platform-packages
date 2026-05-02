import { describe, expect, test } from "vitest";

import {
  aggregatePointsToHexGrid,
  areHexCellsNeighbors,
  compactHexCells,
  expandHexCells,
  getHexCell,
  getHexCellFeature,
  getHexCellsForPolygon,
  getHexCellsInDisk,
  getHexGridPath,
  isValidHexCell,
  pointToHexCell,
  type GeoJsonLinearRing,
} from "@moritzbrantner/hexagon-grids";

describe("@moritzbrantner/hexagon-grids", () => {
  test("indexes geographic points into valid globe-aware hex cells", () => {
    const berlinCell = pointToHexCell({ latitude: 52.52, longitude: 13.405 }, 7);
    const descriptor = getHexCell(berlinCell);
    const feature = getHexCellFeature(berlinCell, { city: "Berlin" });

    expect(isValidHexCell(berlinCell)).toBe(true);
    expect(descriptor.resolution).toBe(7);
    expect(descriptor.center.latitude).toBeGreaterThan(52);
    expect(descriptor.center.latitude).toBeLessThan(53);
    expect(descriptor.center.longitude).toBeGreaterThan(13);
    expect(descriptor.center.longitude).toBeLessThan(14);
    expect(descriptor.boundary[0]).toEqual(descriptor.boundary.at(-1));
    expect(feature.geometry.type).toBe("Polygon");
    expect(feature.properties.city).toBe("Berlin");
  });

  test("covers polygons and supports compaction round-trips", () => {
    const outer = closedRing([
      [13.3, 52.45],
      [13.54, 52.45],
      [13.54, 52.62],
      [13.3, 52.62],
    ]);
    const hole = closedRing([
      [13.39, 52.5],
      [13.45, 52.5],
      [13.45, 52.55],
      [13.39, 52.55],
    ]);

    const polygonCells = getHexCellsForPolygon({ type: "Polygon", coordinates: [outer] }, 8);
    const polygonWithHoleCells = getHexCellsForPolygon(
      { type: "Polygon", coordinates: [outer, hole] },
      8,
    );
    const compactedCells = compactHexCells(polygonCells);
    const expandedCells = expandHexCells(compactedCells, 8);

    expect(polygonCells.length).toBeGreaterThan(0);
    expect(polygonWithHoleCells.length).toBeLessThan(polygonCells.length);
    expect(new Set(expandedCells)).toEqual(new Set(polygonCells));
  });

  test("returns neighborhoods and grid paths across the H3 lattice", () => {
    const centerCell = pointToHexCell({ latitude: 40.7128, longitude: -74.006 }, 7);
    const disk = getHexCellsInDisk(centerCell, 1);
    const neighbor = disk.find((cellId) => cellId !== centerCell);
    const path = getHexGridPath(centerCell, neighbor!);

    expect(disk).toHaveLength(7);
    expect(neighbor).toBeTruthy();
    expect(areHexCellsNeighbors(centerCell, neighbor!)).toBe(true);
    expect(path).toEqual([centerCell, neighbor]);
  });

  test("aggregates points and metrics into hex cells", () => {
    const aggregation = aggregatePointsToHexGrid(
      [
        {
          id: "berlin-a",
          latitude: 52.52,
          longitude: 13.405,
          metrics: { orders: 2, revenue: 30 },
          properties: { city: "Berlin" },
        },
        {
          id: "berlin-b",
          latitude: 52.5205,
          longitude: 13.4055,
          metrics: { orders: 1, revenue: 20 },
          properties: { city: "Berlin" },
        },
        {
          id: "paris-a",
          latitude: 48.8566,
          longitude: 2.3522,
          metrics: { orders: 4, revenue: 50 },
          properties: { city: "Paris" },
        },
      ],
      8,
    );

    expect(aggregation.pointCount).toBe(3);
    expect(aggregation.cellCount).toBe(2);
    expect(aggregation.metrics.orders).toBe(7);
    expect(aggregation.metrics.revenue).toBe(100);
    expect(aggregation.cells[0]?.pointCount).toBe(2);
    expect(aggregation.cells[0]?.metrics.orders).toBe(3);
  });
});

function closedRing(points: GeoJsonLinearRing): GeoJsonLinearRing {
  return [...points, points[0]];
}
