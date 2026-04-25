import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { PlatformWorkflowDemo } from "./storybook/platform-workflow-demo";

const meta = {
  title: "Storybook/Workflows/Auth",
  component: PlatformWorkflowDemo,
  tags: ["autodocs", "test"],
  parameters: {
    layout: "fullscreen",
    a11y: {
      test: "todo",
    },
  },
  args: {
    initialSession: "visitor",
    initialProfileId: "mira",
    visitorNavigationLabel: "Discover",
  },
  argTypes: {
    visitorNavigationLabel: {
      control: "text",
    },
  },
} satisfies Meta<typeof PlatformWorkflowDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Login: Story = {
  args: {
    initialRoute: "login",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "Login" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Sign in" })).toBeVisible();
  },
};

export const Register: Story = {
  args: {
    initialRoute: "register",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "Register" })).toBeVisible();
    await expect(canvas.getAllByRole("button", { name: "Create account" }).at(-1)!).toBeVisible();
  },
};

export const PasswordRecovery: Story = {
  args: {
    initialRoute: "password",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "Password forgotten" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Send reset link" })).toBeVisible();
  },
};
