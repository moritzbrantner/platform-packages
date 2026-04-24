import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Avatar } from "./avatar";

const meta = {
  title: "Components/Avatar",
  component: Avatar,
  tags: ["autodocs", "test"],
  args: {
    name: "Mira Brandt",
    initials: "MB",
    size: "xl",
    shape: "round",
    online: true,
  },
} satisfies Meta<typeof Avatar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <Avatar {...args} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText("MB")).toBeVisible();
  },
};
