import type { Meta, StoryObj } from "@storybook/react-vite";

import { LanguageSwitcher } from "./language-switcher";

const meta = {
  title: "Components/Language switcher",
  component: LanguageSwitcher,
  tags: ["autodocs", "test"],
  args: {
    defaultValue: "en",
  },
  argTypes: {
    languages: {
      table: {
        disable: true,
      },
    },
  },
} satisfies Meta<typeof LanguageSwitcher>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const SelectedGerman: Story = {
  args: {
    defaultValue: "de",
  },
};
