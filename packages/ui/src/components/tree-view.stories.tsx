import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { TreeView, type TreeViewNode } from "./tree-view";

const projectFolders: TreeViewNode[] = [
  {
    id: "project",
    label: "Project",
    description: "Application workspace",
    defaultExpanded: true,
    children: [
      {
        id: "src",
        label: "src",
        defaultExpanded: true,
        children: [
          { id: "components", label: "components", badge: "12", children: [] },
          { id: "app", label: "app", badge: "8", children: [] },
          { id: "index", label: "index.tsx" },
        ],
      },
      {
        id: "public",
        label: "public",
        children: [
          { id: "favicon", label: "favicon.svg" },
          { id: "manifest", label: "manifest.json" },
        ],
      },
      { id: "package", label: "package.json" },
    ],
  },
  {
    id: "docs",
    label: "docs",
    children: [
      { id: "architecture", label: "architecture.md" },
      { id: "release", label: "release-notes.md" },
    ],
  },
];

const meta = {
  title: "Components/TreeView",
  component: TreeView,
  tags: ["autodocs", "test"],
  args: {
    nodes: projectFolders,
    onSelectedIdChange: fn(),
    onExpandedIdsChange: fn(),
  },
} satisfies Meta<typeof TreeView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Folders: Story = {
  args: {
    defaultSelectedId: "src",
    className: "max-w-sm",
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("treeitem", { name: /public/ }));
    await expect(canvas.getByText("favicon.svg")).toBeInTheDocument();
    await expect(args.onSelectedIdChange).toHaveBeenCalledWith(
      "public",
      expect.objectContaining({ id: "public" }),
    );
  },
};

export const Empty: Story = {
  args: {
    nodes: [],
  },
};
