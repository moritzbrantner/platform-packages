import type { Meta, StoryObj } from "@storybook/react-vite";

import { PlatformWorkflowDemo } from "./storybook/platform-workflow-demo";

const meta = {
  title: "Storybook/Workflows/Settings",
  component: PlatformWorkflowDemo,
  tags: ["autodocs", "test"],
  parameters: {
    layout: "fullscreen",
    a11y: {
      test: "todo",
    },
  },
  args: {
    initialRoute: "settings",
    initialSession: "authenticated",
    initialProfileId: "mira",
  },
} satisfies Meta<typeof PlatformWorkflowDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WorkspaceSettings: Story = {};
