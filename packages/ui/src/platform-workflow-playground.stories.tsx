import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import {
  PlatformWorkflowDemo,
  workflowProfileIdOptions,
  workflowRouteOptions,
  workflowSessionOptions,
} from "./storybook/platform-workflow-demo";

const meta = {
  title: "Workflows/Playground",
  component: PlatformWorkflowDemo,
  tags: ["autodocs", "test"],
  parameters: {
    layout: "fullscreen",
    a11y: {
      test: "todo",
    },
  },
  args: {
    initialRoute: "main",
    initialSession: "visitor",
    initialProfileId: "mira",
  },
  argTypes: {
    initialRoute: {
      control: "select",
      options: workflowRouteOptions,
    },
    initialSession: {
      control: "inline-radio",
      options: workflowSessionOptions,
    },
    initialProfileId: {
      control: "select",
      options: workflowProfileIdOptions,
    },
  },
} satisfies Meta<typeof PlatformWorkflowDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const InteractiveApp: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "Main page" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "About" })).toBeVisible();
  },
};
