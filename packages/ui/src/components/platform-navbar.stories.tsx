import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen } from "storybook/test";
import {
  BookOpenIcon,
  DatabaseIcon,
  FileTextIcon,
  HomeIcon,
  LayoutDashboardIcon,
  SettingsIcon,
} from "lucide-react";

import { Button } from "./button";
import { PlatformNavbar, type PlatformNavbarGroup } from "./platform-navbar";

const navigationGroups = [
  {
    id: "discover",
    label: "Discover",
    eyebrow: "Public",
    description: "Open routes for visitors.",
    icon: <HomeIcon className="size-4" />,
    items: [
      {
        id: "about",
        label: "About",
        href: "#about",
        description: "Project overview and status.",
        icon: <BookOpenIcon className="size-4" />,
      },
      {
        id: "docs",
        label: "Docs",
        href: "#docs",
        description: "Published component references.",
        icon: <FileTextIcon className="size-4" />,
        meta: "New",
      },
    ],
  },
  {
    id: "workspace",
    label: "Workspace",
    eyebrow: "Private",
    description: "Tools for package development.",
    icon: <LayoutDashboardIcon className="size-4" />,
    items: [
      {
        id: "components",
        label: "Components",
        href: "#components",
        description: "Reusable UI primitives and patterns.",
        icon: <DatabaseIcon className="size-4" />,
        active: true,
      },
      {
        id: "settings",
        label: "Settings",
        href: "#settings",
        description: "Workspace configuration.",
        icon: <SettingsIcon className="size-4" />,
      },
    ],
  },
] as const satisfies PlatformNavbarGroup[];

const meta = {
  title: "Components/PlatformNavbar",
  component: PlatformNavbar,
  tags: ["autodocs", "test"],
  parameters: {
    layout: "fullscreen",
    a11y: {
      test: "todo",
    },
  },
  args: {
    brand: "Platform",
    groups: navigationGroups,
    activeItemId: "components",
    actions: <Button size="sm">Sign in</Button>,
  },
  render: (args) => (
    <div className="min-h-[420px] bg-background p-6 text-foreground">
      <PlatformNavbar {...args} />
    </div>
  ),
} satisfies Meta<typeof PlatformNavbar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Web: Story = {
  args: {
    variant: "web",
    defaultOpenGroupId: "workspace",
  },
};

export const Desktop: Story = {
  args: {
    variant: "desktop",
    defaultOpenGroupId: "workspace",
  },
};

export const Mobile: Story = {
  args: {
    variant: "mobile",
    defaultOpenGroupId: "workspace",
  },
};

export const OpensSubmenu: Story = {
  args: {
    variant: "desktop",
    defaultOpenGroupId: null,
  },
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole("button", { name: /Discover/ });

    await userEvent.click(trigger);

    await expect(await screen.findByRole("link", { name: /About/ })).toBeInTheDocument();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  },
};
