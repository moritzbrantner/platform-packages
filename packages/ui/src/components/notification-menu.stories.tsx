import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { expect, screen } from "storybook/test";
import { AlertTriangleIcon, MessageCircleIcon, UserPlusIcon } from "lucide-react";

import { NotificationMenu } from "./notification-menu";

const notifications = [
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
  {
    id: "security",
    title: "Security settings updated",
    description: "Multi-factor authentication was enabled for the workspace.",
    meta: "Yesterday",
    icon: <AlertTriangleIcon className="size-4" />,
  },
] satisfies ComponentProps<typeof NotificationMenu>["items"];

const meta = {
  title: "Components/NotificationMenu",
  component: NotificationMenu,
  tags: ["autodocs", "test"],
  parameters: {
    layout: "centered",
    a11y: {
      test: "todo",
    },
  },
  args: {
    unreadCount: 2,
    titleHref: "/notifications",
    items: notifications,
    onMarkAllRead: () => {},
    onMarkRead: () => {},
  },
} satisfies Meta<typeof NotificationMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    unreadCount: 0,
    items: [],
    emptyLabel: "No unread updates",
    onMarkAllRead: undefined,
  },
};

export const WithDisabledItem: Story = {
  args: {
    items: [
      ...notifications,
      {
        id: "disabled",
        title: "Archived notification",
        description: "This notification is no longer actionable.",
        disabled: true,
      },
    ],
  },
};

export const OpensMenu: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Notifications, 2 unread/ }));

    await expect(
      await screen.findByRole("menuitem", { name: /Jules followed you/ }),
    ).toBeInTheDocument();
    await expect(
      await screen.findByRole("menuitem", { name: /Mark all read/ }),
    ).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
  },
};
