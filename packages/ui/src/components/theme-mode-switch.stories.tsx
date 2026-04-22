import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { ThemeModeSwitch } from "./theme-mode-switch";

const meta = {
  title: "Components/Theme mode switch",
  component: ThemeModeSwitch,
  tags: ["autodocs", "test"],
  args: {
    defaultMode: "light",
  },
  argTypes: {
    mode: {
      control: "radio",
      options: ["light", "dark"],
    },
    defaultMode: {
      control: "radio",
      options: ["light", "dark"],
    },
  },
} satisfies Meta<typeof ThemeModeSwitch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  play: async ({ canvas, userEvent }) => {
    const switchControl = canvas.getByRole("switch", { name: "Color mode" });

    await userEvent.click(switchControl);
    await expect(switchControl).toHaveAttribute("aria-checked", "true");
  },
};

export const Modes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <ThemeModeSwitch defaultMode="light" aria-label="Light appearance" />
      <ThemeModeSwitch defaultMode="dark" aria-label="Dark appearance" />
    </div>
  ),
};
