import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Avatar, type AvatarShape } from "./avatar";

const avatarShapes: AvatarShape[] = ["round", "square", "hexagonal", "octagonal"];

const meta = {
  title: "Components/Avatar",
  component: Avatar,
  tags: ["autodocs", "test"],
  args: {
    name: "Mira Brandt",
    initials: "MB",
    size: "xl",
    shape: "round",
    online: false,
  },
} satisfies Meta<typeof Avatar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      {avatarShapes.map((shape) => (
        <div key={shape} className="flex flex-col items-center gap-2">
          <Avatar
            {...args}
            name={`${shape} avatar`}
            initials={shape.slice(0, 2).toUpperCase()}
            shape={shape}
          />
          <span className="text-xs font-medium text-muted-foreground capitalize">{shape}</span>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText("RO")).toBeVisible();
    await expect(canvas.getByText("SQ")).toBeVisible();
    await expect(canvas.getByText("HE")).toBeVisible();
    await expect(canvas.getByText("OC")).toBeVisible();
  },
};
