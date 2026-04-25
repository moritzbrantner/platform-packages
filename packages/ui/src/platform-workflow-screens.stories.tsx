import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import {
  PlatformWorkflowDemo,
  workflowProfileIdOptions,
  workflowRouteOptions,
  workflowSessionOptions,
} from "./storybook/platform-workflow-demo";

const meta = {
  title: "Workflows/Screens",
  component: PlatformWorkflowDemo,
  tags: ["autodocs", "test"],
  parameters: {
    layout: "fullscreen",
    a11y: {
      test: "todo",
    },
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

export const PublicMain: Story = {
  args: {
    initialRoute: "main",
    initialSession: "visitor",
    initialProfileId: "mira",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "Main page" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "About" })).toBeVisible();
    await expect(canvas.getAllByRole("button", { name: "Login" })[0]).toBeVisible();
    await expect(canvas.getAllByRole("button", { name: "Create account" })[0]).toBeVisible();
  },
};

export const PublicAbout: Story = {
  args: {
    initialRoute: "about",
    initialSession: "visitor",
    initialProfileId: "mira",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "About" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Back to main" })).toBeVisible();
  },
};

export const AccountLogin: Story = {
  args: {
    initialRoute: "login",
    initialSession: "visitor",
    initialProfileId: "mira",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "Login" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Sign in" })).toBeVisible();
  },
};

export const AccountRegister: Story = {
  args: {
    initialRoute: "register",
    initialSession: "visitor",
    initialProfileId: "mira",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "Register" })).toBeVisible();
    await expect(canvas.getAllByRole("button", { name: "Create account" }).at(-1)!).toBeVisible();
  },
};

export const AccountPasswordRecovery: Story = {
  args: {
    initialRoute: "password",
    initialSession: "visitor",
    initialProfileId: "mira",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "Password forgotten" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Send reset link" })).toBeVisible();
  },
};

export const SignedInHome: Story = {
  args: {
    initialRoute: "home",
    initialSession: "authenticated",
    initialProfileId: "mira",
  },
};

export const SignedInSocialOverview: Story = {
  args: {
    initialRoute: "social",
    initialSession: "authenticated",
    initialProfileId: "mira",
  },
};

export const SignedInPeople: Story = {
  args: {
    initialRoute: "people",
    initialSession: "authenticated",
    initialProfileId: "mira",
  },
};

export const SignedInProfile: Story = {
  args: {
    initialRoute: "profile",
    initialSession: "authenticated",
    initialProfileId: "jordan",
  },
};

export const SignedInFollowers: Story = {
  args: {
    initialRoute: "followers",
    initialSession: "authenticated",
    initialProfileId: "sofia",
  },
};

export const SignedInChatOverview: Story = {
  args: {
    initialRoute: "chats",
    initialSession: "authenticated",
    initialProfileId: "mira",
  },
};

export const SignedInChat: Story = {
  args: {
    initialRoute: "chat",
    initialSession: "authenticated",
    initialProfileId: "jordan",
  },
};

export const SignedInNotifications: Story = {
  args: {
    initialRoute: "notifications",
    initialSession: "authenticated",
    initialProfileId: "mira",
  },
};

export const SignedInSettings: Story = {
  args: {
    initialRoute: "settings",
    initialSession: "authenticated",
    initialProfileId: "mira",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Save settings" })).toBeVisible();
  },
};
