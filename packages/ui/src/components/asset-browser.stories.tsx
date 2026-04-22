import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { AssetBrowser, type AssetBrowserItem } from "./asset-browser";

const assets: AssetBrowserItem[] = [
  {
    id: "folder-brand",
    name: "Brand",
    type: "folder",
    description: "Identity and campaign files.",
    updatedAt: "2026-04-20",
  },
  {
    id: "hero",
    name: "hero-image.jpg",
    type: "image",
    mimeType: "image/jpeg",
    size: 2_400_000,
  },
  {
    id: "launch",
    name: "launch-cut.mp4",
    type: "video",
    mimeType: "video/mp4",
    size: 18_900_000,
  },
  {
    id: "brief",
    name: "creative-brief.pdf",
    type: "document",
    mimeType: "application/pdf",
    size: 480_000,
  },
];

const meta = {
  title: "Components/AssetBrowser",
  component: AssetBrowser,
  tags: ["autodocs", "test"],
  args: {
    items: assets,
    onSelectionChange: fn(),
    onOpenItem: fn(),
    onUpload: fn(),
  },
} satisfies Meta<typeof AssetBrowser>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Grid: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("Search assets"), "hero");
    await expect(canvas.getByText("hero-image.jpg")).toBeInTheDocument();
    await userEvent.click(canvas.getByText("hero-image.jpg"));
    await expect(args.onSelectionChange).toHaveBeenCalled();
  },
};

export const List: Story = {
  args: {
    defaultView: "list",
    selectionMode: "multiple",
  },
};
