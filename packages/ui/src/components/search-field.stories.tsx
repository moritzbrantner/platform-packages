import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { SearchField } from "./search-field";

const meta = {
  title: "Components/SearchField",
  component: SearchField,
  tags: ["autodocs", "test"],
  args: {
    onValueChange: fn(),
  },
} satisfies Meta<typeof SearchField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Search packages",
    resultCount: 12,
    shortcut: "/",
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("Search"), "ui");

    await expect(args.onValueChange).toHaveBeenCalled();
  },
};

export const Loading: Story = {
  args: {
    value: "design",
    loading: true,
    resultCount: 4,
  },
};
