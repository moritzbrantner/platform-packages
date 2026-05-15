import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { UploadQueue, type UploadQueueFile } from "./upload-queue";

const items = [
  {
    id: "queued",
    name: "briefing.pdf",
    sizeLabel: "2.4 MB",
    status: "queued",
  },
  {
    id: "uploading",
    name: "capture.mov",
    description: "Uploading to shared assets",
    sizeLabel: "18 MB",
    status: "uploading",
    progress: 62,
  },
  {
    id: "complete",
    name: "notes.md",
    status: "complete",
  },
  {
    id: "error",
    name: "archive.zip",
    status: "error",
    error: "Upload failed.",
  },
] satisfies UploadQueueFile[];

const meta = {
  title: "Components/UploadQueue",
  component: UploadQueue,
  tags: ["autodocs", "test"],
  args: {
    items,
    onRetry: fn(),
    onCancel: fn(),
    onRemove: fn(),
  },
} satisfies Meta<typeof UploadQueue>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getAllByRole("button", { name: /Remove upload/i })[0]);

    await expect(args.onRemove).toHaveBeenCalled();
  },
};

export const Empty: Story = {
  args: {
    items: [],
  },
};
