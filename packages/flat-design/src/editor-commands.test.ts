import { describe, expect, test } from "vitest";

import { listFlatNodes } from "./core";
import {
  applyFlatEditorCommand,
  createFlatPrimitive,
  getFlatShapeBounds,
  normalizeFlatNodeRefs,
  resizeFlatShape,
  rotateFlatShape,
  translateFlatShape,
} from "./editor-commands";
import type { FlatDesignScene, FlatNodeRef } from "./scene-types";

function createScene(): FlatDesignScene {
  return {
    width: 320,
    height: 200,
    layers: [
      {
        id: "art",
        shapes: [
          { kind: "rect", id: "card", x: 10, y: 20, width: 80, height: 40, fill: "#fff" },
          { kind: "circle", id: "dot", cx: 150, cy: 80, r: 20, fill: "#000" },
        ],
      },
      { id: "details", shapes: [] },
    ],
  };
}

const cardRef: FlatNodeRef = { layerIndex: 0, path: [0] };
const dotRef: FlatNodeRef = { layerIndex: 0, path: [1] };

describe("flat-design editor commands", () => {
  test("creates every primitive with editable geometry", () => {
    for (const primitive of ["rect", "circle", "ellipse", "line", "polygon", "path"] as const) {
      const shape = createFlatPrimitive(primitive, `${primitive}-1`, 12, 18);
      expect(shape.kind).toBe(primitive);
      expect(shape.id).toBe(`${primitive}-1`);
      expect(getFlatShapeBounds(shape)).toBeDefined();
    }
  });

  test("translates in rendered parent coordinates without rewriting source geometry", () => {
    const source = {
      kind: "rect" as const,
      id: "rect",
      x: 10,
      y: 20,
      width: 96,
      height: 64,
      transform: "scale(2)",
    };
    const translated = translateFlatShape(source, 8, -4);

    expect(source.transform).toBe("scale(2)");
    expect(translated).toMatchObject({ x: 10, y: 20, width: 96, height: 64 });
    expect(translated.transform).toBe("translate(8 -4) scale(2)");
  });

  test("resizes by adding an outer scale around the geometry bounds", () => {
    const source = createFlatPrimitive("rect", "rect", 10, 20);
    const resized = resizeFlatShape(source, 192, 32);

    expect(resized).toMatchObject({ kind: "rect", x: 10, y: 20, width: 96, height: 64 });
    expect(resized.transform).toBe("translate(10 20) scale(2 0.5) translate(-10 -20)");
  });

  test("adds rotation in parent space without deleting existing transforms", () => {
    const source = {
      kind: "rect" as const,
      x: 10,
      y: 20,
      width: 80,
      height: 40,
      transform: "scale(2)",
    };
    const rotated = rotateFlatShape(source, 30, { x: 50, y: 40 });

    expect(rotated.transform).toBe("rotate(30 50 40) scale(2)");
  });

  test("normalizes overlapping group selections before destructive commands", () => {
    const refs = normalizeFlatNodeRefs([
      { layerIndex: 0, path: [0] },
      { layerIndex: 0, path: [0, 1] },
      { layerIndex: 0, path: [0] },
    ]);

    expect(refs).toEqual([{ layerIndex: 0, path: [0] }]);
  });

  test("groups and ungroups siblings deterministically", () => {
    const grouped = applyFlatEditorCommand(createScene(), {
      kind: "group",
      refs: [cardRef, dotRef],
      id: "pair",
    });

    expect(grouped.layers[0]?.shapes).toHaveLength(1);
    expect(grouped.layers[0]?.shapes[0]).toMatchObject({
      kind: "group",
      id: "pair",
      children: [expect.objectContaining({ id: "card" }), expect.objectContaining({ id: "dot" })],
    });

    const ungrouped = applyFlatEditorCommand(grouped, {
      kind: "ungroup",
      ref: { layerIndex: 0, path: [0] },
    });
    expect(ungrouped.layers[0]?.shapes.map((shape) => shape.id)).toEqual(["card", "dot"]);
  });

  test("duplicates complete subtrees with document-wide unique IDs", () => {
    const grouped = applyFlatEditorCommand(createScene(), {
      kind: "group",
      refs: [cardRef, dotRef],
      id: "pair",
    });
    const duplicatedOnce = applyFlatEditorCommand(grouped, {
      kind: "duplicate",
      refs: [{ layerIndex: 0, path: [0] }],
    });
    const duplicatedTwice = applyFlatEditorCommand(duplicatedOnce, {
      kind: "duplicate",
      refs: [{ layerIndex: 0, path: [1] }],
    });
    const ids = listFlatNodes(duplicatedTwice)
      .map((node) => node.id)
      .filter((id): id is string => Boolean(id));

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(
      expect.arrayContaining([
        "pair",
        "card",
        "dot",
        "pair-copy",
        "card-copy",
        "dot-copy",
        "pair-copy-copy",
        "card-copy-copy",
        "dot-copy-copy",
      ]),
    );
  });

  test("moves selected shapes across layers without losing order", () => {
    const moved = applyFlatEditorCommand(createScene(), {
      kind: "move-to-layer",
      refs: [cardRef, dotRef],
      layerIndex: 1,
    });

    expect(moved.layers[0]?.shapes).toEqual([]);
    expect(moved.layers[1]?.shapes.map((shape) => shape.id)).toEqual(["card", "dot"]);
  });

  test("adds, renames, reorders, and deletes layers while retaining one layer minimum", () => {
    const added = applyFlatEditorCommand(createScene(), { kind: "add-layer", id: "foreground" });
    const renamed = applyFlatEditorCommand(added, {
      kind: "rename-layer",
      layerIndex: 2,
      id: "front",
    });
    const reordered = applyFlatEditorCommand(renamed, {
      kind: "move-layer",
      layerIndex: 2,
      toIndex: 0,
    });
    const deleted = applyFlatEditorCommand(reordered, { kind: "delete-layer", layerIndex: 0 });

    expect(added.layers).toHaveLength(3);
    expect(renamed.layers[2]?.id).toBe("front");
    expect(reordered.layers[0]?.id).toBe("front");
    expect(deleted.layers.map((layer) => layer.id)).toEqual(["art", "details"]);
  });

  test("applies keyboard-style translation to a multi-selection", () => {
    const translated = applyFlatEditorCommand(createScene(), {
      kind: "translate",
      refs: [cardRef, dotRef],
      dx: 10,
      dy: 5,
    });

    expect(translated.layers[0]?.shapes[0]?.transform).toBe("translate(10 5)");
    expect(translated.layers[0]?.shapes[1]?.transform).toBe("translate(10 5)");
  });
});
