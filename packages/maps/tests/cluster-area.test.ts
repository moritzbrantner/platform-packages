import { describe, expect, test } from "vitest";

import {
  clipRingToPolygon,
  createClusterAreaRing,
  createClusterVoronoiBoundarySegments,
  createClusterVoronoiCells,
} from "../src/cluster-area";

describe("@moritzbrantner/maps cluster area", () => {
  test("creates a closed hull ring around a spread of points", () => {
    const ring = createClusterAreaRing(
      [
        [-73.99, 40.71],
        [-73.95, 40.73],
        [-74.02, 40.72],
        [-73.98, 40.76],
      ],
      [-73.985, 40.73],
    );

    expect(ring).not.toBeNull();
    expect(ring!.length).toBeGreaterThanOrEqual(4);
    expect(ring![0]).toEqual(ring!.at(-1));
  });

  test("falls back to a closed area for degenerate point sets", () => {
    const ring = createClusterAreaRing(
      [[13.405, 52.52], [13.405, 52.52]],
      [13.405, 52.52],
    );

    expect(ring).not.toBeNull();
    expect(ring!.length).toBeGreaterThan(4);
    expect(ring![0]).toEqual(ring!.at(-1));
  });

  test("falls back to clipping neighboring cluster areas at the midpoint between centers", () => {
    const cells = createClusterVoronoiCells(
      [
        { clusterId: 1, coordinates: [-1, 0] },
        { clusterId: 2, coordinates: [1, 0] },
      ],
      [-4, -4, 4, 4],
    );
    const leftCell = cells.get(1);
    const clipped = clipRingToPolygon(
      [
        [-3, -2],
        [0.9, -2],
        [0.9, 2],
        [-3, 2],
        [-3, -2],
      ],
      leftCell!,
    );

    expect(leftCell).toBeTruthy();
    expect(clipped).toBeTruthy();
    expect(Math.max(...clipped!.map((point) => point[0]))).toBeLessThanOrEqual(0.001);
    expect(clipped![0]).toEqual(clipped!.at(-1));
  });

  test("clips neighboring cluster areas at the midpoint between cluster boundaries", () => {
    const cells = createClusterVoronoiCells(
      [
        {
          clusterId: 1,
          coordinates: [-3, 0],
          boundary: [
            [-5, -1],
            [-1, -1],
            [-1, 1],
            [-5, 1],
            [-5, -1],
          ],
        },
        {
          clusterId: 2,
          coordinates: [6, 0],
          boundary: [
            [2, -1],
            [5, -1],
            [5, 1],
            [2, 1],
            [2, -1],
          ],
        },
      ],
      [-10, -4, 10, 4],
    );
    const leftCell = cells.get(1);
    const clipped = clipRingToPolygon(
      [
        [-6, -2],
        [1.5, -2],
        [1.5, 2],
        [-6, 2],
        [-6, -2],
      ],
      leftCell!,
    );

    expect(leftCell).toBeTruthy();
    expect(clipped).toBeTruthy();
    expect(Math.max(...clipped!.map((point) => point[0]))).toBeLessThanOrEqual(0.501);
    expect(Math.max(...clipped!.map((point) => point[0]))).toBeGreaterThanOrEqual(0.499);
    expect(clipped![0]).toEqual(clipped!.at(-1));
  });

  test("renders only boundaries between different cluster ids", () => {
    const segments = createClusterVoronoiBoundarySegments(
      [
        { clusterId: 1, coordinates: [-2, 0] },
        { clusterId: 1, coordinates: [0, 0] },
        { clusterId: 2, coordinates: [2, 0] },
      ],
      [-4, -4, 4, 4],
      { includeOuterEdges: false },
    );

    expect(segments).toHaveLength(1);
    expect(segments[0]!.clusterIds).toEqual([1, 2]);
    expect(segments[0]!.clusterIndexes).toEqual([1, 2]);
    expect(segments[0]!.coordinates[0]![0]).toBeCloseTo(1, 6);
    expect(segments[0]!.coordinates[1]![0]).toBeCloseTo(1, 6);
  });

  test("deduplicates shared Voronoi edges", () => {
    const segments = createClusterVoronoiBoundarySegments(
      [
        { clusterId: "left", coordinates: [-1, 0] },
        { clusterId: "right", coordinates: [1, 0] },
      ],
      [-4, -4, 4, 4],
      { includeOuterEdges: false },
    );

    expect(segments).toHaveLength(1);
    expect(segments[0]!.clusterIds).toEqual(["left", "right"]);
    expect(segments[0]!.coordinates[0]![0]).toBeCloseTo(0, 6);
    expect(segments[0]!.coordinates[1]![0]).toBeCloseTo(0, 6);
  });
});
