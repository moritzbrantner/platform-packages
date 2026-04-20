import { describe, expect, test } from "vitest";

import {
  createTreeIndex,
  flattenTree,
  getTreeStats,
} from "@moritzbrantner/tree-structures";

describe("@moritzbrantner/tree-structures", () => {
  test("builds indexed trees from parent references", () => {
    const index = createTreeIndex(
      [
        { id: "root", label: "Root" },
        { id: "b", label: "Beta", parentId: "root", data: { value: 2 } },
        { id: "a", label: "Alpha", parentId: "root", data: { value: 1 } },
        { id: "leaf", parentId: "a" },
      ],
      { sortSiblings: (left, right) => left.label.localeCompare(right.label) },
    );

    expect(index.roots.map((node) => node.id)).toEqual(["root"]);
    expect(index.getChildren("root").map((node) => node.id)).toEqual(["a", "b"]);
    expect(index.getNodeById("leaf")?.depth).toBe(2);
    expect(index.getNodeById("leaf")?.path).toEqual(["root", "a", "leaf"]);
    expect(index.getAncestors("leaf").map((node) => node.id)).toEqual([
      "root",
      "a",
    ]);
    expect(index.getPath("leaf").map((node) => node.id)).toEqual([
      "root",
      "a",
      "leaf",
    ]);
    expect(index.flatten().map((node) => node.id)).toEqual([
      "root",
      "a",
      "leaf",
      "b",
    ]);
  });

  test("supports depth-first and breadth-first traversal helpers", () => {
    const tree = [
      {
        id: "root",
        children: [
          { id: "a", children: [{ id: "a-1", children: [] }] },
          { id: "b", children: [] },
        ],
      },
    ];

    expect(flattenTree(tree).map((node) => node.id)).toEqual([
      "root",
      "a",
      "a-1",
      "b",
    ]);
    expect(
      flattenTree(tree, { order: "breadth-first" }).map((node) => node.id),
    ).toEqual(["root", "a", "b", "a-1"]);
    expect(
      flattenTree(tree, { order: "postorder" }).map((node) => node.id),
    ).toEqual(["a-1", "a", "b", "root"]);
  });

  test("returns subtree descendants and aggregate tree stats", () => {
    const index = createTreeIndex([
      { id: "root" },
      { id: "a", parentId: "root" },
      { id: "a-1", parentId: "a" },
      { id: "b", parentId: "root" },
      { id: "orphan", parentId: "missing" },
    ]);

    expect(index.roots.map((node) => node.id)).toEqual(["root", "orphan"]);
    expect(index.getDescendants("root").map((node) => node.id)).toEqual([
      "a",
      "a-1",
      "b",
    ]);
    expect(getTreeStats(index.roots)).toEqual({
      leafCount: 3,
      maxDepth: 2,
      nodeCount: 5,
      rootCount: 2,
    });
  });

  test("validates duplicate ids, missing parents, and parent cycles", () => {
    expect(() => createTreeIndex([{ id: "a" }, { id: "a" }])).toThrow(
      "Duplicate tree node id: a",
    );
    expect(() =>
      createTreeIndex([{ id: "a", parentId: "missing" }], {
        missingParent: "error",
      }),
    ).toThrow("Unknown parent tree node: missing");
    expect(() =>
      createTreeIndex([
        { id: "a", parentId: "b" },
        { id: "b", parentId: "a" },
      ]),
    ).toThrow("Tree contains a parent cycle");
  });
});
