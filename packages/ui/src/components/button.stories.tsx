import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { ArrowRightIcon, CheckIcon, SaveIcon } from "lucide-react";

import { Button } from "./button";

const buttonVariants = ["default", "secondary", "outline", "ghost", "link", "destructive"] as const;

const buttonSizes = ["xs", "sm", "default", "lg", "icon", "icon-sm"] as const;

const meta = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs", "test"],
  args: {
    children: "Button",
    variant: "default",
    size: "default",
  },
  argTypes: {
    variant: {
      control: "select",
      options: buttonVariants,
    },
    size: {
      control: "select",
      options: buttonSizes,
    },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {buttonVariants.map((variant) => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="xs">Extra small</Button>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" aria-label="Confirm">
        <CheckIcon />
      </Button>
      <Button size="icon-sm" aria-label="Continue">
        <ArrowRightIcon />
      </Button>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>
        <SaveIcon />
        Save changes
      </Button>
      <Button disabled>Disabled</Button>
      <Button variant="outline" dragX>
        Drag on x
      </Button>
    </div>
  ),
};

export const Clickable: Story = {
  args: {
    children: "Save changes",
    onClick: fn(),
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Save changes" }));

    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};
