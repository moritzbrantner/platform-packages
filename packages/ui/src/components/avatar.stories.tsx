import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import {
  Avatar,
  AvatarBadge,
  AvatarCollection,
  AvatarCollectionCount,
  AvatarFallback,
  AvatarImage,
} from "./avatar";

function AvatarPreview() {
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        <Avatar size="xl" shape="round">
          <AvatarImage
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80"
            alt="Mira Brandt"
          />
          <AvatarFallback name="Mira Brandt" />
          <AvatarBadge />
        </Avatar>
        <Avatar size="xl" shape="square">
          <AvatarFallback name="Platform Design" />
        </Avatar>
        <Avatar size="xl" shape="hexagonal">
          <AvatarFallback name="Design Systems" />
        </Avatar>
        <Avatar size="xl" shape="octagonal">
          <AvatarFallback name="Release Crew" />
        </Avatar>
      </div>
      <AvatarCollection>
        <Avatar size="xl" shape="round">
          <AvatarFallback name="Mira Brandt" />
          <AvatarBadge />
        </Avatar>
        <Avatar size="xl" shape="square">
          <AvatarFallback name="Platform Design" />
        </Avatar>
        <Avatar size="xl" shape="hexagonal">
          <AvatarFallback name="Design Systems" />
        </Avatar>
        <AvatarCollectionCount shape="square">+4</AvatarCollectionCount>
      </AvatarCollection>
    </div>
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
    await expect(canvas.getByText("DS")).toBeVisible();
    await expect(canvas.getByText("RC")).toBeVisible();
    await expect(canvas.getByText("+4")).toBeVisible();
  },
};
