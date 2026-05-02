import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { TreeView, type TreeViewNode } from "..";

const folders: TreeViewNode[] = [
  {
    id: "root",
    label: "Root",
    children: [
      {
        id: "src",
        label: "Source",
        children: [
          { id: "components", label: "components" },
          { id: "index", label: "index.tsx" },
        ],
      },
      { id: "readme", label: "README.md" },
    ],
  },
  {
    id: "docs",
    label: "Docs",
    children: [{ id: "api", label: "api.md" }],
  },
];

describe("TreeView", () => {
  test("renders nested folders on expansion", () => {
    render(<TreeView nodes={folders} />);

    expect(screen.getByRole("tree")).toBeTruthy();
    expect(screen.getByRole("treeitem", { name: /Root/ }).getAttribute("aria-expanded")).toBe(
      "false",
    );
    expect(screen.queryByText("Source")).toBeNull();

    fireEvent.click(screen.getByRole("treeitem", { name: /Root/ }));

    expect(screen.getByRole("treeitem", { name: /Root/ }).getAttribute("aria-expanded")).toBe(
      "true",
    );
    expect(screen.getByRole("treeitem", { name: /Source/ })).toBeTruthy();
  });

  test("selects nodes and reports the selected node", () => {
    const onSelectedIdChange = vi.fn();

    render(
      <TreeView
        nodes={folders}
        defaultExpandedIds={["root"]}
        onSelectedIdChange={onSelectedIdChange}
      />,
    );

    fireEvent.click(screen.getByRole("treeitem", { name: /README.md/ }));

    expect(onSelectedIdChange).toHaveBeenCalledWith(
      "readme",
      expect.objectContaining({ id: "readme" }),
    );
    expect(screen.getByRole("treeitem", { name: /README.md/ }).getAttribute("aria-selected")).toBe(
      "true",
    );
  });

  test("supports tree keyboard navigation", () => {
    const onSelectedIdChange = vi.fn();

    render(<TreeView nodes={folders} onSelectedIdChange={onSelectedIdChange} />);

    const root = screen.getByRole("treeitem", { name: /Root/ });
    root.focus();
    fireEvent.keyDown(root, { key: "ArrowRight" });

    const source = screen.getByRole("treeitem", { name: /Source/ });
    expect(source).toBeTruthy();

    fireEvent.keyDown(root, { key: "ArrowDown" });
    expect(document.activeElement).toBe(source);

    fireEvent.keyDown(source, { key: "Enter" });
    expect(onSelectedIdChange).toHaveBeenCalledWith("src", expect.objectContaining({ id: "src" }));
    expect(screen.getByRole("treeitem", { name: /components/ })).toBeTruthy();
  });
});
