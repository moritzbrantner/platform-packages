import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { CopyButton } from "./copy-button";

const meta = {
  title: "Components/CopyButton",
  component: CopyButton,
  tags: ["autodocs", "test"],
  args: {
    value: "bun add @moritzbrantner/ui",
    copy: fn(async () => undefined),
    onCopied: fn(),
  },
} satisfies Meta<typeof CopyButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Copy" }));

    await expect(canvas.getByRole("button", { name: "Copied" })).toBeVisible();
    await expect(args.copy).toHaveBeenCalledWith("bun add @moritzbrantner/ui");
    await expect(args.onCopied).toHaveBeenCalledWith("bun add @moritzbrantner/ui");
  },
};

export const Compact: Story = {
  args: {
    size: "xs",
    idleLabel: "Copy token",
    copiedLabel: "Token copied",
    value: "pk_live_example",
  },
};
