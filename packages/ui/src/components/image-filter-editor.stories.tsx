import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { ImageFilterEditor } from "./image-filter-editor";

const previewImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 960 540'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%23f97316'/%3E%3Cstop offset='.48' stop-color='%2314b8a6'/%3E%3Cstop offset='1' stop-color='%233b82f6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='960' height='540' fill='url(%23g)'/%3E%3Ccircle cx='710' cy='180' r='92' fill='%23ffffff' fill-opacity='.72'/%3E%3Cpath d='M80 420 280 210l154 150 120-92 326 152v76H80z' fill='%230f172a' fill-opacity='.42'/%3E%3C/svg%3E";

const meta = {
  title: "Components/ImageFilterEditor",
  component: ImageFilterEditor,
  tags: ["autodocs", "test"],
  args: {
    alt: "Landscape source",
    src: previewImage,
  },
} satisfies Meta<typeof ImageFilterEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByAltText("Landscape source")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Show compare preview" })).toBeVisible();
    await expect(canvas.getByText("No active adjustments")).toBeVisible();
  },
};

export const WarmCompare: Story = {
  args: {
    defaultValue: {
      brightness: 104,
      contrast: 106,
      saturate: 118,
      sepia: 18,
      hueRotate: -8,
    },
  },
};
