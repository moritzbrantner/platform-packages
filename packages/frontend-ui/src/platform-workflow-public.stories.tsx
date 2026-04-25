import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen } from "storybook/test";

import { PlatformWorkflowDemo } from "./storybook/platform-workflow-demo";

const meta = {
  title: "Storybook/Workflows/Public",
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

export const Main: Story = {
  args: {
    initialRoute: "main",
  },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole("heading", { name: "Main page" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "About" })).toBeVisible();
    await expect(canvas.getAllByRole("button", { name: "Login" }).at(-1)!).toBeVisible();
    await expect(canvas.getAllByRole("button", { name: "Create account" }).at(-1)!).toBeVisible();

    const workflowShell = canvas.getByRole("main").closest("[data-language-code]");
    await expect(workflowShell).toHaveAttribute("data-language-code", "en");
    await expect(workflowShell).toHaveAttribute("lang", "en");

    const themeSwitch = canvas.getByRole("switch", { name: "Color mode" });
    await expect(themeSwitch).toHaveAttribute("aria-checked", "false");
    await userEvent.click(themeSwitch);
    await expect(themeSwitch).toHaveAttribute("aria-checked", "true");
    await expect(themeSwitch).toHaveAttribute("data-mode", "dark");

    await userEvent.click(canvas.getByRole("button", { name: "Language: English" }));
    await userEvent.click(await screen.findByRole("menuitemradio", { name: "Deutsch" }));

    await expect(workflowShell).toHaveAttribute("data-language-code", "de");
    await expect(workflowShell).toHaveAttribute("lang", "de");
  },
};

export const About: Story = {
  args: {
    initialRoute: "about",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "About" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Back to main" })).toBeVisible();
  },
};
