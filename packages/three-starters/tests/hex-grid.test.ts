import { describe, expect, test } from "vitest";

import {
  createHexGridLayout,
  createHoneycombCellGeometry,
  createHoneycombCellShape,
  getHexTileNavigationNeighborIndex,
  getHexGridCellTransform,
  getHexGridCellPosition,
} from "@moritzbrantner/three-starters";

describe("@moritzbrantner/three-starters", () => {
  test("builds centered hex-grid offsets for a honeycomb lattice", () => {
    const layout = createHexGridLayout({
      rows: 2,
      columns: 3,
      radius: 1,
      gap: 0,
    });

    expect(layout.cells).toHaveLength(6);
    expect(layout.width).toBeCloseTo(5, 6);
    expect(layout.height).toBeCloseTo((5 * Math.sqrt(3)) / 2, 6);

    const firstCell = layout.cells[0];
    const lastCell = layout.cells.at(-1);

    expect(firstCell?.row).toBe(0);
    expect(firstCell?.column).toBe(0);
    expect(lastCell?.row).toBe(1);
    expect(lastCell?.column).toBe(2);
    expect(firstCell?.offset[0]).toBeCloseTo(-1.5, 6);
    expect(lastCell?.offset[0]).toBeCloseTo(1.5, 6);
  });

  test("creates reusable honeycomb geometry with centered depth", () => {
    const geometry = createHoneycombCellGeometry({
      radius: 2,
      wallThickness: 0.5,
      depth: 0.75,
    });

    geometry.computeBoundingBox();

    expect(geometry.boundingBox?.min.z).toBeCloseTo(-0.375, 6);
    expect(geometry.boundingBox?.max.z).toBeCloseTo(0.375, 6);
    expect(geometry.boundingBox?.max.x).toBeCloseTo(Math.sqrt(3), 6);
  });

  test("maps grid offsets onto the requested plane", () => {
    const positionXY = getHexGridCellPosition({ offset: [2, 3] }, "xy");
    const positionXZ = getHexGridCellPosition({ offset: [2, 3] }, "xz");
    const positionYZ = getHexGridCellPosition({ offset: [2, 3] }, "yz");

    expect(positionXY).toEqual([2, 3, 0]);
    expect(positionXZ).toEqual([2, 0, 3]);
    expect(positionYZ).toEqual([0, 2, 3]);
  });

  test("computes a cell transform that lifts each tile by half its height", () => {
    const transform = getHexGridCellTransform({ offset: [2, 3] }, 1.6);

    expect(transform.position).toEqual([2, 3, 0.8]);
    expect(transform.scale).toEqual([1, 1, 1.6]);
  });

  test("rejects invalid honeycomb wall thickness", () => {
    expect(() =>
      createHoneycombCellShape({
        radius: 1,
        wallThickness: 1,
      }),
    ).toThrow("wallThickness must be smaller than radius");
  });

  test("rejects invalid tile heights", () => {
    expect(() => getHexGridCellTransform({ offset: [0, 0] }, -0.1)).toThrow(
      "height must be zero or a positive number",
    );
  });

  test("skips incomplete slots when moving through the navigation grid", () => {
    expect(getHexTileNavigationNeighborIndex(2, "right", 5, 3)).toBe(2);
    expect(getHexTileNavigationNeighborIndex(1, "down", 5, 3)).toBe(4);
    expect(getHexTileNavigationNeighborIndex(4, "left", 5, 3)).toBe(3);
  });

  test("supports six-direction hex traversal for staggered columns", () => {
    expect(getHexTileNavigationNeighborIndex(1, "up-left", 5, 3)).toBe(0);
    expect(getHexTileNavigationNeighborIndex(1, "up-right", 5, 3)).toBe(2);
    expect(getHexTileNavigationNeighborIndex(1, "down-left", 5, 3)).toBe(3);
    expect(getHexTileNavigationNeighborIndex(3, "up-right", 5, 3)).toBe(1);
    expect(getHexTileNavigationNeighborIndex(0, "down-right", 5, 3)).toBe(1);
  });

  test("keeps the current tile when a hex-direction neighbor is out of bounds", () => {
    expect(getHexTileNavigationNeighborIndex(0, "up-left", 5, 3)).toBe(0);
    expect(getHexTileNavigationNeighborIndex(2, "up-right", 5, 3)).toBe(2);
    expect(getHexTileNavigationNeighborIndex(4, "down-right", 5, 3)).toBe(4);
  });
});
