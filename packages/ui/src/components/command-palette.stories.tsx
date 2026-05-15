import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTextIcon, SearchIcon, SettingsIcon, Trash2Icon } from "lucide-react";
import { expect, fn, within } from "storybook/test";

import { CommandPalette, type CommandPaletteGroup } from "./command-palette";

const onOpenPackage = fn();

const groups = [
  {
    id: "navigation",
    label: "Navigation",
    actions: [
      {
        id: "search",
        label: "Search packages",
        description: "Open package search.",
        icon: <SearchIcon />,
        shortcut: "⌘K",
        onSelect: onOpenPackage,
      },
      {
        id: "docs",
        label: "Open docs",
        description: "Review package documentation.",
        icon: <FileTextIcon />,
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    actions: [
      {
        id: "preferences",
        label: "Preferences",
        icon: <SettingsIcon />,
        checked: true,
      },
      {
        id: "delete",
        label: "Delete package",
        icon: <Trash2Icon />,
        destructive: true,
        disabled: true,
      },
    ],
  },
] satisfies CommandPaletteGroup[];

function CommandPaletteDemo({ loading = false }: { loading?: boolean }) {
  return (
    <CommandPalette
      open
      groups={groups}
      loading={loading}
      footer={<span>Use arrows to move through commands.</span>}
    />
  );
}

const meta = {
  title: "Components/CommandPalette",
  component: CommandPaletteDemo,
  tags: ["autodocs", "test"],
} satisfies Meta<typeof CommandPaletteDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const GroupedActions: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(body.getByText("Search packages"));

    await expect(onOpenPackage).toHaveBeenCalled();
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};
