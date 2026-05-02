import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen } from "storybook/test";
import {
  BookOpenIcon,
  DatabaseIcon,
  FileTextIcon,
  HomeIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MessageCircleIcon,
  SettingsIcon,
  UserCircleIcon,
  UserPlusIcon,
} from "lucide-react";

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
    accountMenu: {
      user: {
        name: "Mira Brandt",
        email: "mira@example.com",
        initials: "MB",
      },
      items: [
        { id: "profile", label: "Profile", icon: <UserCircleIcon className="size-4" /> },
        { id: "settings", label: "Settings", icon: <SettingsIcon className="size-4" /> },
        {
          id: "logout",
          label: "Sign out",
          destructive: true,
          icon: <LogOutIcon className="size-4" />,
        },
      ],
    },
    notificationMenu: {
      unreadCount: 2,
      items: [
        {
          id: "follow",
          title: "Jules followed you",
          description: "Open the profile page to review their public activity.",
          unread: true,
          meta: "2m",
          icon: <UserPlusIcon className="size-4" />,
        },
        {
          id: "message",
          title: "New workspace message",
          description: "The product team mentioned you in the launch thread.",
          unread: true,
          meta: "1h",
          icon: <MessageCircleIcon className="size-4" />,
        },
      ],
      onMarkAllRead: () => {},
    },
    themeModeSwitch: true,
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
    languageSwitcher: true,
  },
  play: async ({ canvas, userEvent }) => {
    const trigger = (await canvas.findAllByRole("button", { name: "Open account menu" })).find(
      (element) => {
        const styles = window.getComputedStyle(element);

        return styles.display !== "none" && styles.visibility !== "hidden";
      },
    );

    if (!trigger) {
      throw new Error("Expected a visible account menu trigger.");
    }

    await expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    await userEvent.click(trigger);

    const profileItems = await screen.findAllByRole("menuitem", { name: "Profile" });
    const visibleEmail = screen
      .getAllByText("mira@example.com")
      .find((element) => element.getClientRects().length > 0);

    await expect(profileItems.length).toBeGreaterThan(0);
    await expect(visibleEmail).toBeDefined();
    await expect(visibleEmail!).toBeVisible();
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
