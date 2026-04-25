import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { ImageCropper } from "./image-cropper";

const demoImage =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=80";

const meta = {
  title: "Components/ImageCropper",
  component: ImageCropper,
  tags: ["autodocs", "test"],
  args: {
    alt: "Avatar source",
    onCropChange: fn(),
    onCropComplete: fn(),
    shape: "circle",
    src: demoImage,
  },
  decorators: [
    (Story) => (
      <div className="w-[360px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ImageCropper>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AvatarCrop: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("application", { name: "Crop image" })).toBeVisible();
    await expect(canvas.getByRole("slider", { name: "Crop zoom" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Zoom in" })).toBeVisible();
    await expect(canvas.getByText("100% zoom")).toBeVisible();
  },
};

export const LandscapeCrop: Story = {
  args: {
    aspectRatio: 16 / 9,
    shape: "rectangle",
  },
};
