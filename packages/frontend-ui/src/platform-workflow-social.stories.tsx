import type { Meta, StoryObj } from "@storybook/react-vite";

import { PlatformWorkflowDemo } from "./storybook/platform-workflow-demo";

const meta = {
  title: "Storybook/Workflows/Social",
  component: PlatformWorkflowDemo,
  tags: ["autodocs", "test"],
  parameters: {
    layout: "fullscreen",
    a11y: {
      test: "todo",
    },
  },
  args: {
    initialSession: "authenticated",
    initialProfileId: "mira",
  },
} satisfies Meta<typeof PlatformWorkflowDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  args: {
    initialRoute: "social",
  },
};

export const People: Story = {
  args: {
    initialRoute: "people",
  },
};

export const Profile: Story = {
  args: {
    initialRoute: "profile",
    initialProfileId: "jordan",
  },
};

export const Followers: Story = {
  args: {
    initialRoute: "followers",
    initialProfileId: "sofia",
  },
};
