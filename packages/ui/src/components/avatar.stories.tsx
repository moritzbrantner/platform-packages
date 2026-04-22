import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "./avatar";

function AvatarPreview() {
  return (
    <AvatarGroup>
      <Avatar size="xl">
        <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80" alt="Mira Brandt" />
        <AvatarFallback name="Mira Brandt" />
        <AvatarBadge />
      </Avatar>
      <Avatar size="xl">
        <AvatarFallback name="Platform Design" />
      </Avatar>
      <AvatarGroupCount>+4</AvatarGroupCount>
    </AvatarGroup>
  );
}

const meta = {
  title: "Components/Avatar",
  component: AvatarPreview,
  tags: ["autodocs", "test"],
} satisfies Meta<typeof AvatarPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("PD")).toBeVisible();
    await expect(canvas.getByText("+4")).toBeVisible();
  },
};
