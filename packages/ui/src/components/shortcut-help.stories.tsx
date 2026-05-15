import type { Meta, StoryObj } from "@storybook/react-vite";

import { ShortcutHelpDialog, ShortcutList, type ShortcutHelpGroup } from "./shortcut-help";

const groups = [
  {
    id: "global",
    label: "Global",
    shortcuts: [
      { id: "palette", label: "Open command palette", shortcut: "Meta+K" },
      { id: "search", label: "Focus search", shortcut: "/" },
    ],
  },
  {
    id: "editor",
    label: "Editor",
    shortcuts: [
      { id: "save", label: "Save", shortcut: "Meta+S" },
      { id: "preview", label: "Toggle preview", shortcut: "Shift+P" },
    ],
  },
] satisfies ShortcutHelpGroup[];

const meta = {
  title: "Components/ShortcutHelp",
  component: ShortcutList,
  tags: ["autodocs", "test"],
} satisfies Meta<typeof ShortcutList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const List: Story = {
  args: {
    groups,
  },
};

export const Dialog: Story = {
  args: {
    groups,
  },
  render: () => <ShortcutHelpDialog open groups={groups} />,
};
