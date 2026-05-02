import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import { describe, expect, test, vi } from "vitest";

import { AccountMenu, NotificationMenu } from "..";

function openMenu(trigger: HTMLElement) {
  fireEvent.keyDown(trigger, { key: "Enter", code: "Enter" });
}

describe("account menu", () => {
  test("renders user initials and opens menu items", async () => {
    render(
      <AccountMenu
        user={{ name: "Ada Lovelace", email: "ada@example.com" }}
        items={[{ id: "profile", label: "Profile" }]}
      />,
    );

    expect(screen.getByText("AL")).toBeTruthy();
    const trigger = screen.getByRole("button", { name: "Open account menu" });
    expect(trigger.className).not.toContain("size-9");
    expect(trigger.className).not.toContain("hover:bg-accent");
    expect(screen.getByText("AL").closest('[data-slot="avatar"]')?.className).toContain(
      "group-hover/account-menu:-translate-y-[1px]",
    );

    openMenu(trigger);

    expect(await screen.findByRole("menuitem", { name: "Profile" })).toBeTruthy();
    expect(screen.getByText("ada@example.com")).toBeTruthy();
  });

  test("calls the selected item callback", async () => {
    const onSelect = vi.fn();

    render(
      <AccountMenu
        user={{ name: "Ada Lovelace", initials: "AL" }}
        items={[{ id: "settings", label: "Settings", onSelect }]}
      />,
    );

    openMenu(screen.getByRole("button", { name: "Open account menu" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Settings" }));

    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
  });

  test("renders guest label when user is null", async () => {
    render(<AccountMenu user={null} guestLabel="Signed out" />);

    openMenu(screen.getByRole("button", { name: "Open account menu" }));

    expect(await screen.findByText("Signed out")).toBeTruthy();
  });

  test("renders an inline user trigger when requested", () => {
    render(
      <AccountMenu
        user={{ name: "Ada Lovelace", email: "ada@example.com" }}
        triggerVariant="inline"
      />,
    );

    expect(screen.getByText("Ada Lovelace")).toBeTruthy();
    expect(screen.getByText("ada@example.com")).toBeTruthy();
    expect(screen.getByText("AL")).toBeTruthy();
  });

  test("applies destructive item variant without owning logout behavior", async () => {
    const onSelect = vi.fn();

    render(
      <AccountMenu
        user={{ name: "Ada Lovelace", initials: "AL" }}
        items={[{ id: "logout", label: "Sign out", destructive: true, onSelect }]}
      />,
    );

    openMenu(screen.getByRole("button", { name: "Open account menu" }));

    const item = await screen.findByRole("menuitem", { name: "Sign out" });
    expect(item.getAttribute("data-variant")).toBe("destructive");

    fireEvent.click(item);
    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
  });
});

describe("notification menu", () => {
  test("renders unread count and caps count at maxCount", () => {
    render(<NotificationMenu unreadCount={12} maxCount={9} />);

    expect(screen.getByRole("button", { name: "Notifications, 12 unread" })).toBeTruthy();
    expect(screen.getByText("9+")).toBeTruthy();
  });

  test("opens notification items and calls item onSelect", async () => {
    const onSelect = vi.fn();

    render(
      <NotificationMenu
        unreadCount={1}
        items={[
          {
            id: "follow",
            title: "Jules followed you",
            description: "Open the profile page.",
            unread: true,
            onSelect,
          },
        ]}
      />,
    );

    openMenu(screen.getByRole("button", { name: "Notifications, 1 unread" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: /Jules followed you/ }));

    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
  });

  test("renders the menu title as a configurable link", async () => {
    render(<NotificationMenu titleHref="/notifications" titleLinkProps={{ target: "_self" }} />);

    openMenu(screen.getByRole("button", { name: "Notifications" }));

    const link = await screen.findByRole("link", { name: "Notifications" });
    expect(link.getAttribute("href")).toBe("/notifications");
    expect(link.getAttribute("target")).toBe("_self");
  });

  test("marks an individual notification as read without selecting it", async () => {
    const onMarkRead = vi.fn();
    const onSelect = vi.fn();

    render(
      <NotificationMenu
        unreadCount={1}
        onMarkRead={onMarkRead}
        items={[
          {
            id: "follow",
            title: "Jules followed you",
            description: "Open the profile page.",
            unread: true,
            onSelect,
          },
        ]}
      />,
    );

    openMenu(screen.getByRole("button", { name: "Notifications, 1 unread" }));
    fireEvent.click(await screen.findByRole("button", { name: "Mark Jules followed you as read" }));

    await waitFor(() => expect(onMarkRead).toHaveBeenCalledTimes(1));
    expect(onMarkRead).toHaveBeenCalledWith(
      "follow",
      expect.objectContaining({ id: "follow", title: "Jules followed you" }),
    );
    expect(onSelect).not.toHaveBeenCalled();
  });

  test("updates item and badge state after marking a notification read", async () => {
    render(
      <NotificationMenu
        unreadCount={2}
        items={[
          {
            id: "follow",
            title: "Jules followed you",
            unread: true,
          },
        ]}
      />,
    );

    openMenu(screen.getByRole("button", { name: "Notifications, 2 unread" }));
    expect(
      await screen.findByRole("button", { name: "Mark Jules followed you as read" }),
    ).toBeTruthy();
    expect(
      document.body.querySelector('[data-slot="notification-menu-unread-indicator"]'),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Mark Jules followed you as read" }));

    await waitFor(() =>
      expect(document.body.querySelector('[aria-label="Notifications, 1 unread"]')).toBeTruthy(),
    );
    expect(
      document.body.querySelector('[data-slot="notification-menu-unread-indicator"]'),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: "Mark Jules followed you as read" })).toBeNull();
  });

  test("calls onMarkAllRead when the action is present", async () => {
    const onMarkAllRead = vi.fn();

    render(
      <NotificationMenu
        unreadCount={2}
        items={[{ id: "message", title: "New message", unread: true }]}
        onMarkAllRead={onMarkAllRead}
      />,
    );

    openMenu(screen.getByRole("button", { name: "Notifications, 2 unread" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Mark all read" }));

    await waitFor(() => expect(onMarkAllRead).toHaveBeenCalledTimes(1));
  });

  test("renders empty state when no items are provided", async () => {
    render(<NotificationMenu items={[]} emptyLabel="No updates" />);

    openMenu(screen.getByRole("button", { name: "Notifications" }));

    expect(await screen.findByText("No updates")).toBeTruthy();
  });
});
