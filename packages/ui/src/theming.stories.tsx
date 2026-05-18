import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { Button } from "./components/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/card";
import { Input } from "./components/input";
import { UiTheme, createUiTheme, type UiThemeTokens } from "./themes";

const meta = {
  title: "Design System/Theming",
  tags: ["autodocs", "test"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const expectThemeSmokeVisible: Story["play"] = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  await expect(canvas.getByRole("button", { name: "Primary" })).toBeVisible();
  await expect(canvas.getByLabelText("Project name")).toBeVisible();
};

function ThemeSmoke({ tokens }: { tokens: UiThemeTokens }) {
  return (
    <UiTheme theme="custom" style={createUiTheme(tokens)}>
      <Card className="w-[min(28rem,calc(100vw-2rem))]">
        <CardHeader>
          <CardTitle>Theme preview</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-[var(--ui-surface-gap)]">
          <Input aria-label="Project name" defaultValue="Website theme" />
          <div className="flex flex-wrap items-center gap-[var(--ui-control-gap)]">
            <Button>Primary</Button>
            <Button variant="outline">Secondary</Button>
          </div>
        </CardContent>
      </Card>
    </UiTheme>
  );
}

export const CompactDashboard: Story = {
  play: expectThemeSmokeVisible,
  render: () => (
    <ThemeSmoke
      tokens={{
        "--primary": "oklch(0.46 0.09 225)",
        "--ui-control-height-md": "2.125rem",
        "--ui-control-padding-x-md": "0.875rem",
        "--ui-control-gap": "0.375rem",
        "--ui-surface-padding-md": "0.875rem",
        "--ui-surface-gap": "0.75rem",
        "--ui-motion-hover-scale": "1.035",
      }}
    />
  ),
};

export const RoundedMarketing: Story = {
  play: expectThemeSmokeVisible,
  render: () => (
    <ThemeSmoke
      tokens={{
        "--primary": "oklch(0.45 0.17 250)",
        "--primary-foreground": "oklch(0.99 0.01 250)",
        "--ui-radius-control": "999px",
        "--ui-radius-surface": "1.25rem",
        "--ui-radius-overlay": "1.5rem",
        "--ui-control-height-md": "2.625rem",
        "--ui-surface-padding-md": "1.25rem",
      }}
    />
  ),
};

export const SharpEditorial: Story = {
  play: expectThemeSmokeVisible,
  render: () => (
    <ThemeSmoke
      tokens={{
        "--font-sans-app": 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
        "--primary": "oklch(0.42 0.075 165)",
        "--ui-radius-control": "0.125rem",
        "--ui-radius-surface": "0.25rem",
        "--ui-motion-hover-scale": "1.01",
        "--ui-shadow-surface": "0 4px 14px oklch(0.2 0.02 80 / 0.08)",
      }}
    />
  ),
};
