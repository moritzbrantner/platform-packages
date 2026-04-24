import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Button } from "./button";
import { DotsSpinner, PulseSpinner, Spinner } from "./spinner";

const spinnerSizes = ["xs", "sm", "default", "lg", "xl"] as const;
const spinnerVariants = ["default", "muted", "primary", "secondary", "destructive"] as const;

const meta = {
  title: "Components/Spinner",
  component: Spinner,
  tags: ["autodocs", "test"],
  args: {
    size: "default",
    variant: "default",
    label: "Loading workspace",
  },
  argTypes: {
    size: {
      control: "select",
      options: spinnerSizes,
    },
    variant: {
      control: "select",
      options: spinnerVariants,
    },
  },
} satisfies Meta<typeof Spinner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("status", { name: "Loading workspace" })).toBeVisible();
  },
};

export const Families: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-6">
      <div className="flex min-w-36 items-center gap-3">
        <Spinner label="Loading spinner" />
        <span className="text-sm text-muted-foreground">Triqueta morph</span>
      </div>
      <div className="flex min-w-36 items-center gap-3">
        <DotsSpinner label="Syncing dots" />
        <span className="text-sm text-muted-foreground">Dots</span>
      </div>
      <div className="flex min-w-36 items-center gap-3">
        <PulseSpinner label="Pulse spinner" />
        <span className="text-sm text-muted-foreground">Pulse</span>
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      {spinnerSizes.map((size) => (
        <div key={size} className="flex min-w-20 flex-col items-center gap-2">
          <Spinner size={size} label={`${size} spinner`} />
          <span className="text-xs text-muted-foreground">{size}</span>
        </div>
      ))}
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      {spinnerVariants.map((variant) => (
        <div key={variant} className="flex min-w-24 flex-col items-center gap-2">
          <Spinner variant={variant} label={`${variant} spinner`} />
          <span className="text-xs text-muted-foreground">{variant}</span>
        </div>
      ))}
    </div>
  ),
};

export const InContext: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button disabled>
        <Spinner decorative size="sm" className="mr-2" />
        Saving changes
      </Button>
      <div className="flex items-center gap-3 rounded-md border border-border/70 px-4 py-3">
        <DotsSpinner label="Publishing package" variant="primary" />
        <span className="text-sm">Publishing package</span>
      </div>
    </div>
  ),
};
