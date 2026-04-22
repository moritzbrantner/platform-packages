import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { expect, screen } from "storybook/test";
import { LogOutIcon, SettingsIcon, ShieldIcon, UserIcon, UsersIcon } from "lucide-react";

import { AccountMenu } from "./account-menu";

const defaultItems = [
  {
    id: "profile",
    label: "Profile",
    icon: <UserIcon className="size-4" />,
  },
  {
    id: "team",
    label: "Team",
    icon: <UsersIcon className="size-4" />,
  },
  {
    id: "settings",
    label: "Settings",
    icon: <SettingsIcon className="size-4" />,
  },
] satisfies ComponentProps<typeof AccountMenu>["items"];

const meta = {
  title: "Components/AccountMenu",
  component: AccountMenu,
  tags: ["autodocs", "test"],
  parameters: {
    layout: "centered",
    a11y: {
      test: "todo",
    },
  },
  args: {
    user: {
      name: "Ada Lovelace",
      email: "ada@example.com",
      initials: "AL",
      meta: "Workspace owner",
    },
    items: defaultItems,
  },
} satisfies Meta<typeof AccountMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Guest: Story = {
  args: {
    user: null,
    guestLabel: "Signed out",
    items: [
      {
        id: "sign-in",
        label: "Sign in",
        icon: <ShieldIcon className="size-4" />,
      },
    ],
  },
};

export const WithDisabledAndDestructiveItems: Story = {
  args: {
    items: [
      ...defaultItems,
      {
        id: "disabled",
        label: "Billing unavailable",
        icon: <ShieldIcon className="size-4" />,
        disabled: true,
      },
      {
        id: "logout",
        label: "Sign out",
        icon: <LogOutIcon className="size-4" />,
        destructive: true,
      },
    ],
  },
};

export const OpensMenu: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Open account menu" }));

    const profileItem = await screen.findByRole("menuitem", { name: /Profile/ });

    await expect(profileItem).toBeInTheDocument();
    await expect(await screen.findByText("ada@example.com")).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
  },
};
