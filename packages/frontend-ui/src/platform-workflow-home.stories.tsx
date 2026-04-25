import type { Meta, StoryObj } from "@storybook/react-vite";

import { PlatformWorkflowDemo } from "./storybook/platform-workflow-demo";

const meta = {
  title: "Storybook/Workflows/Home",
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

export const Dashboard: Story = {
  args: {
    initialRoute: "home",
  },
};

export const Notifications: Story = {
  args: {
    initialRoute: "notifications",
  },
};
