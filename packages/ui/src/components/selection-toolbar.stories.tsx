import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArchiveIcon, Trash2Icon } from "lucide-react";
import { expect, fn } from "storybook/test";

import { Button } from "./button";
import { SelectionToolbar } from "./selection-toolbar";

const meta = {
  title: "Components/SelectionToolbar",
  component: SelectionToolbar,
  tags: ["autodocs", "test"],
  args: {
    selectedCount: 3,
    totalCount: 18,
    onClearSelection: fn(),
  },
} satisfies Meta<typeof SelectionToolbar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <SelectionToolbar {...args}>
      <Button variant="outline" size="sm">
        <ArchiveIcon />
        Archive
      </Button>
      <Button variant="destructive" size="sm">
        <Trash2Icon />
        Delete
      </Button>
    </SelectionToolbar>
  ),
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Clear selection/i }));

    await expect(args.onClearSelection).toHaveBeenCalled();
  },
};

export const Sticky: Story = {
  args: {
    sticky: true,
  },
};
