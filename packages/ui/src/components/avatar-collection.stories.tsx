import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { AvatarCollection } from "./avatar-collection";

const meta = {
  title: "Components/AvatarCollection",
  component: AvatarCollection,
  tags: ["autodocs", "test"],
} satisfies Meta<typeof AvatarCollection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    users: [
      { name: "Mira Brandt", initials: "MB", size: "xl", shape: "round", online: true },
      { name: "Platform Design", initials: "PD", size: "xl", shape: "square" },
      { name: "Design Systems", initials: "DS", size: "xl", shape: "hexagonal" },
      { name: "Release Crew", initials: "RC", size: "xl", shape: "octagonal" },
      { name: "Support", initials: "SP", size: "xl", shape: "round" },
    ],
    maxVisible: 4,
    overflowShape: "hexagonal",
  },
  render: (args) => <AvatarCollection {...args} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText("MB")).toBeVisible();
    await expect(canvas.getByText("PD")).toBeVisible();
    await expect(canvas.getByText("DS")).toBeVisible();
    await expect(canvas.getByText("RC")).toBeVisible();
    await expect(canvas.getByText("+1")).toBeVisible();
  },
};
