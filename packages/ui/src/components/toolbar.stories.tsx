import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { DownloadIcon, MoreHorizontalIcon, RotateCcwIcon, SaveIcon } from "lucide-react";

import { Button } from "./button";
import { Toggle } from "./toggle";
import { Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarSpacer, ToolbarTitle } from "./toolbar";

type ToolbarDemoProps = {
  onSave?: () => void;
  density?: "default" | "compact";
};

function ToolbarDemo({ onSave = () => undefined, density = "default" }: ToolbarDemoProps) {
  return (
    <Toolbar
      aria-label="Editor actions"
      density={density}
      className="w-[640px] max-w-[calc(100vw-2rem)]"
    >
      <ToolbarGroup>
        <ToolbarTitle>Release notes</ToolbarTitle>
      </ToolbarGroup>
      <ToolbarSpacer />
      <ToolbarGroup aria-label="History">
        <Button variant="ghost" size="icon-sm" aria-label="Reset changes">
          <RotateCcwIcon />
        </Button>
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup aria-label="View">
        <Toggle size="sm" aria-label="Preview mode">
          Preview
        </Toggle>
      </ToolbarGroup>
      <ToolbarGroup aria-label="Actions">
        <Button variant="outline" size="sm">
          <DownloadIcon />
          Export
        </Button>
        <Button size="sm" onClick={onSave}>
          <SaveIcon />
          Save
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="More actions">
          <MoreHorizontalIcon />
        </Button>
      </ToolbarGroup>
    </Toolbar>
  );
}

const meta = {
  title: "Components/Toolbar",
  component: ToolbarDemo,
  tags: ["autodocs", "test"],
  args: {
    density: "default",
    onSave: fn(),
  },
  argTypes: {
    density: {
      control: "radio",
      options: ["default", "compact"],
    },
  },
} satisfies Meta<typeof ToolbarDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));

    await expect(args.onSave).toHaveBeenCalledTimes(1);
  },
};

export const Compact: Story = {
  args: {
    density: "compact",
  },
};
